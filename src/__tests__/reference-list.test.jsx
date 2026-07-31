// Render test for the disorder-page reference list.
//
// The data behind it is covered by citations.test.js; what this checks is that
// the component actually puts the verdict in front of the reader. Server-side
// rendering to a string is enough for that and needs no DOM.
//
// The specific regression it guards: a citation that matches no publication
// leaking onto the page. Those are withheld outright — see the standing rule in
// src/citations.js — so the test asserts their bibliographic details are absent
// from the rendered output, not merely flagged. Everything else here is cosmetic.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ReferenceList from "../components/ReferenceList.jsx";
import { CITATION_LEVELS, isWithheld } from "../citations.js";
import { DISORDERS } from "../disorders.js";

const render = (refs) => renderToStaticMarkup(<ReferenceList refs={refs} accent="#1d4ed8"/>);

// Real strings from the knowledge base, one per verdict level.
const VERIFIED = "Blau N, van Spronsen FJ, Levy HL. Phenylketonuria. Lancet. 2010;376(9750):1417–27. PMID 20971365.";
const WRONG = DISORDERS.flatMap((d) => d.narrative?.references ?? [])
  .find((r) => !/PMID/i.test(r) && r.includes("Opladen") && r.includes("Mol Genet Metab"));

describe("ReferenceList", () => {
  it("links a verified reference to PubMed and shows no warning badge", () => {
    const html = render([VERIFIED]);
    expect(html).toContain("https://pubmed.ncbi.nlm.nih.gov/20971365/");
    expect(html).toContain("PMID 20971365");
    expect(html).not.toContain(CITATION_LEVELS.wrong.label);
    // The stamp is rendered as the link, not left duplicated in the body text.
    expect(html).not.toContain("1417–27. PMID 20971365.");
  });

  it("withholds a citation that matches no publication — none of it is rendered", () => {
    expect(WRONG, "expected the unresolvable Opladen citation to still be in the KB").toBeTruthy();
    const html = render([WRONG]);
    expect(html).toContain("Reference withheld");
    // The point of the rule: nothing citable survives into the output.
    for (const fragment of ["Opladen", "Mol Genet Metab", "2020", "131"]) {
      expect(html, `withheld citation leaked "${fragment}"`).not.toContain(fragment);
    }
    expect(html).not.toContain("pubmed.ncbi.nlm.nih.gov");
  });

  it("keeps the ordinal slot, so numbered claims in the prose still line up", () => {
    // Narrative text cites references as [2,16]. Dropping a withheld entry
    // would renumber everything after it and mis-attribute those claims.
    const html = render([WRONG, VERIFIED]);
    expect((html.match(/<li/g) ?? []).length).toBe(2);
    expect(html.indexOf("Reference withheld")).toBeLessThan(html.indexOf("Phenylketonuria"));
  });

  it("counts the withheld ones in the summary, so a thin evidence base is visible", () => {
    const html = render([VERIFIED, WRONG]);
    expect(html).toContain("1 " + CITATION_LEVELS.verified.label);
    expect(html).toContain("1 " + CITATION_LEVELS.wrong.label);
  });

  it("renders an unknown reference as unverified rather than as wrong", () => {
    const html = render(["Someone. A paper nobody resolved. J Unknown. 2020;1(1):1–2."]);
    expect(html).toContain(CITATION_LEVELS.unverified.label);
    expect(html).not.toContain(CITATION_LEVELS.wrong.label);
  });

  it("leaks no withheld citation anywhere in the knowledge base", () => {
    // The standing rule, enforced across all 116 disorders rather than on one
    // sample: if a citation resolves to no publication, its title must not
    // appear on the page that would have cited it.
    let checked = 0;
    for (const d of DISORDERS) {
      const refs = [...(d.narrative?.references ?? []), ...(d.followUp?.references ?? [])];
      const withheld = refs.filter(isWithheld);
      if (!withheld.length) continue;
      const html = render(refs);
      for (const raw of withheld) {
        // The title is the distinctive part — journal names recur legitimately.
        const title = raw.split(". ")[1];
        if (!title || title.length < 25) continue;
        expect(html, `${d.id} leaked withheld citation: ${title.slice(0, 60)}`).not.toContain(title);
        checked++;
      }
    }
    expect(checked, "expected withheld citations to exist to test against").toBeGreaterThan(100);
  });

  it("renders every disorder's reference list without throwing", () => {
    // Guards against an unrecognised level reaching CITATION_LEVELS[...] and
    // taking the whole encyclopedia page down.
    for (const d of DISORDERS) {
      const refs = [...(d.narrative?.references ?? []), ...(d.followUp?.references ?? [])];
      if (refs.length) expect(() => render(refs), `${d.id} failed to render`).not.toThrow();
    }
  });
});
