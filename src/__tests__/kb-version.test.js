// The knowledge-base stamp must be true.
//
// Every printed report carries "Knowledge base vX (date)". Until 2026-11-13 that
// stamp read May 2026 while disorders.js had been edited in 64 later commits,
// so every report named a catalogue version that did not exist. Two guards:
//
//   1. KB_DATE may not be older than the last commit that changed disorders.js.
//      Needs git history, so it is skipped on a shallow clone — ci.yml checks
//      out with fetch-depth 0 so it runs there, and it runs on every local
//      `npm test`. An uncommitted edit is caught by CI after the push.
//   2. KB_HASH / ENGINE_HASH are content hashes substituted at build time. They
//      cannot go stale, which is why saved cases record them.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { KB_VERSION, KB_DATE, KB_HASH } from "../disorders.js";
import { ENGINE_VERSION, ENGINE_HASH } from "../scoring.js";

function git(args) {
  try { return execFileSync("git", args, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); }
  catch { return null; }
}

describe("knowledge-base stamp", () => {
  it("KB_DATE is an ISO date and KB_VERSION is its year.month", () => {
    expect(KB_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(KB_VERSION).toBe(KB_DATE.slice(0, 7).replace("-", "."));
    expect(ENGINE_VERSION).toMatch(/^\d{4}\.\d{2}$/);
  });

  it("KB_DATE is not older than the last commit that changed disorders.js", () => {
    const shallow = git(["rev-parse", "--is-shallow-repository"]);
    if (shallow === null || shallow === "true") return; // no usable history here
    const last = git(["log", "-1", "--format=%cs", "--", "src/disorders.js"]);
    if (!last) return;
    expect(KB_DATE >= last,
      `src/disorders.js last changed ${last} but KB_DATE is ${KB_DATE} — bump KB_DATE and KB_VERSION in src/disorders.js`)
      .toBe(true);
  });

  it("content hashes are build stamps (8 hex chars) or 'dev' under plain node", () => {
    expect(KB_HASH).toMatch(/^(?:[0-9a-f]{8}|dev)$/);
    expect(ENGINE_HASH).toMatch(/^(?:[0-9a-f]{8}|dev)$/);
  });
});
