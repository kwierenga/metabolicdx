// Stored-case value normalisation.
//
// This guards a crash found by driving the built app: opening any seeded demo
// case blanked the editor with "Cannot convert undefined or null to object".
// The seeded cases carry only a PAA panel, but the CaseEditor panel tabs do
// `Object.values(values[p.id])` for all six panels — so the first missing panel
// threw during render and took the whole screen with it. Any case saved by an
// older build, or imported from elsewhere, could be partial the same way.
import { describe, it, expect } from "vitest";
import { initValues, normalizeValues, countEntered } from "../scoring.js";

const PANELS = ["PAA", "UOA", "AC", "CAR", "UAG", "MISC"];

describe("normalizeValues", () => {
  it("fills in every panel the app indexes, whatever the input", () => {
    for (const input of [undefined, null, {}, { PAA: { Phe: "666" } }]) {
      const v = normalizeValues(input);
      expect(Object.keys(v).sort()).toEqual([...PANELS].sort());
      // The crash was Object.values() on a missing panel — assert it cannot throw.
      for (const p of PANELS) expect(() => Object.values(v[p])).not.toThrow();
    }
  });

  it("preserves entered values from the panels that are present", () => {
    const v = normalizeValues({ PAA: { Phe: "666", Tyr: "63" } });
    expect(v.PAA.Phe).toBe("666");
    expect(v.PAA.Tyr).toBe("63");
    expect(countEntered(v)).toBe(2);
  });

  it("leaves untouched analytes empty rather than undefined", () => {
    const v = normalizeValues({ PAA: { Phe: "666" } });
    expect(v.PAA.Ala).toBe("");
    // countEntered filters on !== "", so an undefined would be counted as entered.
    expect(countEntered(v)).toBe(1);
  });

  it("coerces numbers to strings, since the inputs are text fields", () => {
    const v = normalizeValues({ PAA: { Phe: 666 } });
    expect(v.PAA.Phe).toBe("666");
  });

  it("drops ids and panels this build does not know, instead of carrying them into scoring", () => {
    const v = normalizeValues({ PAA: { Phe: "666", NotAnAnalyte: "1" }, NOPE: { x: "1" } });
    expect("NotAnAnalyte" in v.PAA).toBe(false);
    expect("NOPE" in v).toBe(false);
    expect(countEntered(v)).toBe(1);
  });

  it("treats a null analyte value as empty, not as the string 'null'", () => {
    const v = normalizeValues({ PAA: { Phe: null, Tyr: undefined } });
    expect(v.PAA.Phe).toBe("");
    expect(v.PAA.Tyr).toBe("");
    expect(countEntered(v)).toBe(0);
  });

  it("matches initValues() shape exactly for empty input", () => {
    expect(normalizeValues(undefined)).toEqual(initValues());
  });

  it("tolerates a panel whose value is null", () => {
    expect(() => normalizeValues({ PAA: null, UOA: undefined })).not.toThrow();
    expect(countEntered(normalizeValues({ PAA: null }))).toBe(0);
  });
});
