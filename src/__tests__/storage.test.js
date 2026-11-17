// The parts of storage.js that need no database: shaping, stamps, staleness.
//
// The Supabase path itself is exercised against the live project by hand
// (scripts/check-rls.mjs, and the app); these pin the contracts the UI relies
// on — in particular that the stamp recorded on a case is what makes a stale
// result recognisable, and that round-tripping a result through storage keeps
// the separation fields the cards display.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { currentStamp, isStale, summarize, stripResultsForStorage, hydrateResults, StorageConflictError, StorageNotMigratedError } from "../storage.js";
import { runAnalysis, initValues } from "../scoring.js";
import { KB_HASH } from "../disorders.js";
import { ENGINE_HASH } from "../scoring.js";

describe("stamps and staleness", () => {
  it("currentStamp names the running knowledge base and engine", () => {
    const s = currentStamp();
    expect(s.kbHash).toBe(KB_HASH);
    expect(s.engineHash).toBe(ENGINE_HASH);
    expect(s.kbVersion).toMatch(/^\d{4}\.\d{2}$/);
    expect(s.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
  it("a case with no stamp, or a different hash, is stale; the current stamp is not", () => {
    expect(isStale(null)).toBe(true);
    expect(isStale(undefined)).toBe(true);
    expect(isStale(currentStamp())).toBe(false);
    expect(isStale({ ...currentStamp(), kbHash: "deadbeef" })).toBe(true);
    expect(isStale({ ...currentStamp(), engineHash: "deadbeef" })).toBe(true);
  });
});

describe("shaping", () => {
  const v = initValues(); v.PAA.Phe = "1200"; v.PAA.Tyr = "20";
  const { results } = runAnalysis(v);

  it("strips narrative bulk but keeps what the list, trends and cards need", () => {
    const stripped = stripResultsForStorage(results);
    expect(stripped[0].narrative).toBeUndefined();
    expect(stripped[0].notes).toBeUndefined();
    expect(stripped[0]).toMatchObject({ id: "PKU", leadRatio: results[0].leadRatio, rivalId: results[0].rivalId });
    expect(Array.isArray(stripped[0].familyPeers)).toBe(true);
    expect(stripped[0].supporting[0]).toHaveProperty("val");
    expect(JSON.stringify(stripped).length).toBeLessThan(JSON.stringify(results).length / 4);
  });
  it("hydrates a stripped result back to the full disorder, keeping the stored scores", () => {
    const back = hydrateResults(stripResultsForStorage(results));
    expect(back[0].narrative).toBeTruthy();
    expect(back[0].score).toBe(results[0].score);
    expect(back[0].incidence).toBeTruthy();
    expect(stripResultsForStorage(null)).toBeNull();
    expect(hydrateResults(null)).toBeNull();
  });
  it("summarize derives the list row, including the stamp", () => {
    const stamp = currentStamp();
    const row = summarize({ label: "x", age: "3mo", sex: "F", results, confirmedDxId: "PKU", activeModifiers: ["a", "b"], reportSigned: true, panels: ["PAA"], enteredCount: 2, abnormalCount: 2, scoredWith: stamp });
    expect(row).toMatchObject({ topDx: results[0].name, confirmedDxId: "PKU", modifierCount: 2, reportSigned: true, scoredWith: stamp, panels: ["PAA"] });
    expect(summarize({}).modifierCount).toBe(0);
  });
});

describe("errors", () => {
  it("name themselves so the UI can tell a conflict from an outage", () => {
    expect(new StorageConflictError().name).toBe("StorageConflictError");
    expect(new StorageConflictError().message).toMatch(/someone else/);
    expect(new StorageNotMigratedError().message).toMatch(/0003_case_records\.sql/);
  });
});
