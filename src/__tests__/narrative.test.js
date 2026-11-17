// The narrative prompt leaves the building. It must not carry identifiers.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { buildNarrativePrompt, describeValues } from "../narrative.js";
import { initValues, runAnalysis } from "../scoring.js";

function sampleCase() {
  const v = initValues();
  v.PAA.Phe = "1200"; v.PAA.Tyr = "20"; v.PAA.Leu = "100";
  return v;
}

describe("buildNarrativePrompt", () => {
  const values = sampleCase();
  const { results, patterns } = runAnalysis(values);
  const prompt = buildNarrativePrompt({
    ageStr: "3mo", sex: "Female", values, activeModifiers: [], knownDxId: null,
    results, activePanels: new Set(["PAA"]), patterns,
  });

  it("has no parameter for, and no mention of, a case label or date of birth", () => {
    // The function signature is the guard: there is nowhere to pass them.
    expect(prompt).not.toMatch(/\bCase:/);
    expect(prompt).not.toMatch(/\bDOB\b|date of birth: /i);
    expect(prompt).toMatch(/Do not invent, request or include any name, date of birth or identifier/);
  });

  it("carries the clinically necessary content", () => {
    expect(prompt).toContain("Patient: 3mo, Female");
    expect(prompt).toContain("Plasma Amino Acids");
    expect(prompt).toMatch(/Phenylalanine: 1200 µmol\/L .* HIGH/);
    expect(prompt).toMatch(/Tyrosine: 20 µmol\/L .* LOW/);
    expect(prompt).toMatch(/1\. .*PKU|1\. Phenylketonuria/i);
  });

  it("describes the differential by separation, never as a percentage score", () => {
    expect(prompt).not.toMatch(/score \d+\/100/);
    expect(prompt).toMatch(/of the leader's score|× the next candidate|sole candidate/);
    expect(prompt).toMatch(/not a probability/);
  });

  it("switches to monitoring language when a diagnosis is known", () => {
    const p = buildNarrativePrompt({ ageStr: "2yr", sex: "", values, results, activePanels: new Set(["PAA"]), knownDxId: "PKU" });
    expect(p).toContain("known diagnosis of");
    expect(p).not.toContain("Top differential");
  });
});

describe("describeValues", () => {
  it("lists only entered analytes and flags direction", () => {
    const { abnormal, all } = describeValues(sampleCase());
    expect(all).toHaveLength(3);
    expect(abnormal).toHaveLength(2);
    expect(abnormal.join("\n")).toMatch(/HIGH/);
    expect(abnormal.join("\n")).toMatch(/LOW/);
  });
});
