// The prose-to-reference join, and the deterministic half of claim support.
//
// scripts/parse-claims.mjs is the only thing in the repository that reads the
// `[1,4]` markers in the narrative, so a silent regression here would not show
// up anywhere else — the judge would simply assess fewer claims and report a
// cleaner corpus. The ratchets at the bottom exist to make that loud.
//
// Nothing here needs the network or a model. The judge's own output is
// deliberately NOT ratcheted; see docs/claim-support-checker.md.
import { describe, it, expect } from "vitest";
import {
  splitSentences, markersIn, findMalformed, collectClaims, auditClaims, judgeablePairs, MIN_CHARS,
} from "../../scripts/parse-claims.mjs";

describe("sentence splitting", () => {
  it("splits on sentence boundaries", () => {
    expect(splitSentences("First one. Second one.")).toEqual(["First one.", "Second one."]);
  });

  // The corpus is full of these and every one of them used to break a naive split.
  it("does not split inside decimals, ratios or dosages", () => {
    expect(splitSentences("Sensitivity is ~0.78 overall.")).toHaveLength(1);
    expect(splitSentences("Incidence is ~1:111,000–1:232,000 live births.")).toHaveLength(1);
    expect(splitSentences("Give L-carnitine 50–100 mg/kg/day in divided doses.")).toHaveLength(1);
  });

  it("does not split after an abbreviation", () => {
    expect(splitSentences("Shared with other disorders, e.g. 3-MCC deficiency.")).toHaveLength(1);
    expect(splitSentences("Reported by Fukao T. et al. Later confirmed.")).toHaveLength(2);
  });

  it("keeps an opening bracket as a sentence start", () => {
    expect(splitSentences("First claim [1]. (A parenthetical second.)")).toHaveLength(2);
  });
});

describe("citation markers", () => {
  // All four shapes that occur in the corpus, and nothing else does.
  it("parses every marker shape the corpus uses", () => {
    expect(markersIn("a [1].")).toEqual([1]);
    expect(markersIn("a [1,4].")).toEqual([1, 4]);
    expect(markersIn("a [1, 4].")).toEqual([1, 4]);
    expect(markersIn("a [1,2,7].")).toEqual([1, 2, 7]);
    expect(markersIn("a [1,2,7,9].")).toEqual([1, 2, 7, 9]);
  });

  it("collects markers across a sentence and deduplicates", () => {
    expect(markersIn("one [1,4] and two [4,5].")).toEqual([1, 4, 5]);
  });

  it("returns nothing for prose with no markers", () => {
    expect(markersIn("No citation here at all.")).toEqual([]);
    expect(markersIn(null)).toEqual([]);
  });

  it("flags bracketed runs that are not valid markers", () => {
    expect(findMalformed("a [1-3].")).toEqual(["[1-3]"]);
    expect(findMalformed("a [see 4].")).toEqual(["[see 4]"]);
    expect(findMalformed("a [1,4] and b [1].")).toEqual([]);
  });
});

describe("claim collection", () => {
  const claims = collectClaims();

  it("returns claims carrying their prose, their paragraph and their sources", () => {
    const c = claims[0];
    expect(c.id).toMatch(/^[A-Z0-9_]+\.[a-zA-Z]+\.\d+$/);
    expect(c.text.length).toBeGreaterThanOrEqual(MIN_CHARS);
    expect(c.refs.length).toBeGreaterThan(0);
    // The paragraph is the judge's context, so it must contain the sentence.
    expect(c.paragraph).toContain(c.text.slice(0, 40));
  });

  it("only collects sentences that actually cite something", () => {
    expect(claims.every((c) => c.refs.length > 0)).toBe(true);
  });

  it("resolves every marker to a reference slot", () => {
    const unresolved = claims.flatMap((c) => c.refs.filter((r) => r.level === "missing").map(() => c.id));
    expect(unresolved, `markers past the end of the list: ${unresolved.slice(0, 5).join(", ")}`).toEqual([]);
  });

  it("gives each claim a unique id", () => {
    expect(new Set(claims.map((c) => c.id)).size).toBe(claims.length);
  });

  it("groups judgeable pairs by paper so each abstract is sent once", () => {
    const groups = judgeablePairs(claims);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((g) => g.pmid && g.claims.length > 0)).toBe(true);
    // Grouping is only worth doing if papers really are shared between claims.
    const pairs = groups.reduce((n, g) => n + g.claims.length, 0);
    expect(pairs / groups.length).toBeGreaterThan(1.5);
  });
});

describe("deterministic claim audit", () => {
  const claims = collectClaims();
  const audit = auditClaims(claims);

  // Ratchets. These move DOWN as the knowledge base is repaired, in the same
  // direction as WRONG_CEILING in citations.test.js, and the claim floor moves
  // up. A marker that stops resolving, or prose that loses its citation, breaks
  // the build rather than quietly shrinking the judge's workload.
  const CLAIM_FLOOR = 1254;          // sentences that cite at least one reference
  const ORPHAN_CEILING = 20;         // substantive sentences in a block citing nothing
  const WITHHELD_ONLY_CEILING = 1;   // claims whose every source is suppressed
  // 30, up from 26, and the four are an improvement rather than a regression.
  // citationStatus stopped handing out a PMID that the resolver had only GUESSED
  // at ("closest PubMed match is only a partial title match"), so four claims
  // that appeared to have a source now correctly appear to have none. They never
  // had one: PCDEF's was the PMID of a DIFFERENT paper the same disorder cites
  // two slots later. This ceiling still ratchets down from here.
  const NO_PUBMED_CEILING = 30;      // claims no abstract could ever assess

  it(`joins at least ${CLAIM_FLOOR} claims to their references`, () => {
    expect(claims.length).toBeGreaterThanOrEqual(CLAIM_FLOOR);
  });

  it("has no markers pointing past the end of a reference list", () => {
    expect(audit.outOfRange, JSON.stringify(audit.outOfRange.slice(0, 5))).toEqual([]);
  });

  it("has no malformed citation markers", () => {
    expect(audit.malformed, JSON.stringify(audit.malformed.slice(0, 5))).toEqual([]);
  });

  it(`has no more than ${ORPHAN_CEILING} sentences in prose blocks citing nothing`, () => {
    const where = [...new Set(audit.orphanBlocks.map((o) => `${o.disorder}.${o.field}`))].join(", ");
    expect(audit.orphanBlocks.length, `uncited blocks: ${where}`).toBeLessThanOrEqual(ORPHAN_CEILING);
  });

  it(`has no more than ${WITHHELD_ONLY_CEILING} claims sourced only to withheld citations`, () => {
    const ids = audit.allWithheld.map((c) => c.id).join(", ");
    expect(audit.allWithheld.length, `withheld-only: ${ids}`).toBeLessThanOrEqual(WITHHELD_ONLY_CEILING);
  });

  it(`has no more than ${NO_PUBMED_CEILING} claims with no PubMed-resolvable source`, () => {
    expect(audit.unassessable.length).toBeLessThanOrEqual(NO_PUBMED_CEILING);
  });
});
