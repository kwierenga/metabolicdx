// Re-check the citations that already passed: does a stamped PMID name the
// paper the citation claims to be?
//
// Why this exists. A reference carrying "PMID nnnnnnnn." inline reads as
// verified everywhere downstream, and nothing looks at it again. That is the
// blind spot three defects came through in one week:
//
//   HYPER_PRO cited Liu 2002 with the right PMID, journal, volume and pages
//   under a title the paper does not have.
//   MCEE cited Dobson's cblA paper, accurately, for five claims about an enzyme
//   it never mentions.
//   GABAT cited Pearl's SSADH paper for four claims about GABA-transaminase
//   deficiency.
//
// Only the first is catchable here, but it is the commonest shape: a real paper
// wearing an invented title. The check costs nothing — every cited abstract is
// already in .abstract-cache.json, so no network is used and it can run in the
// test suite.
//
//   node scripts/check-stamped-titles.mjs          # list the mismatches
//   node scripts/check-stamped-titles.mjs --json   # same, for the test
//
// What it does NOT check: journal, volume and pages, which the abstract cache
// does not hold. A citation can pass here and still carry invented coordinates.
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DISORDERS } from "../src/disorders.js";
import { citationStatus, citationKey } from "../src/citations.js";
import { parseCitation } from "./parse-citations.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ABSTRACTS = resolve(HERE, ".abstract-cache.json");

const flatten = (s) =>
  String(s ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim();

// Words too common in this corpus to distinguish one paper from another.
const GENERIC = new Set(`deficiency disease disorder disorders syndrome inborn error errors
  metabolism metabolic acid acidemia acidaemia aciduria type patients human clinical infant
  neonatal newborn screening diagnosis management treatment gene mutations variant variants
  case report review children child adult plasma urine serum blood novel study analysis their
  with from and the for combined causes encoding new update`.split(/\s+/).filter(Boolean));

const keyWords = (t) =>
  [...new Set(flatten(t).split(" "))].filter((w) => w.length > 4 && !GENERIC.has(w));

/**
 * Deliberately lenient, for the same reason the drop folder's check is: the job
 * is catching a citation that names a DIFFERENT paper, not policing wording.
 * Half the distinctive words is enough, and a title with fewer than three of
 * them is not judged at all.
 */
export function stampedTitleMismatches() {
  const abstracts = existsSync(ABSTRACTS) ? JSON.parse(readFileSync(ABSTRACTS, "utf8")) : {};
  const out = [];
  const counts = { stamped: 0, checked: 0, noAbstract: 0, tooGeneric: 0 };
  const seen = new Set();

  for (const d of DISORDERS) {
    for (const raw of d.narrative?.references ?? []) {
      const key = citationKey(raw);
      if (seen.has(key)) continue;
      seen.add(key);

      const st = citationStatus(raw);
      if (st.level !== "verified" || !st.pmid) continue;
      counts.stamped++;

      const known = abstracts[st.pmid]?.title;
      if (!known) { counts.noAbstract++; continue; }   // never fetched; not a finding
      const cited = parseCitation(raw)?.title;
      if (!cited) { counts.noAbstract++; continue; }

      const a = flatten(cited), b = flatten(known);
      if (a === b || b.includes(a) || a.includes(b)) { counts.checked++; continue; }

      const words = keyWords(cited);
      if (words.length < 3) { counts.tooGeneric++; continue; }
      const hits = words.filter((w) => b.includes(w)).length;
      counts.checked++;
      if (hits / words.length >= 0.5) continue;
      out.push({ disorder: d.id, pmid: st.pmid, hits, of: words.length, cited, known });
    }
  }
  return { counts, mismatches: out };
}

if (process.argv[1] && process.argv[1].endsWith("check-stamped-titles.mjs")) {
  const { counts, mismatches } = stampedTitleMismatches();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ counts, mismatches }, null, 2));
  } else {
    console.log(`${counts.stamped} stamped citations; ${counts.checked} checkable against a cached title`);
    console.log(`${counts.noAbstract} have no cached abstract, ${counts.tooGeneric} have a title too generic to judge`);
    console.log(`\n${mismatches.length} name a title the paper does not have:\n`);
    for (const m of mismatches) {
      console.log(`${m.disorder.padEnd(10)} PMID ${m.pmid}  (${m.hits}/${m.of} key words)`);
      console.log(`  cited : ${m.cited}`);
      console.log(`  pubmed: ${m.known}\n`);
    }
  }
}
