// Citation provenance for the narrative layer.
//
// Companion to provenance.test.js, which covers the *scoring* layer. This one
// covers the ~1,150 free-text literature references attached to the disorder
// narratives. They were largely bulk-generated, and resolving all 1,010 unique
// strings against PubMed found that only 58% name a paper whose title actually
// matches: a quarter point at nothing or at an unrelated paper. Presenting those
// to a clinician as ordinary references is the defect these tests guard.
//
// What is enforced:
//   1. the parser understands the shapes the corpus actually uses
//   2. citationKey survives the edits the pipeline makes (PMID stamping,
//      punctuation fixes) — otherwise entries silently orphan
//   3. every generated provenance entry still matches a real reference
//   4. verified references carry an inline PMID, and no other level does
//   5. the fabricated-citation count ratchets DOWN — see WRONG_CEILING
//
// What is NOT enforced: that a PMID points at the paper claimed. That needs the
// network; scripts/check-citations.mjs does it and caches the result.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { DISORDERS } from "../disorders.js";
import { CITATION_PROVENANCE } from "../citation-provenance.js";
import { citationKey, citedPmid, citationText, citationStatus, CITATION_LEVELS } from "../citations.js";
import { parseCitation, ecitEligible, ecitQuery, cacheKey } from "../../scripts/parse-citations.mjs";

/** Every reference string in the knowledge base, with where it lives. */
const allRefs = () => {
  const out = [];
  for (const d of DISORDERS) {
    (d.narrative?.references ?? []).forEach((r, i) => out.push({ raw: r, where: `${d.id}.narrative[${i}]` }));
    (d.followUp?.references ?? []).forEach((r, i) => out.push({ raw: r, where: `${d.id}.followUp[${i}]` }));
  }
  return out;
};

describe("parseCitation", () => {
  it("pulls the fields ecitmatch needs out of the corpus's usual shape", () => {
    const c = parseCitation("Blau N, van Spronsen FJ, Levy HL. Phenylketonuria. Lancet. 2010;376(9750):1417–27. PMID 20971365.");
    expect(c.parsed).toBe(true);
    expect(c.title).toBe("Phenylketonuria");
    expect(c.journal).toBe("Lancet");
    expect(c.year).toBe(2010);
    expect(c.volume).toBe("376");
    expect(c.firstPage).toBe("1417");
    expect(c.pmid).toBe("20971365");
    expect(ecitEligible(c)).toBe(true);
  });

  it("folds diacritics rather than dropping them, or PubMed cannot match the author", () => {
    // "Thöny" -> "Thny" and "Bonafé" -> "Bonaf" would both miss.
    const thony = parseCitation("Thöny B et al. Tetrahydrobiopterin biosynthesis. Biochem J. 2000;347(1):1–16.");
    expect(thony.matchAuthor).toBe("Thony B");
    expect(ecitQuery(thony)).toBe("Biochem J|2000|347|1|Thony B");
  });

  it("keeps a bare year when the string is not a parseable citation", () => {
    const c = parseCitation("American College of Medical Genetics. ACT Sheets, 2001. Available at https://www.acmg.net/");
    expect(c.year).toBe(2001);
    expect(ecitEligible(c)).toBe(false);
  });

  it("handles a supplement issue without inventing a volume", () => {
    const c = parseCitation("Tuchman M et al. N-carbamylglutamate enhances ureagenesis. J Inherit Metab Dis. 2008;31(Suppl 2):S335–40.");
    expect(c.year).toBe(2008);
    expect(c.volume).toBe("31");
    expect(c.firstPage).toBe("S335");
  });

  it("returns null for empty input rather than a half-built record", () => {
    expect(parseCitation("")).toBeNull();
    expect(parseCitation(null)).toBeNull();
  });
});

describe("citationKey", () => {
  const base = "Blau N, van Spronsen FJ, Levy HL. Phenylketonuria. Lancet. 2010;376(9750):1417–27.";

  it("is unchanged by stamping a PMID onto the reference", () => {
    // This is the join between src/disorders.js and the generated map. If
    // appending a PMID changed a citation's identity, every entry would orphan
    // the moment the pipeline ran.
    expect(citationKey(base + " PMID 20971365.")).toBe(citationKey(base));
  });

  it("is unchanged by punctuation and casing, so an en-dash fixed by hand still matches", () => {
    expect(citationKey("Lancet. 2010;376(9750):1417–27.")).toBe(citationKey("lancet 2010;376(9750):1417-27"));
  });

  it("distinguishes genuinely different references", () => {
    expect(citationKey(base)).not.toBe(citationKey("Guthrie R, Susi A. A simple phenylalanine method. Pediatrics. 1963;32:338–43."));
  });

  it("citedPmid and citationText are inverses of the stamp", () => {
    const stamped = base + " PMID 20971365.";
    expect(citedPmid(stamped)).toBe("20971365");
    expect(citationText(stamped)).toBe(base);
    expect(citedPmid(base)).toBeNull();
  });

  it("citationText leaves a PMID that is part of the citation body alone", () => {
    const mid = "Smith J. A paper (PMID 12345678) discussed elsewhere. Lancet. 2010;1:1–2.";
    expect(citationText(mid)).toBe(mid);
  });
});

describe("citationStatus", () => {
  it("treats an inline PMID with no entry as verified — the common case carries no bundle cost", () => {
    const s = citationStatus("Blau N. Phenylketonuria. Lancet. 2010;376(9750):1417–27. PMID 20971365.");
    expect(s).toEqual({ level: "verified", pmid: "20971365", note: null });
  });

  it("treats an unknown, unstamped reference as unverified rather than wrong", () => {
    // Absence of evidence is not the same claim as "this paper does not exist",
    // and the difference is a fabrication accusation.
    expect(citationStatus("Something nobody has checked. J Made Up. 2020;1:1.").level).toBe("unverified");
  });

  it("surfaces the recorded level and note for a citation that did not resolve", () => {
    const [key, entry] = Object.entries(CITATION_PROVENANCE).find(([, e]) => e.l === "wrong" && e.n);
    const raw = allRefs().find((r) => citationKey(r.raw) === key);
    expect(raw, `provenance key with no matching reference: ${key}`).toBeTruthy();
    const s = citationStatus(raw.raw);
    expect(s.level).toBe("wrong");
    expect(s.note).toBe(entry.n);
  });

  it("never returns null, so callers can render uniformly", () => {
    for (const raw of ["", null, undefined, "junk"]) {
      const s = citationStatus(raw);
      expect(s).toHaveProperty("level");
      expect(CITATION_LEVELS[s.level]).toBeTruthy();
    }
  });
});

describe("the generated provenance map", () => {
  const refs = allRefs();
  const keys = new Set(refs.map((r) => citationKey(r.raw)));

  it("has no orphaned entries — every key still matches a reference in the KB", () => {
    // An orphan means a reference was edited without re-running the pipeline,
    // which silently downgrades it to "verified" in the UI.
    const orphans = Object.keys(CITATION_PROVENANCE).filter((k) => !keys.has(k));
    expect(orphans, `run: node scripts/apply-citation-provenance.mjs\norphans:\n${orphans.slice(0, 5).join("\n")}`).toEqual([]);
  });

  it("uses only the four declared levels", () => {
    for (const [k, e] of Object.entries(CITATION_PROVENANCE)) {
      expect(CITATION_LEVELS[e.l], `${k} has level ${e.l}`).toBeTruthy();
    }
  });

  it("records no 'verified' entries — those are represented by the inline PMID", () => {
    expect(Object.values(CITATION_PROVENANCE).filter((e) => e.l === "verified")).toEqual([]);
  });

  it("stamps a PMID on every verified reference and on no unverified one", () => {
    for (const { raw, where } of refs) {
      const s = citationStatus(raw);
      if (s.level === "verified") expect(citedPmid(raw), `${where} is verified but carries no PMID`).toBeTruthy();
      if (s.level === "unverified") expect(citedPmid(raw), `${where} is unverified but carries a PMID`).toBeNull();
    }
  });

  it("covers every reference in the knowledge base", () => {
    // Either an inline PMID or an entry — a reference with neither would render
    // as "not verified" without anyone having looked at it.
    const unaccounted = refs.filter((r) => !citedPmid(r.raw) && !CITATION_PROVENANCE[citationKey(r.raw)]);
    expect(unaccounted.map((r) => r.where)).toEqual([]);
  });
});

describe("one PMID, one paper", () => {
  it("does not stamp the same PMID onto two different citations", () => {
    // How a fabricated citation survives verification: it resolves to a real
    // paper that is already correctly cited elsewhere, so the PMID is valid and
    // the titles overlap enough to pass. HARTNUP cited PMID 12777559 as
    // "Wilcken B et al. Incidence of inborn errors of metabolism by expanded
    // newborn screening in a Californian cohort" — the PMID belongs to Schulze's
    // German cohort, which GA1 cites correctly. Same identifier, two papers,
    // only one of them real.
    //
    // Genuine duplicates are fine and common — the same reference cited by
    // several disorders. What is not fine is two *different* strings claiming
    // the same PMID.
    // The same paper legitimately appears with cosmetic differences — an "ACMG —"
    // prefix on one copy, a trailing bracketed note on another. Those are not
    // what this is looking for, so compare the parsed author and title rather
    // than the raw string, and flag only a genuine disagreement about which
    // paper the identifier denotes.
    const words = (s) => new Set(String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3));
    const overlap = (a, b) => {
      const A = words(a), B = words(b);
      if (!A.size || !B.size) return 1;
      let n = 0; for (const w of A) if (B.has(w)) n++;
      return (2 * n) / (A.size + B.size);
    };
    const surname = (c) => String(c?.matchAuthor || c?.firstAuthor || "").toLowerCase().split(/\s+/)[0] ?? "";

    const byPmid = new Map();
    for (const { raw, where } of allRefs()) {
      const pmid = citedPmid(raw);
      if (!pmid) continue;
      if (!byPmid.has(pmid)) byPmid.set(pmid, []);
      byPmid.get(pmid).push({ raw, where, parsed: parseCitation(raw) });
    }

    const conflicts = [];
    for (const [pmid, variants] of byPmid) {
      const [first, ...rest] = variants;
      for (const other of rest) {
        const sameAuthor = surname(first.parsed) === surname(other.parsed);
        const titleAgrees = overlap(first.parsed?.title, other.parsed?.title) >= 0.6;
        if (sameAuthor && titleAgrees) continue;
        conflicts.push(
          `PMID ${pmid}: ${first.where} "${String(first.parsed?.title).slice(0, 55)}" vs ${other.where} "${String(other.parsed?.title).slice(0, 55)}"`);
      }
    }
    // Ten of these existed when the check was written and all ten are now
    // resolved, so this is back to asserting zero. Two turned out to be genuinely
    // different papers sharing an identifier; the rest were the same paper cited
    // once in full and once in an abbreviated form, which is how a fabricated
    // variant hides next to a real one.
    const CONFLICT_CEILING = 0;
    expect(conflicts.length, conflicts.join("\n")).toBeLessThanOrEqual(CONFLICT_CEILING);
  });

  it("does not let two different papers share one cache key", () => {
    // cacheKey is title+year, which is not unique: a GeneReviews chapter and a
    // review article on the same disorder often carry the same title in the same
    // year. Colliding citations share a single cached verdict, so whichever
    // resolves first decides the PMID the other is stamped with — the same merge
    // that once put a third paper's PMID on both "Creatine deficiency syndromes"
    // entries. The stamps survive today only because both carry an explicit PMID.
    //
    // Keying on the journal too would churn every key in the cache for a problem
    // that is currently one pair, so this ratchets instead: a new collision fails
    // here, where the cheap fix is to disambiguate the citation string.
    const byKey = new Map();
    for (const { raw, where } of allRefs()) {
      const k = cacheKey(parseCitation(raw));
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push({ raw, where });
    }

    const merged = [];
    for (const [k, cites] of byKey) {
      const journals = new Set(cites.map((c) => String(parseCitation(c.raw).journal ?? "").toLowerCase()).filter(Boolean));
      const pmids = new Set(cites.map((c) => citedPmid(c.raw)).filter(Boolean));
      if (journals.size > 1 || pmids.size > 1) {
        merged.push(`${k}\n    ${[...new Set(cites.map((c) => `${c.where} ${c.raw.slice(0, 90)}`))].join("\n    ")}`);
      }
    }
    // One pair: PCD's Orphanet review and its GeneReviews chapter, both titled
    // "Systemic primary carnitine deficiency" in 2012.
    const COLLISION_CEILING = 1;
    expect(merged.length, merged.join("\n")).toBeLessThanOrEqual(COLLISION_CEILING);
  });
});

describe("ordinal citation markers", () => {
  // The narratives cite references as "[2,16]" — 1,276 such markers. Nothing in
  // the data model ties a marker to the reference list, so deleting a fabricated
  // reference silently renumbers every later one and re-points every marker past
  // it at the wrong paper. That is a worse defect than the fabricated citation
  // was: a wrong attribution reads as sourced.
  const markers = (d) =>
    Object.values(d.narrative ?? {})
      .filter((v) => typeof v === "string")
      .flatMap((v) => [...v.matchAll(/\[([\d,\s]+)\]/g)])
      .flatMap((m) => m[1].split(",").map((x) => parseInt(x.trim(), 10)))
      .filter(Number.isFinite);

  it("never point past the end of their reference list", () => {
    const bad = [];
    for (const d of DISORDERS) {
      const n = (d.narrative?.references ?? []).length;
      for (const m of new Set(markers(d))) {
        if (m < 1 || m > n) bad.push(`${d.id}: marker [${m}] but ${n} references`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("leave no reference uncited, which is how a stale renumbering shows up", () => {
    // Not strictly an error — but in this corpus every reference was written to
    // support something, so an orphan usually means a marker was renumbered past
    // it. Listed rather than asserted per disorder so the failure is readable.
    const orphaned = [];
    for (const d of DISORDERS) {
      const refs = d.narrative?.references ?? [];
      if (!refs.length) continue;
      const cited = new Set(markers(d));
      if (!cited.size) continue;   // some narratives carry no markers at all
      for (let i = 1; i <= refs.length; i++) if (!cited.has(i)) orphaned.push(`${d.id}[${i}]`);
    }
    // A ratchet, like the others: this was the state when the check was added.
    expect(orphaned.length, `uncited references: ${orphaned.slice(0, 12).join(", ")}`).toBeLessThanOrEqual(180);
  });
});

describe("knowledge-base citation health", () => {
  // Ratchets, in the opposite direction from provenance.test.js's COVERAGE_FLOOR:
  // these are defects, so the count may fall but never rise. Lower them as bad
  // citations are corrected or removed; raising one means a regression was
  // committed and should be justified in the commit message.
  //
  // Counted per unique reference *string*, which is both what the provenance map
  // is keyed by and what a reader actually sees on a disorder page — not per
  // unique paper, which undercounts a bad citation repeated across disorders.
  //
  // Re-baselined 2026-07-31, and the ceiling went UP (250 -> 325) — which for a
  // ratchet needs saying out loud. Nothing regressed in the knowledge base; the
  // resolver was wrong in both directions and both were fixed at once. It could
  // not find long titles at all (PubMed drops stopwords from its phrase index),
  // so real papers were being withheld; and it accepted any high-scoring title
  // hit, so ~75 lookalikes were being displayed as merely needing a detail check
  // — a paper on electroconvulsive therapy standing in for one on sodium
  // benzoate in NKH. Verified rose 585 -> 617 on the first count, withheld rose
  // on the second. From here the ceiling only falls.
  //
  // Tightened 2026-08-04 to the counts the repairs have actually reached. The
  // last batch closed the author-gap population: nine citations that carried a
  // PMID belonging to a *different* author's paper with a near-identical title
  // (Fernandes on glycogen storage disease pointing at Ryman's paper of the same
  // name, Hwu's AADC gene-therapy trial pointing at a commentary on it). Every
  // one turned out to be a real paper wearing invented coordinates, so they were
  // corrected rather than withdrawn.
  const WRONG_CEILING = 158;      // point at nothing, or at an unrelated paper
  const VERIFIED_FLOOR = 721;     // title matches the paper PubMed holds

  const byLevel = {};
  for (const key of new Set(allRefs().map((r) => r.raw))) {
    const l = citationStatus(key).level;
    byLevel[l] = (byLevel[l] ?? 0) + 1;
  }

  it(`has no more than ${WRONG_CEILING} citations that do not match their source`, () => {
    expect(byLevel.wrong ?? 0, `${byLevel.wrong} unresolvable citations; ceiling is ${WRONG_CEILING}`).toBeLessThanOrEqual(WRONG_CEILING);
  });

  it(`keeps at least ${VERIFIED_FLOOR} citations verified against PubMed`, () => {
    expect(byLevel.verified ?? 0).toBeGreaterThanOrEqual(VERIFIED_FLOOR);
  });

  it("has not regressed on the three citations found fabricated in the July 2026 audit", () => {
    // These were removed from the scoring layer; the check is that they do not
    // reappear anywhere in the narratives either.
    const src = DISORDERS.flatMap((d) => [...(d.narrative?.references ?? []), ...(d.followUp?.references ?? [])]).join("\n");
    for (const ghost of ["Norris et al", "Norris DA"]) expect(src).not.toContain(ghost);
  });
});
