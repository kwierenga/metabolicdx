// Tests for schema-constrained lab-report extraction.
//
// The failure mode this guards is silent: mergeExtracted() drops any analyte id
// it does not recognise, so before the schema existed a mis-mapped analyte
// simply disappeared from the case with no error anywhere. These assertions pin
// the schema that makes that structurally impossible, and the fold step that
// rejects anything that slips through anyway.
import { describe, it, expect } from "vitest";
import {
  EXTRACTION_SCHEMA,
  EXTRACTABLE_IDS,
  PANEL_ANALYTES,
  ANALYTE_MAP,
  AC_RATIOS,
  PAA_RATIOS,
  UOA_RATIOS,
} from "../App.jsx";

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

  it("enumerates the panels and requires a numeric value", () => {
    expect([...itemProps.panel.enum].sort()).toEqual(Object.keys(PANEL_ANALYTES).sort());
    expect(itemProps.value.type).toBe("number");
  });
});

describe("extraction schema is valid for structured outputs", () => {
  it("closes every object and marks its fields required", () => {
    expect(EXTRACTION_SCHEMA.additionalProperties).toBe(false);
    expect(EXTRACTION_SCHEMA.required).toEqual(["values"]);
    const items = EXTRACTION_SCHEMA.properties.values.items;
    expect(items.additionalProperties).toBe(false);
    expect([...items.required].sort()).toEqual(["id", "panel", "value"]);
  });

  it("uses no unsupported JSON Schema constraints", () => {
    // minLength/maximum/multipleOf etc. are rejected by structured outputs.
    const banned = ["minimum", "maximum", "multipleOf", "minLength", "maxLength", "pattern", "$ref"];
    const json = JSON.stringify(EXTRACTION_SCHEMA);
    for (const k of banned) expect(json.includes(`"${k}"`), `schema uses ${k}`).toBe(false);
  });
});
