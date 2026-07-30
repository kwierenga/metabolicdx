// Analyte reference data: panel definitions, derived ratios, per-analyte tail
// distributions, age-banded limits and the neonatal covariate model.
//
// Pure data with no behaviour, extracted from App.jsx so the scoring engine and
// its tests can load it without pulling in React. Reference intervals here are
// laboratory-convention values whose provenance is deliberately NOT claimed —
// see the PANEL_STANDARDS note in references.js.

import { DISORDERS } from "./disorders.js";

// ─── REFERENCE DATA ──────────────────────────────────────────
export const PAA_ANALYTES = [
  {id:"Ala",    name:"Alanine",                lo:200,hi:550, unit:"µmol/L"},
  {id:"Arg",    name:"Arginine",               lo:10, hi:140, unit:"µmol/L"},
  {id:"Asn",    name:"Asparagine",             lo:30, hi:80,  unit:"µmol/L"},
  {id:"Asp",    name:"Aspartate",              lo:0,  hi:26,  unit:"µmol/L"},
  {id:"Cit",    name:"Citrulline",             lo:10, hi:45,  unit:"µmol/L"},
  {id:"Gln",    name:"Glutamine",              lo:400,hi:800, unit:"µmol/L"},
  {id:"Glu",    name:"Glutamate",              lo:20, hi:200, unit:"µmol/L"},
  {id:"Gly",    name:"Glycine",                lo:150,hi:450, unit:"µmol/L"},
  {id:"His",    name:"Histidine",              lo:50, hi:130, unit:"µmol/L"},
  {id:"Ile",    name:"Isoleucine",             lo:40, hi:100, unit:"µmol/L"},
  {id:"Leu",    name:"Leucine",                lo:70, hi:200, unit:"µmol/L"},
  {id:"Lys",    name:"Lysine",                 lo:100,hi:250, unit:"µmol/L"},
  {id:"Met",    name:"Methionine",             lo:15, hi:45,  unit:"µmol/L"},
  {id:"Orn",    name:"Ornithine",              lo:20, hi:120, unit:"µmol/L"},
  {id:"Phe",    name:"Phenylalanine",          lo:30, hi:90,  unit:"µmol/L"},
  {id:"Pro",    name:"Proline",                lo:100,hi:450, unit:"µmol/L"},
  {id:"Ser",    name:"Serine",                 lo:80, hi:200, unit:"µmol/L"},
  {id:"Thr",    name:"Threonine",              lo:60, hi:180, unit:"µmol/L"},
  {id:"Tyr",    name:"Tyrosine",               lo:40, hi:120, unit:"µmol/L"},
  {id:"Val",    name:"Valine",                 lo:150,hi:310, unit:"µmol/L"},
  {id:"AlloIle",name:"Alloisoleucine",           lo:0,  hi:5,   unit:"µmol/L"},
  {id:"Hcy",    name:"Homocysteine (total)",     lo:5,  hi:15,  unit:"µmol/L"},
  {id:"ASA",    name:"Argininosuccinic acid",    lo:0,  hi:2,   unit:"µmol/L"},
  {id:"Pip",    name:"Pipecolic acid",           lo:0,  hi:3,   unit:"µmol/L"},
  // ── Extended physiological panel (Quest-style full profile) ──
  {id:"Trp",    name:"Tryptophan",               lo:20, hi:95,  unit:"µmol/L"},
  {id:"3OMD",   name:"3-O-methyldopa (3-OMD)",   lo:0,  hi:0.15,unit:"µmol/L"},  // AADC deficiency: plasma marker (normally undetectable); Atwal 2015
  {id:"AABA",   name:"α-Aminobutyric acid",      lo:5,  hi:30,  unit:"µmol/L"},
  {id:"Etha",   name:"Ethanolamine",             lo:0,  hi:20,  unit:"µmol/L"},
  {id:"3MHis",  name:"3-Methylhistidine",        lo:0,  hi:20,  unit:"µmol/L"},
  {id:"GABA",   name:"γ-Aminobutyric acid",      lo:0,  hi:5,   unit:"µmol/L"},
  {id:"1MHis",  name:"1-Methylhistidine",        lo:0,  hi:30,  unit:"µmol/L"},
  {id:"AAAdp",  name:"α-Aminoadipic acid",       lo:0,  hi:10,  unit:"µmol/L"},
  {id:"HyPro",  name:"Hydroxyproline",           lo:0,  hi:35,  unit:"µmol/L"},
  {id:"Sarc",   name:"Sarcosine",                lo:0,  hi:5,   unit:"µmol/L"},
  {id:"BAla",   name:"Beta-Alanine",             lo:0,  hi:8,   unit:"µmol/L"},
];

export const UOA_ANALYTES = [
  {id:"MMA",    name:"Methylmalonic acid",         lo:0,hi:4,   unit:"mmol/mol Cr"},
  {id:"3OHprop",name:"3-OH-propionic acid",        lo:0,hi:10,  unit:"mmol/mol Cr"},
  {id:"MCA",    name:"Methylcitric acid",          lo:0,hi:1.5, unit:"mmol/mol Cr"},
  {id:"PG",     name:"Propionylglycine",           lo:0,hi:2,   unit:"mmol/mol Cr"},
  {id:"TG",     name:"Tiglylglycine",              lo:0,hi:1,   unit:"mmol/mol Cr"},
  {id:"EMA",    name:"Ethylmalonic acid",          lo:0,hi:10,  unit:"mmol/mol Cr"},
  {id:"Malonic",name:"Malonic acid",               lo:0,hi:2,   unit:"mmol/mol Cr"},
  {id:"IVG",    name:"Isovalerylglycine",          lo:0,hi:1,   unit:"mmol/mol Cr"},
  {id:"MCG",    name:"3-Methylcrotonylglycine",    lo:0,hi:0.5, unit:"mmol/mol Cr"},
  {id:"3OHIV",  name:"3-OH-isovaleric acid",       lo:0,hi:12,  unit:"mmol/mol Cr"},
  {id:"GA",     name:"Glutaric acid",              lo:0,hi:4,   unit:"mmol/mol Cr"},
  {id:"3OHGA",  name:"3-OH-glutaric acid",         lo:0,hi:3,   unit:"mmol/mol Cr"},
  {id:"HMG",    name:"3-OH-3-methylglutaric acid", lo:0,hi:3,   unit:"mmol/mol Cr"},
  {id:"Adipic", name:"Adipic acid",                lo:0,hi:10,  unit:"mmol/mol Cr"},
  {id:"Suberic",name:"Suberic acid",               lo:0,hi:4,   unit:"mmol/mol Cr"},
  {id:"Sebacic",name:"Sebacic acid",               lo:0,hi:2,   unit:"mmol/mol Cr"},
  {id:"SA",     name:"Succinylacetone",            lo:0,hi:1,   unit:"mmol/mol Cr"},
  {id:"4OHpp",  name:"4-OH-phenylpyruvic acid",    lo:0,hi:5,   unit:"mmol/mol Cr"},
  {id:"4OHpl",  name:"4-OH-phenyllactic acid",     lo:0,hi:30,  unit:"mmol/mol Cr"},
  {id:"HGA",    name:"Homogentisic acid",          lo:0,hi:1,   unit:"mmol/mol Cr"},
  {id:"Orotic", name:"Orotic acid",                lo:0,hi:10,  unit:"mmol/mol Cr"},
  {id:"Fumaric",name:"Fumaric acid",               lo:0,hi:4,   unit:"mmol/mol Cr"},
  {id:"Succinic",name:"Succinic acid",             lo:0,hi:30,  unit:"mmol/mol Cr"},
  {id:"Lactic", name:"Lactic acid",                lo:0,hi:20,  unit:"mmol/mol Cr"},
  {id:"Pyruvic",name:"Pyruvic acid",               lo:0,hi:4,   unit:"mmol/mol Cr"},
  {id:"2OHglut",name:"2-OH-glutaric acid",         lo:0,hi:3,   unit:"mmol/mol Cr"},
  {id:"4OHbut", name:"4-OH-butyric acid (GHB)",    lo:0,hi:3,   unit:"mmol/mol Cr"},
  {id:"2MAA",   name:"2-Methylacetoacetic acid",   lo:0,hi:3,   unit:"mmol/mol Cr"},
  // ── Extended UOA panel (rare disorders) ──
  {id:"NAA",    name:"N-Acetylaspartic acid",      lo:0,hi:30,  unit:"mmol/mol Cr"},  // Canavan disease: massively elevated
  {id:"5OxoPro",name:"5-Oxoproline (pyroglutamic acid)",lo:0,hi:50, unit:"mmol/mol Cr"}, // GSS deficiency: >100× ULN
  {id:"3MGA",   name:"3-Methylglutaconic acid",    lo:0,hi:10,  unit:"mmol/mol Cr"},  // 3MGA type I (AUH); also secondary in mito
  {id:"3MGR",   name:"3-Methylglutaric acid",      lo:0,hi:5,   unit:"mmol/mol Cr"},  // accompanies 3MGA
  {id:"MevA",   name:"Mevalonic acid",             lo:0,hi:1,   unit:"mmol/mol Cr"},  // Mevalonate kinase def
  {id:"3HIB",   name:"3-Hydroxyisobutyric acid",   lo:0,hi:10,  unit:"mmol/mol Cr"},  // ALDH6A1 def
  {id:"D2HG",   name:"D-2-Hydroxyglutaric acid",   lo:0,hi:3,   unit:"mmol/mol Cr"},  // D2HGDH/IDH2 def
  {id:"2KG",    name:"2-Ketoglutaric acid",        lo:0,hi:30,  unit:"mmol/mol Cr"},  // alpha-KGDH def
  {id:"Glycerol",name:"Glycerol",                  lo:0,hi:5,   unit:"mmol/mol Cr"},  // FBP1 def
  {id:"Uracil", name:"Uracil",                     lo:0,hi:5,   unit:"mmol/mol Cr"},  // DPD (DPYD) def
  {id:"Thymine",name:"Thymine",                    lo:0,hi:3,   unit:"mmol/mol Cr"},  // DPD (DPYD) def
  {id:"OroticU",name:"Orotic acid (urine quantitative)",lo:0,hi:3,unit:"mmol/mol Cr"}, // hereditary orotic aciduria (UMPS)
  // ADSL deficiency accumulates TWO distinct dephosphorylated substrates, not one.
  // Until 2026-07-30 a single field was labelled "Succinyladenosine (SAICAr)",
  // which conflated them; their ratio is the severity discriminator, so one field
  // could not carry both. Names per Jurecka 2015 (PMID 25112391). Both are
  // normally absent, so any detectable value is pathognomonic. The lo/hi here is
  // laboratory convention, not a sourced interval — see PANEL_STANDARDS.
  {id:"SAICAr", name:"SAICA riboside (SAICAr)",     lo:0,hi:0.1, unit:"mmol/mol Cr"},  // succinylaminoimidazole carboxamide riboside
  {id:"SAdo",   name:"Succinyladenosine (S-Ado)",   lo:0,hi:0.1, unit:"mmol/mol Cr"},  // the other ADSL substrate; required for the severity ratio
  {id:"23DHMB", name:"2,3-Dihydroxy-2-methylbutyric acid", lo:0,hi:0.5, unit:"mmol/mol Cr"},  // HIBCH/ECHS1 deficiencies (valine catabolism); Gallagher ACMG 2018
  {id:"SSCys",  name:"S-Sulfocysteine",             lo:0,hi:0.5, unit:"µmol/L"},       // Sulfite oxidase / MoCo def (plasma AA); normally absent; any detectable value is pathognomonic
  {id:"VLA",    name:"Vanillactic acid (urine)",    lo:0,hi:3,   unit:"mmol/mol Cr"},  // AADC deficiency: urinary marker; also elevated in MAOA deficiency, B6 deficiency
];

export const AC_ANALYTES = [
  {id:"C0",     name:"Free carnitine (C0)",               lo:20,  hi:60,   unit:"µmol/L"},
  {id:"C2",     name:"Acetylcarnitine (C2)",              lo:5,   hi:30,   unit:"µmol/L"},
  {id:"C3",     name:"Propionylcarnitine (C3)",           lo:0.5, hi:3.5,  unit:"µmol/L"},
  {id:"C4",     name:"Butyrylcarnitine (C4)",             lo:0.1, hi:0.6,  unit:"µmol/L"},
  {id:"C5",     name:"Isovalerylcarnitine (C5)",          lo:0.04,hi:0.3,  unit:"µmol/L"},
  {id:"C5_1",   name:"Tiglylcarnitine (C5:1)",            lo:0,   hi:0.1,  unit:"µmol/L"},
  {id:"C4OH",   name:"3-OH-butyrylcarnitine (C4-OH)",     lo:0,   hi:0.30, unit:"µmol/L"},
  {id:"C3DC",   name:"Malonylcarnitine (C3-DC)",          lo:0,   hi:0.04, unit:"µmol/L"},
  {id:"C5OH",   name:"3-OH-isovalerylcarnitine (C5-OH)",  lo:0.02,hi:0.25, unit:"µmol/L"},
  {id:"C5DC",   name:"Glutarylcarnitine (C5DC)",          lo:0,   hi:0.18, unit:"µmol/L"},
  {id:"C6",     name:"Hexanoylcarnitine (C6)",            lo:0.02,hi:0.16, unit:"µmol/L"},
  {id:"C6DC",   name:"3-Methylglutarylcarnitine (C6DC)",  lo:0,   hi:0.12, unit:"µmol/L"},
  {id:"C8",     name:"Octanoylcarnitine (C8)",            lo:0.02,hi:0.3,  unit:"µmol/L"},
  {id:"C10",    name:"Decanoylcarnitine (C10)",           lo:0.02,hi:0.2,  unit:"µmol/L"},
  {id:"C10_1",  name:"Decenoylcarnitine (C10:1)",         lo:0.02,hi:0.15, unit:"µmol/L"},
  {id:"C12",    name:"Dodecanoylcarnitine (C12)",         lo:0.02,hi:0.2,  unit:"µmol/L"},
  {id:"C14",    name:"Tetradecanoylcarnitine (C14)",      lo:0.04,hi:0.4,  unit:"µmol/L"},
  {id:"C14_1",  name:"Tetradecenoylcarnitine (C14:1)",    lo:0.02,hi:0.16, unit:"µmol/L"},
  {id:"C14OH",  name:"3-OH-C14 carnitine (C14-OH)",       lo:0,   hi:0.1,  unit:"µmol/L"},
  {id:"C16",    name:"Palmitoylcarnitine (C16)",          lo:0.3, hi:3.0,  unit:"µmol/L"},
  {id:"C16_1",  name:"Palmitoleoylcarnitine (C16:1)",     lo:0.03,hi:0.4,  unit:"µmol/L"},
  {id:"C16OH",  name:"3-OH-palmitoylcarnitine (C16-OH)",  lo:0.02,hi:0.1,  unit:"µmol/L"},
  {id:"C18",    name:"Stearoylcarnitine (C18)",           lo:0.2, hi:2.0,  unit:"µmol/L"},
  {id:"C18_1",  name:"Oleoylcarnitine (C18:1)",           lo:0.3, hi:2.5,  unit:"µmol/L"},
  {id:"C18OH",  name:"3-OH-stearoylcarnitine (C18-OH)",   lo:0.02,hi:0.1,  unit:"µmol/L"},
  {id:"C18_1OH",name:"3-OH-oleoylcarnitine (C18:1-OH)",   lo:0.02,hi:0.12, unit:"µmol/L"},
];

export const CAR_ANALYTES = [
  {id:"CarFree",  name:"Free carnitine",        lo:20, hi:60,  unit:"µmol/L"},
  {id:"CarTotal", name:"Total carnitine",        lo:25, hi:75,  unit:"µmol/L"},
  {id:"CarEst",   name:"Esterified carnitine",   lo:0,  hi:25,  unit:"µmol/L"},
  {id:"CarRatio", name:"Acyl/free carnitine ratio", lo:0, hi:0.4, unit:"ratio", ref:["miller-2021-acylcarnitine"]},
];

export const UAG_ANALYTES = [
  {id:"HG",   name:"Hexanoylglycine",            lo:0, hi:0.5,  unit:"mmol/mol Cr"},
  {id:"SG",   name:"Suberylglycine",             lo:0, hi:1.0,  unit:"mmol/mol Cr"},
  {id:"PPG",  name:"Phenylpropionylglycine",     lo:0, hi:0.5,  unit:"mmol/mol Cr"},
  {id:"GG",   name:"Glutarylglycine",            lo:0, hi:0.5,  unit:"mmol/mol Cr"},
  {id:"OG",   name:"Octanoylglycine",            lo:0, hi:0.3,  unit:"mmol/mol Cr"},
  {id:"IBG",  name:"Isobutyrylglycine",          lo:0, hi:0.5,  unit:"mmol/mol Cr"},
  {id:"2MBG", name:"2-Methylbutyrylglycine",     lo:0, hi:0.5,  unit:"mmol/mol Cr"},
  {id:"BG",   name:"Butyrylglycine",             lo:0, hi:0.5,  unit:"mmol/mol Cr"},
  {id:"DG",   name:"Decanoylglycine",            lo:0, hi:0.3,  unit:"mmol/mol Cr"},
];

// ─── MISCELLANEOUS / METABOLIC SCREENING ─────────────────────
// Standalone tests not part of the standard MS/MS panels.
// Plasma homocysteine is already in PAA (Hcy) — not duplicated here.
// References: Dalmau et al. 2012 (ammonia); Clarke 2012 (CK in FAO); Saudubray 2022.
export const MISC_ANALYTES = [
  {id:"CK",      name:"Creatine kinase (CK)",          lo:0,   hi:200,   unit:"U/L"},
  {id:"tHcy",    name:"Plasma homocysteine (tHcy)",    lo:5,   hi:15,    unit:"µmol/L"},  // Standalone test; CBS, MTHFR, cblC/D/E/G — use when PAA not run
  {id:"Ammonia", name:"Plasma ammonia",                lo:0,   hi:50,    unit:"µmol/L"},
  {id:"Lactate", name:"Plasma lactate",                lo:0.5, hi:2.0,   unit:"mmol/L"},
  {id:"UricAc",  name:"Uric acid",                     lo:120, hi:420,   unit:"µmol/L"},
  {id:"Triglyc", name:"Triglycerides",                 lo:0,   hi:1.7,   unit:"mmol/L"},
  {id:"Glucose", name:"Blood glucose",                 lo:3.9, hi:6.1,   unit:"mmol/L"},
  {id:"ALT",     name:"ALT (alanine aminotransferase)",lo:0,   hi:40,    unit:"U/L"},
  {id:"AST",     name:"AST (aspartate aminotransferase)",lo:0, hi:40,    unit:"U/L"},
  {id:"BHB",     name:"Beta-hydroxybutyrate (3-OHB)",   lo:0.02,hi:0.5,  unit:"mmol/L"},  // SCOT: high (fed); mHMGCS2: low (fasting)
  {id:"AcAc",    name:"Acetoacetate",                   lo:0.01,hi:0.3,  unit:"mmol/L"},  // SCOT: persistently high
  // ── Cerebral creatine deficiency analytes — specialist assay (targeted LC-MS/MS) ──
  {id:"pGAA",    name:"Plasma guanidinoacetate (GAA)",  lo:0.5, hi:4,    unit:"µmol/L"},   // GAMT: markedly elevated (pathognomonic); GATM: LOW — key discriminator; SLC6A8: normal
  {id:"uGAA",    name:"Urine guanidinoacetate (GAA)",   lo:0,   hi:200,  unit:"mmol/mol Cr"}, // GAMT: 2000–6000 mmol/mol Cr; GATM: low; SLC6A8: normal
  {id:"pCreat",  name:"Plasma creatine",                lo:20,  hi:85,   unit:"µmol/L"},   // GAMT / GATM: LOW; SLC6A8: normal (intact de novo synthesis)
  {id:"uCreat",  name:"Urine creatine:creatinine ratio", lo:0,  hi:800,  unit:"mmol/mol Cr"}, // SLC6A8 MALES: typically >1500 (renal transporter defect → not reabsorbed); age-dependent — infants physiologically high
  {id:"pGAACr",  name:"Plasma GAA / creatine ratio",     lo:0,  hi:0.1,  unit:"ratio"},        // Strongly elevated in GAMT (high GAA + low creatine); scalar discriminator from GATM (low numerator) and SLC6A8 (both normal)
];

export const ANALYTE_MAP = {};

export const AC_RATIOS=[
  // Existing
  {id:"C8C10",    name:"C8/C10 ratio",           lo:0, hi:2.0,  unit:"ratio", ref:["miller-2021-acylcarnitine"]},  // MCAD: C8>>C10 → ratio high
  {id:"C14_1C16", name:"C14:1/C16 ratio",        lo:0, hi:0.08, unit:"ratio", ref:["miller-2021-acylcarnitine"]},  // VLCAD: C14:1 high vs C16
  {id:"C3C2",     name:"C3/C2 ratio",            lo:0, hi:0.15, unit:"ratio", ref:["miller-2021-acylcarnitine","gavrilov-2020-clir"]},  // PA/MMA: elevated
  {id:"C0LC",     name:"C0/(C16+C18) ratio",     lo:0, hi:40,   unit:"ratio", ref:["miller-2021-acylcarnitine"]},  // CPT1: high (low long-chain, high C0)
  // New — evidence-based
  {id:"C16OHC16", name:"C16-OH/C16 ratio",       lo:0, hi:0.04, unit:"ratio", ref:["ibdah-1999-lchad"]},  // LCHAD: C16-OH disproportionately high; Ibdah et al., NEJM 1999
  {id:"C5DCC8",   name:"C5DC/C8 ratio",          lo:0, hi:0.8,  unit:"ratio", ref:["kolker-2011-ga1"]},  // GA-I vs MCAD discriminator: GA-I C5DC>>C8; Kolker et al. 2006
  {id:"C5C3",     name:"C5/C3 ratio",            lo:0, hi:0.15, unit:"ratio", ref:["miller-2021-acylcarnitine"]},  // IVA: C5 disproportionate vs C3; distinguishes IVA from PA/MMA
  {id:"C14_1C14", name:"C14:1/C14 ratio",        lo:0, hi:0.5,  unit:"ratio", refPending:"Strauss et al. 2007"},  // VLCAD: C14:1 > C14 is characteristic; Strauss et al. 2007
  {id:"C3C16",    name:"C3/(C16+C18) ratio",     lo:0, hi:0.5,  unit:"ratio"},  // Useful PA/MMA axis relative to long-chain pool
  // Miller 2021 ACMG additions
  {id:"C14_1C12_1",name:"C14:1/C12:1 ratio",      lo:0, hi:3.0,  unit:"ratio", ref:["miller-2021-acylcarnitine"]},  // VLCAD: typically >3; mildly elevated in LCHAD/TFP and ketosis
  {id:"C16C18_1C2",name:"(C16+C18:1)/C2 ratio",   lo:0, hi:0.25, unit:"ratio", ref:["miller-2021-acylcarnitine"]},  // Long-chain FAO burden: CPT2/CACT/VLCAD elevate this; Miller 2021
  {id:"C4OHC4",   name:"C4-OH/C4 ratio",          lo:0, hi:0.6,  unit:"ratio"},  // SCHAD: C4-OH disproportionately elevated; HADH def
  {id:"C16OHC18_1OH",name:"C16-OH/C18:1-OH ratio",lo:0, hi:2.0,  unit:"ratio", ref:["ibdah-1999-lchad"]},  // LCHAD vs TFP: LCHAD has more C16-OH relative to C18:1-OH
  {id:"C14_1C12", name:"C14:1/C12 ratio",         lo:0, hi:1.5,  unit:"ratio", ref:["miller-2021-acylcarnitine"]},  // VLCAD: C14:1 > C12 characteristic; Miller 2021
];

// PAA derived ratios (calculated from entered values)
export const PAA_RATIOS=[
  {id:"PheTyr",   name:"Phe/Tyr ratio",           lo:0, hi:3.0,  unit:"ratio", ref:["sharer-2018-amino-acids"], refPending:"van Spronsen 2017"},  // PKU/BH4: >3 suspicious, >10 classic PKU; van Spronsen 2017
  {id:"CitArg",   name:"Cit/Arg ratio",            lo:0, hi:3.0,  unit:"ratio"},  // ASS1 (CITR1): >4 strongly supports; reported ratio 111 in classic case
  {id:"OrnCit",   name:"Orn/Cit ratio",            lo:0, hi:3.0,  unit:"ratio", ref:["camacho-2006-hhh"]},  // HHH: Orn high, Cit low → ratio very high; Camacho et al. 2006
  {id:"GlnAla",   name:"Gln/Ala ratio",            lo:0, hi:6.0,  unit:"ratio", refPending:"Walker 2009"},  // Hyperammonemia axis: Gln rises faster than Ala; Walker 2009
  {id:"GlyCit",   name:"Gly/Cit ratio",            lo:0, hi:5.0,  unit:"ratio"},  // NAGS/CPS1 (no Cit, Gly rises): high Gly with low/normal Cit
  {id:"GlySer",   name:"Gly/Ser ratio",            lo:0, hi:2.5,  unit:"ratio", refDisputed:"Hamosh 1998 (PMID 9580775) is an NKH benzoate/dextromethorphan treatment trial and does not establish the Gly/Ser ratio"},  // NKH (plasma proxy for CSF:plasma ratio): Gly>>Ser; Hamosh 1998
  {id:"LeuAla",   name:"(Leu+Ile+Val)/Ala ratio",  lo:0, hi:4.0,  unit:"ratio", refDisputed:"the 'Strauss 2006' lead does not resolve to an MSUD amino-acid-ratio paper in PubMed"},  // MSUD: BCAA sum rises disproportionately vs Ala; Strauss 2006
  {id:"MetHcy",   name:"Met/Hcy ratio",            lo:0, hi:5.0,  unit:"ratio", refPending:"Mudd 2001"},  // CBS: both Met and Hcy high (ratio preserved or slightly high); MTHFR: Hcy high, Met low → ratio very low; Mudd 2001
  // Cross-panel ratio (AC + PAA) — computed in runAnalysis
  {id:"C3Gly",    name:"C3/Glycine ratio",         lo:0, hi:0.015, unit:"ratio", ref:["gavrilov-2020-clir"]}, // PA: C3/Gly 0% overlap disease vs normal range; available in ~31% of cases; Gavrilov 2020
];

// UOA derived ratios
export const UOA_RATIOS=[
  {id:"LacPyr",   name:"Lactate/Pyruvate ratio",   lo:0, hi:25,   unit:"ratio", refPending:"Brown 2005"},  // L/P >25 supports PDHC def or respiratory chain disorder; pyruvate dehydrogenase spectrum; Brown 2005
  {id:"OHGAtoGA", name:"3-OHGA/GA ratio",          lo:0, hi:0.3,  unit:"ratio", ref:["kolker-2011-ga1","gallagher-2018-organic-acids"]},  // GA-I: 3-OHGA is more specific than GA alone; ratio >0.3 supports GA-I over GA-III; Kölker 2011
  {id:"MMAtoMCA", name:"MMA/MCA ratio",            lo:0, hi:5.0,  unit:"ratio", ref:["gallagher-2018-organic-acids"], refDisputed:"Coelho 2008 (PMID 18385497) is a cblD gene-identification paper in NEJM and does not establish the MMA/MCA ratio"},  // PA: methylcitric acid (MCA) high vs MMA; in MMA: MMA>>MCA; Coelho 2008
  // ADSL severity discriminator. Direction is INVERTED relative to every other
  // ratio here: a LOW ratio marks the SEVERE phenotype (Jaeken 1988 — ratio 1–2
  // in seven severely retarded patients, ~5 in the one markedly milder patient),
  // hence `flagWhen:"low"` and a `lo` threshold rather than a `hi` one. Only
  // computable when both succinylpurines are detectable, which is itself
  // essentially diagnostic of ADSL deficiency — so this never fires on a normal
  // sample. Not part of any disorder signature: it grades an established
  // diagnosis, it does not argue for one.
  {id:"SAdoSAICAr", name:"S-Ado/SAICAr ratio",     lo:2.0, hi:0, unit:"ratio", flagWhen:"low",
   ref:["jaeken-1988-adsl-ratio","jurecka-2015-adsl"]},
];

[...PAA_ANALYTES,...UOA_ANALYTES,...AC_ANALYTES,...CAR_ANALYTES,...UAG_ANALYTES,...MISC_ANALYTES,
 ...AC_RATIOS,...PAA_RATIOS,...UOA_RATIOS].forEach(a=>{ANALYTE_MAP[a.id]=a;});

export const ANALYTE_ID_REFERENCE = [
  "PAA: "+PAA_ANALYTES.map(a=>`${a.id}=${a.name}`).join(", ")
    +", Trp=Tryptophan, AABA=alpha-aminobutyric acid, Etha=Ethanolamine, 3MHis=3-methylhistidine"
    +", GABA=gamma-aminobutyric acid, 1MHis=1-methylhistidine, AAAdp=alpha-aminoadipic acid"
    +", HyPro=Hydroxyproline, Sarc=Sarcosine, BAla=Beta-Alanine",
  "UOA: "+UOA_ANALYTES.map(a=>`${a.id}=${a.name}`).join(", "),
  "AC: " +AC_ANALYTES.map(a=>`${a.id}=${a.name}`).join(", "),
  "CAR: "+CAR_ANALYTES.map(a=>`${a.id}=${a.name}`).join(", "),
  "UAG: "+UAG_ANALYTES.map(a=>`${a.id}=${a.name}`).join(", "),
  "NOTE: Ratios (PheTyr, CitArg, C8C10, LacPyr, C3Gly etc.) are computed automatically — do NOT extract ratio values from reports. C3Gly (propionylcarnitine/glycine) is a cross-panel ratio requiring both AC C3 and PAA Gly to be entered.",
].join("\n");

// ─── DISORDER KB ─────────────────────────────────────────────
// DISORDERS catalogue lives in ./disorders.js (imported at top of file).
export const DISORDER_MAP = Object.fromEntries(DISORDERS.map(d=>[d.id,d]));

// ─── ANALYTE DISTRIBUTION PARAMETERS ────────────────────────
// Replaces binary log10 scoring with asymmetric Student-t tail model.
// Approach from uploaded Python patch; parameter values independently calibrated for log-space.
//
// Fields: hS = high-tail scale (nat-log units), hDf = high-tail degrees of freedom,
//         lS = low-tail scale,  lDf = low-tail df,
//         log = apply log transform before computing distance (true for all metabolites here),
//         hSig = high-direction significance multiplier, lSig = low-direction multiplier.
//
// Scale calibration (log-space): rarity ≈ 0.50 at dist = scale (≈ e× above limit);
//   rarity ≈ 0.85 at dist = 2×scale. Pathognomonic markers use smaller scale so even
//   modest elevation yields high rarity.
export const ANALYTE_DIST = {
  // ── PAA ───────────────────────────────────────────────────
  // Calibrated against typical disease vs normal ranges in log-space.
  // hSig > 1 where elevation is more diagnostically specific than depression and vice versa.
  Phe:    {hS:0.90,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.8}, // PKU: high Phe ×1.5
  Tyr:    {hS:0.90,hDf:3.5,lS:0.50,lDf:4.5,log:true,hSig:1.0,lSig:1.2}, // low Tyr in PKU slightly upweighted
  Leu:    {hS:0.80,hDf:3.0,lS:0.60,lDf:5.0,log:true,hSig:1.3,lSig:0.7},
  Ile:    {hS:0.80,hDf:3.0,lS:0.60,lDf:5.0,log:true,hSig:1.0,lSig:0.7},
  Val:    {hS:0.90,hDf:3.0,lS:0.70,lDf:5.0,log:true,hSig:1.1,lSig:0.7},
  Met:    {hS:0.80,hDf:3.0,lS:0.40,lDf:4.0,log:true,hSig:1.0,lSig:0.8},
  Cit:    {hS:0.80,hDf:3.0,lS:0.40,lDf:4.0,log:true,hSig:1.2,lSig:1.2}, // both dirs diagnostically relevant
  Arg:    {hS:0.90,hDf:3.5,lS:0.50,lDf:4.0,log:true,hSig:1.0,lSig:1.0},
  Gly:    {hS:0.80,hDf:3.5,lS:0.60,lDf:5.0,log:true,hSig:1.0,lSig:0.5},
  Gln:    {hS:0.90,hDf:4.0,lS:0.50,lDf:4.5,log:true,hSig:1.0,lSig:0.8},
  Orn:    {hS:0.80,hDf:3.5,lS:0.50,lDf:4.0,log:true,hSig:1.0,lSig:1.1},
  Pro:    {hS:0.90,hDf:4.0,lS:0.60,lDf:5.0,log:true,hSig:1.0,lSig:0.5},
  Lys:    {hS:0.90,hDf:4.0,lS:0.60,lDf:4.0,log:true,hSig:0.8,lSig:1.2}, // low Lys important in LPI
  Hcy:    {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.5},
  AlloIle:{hS:0.35,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.0,lSig:0.3}, // pathognomonic — small scale → high rarity even at trace elevation
  ASA:    {hS:0.35,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.0,lSig:0.3}, // pathognomonic
  Pip:    {hS:0.50,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.2,lSig:0.5},
  Ala:    {hS:0.90,hDf:4.5,lS:0.60,lDf:5.0,log:true,hSig:0.8,lSig:0.5},
  Asp:    {hS:0.60,hDf:4.0,lS:0.50,lDf:4.5,log:true,hSig:0.9,lSig:0.5},
  Asn:    {hS:0.80,hDf:4.5,lS:0.60,lDf:5.0,log:true,hSig:0.8,lSig:0.5},
  Glu:    {hS:0.80,hDf:4.0,lS:0.60,lDf:5.0,log:true,hSig:0.8,lSig:0.5},
  His:    {hS:0.80,hDf:4.5,lS:0.60,lDf:5.0,log:true,hSig:0.8,lSig:0.5},
  Ser:    {hS:0.80,hDf:4.5,lS:0.60,lDf:5.0,log:true,hSig:0.8,lSig:0.5},
  Thr:    {hS:0.80,hDf:4.5,lS:0.60,lDf:5.0,log:true,hSig:0.8,lSig:0.5},
  // ── UOA ───────────────────────────────────────────────────
  // Most UOA have lo=0; low tail unused. Larger hS for analytes spanning wider disease ranges.
  SA:     {hS:0.45,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.5,lSig:0.3}, // pathognomonic for TYR1
  HGA:    {hS:0.45,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.0,lSig:0.3}, // pathognomonic for alkaptonuria
  MMA:    {hS:1.20,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // wide range 4–2000 mmol/mol
  MCA:    {hS:0.90,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3},
  GA:     {hS:0.90,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3},
  "3OHGA":{hS:0.90,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.2,lSig:0.3},
  HMG:    {hS:0.80,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.2,lSig:0.3},
  TG:     {hS:0.50,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // pathognomonic for BKT
  "2MAA": {hS:0.50,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // pathognomonic for BKT
  "4OHbut":{hS:0.60,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // SSADH
  "2OHglut":{hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.4,lSig:0.3},
  Orotic: {hS:0.90,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.2,lSig:0.3},
  Fumaric:{hS:0.80,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3},
  IVG:    {hS:0.55,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // specific for IVA
  MCG:    {hS:0.55,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.4,lSig:0.3},
  PG:     {hS:0.60,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3},
  EMA:    {hS:0.90,hDf:3.5,lS:0.50,lDf:4.0,log:true,hSig:1.0,lSig:0.3},
  Malonic:{hS:0.85,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.0,lSig:0.3}, // MLYCD: malonic acid markedly elevated
  Lactic: {hS:0.90,hDf:4.0,lS:0.50,lDf:4.0,log:true,hSig:0.8,lSig:0.3}, // non-specific
  Pyruvic:{hS:0.80,hDf:4.0,lS:0.50,lDf:4.0,log:true,hSig:0.8,lSig:0.3},
  // Pathognomonic markers — normally absent, any detectable value is highly specific
  SAICAr: {hS:0.35,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.5,lSig:0.3}, // ADSL deficiency: SAICA riboside pathognomonic
  SAdo:   {hS:0.35,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.5,lSig:0.3}, // ADSL deficiency: succinyladenosine pathognomonic (same scale as its partner substrate)
  SSCys:  {hS:0.35,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.5,lSig:0.3}, // Sulfite oxidase / MoCo deficiency: S-sulfocysteine pathognomonic
  "3OMD": {hS:0.40,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.5,lSig:0.3}, // AADC deficiency: 3-O-methyldopa strongly elevated
  VLA:    {hS:0.50,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.0,lSig:0.3}, // AADC: vanillactic acid (also B6 deficiency)
  "23DHMB":{hS:0.45,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.2,lSig:0.3}, // HIBCH/ECHS1: 2,3-dihydroxy-2-methylbutyric acid
  // ── UOA (promoted from generic empirical fallback) ─────────
  // These clinically important markers previously fell through to DEFAULT_DIST
  // (generic hS=1.0/hSig=1.0). Hand-tuned here so their rarity gradient and
  // diagnostic specificity match their biology. hSig encodes specificity:
  // pathognomonic (≥2.0), specific (1.3–1.8), supportive/non-specific (~1.0).
  "3OHprop":{hS:0.90,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.4,lSig:0.3}, // PA/MMA core marker; wide disease range
  "3OHIV": {hS:0.85,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.2,lSig:0.3}, // 3MCC/MCD/HMG/biotinidase — sensitive, less specific
  Adipic:  {hS:0.90,hDf:4.0,lS:0.50,lDf:4.0,log:true,hSig:0.9,lSig:0.3}, // dicarboxylic — supportive only (fasting/MCT oil/ketosis)
  Suberic: {hS:0.90,hDf:4.0,lS:0.50,lDf:4.0,log:true,hSig:0.9,lSig:0.3}, // dicarboxylic — supportive only
  Sebacic: {hS:0.90,hDf:4.0,lS:0.50,lDf:4.0,log:true,hSig:0.9,lSig:0.3}, // dicarboxylic — supportive only
  Succinic:{hS:0.90,hDf:4.0,lS:0.50,lDf:4.0,log:true,hSig:0.8,lSig:0.3}, // TCA intermediate — non-specific
  "4OHpp": {hS:0.85,hDf:3.5,lS:0.50,lDf:4.0,log:true,hSig:1.0,lSig:0.3}, // tyrosine pathway — TYR1/2/3, liver, transient neonatal tyrosinemia
  "4OHpl": {hS:0.85,hDf:3.5,lS:0.50,lDf:4.0,log:true,hSig:1.0,lSig:0.3}, // tyrosine pathway — non-specific
  NAA:     {hS:0.45,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.5,lSig:0.3}, // Canavan (ASPA): massively elevated, effectively pathognomonic
  "5OxoPro":{hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // 5-oxoprolinuria (GSS/OPLAH); also secondary (acetaminophen)
  "3MGA":  {hS:0.80,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.1,lSig:0.3}, // 3-methylglutaconic acidurias; frequently secondary in mito disease
  "3MGR":  {hS:0.80,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.0,lSig:0.3}, // accompanies 3MGA
  "3HIB":  {hS:0.80,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3}, // 3-OH-isobutyric (ALDH6A1/HIBCH; valine catabolism)
  MevA:    {hS:0.50,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.0,lSig:0.3}, // mevalonic aciduria (MVK) — markedly elevated, specific
  D2HG:    {hS:0.60,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.8,lSig:0.3}, // D-2-hydroxyglutaric aciduria (D2HGDH/IDH2)
  // ── AC ────────────────────────────────────────────────────
  C3:     {hS:0.80,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.5},
  C8:     {hS:0.80,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3},
  C5DC:   {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3},
  C14_1:  {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3},
  C16OH:  {hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3},
  C18_1OH:{hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3},
  C18OH:  {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3},
  C0:     {hS:0.80,hDf:3.5,lS:0.60,lDf:4.0,log:true,hSig:1.0,lSig:1.0}, // both dirs relevant (CPT1 vs secondary deficiency)
  C16:    {hS:0.80,hDf:3.0,lS:0.60,lDf:4.0,log:true,hSig:1.0,lSig:0.7},
  C18:    {hS:0.80,hDf:3.0,lS:0.60,lDf:4.0,log:true,hSig:1.0,lSig:0.7},
  C18_1:  {hS:0.80,hDf:3.0,lS:0.60,lDf:4.0,log:true,hSig:1.0,lSig:0.6},
  C5:     {hS:0.75,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.2,lSig:0.3},
  C5OH:   {hS:0.75,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.2,lSig:0.3},
  C5_1:   {hS:0.60,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3},
  C4OH:   {hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3},
  C4:     {hS:0.80,hDf:3.5,lS:0.50,lDf:4.0,log:true,hSig:1.0,lSig:0.3},
  C6:     {hS:0.80,hDf:3.5,lS:0.50,lDf:4.0,log:true,hSig:1.0,lSig:0.3},
  C6DC:   {hS:0.75,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.2,lSig:0.3},
  C3DC:   {hS:0.85,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.0,lSig:0.3}, // MLYCD: malonylcarnitine markedly elevated
  // ── CAR ───────────────────────────────────────────────────
  CarFree:  {hS:0.80,hDf:3.5,lS:0.50,lDf:3.0,log:true,hSig:0.8,lSig:2.0}, // low = primary carnitine deficiency
  CarTotal: {hS:0.80,hDf:3.5,lS:0.50,lDf:3.0,log:true,hSig:0.8,lSig:2.0},
  CarEst:   {hS:0.80,hDf:3.5,lS:0.50,lDf:4.0,log:true,hSig:1.0,lSig:0.5},
  CarRatio: {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3},
  // ── UAG ───────────────────────────────────────────────────
  HG:       {hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // MCAD-specific
  SG:       {hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // MCAD-specific
  PPG:      {hS:0.60,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // MCAD-specific
  GG:       {hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // GA1-specific
  OG:       {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3},
  IBG:      {hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // IBD-specific
  "2MBG":   {hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // 2-MBD-specific
  BG:       {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.2,lSig:0.3},
  DG:       {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.2,lSig:0.3},
  // ── AC ratios ─────────────────────────────────────────────
  C8C10:    {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3},
  C14_1C16: {hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3},
  C3C2:     {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3},
  C0LC:     {hS:0.90,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.0,lSig:0.3},
  // New AC ratios
  C16OHC16: {hS:0.50,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.0,lSig:0.3}, // LCHAD: C16-OH disproportionately elevated
  C5DCC8:   {hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.8,lSig:0.3}, // GA-I: C5DC>>C8 (vs MCAD: C8>>C5DC)
  C5C3:     {hS:0.60,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.6,lSig:0.3}, // IVA: C5 disproportionate to C3
  C14_1C14: {hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // VLCAD: C14:1>C14 characteristically
  C3C16:    {hS:0.75,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.2,lSig:0.3}, // PA/MMA: C3 elevated relative to long-chain
  C14_1C12: {hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // VLCAD: C14:1 > C12
  C16C18_1C2:{hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.4,lSig:0.3}, // Long-chain FAO: CPT2/CACT/VLCAD
  C4OHC4:   {hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // SCHAD: C4-OH disproportionate
  C16OHC18_1OH:{hS:0.60,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3}, // LCHAD vs TFP discrimination
  // ── PAA ratios ────────────────────────────────────────────
  // Ratios in log space; most are high-direction diagnostic
  PheTyr:   {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.8,lSig:0.3}, // PKU/BH4: Phe/Tyr >3 (>10 classic PKU)
  CitArg:   {hS:0.55,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.0,lSig:0.3}, // CITR1: Cit/Arg markedly elevated (>4)
  OrnCit:   {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.8,lSig:0.3}, // HHH: Orn high, Cit low → ratio very high
  GlnAla:   {hS:0.80,hDf:3.5,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3}, // hyperammonemia: Gln>>Ala
  GlyCit:   {hS:0.80,hDf:3.5,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.3}, // CPS1/NAGS: no Cit, Gly high
  GlySer:   {hS:0.65,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // NKH: Gly>>Ser in plasma (proxy)
  LeuAla:   {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.6,lSig:0.3}, // MSUD: BCAA sum/Ala elevated
  MetHcy:   {hS:0.75,hDf:3.5,lS:0.40,lDf:3.0,log:true,hSig:1.0,lSig:2.0}, // low = remethylation defect (Hcy>>Met); CBS: both high
  C3Gly:    {hS:0.85,hDf:3.5,lS:0.50,lDf:4.0,log:true,hSig:2.0,lSig:0.3}, // PA: 0% disease/normal overlap; Gavrilov 2020
  // ── UOA ratios ────────────────────────────────────────────
  LacPyr:   {hS:0.80,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.8,lSig:0.3}, // L/P >25: PDHC or respiratory chain
  OHGAtoGA: {hS:0.60,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.0,lSig:0.3}, // GA-I: 3-OHGA/GA >0.3 specific; GA-III: ratio low
  MMAtoMCA: {hS:0.75,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.5,lSig:0.3}, // MMA: MMA>>MCA; PA: MCA>>MMA relatively
  // ── MISC ──────────────────────────────────────────────────
  CK:      {hS:0.90,hDf:3.5,lS:0.50,lDf:5.0,log:true,hSig:1.0,lSig:0.3},
  tHcy:    {hS:0.70,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:1.3,lSig:0.5}, // mirrors PAA Hcy
  Ammonia: {hS:0.80,hDf:3.0,lS:0.50,lDf:5.0,log:true,hSig:1.2,lSig:0.3},
  Lactate: {hS:0.80,hDf:3.5,lS:0.50,lDf:5.0,log:true,hSig:1.0,lSig:0.3},
  UricAc:  {hS:0.80,hDf:3.5,lS:0.50,lDf:4.0,log:true,hSig:0.9,lSig:1.2}, // both dirs useful
  Triglyc: {hS:0.80,hDf:4.0,lS:0.50,lDf:5.0,log:true,hSig:0.8,lSig:0.3},
  Glucose: {hS:0.80,hDf:4.0,lS:0.70,lDf:3.5,log:true,hSig:0.7,lSig:1.2}, // low glucose important in FAO/ketolysis
  ALT:     {hS:0.80,hDf:3.5,lS:0.50,lDf:5.0,log:true,hSig:0.9,lSig:0.3},
  AST:     {hS:0.80,hDf:3.5,lS:0.50,lDf:5.0,log:true,hSig:0.9,lSig:0.3},
  BHB:     {hS:0.70,hDf:3.5,lS:0.70,lDf:3.5,log:true,hSig:1.4,lSig:1.4}, // both directions clinically important
  AcAc:    {hS:0.70,hDf:3.5,lS:0.60,lDf:3.5,log:true,hSig:1.3,lSig:1.2},
  // ── Cerebral creatine deficiency markers ──
  pGAA:    {hS:0.60,hDf:3.0,lS:0.45,lDf:3.5,log:true,hSig:2.5,lSig:2.5}, // both directions pathognomonic: high = GAMT, low = GATM
  uGAA:    {hS:0.70,hDf:3.0,lS:0.45,lDf:3.5,log:true,hSig:2.3,lSig:2.0}, // urine mirror of plasma pattern
  pCreat:  {hS:0.70,hDf:3.5,lS:0.45,lDf:3.5,log:true,hSig:0.8,lSig:2.0}, // low creatine diagnostic for GAMT/GATM
  uCreat:  {hS:0.55,hDf:3.0,lS:0.60,lDf:4.0,log:true,hSig:2.3,lSig:0.5}, // SLC6A8: elevated urinary creatine:creatinine (high-direction pathognomonic in males)
  pGAACr:  {hS:0.60,hDf:3.0,lS:0.50,lDf:4.0,log:true,hSig:2.5,lSig:0.3}, // GAMT: markedly elevated (combined GAA↑ + creatine↓); low direction not diagnostic
  // ── Extended physiological panel ─────────────────────────
  // Trp: low in Hartnup (with other neutral AAs↓); high in tryptophanemia / carcinoid
  Trp:    {hS:0.90,hDf:3.5,lS:0.60,lDf:4.0,log:true,hSig:0.8,lSig:1.3},
  // α-Aminobutyric acid: non-specific — elevated in hyperammonemia, liver disease, alcohol
  AABA:   {hS:0.90,hDf:4.0,lS:0.60,lDf:5.0,log:true,hSig:0.8,lSig:0.5},
  // Ethanolamine: elevated in liver disease; phosphoethanolamine is separate (hypophosphatasia)
  Etha:   {hS:0.90,hDf:4.0,lS:0.60,lDf:5.0,log:true,hSig:0.8,lSig:0.4},
  // 3-Methylhistidine: muscle protein catabolism marker; elevated in catabolic states, renal failure
  "3MHis":{hS:0.90,hDf:4.0,lS:0.50,lDf:5.0,log:true,hSig:0.8,lSig:0.3},
  // GABA: elevated in SSADH def + GABA-transaminase def (primary); also hyperprolinemia II
  GABA:   {hS:0.55,hDf:3.0,lS:0.50,lDf:5.0,log:true,hSig:1.5,lSig:0.3},
  // 1-Methylhistidine: dietary meat intake marker; non-specific, mainly nutritional context
  "1MHis":{hS:1.00,hDf:5.0,lS:0.60,lDf:5.0,log:true,hSig:0.6,lSig:0.3},
  // α-Aminoadipic acid: elevated in 2-oxoadipate dehydrogenase deficiency; also B6 deficiency
  AAAdp:  {hS:0.70,hDf:3.0,lS:0.50,lDf:5.0,log:true,hSig:1.2,lSig:0.3},
  // Hydroxyproline: elevated in collagen turnover disorders, hydroxyprolinemia (PRODH2 def); physiologically high in neonates
  HyPro:  {hS:0.85,hDf:4.0,lS:0.50,lDf:5.0,log:true,hSig:0.9,lSig:0.3},
  // Sarcosine (N-methylglycine): elevated in sarcosinemia (SARDH deficiency) and folate/B12 deficiency.
  // Also elevated in some prostate cancer (not relevant here). Generally benign in isolation.
  Sarc:   {hS:0.70,hDf:3.5,lS:0.50,lDf:5.0,log:true,hSig:1.1,lSig:0.3},
  // Beta-Alanine: primary marker for hyper-β-alaninemia (AGXT2), also GABAT def and DPYD
  BAla:   {hS:0.60,hDf:3.0,lS:0.50,lDf:5.0,log:true,hSig:1.4,lSig:0.3},
};

// Fallback for unconfigured analytes: sensible generic log-space parameters
export const DEFAULT_DIST={hS:1.0,hDf:4.0,lS:0.8,lDf:4.0,log:true,hSig:1.0,lSig:1.0};

// ─── AGE-STRATIFIED REFERENCE RANGES ────────────────────────────
// Age-specific plasma amino acid reference ranges (µmol/L, fasting).
// Source: Applegarth et al. Clin Chem 1979 (3mo–10yr);
//         Sharer et al. ACMG 2018 (framework — lab-specific ranges mandated);
//         Chace et al. Clin Chem 2003; ERNDIM paediatric AA surveys.
// Age groups: neonate (<1mo), infant (1–12mo), child (1–18yr), adult (>18yr).
// Only analytes with clinically meaningful age variation are listed;
// others fall back to the default adult ranges in PAA_ANALYTES.
// Format: {lo, hi} overrides for the age group.
export const AGE_RANGES = {
  // ageMonths < 1
  neonate:{
    Phe:{lo:35, hi:120},  // Transient HPA common; NBS cutoff ~120 µmol/L
    Tyr:{lo:55, hi:250},  // Physiologically elevated in neonates (immature HPD)
    Met:{lo:10, hi:60},   // Higher in neonates; immature MAT
    Gly:{lo:200,hi:600},  // Physiologically elevated; NKH threshold higher neonatally
    Pro:{lo:120,hi:550},  // Higher in neonates
    Gln:{lo:350,hi:900},  // Broader in neonates
    Ala:{lo:200,hi:650},  // Broader due to anabolism/catabolism variation
    Leu:{lo:60, hi:220},  // Slightly higher in neonates
    Ile:{lo:30, hi:120},
    Val:{lo:120,hi:350},
    Cit:{lo:5,  hi:35},   // Lower in neonates (immature urea cycle)
    Orn:{lo:30, hi:150},  // Higher in neonates
  },
  // ageMonths 1–12
  infant:{
    Phe:{lo:30, hi:95},
    Tyr:{lo:40, hi:160},  // Still elevated in infants
    Met:{lo:15, hi:50},
    Gly:{lo:150,hi:450},
    Pro:{lo:100,hi:450},
    Gln:{lo:400,hi:850},
    Ala:{lo:200,hi:580},
    Leu:{lo:65, hi:210},
    Ile:{lo:35, hi:110},
    Val:{lo:140,hi:340},
    Cit:{lo:8,  hi:40},
    Orn:{lo:25, hi:140},
  },
  // ageMonths 12–216 (1–18yr) — standard paediatric ranges
  child:{
    Phe:{lo:30, hi:90},
    Tyr:{lo:40, hi:120},
    Met:{lo:15, hi:45},
    Gly:{lo:150,hi:450},
    Pro:{lo:100,hi:450},
    Gln:{lo:400,hi:800},
    Ala:{lo:200,hi:550},
    Leu:{lo:70, hi:200},
    Ile:{lo:40, hi:100},
    Val:{lo:150,hi:310},
    Cit:{lo:10, hi:45},
    Orn:{lo:20, hi:120},
  },
  // ageMonths >216 (>18yr) — adult ranges (same as PAA_ANALYTES defaults)
  adult:{},
};

// Acylcarnitine age adjustments — neonates/infants have broader AC ranges.
// C3, C4-OH, C5-OH are physiologically elevated in premature infants (renal immaturity).
// Ref: Miller et al. ACMG 2021 (ACMG standard — lab-specific ranges mandated).
export const AGE_RANGES_AC = {
  neonate:{
    C3:{lo:0.3, hi:7.0},   // Upper limit higher in neonates; C3/C2 ratio still informative
    C5OH:{lo:0, hi:0.5},   // Broader; immature renal handling of 3-OH acylcarnitines
    C4:{lo:0,  hi:0.7},    // Slightly broader in neonates
  },
  infant:{
    C3:{lo:0.2, hi:5.5},
    C5OH:{lo:0, hi:0.4},
  },
  child:{},  // Use default AC_ANALYTES ranges
  adult:{},
};

// ─── CLIR-STYLE CONTINUOUS COVARIATE ADJUSTMENT ────────────────────
// Approximation of CLIR MoM approach (Gavrilov 2020, Rowe 2021):
// For key analytes with strong age/weight dependency, compute an expected
// median based on age-in-hours and birth weight, then express the patient
// value as a Z-score. This supplements the discrete 4-bin system above.
// Model: piecewise linear log-median = f(ageHours, birthWeightG)
// Coefficients derived from published population studies (Rinaldo, Hall, Gavrilov).
export const COVARIATE_MODELS = {
  // {baseLogMedian, ageSlope (per 100h), weightSlope (per 1000g), logSD}
  // ageSlope: how log(median) changes per 100 hours of life
  // weightSlope: how log(median) changes per 1000g above 2500g
  C3:   {base:0.85, ageSlope:-0.08, wSlope:-0.03, sd:0.45},  // C3 highest at birth, declines; Gavrilov 2020
  C0:   {base:3.40, ageSlope: 0.05, wSlope: 0.04, sd:0.35},  // Free carnitine rises with age
  C8:   {base:-2.3, ageSlope:-0.04, wSlope:-0.02, sd:0.50},  // Medium-chain: neonatal slightly higher
  C16:  {base:0.70, ageSlope:-0.03, wSlope: 0.02, sd:0.40},  // Long-chain: moderate weight effect
  C5OH: {base:-1.8, ageSlope:-0.05, wSlope:-0.01, sd:0.55},  // C5-OH: age-dependent decline
  Phe:  {base:3.80, ageSlope:-0.02, wSlope: 0.03, sd:0.30},  // Phe: slightly higher in neonates
  Tyr:  {base:4.20, ageSlope:-0.10, wSlope:-0.05, sd:0.40},  // Tyr: markedly elevated in premature/neonates, declines rapidly
  Met:  {base:2.90, ageSlope:-0.03, wSlope: 0.02, sd:0.35},  // Met: neonatal transient elevation
  Gly:  {base:5.50, ageSlope:-0.02, wSlope:-0.02, sd:0.30},  // Gly: stable but lower in older
};

export const PANEL_ANALYTES={PAA:PAA_ANALYTES,UOA:UOA_ANALYTES,AC:AC_ANALYTES,CAR:CAR_ANALYTES,UAG:UAG_ANALYTES,MISC:MISC_ANALYTES};
