// Golden-case regression tests for the scoring engine.
//
// These pin DOWN the clinically expected behaviour of runAnalysis() so that
// edits to the large hand-maintained disorder/analyte data in App.jsx cannot
// silently break differential ranking. esbuild only catches *syntax* errors;
// these catch *logic* regressions (e.g. a deleted signature marker, a flipped
// direction, a broken ratio). Each case is a textbook profile whose expected
// top differential is not in clinical doubt.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { runAnalysis, initValues, DISORDERS } from "../App.jsx";

const ID = new Set(DISORDERS.map((d) => d.id));

// Build a values object (all panels, all analytes blank) and overlay a profile.
// profile = { PAA:{Phe:"1200"}, AC:{C8:"4"}, ... }
function profile(overrides) {
  const v = initValues();
  for (const [panel, analytes] of Object.entries(overrides)) {
    if (!v[panel]) throw new Error(`unknown panel ${panel} in test profile`);
    for (const [id, val] of Object.entries(analytes)) {
      if (!(id in v[panel])) throw new Error(`unknown analyte ${panel}.${id} in test profile`);
      v[panel][id] = String(val);
    }
  }
  return v;
}

const analyze = (overrides) => runAnalysis(profile(overrides)).results;
const rankOf = (results, id) => results.findIndex((r) => r.id === id);

describe("disorder catalogue sanity", () => {
  it("expected disorder ids exist (guards against id renames)", () => {
    for (const id of ["PKU", "MSUD", "MCAD", "GA1", "SULFOX", "MOCO"]) {
      expect(ID.has(id), `missing disorder id "${id}"`).toBe(true);
    }
  });
});

describe("golden cases — classic profile must be the top differential", () => {
  it("classic PKU: Phe very high + Tyr low → PKU ranks #1", () => {
    const r = analyze({ PAA: { Phe: 1200, Tyr: 20 } });
    expect(r[0].id).toBe("PKU");
  });

  it("classic MSUD: Leu/Ile/Val/alloIle all high → MSUD ranks #1", () => {
    const r = analyze({ PAA: { Leu: 2000, AlloIle: 10, Ile: 400, Val: 900, Ala: 300 } });
    expect(r[0].id).toBe("MSUD");
  });

  it("classic MCAD: C8 high with C6/C10 → MCAD ranks #1", () => {
    const r = analyze({ AC: { C8: 4, C6: 2, C10: 1 } });
    expect(r[0].id).toBe("MCAD");
  });

  it("classic GA-I: C5DC + glutaric + 3-OH-glutaric high → GA1 ranks #1", () => {
    const r = analyze({ AC: { C5DC: 2 }, UOA: { GA: 80, "3OHGA": 40 } });
    expect(r[0].id).toBe("GA1");
  });
});

describe("sulfite-oxidase axis differential (urate distinguishes SUOX vs MoCo)", () => {
  it("S-sulfocysteine high + NORMAL urate → isolated SUOX outranks MoCo", () => {
    const r = analyze({ UOA: { SSCys: 10 }, MISC: { UricAc: 250 } });
    const sulfox = rankOf(r, "SULFOX");
    const moco = rankOf(r, "MOCO");
    expect(sulfox).toBeGreaterThanOrEqual(0);
    expect(sulfox).toBeLessThan(moco); // SUOX ranked above MoCo
    expect(sulfox).toBeLessThan(3); // and is a top differential
  });

  it("S-sulfocysteine high + LOW urate → MoCo outranks isolated SUOX", () => {
    const r = analyze({ UOA: { SSCys: 10 }, MISC: { UricAc: 20 } });
    const sulfox = rankOf(r, "SULFOX");
    const moco = rankOf(r, "MOCO");
    expect(moco).toBeGreaterThanOrEqual(0);
    expect(moco).toBeLessThan(sulfox); // MoCo ranked above SUOX
    expect(moco).toBeLessThan(3);
  });
});

describe("negative control", () => {
  it("empty profile yields no high-confidence differential", () => {
    const { results, patterns } = runAnalysis(initValues());
    expect(Array.isArray(results)).toBe(true);
    expect(Array.isArray(patterns)).toBe(true);
    // Nothing entered → top score must not reach the HIGH-confidence band (0.4).
    if (results.length) expect(results[0].score).toBeLessThan(0.4);
  });
});
