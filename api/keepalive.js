// Vercel cron — keeps the free-tier Supabase project from pausing.
//
// Supabase pauses a free project after ~1 week idle. Vercel calls this once a
// day (see "crons" in vercel.json); it reads the one-row `keepalive` table
// (supabase/migrations/0002_keepalive.sql), which counts as database activity.
//
// Env vars (same ones the browser build uses — already set in Vercel):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
//   CRON_SECRET (optional) — if set, Vercel sends it and other callers are refused

export default async function handler(req, res) {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return res.status(500).json({ ok: false, error: "Supabase env vars not set" });
  }

  try {
    const r = await fetch(`${url}/rest/v1/keepalive?select=id&limit=1`, {
      headers: { apikey: key, authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    });
    const body = await r.text();
    if (!r.ok) {
      // A failure shows up in Vercel's logs; a paused project fails here too.
      console.error("keepalive failed", r.status, body.slice(0, 300));
      return res.status(502).json({ ok: false, status: r.status });
    }
    return res.status(200).json({ ok: true, at: new Date().toISOString() });
  } catch (e) {
    console.error("keepalive error", e);
    return res.status(502).json({ ok: false, error: String(e?.message ?? e) });
  }
}
