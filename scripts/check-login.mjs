// Diagnose a failing sign-in by asking Supabase directly.
//
//   node scripts/check-login.mjs you@example.com
//
// The password is read from stdin, so it does not appear in your shell history
// or process list. The script prints Supabase's exact error, which the app
// deliberately does not show: on the sign-in screen "wrong password" and "user
// does not exist" are collapsed into one message so the form cannot be used to
// discover which accounts exist.
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const env = {};
try {
  for (const l of readFileSync(process.argv[3] || ".env.local", "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch { /* fall through */ }

const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
const email = process.argv[2];

if (!url || !key) { console.error("Missing Supabase URL/anon key."); process.exit(2); }
if (!email) { console.error("Usage: node scripts/check-login.mjs you@example.com"); process.exit(2); }

const rl = createInterface({ input: process.stdin, output: process.stdout });
const password = await rl.question("Password (typing is visible): ");
rl.close();

const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: key, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const body = await r.json().catch(() => ({}));

console.log(`\nHTTP ${r.status}`);

if (r.ok && body.access_token) {
  console.log("SIGN-IN SUCCEEDED.");
  console.log(`  user id       : ${body.user?.id}`);
  console.log(`  email         : ${body.user?.email}`);
  console.log(`  confirmed at  : ${body.user?.email_confirmed_at ?? "NOT CONFIRMED"}`);
  console.log("\nCredentials are correct — if the app still rejects them, the app is");
  console.log("pointed at a different project than .env.local. Check the browser console.");
  process.exit(0);
}

const code = body.error_code || body.error || "";
const msg = body.msg || body.error_description || body.message || JSON.stringify(body);
console.log(`error_code : ${code}`);
console.log(`message    : ${msg}`);

const hint = {
  email_not_confirmed:
    "The user exists but is unconfirmed. Dashboard → Authentication → Users →\n" +
    "  click the user → confirm them; or delete and recreate with 'Auto Confirm User' ticked.",
  invalid_credentials:
    "Wrong password, or no user with that email. Supabase returns the same error for\n" +
    "  both on purpose. Check the exact address in Authentication → Users, and reset the\n" +
    "  password there if unsure — it cannot be read back, only replaced.",
  validation_failed:
    "The request was malformed — usually an empty email or password.",
  signup_disabled:
    "Sign-ups are disabled (correct) — but this is a SIGN-IN, so the account simply\n" +
    "  does not exist yet. Create it in Authentication → Users → Add user.",
}[code];

console.log(`\n${hint ?? "Unrecognised error — paste this output for further diagnosis."}`);
process.exit(1);
