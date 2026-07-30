// ─── LITERATURE REFERENCE REGISTRY ───────────────────────────
//
// Machine-verifiable provenance for the *scoring* layer.
//
// Why this file exists
// --------------------
// The disorder narratives in disorders.js carry ~1,050 prose citations, but the
// data that actually drives the differential — signature marker directions and
// weights, ratio cut-offs, reference intervals, the covariate model, the
// analytical ceiling, the LR product — carried none. A number that moves a
// differential is exactly the number that has to be defensible, so every such
// datum should be able to name its source.
//
// Every entry here has been resolved against PubMed: `pmid` and `doi` are
// verified identifiers, not recalled ones. Do NOT add an entry from memory —
// look it up, and record the identifier you looked up. `provenance.test.js`
// asserts that each entry carries at least one resolvable identifier, but it
// cannot tell a real PMID from an invented one; that discipline is yours.
//
// `localCopy` points at the full text under docs/ where we hold it.
//
// Usage convention — three distinct states, deliberately not collapsed
// ---------------------------------------------------------------------
//   ref: ["marquardt-2012-clir"]
//        VERIFIED. The source exists, is in this registry, and actually
//        supports the diagnostic use of this marker/ratio.
//
//   refPending: "Walker 2009"
//        CLAIMED BUT UNCHECKED. Carried over from an older code comment. Kept
//        verbatim so the lead is not lost; not to be trusted or displayed as a
//        source.
//
//   refDisputed: "Coelho 2008 (PMID 18385497) is a cblD gene-identification
//                 paper and does not establish this ratio"
//        CHECKED AND REJECTED. Either the paper does not exist, or it exists
//        but does not support the claim attached to it. Recorded so the same
//        bad citation is not re-added later by someone reading the old comment.
//
// Absence of all three means UNSOURCED, not "obviously true". The provenance
// test ratchets coverage upward — see COVERAGE_FLOOR in
// src/__tests__/provenance.test.js.
//
// Checked 2026-07-29 and found NOT to support their claims: "Norris et al.
// JIMD 2007", "Turgeon et al. JIMD 2014" and "Rinaldo et al. Eur J Pediatr
// 2008" do not exist in PubMed at all; Hamosh 1998, Coelho 2008 and the
// "Strauss 2006" lead resolve to real papers on other subjects.

export const REFERENCES = {
  // ── Analytical / technical standards, by panel ──
  "sharer-2018-amino-acids": {
    authors: "Sharer JD, De Biase I, Matern D, Young S, Bennett MJ, et al.",
    title:
      "Laboratory analysis of amino acids, 2018 revision: a technical standard of the American College of Medical Genetics and Genomics (ACMG)",
    journal: "Genet Med",
    year: 2018,
    volume: "20",
    issue: "12",
    pages: "1499–1507",
    pmid: "30459394",
    doi: "10.1038/s41436-018-0328-6",
    localCopy: "docs/s41436-018-0328-6.pdf",
  },
  "gallagher-2018-organic-acids": {
    authors: "Gallagher RC, Pollard L, Scott AI, Huguenin S, Goodman S, Sun Q.",
    title:
      "Laboratory analysis of organic acids, 2018 update: a technical standard of the American College of Medical Genetics and Genomics (ACMG)",
    journal: "Genet Med",
    year: 2018,
    volume: "20",
    issue: "7",
    pages: "683–691",
    pmid: "29543224",
    doi: "10.1038/gim.2018.45",
    localCopy: "docs/1-s2.0-S1098360021018335-main.pdf",
  },
  "miller-2021-acylcarnitine": {
    authors: "Miller MJ, Cusmano-Ozog K, Oglesbee D, Young S.",
    title:
      "Laboratory analysis of acylcarnitines, 2020 update: a technical standard of the American College of Medical Genetics and Genomics (ACMG)",
    journal: "Genet Med",
    year: 2021,
    volume: "23",
    issue: "2",
    pages: "249–258",
    pmid: "33071282",
    doi: "10.1038/s41436-020-00990-1",
    localCopy: "docs/1-s2.0-S1098360021025508-main.pdf",
  },
  "rinaldo-2008-acylcarnitine": {
    authors: "Rinaldo P, Cowan TM, Matern D.",
    title: "Acylcarnitine profile analysis",
    journal: "Genet Med",
    year: 2008,
    volume: "10",
    issue: "2",
    pages: "151–156",
    pmid: "18281923",
    localCopy: "docs/gim200822.pdf",
  },

  // ── Post-analytical interpretation (CLIR) — the model this engine imitates ──
  "marquardt-2012-clir": {
    authors: "Marquardt G, Currier R, McHugh DMS, et al.",
    title:
      "Enhanced interpretation of newborn screening results without analyte cutoff values",
    journal: "Genet Med",
    year: 2012,
    volume: "14",
    issue: "7",
    pages: "648–655",
    pmid: "22766634",
    doi: "10.1038/gim.2012.2",
  },
  "gavrilov-2020-clir": {
    authors:
      "Gavrilov DK, Piazza AL, Pino G, Turgeon C, Matern D, Oglesbee D, Raymond K, Tortorelli S, Rinaldo P.",
    title:
      "The combined impact of CLIR post-analytical tools and second tier testing on the performance of newborn screening for disorders of propionate, methionine, and cobalamin metabolism",
    journal: "Int J Neonatal Screen",
    year: 2020,
    volume: "6",
    issue: "2",
    pages: "33",
    pmid: "33073028",
    doi: "10.3390/ijns6020033",
    localCopy: "docs/IJNS-06-00033.pdf",
  },
  "rowe-2021-clir-covariate": {
    authors:
      "Rowe AD, Stoway SD, Åhlman H, Arora V, Caggana M, Fornari A, Hagar A, Hall PL, Marquardt GC, et al.",
    title:
      "A novel approach to improve newborn screening for congenital hypothyroidism by integrating covariate-adjusted results of different tests into CLIR customized interpretive tools",
    journal: "Int J Neonatal Screen",
    year: 2021,
    volume: "7",
    issue: "2",
    pages: "23",
    pmid: "33922835",
    doi: "10.3390/ijns7020023",
    localCopy: "docs/IJNS-07-00023.pdf",
  },
  "hall-2020-clir-triage": {
    authors: "Hall PL, Wittenauer A, Hagar A.",
    title:
      "Post-analytical tools for the triage of newborn screening results in follow-up can reduce confirmatory testing and guide performance improvement",
    journal: "Int J Neonatal Screen",
    year: 2020,
    volume: "6",
    issue: "1",
    pages: "20",
    pmid: "33073017",
    doi: "10.3390/ijns6010020",
    localCopy: "docs/IJNS-06-00020.pdf",
  },

  // ── Population distributions / interlaboratory performance ──
  "schulze-2003-expanded-nbs": {
    authors: "Schulze A, Lindner M, Kohlmüller D, Olgemöller K, Mayatepek E, Hoffmann GF.",
    title:
      "Expanded newborn screening for inborn errors of metabolism by electrospray ionization-tandem mass spectrometry: results, outcome, and implications",
    journal: "Pediatrics",
    year: 2003,
    volume: "111",
    issue: "6 Pt 1",
    pages: "1399–1406",
    pmid: "12777559",
    doi: "10.1542/peds.111.6.1399",
  },
  "oglesbee-2018-cap-acmg": {
    // NOTE: cited in earlier code comments as "Oglesbee 2017" — that was the
    // online-first date (gim.2017.61). The issue of record is Genet Med 2018;20(1).
    authors:
      "Oglesbee D, Cowan TM, Pasquali M, Wood TC, Weck KE, Long T, Palomaki GE.",
    title:
      "CAP/ACMG proficiency testing for biochemical genetics laboratories: a summary of performance",
    journal: "Genet Med",
    year: 2018,
    volume: "20",
    issue: "1",
    pages: "83–90",
    pmid: "28661487",
    doi: "10.1038/gim.2017.61",
    localCopy: "docs/gim201761a.pdf",
  },

  // ── Statistical interpretation ──
  "jaeschke-1994-likelihood-ratios": {
    authors: "Jaeschke R, Guyatt GH, Sackett DL.",
    title:
      "Users' guides to the medical literature. III. How to use an article about a diagnostic test. B. What are the results and will they help me in caring for my patients?",
    journal: "JAMA",
    year: 1994,
    volume: "271",
    issue: "9",
    pages: "703–707",
    pmid: "8309035",
    doi: "10.1001/jama.271.9.703",
  },

  // ── Disorder-specific ──
  "ibdah-1999-lchad": {
    authors: "Ibdah JA, Bennett MJ, Rinaldo P, et al.",
    title:
      "A fetal fatty-acid oxidation disorder as a cause of liver disease in pregnant women",
    journal: "N Engl J Med",
    year: 1999,
    volume: "340",
    issue: "22",
    pages: "1723–1731",
    pmid: "10352164",
    doi: "10.1056/NEJM199906033402204",
  },
  "kolker-2011-ga1": {
    authors: "Kölker S, Christensen E, Leonard JV, et al.",
    title:
      "Diagnosis and management of glutaric aciduria type I — revised recommendations",
    journal: "J Inherit Metab Dis",
    year: 2011,
    volume: "34",
    issue: "3",
    pages: "677–694",
    pmid: "21431622",
    doi: "10.1007/s10545-011-9289-5",
  },
  "camacho-2006-hhh": {
    authors: "Camacho JA, Rioseco-Camacho N, Andrade D, Porter J, Kong J.",
    title:
      "Clinical and functional characterization of a human ORNT1 mutation (T32R) in the hyperornithinemia-hyperammonemia-homocitrullinuria (HHH) syndrome",
    journal: "Pediatr Res",
    year: 2006,
    volume: "60",
    issue: "4",
    pages: "423–429",
    pmid: "16940241",
    doi: "10.1203/01.pdr.0000238301.25938.f5",
  },

  // ── ADSL deficiency: the two succinylpurines are DISTINCT metabolites ──
  // Added 2026-07-30 after this app was found to label a single UOA field
  // "Succinyladenosine (SAICAr)" — conflating the two dephosphorylated
  // substrates of adenylosuccinate lyase. Jurecka 2015 states it plainly:
  // "two dephosphorylated substrates of ADSL enzyme: succinylaminoimidazole
  // carboxamide riboside (SAICAr) and succinyladenosine (S-Ado)". Their RATIO
  // is the severity discriminator, so one field could not carry both.
  "jurecka-2015-adsl": {
    authors: "Jurecka A, Zikanova M, Kmoch S, Tylki-Szymańska A.",
    title: "Adenylosuccinate lyase deficiency",
    journal: "J Inherit Metab Dis",
    year: 2015,
    volume: "38",
    issue: "2",
    pages: "231–242",
    pmid: "25112391",
    doi: "10.1007/s10545-014-9755-y",
  },
  "jaeken-1988-adsl-ratio": {
    // The primary source for the S-Ado/SAICA-riboside ratio as a severity
    // discriminator, and it gives the actual numbers: in the seven severely
    // retarded patients the ratio was "between 1 and 2" in CSF, plasma and
    // urine; in the one markedly milder patient it was "around 5". Note the
    // direction — a LOW ratio marks the severe phenotype.
    authors:
      "Jaeken J, Wadman SK, Duran M, van Sprang FJ, Beemer FA, Holl RA, Theunissen PM, de Cock P, van den Bergh F, Vincent MF, et al.",
    title: "Adenylosuccinase deficiency: an inborn error of purine nucleotide synthesis",
    journal: "Eur J Pediatr",
    year: 1988,
    volume: "148",
    issue: "2",
    pages: "126–131",
    pmid: "3234432",
    doi: "10.1007/BF00445919",
  },
  "krijt-2013-adsl-deribosylation": {
    // Analytical caveat worth surfacing: bacterial deribosylation of SAICAr and
    // S-Ado in urine produces FALSE-NEGATIVE screening. Argues against treating
    // a normal urine purine screen as excluding ADSL deficiency.
    authors: "Krijt J, Skopova V, Adamkova V, Cermakova R, Jurecka A, Kmoch S, Zikanova M.",
    title:
      "The need for vigilance: false-negative screening for adenylosuccinate lyase deficiency caused by deribosylation of urinary biomarkers",
    journal: "Clin Biochem",
    year: 2013,
    volume: "46",
    issue: "18",
    pages: "1899–1901",
    pmid: "24183879",
    doi: "10.1016/j.clinbiochem.2013.10.018",
  },
  "donti-2016-adsl-metabolomics": {
    authors:
      "Donti TR, Cappuccio G, Hubert L, Neira J, Atwal PS, Miller MJ, Cardon AL, Sutton VR, Porter BE, Baumer FM, Wangler MF, Sun Q, Emrick LT, Elsea SH.",
    title:
      "Diagnosis of adenylosuccinate lyase deficiency by metabolomic profiling in plasma reveals a phenotypic spectrum",
    journal: "Mol Genet Metab Rep",
    year: 2016,
    volume: "8",
    pages: "61–66",
    pmid: "27504266",
    doi: "10.1016/j.ymgmr.2016.07.007",
  },
};

// Panel-level analytical standards.
//
// These name the technical standard that defines how the panel is *measured and
// interpreted*. They are deliberately NOT attached to individual reference
// intervals: the lo/hi values in this app are laboratory-convention values whose
// exact origin is not yet traced, and claiming otherwise would be the precise
// kind of unsourced assertion this file exists to prevent.
export const PANEL_STANDARDS = {
  PAA: ["sharer-2018-amino-acids"],
  UOA: ["gallagher-2018-organic-acids"],
  AC: ["miller-2021-acylcarnitine", "rinaldo-2008-acylcarnitine"],
  CAR: ["miller-2021-acylcarnitine"],
  UAG: ["gallagher-2018-organic-acids"],
  MISC: [],
};

// Provenance for the scoring engine's own constructs, keyed by the mechanism.
// Surfaced in the UI wherever the mechanism visibly alters a score.
export const METHOD_REFS = {
  covariateModel: {
    label: "Covariate-adjusted Z-score",
    claim:
      "Analyte medians regressed on age and birth weight rather than compared with fixed cut-offs.",
    ref: ["rowe-2021-clir-covariate", "marquardt-2012-clir", "gavrilov-2020-clir"],
  },
  tailModel: {
    label: "Log-normal tail model",
    claim:
      "Metabolite concentrations treated as log-normal; rarity scored from a Student-t tail rather than a binary cut-off.",
    ref: ["marquardt-2012-clir", "schulze-2003-expanded-nbs"],
  },
  analyticalCeiling: {
    label: "Analytical sensitivity ceiling",
    claim:
      "Scores capped for disorders with documented interlaboratory proficiency-testing limits.",
    ref: ["oglesbee-2018-cap-acmg"],
  },
  lrProduct: {
    label: "Likelihood-ratio product",
    claim:
      "Naive-Bayes product of per-analyte likelihood ratios. The LR>10 / LR>100 interpretive bands are the standard diagnostic-test thresholds; the product itself is this tool's own construction, not a published algorithm.",
    ref: ["jaeschke-1994-likelihood-ratios", "marquardt-2012-clir"],
  },
  postAnalyticalTriage: {
    label: "Post-analytical triage",
    claim:
      "Ranked differential used to triage rather than to diagnose, following CLIR's post-analytical tool design.",
    ref: ["hall-2020-clir-triage", "marquardt-2012-clir"],
  },
  isobaricResolution: {
    label: "Isobaric species resolution",
    claim:
      "Decision trees separating isobaric acylcarnitine species (C4, C5, C5-OH, C5-DC).",
    ref: ["miller-2021-acylcarnitine", "rinaldo-2008-acylcarnitine"],
  },
};

export const REF_KEYS = Object.keys(REFERENCES);

/** Look up one reference by key. Returns undefined for unknown keys. */
export function getRef(key) {
  return REFERENCES[key];
}

/** Stable external URL for a reference — PubMed if we have a PMID, else DOI. */
export function refUrl(ref) {
  if (!ref) return null;
  if (ref.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`;
  if (ref.doi) return `https://doi.org/${ref.doi}`;
  return null;
}

/** Vancouver-ish one-line citation. */
export function formatRef(ref) {
  if (!ref) return "";
  const vol = ref.volume ? `;${ref.volume}${ref.issue ? `(${ref.issue})` : ""}` : "";
  const pg = ref.pages ? `:${ref.pages}` : "";
  return `${ref.authors} ${ref.title}. ${ref.journal}. ${ref.year}${vol}${pg}.`;
}

/** Short "Author Year" label for dense UI (chips, tooltips). */
export function shortRef(ref) {
  if (!ref) return "";
  const first = (ref.authors || "").split(/[ ,]/)[0];
  return `${first} ${ref.year}`;
}

/**
 * Resolve an array of ref keys to reference objects, dropping unknown keys.
 * Unknown keys are a data error — provenance.test.js fails on them — but the UI
 * must not crash on one.
 */
export function resolveRefs(keys) {
  if (!keys?.length) return [];
  return keys.map((k) => REFERENCES[k]).filter(Boolean);
}
