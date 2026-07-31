// Inspect the citation state of the knowledge base, for repair work.
//
// scripts/check-citations.mjs answers "is this citation real?" across the whole
// corpus. This answers the two questions that come next, when someone is
// actually fixing them:
//
//   node scripts/show-citations.mjs              # which disorders are worst hit
//   node scripts/show-citations.mjs TYR2         # one disorder, in full
//
// The per-disorder view prints the narrative alongside the reference list on
// purpose. A withheld reference is not just a bad string to replace — the prose
// cites it by ordinal, so you need to see which claim is left unsupported before
// deciding whether to find the right paper or drop the claim.
import { DISORDERS } from "../src/disorders.js";
import { citationStatus } from "../src/citations.js";

const refsOf = (d) => {
  const narrative = d.narrative?.references ?? [];
  const followUp = (d.followUp?.references ?? []).filter((r) => !narrative.includes(r));
  return { narrative, followUp };
};

const id = process.argv[2];

if (!id) {
  // Ranked worklist. Sorted by how much of a disorder's evidence base is gone,
  // not by raw count: losing 5 of 7 references leaves a page with nothing behind
  // it, while losing 5 of 40 does not.
  const rows = DISORDERS.map((d) => {
    const { narrative, followUp } = refsOf(d);
    const all = [...narrative, ...followUp];
    const lv = all.map((r) => citationStatus(r).level);
    const withheld = lv.filter((l) => l === "wrong").length;
    const verified = lv.filter((l) => l === "verified").length;
    return { id: d.id, name: d.name, n: all.length, withheld, verified, pct: all.length ? withheld / all.length : 0 };
  }).filter((r) => r.withheld > 0);

  rows.sort((a, b) => b.pct - a.pct || b.withheld - a.withheld);
  const tot = DISORDERS.reduce((a, d) => { const { narrative, followUp } = refsOf(d); return a + narrative.length + followUp.length; }, 0);
  const totW = rows.reduce((a, r) => a + r.withheld, 0);

  console.log(`${totW}/${tot} reference slots withheld across ${rows.length} disorders\n`);
  console.log(`  disorder     withheld   verified   worst-first`);
  for (const r of rows.slice(0, 40)) {
    const bar = "█".repeat(Math.round(r.pct * 20)).padEnd(20, "·");
    console.log(`  ${r.id.padEnd(11)} ${String(r.withheld).padStart(3)}/${String(r.n).padEnd(3)} ${String(r.verified).padStart(6)}     ${bar} ${(100 * r.pct).toFixed(0)}%`);
  }
  const none = rows.filter((r) => r.verified === 0);
  if (none.length) console.log(`\n  no verified reference at all: ${none.map((r) => r.id).join(", ")}`);
  process.exit(0);
}

const d = DISORDERS.find((x) => x.id === id);
if (!d) {
  console.error(`no disorder "${id}". Try: ${DISORDERS.slice(0, 8).map((x) => x.id).join(", ")}, ...`);
  process.exit(1);
}

const { narrative, followUp } = refsOf(d);
console.log(`### ${d.id} — ${d.name} (${d.category})\n`);
const line = (r, n) => {
  const s = citationStatus(r);
  const mark = { verified: "ok  ", check: "?   ", unverified: "--  ", wrong: "GONE" }[s.level];
  console.log(`${n} ${mark} ${s.pmid ? `pmid ${s.pmid}` : ""}`);
  console.log(`     ${r}`);
  if (s.note) console.log(`     ^ ${s.note}`);
};
narrative.forEach((r, i) => line(r, `[${i + 1}]`.padStart(4)));
if (followUp.length) {
  console.log("\n-- follow-up only (not ordinal-cited by the narrative) --");
  followUp.forEach((r) => line(r, "  - "));
}

console.log("\n--- narrative: markers show which claim leans on which reference ---");
for (const [k, v] of Object.entries(d.narrative ?? {})) {
  if (typeof v !== "string") continue;
  console.log(`\n[${k}] ${v}`);
}
