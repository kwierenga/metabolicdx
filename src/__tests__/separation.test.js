// Separation replaces the absolute confidence band.
//
// calibrate-scores.mjs established that the raw score cannot tell a right
// leader from a wrong one (AUC 0.47) while the leader/runner-up ratio can
// (AUC 0.83). These tests pin the mechanics of that measurement: what the
// ratio is taken against, how families are handled, and that the bands sit
// where the calibration table put them.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import {
  annotateSeparation, separationLevel, runAnalysis, initValues,
  DIFFERENTIAL_FAMILIES, FAMILY_OF, CO_DIFFERENTIAL_RATIO, SEPARATION_LEVELS,
} from "../scoring.js";
import { DISORDERS } from "../disorders.js";
import { ANALYTE_MAP } from "../analytes.js";

const IDS = new Set(DISORDERS.map((d) => d.id));
const r = (id, score) => ({ id, score });

describe("separation bands", () => {
  it("map the calibration table onto labels", () => {
    expect(separationLevel(2.0).label).toBe("CLEAR LEAD");
    expect(separationLevel(1.5).label).toBe("CLEAR LEAD");
    expect(separationLevel(1.3).label).toBe("LEADS");
    expect(separationLevel(1.15).label).toBe("NARROW LEAD");
    expect(separationLevel(1.05).label).toBe("CO-DIFFERENTIAL");
    expect(separationLevel(Infinity).label).toBe("SOLE CANDIDATE");
    expect(separationLevel(null)).toBeNull();
  });

  it("are ordered from strongest to weakest and every band explains itself", () => {
    for (let i = 1; i < SEPARATION_LEVELS.length; i++)
      expect(SEPARATION_LEVELS[i].min).toBeLessThan(SEPARATION_LEVELS[i - 1].min);
    for (const l of SEPARATION_LEVELS) expect(l.note.length).toBeGreaterThan(40);
  });
});

describe("annotateSeparation", () => {
  it("measures the leader against the runner-up", () => {
    const out = annotateSeparation([r("PKU", 0.9), r("MSUD", 0.6), r("MCAD", 0.1)]);
    expect(out[0].leadRatio).toBeCloseTo(1.5);
    expect(out[0].rivalId).toBe("MSUD");
    expect(out[0].separation.label).toBe("CLEAR LEAD");
    expect(out[1].leadRatio).toBeNull();
    expect(out[1].separation).toBeNull();
  });

  it("skips same-family peers when choosing the runner-up, and lists them", () => {
    const out = annotateSeparation([r("PTPS", 0.8), r("DHPR", 0.78), r("PKU", 0.4)]);
    expect(out[0].rivalId).toBe("PKU");
    expect(out[0].leadRatio).toBeCloseTo(2.0);
    expect(out[0].familyPeers).toEqual(["DHPR"]);
    expect(out[1].familyPeers).toEqual(["PTPS"]);
    expect(out[2].familyPeers).toEqual([]);
  });

  it("flags co-differentials within 10% of the leader", () => {
    const out = annotateSeparation([r("MSUD", 1.0), r("PKU", 0.95), r("MCAD", 0.5)]);
    expect(out[1].coDifferential).toBe(true);
    expect(out[2].coDifferential).toBe(false);
    expect(out[0].coDifferential).toBe(false);
    expect(out[0].separation.label).toBe("CO-DIFFERENTIAL");
    expect(CO_DIFFERENTIAL_RATIO).toBe(1.10);
  });

  it("calls a lone scorer the sole candidate", () => {
    const out = annotateSeparation([r("TYR1", 0.7), r("PKU", 0)]);
    expect(out[0].leadRatio).toBe(Infinity);
    expect(out[0].separation.label).toBe("SOLE CANDIDATE");
  });

  it("handles an empty list", () => {
    expect(annotateSeparation([])).toEqual([]);
  });
});

describe("families", () => {
  it("name only real disorder ids, each in at most one family", () => {
    const seen = new Set();
    for (const [fam, ids] of Object.entries(DIFFERENTIAL_FAMILIES)) {
      expect(ids.length).toBeGreaterThanOrEqual(2);
      for (const id of ids) {
        expect(IDS.has(id), `${fam}: unknown disorder id ${id}`).toBe(true);
        expect(seen.has(id), `${id} is in two families`).toBe(false);
        seen.add(id);
        expect(FAMILY_OF[id]).toBe(fam);
      }
    }
  });

  it("members of a family share every discriminating marker the engine can actually score", () => {
    // The whole justification for grouping is that nothing on these panels
    // separates the members. If someone later gives one member a weight-2+
    // marker the others lack, this fails and the family has to be split —
    // which is how GSD1A/GSD3 and MMA/MCEE were kept out. Markers that can
    // never fire (a "low" marker on an analyte with no lower limit; see the
    // inert-marker ratchet in data-integrity.test.js) do not count.
    const live = (s) => !(s.direction === "low" && !(ANALYTE_MAP[s.id]?.lo > 0));
    const sigOf = (id) => (DISORDERS.find((d) => d.id === id)?.signature ?? []).filter(live);
    for (const [fam, ids] of Object.entries(DIFFERENTIAL_FAMILIES)) {
      const sigs = ids.map((id) => new Set(sigOf(id).map((s) => `${s.panel}:${s.id}`)));
      const union = new Set(sigs.flatMap((s) => [...s]));
      for (const [i, s] of sigs.entries()) {
        const missing = [...union].filter((m) => !s.has(m));
        const discriminating = missing.filter((m) => {
          const [panel, id] = m.split(":");
          return ids.some((other) => sigOf(other).some((x) => x.panel === panel && x.id === id && x.weight >= 2));
        });
        expect(discriminating, `${fam}: ${ids[i]} lacks discriminating marker(s) ${discriminating.join(", ")} that a family peer scores`).toEqual([]);
      }
    }
  });
});

describe("runAnalysis carries separation through", () => {
  it("annotates the live result list", () => {
    const v = initValues(); v.PAA.Phe = "1200"; v.PAA.Tyr = "20";
    const { results } = runAnalysis(v);
    expect(results[0].id).toBe("PKU");
    expect(typeof results[0].leadRatio).toBe("number");
    expect(results[0].separation).toBeTruthy();
    expect(results[1].leadRatio).toBeNull();
    expect(Array.isArray(results[1].familyPeers)).toBe(true);
  });

  it("sets inert markers aside instead of counting them against their own disorder", () => {
    // cblC's Met/Hcy ratio marker is "low" on a ratio whose floor is 0: it can
    // never match. Before 2026-11-13 it still diluted maxPoss and, being weight
    // 2, counted as automatic negative evidence whenever Met and Hcy were entered.
    const v = initValues(); v.PAA.Met = "10"; v.PAA.Hcy = "150"; v.AC.C3 = "8"; v.UOA.MMA = "60"; v.MISC.tHcy = "150";
    const cblc = runAnalysis(v).results.find((x) => x.id === "CBLC");
    expect(cblc.inert.map((m) => m.id)).toEqual(["MetHcy"]);
    expect(cblc.supporting.some((m) => m.id === "MetHcy")).toBe(false);
    expect(cblc.negEarned).toBe(0);
  });
});
