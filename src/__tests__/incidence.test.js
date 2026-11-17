// Birth prevalence on disorders must be sourced and sane.
//
// `incidence` is the only base-rate prior the engine has. Every entry must point
// at a verified reference (the standing rule: nothing on the site without a
// source), carry a plausible figure, and the optional prevalence weighting must
// behave as documented. The floor ratchets upward as more disorders are sourced.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { DISORDERS } from "../disorders.js";
import { REFERENCES } from "../references.js";
import { runAnalysis, initValues, posteriorOdds, rankByPosterior } from "../scoring.js";

const WITH = DISORDERS.filter((d) => d.incidence);
const FLOOR = 22; // sourced on 2026-11-13; raise as coverage grows, never lower

describe("incidence data", () => {
  it(`at least ${FLOOR} disorders carry a sourced birth prevalence`, () => {
    expect(WITH.length).toBeGreaterThanOrEqual(FLOOR);
  });

  it("every entry has a positive per-100,000 figure, a scope, and a reference that exists and resolves", () => {
    const bad = [];
    for (const d of WITH) {
      const i = d.incidence;
      if (!(i.per100k > 0 && i.per100k < 1000)) bad.push(`${d.id}: per100k ${i.per100k}`);
      if (typeof i.scope !== "string" || i.scope.length < 10) bad.push(`${d.id}: scope missing`);
      const ref = REFERENCES[i.ref];
      if (!ref) bad.push(`${d.id}: ref "${i.ref}" not in REFERENCES`);
      else if (!ref.pmid && !ref.doi) bad.push(`${d.id}: ref "${i.ref}" has no PMID or DOI`);
      if (i.range) {
        if (!(Array.isArray(i.range) && i.range.length === 2)) bad.push(`${d.id}: range malformed`);
        else {
          const [lo, hi] = i.range;
          if (!(lo <= hi)) bad.push(`${d.id}: range not ordered`);
          if (!(i.per100k >= lo - 1e-9 && i.per100k <= hi + 1e-9)) bad.push(`${d.id}: per100k ${i.per100k} outside range [${lo}, ${hi}]`);
        }
      }
    }
    expect(bad, `\n  - ${bad.join("\n  - ")}\n`).toEqual([]);
  });

  it("the common screened disorders are among those sourced", () => {
    for (const id of ["PKU", "MCAD", "MSUD", "PA", "MMA", "IVA", "OTC", "VLCAD"])
      expect(WITH.some((d) => d.id === id), `${id} has no incidence`).toBe(true);
  });

  it("reads sensibly as 1-in-N births", () => {
    const pku = WITH.find((d) => d.id === "PKU").incidence;
    const oneIn = Math.round(100000 / pku.per100k);
    expect(oneIn).toBeGreaterThan(10000);
    expect(oneIn).toBeLessThan(20000);
  });
});

describe("prevalence weighting", () => {
  const v = initValues(); v.PAA.Phe = "1200"; v.PAA.Tyr = "20";
  const { results } = runAnalysis(v);

  it("gives posterior odds only where both a prevalence and an LR exist", () => {
    const pku = results.find((r) => r.id === "PKU");
    expect(pku.incidence).toBeTruthy();
    expect(posteriorOdds(pku)).toBeGreaterThan(0);
    expect(posteriorOdds({ incidence: null, lrProduct: { lrProduct: 10 } })).toBeNull();
    expect(posteriorOdds({ incidence: { per100k: 1 }, lrProduct: null })).toBeNull();
  });

  it("is prior odds times the LR product", () => {
    const r = { incidence: { per100k: 1000 }, lrProduct: { lrProduct: 50 } }; // p = 0.01
    expect(posteriorOdds(r)).toBeCloseTo((0.01 / 0.99) * 50, 9);
  });

  it("re-orders candidates with a posterior first and keeps the rest in biochemical order", () => {
    const ranked = rankByPosterior(results);
    expect(ranked.length).toBe(results.length);
    const withP = ranked.filter((r) => r.posteriorOdds != null);
    const without = ranked.filter((r) => r.posteriorOdds == null);
    for (let i = 1; i < withP.length; i++) expect(withP[i - 1].posteriorOdds).toBeGreaterThanOrEqual(withP[i].posteriorOdds);
    expect(ranked.slice(withP.length).map((r) => r.id)).toEqual(without.map((r) => r.id));
    expect(without.map((r) => r.id)).toEqual(results.filter((r) => posteriorOdds(r) == null).map((r) => r.id));
  });
});
