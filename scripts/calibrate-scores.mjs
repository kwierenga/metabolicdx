// What does a score actually mean?
//
// golden.test.js and scoring-coverage.test.js both ask "does the right disorder
// rank first?". Neither asks what the NUMBER means. The UI turns that number
// into a word — confLevel() calls >=0.4 "HIGH" — and a clinician reading
// "87/100" will read it as "87% likely". This script measures whether that
// reading is defensible.
//
// The measure: precision per confidence band. Across every disorder's own
// textbook profile, collect every (disorder, score) pair the engine produces,
// bucket them by the band the UI would display, and ask what fraction of the
// scores in each band belong to the disorder the profile was actually built
// from. That is the calibration question: of everything the engine calls HIGH,
// how much of it is right?
//
// WHAT THIS PROVES, AND WHAT IT DOES NOT
// --------------------------------------
// The profiles are generated from each disorder's own signature — the same data
// the engine scores against — exactly as in scoring-coverage.test.js. So this
// measures the engine's INTERNAL DISCRIMINATION: given biochemistry that is
// unambiguous by construction, how cleanly does it separate one disorder from
// the other 115?
//
// It is not real-world calibration. That needs confirmed cases with known
// outcomes, including cases where the disorder was ABSENT — and the repository
// has none. A real calibration curve stays out of reach until those exist.
// Treat a good number here as a floor: the engine cannot do better on real,
// noisier data than it does on profiles built to suit it.
//
// Run: node scripts/calibrate-scores.mjs [--csv]

import { runAnalysis, initValues, confLevel } from "../src/scoring.js";
import { DISORDERS } from "../src/disorders.js";
import { ANALYTE_MAP } from "../src/analytes.js";

// Identical to scoring-coverage.test.js's generator. Kept in step deliberately:
// if that file's notion of a textbook profile changes, this must change with it.
function signatureProfile(d) {
  const v = initValues();
  const set = [];
  for (const m of d.signature ?? []) {
    if (!v[m.panel] || !(m.id in v[m.panel])) continue;
    const a = ANALYTE_MAP[m.id] ?? {};
    const hi = Number.isFinite(a.hi) ? a.hi : 1;
    const lo = Number.isFinite(a.lo) ? a.lo : 0;
    if (m.direction === "high") { v[m.panel][m.id] = String(hi > 0 ? hi * 5 : 10); set.push(m.id); }
    else if (m.direction === "low" && lo > 0) { v[m.panel][m.id] = String(lo * 0.1); set.push(m.id); }
  }
  return { values: v, set };
}

const BANDS = ["HIGH", "MODERATE", "LOW", "TRACE"];
const band = (s) => confLevel(s).label;

const tally = Object.fromEntries(BANDS.map((b) => [b, { correct: 0, wrong: 0 }]));
const perCase = [];

for (const d of DISORDERS) {
  const { values, set } = signatureProfile(d);
  if (!set.length) continue; // unreachable from entered values; nothing to measure

  const results = runAnalysis(values).results;
  const self = results.find((r) => r.id === d.id);
  const rank = results.findIndex((r) => r.id === d.id);

  // Every scored disorder in this run is a prediction. The one the profile was
  // built from is the true positive; the other 115 are false positives at
  // whatever band they land in.
  let falseHigh = 0;
  for (const r of results) {
    if (!Number.isFinite(r.score) || r.score <= 0) continue;
    const b = band(r.score);
    if (!tally[b]) continue;
    if (r.id === d.id) tally[b].correct++;
    else {
      tally[b].wrong++;
      if (b === "HIGH") falseHigh++;
    }
  }

  perCase.push({
    id: d.id,
    score: self?.score ?? 0,
    band: band(self?.score ?? 0),
    rank,
    falseHigh,
    markers: set.length,
  });
}

// ── Band precision: the headline ────────────────────────────────────────────
console.log(`\nCalibration over ${perCase.length} disorder profiles\n`);
console.log("Band precision — of every score the engine puts in this band,");
console.log("what fraction is the disorder the profile was built from?\n");
console.log("  band        in band   correct   precision");
for (const b of BANDS) {
  const { correct, wrong } = tally[b];
  const n = correct + wrong;
  const pct = n ? ((correct / n) * 100).toFixed(1) + "%" : "—";
  console.log(`  ${b.padEnd(10)} ${String(n).padStart(7)} ${String(correct).padStart(9)} ${pct.padStart(11)}`);
}

// ── False positives at the HIGH threshold ───────────────────────────────────
const fh = perCase.map((c) => c.falseHigh);
const sorted = [...fh].sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)];
const mean = (fh.reduce((a, b) => a + b, 0) / fh.length).toFixed(1);
const clean = fh.filter((n) => n === 0).length;

console.log(`\nOther disorders also scoring HIGH on the same profile:`);
console.log(`  median ${median}   mean ${mean}   max ${Math.max(...fh)}`);
console.log(`  profiles with no other HIGH call: ${clean}/${perCase.length}` +
            ` (${((clean / perCase.length) * 100).toFixed(0)}%)`);

// ── Where the true disorder's own score lands ───────────────────────────────
console.log(`\nThe true disorder's own score:`);
for (const b of BANDS) {
  const n = perCase.filter((c) => c.band === b).length;
  if (n) console.log(`  ${b.padEnd(10)} ${String(n).padStart(4)}`);
}
const scores = perCase.map((c) => c.score).sort((a, b) => a - b);
const q = (p) => scores[Math.floor(scores.length * p)].toFixed(3);
console.log(`  min ${scores[0].toFixed(3)}  p25 ${q(0.25)}  median ${q(0.5)}  p75 ${q(0.75)}  max ${scores[scores.length - 1].toFixed(3)}`);
console.log(`  scores above 1.0 (the code's claimed ceiling): ${scores.filter((s) => s > 1).length}`);

// ── Where should the HIGH threshold actually sit? ───────────────────────────
// True positives cluster well above the 0.4 the UI uses, so the gap between
// them is populated almost entirely by false positives. Sweep the threshold to
// show what precision each choice buys and what recall it costs.
console.log(`\nIf the HIGH threshold moved (recall = true disorders still called HIGH):`);
console.log("  threshold   flagged   correct   precision   recall");
for (const t of [0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
  let flagged = 0, correct = 0;
  for (const d of DISORDERS) {
    const { values, set } = signatureProfile(d);
    if (!set.length) continue;
    for (const r of runAnalysis(values).results) {
      if (!Number.isFinite(r.score) || r.score < t) continue;
      flagged++;
      if (r.id === d.id) correct++;
    }
  }
  const prec = flagged ? ((correct / flagged) * 100).toFixed(1) + "%" : "—";
  const rec = ((correct / perCase.length) * 100).toFixed(1) + "%";
  console.log(`  ${t.toFixed(2).padStart(9)} ${String(flagged).padStart(9)} ${String(correct).padStart(9)} ${prec.padStart(11)} ${rec.padStart(8)}`);
}

// ── Worst offenders, which is where to look next ────────────────────────────
const worst = [...perCase].sort((a, b) => b.falseHigh - a.falseHigh).slice(0, 12);
console.log(`\nProfiles dragging the most other disorders into HIGH:`);
for (const c of worst) {
  if (!c.falseHigh) break;
  console.log(`  ${c.id.padEnd(12)} ${String(c.falseHigh).padStart(3)} others HIGH` +
              `   own score ${c.score.toFixed(3)} (${c.band}, rank ${c.rank + 1}, ${c.markers} markers)`);
}

if (process.argv.includes("--csv")) {
  console.log(`\nid,score,band,rank,falseHigh,markers`);
  for (const c of perCase) console.log(`${c.id},${c.score.toFixed(4)},${c.band},${c.rank + 1},${c.falseHigh},${c.markers}`);
}
console.log();
