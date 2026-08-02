// Parse the free-text citations in the disorder knowledge base into structured
// records, so they can be resolved against PubMed.
//
// The knowledge base was largely bulk-generated, so a citation string cannot be
// assumed to describe a real paper. This module only *parses*; check-citations.mjs
// does the resolving. Kept separate so the parser can be unit-tested without
// network access.
import { DISORDERS } from "../src/disorders.js";

// "Author A, Author B. Title of the paper. Journal Abbrev. 2015;38(2):231-42. PMID 12345678."
// Tolerant by necessity: the corpus mixes en-dashes, missing volumes, "et al.",
// trailing DOIs and the occasional guideline or GeneReviews entry with no journal.
const CITE = /^(?<authors>.+?)\.\s+(?<title>.+?)\.\s+(?<rest>[^.]*?\.?\s*\d{4}.*)$/s;

export function parseCitation(raw) {
  const s = String(raw || "").trim().replace(/\s+/g, " ");
  if (!s) return null;

  const pmid = s.match(/PMID:?\s*(\d{4,8})/i)?.[1] ?? null;
  const doi = s.match(/\b(10\.\d{4,9}\/[^\s,;]+)/)?.[1]?.replace(/[.,;]$/, "") ?? null;

  const m = s.match(CITE);
  if (!m) {
    // Still useful: a bare year tells us roughly what to search for.
    const year = s.match(/\b(19|20)\d{2}\b/)?.[0];
    return { raw: s, authors: null, title: null, journal: null, year: year ? +year : null, pmid, doi, parsed: false };
  }

  const { authors, title, rest } = m.groups;
  const year = rest.match(/\b(19|20)\d{2}\b/)?.[0];
  // Journal is whatever precedes the year, minus punctuation.
  const journal = rest.split(/\b(?:19|20)\d{2}\b/)[0].replace(/[.,;:\s]+$/, "").trim() || null;

  // Volume and first page, for PubMed's batch citation matcher (ecitmatch),
  // which keys on journal|year|volume|firstpage|author. Shapes in this corpus:
  //   "2015;38(2):231-42."   "2014;17:79-82."   "2003;111(6 Pt 1):1399-406."
  const vp = rest.match(/;\s*(\d+)\s*(?:\([^)]*\))?\s*:\s*([A-Za-z]?\d+)/);
  const volume = vp?.[1] ?? null;
  const firstPage = vp?.[2] ?? null;

  const first = authors.trim().split(/,|\band\b/)[0].trim();
  return {
    raw: s,
    authors: authors.trim(),
    firstAuthor: first,
    // ecitmatch wants "Surname AB" with no punctuation and no "et al". Fold
    // diacritics to ASCII rather than dropping them, or Thöny becomes "Thny"
    // and Bonafé becomes "Bonaf" — neither of which PubMed will match.
    matchAuthor:
      first
        .replace(/\bet al\.?/i, "")
        .normalize("NFD").replace(/\p{M}/gu, "")
        .replace(/[^A-Za-z\s'-]/g, "")
        .replace(/\s+/g, " ")
        .trim() || null,
    title: title.trim().replace(/\s*\[[^\]]*\]\s*$/, ""),
    journal,
    volume,
    firstPage,
    year: year ? +year : null,
    pmid,
    doi,
    parsed: true,
  };
}

/** Can this citation be resolved by ecitmatch at all? */
export const ecitEligible = (c) => !!(c.journal && c.year && c.volume && c.firstPage && c.matchAuthor);

/**
 * The five ecitmatch query fields, joined. ecitmatch echoes these back verbatim
 * on the response line, which makes the string a stable content-addressed cache
 * key — unlike the positional `ref_N` token, which shifts whenever the knowledge
 * base gains or loses a citation.
 */
export function ecitQuery(c) {
  // Pipes and newlines would corrupt the field/record separators.
  const clean = (s) => String(s).replace(/[|\r\n]/g, " ").trim();
  return `${clean(c.journal)}|${c.year}|${c.volume}|${c.firstPage}|${clean(c.matchAuthor)}`;
}

/**
 * Build ecitmatch `bdata` batches.
 *
 * ecitmatch resolves a *batch* of citations in one request, which turns ~900
 * lookups into ~37 round trips. NCBI is slow to answer from here (7-25s per
 * call), so batching is what makes a full pass practical. Only citations
 * carrying journal + year + volume + first page can be matched this way; the
 * rest need a title search.
 *
 * Line format: journal|year|volume|first_page|author|key|
 */
export function ecitmatchBatches(citations, perBatch = 45) {
  const usable = citations.filter(ecitEligible);
  const batches = [];
  for (let i = 0; i < usable.length; i += perBatch) {
    const slice = usable.slice(i, i + perBatch);
    const bdata = slice.map((c, j) => `${ecitQuery(c)}|ref_${i + j}|`).join("\r");
    batches.push({ start: i, items: slice, bdata });
  }
  return { batches, usable, unusable: citations.filter((c) => !ecitEligible(c)) };
}

/**
 * Identity of the *paper* a citation names, and so the key under which its
 * PubMed verdict is cached. Shared by the resolver and the writer because the
 * two must agree exactly: a mismatch reads as a cold cache and silently
 * re-resolves — or worse, marks a resolved citation "not yet checked".
 *
 * Deliberately prefers the title over the PMID. apply-citation-provenance.mjs
 * stamps "PMID nnnnnnnn." onto references that resolved, which means the next
 * parse of the same file *does* see a PMID where the resolving run saw none.
 * Keying on the PMID would therefore change every key the moment the pipeline
 * wrote its own output back, and the pipeline has to be re-runnable.
 *
 * The year is part of the key because titles are not unique. "Creatine
 * deficiency syndromes" is both a GeneReviews chapter and a 2003 Mol Cell
 * Biochem paper; on a title-only key they shared one verdict, so both were
 * stamped with the PMID of a third paper — Schulze's study of their prevalence
 * in autism, which matched the generic title. Keying on title alone silently
 * merges distinct papers.
 */
const normTitle = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
export const cacheKey = (c) =>
  c.title ? `t:${normTitle(c.title).slice(0, 120)}|${c.year ?? ""}`
  : c.pmid ? `pmid:${c.pmid}`
  : `t:${normTitle(c.raw).slice(0, 120)}|${c.year ?? ""}`;

/**
 * Bring a cache written under the title-only key forward, using the year each
 * entry already records. Without this, adding the year to the key would look
 * like a cold cache and re-resolve ~970 citations — and worse, would re-confirm
 * whatever PMID had already been stamped, since a wrong stamp validates itself.
 */
export function migrateCacheKeys(cache) {
  let moved = 0;
  for (const [k, v] of Object.entries(cache)) {
    if (!k.startsWith("t:") || k.includes("|")) continue;
    const next = `${k}|${v?.year ?? ""}`;
    if (!(next in cache)) { cache[next] = v; moved++; }
    delete cache[k];
  }
  return moved;
}

/** Every citation in the knowledge base, with where it came from. */
export function collectCitations() {
  const out = [];
  for (const d of DISORDERS) {
    for (const [field, list] of [
      ["narrative", d.narrative?.references],
      ["followUp", d.followUp?.references],
    ]) {
      (list ?? []).forEach((raw, i) => {
        const p = parseCitation(raw);
        if (p) out.push({ ...p, disorder: d.id, field, index: i });
      });
    }
  }
  return out;
}

/**
 * Group identical citations so each unique paper is resolved once.
 *
 * Uses cacheKey, so grouping and caching agree by construction. They used to
 * differ — dedupe keyed on the title alone while the cache keyed on title and
 * year — which meant a group could span two cache keys, only the
 * representative's verdict was ever stored, and the rest reported themselves as
 * never checked.
 */
export function dedupe(citations) {
  const key = cacheKey;
  const map = new Map();
  for (const c of citations) {
    const k = key(c);
    if (!map.has(k)) map.set(k, { ...c, uses: [] });
    map.get(k).uses.push(`${c.disorder}.${c.field}[${c.index}]`);
  }
  return [...map.values()];
}

if (process.argv[1]?.endsWith("parse-citations.mjs")) {
  const all = collectCitations();
  const uniq = dedupe(all);
  const unparsed = uniq.filter((c) => !c.parsed);
  console.log(`total citations : ${all.length}`);
  console.log(`unique          : ${uniq.length}`);
  console.log(`with a PMID     : ${uniq.filter((c) => c.pmid).length}`);
  console.log(`with a DOI      : ${uniq.filter((c) => c.doi).length}`);
  console.log(`no identifier   : ${uniq.filter((c) => !c.pmid && !c.doi).length}`);
  console.log(`failed to parse : ${unparsed.length}`);
  if (process.argv.includes("--show-unparsed")) {
    for (const c of unparsed.slice(0, 25)) console.log("  ! " + c.raw.slice(0, 150));
  }
  if (process.argv.includes("--sample")) {
    for (const c of uniq.slice(0, 12)) {
      console.log(`\n  ${c.firstAuthor} | ${c.year} | ${c.journal}`);
      console.log(`    ${String(c.title).slice(0, 110)}`);
    }
  }
}
