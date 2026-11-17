// Tests for schema-constrained lab-report extraction.
//
// The failure mode this guards is silent: mergeExtracted() drops any analyte id
// it does not recognise, so before the schema existed a mis-mapped analyte
// simply disappeared from the case with no error anywhere. These assertions pin
// the schema that makes that structurally impossible, the fold step that
// rejects anything that slips through anyway, and — since 2026-11-13 — the unit
// handling: a value in the wrong unit is converted when the arithmetic is
// unambiguous and otherwise kept OUT of the case with a stated reason.
import { describe, it, expect } from "vitest";
import { EXTRACTION_SCHEMA, EXTRACTABLE_IDS, foldExtractedValues } from "../extraction.js";
import {
  PANEL_ANALYTES,
  ANALYTE_MAP,
  AC_RATIOS,
  PAA_RATIOS,
  UOA_RATIOS,
} from "../analytes.js";

const itemProps = EXTRACTION_SCHEMA.properties.values.items.properties;

describe("extraction schema covers exactly the enterable analytes", () => {
  it("enumerates every analyte in every panel", () => {
    const expected = Object.values(PANEL_ANALYTES).flat().map((a) => a.id);
    expect([...itemProps.id.enum].sort()).toEqual([...expected].sort());
    expect(EXTRACTABLE_IDS.length).toBe(expected.length);
  });

  it("every enumerated id resolves in ANALYTE_MAP", () => {
    const unresolved = itemProps.id.enum.filter((id) => !(id in ANALYTE_MAP));
    expect(unresolved, `unresolved ids: ${unresolved.join(", ")}`).toEqual([]);
  });

  it("excludes derived ratios — the app computes those itself", () => {
    const ratios = [...AC_RATIOS, ...PAA_RATIOS, ...UOA_RATIOS].map((r) => r.id);
    const leaked = ratios.filter((id) => itemProps.id.enum.includes(id));
    expect(leaked, `ratios must not be extractable: ${leaked.join(", ")}`).toEqual([]);
  });

  it("enumerates the panels, requires a numeric value and asks for the printed unit", () => {
    expect([...itemProps.panel.enum].sort()).toEqual(Object.keys(PANEL_ANALYTES).sort());
    expect(itemProps.value.type).toBe("number");
    expect(itemProps.unit.type).toBe("string");
    expect(itemProps.unit.description).toMatch(/as printed/);
  });
});

describe("extraction schema is valid for structured outputs", () => {
  it("closes every object and marks its fields required", () => {
    expect(EXTRACTION_SCHEMA.additionalProperties).toBe(false);
    expect(EXTRACTION_SCHEMA.required).toEqual(["values"]);
    const items = EXTRACTION_SCHEMA.properties.values.items;
    expect(items.additionalProperties).toBe(false);
    expect([...items.required].sort()).toEqual(["id", "panel", "unit", "value"]);
  });

  it("uses no unsupported JSON Schema constraints", () => {
    // minLength/maximum/multipleOf etc. are rejected by structured outputs.
    const banned = ["minimum", "maximum", "multipleOf", "minLength", "maxLength", "pattern", "$ref"];
    const json = JSON.stringify(EXTRACTION_SCHEMA);
    for (const k of banned) expect(json.includes(`"${k}"`), `schema uses ${k}`).toBe(false);
  });
});

describe("foldExtractedValues — units", () => {
  it("passes panel-unit values through and reports nothing converted", () => {
    const out = foldExtractedValues({ values: [
      { panel: "PAA", id: "Phe", value: 1200, unit: "µmol/L" },
      { panel: "UOA", id: "MMA", value: 42, unit: "mmol/mol creat" },
    ] });
    expect(out.values).toEqual({ PAA: { Phe: 1200 }, UOA: { MMA: 42 } });
    expect(out.converted).toEqual([]);
    expect(out.skipped).toEqual([]);
  });

  it("converts a mg/dL amino acid to µmol/L and says so", () => {
    const out = foldExtractedValues({ values: [{ panel: "PAA", id: "Phe", value: 20, unit: "mg/dL" }] });
    expect(out.values.PAA.Phe).toBeCloseTo(1211, 0);
    expect(out.converted).toHaveLength(1);
    expect(out.converted[0]).toMatchObject({ id: "Phe", from: "mg/dL", to: "µmol/L", raw: 20 });
  });

  it("treats µmol/mmol creatinine as the panel unit for urine analytes", () => {
    const out = foldExtractedValues({ values: [{ panel: "UOA", id: "GA", value: 80, unit: "umol/mmol creat" }] });
    expect(out.values.UOA.GA).toBe(80);
    expect(out.converted).toEqual([]);
  });

  it("keeps an inconvertible value OUT of the case and names the reason", () => {
    // Urine reported per litre: cannot be normalised without the creatinine.
    const out = foldExtractedValues({ values: [
      { panel: "UOA", id: "MMA", value: 500, unit: "µmol/L" },
      { panel: "AC", id: "C8", value: 2, unit: "mg/dL" },
    ] });
    expect(out.values).toEqual({});
    expect(out.skipped).toHaveLength(2);
    expect(out.skipped[0]).toMatchObject({ id: "MMA", from: "µmol/L", to: "mmol/mol Cr" });
    expect(out.skipped[0].reason).toMatch(/creatinine/);
    expect(out.skipped[1].reason).toMatch(/molar mass/);
  });

  it("drops rows with an unknown panel/analyte pairing or a non-numeric value", () => {
    const out = foldExtractedValues({ values: [
      { panel: "AC", id: "Phe", value: 1, unit: "µmol/L" },      // Phe is not an AC analyte
      { panel: "PAA", id: "Phe", value: "high", unit: "µmol/L" },
      { panel: "PAA", id: "Tyr", value: 50, unit: "" },           // blank unit → panel unit assumed? No: "" is "ratio"
    ] });
    expect(out.dropped).toBe(2);
    // A blank unit on a concentration analyte is NOT assumed to be the panel
    // unit — it is refused, so a report with no printed units is entered by hand.
    expect(out.values).toEqual({});
    expect(out.skipped[0]).toMatchObject({ id: "Tyr" });
  });
});
