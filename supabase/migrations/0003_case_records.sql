-- MetabolicDx — one row per case, with history.
--
-- WHY THIS EXISTS
-- The original `cases` table was a key/value store: the WHOLE case list lived
-- in one JSON row (`mdx_cases_v2`) that the app read, modified and rewrote on
-- every save. Two people saving within seconds of each other lost one case
-- from the index — the per-case row survived, orphaned and invisible. Deletes
-- were hard deletes with no record of who or when. And the demo cases were
-- re-inserted on every load whenever one was missing, so they could not be
-- deleted and sat in the same table as real patients.
--
-- This migration gives each case its own row with a version number (so a
-- stale write is refused, never silently applied), soft delete, a seed flag,
-- and a history table that keeps the previous contents of every changed row.
-- Access remains the SHARED TEAM model from 0001: any signed-in user, every
-- case; the public anon key gets nothing.
--
-- Existing cases are copied across. The old `cases` table is LEFT IN PLACE as
-- a backup; drop it once the app has been running on this schema for a while:
--     drop table public.cases;
--
-- Run with:  supabase db push
--        or: paste into the Supabase dashboard SQL editor (Run)
-- Idempotent: safe to run twice.

begin;

-- ── Case records ─────────────────────────────────────────────────────────
create table if not exists public.case_records (
  id               text        primary key,
  label            text,
  summary          jsonb       not null default '{}'::jsonb,  -- list-row fields, derived by the app
  data             jsonb       not null,                      -- the full case
  confirmed_dx_id  text,
  is_seed          boolean     not null default false,
  version          integer     not null default 1,            -- bumped on every write; stale writes are refused
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  updated_by       uuid,
  deleted_at       timestamptz,
  deleted_by       uuid
);

create index if not exists case_records_live_idx
  on public.case_records (created_at desc) where deleted_at is null;
create index if not exists case_records_confirmed_idx
  on public.case_records (confirmed_dx_id) where confirmed_dx_id is not null and deleted_at is null;

-- ── History: the previous contents of every changed row ──────────────────
create table if not exists public.case_history (
  seq         bigserial   primary key,
  case_id     text        not null,
  version     integer     not null,
  op          text        not null,         -- insert | update | delete | restore
  data        jsonb,
  summary     jsonb,
  changed_at  timestamptz not null default now(),
  changed_by  uuid
);
create index if not exists case_history_case_idx on public.case_history (case_id, seq);

-- ── Trigger: stamp, enforce versions, write history ──────────────────────
-- security definer so the history insert works regardless of the caller's
-- own privileges (case_history is read-only for clients).
create or replace function public.case_records_touch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.updated_at := now();
    new.updated_by := auth.uid();
    if new.version is null or new.version < 1 then new.version := 1; end if;
    insert into public.case_history (case_id, version, op, data, summary, changed_by)
      values (new.id, new.version, 'insert', new.data, new.summary, auth.uid());
    return new;
  end if;

  -- UPDATE: the client sends version = old + 1 and filters on the old version
  -- (optimistic concurrency). Refuse anything that does not move the version
  -- forward, so a write based on stale data can never overwrite a newer one.
  if new.version <= old.version then
    raise exception 'case_records: stale write for % (version % is not newer than %)', old.id, new.version, old.version
      using errcode = 'serialization_failure';
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  if new.deleted_at is not null and old.deleted_at is null then new.deleted_by := auth.uid(); end if;
  if new.deleted_at is null then new.deleted_by := null; end if;
  insert into public.case_history (case_id, version, op, data, summary, changed_by)
    values (old.id, old.version,
            case when new.deleted_at is not null and old.deleted_at is null then 'delete'
                 when new.deleted_at is null and old.deleted_at is not null then 'restore'
                 else 'update' end,
            old.data, old.summary, auth.uid());
  return new;
end
$$;

drop trigger if exists case_records_touch on public.case_records;
create trigger case_records_touch
  before insert or update on public.case_records
  for each row execute function public.case_records_touch();

-- ── Row-level security (same shared-team model as 0001) ──────────────────
alter table public.case_records enable row level security;
alter table public.case_history enable row level security;

drop policy if exists "authenticated full access" on public.case_records;
create policy "authenticated full access"
  on public.case_records for all to authenticated
  using (true) with check (true);

drop policy if exists "authenticated read history" on public.case_history;
create policy "authenticated read history"
  on public.case_history for select to authenticated
  using (true);

revoke all on public.case_records from anon, public;
revoke all on public.case_history from anon, public;
grant all on public.case_records to authenticated;
grant select on public.case_history to authenticated;

-- ── Copy existing cases across (once; re-running skips rows already present) ──
insert into public.case_records (id, label, summary, data, confirmed_dx_id, is_seed, created_at, updated_at)
select
  substr(c.id, 10)                                   as id,            -- strip 'mdx_case_'
  c.data->>'label'                                   as label,
  jsonb_build_object(
    'age',           c.data->'age',
    'sex',           c.data->'sex',
    'clinicalNote',  c.data->'clinicalNote',
    'panels',        coalesce(c.data->'panels', '[]'::jsonb),
    'enteredCount',  coalesce(c.data->'enteredCount', '0'::jsonb),
    'abnormalCount', coalesce(c.data->'abnormalCount', '0'::jsonb),
    'topDx',         c.data->'results'->0->'name',
    'confirmedDxId', c.data->'confirmedDxId',
    'modifierCount', case when jsonb_typeof(c.data->'activeModifiers') = 'array'
                          then jsonb_array_length(c.data->'activeModifiers') else 0 end,
    'reportSigned',  coalesce(c.data->'reportSigned', 'false'::jsonb)
  )                                                  as summary,
  c.data                                             as data,
  c.data->>'confirmedDxId'                           as confirmed_dx_id,
  substr(c.id, 10) like 'seed\_case\_%'              as is_seed,
  case when c.data->>'createdAt' ~ '^\d{4}-\d{2}-\d{2}'
       then (c.data->>'createdAt')::timestamptz else c.updated_at end as created_at,
  c.updated_at                                       as updated_at
from public.cases c
where c.id like 'mdx\_case\_%'
on conflict (id) do nothing;

commit;

-- ── Verification ─────────────────────────────────────────────────────────
-- From the repo root:
--     node scripts/check-rls.mjs .env.local
-- Expected: PROTECTED for both tables. Then open the app: the case list should
-- show the same cases as before. The old table is still there if anything is
-- missing:  select count(*) from public.cases where id like 'mdx_case_%';
