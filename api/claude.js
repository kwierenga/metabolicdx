// Vercel serverless function — proxies requests to the Anthropic API.
//
// The API key stays server-side, but that alone is not enough: an open proxy
// lets anyone who finds this URL spend the key. This function is therefore the
// single control point for *what* may be asked of the key:
//
//   1. same-origin only        — no cross-site use of the endpoint
//   2. optional shared secret  — set MDX_API_SECRET to require a header
//   3. per-IP rate limit       — caps burst abuse
//   4. task allowlist          — the client names a task; the proxy picks the
//                                model. A caller cannot select a model.
//   5. hard max_tokens ceiling — caps cost per request
//   6. field whitelist         — only known fields reach the upstream API
//
// Env vars:
//   ANTHROPIC_API_KEY      (required)
//   MDX_API_SECRET         (optional) — if set, requests must send x-mdx-key
//   MDX_ALLOWED_ORIGINS    (optional) — extra comma-separated hostnames

const MODEL = "claude-opus-5";

// Per-task limits. The client sends `task`; the model is never client-selected.
const TASKS = {
  extract:   { maxTokens: 8000 },
  narrative: { maxTokens: 8000 },
};

const HARD_MAX_TOKENS = 16000;
const MAX_BODY_BYTES = 4_000_000; // Vercel's own body cap is ~4.5MB
const MAX_SYSTEM_CHARS = 40_000;
const MAX_SCHEMA_CHARS = 60_000; // the extraction schema enumerates ~134 analyte ids
const MAX_MESSAGES = 8;
const MAX_CONTENT_BLOCKS = 12;
const VALID_EFFORT = new Set(["low", "medium", "high"]);
const UPSTREAM_TIMEOUT_MS = 120_000;

// Rate limit: in-memory, so it is per serverless instance rather than global.
// It blunts casual abuse; for a hard guarantee move this to Vercel KV/Upstash.
const RATE_LIMIT = { windowMs: 60_000, max: 15 };
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT.windowMs;
  if (hits.size > 5000) hits.clear(); // crude bound on memory growth
  const recent = (hits.get(ip) || []).filter((t) => t > cutoff);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT.max;
}

function allowedHosts(req) {
  const hosts = new Set(["localhost", "127.0.0.1"]);
  for (const v of [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL]) {
    if (v) hosts.add(v.replace(/^https?:\/\//, "").split("/")[0]);
  }
  if (req.headers.host) hosts.add(req.headers.host.split(":")[0]);
  for (const h of (process.env.MDX_ALLOWED_ORIGINS || "").split(",")) {
    const t = h.trim();
    if (t) hosts.add(t.replace(/^https?:\/\//, "").split("/")[0]);
  }
  return hosts;
}

function sameOrigin(req) {
  const source = req.headers.origin || req.headers.referer;
  if (!source) return false; // browsers always send one of these on fetch()
  let host;
  try {
    host = new URL(source).hostname;
  } catch {
    return false;
  }
  return allowedHosts(req).has(host);
}

// Rebuild the upstream body from known fields only — never forward req.body.
// Exported for tests: the security properties (model is not client-selectable,
// max_tokens is capped) are asserted in src/__tests__/proxy.test.js.
export function buildUpstreamBody(body) {
  const task = TASKS[body?.task];
  if (!task) return { error: "Unknown task." };

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) return { error: "No messages provided." };
  if (messages.length > MAX_MESSAGES) return { error: "Too many messages." };
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) return { error: "Invalid message role." };
    if (Array.isArray(m.content) && m.content.length > MAX_CONTENT_BLOCKS)
      return { error: "Too many content blocks." };
    if (typeof m.content !== "string" && !Array.isArray(m.content))
      return { error: "Invalid message content." };
  }

  const requested = Number(body.max_tokens) || task.maxTokens;
  const maxTokens = Math.min(requested, task.maxTokens, HARD_MAX_TOKENS);

  const out = {
    model: MODEL,
    max_tokens: maxTokens,
    messages,
    output_config: { effort: VALID_EFFORT.has(body.effort) ? body.effort : "low" },
  };
  if (typeof body.system === "string" && body.system) {
    if (body.system.length > MAX_SYSTEM_CHARS) return { error: "System prompt too large." };
    out.system = body.system;
  }
  // Optional structured-output schema. Bounded by size so a caller cannot use
  // schema compilation as an amplification vector; shape is otherwise the
  // caller's business since it constrains output rather than cost.
  if (body.format != null) {
    const f = body.format;
    if (typeof f !== "object" || f.type !== "json_schema" || typeof f.schema !== "object" || !f.schema)
      return { error: "Invalid output format." };
    if (JSON.stringify(f.schema).length > MAX_SCHEMA_CHARS)
      return { error: "Output schema too large." };
    out.output_config.format = { type: "json_schema", schema: f.schema };
  }
  return { body: out };
}

async function callUpstream(payload, extraHeaders) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    return await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        ...extraHeaders,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: { message: "Server is missing ANTHROPIC_API_KEY." } });
  }
  if (!sameOrigin(req)) {
    return res.status(403).json({ error: { message: "Forbidden." } });
  }
  if (process.env.MDX_API_SECRET && req.headers["x-mdx-key"] !== process.env.MDX_API_SECRET) {
    return res.status(403).json({ error: { message: "Forbidden." } });
  }

  const declared = Number(req.headers["content-length"] || 0);
  if (declared > MAX_BODY_BYTES) {
    return res.status(413).json({ error: { message: "Request too large." } });
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: { message: "Rate limit exceeded. Try again shortly." } });
  }

  const built = buildUpstreamBody(req.body);
  if (built.error) {
    return res.status(400).json({ error: { message: built.error } });
  }

  try {
    // Ask the API to re-run a policy-declined request on a fallback model.
    // If this deployment's account does not have the beta, retry plainly so a
    // beta rollout can never take the app's AI features offline.
    const withFallback = { ...built.body, fallbacks: "default" };
    let upstream = await callUpstream(withFallback, {
      "anthropic-beta": "server-side-fallback-2026-07-01",
    });
    if (upstream.status === 400) {
      const probe = await upstream.clone().json().catch(() => null);
      const msg = probe?.error?.message || "";
      if (/fallback|beta/i.test(msg)) {
        upstream = await callUpstream(built.body, {});
      }
    }

    const data = await upstream.json();
    if (!upstream.ok) {
      // Pass through the status and a message, not the full upstream payload.
      const message =
        upstream.status === 429
          ? "The analysis service is rate limited. Try again shortly."
          : data?.error?.message || "Analysis service error.";
      return res.status(upstream.status).json({ error: { message } });
    }
    return res.status(200).json(data);
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({ error: { message: "Analysis service timed out." } });
    }
    console.error("claude proxy error:", error);
    return res.status(502).json({ error: { message: "Could not reach the analysis service." } });
  }
}
