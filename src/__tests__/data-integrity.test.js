// Data-integrity linter (runs under vitest so JSX/App.jsx imports transform).
//
// The disorder/analyte catalogue is ~5,000 lines of hand-maintained data. The
// scoring engine fails *silently* on bad data: a signature whose {panel,id}
// can't be resolved is simply skipped (see scoreDisorder: `ANALYTE_MAP[sig.id]`
// then `values[sig.panel]?.[sig.id]`), so a pathognomonic marker can be wired
// to do nothing with zero runtime error. That is exactly how the SUOX/MoCo
// S-sulfocysteine bug shipped. These assertions make such breakage loud.
//
// Run: npm run lint:data   (or npm test)
import { describe, it, expect } from "vitest";
import {
  DISORDERS,
  ANALYTE_MAP,
  PANEL_ANALYTES,
  AC_RATIOS,
  PAA_RATIOS,
  UOA_RATIOS,
  MODIFIERS,
  CLINICAL_CONTEXTS,
} from "../App.jsx";

const VALID_PANELS = ["PAA", "UOA", "AC", "CAR", "UAG", "MISC"];

const acR = new Set(AC_RATIOS.map((r) => r.id));
const paaR = new Set(PAA_RATIOS.map((r) => r.id)); // includes cross-panel C3Gly
const uoaR = new Set(UOA_RATIOS.map((r) => r.id));

// Panels in which the engine could actually find a *value* for `id`, mirroring
// runAnalysis()'s enrichedValues construction (static analyte ∪ injected ratio).
function resolvablePanels(id) {
  const panels = new Set();
  for (const p of VALID_PANELS) {
    if (PANEL_ANALYTES[p].some((a) => a.id === id)) panels.add(p);
  }
  if (acR.has(id)) panels.add("AC");
  if (paaR.has(id)) panels.add("PAA");
  if (uoaR.has(id)) panels.add("UOA");
  if (id === "pGAACr") panels.add("MISC"); // miscDerived ratio in runAnalysis
  return panels;
}

// Return a human-readable reason why {panel,id} is inert, or null if reachable.
function inertReason(ref) {
  if (!VALID_PANELS.includes(ref.panel)) return `panel "${ref.panel}" is not a real panel`;
  if (!(ref.id in ANALYTE_MAP)) return `analyte id "${ref.id}" not in ANALYTE_MAP (engine skips it)`;
  const ok = resolvablePanels(ref.id);
  if (!ok.has(ref.panel)) {
    return `id "${ref.id}" is only resolvable in [${[...ok].join(",") || "—"}] but signature uses "${ref.panel}" → marker is permanently inert`;
  }
  return null;
}

describe("disorder catalogue structural integrity", () => {
  it("every disorder has id / name / category / non-empty signature", () => {
    const bad = [];
    for (const d of DISORDERS) {
      if (!d || typeof d.id !== "string" || !d.id) bad.push(`(${JSON.stringify(d?.name)}) missing id`);
      else if (typeof d.name !== "string" || !d.name) bad.push(`${d.id}: missing name`);
      else if (typeof d.category !== "string" || !d.category) bad.push(`${d.id}: missing category`);
      else if (!Array.isArray(d.signature) || d.signature.length === 0)
        bad.push(`${d.id}: empty/missing signature (disorder can never be scored)`);
    }
    expect(bad, `\n  - ${bad.join("\n  - ")}\n`).toEqual([]);
  });

  it("disorder ids are unique", () => {
    const seen = new Map();
    const dups = [];
    for (const d of DISORDERS) {
      if (seen.has(d.id)) dups.push(d.id);
      seen.set(d.id, true);
    }
    expect(dups, `duplicate ids: ${dups.join(", ")}`).toEqual([]);
  });
});

describe("signature / negativeEvidence references resolve in the engine", () => {
  it("no signature marker is permanently inert (panel/id mismatch)", () => {
    const problems = [];
    for (const d of DISORDERS) {
      for (const sig of d.signature || []) {
        const why = inertReason(sig);
        if (why) problems.push(`${d.id}.signature {panel:${sig.panel},id:${sig.id}} — ${why}`);
      }
    }
    expect(problems, `\n  - ${problems.join("\n  - ")}\n`).toEqual([]);
  });

  it("no negativeEvidence marker is permanently inert", () => {
    const problems = [];
    for (const d of DISORDERS) {
      for (const ne of d.negativeEvidence || []) {
        const why = inertReason(ne);
        if (why) problems.push(`${d.id}.negativeEvidence {panel:${ne.panel},id:${ne.id}} — ${why}`);
      }
    }
    expect(problems, `\n  - ${problems.join("\n  - ")}\n`).toEqual([]);
  });
});

describe("followUp / narrative shape", () => {
  it("followUp.urgency is one of critical|urgent|routine", () => {
    const bad = [];
    for (const d of DISORDERS) {
      if (d.followUp && !["critical", "urgent", "routine"].includes(d.followUp.urgency))
        bad.push(`${d.id}: followUp.urgency = ${JSON.stringify(d.followUp.urgency)}`);
    }
    expect(bad, `\n  - ${bad.join("\n  - ")}\n`).toEqual([]);
  });

  it("followUp/narrative list fields are arrays of non-empty strings", () => {
    const bad = [];
    const checkArr = (where, arr) => {
      if (arr == null) return;
      if (!Array.isArray(arr)) return bad.push(`${where} is not an array`);
      arr.forEach((s, i) => {
        if (typeof s !== "string" || !s.trim()) bad.push(`${where}[${i}] is not a non-empty string`);
      });
    };
    for (const d of DISORDERS) {
      if (d.followUp) {
        checkArr(`${d.id}.followUp.confirmatory`, d.followUp.confirmatory);
        checkArr(`${d.id}.followUp.pitfalls`, d.followUp.pitfalls);
        checkArr(`${d.id}.followUp.references`, d.followUp.references);
      }
      if (d.narrative) checkArr(`${d.id}.narrative.references`, d.narrative.references);
    }
    expect(bad, `\n  - ${bad.join("\n  - ")}\n`).toEqual([]);
  });
});

describe("modifiers & clinical contexts have stable ids", () => {
  it("MODIFIERS and CLINICAL_CONTEXTS ids are unique non-empty strings", () => {
    const bad = [];
    for (const [label, list] of [["MODIFIERS", MODIFIERS], ["CLINICAL_CONTEXTS", CLINICAL_CONTEXTS]]) {
      const seen = new Set();
      for (const m of list) {
        if (typeof m.id !== "string" || !m.id) bad.push(`${label}: entry with bad id`);
        else if (seen.has(m.id)) bad.push(`${label}: duplicate id "${m.id}"`);
        seen.add(m.id);
      }
    }
    expect(bad, `\n  - ${bad.join("\n  - ")}\n`).toEqual([]);
  });
});
