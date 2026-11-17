// Give a GeneReviews citation its PMID, so the chapter can be fetched and read.
//
// Why this exists. A GeneReviews chapter is free on NCBI Bookshelf and the
// project already harvests them (--genereviews), but that pass works from PMIDs
// and seven cited chapters have none: their citation never resolved. They are
// therefore invisible to every retrieval path at once — not fetched
// automatically, not judged, and, until the list was widened, not even on the
// "obtain by hand" list. Between them they carry 25 claims. Asking anyone to go
// and retrieve a free document is the wrong answer; resolving the citation is.
//
//   node scripts/resolve-genereviews.mjs             # propose, change nothing
//   node scripts/resolve-genereviews.mjs --write     # stamp the PMIDs in
//   node scripts/resolve-genereviews.mjs --selftest  # matcher only, no network
//
// Then: --genereviews to fetch the bodies, --ingest to take them in.
//
// The bar for accepting a match. Naming a chapter wrongly attaches a body to a
// citation it does not belong to, which is the defect this repository exists to
// catch, so a candidate has to clear three independent checks:
//
//   1. its PubMed record must be a Bookshelf chapter (an NBK accession) in
//      GeneReviews — not a journal article with a similar name, which is
//      exactly what six citations turned out to be on 2026-09-13;
//   2. its title must match the cited chapter title, flattened to letters and
//      digits, either exactly or by carrying every distinctive word;
//   3. it must be the only candidate that does. A tie is reported, not broken.
//
// No network is used until a citation actually needs resolving, and nothing is
// written without --write.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectClaims } from "./parse-claims.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DISORDERS = resolve(HERE, "..", "src", "disorders.js");
const ABSTRACTS = resolve(HERE, ".abstract-cache.json");

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const API_KEY = process.env.NCBI_API_KEY || null;
const CONTACT = { tool: "metabolicdx", email: "klaaswierenga@gmail.com" };

const arg = (f) => process.argv.includes(f);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Letters and digits only, single-spaced: survives punctuation and en-dashes. */
const flatten = (s) =>
  String(s ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim();

const STOP = new Set(`the and for with from that this deficiency disease disorder disorders
  syndrome type related gene genes overview summary`.split(/\s+/).filter(Boolean));

/** Distinctive words of a title — what a match has to account for. */
const keyWords = (title) =>
  [...new Set(flatten(title).split(" "))].filter((w) => w.length > 3 && !STOP.has(w));

/**
 * The chapter title inside a GeneReviews citation string.
 *
 * Two shapes occur in this corpus, and the difference is where the authors sit:
 *   "Merritt JL, Chang IJ. Medium-chain acyl-coenzyme A dehydrogenase deficiency. GeneReviews®. 2000"
 *   "Carbonic Anhydrase VA Deficiency. In: Adam MP et al., eds. GeneReviews®. Seattle..."
 * Everything from "GeneReviews" onwards is publication furniture. Of what is
 * left, an author list and an "In: ... eds" segment are dropped, and the longest
 * remaining segment is the title — chapter titles in this corpus are long and
 * descriptive, author lists are short.
 */
export function chapterTitle(citation) {
  const head = String(citation).split(/GeneReviews/i)[0];
  const segments = head.split(/\.\s+/).map((s) => s.trim()).filter(Boolean);
  const looksLikeAuthors = (s) =>
    /^in:/i.test(s) || /\beds?\b\.?$/i.test(s) ||
    /^([A-Z][a-zA-Z'’-]+\s+[A-Z]{1,3}[,;]?\s*)+(et al\.?)?[,;]?\s*(eds?\.?)?$/.test(s);
  const candidates = segments.filter((s) => !looksLikeAuthors(s));
  if (!candidates.length) return null;
  return candidates.sort((a, b) => b.length - a.length)[0].replace(/[.,;:]$/, "").trim();
}

/**
 * Does this PubMed record answer to the cited chapter title?
 * Returns "exact", "covers" (every distinctive word present) or null.
 */
export function titleMatch(cited, candidate) {
  const a = flatten(cited);
  const b = flatten(candidate);
  if (!a || !b) return null;
  if (a === b || b.includes(a) || a.includes(b)) return "exact";
  const words = keyWords(cited);
  if (words.length < 2) return null;
  return words.every((w) => b.includes(w)) ? "covers" : null;
}

/** Retrying GET. Returns null on give-up, which callers must not treat as "no". */
async function get(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url);
      if (r.status === 429 || r.status >= 500) { await sleep(1200 * (attempt + 1)); continue; }
      if (!r.ok) return null;
      const text = await r.text();
      if (text.trim()) return text;
    } catch { await sleep(900 * (attempt + 1)); }
  }
  return null;
}

const qs = (params) =>
  new URLSearchParams({ ...params, ...CONTACT, ...(API_KEY ? { api_key: API_KEY } : {}) });

/** Candidate PMIDs for a chapter title, restricted to the GeneReviews book. */
async function search(title) {
  const body = await get(`${EUTILS}/esearch.fcgi?${qs({
    db: "pubmed", retmode: "json", retmax: "8",
    term: `${title} AND GeneReviews[Book]`,
  })}`);
  if (!body) return null;                       // request failed — not "no match"
  try { return JSON.parse(body).esearchresult?.idlist ?? []; } catch { return null; }
}

/** Title and Bookshelf accession for each PMID, from one efetch. */
async function describe(pmids) {
  if (!pmids.length) return new Map();
  const xml = await get(`${EUTILS}/efetch.fcgi?${qs({ db: "pubmed", id: pmids.join(","), retmode: "xml" })}`);
  if (!xml) return null;
  const out = new Map();
  for (const chunk of xml.split(/<PubmedBookArticle>|<PubmedArticle>/).slice(1)) {
    const pmid = chunk.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1];
    if (!pmid) continue;
    const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const title =
      strip(chunk.match(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/)?.[1] ?? "") ||
      strip(chunk.match(/<BookTitle[^>]*>([\s\S]*?)<\/BookTitle>/)?.[1] ?? "");
    const book = strip(chunk.match(/<BookTitle[^>]*>([\s\S]*?)<\/BookTitle>/)?.[1] ?? "");
    const nbk = chunk.match(/NBK\d+/)?.[0] ?? null;
    out.set(pmid, { pmid, title, book, nbk });
  }
  return out;
}

// ── the citations that need one ──────────────────────────────────────────────
const wanted = new Map();
for (const c of collectClaims()) {
  for (const r of c.refs) {
    if (!r.raw || r.pmid || !/GeneReviews/i.test(r.raw)) continue;
    const key = r.text || r.raw;
    if (!wanted.has(key)) wanted.set(key, { citation: key, raw: r.raw, n: 0, disorders: new Set() });
    const e = wanted.get(key);
    e.n++;
    e.disorders.add(c.disorder);
  }
}
const jobs = [...wanted.values()]
  .map((j) => ({ ...j, disorders: [...j.disorders], title: chapterTitle(j.citation) }))
  .sort((a, b) => b.n - a.n);

// ── --selftest: the matcher, against chapters already resolved ───────────────
// Every check above is exercised without a single request, by replaying the
// GeneReviews citations that DO have a PMID and asking whether the matcher
// would have chosen it from the title alone.
if (arg("--selftest")) {
  const abstracts = existsSync(ABSTRACTS) ? JSON.parse(readFileSync(ABSTRACTS, "utf8")) : {};
  let ok = 0, missed = 0, noTitle = 0;
  for (const c of collectClaims()) {
    for (const r of c.refs) {
      if (!r.raw || !r.pmid || !/GeneReviews/i.test(r.raw)) continue;
      const known = abstracts[r.pmid]?.title;
      if (!known) continue;
      const cited = chapterTitle(r.text || r.raw);
      if (!cited) { noTitle++; console.log(`  no title parsed: ${(r.text || r.raw).slice(0, 70)}`); continue; }
      const verdict = titleMatch(cited, known);
      if (verdict) ok++;
      else { missed++; console.log(`  MISS ${r.pmid}\n    cited: ${cited}\n    pubmed: ${known}`); }
    }
  }
  console.log(`\nmatcher agrees with ${ok} already-resolved GeneReviews citations, misses ${missed}, ${noTitle} unparsed`);
  console.log(`\ntitles parsed from the ${jobs.length} unresolved citations:`);
  for (const j of jobs) console.log(`  ${String(j.n).padStart(2)} claims  [${j.disorders.join(" ")}]  ${j.title ?? "(could not parse)"}`);
  process.exit(missed || noTitle ? 1 : 0);
}

// ── resolve ─────────────────────────────────────────────────────────────────
console.error(`${jobs.length} GeneReviews citations carry claims and no PMID\n`);
const found = [];
for (const j of jobs) {
  if (!j.title) { console.log(`?  could not parse a chapter title: ${j.citation.slice(0, 70)}`); continue; }
  const ids = await search(j.title);
  await sleep(API_KEY ? 150 : 400);
  if (ids === null) { console.log(`!  ${j.title}\n   search failed — not recorded as "no such chapter"`); continue; }
  if (!ids.length) { console.log(`-  ${j.title}\n   no GeneReviews chapter of that name in PubMed`); continue; }

  const described = await describe(ids);
  await sleep(API_KEY ? 150 : 400);
  if (described === null) { console.log(`!  ${j.title}\n   record fetch failed — nothing recorded`); continue; }

  const passing = [...described.values()].filter(
    (d) => d.nbk && /GeneReviews/i.test(d.book || "") && titleMatch(j.title, d.title),
  );
  if (passing.length !== 1) {
    console.log(`?  ${j.title}\n   ${passing.length} candidates cleared the bar${passing.length ? `: ${passing.map((p) => p.pmid).join(", ")}` : ""} — left alone`);
    continue;
  }
  const hit = passing[0];
  console.log(`OK ${hit.pmid}  ${hit.nbk}  ${hit.title.slice(0, 70)}`);
  console.log(`   for [${j.disorders.join(" ")}] ${j.n} claims`);
  found.push({ ...j, ...hit });
}

if (!found.length) { console.error(`\nnothing resolved`); process.exit(0); }
if (!arg("--write")) {
  console.error(`\n${found.length} would be stamped. Re-run with --write to apply.`);
  process.exit(0);
}

// The stamp is the same mechanism the verified citations use: "PMID nnnnnnnn."
// appended to the reference string, which citations.js renders as a link and
// parse-claims reads as the paper to judge against.
let src = readFileSync(DISORDERS, "utf8");
let stamped = 0;
for (const f of found) {
  const needle = f.raw;
  const count = src.split(needle).length - 1;
  // A chapter cited by two disorders appears twice, character for character.
  // Both occurrences are the same paper and both get the stamp; what would be
  // wrong is stamping a string that is not there at all.
  if (count === 0) { console.error(`  skipped (not found): ${needle.slice(0, 60)}`); continue; }
  src = src.split(needle).join(`${needle.replace(/\s*$/, "")} PMID ${f.pmid}.`);
  stamped += count;
  if (count > 1) console.error(`  ${f.pmid}: stamped ${count} occurrences (cited by ${f.disorders.join(", ")})`);
}
writeFileSync(DISORDERS, src);
console.error(`\n${stamped} citations stamped in src/disorders.js`);

// The stamp is not enough on its own. citationKey ignores a trailing PMID, so a
// stale provenance entry keeps matching the repaired string and keeps outvoting
// it — leaving the citation reading "unverified" while carrying a PMID, which
// citations.test.js rightly refuses. The map's own rule says what to do: a
// verified citation is ABSENT from it and carries its PMID inline instead. So
// the entry is deleted, not rewritten.
//
// What was deleted said "closest PubMed match is only a partial title match" or
// "not indexed by PubMed" — the generic resolver shrugging at a Bookshelf
// record it has no way to check. These chapters are confirmed by their NBK
// accession and their title within the GeneReviews book, which is a stronger
// test than the one that failed, not a looser one.
const PROVENANCE = resolve(HERE, "..", "src", "citation-provenance.js");
if (existsSync(PROVENANCE)) {
  const { citationKey } = await import("../src/citations.js");
  const keys = new Set(found.map((f) => citationKey(f.raw)));
  const lines = readFileSync(PROVENANCE, "utf8").split("\n");
  const kept = lines.filter((l) => {
    const key = l.match(/^ {2}"([^"]+)":/)?.[1];
    return !(key && keys.has(key));
  });
  if (kept.length !== lines.length) {
    writeFileSync(PROVENANCE, kept.join("\n"));
    console.error(`${lines.length - kept.length} stale provenance entries removed — the inline PMID governs now`);
    console.error(`(that file is generated; a pipeline re-run needs the same Bookshelf check to keep them out)`);
  }
}
console.error(`Next: node scripts/fetch-fulltext.mjs --genereviews && node scripts/fetch-fulltext.mjs --ingest`);
