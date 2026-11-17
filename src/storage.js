// ─── STORAGE ─────────────────────────────────────────────────
// One row per case in `case_records` (supabase/migrations/0003_case_records.sql).
//
// What changed on 2026-11-13 and why. The previous layer kept the whole case
// list in one JSON row and rewrote it on every save, so two colleagues saving
// together lost a case from the index; deletes were permanent and unrecorded;
// and the demo cases came back on every load. Now:
//
//   • each case is a row with a `version`. A save sends version+1 and filters
//     on the version it loaded; if someone else saved first, zero rows match
//     and a StorageConflictError is raised instead of overwriting their work.
//     The database trigger refuses non-advancing versions as well.
//   • delete is `deleted_at = now()`. Deleted cases are listed separately and
//     can be restored. Every change is kept in `case_history`.
//   • seeds carry `is_seed` and are inserted exactly once, when the table has
//     never held anything.
//   • the training set is DERIVED: a case with confirmed_dx_id is a training
//     example. There is no separate list to keep in sync.
//
// Without Supabase credentials (STORAGE_MODE "memory") the same API runs on an
// in-memory map so the demo works; nothing persists.
import { supabase } from "./lib/supabase.js";
import { DISORDER_MAP } from "./analytes.js";
import { KB_VERSION, KB_DATE, KB_HASH } from "./disorders.js";
import { ENGINE_VERSION, ENGINE_HASH } from "./scoring.js";

const TABLE = "case_records";

export class StorageConflictError extends Error {
  constructor(msg = "This case was changed by someone else since you opened it. Reload it, then re-apply your edits.") {
    super(msg); this.name = "StorageConflictError";
  }
}
export class StorageNotMigratedError extends Error {
  constructor() {
    super("Storage migration 0003 has not been applied: table case_records does not exist. Run supabase/migrations/0003_case_records.sql in the Supabase SQL editor.");
    this.name = "StorageNotMigratedError";
  }
}

function translate(error, ctx = "") {
  if (!error) return null;
  if (error.code === "42P01" || /relation .*case_records.* does not exist/i.test(error.message || ""))
    return new StorageNotMigratedError();
  if (error.code === "40001" || /stale write/i.test(error.message || "")) return new StorageConflictError();
  return new Error(`${ctx ? ctx + ": " : ""}${error.message}`);
}

/** The stamp recorded on a case when it is analysed. */
export function currentStamp() {
  return { kbVersion: KB_VERSION, kbDate: KB_DATE, kbHash: KB_HASH, engineVersion: ENGINE_VERSION, engineHash: ENGINE_HASH, at: new Date().toISOString() };
}
/** True when `scoredWith` (as stored on a case) differs from the running build. */
export function isStale(scoredWith) {
  if (!scoredWith) return true;
  return scoredWith.kbHash !== KB_HASH || scoredWith.engineHash !== ENGINE_HASH;
}

// ── Shaping ──────────────────────────────────────────────────
// Results carry the full disorder object (narrative, notes…). Strip to what
// the list and the Trends tab need; hydrateResults puts the rest back.
export function stripResultsForStorage(results) {
  if (!results) return null;
  return results.map((r) => ({
    id: r.id, name: r.name, category: r.category, gene: r.gene,
    score: r.score, rawScore: r.rawScore, relativePct: r.relativePct,
    intraCoverage: r.intraCoverage,
    leadRatio: r.leadRatio ?? null, rivalId: r.rivalId ?? null, coDifferential: r.coDifferential ?? false,
    familyPeers: r.familyPeers ?? [],
    supporting: r.supporting?.map((s) => ({ id: s.id, panel: s.panel, direction: s.direction,
      val: s.val, matchScore: s.matchScore, xLimit: s.xLimit, effectiveWeight: s.effectiveWeight })),
    missing: r.missing?.map((s) => ({ id: s.id, panel: s.panel })),
    notRun: r.notRun?.map((s) => ({ id: s.id, panel: s.panel })),
    warnings: r.warnings,
  }));
}
export function hydrateResults(stripped) {
  if (!stripped) return null;
  return stripped.map((r) => { const d = DISORDER_MAP[r.id]; return d ? { ...d, ...r } : r; });
}

/** The list-row fields, computed from a full case. */
export function summarize(c) {
  return {
    age: c.age ?? null, sex: c.sex ?? null, clinicalNote: c.clinicalNote ?? null,
    panels: c.panels ?? [], enteredCount: c.enteredCount ?? 0, abnormalCount: c.abnormalCount ?? 0,
    topDx: c.results?.[0]?.name ?? null, confirmedDxId: c.confirmedDxId ?? null,
    modifierCount: (c.activeModifiers || []).length, reportSigned: c.reportSigned ?? false,
    scoredWith: c.scoredWith ?? null,
  };
}

function rowToListItem(r) {
  return { id: r.id, label: r.label ?? "", ...(r.summary || {}), createdAt: r.created_at, updatedAt: r.updated_at,
    version: r.version, isSeed: !!r.is_seed, deletedAt: r.deleted_at ?? null, confirmedDxId: r.confirmed_dx_id ?? r.summary?.confirmedDxId ?? null };
}
function rowToCase(r) {
  const c = r.data || {};
  return { ...c, id: r.id, label: r.label ?? c.label ?? "", createdAt: c.createdAt ?? r.created_at,
    version: r.version, isSeed: !!r.is_seed, deletedAt: r.deleted_at ?? null, results: hydrateResults(c.results) };
}

// ── In-memory fallback ───────────────────────────────────────
const mem = new Map();
const memApi = {
  async list(deleted) {
    return [...mem.values()].filter((r) => (deleted ? r.deleted_at : !r.deleted_at))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(rowToListItem);
  },
  async get(id) { const r = mem.get(id); return r ? rowToCase(r) : null; },
  async insert(row) {
    if (mem.has(row.id)) throw new StorageConflictError("A case with this id already exists.");
    const now = new Date().toISOString();
    mem.set(row.id, { ...row, version: 1, created_at: row.created_at ?? now, updated_at: now, deleted_at: null });
    return 1;
  },
  async update(id, expectVersion, patch) {
    const r = mem.get(id);
    if (!r || r.version !== expectVersion) throw new StorageConflictError();
    mem.set(id, { ...r, ...patch, version: expectVersion + 1, updated_at: new Date().toISOString() });
    return expectVersion + 1;
  },
  async countAll() { return mem.size; },
  async training() {
    return [...mem.values()].filter((r) => r.confirmed_dx_id && !r.deleted_at)
      .map((r) => ({ caseId: r.id, confirmedDxId: r.confirmed_dx_id, values: r.data?.values, confirmedAt: r.updated_at }));
  },
};

// ── Supabase ─────────────────────────────────────────────────
const LIST_COLS = "id,label,summary,confirmed_dx_id,is_seed,version,created_at,updated_at,deleted_at";
const sbApi = {
  async list(deleted) {
    let q = supabase.from(TABLE).select(LIST_COLS).order("created_at", { ascending: false });
    q = deleted ? q.not("deleted_at", "is", null) : q.is("deleted_at", null);
    const { data, error } = await q;
    if (error) throw translate(error, "Loading cases");
    return (data || []).map(rowToListItem);
  },
  async get(id) {
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) throw translate(error, "Loading case");
    return data ? rowToCase(data) : null;
  },
  async insert(row) {
    const { data, error } = await supabase.from(TABLE).insert({ ...row, version: 1 }).select("version").single();
    if (error) {
      if (error.code === "23505") throw new StorageConflictError("A case with this id already exists.");
      throw translate(error, "Saving case");
    }
    return data.version;
  },
  async update(id, expectVersion, patch) {
    const { data, error } = await supabase.from(TABLE).update({ ...patch, version: expectVersion + 1 })
      .eq("id", id).eq("version", expectVersion).select("version");
    if (error) throw translate(error, "Saving case");
    if (!data || data.length === 0) throw new StorageConflictError();
    return data[0].version;
  },
  async countAll() {
    const { count, error } = await supabase.from(TABLE).select("id", { count: "exact", head: true });
    if (error) throw translate(error, "Counting cases");
    return count ?? 0;
  },
  async training() {
    const { data, error } = await supabase.from(TABLE).select("id,confirmed_dx_id,updated_at,values:data->values")
      .not("confirmed_dx_id", "is", null).is("deleted_at", null);
    if (error) throw translate(error, "Loading training set");
    return (data || []).map((r) => ({ caseId: r.id, confirmedDxId: r.confirmed_dx_id, values: r.values, confirmedAt: r.updated_at }));
  },
};

const api = () => (supabase ? sbApi : memApi);

// ── Public API ───────────────────────────────────────────────
/** Live (non-deleted) cases, newest first, as list rows. Throws on a storage failure. */
export const loadList = () => api().list(false);
/** Soft-deleted cases, newest first. */
export const loadDeleted = () => api().list(true);
/** One full case, hydrated; null when absent. Throws on a storage failure. */
export const loadFullCase = (id) => api().get(id);
/** Training examples derived from confirmed cases. */
export const loadTraining = () => api().training();

function toRow(c) {
  // Row-level bookkeeping lives in columns, not in the JSON payload.
  const { version: _v, isSeed: _s, deletedAt: _d, ...payload } = c;
  return {
    id: c.id, label: c.label || "Untitled",
    summary: summarize(c),
    data: { ...payload, results: stripResultsForStorage(c.results) },
    confirmed_dx_id: c.confirmedDxId ?? null,
  };
}

/**
 * Save a case. `c.version` is the version it was loaded with (absent for a new
 * case). Returns the new version. Throws StorageConflictError if someone else
 * saved it first.
 */
export async function saveCase(c, { isSeed = false } = {}) {
  const row = toRow(c);
  if (c.version == null) return api().insert({ ...row, is_seed: isSeed, created_at: c.createdAt });
  return api().update(c.id, c.version, row);
}
/** Soft delete. Needs the version the row was listed with. */
export async function deleteCase(id, version) {
  return api().update(id, version, { deleted_at: new Date().toISOString() });
}
/** Undo a soft delete. */
export async function restoreCase(id, version) {
  return api().update(id, version, { deleted_at: null });
}

/** Insert the demo cases once, only if the table has never held anything (deleted rows count). */
export async function seedOnce(seeds) {
  const n = await api().countAll();
  if (n > 0) return 0;
  let inserted = 0;
  for (const s of seeds) {
    try { await saveCase({ ...s, version: undefined }, { isSeed: true }); inserted++; }
    catch (e) { if (!(e instanceof StorageConflictError)) throw e; }
  }
  return inserted;
}
