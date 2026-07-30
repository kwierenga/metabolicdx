// Provenance integrity — enforces that the *scoring* layer can name its sources.
//
// The narrative layer has always been well-cited, but the data that actually
// moves a differential (signature markers, ratio cut-offs, the covariate model,
// the analytical ceiling, the LR product) carried no machine-verifiable
// citation at all. Two consequences of that showed up the first time anyone
// checked: a fabricated source ("Norris et al., JIMD 2007") was being shown to
// clinicians as the statistical basis for the LR score, and the analytical
// ceiling was attributed to the wrong year. These tests exist so neither class
// of defect can return silently.
//
// What is enforced:
//   1. every registry entry carries a resolvable identifier (PMID or DOI)
//   2. every `ref` key used anywhere in the data resolves to the registry
//   3. the two known-fabricated citations never reappear in the source
//   4. marker coverage ratchets upward — see COVERAGE_FLOOR
//
// What is NOT enforced (and cannot be, from inside the test runner): that a
// PMID actually points at the paper claimed. Resolve identifiers against
// PubMed when adding them; see the header of src/references.js.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REFERENCES, METHOD_REFS, PANEL_STANDARDS,
  getRef, refUrl, formatRef, shortRef, resolveRefs,
} from "../references.js";
import { DISORDERS } from "../disorders.js";
import { ANALYTE_MAP } from "../analytes.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const readSrc = (p) => readFileSync(resolve(REPO, p), "utf8");

const KEYS = Object.keys(REFERENCES);

// ── every marker/analyte/method ref key used anywhere in the data ────────────
function allUsedRefKeys() {
  const used = new Map(); // key -> where it was used (for a useful failure message)
  const note = (k, where) => used.set(k, used.get(k) ?? where);

  for (const [id, a] of Object.entries(ANALYTE_MAP)) {
    for (const k of a.ref ?? []) note(k, `ANALYTE_MAP.${id}`);
  }
  for (const d of DISORDERS) {
    for (const m of d.signature ?? []) {
      for (const k of m.ref ?? []) note(k, `${d.id}.signature[${m.panel}:${m.id}]`);
    }
  }
  for (const [name, m] of Object.entries(METHOD_REFS)) {
    for (const k of m.ref ?? []) note(k, `METHOD_REFS.${name}`);
  }
  for (const [panel, keys] of Object.entries(PANEL_STANDARDS)) {
    for (const k of keys) note(k, `PANEL_STANDARDS.${panel}`);
  }
  return used;
}

describe("reference registry", () => {
  it("is non-empty", () => {
    expect(KEYS.length).toBeGreaterThan(0);
  });

  it("every entry carries a resolvable identifier (PMID or DOI)", () => {
    const bad = KEYS.filter((k) => !REFERENCES[k].pmid && !REFERENCES[k].doi);
    expect(bad, `entries with neither pmid nor doi: ${bad.join(", ")}`).toEqual([]);
  });

  it("every entry has the bibliographic fields needed to render a citation", () => {
    const bad = [];
    for (const k of KEYS) {
      const r = REFERENCES[k];
      for (const f of ["authors", "title", "journal", "year"]) {
        if (!r[f]) bad.push(`${k}.${f}`);
      }
    }
    expect(bad, `missing fields: ${bad.join(", ")}`).toEqual([]);
  });

  it("PMIDs are bare numeric strings", () => {
    const bad = KEYS.filter((k) => REFERENCES[k].pmid && !/^\d{1,8}$/.test(REFERENCES[k].pmid));
    expect(bad, `malformed pmid: ${bad.join(", ")}`).toEqual([]);
  });

  it("DOIs are well-formed", () => {
    const bad = KEYS.filter((k) => REFERENCES[k].doi && !/^10\.\d{4,9}\/\S+$/.test(REFERENCES[k].doi));
    expect(bad, `malformed doi: ${bad.join(", ")}`).toEqual([]);
  });

  it("no two entries share a PMID or DOI (catches copy-paste)", () => {
    for (const field of ["pmid", "doi"]) {
      const seen = new Map();
      for (const k of KEYS) {
        const v = REFERENCES[k][field];
        if (!v) continue;
        expect(seen.has(v), `${field} ${v} used by both ${seen.get(v)} and ${k}`).toBe(false);
        seen.set(v, k);
      }
    }
  });

  it("publication years are plausible", () => {
    const now = new Date().getFullYear();
    for (const k of KEYS) {
      const y = REFERENCES[k].year;
      expect(Number.isInteger(y), `${k}.year is not an integer`).toBe(true);
      expect(y, `${k}.year out of range`).toBeGreaterThan(1950);
      expect(y, `${k}.year is in the future`).toBeLessThanOrEqual(now + 1);
    }
  });

  it("helpers produce a usable citation and link for every entry", () => {
    for (const k of KEYS) {
      const r = getRef(k);
      expect(formatRef(r).length, `${k} formats to an empty citation`).toBeGreaterThan(20);
      expect(refUrl(r), `${k} has no resolvable URL`).toMatch(/^https:\/\//);
      expect(shortRef(r), `${k} has an empty short label`).toMatch(/\S+\s\d{4}/);
    }
  });

  it("refUrl prefers PubMed and degrades safely", () => {
    expect(refUrl({ pmid: "123", doi: "10.1/x" })).toBe("https://pubmed.ncbi.nlm.nih.gov/123/");
    expect(refUrl({ doi: "10.1/x" })).toBe("https://doi.org/10.1/x");
    expect(refUrl({})).toBeNull();
    expect(refUrl(null)).toBeNull();
  });

  it("resolveRefs drops unknown keys instead of throwing", () => {
    expect(resolveRefs(["sharer-2018-amino-acids", "nope"])).toHaveLength(1);
    expect(resolveRefs([])).toEqual([]);
    expect(resolveRefs(undefined)).toEqual([]);
  });
});

describe("ref keys used in the data", () => {
  it("all resolve to the registry", () => {
    const used = allUsedRefKeys();
    const dangling = [...used.entries()].filter(([k]) => !REFERENCES[k]);
    expect(
      dangling.map(([k, where]) => `${k} (used at ${where})`),
      "dangling ref keys — a marker cites a source that is not in references.js",
    ).toEqual([]);
  });

  it("every registry entry is actually used somewhere", () => {
    // Dead references drift out of date unnoticed. If you are adding a source
    // ahead of the data that will cite it, wire the data up in the same change.
    const used = allUsedRefKeys();
    const orphans = KEYS.filter((k) => !used.has(k));
    expect(orphans, `unused registry entries: ${orphans.join(", ")}`).toEqual([]);
  });

  it("PANEL_STANDARDS covers every panel the engine scores", () => {
    for (const panel of ["PAA", "UOA", "AC", "CAR", "UAG", "MISC"]) {
      expect(PANEL_STANDARDS[panel], `no PANEL_STANDARDS entry for ${panel}`).toBeDefined();
    }
  });

  it("every METHOD_REFS entry has a label, a claim and at least one source", () => {
    for (const [name, m] of Object.entries(METHOD_REFS)) {
      expect(m.label, `${name}.label`).toBeTruthy();
      expect(m.claim, `${name}.claim`).toBeTruthy();
      expect(m.ref?.length, `${name} has no sources`).toBeGreaterThan(0);
    }
  });
});

describe("fabricated citations do not return", () => {
  // Both were surfaced to clinicians as the basis of the LR score and the
  // context prior. Neither exists: PubMed returns no Norris paper in J Inherit
  // Metab Dis 2007, and Turgeon has no JIMD 2014 paper. Verified 2026-07-29.
  const FABRICATED = [
    { pattern: /Norris\s+et\s+al/i, what: '"Norris et al." (no such JIMD 2007 paper)' },
    { pattern: /Turgeon\s+et\s+al/i, what: '"Turgeon et al." (no such JIMD 2014 paper)' },
    { pattern: /Rinaldo[^\n]*Eur\s*J\s*Pediatr/i, what: '"Rinaldo et al., Eur J Pediatr 2008" (no such paper)' },
  ];
  // The scoring layer: App.jsx plus the modules it was split into. When that
  // split happened the cited comments moved with their code — the LR-product
  // note to scoring.js, the context-prior note to modifiers.js — so scanning
  // App.jsx alone would have left this guard pointing at an empty room.
  const SCORING_FILES = [
    "src/App.jsx", "src/analytes.js", "src/modifiers.js",
    "src/patterns.js", "src/scoring.js", "src/qc.js", "src/patient.js",
  ];
  const FILES = [...SCORING_FILES, "src/disorders.js", "src/references.js"];

  for (const file of FILES) {
    for (const { pattern, what } of FABRICATED) {
      it(`${file} does not cite ${what}`, () => {
        const lines = readSrc(file).split("\n");
        // A comment block may name these papers in order to record *why* they
        // were removed. Allow that, but only inside a comment whose immediate
        // neighbourhood says so — anywhere else is a regression.
        const EXCUSED = /attributed|removed|no such|does not exist|not exist in PubMed|fabricat/i;
        const excused = (i) =>
          /^\s*(\/\/|\*)/.test(lines[i]) &&
          lines.slice(Math.max(0, i - 3), i + 4).some((l) => EXCUSED.test(l));
        const hits = lines
          .map((line, i) => ({ line, i }))
          .filter(({ line, i }) => pattern.test(line) && !excused(i));
        expect(hits.map((h) => `${file}:${h.i + 1}`), `re-introduced ${what}`).toEqual([]);
      });
    }
  }

  it("the analytical ceiling is not attributed to the wrong year", () => {
    // Oglesbee is Genet Med 2018;20(1):83-90 (PMID 28661487); 2017 was online-first.
    // Scoring layer only. disorders.js narratives cite Oglesbee's 2017
    // online-first date in prose, and references.js records the year confusion
    // deliberately; neither is the attribution this guards.
    const hits = SCORING_FILES.flatMap((f) =>
      readSrc(f)
        .split("\n")
        .map((line, i) => ({ line, n: i + 1, f }))
        .filter(({ line }) => /Oglesbee\s+2017/.test(line))
        .filter(({ line }) => !/online-first|earlier comments/i.test(line)),
    );
    expect(hits.map((h) => `${h.f}:${h.n}`), "Oglesbee cited as 2017").toEqual([]);
  });
});

// ── coverage ratchet ────────────────────────────────────────────────────────
// These floors record where provenance coverage stands today. They exist to
// make coverage monotonic: raise a floor when you source more data, never lower
// one. A failure here means provenance was REMOVED, which is the thing to catch.
const COVERAGE_FLOOR = {
  signatureMarkers: 108, // of 408
  ratios: 20, // of 27
};

describe("provenance coverage ratchet", () => {
  const markers = DISORDERS.flatMap((d) => d.signature ?? []);
  const ratios = Object.values(ANALYTE_MAP).filter((a) => a.unit === "ratio");

  it(`at least ${COVERAGE_FLOOR.signatureMarkers} signature markers cite a source`, () => {
    const sourced = markers.filter((m) => m.ref?.length).length;
    expect(
      sourced,
      `signature-marker provenance dropped to ${sourced}/${markers.length}; floor is ${COVERAGE_FLOOR.signatureMarkers}. ` +
        `If you intentionally sourced more, raise COVERAGE_FLOOR.`,
    ).toBeGreaterThanOrEqual(COVERAGE_FLOOR.signatureMarkers);
  });

  const attributedRatios = () =>
    ratios.filter((r) => r.ref?.length || r.refPending || r.refDisputed).length;

  it(`at least ${COVERAGE_FLOOR.ratios} ratios have a provenance state recorded`, () => {
    const attributed = attributedRatios();
    expect(
      attributed,
      `ratio provenance dropped to ${attributed}/${ratios.length}; floor is ${COVERAGE_FLOOR.ratios}.`,
    ).toBeGreaterThanOrEqual(COVERAGE_FLOOR.ratios);
  });

  it("refDisputed records WHY the citation was rejected, not just that it was", () => {
    const thin = Object.entries(ANALYTE_MAP)
      .filter(([, a]) => a.refDisputed != null)
      .filter(([, a]) => typeof a.refDisputed !== "string" || a.refDisputed.length < 30)
      .map(([id]) => id);
    expect(thin, `refDisputed too terse to be useful: ${thin.join(", ")}`).toEqual([]);
  });

  it("a rejected citation is never also listed as pending (that would re-legitimise it)", () => {
    const both = Object.entries(ANALYTE_MAP)
      .filter(([, a]) => a.refDisputed && a.refPending)
      .map(([id]) => id);
    expect(both, `both refDisputed and refPending: ${both.join(", ")}`).toEqual([]);
  });

  it("reports current coverage (informational — never fails)", () => {
    const sourced = markers.filter((m) => m.ref?.length).length;
    const verified = ratios.filter((r) => r.ref?.length).length;
    const pending = ratios.filter((r) => r.refPending && !r.ref?.length).length;
    const disputed = ratios.filter((r) => r.refDisputed).length;
    // eslint-disable-next-line no-console
    console.log(
      `\n  provenance: signature markers ${sourced}/${markers.length} ` +
        `(${((100 * sourced) / markers.length).toFixed(1)}%) verified · ` +
        `ratios ${verified}/${ratios.length} verified, ${pending} pending, ${disputed} disputed · ` +
        `registry ${KEYS.length} sources\n`,
    );
    expect(true).toBe(true);
  });

  it("no marker carries an empty ref array (that reads as sourced but is not)", () => {
    const empty = DISORDERS.flatMap((d) =>
      (d.signature ?? [])
        .filter((m) => Array.isArray(m.ref) && m.ref.length === 0)
        .map((m) => `${d.id}:${m.panel}:${m.id}`),
    );
    expect(empty, `markers with ref:[] — use no ref field instead`).toEqual([]);
  });
});
