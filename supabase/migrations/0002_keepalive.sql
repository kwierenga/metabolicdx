-- MetabolicDx — a one-row table the daily keep-alive ping can read.
--
-- WHY THIS EXISTS
-- Supabase's free tier pauses a project after ~1 week without activity, and a
-- paused project looks exactly like a deleted one (NXDOMAIN). api/keepalive.js
-- runs once a day from a Vercel cron and reads this table, so the project never
-- goes idle.
--
-- The ping uses the public anon key, which (by design, see 0001) can read
-- nothing in `cases`. This table holds no data at all — one row with a fixed
-- id — so letting anon read it exposes nothing.
--
-- Run with:  supabase db push
--        or: paste into the Supabase dashboard SQL editor

begin;

create table if not exists public.keepalive (
  id  int primary key
);

insert into public.keepalive (id) values (1) on conflict do nothing;

alter table public.keepalive enable row level security;

revoke all on public.keepalive from anon, authenticated;
grant select on public.keepalive to anon;

drop policy if exists keepalive_read on public.keepalive;
create policy keepalive_read on public.keepalive
  for select to anon using (true);

commit;
