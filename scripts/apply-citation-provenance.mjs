// Write the citation resolution results back into the knowledge base.
//
// Reads scripts/.citation-cache.json (produced by check-citations.mjs) and emits:
//
//   1. src/disorders.js  — a "PMID nnnnnnnn." suffix appended to every reference
//      string that resolved cleanly, so the file is self-describing when read
//      directly. Rewritten line by line; nothing else in the file is touched.
//   2. src/citation-provenance.js — the generated map of everything that did NOT
//      resolve cleanly, which the UI uses to mark those references.
//
//   node scripts/apply-citation-provenance.mjs --dry-run   # report, write nothing
//   node scripts/apply-citation-provenance.mjs
//
// Idempotent: a reference that already carries the right PMID is left alone, so
// re-running after a fresh resolution pass only moves what actually changed.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectCitations, dedupe, ecitEligible, cacheKey } from "./parse-citations.mjs";
import { citationKey } from "../src/citation-key.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = resolve(HERE, ".citation-cache.json");
const DISORDERS = resolve(HERE, "..", "src", "disorders.js");
const OUT = resolve(HERE, "..", "src", "citation-provenance.js");
const DRY = process.argv.includes("--dry-run");

if (!existsSync(CACHE)) {
  console.error("no scripts/.citation-cache.json — run: node scripts/check-citations.mjs");
  process.exit(1);
}

const cache = JSON.parse(readFileSync(CACHE, "utf8"));

// Sources PubMed does not index, where a miss is evidence of nothing. Kept in
// step with the same list in check-citations.mjs.
const UNINDEXED = /\b(?:In:|eds?\.|OMMBID|GeneReviews|ACT Sheets?|BIOMDB|Available at|https?:\/\/|Scriver)/i;

/**
 * Map a resolver status onto how the reference should be presented.
 *
 * The important split is inside NOT_FOUND. A citation carrying a complete
 * journal/year/volume/page that PubMed cannot match by coordinates *or* by title
 * is a much stronger claim than a book chapter PubMed was never going to hold —
 * the first is a fabricated reference, the second is a normal one.
 */
function level(c, v) {
  switch (v.status) {
    case "RESOLVED":
    case "TITLE_PARAPHRASE":
      return "verified";
    case "YEAR_MISMATCH":
    case "WEAK_MATCH":
      return "check";
    case "WRONG_PAPER":
    case "PMID_TITLE_MISMATCH":
    case "PMID_INVALID":
      return "wrong";
    case "NOT_FOUND":
      if (UNINDEXED.test(c.raw) || (c.year && c.year < 1966)) return "unverified";
      return ecitEligible(c) ? "wrong" : "unverified";
    default:
      return "unverified";   // AMBIGUOUS_TITLE, UNPARSED, anything unrecognised
  }
}

/** Trim to a word boundary so a quoted title does not end mid-word. */
function clip(s, n) {
  const t = String(s ?? "").trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), n - 15)).replace(/[\s.,;:]+$/, "") + "…";
}

/** A short, specific reason — this is what a clinician actually reads. */
function note(v, lvl) {
  if (lvl === "verified") return null;
  if (v.status === "WRONG_PAPER" || v.status === "PMID_TITLE_MISMATCH")
    return `PMID ${v.pmid} is “${clip(v.foundTitle, 70)}”`;
  if (v.status === "NOT_FOUND" && lvl === "wrong") return "PubMed has no paper with these details";
  if (v.status === "NOT_FOUND") return "not indexed by PubMed";
  if (v.status === "YEAR_MISMATCH") return `PubMed dates this to ${v.foundYear}`;
  if (v.status === "WEAK_MATCH") return "closest PubMed match is only a partial title match";
  if (v.status === "UNPARSED") return "could not be parsed as a citation";
  if (v.status === "AMBIGUOUS_TITLE") return "title too short to identify by search";
  if (v.status === "PMID_INVALID") return "the cited PMID does not exist";
  return null;
}

// ── build the provenance map ────────────────────────────────────────────────
//
// Three notions of identity are in play and conflating them loses citations:
//
//   dedupe()/cacheKey  one per unique *paper* — what was resolved, keyed on the
//                      normalised title, so two references to the same paper
//                      that differ in author list or page range share a verdict;
//   citationKey        one per unique reference *string* — how the result joins
//                      back to src/disorders.js.
//
// So the verdict is looked up per paper but written out per string. Iterating
// the deduped list here would stamp only whichever string happened to represent
// the group and leave its variants with no PMID and no entry, which the UI
// renders as an unchecked reference.
const all = collectCitations();
const pmidFor = new Map();      // citationKey -> pmid, for the inline suffix
const entries = new Map();      // citationKey -> {l, p?, n?}
const seen = new Set();
const tally = {};

for (const c of all) {
  const key = citationKey(c.raw);
  if (seen.has(key)) continue;  // same string cited by several disorders
  seen.add(key);
  const v = cache[cacheKey(c)];
  if (!v) { entries.set(key, { l: "unverified", n: "not yet checked" }); tally.unchecked = (tally.unchecked ?? 0) + 1; continue; }
  const lvl = level(c, v);
  tally[lvl] = (tally[lvl] ?? 0) + 1;
  if (lvl === "verified") {
    if (v.pmid) pmidFor.set(key, String(v.pmid));
    continue;   // verified citations carry their PMID inline; no entry needed
  }
  const e = { l: lvl };
  if (v.pmid) e.p = String(v.pmid);
  const n = note(v, lvl);
  if (n) e.n = n;
  entries.set(key, e);
}

console.log(`${all.length} citations · ${dedupe(all).length} unique papers · ${seen.size} unique reference strings`);
for (const [k, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(12)} ${String(n).padStart(4)}`);

// ── 1. append PMIDs to src/disorders.js ─────────────────────────────────────
// Line-oriented on purpose: every reference is its own double-quoted literal on
// its own line, so this never has to parse or re-serialise the module, and a
// line it does not recognise is left exactly as it was.
const src = readFileSync(DISORDERS, "utf8");
const lines = src.split(/\r?\n/);
let appended = 0, already = 0;

const out = lines.map((line) => {
  const m = line.match(/^(\s*)("(?:[^"\\]|\\.)*")(,?)\s*$/);
  if (!m) return line;
  let value;
  try { value = JSON.parse(m[2]); } catch { return line; }
  const pmid = pmidFor.get(citationKey(value));
  if (!pmid) return line;
  if (/PMID:?\s*\d/i.test(value)) { already++; return line; }
  appended++;
  const suffix = value.endsWith(".") ? ` PMID ${pmid}.` : `. PMID ${pmid}.`;
  return `${m[1]}${JSON.stringify(value + suffix)}${m[3]}`;
});

console.log(`\nsrc/disorders.js: ${appended} PMIDs to append (${already} already present)`);

// ── 2. write the generated sidecar ──────────────────────────────────────────
const sorted = [...entries.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
const body = sorted.map(([k, e]) => `  ${JSON.stringify(k)}: ${JSON.stringify(e)},`).join("\n");
const generated = `// GENERATED by scripts/apply-citation-provenance.mjs — do not edit by hand.
//
// Citations that did NOT resolve cleanly against PubMed, keyed by citationKey()
// from src/citations.js. Verified citations are absent from this map: they carry
// their PMID inline in src/disorders.js instead, which keeps the common case out
// of the bundle.
//
//   l  level  — verified | check | unverified | wrong
//   p  pmid   — the paper the citation actually resolved to, where there is one
//   n  note   — why, in the words shown to the reader
export const CITATION_PROVENANCE = {
${body}
};
`;

if (DRY) {
  console.log(`src/citation-provenance.js: ${sorted.length} entries (dry run, nothing written)`);
  console.log(`\nsample:\n${sorted.slice(0, 3).map(([k, e]) => `  ${k.slice(0, 60)}\n    ${JSON.stringify(e)}`).join("\n")}`);
} else {
  writeFileSync(DISORDERS, out.join("\n"));
  writeFileSync(OUT, generated);
  console.log(`src/citation-provenance.js: ${sorted.length} entries written`);
}
