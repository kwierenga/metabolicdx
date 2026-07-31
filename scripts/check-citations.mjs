// Resolve every knowledge-base citation against PubMed.
//
// Why this exists: the disorder narratives carry ~1,000 unique citations, almost
// none with an identifier, and the corpus was largely bulk-generated. An audit of
// the scoring layer in July 2026 found three citations that do not exist at all
// and several more that name a real paper about a different subject. This script
// makes that class of defect measurable across the whole knowledge base instead
// of one spot-check at a time.
//
//   node scripts/check-citations.mjs              # resolve everything (cached)
//   node scripts/check-citations.mjs --limit 50   # short run
//   node scripts/check-citations.mjs --report     # re-print from cache, no network
//   node scripts/check-citations.mjs --skip-ecitmatch   # title search only
//   node scripts/check-citations.mjs --recheck NOT_FOUND   # re-resolve one verdict class
//
// Two phases, because NCBI answers slowly from here (7-25s per call):
//
//   1. ecitmatch — one request per 25 citations, keyed on
//      journal|year|volume|first_page|author. Cheap, and a hit proves the
//      *bibliographic coordinates* point at a real paper.
//   2. Per-citation esummary/esearch — confirms the cited *title* actually
//      matches the paper those coordinates landed on, and title-searches
//      whatever phase 1 could not key (no volume, no page, books, guidelines).
//
// Phase 1 alone is not enough: the failure mode we are hunting is a citation
// whose coordinates resolve but whose title describes a different paper.
//
// Both phases cache to disk (.ecitmatch-cache.json, .citation-cache.json) so
// re-runs are free and an interrupted pass resumes where it stopped.
//
// It classifies rather than deletes. A NOT_FOUND is a lead to investigate by
// hand, not proof of fabrication: PubMed does not index every book chapter,
// GeneReviews entry or national guideline the narratives legitimately cite.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectCitations, dedupe, ecitmatchBatches, ecitQuery, ecitEligible, cacheKey } from "./parse-citations.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = resolve(HERE, ".citation-cache.json");
const ECIT_CACHE = resolve(HERE, ".ecitmatch-cache.json");
const LEGACY_RESULTS = resolve(HERE, ".ecitmatch", "results.txt");
const OUT = resolve(HERE, "citation-report.json");
const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const API_KEY = process.env.NCBI_API_KEY || null;      // 10 req/s if set, else 3
const GAP_MS = API_KEY ? 110 : 350;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set("the a an of and or in on for to with without by from is are as at its their new".split(" "));
const tokens = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w)));

/** Dice coefficient over content words — robust to the corpus's paraphrased titles. */
function similarity(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return (2 * shared) / (A.size + B.size);
}

/**
 * Shared request gate.
 *
 * NCBI permits 3 requests/second without an API key, but a round trip from here
 * takes 8-25 seconds. Issued strictly one at a time the run is latency-bound and
 * takes hours; the rate limit is nowhere near the binding constraint. So allow a
 * few requests in flight at once while still spacing their *starts* GAP_MS apart,
 * which is what the published limit actually governs.
 */
const MAX_INFLIGHT = API_KEY ? 8 : 3;
let inflight = 0;
let nextSlot = 0;
async function acquire() {
  while (inflight >= MAX_INFLIGHT) await sleep(40);
  inflight++;
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + GAP_MS;
  if (slot > now) await sleep(slot - now);
}
const release = () => { inflight--; };

async function eutils(path, params) {
  const qs = new URLSearchParams({ ...params, retmode: "json", tool: "metabolicdx", email: "klaaswierenga@gmail.com" });
  if (API_KEY) qs.set("api_key", API_KEY);
  for (let attempt = 0; attempt < 4; attempt++) {
    await acquire();
    try {
      const r = await fetch(`${EUTILS}/${path}?${qs}`);
      if (r.status === 429 || r.status >= 500) { await sleep(1200 * (attempt + 1)); continue; }
      if (!r.ok) return null;
      return await r.json();
    } catch { await sleep(900 * (attempt + 1)); }
    finally { release(); }
  }
  return null;
}

/** Run `worker` over `items` with at most `n` in flight, preserving order. */
async function pool(items, worker, n) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    for (let k = next++; k < items.length; k = next++) out[k] = await worker(items[k], k);
  }));
  return out;
}

/**
 * A request that never got an answer, as distinct from an answer with no hits.
 *
 * Collapsing those two is how a dropped connection becomes a permanent verdict
 * of "PubMed has no paper with these details" — which this file reports, and the
 * UI renders, as a fabricated reference. NCBI answers slowly and not always from
 * here, so this is a live failure mode, not a theoretical one. Anything derived
 * from a failed request is left uncached and retried on the next run.
 */
const FAILED = Symbol("request failed");

const esearch = async (term, retmax = 5) => {
  const j = await eutils("esearch.fcgi", { db: "pubmed", term, retmax: String(retmax) });
  return j ? (j.esearchresult?.idlist ?? []) : FAILED;
};

async function esummary(ids) {
  if (!ids.length) return [];
  const j = await eutils("esummary.fcgi", { db: "pubmed", id: ids.join(",") });
  const r = j?.result;
  if (!r) return FAILED;
  return (r.uids ?? []).map((u) => ({
    pmid: u,
    title: r[u]?.title ?? "",
    journal: r[u]?.source ?? "",
    year: parseInt(String(r[u]?.pubdate ?? "").match(/\d{4}/)?.[0] ?? "0", 10),
    authors: (r[u]?.authors ?? []).map((a) => a.name).join(", "),
  }));
}

// ── phase 1: ecitmatch ──────────────────────────────────────────────────────
const ecitCache = existsSync(ECIT_CACHE) ? JSON.parse(readFileSync(ECIT_CACHE, "utf8")) : {};

/**
 * ecitmatch echoes each query line with a PMID (or NOT_FOUND) appended — but it
 * blanks the author field when the author does not match the paper sitting at
 * those coordinates. So a returned PMID with a blank author echo means it keyed
 * on journal/year/volume/page alone, which is a weaker claim. Worth recording:
 * a wrong author on a real paper is exactly the shape of a bulk-generated
 * citation that was never checked.
 */
function parseEcitLine(line) {
  const f = line.split("|");
  if (f.length < 7) return null;
  const pmid = f[6].trim();
  return { key: f[5].trim(), coords: f.slice(0, 4).join("|"), authorMatched: !!f[4].trim(), pmid: /^\d+$/.test(pmid) ? pmid : null };
}

/**
 * Import results fetched while this machine could not reach NCBI, when the
 * batches were emitted as URLs and handed to an agent that could. Keyed
 * positionally by `ref_N`, so each line is only accepted if the coordinates it
 * echoes still agree with the citation now sitting at that index.
 */
function seedLegacyResults(usable) {
  if (!existsSync(LEGACY_RESULTS)) return { seeded: 0, skipped: 0 };
  let seeded = 0, skipped = 0;
  for (const line of readFileSync(LEGACY_RESULTS, "utf8").split(/\r?\n/)) {
    const r = parseEcitLine(line);
    if (!r) continue;
    const c = usable[+r.key.replace("ref_", "")];
    if (!c || ecitQuery(c).split("|").slice(0, 4).join("|") !== r.coords) { skipped++; continue; }
    if (ecitQuery(c) in ecitCache) continue;
    ecitCache[ecitQuery(c)] = { pmid: r.pmid, authorMatched: r.authorMatched };
    seeded++;
  }
  return { seeded, skipped };
}

async function ecitmatchFetch(bdata) {
  const url = `${EUTILS}/ecitmatch.cgi?db=pubmed&retmode=xml&bdata=${encodeURIComponent(bdata)}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    await acquire();
    try {
      const r = await fetch(url + (API_KEY ? `&api_key=${API_KEY}` : ""));
      if (r.status === 429 || r.status >= 500) { await sleep(1200 * (attempt + 1)); continue; }
      if (!r.ok) return null;
      const text = await r.text();
      if (text.trim()) return text;
    } catch { await sleep(900 * (attempt + 1)); }
    finally { release(); }
  }
  return null;
}

async function runEcitmatch(uniq) {
  const { batches, usable } = ecitmatchBatches(uniq, 25);
  const { seeded, skipped } = seedLegacyResults(usable);
  if (seeded || skipped) console.error(`ecitmatch: seeded ${seeded} from a previous run${skipped ? `, skipped ${skipped} stale` : ""}`);

  const todo = batches.filter((b) => b.items.some((c) => !(ecitQuery(c) in ecitCache)));
  console.error(`ecitmatch: ${usable.length} eligible in ${batches.length} batches; ${todo.length} to fetch`);
  let done = 0;
  for (const b of todo) {
    const text = await ecitmatchFetch(b.bdata);
    // Leave a failed batch uncached so the next run retries it.
    if (!text) { console.error(`  batch ${b.start}: request failed, will retry next run`); continue; }
    const byKey = new Map(b.items.map((c, j) => [`ref_${b.start + j}`, c]));
    let hits = 0;
    for (const line of text.split(/\r?\n/)) {
      const r = parseEcitLine(line);
      const c = r && byKey.get(r.key);
      if (!c) continue;
      ecitCache[ecitQuery(c)] = { pmid: r.pmid, authorMatched: r.authorMatched };
      if (r.pmid) hits++;
    }
    writeFileSync(ECIT_CACHE, JSON.stringify(ecitCache, null, 0));
    console.error(`  ${++done}/${todo.length} batches  (+${hits}/${b.items.length} pmids)`);
  }
  writeFileSync(ECIT_CACHE, JSON.stringify(ecitCache, null, 0));
}

// ── phase 2: confirm candidate PMIDs in bulk ────────────────────────────────

/**
 * The PMID a citation already points at, if any, and how we got it.
 * `via` matters because the two routes fail differently: a wrong explicit PMID
 * is a typo, whereas coordinates that resolve to an unrelated title suggest the
 * citation was invented around a plausible-looking journal/year/volume.
 */
function candidatePmid(c) {
  if (c.pmid) return { pmid: String(c.pmid), via: "cited-pmid" };
  const e = ecitEligible(c) ? ecitCache[ecitQuery(c)] : null;
  return e?.pmid ? { pmid: String(e.pmid), via: "ecitmatch", authorMatched: e.authorMatched } : null;
}

/**
 * esummary accepts a comma-separated id list, so every candidate PMID can be
 * confirmed in a handful of requests rather than one per citation. That is the
 * difference between a few minutes and a few hours: NCBI answers slowly from
 * here, so the number of round trips dominates the runtime, not the rate limit.
 */
async function esummaryBulk(pmids) {
  const out = new Map();
  const failed = new Set();     // PMIDs in a chunk whose request never answered
  const PER = 150;
  for (let i = 0; i < pmids.length; i += PER) {
    const chunk = pmids.slice(i, i + PER);
    const hits = await esummary(chunk);
    if (hits === FAILED) for (const p of chunk) failed.add(String(p));
    else for (const h of hits) out.set(String(h.pmid), h);
    console.error(`  summaries ${Math.min(i + PER, pmids.length)}/${pmids.length}${hits === FAILED ? "  (chunk failed, will retry next run)" : ""}`);
  }
  return { summaries: out, failed };
}

/**
 * The cited first author's surname. "van Spronsen FJ" -> "spronsen",
 * "Blau N" -> "blau". Taking the longest word skips particles and initials
 * without needing to know which naming convention the entry follows.
 */
function citedSurname(c) {
  const parts = norm(c.matchAuthor || c.firstAuthor || "").split(" ").filter((w) => w.length >= 3);
  return parts.sort((a, b) => b.length - a.length)[0] ?? null;
}

/** Is the cited author among the paper's authors? null when unknowable. */
function authorAppears(c, hit) {
  const surname = citedSurname(c);
  if (!surname || !hit.authors) return null;
  return norm(hit.authors).split(" ").includes(surname);
}

/**
 * What is this candidate paper, relative to the citation? The single source of
 * truth for that judgement — every path that produces a verdict calls this.
 *
 * It used to be written out twice, once here and once in --reclassify, which
 * meant a citation's verdict could depend on which route reached it rather than
 * on the evidence.
 *
 * The two routes do warrant different rules, though, because they start from
 * different evidence:
 *
 *  - Coordinates (a cited PMID, or ecitmatch on journal/year/volume/page) point
 *    at one specific paper. The only question is whether the cited title matches
 *    it. The corpus routinely shortens titles — "Liver transplantation for
 *    classical MSUD" for a paper called "...classical maple syrup urine disease:
 *    long-term follow-up in 37 patients" — so a confirmed author rescues a low
 *    title score. Neither matching means the coordinates were invented.
 *
 *  - A title search finds a paper *by its words*, so a good title score proves
 *    nothing on its own: the search was optimised to produce it. Agreement on
 *    year or author is the independent evidence. Without either, a high-scoring
 *    hit is a lookalike — which is not a hypothetical, it is how "Sodium
 *    benzoate therapy for NKH" came back as a paper on electroconvulsive
 *    therapy augmentation.
 */
function classify({ sim, byAuthor, yearOff, via }) {
  if (via === "cited-pmid" || via === "ecitmatch") {
    return sim >= 0.45 ? "RESOLVED"
      : byAuthor === true ? "TITLE_PARAPHRASE"
      : via === "cited-pmid" ? "PMID_TITLE_MISMATCH"
      : "WRONG_PAPER";
  }
  if (sim >= 0.55) return yearOff <= 1 ? "RESOLVED" : byAuthor === true ? "YEAR_MISMATCH" : "WEAK_MATCH";
  if (byAuthor === true) return yearOff > 1 ? "YEAR_MISMATCH" : "TITLE_PARAPHRASE";
  return "WEAK_MATCH";
}

/** Judge a candidate against its fetched summary. Pure — no network. */
function verdictFromSummary(c, cand, hit) {
  if (!hit) {
    return cand.via === "cited-pmid"
      ? { status: "PMID_INVALID", note: `PMID ${cand.pmid} returns nothing` }
      : null;   // a dead ecitmatch hit just falls through to the title search
  }
  const sim = similarity(c.title, hit.title);
  const byAuthor = authorAppears(c, hit);
  const status = classify({ sim, byAuthor, yearOff: 0, via: cand.via });
  return {
    status, pmid: hit.pmid, foundTitle: hit.title, foundJournal: hit.journal, foundYear: hit.year,
    foundAuthors: String(hit.authors).slice(0, 120), authorAppears: byAuthor,
    similarity: +sim.toFixed(2), via: cand.via,
    ...(cand.authorMatched === undefined ? {} : { authorMatched: cand.authorMatched }),
  };
}

/** Phase 3 fallback: search PubMed by title. One to three round trips. */
async function resolveByTitle(c) {
  if (!c.title) return { status: "UNPARSED", note: "no title could be extracted" };

  // Strip leading org prefixes ("ACMG — ...") the corpus adds.
  const cleanTitle = c.title.replace(/^[A-Z]{2,10}\s*[—–-]\s*/, "").trim();

  /**
   * Progressive relaxation, exact phrase first.
   *
   * The middle two matter more than they look. A long title submitted as one
   * phrase returns *nothing* from PubMed — it drops stopwords from its phrase
   * index, so "the human tyrosine aminotransferase gene mapped to the long arm
   * of chromosome"[Title] scores zero hits for a paper that plainly exists
   * (PMID 2870017). Descriptive titles are exactly the long ones, so a
   * phrase-only strategy fails hardest on the citations most worth checking and
   * reports them as fabricated. ANDing the most distinctive words instead is
   * immune to both stopwords and to the corpus's habit of rewording titles;
   * precision is recovered afterwards by the similarity gate, not by the query.
   */
  const content = [...tokens(cleanTitle)].sort((a, b) => b.length - a.length);
  const anded = (n) => content.slice(0, n).map((w) => `${w}[Title]`).join(" AND ");

  // A generic title crowds itself out. "Malonyl coenzyme A decarboxylase
  // deficiency" is the exact title of the 1984 first description and also the
  // opening words of half the papers written since, so relevance ranking buries
  // the original below its own descendants. Narrowing to the cited year finds it
  // immediately. Tried early but not exclusively — the corpus's years are
  // sometimes wrong too, which is what the later unscoped attempts are for.
  const near = c.year ? ` AND ${c.year - 1}:${c.year + 1}[dp]` : "";
  const queries = [
    `"${cleanTitle.replace(/["]/g, "")}"[Title]`,
    near && content.length >= 2 ? anded(Math.min(4, content.length)) + near : null,
    content.length >= 3 ? anded(Math.min(5, content.length)) : null,
    content.length >= 3 ? anded(3) : null,
    norm(cleanTitle).split(" ").slice(0, 10).join(" "),
  ].filter(Boolean);
  let best = null, failures = 0;
  for (const q of queries) {
    const ids = await esearch(q, 5);
    if (ids === FAILED) { failures++; continue; }
    if (!ids.length) continue;
    const hits = await esummary(ids);
    if (hits === FAILED) { failures++; continue; }
    for (const h of hits) {
      const sim = similarity(cleanTitle, h.title);
      if (!best || sim > best.similarity) best = { ...h, similarity: sim };
    }
    if (best && best.similarity >= 0.8) break;   // good enough, stop spending requests
  }

  // Nothing found *and* something went unanswered: we do not know that this
  // paper is missing, only that we failed to look. Never cache that as absence.
  if (!best && failures) return { status: "SEARCH_FAILED", note: `${failures} of ${queries.length} PubMed searches did not answer` };

  if (!best || best.similarity < 0.35) {
    // A one- or two-word title ("Phenylketonuria") is structurally incapable of
    // scoring well: Dice divides by the union, so a short cited title against a
    // longer real one lands near zero even when the paper is correct. Calling
    // that NOT_FOUND would read as "fabricated", which is a different and much
    // more serious claim than "search cannot discriminate this".
    if (tokens(cleanTitle).size <= 2) {
      return { status: "AMBIGUOUS_TITLE", note: `"${cleanTitle.slice(0, 60)}" is too short to identify by title search`, bestSimilarity: best ? +best.similarity.toFixed(2) : 0, bestTitle: best?.title ?? null };
    }
    return { status: "NOT_FOUND", note: `no PubMed title resembles "${cleanTitle.slice(0, 80)}"`, bestSimilarity: best ? +best.similarity.toFixed(2) : 0, bestTitle: best?.title ?? null };
  }
  const yearOff = c.year && best.year ? Math.abs(c.year - best.year) : 0;
  const byAuthor = authorAppears(c, best);
  const status = classify({ sim: best.similarity, byAuthor, yearOff, via: "title-search" });
  return {
    status, pmid: best.pmid, foundTitle: best.title, foundJournal: best.journal,
    foundYear: best.year, foundAuthors: String(best.authors ?? "").slice(0, 120),
    authorAppears: byAuthor, similarity: +best.similarity.toFixed(2), yearOffset: yearOff,
    via: "title-search",
  };
}

// ── run ─────────────────────────────────────────────────────────────────────
const uniq = dedupe(collectCitations());
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};

/**
 * Drop cached verdicts of a given status so the next pass resolves them again.
 *
 *   node scripts/check-citations.mjs --recheck NOT_FOUND,AMBIGUOUS_TITLE
 *
 * The point is to be able to re-test the accusatory verdicts specifically. A
 * NOT_FOUND is what the UI turns into "PubMed has no paper with these details",
 * so it should be cheap to confirm one independently of the run that produced
 * it — before the earlier network conditions get baked into the knowledge base.
 */
const recheckArg = process.argv.indexOf("--recheck");
if (recheckArg > -1) {
  const want = new Set(String(process.argv[recheckArg + 1] ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean));
  let dropped = 0;
  for (const c of uniq) {
    const k = cacheKey(c);
    if (cache[k] && want.has(cache[k].status)) { delete cache[k]; dropped++; }
  }
  console.error(`--recheck: dropped ${dropped} cached ${[...want].join("/")} verdicts for re-resolution`);
}

/**
 * Re-derive verdicts for every citation that already resolved to a PMID, using
 * freshly fetched summaries. esummary is a bulk call, so this costs a handful of
 * requests — which means the classification rules can be revised without
 * repeating the title-search pass, the slow part of a full run. Citations that
 * never found a PMID are left alone; there is nothing to re-judge.
 */
if (process.argv.includes("--reclassify")) {
  const withPmid = uniq.filter((c) => cache[cacheKey(c)]?.pmid);
  console.error(`reclassifying ${withPmid.length} citations that resolved to a PMID...`);
  const { summaries } = await esummaryBulk([...new Set(withPmid.map((c) => String(cache[cacheKey(c)].pmid)))]);
  const moves = new Map();
  for (const c of withPmid) {
    const prev = cache[cacheKey(c)];
    const hit = summaries.get(String(prev.pmid));
    if (!hit) continue;
    const via = prev.via ?? "title-search";
    const sim = similarity(c.title, hit.title);
    const byAuthor = authorAppears(c, hit);
    const yearOff = c.year && hit.year ? Math.abs(c.year - hit.year) : 0;
    // Below the floor the title search would never have offered this paper at
    // all, so it is a non-match rather than a weak one.
    const status = via === "title-search" && sim < 0.35 && byAuthor !== true
      ? "NOT_FOUND"
      : classify({ sim, byAuthor, yearOff, via });
    if (status !== prev.status) moves.set(`${prev.status} -> ${status}`, (moves.get(`${prev.status} -> ${status}`) ?? 0) + 1);
    cache[cacheKey(c)] = {
      ...prev, status, similarity: +sim.toFixed(2), yearOffset: yearOff, via,
      foundTitle: hit.title, foundJournal: hit.journal, foundYear: hit.year,
      foundAuthors: String(hit.authors).slice(0, 120), authorAppears: byAuthor,
    };
  }
  writeFileSync(CACHE, JSON.stringify(cache, null, 0));
  for (const [move, n] of [...moves].sort((a, b) => b[1] - a[1])) console.error(`  ${String(n).padStart(4)}  ${move}`);
}

if (!process.argv.includes("--report") && !process.argv.includes("--reclassify")) {
  if (!process.argv.includes("--skip-ecitmatch")) await runEcitmatch(uniq);

  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg > -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;
  const todo = uniq.filter((c) => !(cacheKey(c) in cache)).slice(0, limit);
  console.error(`${uniq.length} unique citations; ${uniq.length - todo.length} cached; resolving ${todo.length}...`);

  // Note: no `uses` is written to the cache. The cache is keyed per unique
  // paper, but how many disorders cite it is a property of the current
  // knowledge base, so it is read live from the citation at report time.
  const store = (c, verdict) => { cache[cacheKey(c)] = { ...verdict, title: c.title, year: c.year, journal: c.journal }; };

  // 2. Everything that already has a candidate PMID, confirmed in bulk.
  const cands = new Map();
  for (const c of todo) { const cand = candidatePmid(c); if (cand) cands.set(c, cand); }
  console.error(`confirming ${cands.size} candidate PMIDs in bulk...`);
  const { summaries, failed } = await esummaryBulk([...new Set([...cands.values()].map((v) => v.pmid))]);

  const needTitleSearch = [];
  const fallback = new Map();   // citation -> verdict to keep if no better one is found
  let unchecked = 0;
  for (const c of todo) {
    const cand = cands.get(c);
    // A PMID whose summary request failed is unjudged, not invalid — leaving it
    // out of the cache entirely is what makes the next run pick it up again.
    if (cand && failed.has(cand.pmid)) { unchecked++; continue; }
    const verdict = cand ? verdictFromSummary(c, cand, summaries.get(cand.pmid)) : null;
    if (!verdict) { needTitleSearch.push(c); continue; }
    // Coordinates that land on a different paper settle only that the
    // coordinates are wrong — not that the cited paper is imaginary. Since this
    // corpus's dominant failure is a real paper wrapped in invented journal,
    // volume and page numbers, stopping here would condemn exactly the citations
    // most likely to be recoverable. Look for the cited title before concluding.
    if (verdict.status === "WRONG_PAPER" || verdict.status === "PMID_TITLE_MISMATCH") {
      fallback.set(c, verdict);
      needTitleSearch.push(c);
      continue;
    }
    store(c, verdict);
  }
  writeFileSync(CACHE, JSON.stringify(cache, null, 0));
  console.error(`  ${todo.length - needTitleSearch.length - unchecked} settled by PMID; ${needTitleSearch.length} need a title search${unchecked ? `; ${unchecked} left for next run (summary request failed)` : ""}`);

  // 3. The rest need a title search each — the slow part, so run them through
  //    the gate concurrently rather than end to end.
  // A title search that actually located the paper beats a fallback verdict
  // built from coordinates that pointed somewhere else.
  const FOUND = new Set(["RESOLVED", "TITLE_PARAPHRASE", "WEAK_MATCH", "YEAR_MISMATCH"]);
  let n = 0, searchFailed = 0, rescued = 0;
  await pool(needTitleSearch, async (c) => {
    const v = await resolveByTitle(c);
    const fb = fallback.get(c);
    if (FOUND.has(v.status)) { if (fb) rescued++; store(c, v); }
    else if (fb) store(c, fb);
    else if (v.status === "SEARCH_FAILED") searchFailed++;
    else store(c, v);
    if (++n % 20 === 0) {
      writeFileSync(CACHE, JSON.stringify(cache, null, 0));
      console.error(`  title search ${n}/${needTitleSearch.length}`);
    }
  }, MAX_INFLIGHT);
  writeFileSync(CACHE, JSON.stringify(cache, null, 0));
  if (rescued) console.error(`  ${rescued} recovered by title search after their coordinates pointed at another paper`);
  if (searchFailed) console.error(`  ${searchFailed} left unresolved: PubMed did not answer. Re-run to finish.`);
}

// ── report ──────────────────────────────────────────────────────────────────
const rows = uniq.map((c) => ({ ...c, ...(cache[cacheKey(c)] ?? { status: "UNRESOLVED" }) }));
const by = (s) => rows.filter((r) => r.status === s);
const ORDER = ["RESOLVED", "TITLE_PARAPHRASE", "WEAK_MATCH", "YEAR_MISMATCH", "WRONG_PAPER", "PMID_TITLE_MISMATCH", "PMID_INVALID", "AMBIGUOUS_TITLE", "NOT_FOUND", "UNPARSED", "UNRESOLVED"];

console.log(`\n=== citation resolution (${rows.length} unique, ${rows.reduce((s, r) => s + r.uses.length, 0)} uses) ===`);
for (const s of ORDER) {
  const n = by(s).length;
  if (n) console.log(`  ${s.padEnd(22)} ${String(n).padStart(4)}  ${((100 * n) / rows.length).toFixed(1)}%`);
}
const viaEcit = rows.filter((r) => r.via === "ecitmatch");
console.log(`\n  resolved via ecitmatch : ${viaEcit.length} (${viaEcit.filter((r) => r.authorMatched === false).length} of them with an author PubMed could not confirm)`);

/**
 * Sources PubMed does not index, where NOT_FOUND is evidence of nothing: book
 * chapters, GeneReviews, ACMG ACT sheets, mutation databases, bare URLs, and
 * anything published before MEDLINE's coverage begins (~1966). Separating these
 * out matters — otherwise the headline count reads as "212 suspect citations"
 * when most of them are ordinary references to things PubMed has never held.
 */
const UNINDEXED = /\b(?:In:|eds?\.|OMMBID|GeneReviews|ACT Sheets?|BIOMDB|Available at|https?:\/\/|Scriver)/i;
const notIndexable = (r) => UNINDEXED.test(r.raw) || (r.year && r.year < 1966);

const missing = [...by("NOT_FOUND"), ...by("AMBIGUOUS_TITLE")];
const expected = missing.filter(notIndexable);
console.log(`\n  of the ${missing.length} PubMed could not find, ${expected.length} are book chapters, GeneReviews,`);
console.log(`  ACT sheets, databases or pre-1966 papers that PubMed would not index anyway;`);
console.log(`  ${missing.length - expected.length} are journal citations that should have been findable.`);

console.log(`\n--- needs a human: NOT_FOUND, ranked by how many disorders lean on it ---`);
for (const r of [...by("NOT_FOUND"), ...by("PMID_INVALID")].sort((a, b) => b.uses.length - a.uses.length).slice(0, 30)) {
  console.log(`  [${r.uses.length}x] ${r.firstAuthor ?? "?"} ${r.year ?? "?"} — ${String(r.title).slice(0, 95)}`);
  console.log(`         used by: ${r.uses.slice(0, 4).join(", ")}${r.uses.length > 4 ? " …" : ""}`);
}
console.log(`\n--- WRONG_PAPER: coordinates resolve, but to a paper with neither this title nor this author ---`);
for (const r of [...by("WRONG_PAPER"), ...by("PMID_TITLE_MISMATCH")].sort((a, b) => b.uses.length - a.uses.length).slice(0, 40)) {
  console.log(`  [${r.uses.length}x] cited : ${r.firstAuthor ?? "?"} ${r.year ?? "?"} — ${String(r.title).slice(0, 90)}`);
  console.log(`         PubMed ${r.pmid} : ${String(r.foundTitle).slice(0, 90)}`);
  console.log(`         used by: ${r.uses.slice(0, 4).join(", ")}${r.uses.length > 4 ? " …" : ""}`);
}
console.log(`\n--- TITLE_PARAPHRASE: right paper (author confirms), title reworded — cosmetic ---`);
for (const r of by("TITLE_PARAPHRASE").slice(0, 8)) {
  console.log(`  cited : ${String(r.title).slice(0, 85)}`);
  console.log(`  actual: ${String(r.foundTitle).slice(0, 85)} (PMID ${r.pmid})`);
}
console.log(`\n--- YEAR_MISMATCH (real paper, wrong year) ---`);
for (const r of by("YEAR_MISMATCH").slice(0, 20)) {
  console.log(`  ${r.firstAuthor} ${r.year} -> PubMed ${r.foundYear} (PMID ${r.pmid}) ${String(r.title).slice(0, 70)}`);
}

writeFileSync(OUT, JSON.stringify(rows, null, 2));
console.log(`\nfull report: scripts/citation-report.json`);
