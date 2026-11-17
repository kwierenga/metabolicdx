// Unit conversion must be exact where it is defined and refused where it is not.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { convertToPanelUnit, normalizeUnit, MOLAR_MASS, UNITS, roundConverted } from "../units.js";
import { ANALYTE_MAP, PANEL_ANALYTES } from "../analytes.js";

const A = (id) => ANALYTE_MAP[id];

describe("normalizeUnit", () => {
  it("folds the common spellings onto canonical names", () => {
    for (const s of ["µmol/L", "umol/L", "μmol/l", " UMOL/L ", "nmol/mL", "micromol/L"]) expect(normalizeUnit(s), s).toBe(UNITS.UMOL_L);
    for (const s of ["mg/dL", "mg/dl", "mg/100mL", "mg%"]) expect(normalizeUnit(s), s).toBe(UNITS.MG_DL);
    for (const s of ["mmol/mol Cr", "mmol/mol creat", "mmol/mol creatinine", "mmol/mol"]) expect(normalizeUnit(s), s).toBe(UNITS.MMOL_MOL_CR);
    for (const s of ["µmol/mmol creat", "umol/mmol Cr", "umol/mmol creatinine"]) expect(normalizeUnit(s), s).toBe(UNITS.UMOL_MMOL_CR);
    for (const s of ["mg/g creat", "mg/g Cr", "µg/mg creatinine", "ug/mg creat"]) expect(normalizeUnit(s), s).toBe(UNITS.MG_G_CR);
    for (const s of ["µg/dL", "ug/dl", "mcg/dL"]) expect(normalizeUnit(s), s).toBe(UNITS.UG_DL);
    for (const s of ["U/L", "IU/L"]) expect(normalizeUnit(s), s).toBe(UNITS.U_L);
    expect(normalizeUnit("")).toBe(UNITS.RATIO);
    expect(normalizeUnit(null)).toBe(UNITS.RATIO);
  });
  it("leaves an unknown unit as typed so the refusal can name it", () => {
    expect(normalizeUnit("furlongs")).toBe("furlongs");
  });
});

describe("convertToPanelUnit — identity and scalar", () => {
  it("passes a value already in the panel unit through unchanged", () => {
    const r = convertToPanelUnit(A("Phe"), 1200, "µmol/L");
    expect(r).toMatchObject({ ok: true, value: 1200, converted: false, factor: 1 });
  });
  it("converts mmol/L to µmol/L and back", () => {
    expect(convertToPanelUnit(A("Phe"), 1.2, "mmol/L").value).toBeCloseTo(1200);
    expect(convertToPanelUnit(A("Lactate"), 2500, "µmol/L").value).toBeCloseTo(2.5);
  });
  it("treats µmol/mmol creatinine as numerically identical to mmol/mol creatinine", () => {
    const r = convertToPanelUnit(A("MMA"), 42, "µmol/mmol creat");
    expect(r.ok).toBe(true); expect(r.value).toBe(42); expect(r.converted).toBe(false);
  });
});

describe("convertToPanelUnit — mass to molar, against textbook factors", () => {
  // Factors as quoted in any clinical chemistry conversion table.
  it("phenylalanine mg/dL → µmol/L (×60.5)", () => {
    expect(convertToPanelUnit(A("Phe"), 20, "mg/dL").value).toBeCloseTo(1210.7, 0);
  });
  it("ammonia µg/dL → µmol/L (×0.587)", () => {
    expect(convertToPanelUnit(A("Ammonia"), 100, "µg/dL").value).toBeCloseTo(58.7, 0);
  });
  it("lactate mg/dL → mmol/L (×0.111)", () => {
    expect(convertToPanelUnit(A("Lactate"), 18, "mg/dL").value).toBeCloseTo(2.0, 1);
  });
  it("glucose mg/dL → mmol/L (×0.0555)", () => {
    expect(convertToPanelUnit(A("Glucose"), 90, "mg/dL").value).toBeCloseTo(5.0, 1);
  });
  it("uric acid mg/dL → µmol/L (×59.5)", () => {
    expect(convertToPanelUnit(A("UricAc"), 5, "mg/dL").value).toBeCloseTo(297.4, 0);
  });
  it("methylmalonic acid mg/g creatinine → mmol/mol creatinine (×0.958)", () => {
    expect(convertToPanelUnit(A("MMA"), 100, "mg/g creat").value).toBeCloseTo(95.8, 0);
  });
  it("tyrosine mg/dL → µmol/L (×55.2)", () => {
    expect(convertToPanelUnit(A("Tyr"), 1, "mg/dL").value).toBeCloseTo(55.2, 0);
  });
});

describe("convertToPanelUnit — refusals", () => {
  it("refuses per-litre urine values that need creatinine normalisation", () => {
    const r = convertToPanelUnit(A("MMA"), 500, "µmol/L");
    expect(r.ok).toBe(false); expect(r.reason).toMatch(/creatinine/);
  });
  it("refuses mass units for an analyte with no molar mass on file", () => {
    const r = convertToPanelUnit(A("C8"), 1, "mg/dL");
    expect(r.ok).toBe(false); expect(r.reason).toMatch(/molar mass/);
  });
  it("refuses an unrecognised unit and names it", () => {
    const r = convertToPanelUnit(A("Phe"), 1, "furlongs");
    expect(r.ok).toBe(false); expect(r.reason).toMatch(/furlongs/);
  });
  it("refuses a non-numeric value", () => {
    expect(convertToPanelUnit(A("Phe"), "high", "µmol/L").ok).toBe(false);
  });
});

describe("molar-mass table", () => {
  it("names only analytes that exist, and gives each a formula and a plausible mass", () => {
    const ids = new Set(Object.values(PANEL_ANALYTES).flat().map((a) => a.id));
    for (const [id, m] of Object.entries(MOLAR_MASS)) {
      expect(ids.has(id), `MOLAR_MASS has unknown analyte ${id}`).toBe(true);
      expect(m.formula.length).toBeGreaterThan(2);
      expect(m.g).toBeGreaterThan(15); expect(m.g).toBeLessThan(1000);
    }
  });
  it("covers every plasma amino acid, so a mg/dL amino-acid report is always convertible", () => {
    for (const a of PANEL_ANALYTES.PAA) expect(MOLAR_MASS[a.id], `no molar mass for ${a.id}`).toBeDefined();
  });
  it("mass equals the formula, within rounding", () => {
    const W = { C: 12.011, H: 1.008, N: 14.007, O: 15.999, S: 32.06 };
    for (const [id, m] of Object.entries(MOLAR_MASS)) {
      if (!/^[CHNOS0-9]+$/.test(m.formula)) continue; // triolein basis is a convention, not a formula
      let sum = 0;
      for (const [, el, n] of m.formula.matchAll(/([CHNOS])(\d*)/g)) sum += W[el] * (n ? Number(n) : 1);
      expect(Math.abs(sum - m.g), `${id} ${m.formula}: computed ${sum.toFixed(2)} vs listed ${m.g}`).toBeLessThan(0.02);
    }
  });
});

describe("roundConverted", () => {
  it("keeps precision proportional to magnitude", () => {
    expect(roundConverted(1210.68)).toBe(1211);
    expect(roundConverted(58.72)).toBe(58.7);
    expect(roundConverted(2.0016)).toBe(2);
    expect(roundConverted(0.12345)).toBe(0.123);
  });
});
