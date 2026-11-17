// Security-property tests for the /api/claude proxy body builder.
//
// The proxy is the only thing standing between a public URL and the
// ANTHROPIC_API_KEY. These assertions pin the two properties that matter most:
// a caller cannot choose the model, and a caller cannot raise the token
// ceiling. Both are silent failures if they regress — the app keeps working,
// it just becomes an open, unbounded proxy again.
import { describe, it, expect } from "vitest";
import { buildUpstreamBody } from "../../api/claude.js";

const ok = (over = {}) => ({
  task: "extract",
  messages: [{ role: "user", content: "hello" }],
  ...over,
});

describe("proxy body builder — model is server-controlled", () => {
  it("ignores a client-supplied model", () => {
    const { body } = buildUpstreamBody(ok({ model: "some-other-model" }));
    expect(body.model).toBe("claude-opus-5");
  });

  it("rejects an unknown task", () => {
    expect(buildUpstreamBody(ok({ task: "arbitrary" })).error).toBeTruthy();
    expect(buildUpstreamBody(ok({ task: undefined })).error).toBeTruthy();
  });
});

describe("proxy body builder — cost ceilings hold", () => {
  it("caps max_tokens at the task limit", () => {
    const { body } = buildUpstreamBody(ok({ max_tokens: 999999 }));
    expect(body.max_tokens).toBeLessThanOrEqual(8000);
  });

  it("honours a smaller client request", () => {
    const { body } = buildUpstreamBody(ok({ max_tokens: 500 }));
    expect(body.max_tokens).toBe(500);
  });

  it("falls back to the task default when max_tokens is absent or junk", () => {
    expect(buildUpstreamBody(ok()).body.max_tokens).toBe(8000);
    expect(buildUpstreamBody(ok({ max_tokens: "lots" })).body.max_tokens).toBe(8000);
  });
});

describe("proxy body builder — only whitelisted fields are forwarded", () => {
  it("drops unknown fields", () => {
    const { body } = buildUpstreamBody(
      ok({ tools: [{ name: "x" }], metadata: { user_id: "y" }, container: "z" }),
    );
    expect(Object.keys(body).sort()).toEqual(
      ["max_tokens", "messages", "model", "output_config"].sort(),
    );
  });

  it("forwards a valid json_schema format but rejects malformed or oversized ones", () => {
    const schema = { type: "object", properties: {}, additionalProperties: false };
    const { body } = buildUpstreamBody(ok({ format: { type: "json_schema", schema } }));
    expect(body.output_config.format).toEqual({ type: "json_schema", schema });

    expect(buildUpstreamBody(ok({ format: { type: "regex", schema } })).error).toBeTruthy();
    expect(buildUpstreamBody(ok({ format: { type: "json_schema" } })).error).toBeTruthy();
    expect(buildUpstreamBody(ok({ format: "json" })).error).toBeTruthy();

    const huge = { type: "object", pad: "x".repeat(60_001) };
    expect(buildUpstreamBody(ok({ format: { type: "json_schema", schema: huge } })).error).toBeTruthy();
  });

  it("clamps effort to a known level", () => {
    expect(buildUpstreamBody(ok({ effort: "max" })).body.output_config.effort).toBe("low");
    expect(buildUpstreamBody(ok({ effort: "medium" })).body.output_config.effort).toBe("medium");
  });
});

describe("proxy body builder — input validation", () => {
  it("rejects missing, empty or malformed messages", () => {
    expect(buildUpstreamBody({ task: "extract" }).error).toBeTruthy();
    expect(buildUpstreamBody(ok({ messages: [] })).error).toBeTruthy();
    expect(buildUpstreamBody(ok({ messages: [{ role: "system", content: "x" }] })).error).toBeTruthy();
    expect(buildUpstreamBody(ok({ messages: [{ role: "user", content: 42 }] })).error).toBeTruthy();
  });

  it("rejects oversized system prompts and message floods", () => {
    expect(buildUpstreamBody(ok({ system: "x".repeat(40_001) })).error).toBeTruthy();
    const flood = Array.from({ length: 9 }, () => ({ role: "user", content: "x" }));
    expect(buildUpstreamBody(ok({ messages: flood })).error).toBeTruthy();
  });

  it("passes a valid system prompt through", () => {
    const { body } = buildUpstreamBody(ok({ system: "You are an extractor." }));
    expect(body.system).toBe("You are an extractor.");
  });
});

// ── Caller authentication ──────────────────────────────────────────────────
// The Origin check is browser-only; this is the gate that actually holds.
import { verifyBearer } from "../../api/claude.js";

const ENV = { VITE_SUPABASE_URL: "https://proj.supabase.co", VITE_SUPABASE_ANON_KEY: "anon-key" };
const okFetch = (body) => async () => ({ ok: true, json: async () => body });
const failFetch = (status) => async () => ({ ok: false, status, json: async () => ({ message: "bad" }) });

describe("proxy caller authentication", () => {
  it("is skipped only when no Supabase project is configured (memory-mode demo)", async () => {
    expect(await verifyBearer(undefined, {}, okFetch({}))).toEqual({ skipped: true });
  });

  it("refuses a request with no Bearer token", async () => {
    const r = await verifyBearer(undefined, ENV, okFetch({ id: "u1" }));
    expect(r.error).toBeTruthy(); expect(r.status).toBe(401);
  });

  it("refuses the public anon key used as if it were a session", async () => {
    const r = await verifyBearer("Bearer anon-key", ENV, okFetch({ id: "u1" }));
    expect(r.error).toBeTruthy();
  });

  it("asks Supabase Auth and accepts a user it recognises", async () => {
    const calls = [];
    const fetchImpl = async (url, init) => { calls.push({ url, init }); return { ok: true, json: async () => ({ id: "user-123", email: "a@b.c" }) }; };
    const r = await verifyBearer("Bearer tok.en", ENV, fetchImpl);
    expect(r.user).toEqual({ id: "user-123", email: "a@b.c" });
    expect(calls[0].url).toBe("https://proj.supabase.co/auth/v1/user");
    expect(calls[0].init.headers.apikey).toBe("anon-key");
    expect(calls[0].init.headers.authorization).toBe("Bearer tok.en");
  });

  it("refuses an expired or forged token", async () => {
    const r = await verifyBearer("Bearer forged", ENV, failFetch(401));
    expect(r.error).toMatch(/sign in/i); expect(r.status).toBe(401);
  });

  it("refuses a 200 that carries no user id", async () => {
    expect((await verifyBearer("Bearer x", ENV, okFetch({}))).error).toBeTruthy();
  });

  it("reports a verification outage as 503, not as an open door", async () => {
    const r = await verifyBearer("Bearer x", ENV, async () => { throw new Error("ECONNRESET"); });
    expect(r.error).toBeTruthy(); expect(r.status).toBe(503);
  });
});
