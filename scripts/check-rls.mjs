// Determine empirically what the *public* anon key can do against the `cases`
// table. The anon key ships inside the browser bundle, so anything this script
// can do, any visitor to the deployed site can also do.
//
//   node scripts/check-rls.mjs [path-to-env-file]
//
// Exit codes: 0 = protected, 1 = exposed, 2 = could not determine.
//
// READ THIS BEFORE TRUSTING A "PROTECTED" RESULT
// Two PostgREST behaviours make naive probing unreliable, and both fail in the
// dangerous direction (reporting "safe" when the table is wide open):
//
//   1. A project that is still provisioning returns 401 to everything. Treating
//      401 as "blocked" reports a brand-new, unmigrated database as secure.
//      Handled below by requiring a positive readiness signal first.
//
//   2. Under RLS with no policy, SELECT does not fail — it returns 200 with an
//      empty array. "RLS is enforcing" and "the table is empty" are therefore
//      indistinguishable on a read. Only the INSERT probe is conclusive: it
//      returns 403 / Postgres code 42501 when RLS is enforcing.
import { readFileSync } from "node:fs";

function loadEnv(path) {
  const out = {};
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch { /* fall through to process env */ }
  return out;
}

const env = loadEnv(process.argv[2] || ".env.local");
const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("No VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY found.");
  process.exit(2);
}

console.log(`Project host : ${new URL(url).host}`);
console.log(`Anon key     : present (${key.length} chars, not shown)\n`);

const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const rest = (p, init) => fetch(`${url}/rest/v1/${p}`, { ...init, headers: { ...H, ...(init?.headers || {}) } });
const line = (icon, op, msg) => console.log(`[${icon}] ${op.padEnd(24)} ${msg}`);

// ── Classify a response ──────────────────────────────────────────────────
// PostgREST returns HTTP 401 for at least four distinct conditions — project
// still provisioning, anon key rejected, table privileges revoked, and RLS
// policy denial. The status code alone therefore cannot be used to decide
// anything. The Postgres error code in the body can:
//
//   42501  insufficient_privilege  → the database refused us. Conclusive DENY.
//   PGRST301 / JWT / api key msgs  → we never got as far as the table. UNKNOWN.
//
// Every earlier version of this script keyed off the status and got it wrong in
// the dangerous direction at least once.
async function classify(r) {
  let body = null;
  try { body = await r.json(); } catch { /* non-JSON body */ }
  const code = body?.code ?? "";
  const msg = body?.message ?? "";

  if (code === "42501" || /permission denied|row-level security/i.test(msg)) return { kind: "DENIED", msg };
  if (code === "PGRST301" || /JWT|api key|invalid claim/i.test(msg)) return { kind: "UNAUTHENTICATED", msg };
  if (r.ok) return { kind: "ALLOWED", body };
  return { kind: "UNKNOWN", msg: msg || `HTTP ${r.status}` };
}

// ── Probe 1: read ────────────────────────────────────────────────────────
// Conclusive when rows come back (exposed) or the database denies us
// (protected). Zero rows with a 200 is ambiguous — RLS returns an empty array
// rather than an error, so "policy denied" and "table is empty" look identical.
let readOpen = false, readDenied = false;
try {
  const r = await rest("cases?select=id", { headers: { Prefer: "count=exact", Range: "0-4" } });
  const c = await classify(r);
  if (c.kind === "ALLOWED") {
    const rows = c.body ?? [];
    const total = (r.headers.get("content-range") || "").split("/")[1]?.trim();
    if (rows.length) {
      readOpen = true;
      line("!!", "anonymous SELECT", `OPEN — ${rows.length} row(s) readable, ${total || "?"} total`);
    } else {
      line("--", "anonymous SELECT", "0 rows — inconclusive (policy denial, or empty table)");
    }
  } else if (c.kind === "DENIED") {
    readDenied = true;
    line("ok", "anonymous SELECT", `denied by database — ${c.msg}`);
  } else if (c.kind === "UNAUTHENTICATED") {
    line("??", "anonymous SELECT", `key not accepted — ${c.msg}`);
  } else {
    line("??", "anonymous SELECT", c.msg);
  }
} catch (e) {
  line("??", "anonymous SELECT", e.cause?.code === "ENOTFOUND" ? "host does not resolve" : e.message);
}

// ── Probe 2: write ───────────────────────────────────────────────────────
const probeId = `__rls_probe_${Date.now()}`;
let writeOpen = null; // true = open, false = denied, null = undetermined
try {
  const r = await rest("cases", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ id: probeId, data: { probe: true } }),
  });
  const c = await classify(r);
  if (c.kind === "ALLOWED") {
    writeOpen = true;
    line("!!", "anonymous INSERT", "OPEN — a visitor can write rows");
  } else if (c.kind === "DENIED") {
    writeOpen = false;
    line("ok", "anonymous INSERT", `denied by database — ${c.msg}`);
  } else if (c.kind === "UNAUTHENTICATED") {
    line("??", "anonymous INSERT", `key not accepted — ${c.msg}`);
  } else {
    line("??", "anonymous INSERT", c.msg);
  }
} catch (e) {
  line("??", "anonymous INSERT", e.message);
}

// ── Cleanup ──────────────────────────────────────────────────────────────
if (writeOpen === true) {
  try {
    const r = await rest(`cases?id=eq.${probeId}`, { method: "DELETE" });
    line(r.ok ? "ok" : "!!", "cleanup",
      r.ok ? "probe row removed" : `could not delete probe row "${probeId}" — remove it manually`);
  } catch {
    line("!!", "cleanup", `could not delete probe row "${probeId}" — remove it manually`);
  }
}

// ── Verdict ──────────────────────────────────────────────────────────────
// Only the write probe is conclusive in the "protected" direction.
console.log("");
if (readOpen || writeOpen === true) {
  console.log("VERDICT: EXPOSED — the public anon key can access this table.");
  console.log("Every visitor to the deployed site can do the same to all case data.");
  console.log("Fix: run supabase/migrations/0001_cases_rls.sql, then re-run this check.");
  process.exit(1);
} else if (writeOpen === false || readDenied) {
  console.log("VERDICT: PROTECTED — the database refuses the public anon key.");
  console.log("");
  console.log("This is necessary but not sufficient. Access is granted to the");
  console.log("`authenticated` role, so it only holds while public sign-up is OFF:");
  console.log("  Dashboard → Authentication → Sign In / Providers → Email");
  console.log("    • \"Allow new users to sign up\" must be disabled");
  console.log("Otherwise anyone can register and reach all case data legitimately.");
  process.exit(0);
} else {
  console.log("VERDICT: UNDETERMINED — no probe returned a conclusive answer.");
  console.log("This is NOT evidence that the table is protected.");
  process.exit(2);
}
