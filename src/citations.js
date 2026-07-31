// Verification state for the knowledge base's free-text literature references.
//
// The narratives carry ~1,150 citation strings that were largely bulk-generated,
// so a citation cannot be assumed to describe a real paper. scripts/check-citations.mjs
// resolves every one of them against PubMed; scripts/apply-citation-provenance.mjs
// writes the outcome back as:
//
//   - a "PMID nnnnnnnn." suffix on the reference string itself, for the ones that
//     resolved cleanly — so src/disorders.js is self-describing when read directly;
//   - an entry in the generated src/citation-provenance.js for every one that did
//     not, which is what this module surfaces to the UI.
//
// A citation with no entry and an inline PMID is verified. That asymmetry is
// deliberate: the common case costs no extra bytes in the bundle.
import { CITATION_PROVENANCE } from "./citation-provenance.js";
import { citationKey, citedPmid } from "./citation-key.js";

export { citationKey, citedPmid };

/**
 * How a reference should be presented. Four levels, because "PubMed has no such
 * paper" and "PubMed has this paper but the year is off by one" are different
 * claims and collapsing them would either cry wolf or hide a fabrication.
 *
 * `wrong` is not a warning label — it is a suppression. A citation that resolves
 * to no paper is withheld outright rather than shown with a badge, because a
 * fabricated citation on the page is one a clinician can still copy into a
 * letter or a referral, and a badge does not stop that. See isWithheld().
 */
export const CITATION_LEVELS = {
  verified: { label: "verified", tone: "text-emerald-600", title: "Resolved against PubMed; the cited title matches the paper." },
  check: { label: "check details", tone: "text-amber-600", title: "The paper exists, but a bibliographic detail does not match PubMed." },
  unverified: { label: "not verified", tone: "text-slate-400", title: "Not indexed by PubMed, so it could not be confirmed either way." },
  wrong: { label: "withheld", tone: "text-rose-600", title: "This citation matches no publication in PubMed, so it is not shown and is not used as a source." },
};

/**
 * Must this reference be withheld rather than displayed?
 *
 * The bibliographic details are deliberately not rendered anywhere for these.
 * They stay in src/disorders.js only because the narrative prose cites
 * references by ordinal — dropping an entry would renumber the list and
 * mis-attribute every later claim. Maintainers get the withheld details from
 * scripts/citation-report.json, not from the UI.
 */
export const isWithheld = (raw) => citationStatus(raw).level === "wrong";

/**
 * The reference as it should be shown: without the trailing "PMID nnnnnnnn."
 * stamp, which the UI renders as a link instead of as text. Leaves a PMID that
 * appears mid-string alone — those were in the corpus already and read as part
 * of the citation.
 */
export const citationText = (raw) => String(raw ?? "").replace(/\s*PMID:?\s*\d+\.?\s*$/i, "").trim();

/**
 * Verification state for one reference string.
 * Returns `{ level, pmid, note }` — never null, so callers can render uniformly.
 */
export function citationStatus(raw) {
  const entry = CITATION_PROVENANCE[citationKey(raw)];
  const pmid = citedPmid(raw);
  if (!entry) return { level: pmid ? "verified" : "unverified", pmid, note: null };
  return { level: entry.l, pmid: entry.p ?? pmid, note: entry.n ?? null };
}
