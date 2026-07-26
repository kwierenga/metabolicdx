see
-- MetabolicDx — lock the `cases` table behind authentication.
--
-- WHY THIS EXISTS
-- The Supabase anon key is compiled into the browser bundle; it is public by
-- definition. Without row-level security, that key is a full read/write
-- credential for every case record, available to anyone who opens the site.
-- This migration makes the anon key useless on its own: all access requires a
-- signed-in user.
--
-- Access model: SHARED TEAM LOGIN. Every authenticated user can read and write
-- every case. This suits a single lab/department sharing a caseload. It does
-- NOT isolate clinicians from each other — see the note at the bottom for the
-- per-user variant.
--
-- Run with:  supabase db push
--        or: paste into the Supabase dashboard SQL editor
--
-- ⚠️ THIS MIGRATION IS NOT SUFFICIENT ON ITS OWN.
-- RLS grants access to the `authenticated` role. If public sign-up is left
-- enabled, anyone can create an account, become `authenticated`, and regain
-- full access to all patient data. You MUST also disable public sign-up:
--   Dashboard → Authentication → Sign In / Providers → Email
--     • "Allow new users to sign up"  →  OFF
-- Then create accounts manually under Authentication → Users.

begin;

-- ── Table ────────────────────────────────────────────────────────────────
-- Matches the key/value shape the app already uses: `id` is a storage key
-- (mdx_cases_v2, mdx_case_<uid>, mdx_training_v1) and `data` is the payload.
create table if not exists public.cases (
  id          text        primary key,
  data        jsonb       not null,
  updated_at  timestamptz not null default now()
);

create index if not exists cases_updated_at_idx on public.cases (updated_at desc);

-- ── Row-level security ───────────────────────────────────────────────────
alter table public.cases enable row level security;

-- Recreate idempotently so re-running this file is safe.
drop policy if exists "authenticated full access" on public.cases;
drop policy if exists "anon no access"            on public.cases;

create policy "authenticated full access"
  on public.cases
  for all
  to authenticated
  using (true)
  with check (true);

-- No policy is created for `anon`. Under RLS, absence of a policy means denial,
-- so the public key cannot read or write anything. The explicit revoke below is
-- belt-and-braces in case RLS is ever disabled by accident.
revoke all on public.cases from anon;
revoke all on public.cases from public;
grant  all on public.cases to   authenticated;

commit;

-- ── Verification ─────────────────────────────────────────────────────────
-- After running this, from the repo root:
--     node scripts/check-rls.mjs .env.local
-- Expected: "VERDICT: RESTRICTED — the anon key cannot read or write."
-- Anything else means the table is still exposed.

-- ── Later: per-user isolation ────────────────────────────────────────────
-- To move from shared access to per-clinician isolation:
--   alter table public.cases add column owner uuid default auth.uid();
--   update public.cases set owner = '<existing-user-uuid>' where owner is null;
--   alter table public.cases alter column owner set not null;
--   drop policy "authenticated full access" on public.cases;
--   create policy "owner only" on public.cases for all to authenticated
--     using (owner = auth.uid()) with check (owner = auth.uid());
-- Note this also requires splitting the shared `mdx_cases_v2` index row, which
-- currently holds the summary of every case globally, into per-user keys.
