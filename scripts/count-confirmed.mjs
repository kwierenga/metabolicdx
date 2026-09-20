// How many confirmed cases are there, and how many disorders have enough?
//
// Why this exists. calibrate-scores.mjs measures the engine against profiles
// built from each disorder's own signature, and says so in its own header: that
// is internal discrimination, not calibration. Real calibration needs confirmed
// cases, including cases where the disorder was ABSENT, and nothing in the
// repository knows how many of those exist — they live in the cases table.
//
// computeLearnedWeights() needs at least 2 confirmed cases of a disorder before
// it adjusts anything for it (nPos < 2 falls back to the prior weight), so the
// number that matters is not the case count but how many disorders clear 2.
//
//   node scripts/count-confirmed.mjs [path-to-env-file] [email]
//
// It prints counts and nothing else: no patient values, no names, no free text,
// no case ids. A disorder tally is the same aggregate the Model view already
// shows in the app.
//
// RLS requires an authenticated user, so this asks for a password on stdin
// rather than taking one on the command line, where it would land in shell
// history. If the project has been idle it may be paused — a paused Supabase
// project returns NXDOMAIN, which looks exactly like a deleted one. Restore it
// from the dashboard; the ref, key and data survive.
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";

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
const email = process.argv[3] || process.env.METABOLICDX_EMAIL;

if (!url || !key) {
  console.error("no VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY found");
  console.error("usage: node scripts/count-confirmed.mjs [.env.local] [email]");
  process.exit(2);
}
if (!email) {
  console.error("an account email is needed: node scripts/count-confirmed.mjs .env.local you@example.com");
  process.exit(2);
}

const ask = (q) => new Promise((res) => {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  rl.question(q, (a) => { rl.close(); res(a); });
});

const password = process.env.METABOLICDX_PASSWORD || await ask(`password for ${email}: `);

const auth = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: key, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!auth.ok) {
  console.error(`sign-in failed (${auth.status}). If this says "not recognised", check the account`);
  console.error(`exists in the dashboard with "Auto Confirm User" ticked.`);
  process.exit(1);
}
const { access_token } = await auth.json();

// A case is one JSON blob in `data`, holding the panel values, the narrative,
// the reviewer and the patient's identifiers. Selecting `data` would pull all of
// that across the wire to count a single field, so the confirmed diagnosis is
// extracted server-side with a JSON path and nothing else is requested.
const res = await fetch(`${url}/rest/v1/cases?select=dx:data->>confirmedDxId`, {
  headers: { apikey: key, Authorization: `Bearer ${access_token}` },
});
if (!res.ok) { console.error(`read failed (${res.status})`); process.exit(1); }
const rows = await res.json();

const confirmed = rows.filter((r) => r.dx);
const byDx = {};
for (const r of confirmed) byDx[r.dx] = (byDx[r.dx] ?? 0) + 1;
const tally = Object.entries(byDx).sort((a, b) => b[1] - a[1]);
const trainable = tally.filter(([, n]) => n >= 2);

console.log(`cases stored          : ${rows.length}`);
console.log(`with a confirmed dx   : ${confirmed.length}`);
console.log(`distinct disorders    : ${tally.length}`);
console.log(`disorders with >= 2   : ${trainable.length}  (the threshold computeLearnedWeights needs)`);
if (tally.length) {
  console.log(`\ncases per disorder:`);
  for (const [dx, n] of tally) console.log(`  ${String(n).padStart(3)}  ${dx}`);
}
console.log(`\nNote: none of these are negatives. A precision or calibration figure needs`);
console.log(`cases where the disorder was ruled OUT, which this table does not record.`);
