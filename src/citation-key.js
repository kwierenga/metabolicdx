// Identity helpers for the knowledge base's free-text literature references.
//
// Deliberately dependency-free: both the browser bundle and the build scripts
// that *generate* src/citation-provenance.js need these, and the generator
// cannot import a module that imports its own output.

/**
 * Stable identity for a reference string, used to join src/disorders.js to the
 * generated provenance map. Ignores the PMID suffix (so appending one does not
 * change a citation's identity) and all punctuation and casing (so an en-dash
 * fixed by hand later does not silently orphan its entry).
 */
export const citationKey = (raw) =>
  String(raw ?? "")
    .replace(/\s*PMID:?\s*\d+\.?\s*$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** The PMID a reference carries inline, if it resolved cleanly. */
export const citedPmid = (raw) => String(raw ?? "").match(/PMID:?\s*(\d{4,8})/i)?.[1] ?? null;
