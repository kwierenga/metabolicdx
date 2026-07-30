// Longitudinal patient matching.
//
// Trends join a patient's samples on the free-text case label — the only patient
// identifier this app has. The original implementation matched on
// `label.trim().toLowerCase()`, so any difference that trim+lowercase does not
// erase started a silent second longitudinal record: the clinician saw "no prior
// timepoints" and could not distinguish that from "no match found".
//
// Two behaviours are pinned here:
//   1. patientKey() erases differences that are never meaningful in a name.
//   2. nearMissKeys() reports differences that MIGHT be meaningful, rather than
//      guessing. It must stay conservative — silently merging two different
//      patients is a worse failure than splitting one.
import { describe, it, expect } from "vitest";
import { patientKey, nearMissKeys } from "../App.jsx";

describe("patientKey normalisation", () => {
  it("joins the labels the old trim+lowercase match would have split", () => {
    const canonical = patientKey("Anna Bakker");
    const shouldMatch = [
      "anna bakker",
      "  Anna Bakker  ",
      "Anna  Bakker", // double space — the original silent-split case
      "Anna\tBakker",
      "ANNA BAKKER",
      "Anna Bakker.",
      "Bakker, Anna".replace("Bakker, Anna", "Anna Bakker"), // sanity anchor
      "Anna-Bakker",
      "Anna_Bakker",
      "Anna/Bakker",
    ];
    for (const v of shouldMatch) {
      expect(patientKey(v), `"${v}" should share a patient key with "Anna Bakker"`).toBe(canonical);
    }
  });

  it("is insensitive to diacritics, which vary by keyboard and import source", () => {
    expect(patientKey("Renée Müller")).toBe(patientKey("Renee Muller"));
    expect(patientKey("José Ibáñez")).toBe(patientKey("Jose Ibanez"));
  });

  it("still separates genuinely different patients", () => {
    expect(patientKey("Anna Bakker")).not.toBe(patientKey("Anna Bakkers"));
    expect(patientKey("Patient 12")).not.toBe(patientKey("Patient 21"));
    expect(patientKey("MRN 100234")).not.toBe(patientKey("MRN 100235"));
  });

  it("returns an empty key for unusable labels, never a match-anything value", () => {
    for (const v of ["", "   ", null, undefined, 42, {}]) {
      expect(patientKey(v)).toBe("");
    }
    // An empty key must not be treated as matching another empty key upstream;
    // both call sites guard on a truthy key, so assert the emptiness contract.
    expect(patientKey("...")).toBe("");
  });
});

describe("nearMissKeys typo disclosure", () => {
  const cases = (...labels) => labels.map((label, i) => ({ id: `c${i}`, label }));

  it("flags a one-character typo that would split a record", () => {
    expect(nearMissKeys("Anna Bakker", cases("Anna Bakkerr"))).toEqual(["Anna Bakkerr"]);
    expect(nearMissKeys("MRN 100234", cases("MRN 100235"))).toEqual(["MRN 100235"]);
  });

  it("does not flag labels that already match — those joined the trend", () => {
    expect(nearMissKeys("Anna Bakker", cases("anna  bakker", "Anna Bakker."))).toEqual([]);
  });

  it("does not flag clearly different patients", () => {
    expect(nearMissKeys("Anna Bakker", cases("Piet de Vries", "Sophie Jansen"))).toEqual([]);
  });

  it("refuses to guess on labels too short to distinguish typo from a real difference", () => {
    // "A1" vs "A2" is one edit, but these are far more likely to be two patients.
    expect(nearMissKeys("A1", cases("A2", "A3"))).toEqual([]);
  });

  it("scales tolerance with label length rather than allowing 2 edits on short keys", () => {
    // 7 chars → 1 edit allowed, so a 2-edit difference is not reported.
    expect(nearMissKeys("Case 12", cases("Case 34"))).toEqual([]);
    // 11 chars → 2 edits allowed.
    expect(nearMissKeys("Case 123456", cases("Case 123465"))).toEqual(["Case 123465"]);
  });

  it("reports each distinct near-miss label once, not once per case", () => {
    const dupes = [
      { id: "a", label: "Anna Bakkerr" },
      { id: "b", label: "anna bakkerr" },
      { id: "c", label: "Anna Bakkerr " },
    ];
    expect(nearMissKeys("Anna Bakker", dupes)).toHaveLength(1);
  });

  it("tolerates missing, empty and malformed case records", () => {
    expect(nearMissKeys("Anna Bakker", null)).toEqual([]);
    expect(nearMissKeys("Anna Bakker", [])).toEqual([]);
    expect(nearMissKeys("Anna Bakker", [{}, { label: null }, { label: "" }, null])).toEqual([]);
    expect(nearMissKeys("", cases("Anna Bakker"))).toEqual([]);
  });
});
