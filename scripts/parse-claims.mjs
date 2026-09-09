// Join the narrative prose to the references it cites.
//
// check-citations.mjs asks "is this a real paper?" and check-relevance.mjs asks
// "is it about the right disorder?". Neither can ask the question that actually
// matters — "does this paper support *this sentence*?" — because nothing in the
// repository has ever parsed the `[1,4]` markers in the prose. This module does
// only that join; judge-claims.mjs does the judging.
//
// Two measured facts shape the design, both of which contradict the obvious
// approach (see docs/claim-support-checker.md):
//
//   1. Citation is PARAGRAPH-level, not sentence-level. Of ~1,700 substantive
//      sentences carrying no marker, all but ~20 sit inside a paragraph that is
//      cited elsewhere. Treating an unmarked sentence as unsourced would report
//      about 1,676 findings that are not findings. Only a paragraph with no
//      marker anywhere is evidence of anything.
//
//   2. The marker grammar is trivial. Across the whole corpus exactly four
//      shapes occur — [N], [N,N], [N,N,N], [N,N,N,N] — with no ranges, no
//      letters and no nesting, and not one marker points past the end of its
//      reference list. The parser can therefore be strict: anything that does
//      not match is a defect worth reporting, not a shape to accommodate.
//
// Kept free of network access so it can be unit-tested, in the same spirit as
// parse-citations.mjs.
import { DISORDERS } from "../src/disorders.js";
import { citationStatus, citationText } from "../src/citations.js";

/**
 * A citation marker: one or more reference numbers in square brackets.
 * Deliberately strict — see note 2 above. `[1,4]` and `[1, 4]` both parse;
 * `[1-3]`, `[a]` and `[see 4]` do not, and are reported by findMalformed().
 */
export const MARKER = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

/** Bracketed runs that look like citations but do not parse as markers. */
const MALFORMED = /\[[^\]]*\]/g;

/**
 * Sentence boundaries in clinical prose.
 *
 * Requiring an uppercase letter or an opening bracket after the break handles
 * the corpus's real hazards for free: decimals ("~0.78"), ratios
 * ("1:111,000–1:232,000") and dosages ("100 mg/kg/day") never break, because a
 * digit cannot start the next sentence. The abbreviation guard covers what is
 * left: the short forms that genuinely appear mid-sentence before a capital,
 * such as "vs. MMUT" and "e.g. 3-MCC".
 *
 * "et al." is deliberately NOT guarded. It ends sentences in this prose as
 * often as it sits inside them ("described by Ghadimi et al. in 1965" is
 * already safe, because a lowercase word follows), and guarding it merged
 * genuine sentence pairs.
 */
const ABBREV = /\b(?:e\.g|i\.e|cf|vs|approx|Dr|Prof|Fig|ca)\.\s*$/;

export function splitSentences(text) {
  const out = [];
  let buf = "";
  for (const piece of String(text ?? "").split(/(?<=[.!?])\s+(?=[A-Z(])/)) {
    buf = buf ? `${buf} ${piece}` : piece;
    if (ABBREV.test(buf)) continue;   // break fell inside an abbreviation
    out.push(buf);
    buf = "";
  }
  if (buf) out.push(buf);
  return out.map((s) => s.trim()).filter(Boolean);
}

/** The reference numbers a string cites, in order, deduplicated. */
export function markersIn(text) {
  const seen = new Set();
  for (const m of String(text ?? "").matchAll(MARKER)) {
    for (const n of m[1].split(",")) {
      const v = parseInt(n.trim(), 10);
      if (Number.isFinite(v)) seen.add(v);
    }
  }
  return [...seen];
}

/** Bracketed runs that are not valid markers — `[1-3]`, `[see 4]`, `[a]`. */
export function findMalformed(text) {
  const bad = [];
  for (const m of String(text ?? "").matchAll(MALFORMED)) {
    const inner = m[0].slice(1, -1);
    if (!/^\s*\d+(\s*,\s*\d+)*\s*$/.test(inner)) bad.push(m[0]);
  }
  return bad;
}

/** Prose blocks of a disorder's narrative, in declaration order. */
function proseBlocks(d) {
  const out = [];
  for (const [field, val] of Object.entries(d.narrative ?? {})) {
    if (field === "references") continue;
    if (typeof val === "string") out.push([field, val]);
    else if (Array.isArray(val) && val.every((x) => typeof x === "string")) out.push([field, val.join(" ")]);
  }
  return out;
}

/**
 * Every claim in the knowledge base, with the references it cites resolved.
 *
 * A *claim* is a sentence that carries at least one marker. Its `paragraph` is
 * the whole prose block it came from, which the judge needs as context: the
 * corpus cites at paragraph granularity, so a sentence read alone frequently
 * looks less supported than it is.
 *
 * Sentences shorter than MIN_CHARS are skipped. They are section labels and
 * sentence fragments ("Acute:", "Poorest of the BH4 disorders."), and carry no
 * checkable assertion.
 */
export const MIN_CHARS = 25;

export function collectClaims() {
  const claims = [];
  for (const d of DISORDERS) {
    const refs = d.narrative?.references ?? [];
    if (!refs.length) continue;
    for (const [field, prose] of proseBlocks(d)) {
      splitSentences(prose).forEach((text, i) => {
        if (text.length < MIN_CHARS) return;
        const nums = markersIn(text);
        if (!nums.length) return;
        claims.push({
          id: `${d.id}.${field}.${i}`,
          disorder: d.id,
          disorderName: d.name,
          gene: d.gene ?? null,
          field,
          text,
          paragraph: prose,
          refs: nums.map((n) => {
            const raw = refs[n - 1];
            if (!raw) return { n, raw: null, pmid: null, level: "missing" };
            const s = citationStatus(raw);
            return { n, raw, text: citationText(raw), pmid: s.pmid, level: s.level };
          }),
        });
      });
    }
  }
  return claims;
}

/**
 * Everything the join can establish without reading a single abstract.
 *
 * All four buckets are deterministic, which is what makes them safe to ratchet
 * in the test suite — unlike anything a language model returns.
 */
export function auditClaims(claims = collectClaims()) {
  const orphanBlocks = [];     // prose block citing nothing at all
  const outOfRange = [];       // marker past the end of the reference list
  const malformed = [];        // bracketed run that is not a valid marker
  const allWithheld = [];      // every cited reference is suppressed
  const unassessable = [];     // no cited reference resolves to a PubMed paper

  for (const d of DISORDERS) {
    if (!(d.narrative?.references ?? []).length) continue;
    for (const [field, prose] of proseBlocks(d)) {
      for (const bad of findMalformed(prose)) malformed.push({ disorder: d.id, field, marker: bad });
      if (markersIn(prose).length) continue;
      for (const text of splitSentences(prose)) {
        if (text.length >= MIN_CHARS) orphanBlocks.push({ disorder: d.id, field, text });
      }
    }
  }

  for (const c of claims) {
    for (const r of c.refs) if (r.level === "missing") outOfRange.push({ id: c.id, n: r.n });
    if (c.refs.every((r) => r.level === "wrong")) allWithheld.push(c);
    else if (!c.refs.some((r) => r.pmid && r.level !== "wrong")) unassessable.push(c);
  }

  return { orphanBlocks, outOfRange, malformed, allWithheld, unassessable };
}

/** The (claim, reference) pairs a judge could actually assess, grouped by paper. */
export function judgeablePairs(claims = collectClaims()) {
  const byPmid = new Map();
  for (const c of claims) {
    for (const r of c.refs) {
      if (!r.pmid || r.level === "wrong") continue;
      if (!byPmid.has(r.pmid)) byPmid.set(r.pmid, { pmid: r.pmid, citation: r.text, claims: [] });
      byPmid.get(r.pmid).claims.push(c);
    }
  }
  return [...byPmid.values()];
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("parse-claims.mjs")) {
  const claims = collectClaims();
  const groups = judgeablePairs(claims);
  const a = auditClaims(claims);
  console.log(`claims (sentences with a marker) : ${claims.length}`);
  console.log(`claim-reference pairs            : ${claims.reduce((n, c) => n + c.refs.length, 0)}`);
  console.log(`judgeable, grouped by paper      : ${groups.length} papers`);
  console.log(`  mean claims per paper          : ${(claims.reduce((n, c) => n + c.refs.filter((r) => r.pmid && r.level !== "wrong").length, 0) / groups.length).toFixed(2)}`);
  console.log(`prose blocks citing nothing      : ${new Set(a.orphanBlocks.map((o) => `${o.disorder}.${o.field}`)).size} (${a.orphanBlocks.length} sentences)`);
  console.log(`markers out of range             : ${a.outOfRange.length}`);
  console.log(`malformed markers                : ${a.malformed.length}`);
  console.log(`claims sourced only to withheld  : ${a.allWithheld.length}`);
  console.log(`claims with no PubMed source     : ${a.unassessable.length}`);

  if (process.argv.includes("--report")) {
    const section = (title, rows) => {
      console.log(`\n--- ${title} (${rows.length}) ---`);
      for (const r of rows) console.log("  " + r);
    };
    section("prose blocks citing nothing at all", a.orphanBlocks.map((o) => `${o.disorder}.${o.field}: ${o.text.slice(0, 120)}`));
    if (a.outOfRange.length) section("markers past the end of the reference list", a.outOfRange.map((o) => `${o.id} -> [${o.n}]`));
    if (a.malformed.length) section("bracketed runs that are not valid markers", a.malformed.map((m) => `${m.disorder}.${m.field}: ${m.marker}`));
    section("claims whose every source is withheld", a.allWithheld.map((c) => `${c.id}: ${c.text.slice(0, 120)}`));
    section("claims with no PubMed-resolvable source", a.unassessable.map((c) => `${c.id} [${c.refs.map((r) => r.level).join(",")}]: ${c.text.slice(0, 100)}`));
  }
}
