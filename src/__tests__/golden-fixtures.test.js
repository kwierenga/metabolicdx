// Textbook profiles whose top differential is not in clinical doubt.
//
// golden.test.js pins six. These add the classic presentations of the common
// organic acidaemias, urea cycle defects, fatty-acid oxidation disorders and a
// few single-marker disorders, written as multiples of the reference limits so
// they survive a reference-interval edit. They are vignettes, not patients.
//
// Three kinds of expectation:
//   top          — the disorder must rank first
//   within       — it must rank inside the first N (shared biochemistry)
//   above        — disorder A must outrank disorder B (a known discriminator)
//
// `fails` marks a vignette the engine gets WRONG today. It runs as it.fails: the
// suite stays green while the gap is on record, and the day the engine starts
// ranking it correctly the test fails loudly so the marker can be promoted.
// The six recorded on 2026-11-13 share one mechanism: a disorder with two or
// three markers, all entered and all abnormal, outranks the classic disorder
// whose larger signature is only partly entered — the coverage/complexity terms
// reward completeness over specificity, and there is no rule that makes a
// pathognomonic marker (succinylacetone, orotic acid) decisive or exclusionary.
// Fixing that is a scoring change with clinical consequences; it is reported,
// not made, here.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { runAnalysis, initValues } from "../scoring.js";
import { ANALYTE_MAP } from "../analytes.js";

// k times the upper limit; for lows, k times the lower limit (or the upper when the floor is 0).
const hi = (id, k) => { const a = ANALYTE_MAP[id]; if (!a) throw new Error(`unknown analyte ${id}`); return String(+(a.hi * k).toPrecision(4)); };
const lo = (id, k) => { const a = ANALYTE_MAP[id]; if (!a) throw new Error(`unknown analyte ${id}`); return String(+((a.lo > 0 ? a.lo : a.hi) * k).toPrecision(4)); };

function profile(over) {
  const v = initValues();
  for (const [panel, vals] of Object.entries(over)) {
    if (!v[panel]) throw new Error(`unknown panel ${panel}`);
    for (const [id, val] of Object.entries(vals)) {
      if (!(id in v[panel])) throw new Error(`unknown analyte ${panel}.${id}`);
      v[panel][id] = val;
    }
  }
  return v;
}
const rankOf = (results, id) => results.findIndex((r) => r.id === id);

const CASES = [
  { name: "propionic acidaemia: C3 with 3-OH-propionate, methylcitrate and propionylglycine; MMA normal",
    profile: { AC: { C3: hi("C3", 6), C2: hi("C2", 0.8) }, UOA: { "3OHprop": hi("3OHprop", 8), MCA: hi("MCA", 10), PG: hi("PG", 5), MMA: hi("MMA", 0.5) }, PAA: { Gly: hi("Gly", 2) }, MISC: { Ammonia: hi("Ammonia", 3) } },
    top: "PA" },
  { name: "isolated methylmalonic acidaemia: C3 with massive MMA and methylcitrate; homocysteine normal",
    profile: { AC: { C3: hi("C3", 6) }, UOA: { MMA: hi("MMA", 20), MCA: hi("MCA", 5), "3OHprop": hi("3OHprop", 3) }, PAA: { Gly: hi("Gly", 2), Hcy: hi("Hcy", 0.5) }, MISC: { tHcy: hi("tHcy", 0.5) } },
    top: "MMA",
    fails: "MCEE (2 markers, both satisfied) edges MMA (11 markers, 5 entered): completeness outweighs the classic pattern" },
  { name: "cblC: C3 and MMA with raised homocysteine and low methionine",
    profile: { AC: { C3: hi("C3", 4) }, UOA: { MMA: hi("MMA", 5) }, PAA: { Hcy: hi("Hcy", 8), Met: lo("Met", 0.5) }, MISC: { tHcy: hi("tHcy", 8) } },
    top: "CBLC",
    fails: "TCN2 / cblF / cblJ (3–5 markers) outrank cblC: same completeness effect within the combined MMA–homocystinuria family" },
  { name: "isovaleric acidaemia: C5 with isovalerylglycine",
    profile: { AC: { C5: hi("C5", 8) }, UOA: { IVG: hi("IVG", 10), "3OHIV": hi("3OHIV", 3) } },
    top: "IVA" },
  { name: "OTC deficiency: hyperammonaemia, high glutamine, low citrulline and arginine, orotic aciduria",
    profile: { PAA: { Gln: hi("Gln", 2.5), Cit: lo("Cit", 0.1), Arg: lo("Arg", 0.4) }, UOA: { Orotic: hi("Orotic", 10) }, MISC: { Ammonia: hi("Ammonia", 6) } },
    top: "OTC",
    fails: "NAGS outranks OTC despite orotic aciduria ×10: no exclusionary-marker mechanism, so high orotic acid does not count AGAINST the proximal defects" },
  { name: "CPS1: the same picture with orotic acid NORMAL ranks the proximal defect above OTC",
    profile: { PAA: { Gln: hi("Gln", 2.5), Cit: lo("Cit", 0.1), Arg: lo("Arg", 0.4) }, UOA: { Orotic: hi("Orotic", 0.5) }, MISC: { Ammonia: hi("Ammonia", 6) } },
    above: ["CPS1", "OTC"], within: { id: "CPS1", rank: 3 } },
  { name: "citrullinaemia type I: massive citrulline",
    profile: { PAA: { Cit: hi("Cit", 20), Arg: lo("Arg", 0.5), Gln: hi("Gln", 1.5) }, UOA: { Orotic: hi("Orotic", 3) }, MISC: { Ammonia: hi("Ammonia", 4) } },
    top: "CITR1" },
  { name: "argininosuccinic aciduria: argininosuccinate with citrulline",
    profile: { PAA: { ASA: hi("ASA", 50), Cit: hi("Cit", 4) }, MISC: { Ammonia: hi("Ammonia", 3) } },
    top: "ASA_AC" },
  { name: "argininaemia: arginine high with orotic aciduria",
    profile: { PAA: { Arg: hi("Arg", 5) }, UOA: { Orotic: hi("Orotic", 3) } },
    top: "ARG1" },
  { name: "tyrosinaemia type I: succinylacetone",
    profile: { UOA: { SA: hi("SA", 20), "4OHpp": hi("4OHpp", 3) }, PAA: { Tyr: hi("Tyr", 3), Met: hi("Met", 2) } },
    top: "TYR1",
    fails: "TYR3 (2 markers) edges TYR1 although succinylacetone is pathognomonic: weight 3 caps a marker's influence and nothing makes it decisive" },
  { name: "classical homocystinuria (CBS): methionine and homocysteine high",
    profile: { PAA: { Met: hi("Met", 4), Hcy: hi("Hcy", 10) }, MISC: { tHcy: hi("tHcy", 8) } },
    top: "CBS",
    fails: "TCN2 (3 markers, 2 entered and satisfied) outranks CBS: completeness effect" },
  { name: "MSUD: branched-chain amino acids with alloisoleucine",
    profile: { PAA: { Leu: hi("Leu", 6), Ile: hi("Ile", 4), Val: hi("Val", 3), AlloIle: hi("AlloIle", 10) } },
    top: "MSUD" },
  { name: "VLCAD: C14:1 with C14 and C16",
    profile: { AC: { C14_1: hi("C14_1", 8), C14: hi("C14", 4), C16: hi("C16", 2) } },
    top: "VLCAD" },
  { name: "LCHAD/TFP: long-chain 3-hydroxyacylcarnitines",
    profile: { AC: { C16OH: hi("C16OH", 10), C18_1OH: hi("C18_1OH", 8), C18OH: hi("C18OH", 5), C14OH: hi("C14OH", 4) } },
    top: "LCHAD" },
  { name: "CPT1A: free carnitine high with long-chain species low",
    profile: { AC: { C0: hi("C0", 2.5), C16: lo("C16", 0.3), C18: lo("C18", 0.3) } },
    top: "CPT1" },
  { name: "primary carnitine deficiency: free and total carnitine very low",
    profile: { AC: { C0: lo("C0", 0.1) }, CAR: { CarFree: lo("CarFree", 0.1), CarTotal: lo("CarTotal", 0.15) } },
    top: "PCD" },
  { name: "MADD/GA2: every chain length raised with ethylmalonate, glutarate and adipate",
    profile: { AC: { C4: hi("C4", 5), C5: hi("C5", 4), C8: hi("C8", 4), C10: hi("C10", 4), C12: hi("C12", 3), C14: hi("C14", 3), C16: hi("C16", 2) }, UOA: { EMA: hi("EMA", 6), GA: hi("GA", 4), Adipic: hi("Adipic", 4) } },
    within: { id: "GA2", rank: 2 },
    fails: "RFVT, SCAD and ETHE1D outrank GA2 on a pan-chain-length profile: RFVT is a genuine mimic (secondary MADD); SCAD and ETHE1D win on C4/EMA completeness" },
  { name: "HMG-CoA lyase: C5-OH and C6-DC with 3-OH-3-methylglutarate",
    profile: { AC: { C5OH: hi("C5OH", 5), C6DC: hi("C6DC", 5) }, UOA: { HMG: hi("HMG", 10), "3OHIV": hi("3OHIV", 3), "3MGA": hi("3MGA", 3) } },
    top: "HMGCL" },
  { name: "3-MCC: C5-OH with 3-methylcrotonylglycine; HMG normal",
    profile: { AC: { C5OH: hi("C5OH", 6) }, UOA: { MCG: hi("MCG", 10), "3OHIV": hi("3OHIV", 6), HMG: hi("HMG", 0.5) } },
    top: "MCC" },
  { name: "GAMT deficiency: plasma guanidinoacetate high, creatine low",
    profile: { MISC: { pGAA: hi("pGAA", 10), pCreat: lo("pCreat", 0.2) } },
    top: "GAMT" },
  { name: "SSADH deficiency: 4-hydroxybutyrate",
    profile: { UOA: { "4OHbut": hi("4OHbut", 20) } },
    top: "SSADH" },
  { name: "alkaptonuria: homogentisate",
    profile: { UOA: { HGA: hi("HGA", 50) } },
    top: "ALKAPT" },
  { name: "nonketotic hyperglycinaemia: isolated plasma glycine with C3 normal",
    profile: { PAA: { Gly: hi("Gly", 5) }, AC: { C3: hi("C3", 0.5) } },
    within: { id: "NKH", rank: 3 } },
];

describe("textbook profiles rank as a clinician would expect", () => {
  for (const c of CASES) {
    const run = c.fails ? it.fails : it;
    run(c.fails ? `${c.name} — KNOWN GAP: ${c.fails}` : c.name, () => {
      const { results } = runAnalysis(profile(c.profile));
      const ids = results.slice(0, 5).map((r) => `${r.id}(${r.score.toFixed(2)})`).join(" > ");
      if (c.top) expect(results[0]?.id, `top 5: ${ids}`).toBe(c.top);
      if (c.within) {
        const k = rankOf(results, c.within.id);
        expect(k, `${c.within.id} not found`).toBeGreaterThanOrEqual(0);
        expect(k, `${c.within.id} ranked ${k + 1}; top 5: ${ids}`).toBeLessThan(c.within.rank);
      }
      if (c.above) {
        const [a, b] = c.above;
        const ka = rankOf(results, a), kb = rankOf(results, b);
        expect(ka, `${a} not found`).toBeGreaterThanOrEqual(0);
        expect(ka < kb || kb < 0, `${a} (rank ${ka + 1}) should outrank ${b} (rank ${kb + 1}); top 5: ${ids}`).toBe(true);
      }
    });
  }

  it("records the known gaps explicitly, so a fix is noticed", () => {
    expect(CASES.filter((c) => c.fails).length).toBe(6);
  });
});
