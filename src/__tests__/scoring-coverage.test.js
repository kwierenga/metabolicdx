// Whole-catalogue coverage for the scoring engine.
//
// golden.test.js pins six textbook profiles by hand. That leaves 110 disorders
// and most of the engine's machinery — directions, suppression, context priors —
// with nothing watching them. This file covers the catalogue systematically by
// generating a profile from each disorder's own signature, rather than by
// hand-writing 116 clinical vignettes.
//
// What that does and does not prove
// ---------------------------------
// These are *self-consistency* tests: the profile is derived from the same
// signature data the engine scores against, so they cannot tell you a signature
// is clinically wrong. What they catch is the engine and the data disagreeing —
// a flipped direction, a deleted marker, a renamed analyte, a disorder that has
// become unreachable because something else always outranks it, or a scoring
// change that quietly buries part of the catalogue.
//
// Clinical correctness of the signatures themselves is golden.test.js's job,
// and it needs a clinician, not a generator.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { runAnalysis, initValues } from "../scoring.js";
import { applyContextPrior } from "../modifiers.js";
import { CLINICAL_CONTEXTS, MODIFIERS } from "../modifiers.js";
import { DISORDERS } from "../disorders.js";
import { ANALYTE_MAP } from "../analytes.js";

const IDS = new Set(DISORDERS.map((d) => d.id));

/**
 * A profile that expresses one disorder's signature, or its mirror image.
 *
 * Derived markers (ratios such as PheTyr, C3Gly) are skipped: runAnalysis
 * computes those from the entered analytes, so they are not settable here. A
 * "low" marker whose reference floor is 0 is skipped too — there is no value
 * below it to enter.
 */
function signatureProfile(d, { invert = false } = {}) {
  const v = initValues();
  const set = [];
  for (const m of d.signature ?? []) {
    if (!v[m.panel] || !(m.id in v[m.panel])) continue;
    const a = ANALYTE_MAP[m.id] ?? {};
    const hi = Number.isFinite(a.hi) ? a.hi : 1;
    const lo = Number.isFinite(a.lo) ? a.lo : 0;
    const dir = invert ? { high: "low", low: "high" }[m.direction] ?? m.direction : m.direction;
    if (dir === "high") { v[m.panel][m.id] = String(hi > 0 ? hi * 5 : 10); set.push(m.id); }
    else if (dir === "low" && lo > 0) { v[m.panel][m.id] = String(lo * 0.1); set.push(m.id); }
  }
  return { values: v, set };
}

const rankIn = (results, id) => results.findIndex((r) => r.id === id);

describe("every disorder is reachable from its own signature", () => {
  // Computed once: 116 runAnalysis calls is the bulk of this file's runtime.
  const ranks = DISORDERS.map((d) => {
    const { values, set } = signatureProfile(d);
    return { id: d.id, set: set.length, rank: set.length ? rankIn(runAnalysis(values).results, d.id) : -1 };
  });

  it("has a settable signature for every disorder", () => {
    // A disorder whose entire signature is derived ratios or zero-floor lows can
    // never be driven by entered values, so nothing below can test it either.
    const unreachable = ranks.filter((r) => !r.set).map((r) => r.id);
    expect(unreachable).toEqual([]);
  });

  it("ranks every disorder inside the top 10 for its own profile", () => {
    // The strong invariant. A disorder falling out of the top 10 when handed its
    // own textbook biochemistry means it has become effectively undiagnosable.
    const buried = ranks.filter((r) => r.rank < 0 || r.rank >= 10)
      .map((r) => `${r.id}: rank ${r.rank}`);
    expect(buried).toEqual([]);
  });

  // Ratchets, as elsewhere in this suite: these may improve but not regress.
  // Not every disorder can rank #1 on signature alone and that is legitimate —
  // overlapping biochemistry is real, and the sulfite-oxidase axis in
  // golden.test.js is a deliberate example. The floors stop it drifting worse.
  it("ranks at least 83 disorders first", () => {
    expect(ranks.filter((r) => r.rank === 0).length).toBeGreaterThanOrEqual(83);
  });

  it("ranks at least 109 disorders in the top 3", () => {
    expect(ranks.filter((r) => r.rank >= 0 && r.rank < 3).length).toBeGreaterThanOrEqual(109);
  });
});

describe("marker directions are honoured", () => {
  it("does not rank a disorder first for the mirror image of its signature", () => {
    // The specific regression: a `direction` flipped from "high" to "low" in the
    // data. Reachability alone would not notice — the disorder still scores on
    // the marker, just for the opposite finding, which is how a tool ends up
    // confidently proposing a disorder the biochemistry argues against.
    const wrong = [];
    for (const d of DISORDERS) {
      const plain = signatureProfile(d);
      const mirror = signatureProfile(d, { invert: true });
      if (!mirror.set.length) continue;
      // Only meaningful where inverting actually changes the entered values.
      if (JSON.stringify(plain.values) === JSON.stringify(mirror.values)) continue;
      if (runAnalysis(mirror.values).results[0]?.id === d.id) wrong.push(d.id);
    }
    expect(wrong).toEqual([]);
  });
});

describe("clinical context priors", () => {
  it("name only disorders that exist", () => {
    // A prior keyed on a renamed or deleted id is silently dead: applyContextPrior
    // looks it up, finds nothing, and returns the score untouched. Nothing else
    // in the app would report that the context had stopped working.
    const dangling = [];
    for (const c of CLINICAL_CONTEXTS) {
      for (const id of Object.keys(c.priors ?? {})) {
        if (!IDS.has(id)) dangling.push(`${c.id} -> ${id}`);
      }
    }
    expect(dangling).toEqual([]);
  });

  it("raise the score of a boosted disorder and leave others untouched", () => {
    const ctx = CLINICAL_CONTEXTS.find((c) => Object.entries(c.priors ?? {}).some(([, v]) => v > 0));
    expect(ctx, "no context defines a positive prior").toBeTruthy();
    const boosted = Object.entries(ctx.priors).find(([, v]) => v > 0)[0];
    expect(applyContextPrior(0.5, boosted, ctx.id)).toBeGreaterThan(0.5);
    // A disorder the context says nothing about must be unaffected.
    const untouched = DISORDERS.find((d) => !(d.id in ctx.priors));
    expect(applyContextPrior(0.5, untouched.id, ctx.id)).toBe(0.5);
    // And an unknown context must be inert rather than throwing.
    expect(applyContextPrior(0.5, boosted, "no_such_context")).toBe(0.5);
  });

  it("stay bounded so biochemistry still dominates", () => {
    // The prior is documented as capped at ±0.25 of the score. Without a bound,
    // a strong prior could put a disorder on top of a profile that argues
    // against it — the failure mode clinical decision support must not have.
    for (const c of CLINICAL_CONTEXTS) {
      for (const [id, adj] of Object.entries(c.priors ?? {})) {
        for (const base of [0.1, 0.5, 0.9]) {
          const out = applyContextPrior(base, id, c.id);
          expect(out).toBeGreaterThanOrEqual(0);
          expect(out).toBeLessThanOrEqual(1);
          expect(Math.abs(out - base), `${c.id}/${id} shifted ${base} to ${out}`).toBeLessThanOrEqual(base * 0.15 + 1e-9);
          expect(Number.isFinite(out)).toBe(true);
        }
      }
    }
  });
});

describe("clinical modifiers", () => {
  it("suppress only analytes that exist", () => {
    // Same dead-reference risk as context priors: a suppression keyed on a
    // renamed analyte silently stops suppressing, and the UI still shows the
    // modifier as active.
    const dangling = [];
    for (const m of MODIFIERS) {
      for (const s of m.suppressed ?? []) {
        const id = typeof s === "string" ? s : s.id;
        if (id && !(id in ANALYTE_MAP)) dangling.push(`${m.id} -> ${id}`);
      }
    }
    expect(dangling).toEqual([]);
  });

  it("never fully suppress a pathognomonic marker", () => {
    // Stated invariant in modifiers.js: a weight-3 marker must not be zeroed by
    // a single modifier, or one checkbox could hide a definitive finding.
    const zeroed = [];
    for (const m of MODIFIERS) {
      for (const s of m.suppressed ?? []) {
        if (typeof s === "object" && s.factor === 0) zeroed.push(`${m.id} -> ${s.id}`);
      }
    }
    expect(zeroed).toEqual([]);
  });

  it("can only lower a score, never raise it", () => {
    // Suppression models "this finding is less informative here". If a modifier
    // could raise a score it would be a prior in disguise, applied outside the
    // bound that keeps priors from overwhelming biochemistry.
    const pku = DISORDERS.find((d) => d.id === "PKU");
    const { values } = signatureProfile(pku);
    const base = runAnalysis(values).results;
    for (const m of MODIFIERS.slice(0, 12)) {
      const withMod = runAnalysis(values, [m.id]).results;
      for (const r of withMod) {
        const b = base.find((x) => x.id === r.id);
        if (b) expect(r.score, `${m.id} raised ${r.id}`).toBeLessThanOrEqual(b.score + 1e-9);
      }
    }
  });
});

describe("engine robustness", () => {
  it("survives a profile of non-numeric junk without throwing", () => {
    const v = initValues();
    for (const panel of Object.keys(v)) {
      for (const id of Object.keys(v[panel])) v[panel][id] = "n/a";
    }
    expect(() => runAnalysis(v)).not.toThrow();
    expect(runAnalysis(v).results.every((r) => Number.isFinite(r.score))).toBe(true);
  });

  it("produces finite, non-negative scores for every disorder's own profile", () => {
    for (const d of DISORDERS) {
      const { values, set } = signatureProfile(d);
      if (!set.length) continue;
      for (const r of runAnalysis(values).results) {
        expect(Number.isFinite(r.score), `${d.id}: ${r.id} scored ${r.score}`).toBe(true);
        expect(r.score).toBeGreaterThanOrEqual(0);
      }
    }
  });

  /**
   * Scores exceed 1, which the engine says they cannot.
   *
   * analyteMatchScore's comment states the significance multiplier is "clamped
   * to 1 in the caller via Math.min so score stays bounded". No such clamp
   * exists. scoreDisorder finishes with
   *
   *   finalScore = rawScore * (0.7+0.3*cov) * complexityPenalty * negFactor
   *                * concordanceBonus
   *
   * and concordanceBonus is 1.20 for three or more contributing panels, so a
   * maxed disorder lands at exactly 1.20 (MLYCD does). Fifteen disorders can
   * exceed 1. The AI report prompt renders `score*100` as "/100", so this
   * surfaces to a clinician as e.g. "120/100".
   *
   * Deliberately NOT fixed here. Adding Math.min(1, ...) would flatten every
   * score above 1 to the same value, tying disorders that currently rank
   * distinctly — a change to differential ordering, which is a clinical call and
   * not a tidy-up. This test pins current behaviour so the decision is explicit
   * and any drift is visible. See docs/citation-claims-review.md for the other
   * open clinical questions.
   */
  it("documents that scores can exceed 1 despite the code claiming otherwise", () => {
    const over = [];
    for (const d of DISORDERS) {
      const { values, set } = signatureProfile(d);
      if (!set.length) continue;
      for (const r of runAnalysis(values).results) if (r.score > 1) over.push(r.id);
    }
    const distinct = [...new Set(over)];
    expect(distinct.length, "if this drops to 0 the clamp was added — update this test").toBeGreaterThan(0);
    // The reachable maximum is the concordance bonus applied to a full score.
    for (const d of DISORDERS) {
      const { values, set } = signatureProfile(d);
      if (!set.length) continue;
      for (const r of runAnalysis(values).results) {
        expect(r.score, `${r.id} exceeded the 1.20 concordance ceiling`).toBeLessThanOrEqual(1.2 + 1e-9);
      }
    }
  });
});
