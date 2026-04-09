import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const FontLink = () => (
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
);

// ─── REFERENCE DATA ──────────────────────────────────────────
const PAA_ANALYTES = [
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
const UOA_ANALYTES = [
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
  {id:"SAICAr", name:"Succinyladenosine (SAICAr)",  lo:0,hi:0,   unit:"mmol/mol Cr"},  // ADSL deficiency
  {id:"SSCys",  name:"S-Sulfocysteine",             lo:0,hi:0,   unit:"µmol/L"},       // Sulfite oxidase / MoCo def (plasma AA)
];
const AC_ANALYTES = [
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

const CAR_ANALYTES = [
  {id:"CarFree",  name:"Free carnitine",        lo:20, hi:60,  unit:"µmol/L"},
  {id:"CarTotal", name:"Total carnitine",        lo:25, hi:75,  unit:"µmol/L"},
  {id:"CarEst",   name:"Esterified carnitine",   lo:0,  hi:25,  unit:"µmol/L"},
  {id:"CarRatio", name:"Acyl/free carnitine ratio", lo:0, hi:0.4, unit:"ratio"},
];
const UAG_ANALYTES = [
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
const MISC_ANALYTES = [
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
];

const ANALYTE_MAP = {};
const AC_RATIOS=[
  // Existing
  {id:"C8C10",    name:"C8/C10 ratio",           lo:0, hi:2.0,  unit:"ratio"},  // MCAD: C8>>C10 → ratio high
  {id:"C14_1C16", name:"C14:1/C16 ratio",        lo:0, hi:0.08, unit:"ratio"},  // VLCAD: C14:1 high vs C16
  {id:"C3C2",     name:"C3/C2 ratio",            lo:0, hi:0.15, unit:"ratio"},  // PA/MMA: elevated
  {id:"C0LC",     name:"C0/(C16+C18) ratio",     lo:0, hi:40,   unit:"ratio"},  // CPT1: high (low long-chain, high C0)
  // New — evidence-based
  {id:"C16OHC16", name:"C16-OH/C16 ratio",       lo:0, hi:0.04, unit:"ratio"},  // LCHAD: C16-OH disproportionately high; Ibdah et al., NEJM 1999
  {id:"C5DCC8",   name:"C5DC/C8 ratio",          lo:0, hi:0.8,  unit:"ratio"},  // GA-I vs MCAD discriminator: GA-I C5DC>>C8; Kolker et al. 2006
  {id:"C5C3",     name:"C5/C3 ratio",            lo:0, hi:0.15, unit:"ratio"},  // IVA: C5 disproportionate vs C3; distinguishes IVA from PA/MMA
  {id:"C14_1C14", name:"C14:1/C14 ratio",        lo:0, hi:0.5,  unit:"ratio"},  // VLCAD: C14:1 > C14 is characteristic; Strauss et al. 2007
  {id:"C3C16",    name:"C3/(C16+C18) ratio",     lo:0, hi:0.5,  unit:"ratio"},  // Useful PA/MMA axis relative to long-chain pool
  // Miller 2021 ACMG additions
  {id:"C14_1C12_1",name:"C14:1/C12:1 ratio",      lo:0, hi:3.0,  unit:"ratio"},  // VLCAD: typically >3; mildly elevated in LCHAD/TFP and ketosis
  {id:"C16C18_1C2",name:"(C16+C18:1)/C2 ratio",   lo:0, hi:0.25, unit:"ratio"},  // Long-chain FAO burden: CPT2/CACT/VLCAD elevate this; Miller 2021
  {id:"C4OHC4",   name:"C4-OH/C4 ratio",          lo:0, hi:0.6,  unit:"ratio"},  // SCHAD: C4-OH disproportionately elevated; HADH def
  {id:"C16OHC18_1OH",name:"C16-OH/C18:1-OH ratio",lo:0, hi:2.0,  unit:"ratio"},  // LCHAD vs TFP: LCHAD has more C16-OH relative to C18:1-OH
  {id:"C14_1C12", name:"C14:1/C12 ratio",         lo:0, hi:1.5,  unit:"ratio"},  // VLCAD: C14:1 > C12 characteristic; Miller 2021
];

// PAA derived ratios (calculated from entered values)
const PAA_RATIOS=[
  {id:"PheTyr",   name:"Phe/Tyr ratio",           lo:0, hi:3.0,  unit:"ratio"},  // PKU/BH4: >3 suspicious, >10 classic PKU; van Spronsen 2017
  {id:"CitArg",   name:"Cit/Arg ratio",            lo:0, hi:3.0,  unit:"ratio"},  // ASS1 (CITR1): >4 strongly supports; reported ratio 111 in classic case
  {id:"OrnCit",   name:"Orn/Cit ratio",            lo:0, hi:3.0,  unit:"ratio"},  // HHH: Orn high, Cit low → ratio very high; Camacho et al. 2006
  {id:"GlnAla",   name:"Gln/Ala ratio",            lo:0, hi:6.0,  unit:"ratio"},  // Hyperammonemia axis: Gln rises faster than Ala; Walker 2009
  {id:"GlyCit",   name:"Gly/Cit ratio",            lo:0, hi:5.0,  unit:"ratio"},  // NAGS/CPS1 (no Cit, Gly rises): high Gly with low/normal Cit
  {id:"GlySer",   name:"Gly/Ser ratio",            lo:0, hi:2.5,  unit:"ratio"},  // NKH (plasma proxy for CSF:plasma ratio): Gly>>Ser; Hamosh 1998
  {id:"LeuAla",   name:"(Leu+Ile+Val)/Ala ratio",  lo:0, hi:4.0,  unit:"ratio"},  // MSUD: BCAA sum rises disproportionately vs Ala; Strauss 2006
  {id:"MetHcy",   name:"Met/Hcy ratio",            lo:0, hi:5.0,  unit:"ratio"},  // CBS: both Met and Hcy high (ratio preserved or slightly high); MTHFR: Hcy high, Met low → ratio very low; Mudd 2001
  // Cross-panel ratio (AC + PAA) — computed in runAnalysis
  {id:"C3Gly",    name:"C3/Glycine ratio",         lo:0, hi:0.015, unit:"ratio"}, // PA: C3/Gly 0% overlap disease vs normal range; available in ~31% of cases; Gavrilov 2020
];

// UOA derived ratios
const UOA_RATIOS=[
  {id:"LacPyr",   name:"Lactate/Pyruvate ratio",   lo:0, hi:25,   unit:"ratio"},  // L/P >25 supports PDHC def or respiratory chain disorder; pyruvate dehydrogenase spectrum; Brown 2005
  {id:"OHGAtoGA", name:"3-OHGA/GA ratio",          lo:0, hi:0.3,  unit:"ratio"},  // GA-I: 3-OHGA is more specific than GA alone; ratio >0.3 supports GA-I over GA-III; Kölker 2011
  {id:"MMAtoMCA", name:"MMA/MCA ratio",            lo:0, hi:5.0,  unit:"ratio"},  // PA: methylcitric acid (MCA) high vs MMA; in MMA: MMA>>MCA; Coelho 2008
];

[...PAA_ANALYTES,...UOA_ANALYTES,...AC_ANALYTES,...CAR_ANALYTES,...UAG_ANALYTES,...MISC_ANALYTES,
 ...AC_RATIOS,...PAA_RATIOS,...UOA_RATIOS].forEach(a=>{ANALYTE_MAP[a.id]=a;});

const ANALYTE_ID_REFERENCE = [
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
const DISORDERS = [
  {id:"PKU",      name:"Phenylketonuria (PKU) / HPA",          category:"Aminoacidopathy",     gene:"PAH",
   signature:[{panel:"PAA",id:"Phe",direction:"high",weight:3},{panel:"PAA",id:"Tyr",direction:"low",weight:2},{panel:"PAA",id:"PheTyr",direction:"high",weight:2}],
   notes:"PAH deficiency. Phe elevated, Tyr low (Tyr is the product of PAH, becomes semi-essential). CRITICAL: every patient with elevated Phe must be screened for BH4 disorders (PTPS, DHPR, GTPCH I, PCD) — these affect 1–3% of hyperphenylalaninaemics and cause progressive neurological deterioration despite dietary Phe control. Screening: urine pterin profile + DHPR activity in blood spot in ALL elevated Phe cases at NBS. Classic PKU: Phe >600 µmol/L on unrestricted diet. Phe/Tyr ratio >10 characteristic of untreated PKU and BH4 disorders. BH4 loading test (20 mg/kg): ≥30% Phe reduction at 24h confirms BH4-responsiveness → sapropterin (Kuvan) treatment option."},
  {id:"PTPS",     name:"PTPS deficiency (BH4 synthesis)",       category:"BH4 Disorder",        gene:"PTS",
   signature:[{panel:"PAA",id:"Phe",direction:"high",weight:3},{panel:"PAA",id:"Tyr",direction:"low",weight:2},{panel:"PAA",id:"Trp",direction:"high",weight:1},{panel:"PAA",id:"PheTyr",direction:"high",weight:2}],
   notes:"6-Pyruvoyl-tetrahydropterin synthase (PTPS) deficiency — most common BH4 disorder, ~60% of atypical PKU. BH4 is an essential cofactor for phenylalanine hydroxylase (PAH), tyrosine hydroxylase (TH → dopamine), and neuronal tryptophan hydroxylase (NTPH → serotonin). PTPS block reduces BH4 → impairs ALL three hydroxylases. PAA: Phe↑ + Tyr↓ (identical to PKU on amino acids alone). Critical distinction from classic PKU: patients develop progressive neurological deterioration — hypotonia, dystonia, abnormal movements, seizures, developmental regression — despite dietary Phe control, because brain neurotransmitter synthesis (dopamine, serotonin) is impaired independently. Two forms: (1) severe/typical — hyperphenylalaninaemia + abnormal CSF neurotransmitters; (2) peripheral/mild — minor or absent CSF changes, transient HPA, excellent prognosis. Diagnosis: urine pterin profile (biopterin LOW, neopterin normal-low, reduced biopterin/neopterin ratio); confirmed by PTS enzyme assay or gene sequencing. Treatment: BH4 (1–10 mg/kg/day, lower than needed for PKU BH4 loading) + L-dopa/carbidopa + 5-hydroxytryptophan. CSF HVA and 5-HIAA used to monitor neurotransmitter adequacy. Serum prolactin (dopamine inhibits prolactin secretion) monitors dopamine replacement. Gene: PTS, 11q22.3-23.3."},
  {id:"DHPR",     name:"DHPR deficiency (BH4 regeneration)",    category:"BH4 Disorder",        gene:"QDPR",
   signature:[{panel:"PAA",id:"Phe",direction:"high",weight:3},{panel:"PAA",id:"Tyr",direction:"low",weight:2},{panel:"PAA",id:"Trp",direction:"high",weight:1},{panel:"PAA",id:"PheTyr",direction:"high",weight:2}],
   notes:"Dihydropteridine reductase (DHPR) deficiency — ~30% of atypical PKU, clinically most severe BH4 disorder. DHPR regenerates BH4 from q-dihydrobiopterin (BH2) after hydroxylation reactions. Without DHPR: BH2 accumulates and directly inhibits all BH4-dependent enzymes (PAH, TH, NTPH), worsening the deficiency beyond what the primary enzyme block alone would cause. PAA: Phe↑ + Tyr↓. Additional critical feature: DHPR also maintains folate in the active tetrahydro form — DHPR deficiency causes cerebral folate deficiency independent of dietary folate intake, resulting in progressive white matter changes and basal ganglia calcifications on MRI. Patients with DHPR deficiency are prone to sudden death. Treatment: BH4 + L-dopa/carbidopa + 5-hydroxytryptophan + FOLINIC ACID (essential — prevents cerebral folate deficiency; standard folic acid is not adequate as it also needs DHPR for brain activation). DHPR activity measured directly on dried blood spots — this is a standard component of NBS pterin screening. Gene: QDPR, 4p15.3. Some patients (G151S, F212C mutations) have mild phenotype affecting serotonin only."},
  {id:"GTPCH1",   name:"GTP cyclohydrolase I deficiency (rec.)", category:"BH4 Disorder",        gene:"GCH1",
   signature:[{panel:"PAA",id:"Phe",direction:"high",weight:3},{panel:"PAA",id:"Tyr",direction:"low",weight:2},{panel:"PAA",id:"Trp",direction:"high",weight:1}],
   notes:"GTP cyclohydrolase I (GTPCH I) deficiency — recessive form, ~5% of atypical PKU. GTPCH I catalyses the rate-limiting step in BH4 synthesis from GTP. Recessive form: mutations in both GCH1 alleles → severe BH4 deficiency → Phe↑ + Tyr↓ + profound neurotransmitter deficiency. Clinical: developmental delay, trunk hypotonia, hypertonia of extremities, abnormal movements, tremors, seizures, sometimes autonomic dysfunction. Urine pterin profile: both biopterin AND neopterin LOW (neopterin is a by-product of the GTPCH I reaction — its absence distinguishes GTPCH I deficiency from PTPS where neopterin accumulates). Treatment: BH4 + L-dopa/carbidopa + 5-hydroxytryptophan. Note: GTPCH I is regulated by the feedback regulatory protein GFRP — phenylalanine stimulates GTPCH I via GFRP, which is why Phe levels affect neopterin and biopterin concentrations even in normal individuals. Gene: GCH1, 14q22.1-22.2; >100 mutations identified."},
  {id:"DRD",      name:"Dopa-responsive dystonia (GTPCH I dom.)", category:"BH4 Disorder",       gene:"GCH1 (dominant)",
   signature:[{panel:"PAA",id:"Tyr",direction:"low",weight:2},{panel:"PAA",id:"Trp",direction:"high",weight:1}],
   notes:"Dopa-responsive dystonia (DRD) / Segawa disease — dominant form of GTP cyclohydrolase I deficiency (heterozygous GCH1 mutation). Sufficient BH4 is made in peripheral tissues (hepatic PAH function intact) but dopaminergic neurons in the substantia nigra are selectively vulnerable to partial BH4 deficiency. CRITICAL DISTINGUISHING FEATURE: plasma phenylalanine is NORMAL (PAH function preserved) — DRD is NOT detected by standard NBS. Tyr may be mildly low. Clinical: childhood-onset progressive dystonia, typically starting in a lower limb; diurnal fluctuation (worse in the evening, improved after sleep); dramatic and sustained response to very low-dose levodopa (1–3 mg/kg/day) — response is so dramatic that it is nearly pathognomonic. Intellect usually normal. Reduced penetrance: some carrier parents are asymptomatic. Urine pterin profile: normal peripherally (diagnosis requires CSF pterin and neurotransmitter measurement, or empirical levodopa trial). CSF: low HVA (borderline), 5-HIAA may be slightly reduced or normal. Treatment: levodopa/carbidopa at low dose — lifelong, dramatic sustained response. Gene: GCH1; inherited autosomal dominant with reduced penetrance."},
  {id:"SR_DEF",   name:"Sepiapterin reductase deficiency",       category:"BH4 Disorder",        gene:"SPR",
   signature:[{panel:"PAA",id:"Tyr",direction:"low",weight:2},{panel:"PAA",id:"Trp",direction:"high",weight:1}],
   notes:"Sepiapterin reductase (SR) deficiency — rare, CRITICAL diagnostic trap. SR catalyses the final two steps of BH4 synthesis. Peripheral tissues can use alternative enzymes (aldose reductase, carbonyl reductase, dihydrofolate reductase) to synthesise BH4 — but in the brain, dihydrofolate reductase activity is <10% of liver, so these alternatives fail. Result: selective brain BH4 deficiency with NORMAL peripheral BH4. CRITICAL: plasma phenylalanine is NORMAL, urine pterins are NORMAL or minimally abnormal — SR deficiency is NOT detected by standard NBS and will be missed on routine urine pterin screening. Tyr may be mildly low. Clinical: psychomotor retardation, inconsolable crying, hypotonia, dystonic posturing, oculogyric crises, spasticity, tremor, ataxia, chorea, Parkinsonism, diurnal variation (worse in evening), psychiatric symptoms, microcephaly. Prolactin may be elevated (dopamine inhibits prolactin; dopamine deficiency → hyperprolactinaemia). Brain MRI usually normal. Diagnosis requires CSF: low HVA, low 5-HIAA, elevated biopterin + dihydrobiopterin, sepiapterin detectable in CSF (CSF sepiapterin is pathognomonic). SR enzyme activity in fibroblasts confirms diagnosis. Treatment: L-dopa/carbidopa + 5-hydroxytryptophan (BH4 supplementation generally not needed since peripheral Phe is normal). Gene: SPR, 2p13."},
  {id:"PCD_DEF",  name:"Pterin-4α-carbinolamine dehydratase def.", category:"BH4 Disorder",      gene:"PCBD1",
   signature:[{panel:"PAA",id:"Phe",direction:"high",weight:2},{panel:"PAA",id:"Tyr",direction:"low",weight:1}],
   notes:"Pterin-4α-carbinolamine dehydratase (PCD) deficiency — benign, transient. PCD converts pterin-4α-carbinolamine to q-dihydrobiopterin in the BH4 regeneration pathway. In the absence of PCD, the substrate spontaneously converts to primapterin (7-biopterin), which appears in urine. Clinical: mild transient hyperphenylalaninaemia in the newborn period (detected on NBS); most patients are completely asymptomatic; neurotransmitter levels normal; outcome excellent. Phenylalanine normalises after a few months on an unrestricted diet. Transient hypotonia reported in a minority. The condition is benign because PCD can also dimerize with HNF-1α as a transcription factor, and other enzymes compensate for the dehydratase function as the child grows. Urine pterin profile: primapterin (7-biopterin) detectable — this is the diagnostic marker. CSF neurotransmitters normal. Treatment: not required in most; if Phe elevated, dietary restriction until Phe normalises spontaneously. Gene: PCBD1, 10q22."},
  {id:"MSUD",     name:"Maple Syrup Urine Disease",             category:"Aminoacidopathy",     gene:"BCKDHA/B, DBT",
   signature:[{panel:"PAA",id:"Leu",direction:"high",weight:3},{panel:"PAA",id:"AlloIle",direction:"high",weight:3},{panel:"PAA",id:"Ile",direction:"high",weight:2},{panel:"PAA",id:"Val",direction:"high",weight:2},{panel:"PAA",id:"LeuAla",direction:"high",weight:2}],
   notes:"BCKDC deficiency. Alloisoleucine pathognomonic — absent in normal plasma. Elevated BCAAs; intermittent forms may normalize between crises."},
  {id:"CBS",      name:"Homocystinuria (CBS def.)",             category:"Aminoacidopathy",     gene:"CBS",
   signature:[{panel:"PAA",id:"Hcy",direction:"high",weight:3},{panel:"PAA",id:"Met",direction:"high",weight:2},{panel:"PAA",id:"MetHcy",direction:"high",weight:1},{panel:"MISC",id:"tHcy",direction:"high",weight:2}],
   notes:"CBS deficiency. Total Hcy >50 µmol/L untreated. High Met distinguishes from remethylation defects (cblC, MTHFR)."},
  {id:"TYR1",     name:"Tyrosinemia type I (HT1)",              category:"Aminoacidopathy",     gene:"FAH",
   signature:[{panel:"UOA",id:"SA",direction:"high",weight:3},{panel:"PAA",id:"Tyr",direction:"high",weight:2},{panel:"PAA",id:"Met",direction:"high",weight:1},{panel:"UOA",id:"4OHpp",direction:"high",weight:1},{panel:"UOA",id:"4OHpl",direction:"high",weight:1},{panel:"MISC",id:"ALT",direction:"high",weight:1},{panel:"MISC",id:"AST",direction:"high",weight:1}],
   notes:"FAH deficiency. Succinylacetone pathognomonic even at trace levels. Hepatorenal phenotype."},
  {id:"TYR2",     name:"Tyrosinemia type II (Richner-Hanhart)", category:"Aminoacidopathy",     gene:"TAT",
   signature:[{panel:"PAA",id:"Tyr",direction:"high",weight:3},{panel:"UOA",id:"4OHpp",direction:"high",weight:2},{panel:"UOA",id:"4OHpl",direction:"high",weight:2}],
   notes:"TAT deficiency. Very high Tyr (often >500–1000). No succinylacetone. Oculocutaneous features."},
  {id:"TYR3",     name:"Tyrosinemia type III",                  category:"Aminoacidopathy",     gene:"HPD",
   signature:[{panel:"PAA",id:"Tyr",direction:"high",weight:2},{panel:"UOA",id:"4OHpp",direction:"high",weight:3}],
   notes:"HPD (4-HPPD) deficiency. Massive 4-OH-phenylpyruvic aciduria with moderate tyrosinemia. Rare."},
  {id:"ALKAPT",   name:"Alkaptonuria",                          category:"Aminoacidopathy",     gene:"HGD",
   signature:[{panel:"UOA",id:"HGA",direction:"high",weight:3}],
   notes:"HGD deficiency. Massive homogentisic aciduria. Urine darkens on alkalinization (ochronosis). Adult ochronotic arthropathy."},
  {id:"NKH",      name:"Non-ketotic hyperglycinemia (GCE)",      category:"Aminoacidopathy",     gene:"GLDC, AMT, GCSH",
   signature:[{panel:"PAA",id:"Gly",direction:"high",weight:3},{panel:"PAA",id:"Ser",direction:"low",weight:1},{panel:"PAA",id:"Thr",direction:"high",weight:1},{panel:"PAA",id:"GlySer",direction:"high",weight:2}],
   notes:"Glycine encephalopathy (GCE) — deficiency of the mitochondrial glycine cleavage system (GCS), a 4-protein complex (P-protein/GLDC, T-protein/AMT, H-protein/GCSH, L-protein). GCS converts glycine to CO2 + NH3 + methylene-tetrahydrofolate. Deficiency causes glycine accumulation in all body fluids, especially CNS. Genes: GLDC (~75–80%), AMT (~15–20%), GCSH (rare). CRITICAL BIOCHEMICAL PRINCIPLE: plasma glycine alone is an unreliable diagnostic marker — it can be only modestly elevated (1.3–3× ULN) because plasma glycine reflects whole-body metabolism and muscle/collagen glycine pools. The CSF:plasma glycine ratio is the diagnostic key: normal ratio 0.02–0.04; NKH ratio >0.09 (often 0.15–0.30). A ratio >0.09 with consistent clinical picture is diagnostic. Serine may be mildly low (GCS generates methylene-THF which feeds into serine synthesis via the reverse serine hydroxymethyltransferase reaction — GCS block reduces this route). Threonine may be mildly elevated (threonine catabolism via threonine dehydrogenase → aminoacetone → glycine; substrate backup). Mechanism of encephalopathy: glycine is both an inhibitory neurotransmitter (strychnine-sensitive glycine receptors in brainstem/spinal cord) and an obligate co-agonist at NMDA glutamate receptors — NMDA receptor overactivation causes excitotoxic injury. Clinical phenotypes: (1) Classic neonatal — most common and severe; presents day 1–3 with hypotonia, lethargy, apnoea, burst-suppression EEG; HICCUPS are pathognomonic (brainstem glycine receptor activation); without intensive care most die; survivors have severe intellectual disability, intractable seizures, spastic quadriplegia. (2) Infantile — presents weeks to months after birth with seizures and developmental delay; intermediate severity. (3) Late onset — episodic delirium, chorea, spasticity, behavioural problems; milder phenotype, function often preserved. (4) Transient neonatal hyperglycinemia (non-NKH) — plasma glycine elevated but CSF:plasma ratio normal or borderline; resolves spontaneously; distinguish by serial CSF:plasma ratios and GCS enzyme assay/gene sequencing. DIFFERENTIAL: in organic acidemias (PA, MMA, IVA), 'ketotic hyperglycinemia' occurs — plasma glycine elevated but the CSF:plasma ratio is normal (distinguishes from NKH); organic acids in urine are abnormal. Treatment: sodium benzoate (primary — conjugates glycine to hippurate, reduces plasma glycine; target plasma Gly <75–120 µmol/L); NMDA antagonists — dextromethorphan or ketamine reduce seizures and improve tone by blocking NMDA receptor overactivation; pyridoxine trial (GCS requires PLP cofactor). Despite biochemical improvement, neurodevelopmental outcomes in classic neonatal NKH remain severely impaired."},
  {id:"HYPER_PRO",name:"Hyperprolinemia type I",                category:"Aminoacidopathy",     gene:"PRODH",
   signature:[{panel:"PAA",id:"Pro",direction:"high",weight:3}],
   notes:"Proline oxidase deficiency. Pro >500 µmol/L. Associated with psychiatric/neurodevelopmental risk. 22q11DS phenotype."},
  {id:"CITR1",    name:"Citrullinemia type I (ASS1)",           category:"Urea Cycle Disorder", gene:"ASS1",
   signature:[{panel:"PAA",id:"Cit",direction:"high",weight:3},{panel:"UOA",id:"Orotic",direction:"high",weight:2},{panel:"PAA",id:"Gln",direction:"high",weight:1},{panel:"PAA",id:"Arg",direction:"low",weight:1},{panel:"PAA",id:"CitArg",direction:"high",weight:2},{panel:"PAA",id:"GlnAla",direction:"high",weight:1},{panel:"MISC",id:"Ammonia",direction:"high",weight:1}],
   notes:"ASS1 deficiency — third step of urea cycle. Classic neonatal form: presents in first days of life with encephalopathy, seizures, death if untreated. Subacute/late-onset form: may present as late as 5–12 months with episodic encephalopathy triggered by intercurrent febrile illness, mimicking sepsis — clinicians must check ammonia in any infant with atypical or severe encephalopathy. Partial gene expression can delay presentation. Citrulline markedly elevated (50–100× normal; typical plasma Cit >400 µmol/L, often >1000 µmol/L). Citrulline:Arginine ratio >4 is a useful diagnostic indicator (in the published case, ratio was 111; cut-off 4). Orotic acid elevated (distinguishes from CPS1/NAGS/CA-VA). MRI findings in acute hyperammonemia: bilateral frontoparietal/temporal cortical-subcortical signal change, characteristic peri-insular involvement, thalamic sparing — sparing of thalami helps differentiate from hypoxic-ischaemic encephalopathy. Physiological context: ASS1 is widely expressed (unlike CPS1/OTC) and supports the intestinal-renal citrulline-arginine axis — its deficiency blocks peripheral arginine synthesis explaining low plasma arginine alongside high citrulline. Treatment: protein restriction + arginine supplementation (200 mg/kg/day — arginine becomes essential downstream of the block) + sodium benzoate/phenylacetate. Hemodiafiltration for severe acute hyperammonemia. ASS1 c.793C>T p.Arg265Cys is a known pathogenic homozygous variant. Confirm by ASS1 sequencing. Incidence 1:57,000."},
  {id:"CITR2",    name:"Citrullinemia type II (Citrin def.)",   category:"Urea Cycle Disorder", gene:"SLC25A13",
   signature:[{panel:"PAA",id:"Cit",direction:"high",weight:3},{panel:"PAA",id:"Thr",direction:"high",weight:2},{panel:"PAA",id:"Met",direction:"high",weight:1},{panel:"PAA",id:"Arg",direction:"high",weight:1},{panel:"MISC",id:"Ammonia",direction:"high",weight:1},{panel:"MISC",id:"ALT",direction:"high",weight:1}],
   notes:"Citrin (mitochondrial aspartate-glutamate carrier) deficiency. Two phenotypes: (1) NICCD — neonatal intrahepatic cholestasis, moderate Cit↑, resolves with lactose-free formula; (2) Adult-onset Citrullinemia type II — marked Cit elevation (often 100–300 µmol/L), episodic hyperammonemia, neuropsychiatric crisis, strong protein/fat food preference, aversion to carbohydrates. Thr and Met often elevated. Distinguish from ASS1 by gene sequencing; Cit level usually lower than classical Citrullinemia type I. Common in East Asian populations."},
  {id:"ASA_AC",   name:"Argininosuccinic aciduria (ASL)",       category:"Urea Cycle Disorder", gene:"ASL",
   signature:[{panel:"PAA",id:"ASA",direction:"high",weight:3},{panel:"PAA",id:"Cit",direction:"high",weight:2},{panel:"UOA",id:"Orotic",direction:"high",weight:2},{panel:"MISC",id:"Ammonia",direction:"high",weight:1}],
   notes:"Argininosuccinate lyase (ASL) deficiency — fourth step of urea cycle. ASL cleaves argininosuccinate into arginine + fumarate. Argininosuccinate (ASA) accumulates in plasma and is excreted in urine — plasma ASA elevation is pathognomonic (appears as a peak adjacent to citrulline on some amino acid analysers). Moderate citrulline elevation (typically 100–400 µmol/L, lower than ASS1 deficiency). Orotic aciduria present. Arginine low downstream. Important long-term complications beyond acute hyperammonemia: hepatic fibrosis/cirrhosis (independent of ammonia control), systemic hypertension, and neurocognitive impairment — these occur even in well-managed patients and are likely due to nitric oxide deficiency (ASL is also essential for recycling citrulline → arginine in the NO synthesis pathway in endothelium). This 'two-hit' ASL disease concept distinguishes it from other UCDs where complications are primarily ammonia-mediated. Treatment: arginine supplementation (essential downstream), nitrogen scavengers, protein restriction. Liver transplant corrects ammonia issues but does not normalise the systemic complications. Fumarate released by ASL supports TCA cycle — its absence may contribute to mitochondrial dysfunction."},
  {id:"ARG1",     name:"Argininemia (ARG1 def.)",               category:"Urea Cycle Disorder", gene:"ARG1",
   signature:[{panel:"PAA",id:"Arg",direction:"high",weight:3},{panel:"PAA",id:"Gln",direction:"high",weight:1},{panel:"UOA",id:"Orotic",direction:"high",weight:1},{panel:"MISC",id:"Ammonia",direction:"high",weight:1}],
   notes:"ARG1 deficiency. Plasma Arg >300 µmol/L (normal ~50 µmol/L). Progressive spastic diplegia. Hyperammonemia often milder than other UCDs. Arginine is the amidino donor for creatine synthesis via GATM (L-arginine:glycine amidinotransferase) — creatine synthesis consumes ~20–30% of daily arginine production. In ARG1 deficiency, arginine excess does not primarily impair creatine synthesis (in contrast to OAT deficiency where high ornithine inhibits GATM). Serum creatinine below normal is not a consistent feature of ARG1 deficiency (unlike OAT deficiency). Treatment with arginine-free formula and protein restriction lowers arginine but must preserve adequate BCAAs — persistent low BCAAs on treatment indicate over-restriction."},
  {id:"OTC",      name:"OTC deficiency",                        category:"Urea Cycle Disorder", gene:"OTC (X-linked)",
   signature:[{panel:"UOA",id:"Orotic",direction:"high",weight:3},{panel:"PAA",id:"Gln",direction:"high",weight:2},{panel:"PAA",id:"Ala",direction:"high",weight:1},{panel:"PAA",id:"Cit",direction:"low",weight:1},{panel:"PAA",id:"Arg",direction:"low",weight:1},{panel:"PAA",id:"GlnAla",direction:"high",weight:1},{panel:"PAA",id:"GlyCit",direction:"high",weight:1},{panel:"MISC",id:"Ammonia",direction:"high",weight:1}],
   notes:"Ornithine transcarbamoylase (OTC) deficiency — most common UCD. X-linked: hemizygous males typically severe (neonatal onset); heterozygous females have variable expression (10–25% symptomatic, protein aversion, migraine, intermittent hyperammonemia, stroke-like episodes). OTC catalyses citrulline synthesis from ornithine + carbamoyl phosphate in the mitochondrial matrix. Elevated orotic acid is the key distinguisher from CPS1/NAGS/CA-VA (excess carbamoyl phosphate leaks into pyrimidine synthesis → orotic acid). Low citrulline and arginine downstream. Glutamine and alanine elevated as nitrogen carriers. Late-onset/mild OTC can present at any age including adult onset (precipitated by illness, surgery, high protein load, or valproate). Treatment: protein restriction + citrulline supplementation + nitrogen scavengers (sodium benzoate, sodium phenylbutyrate/phenylacetate). Liver transplant curative. Allopurinol challenge can unmask asymptomatic OTC carriers (orotic acid increases after allopurinol in carriers)."},
  {id:"CPS1",     name:"CPS1 deficiency",                       category:"Urea Cycle Disorder", gene:"CPS1",
   signature:[{panel:"PAA",id:"Gln",direction:"high",weight:2},{panel:"PAA",id:"Ala",direction:"high",weight:1},{panel:"PAA",id:"Cit",direction:"low",weight:2},{panel:"PAA",id:"Arg",direction:"low",weight:1},{panel:"PAA",id:"GlnAla",direction:"high",weight:1},{panel:"PAA",id:"GlyCit",direction:"high",weight:1},{panel:"MISC",id:"Ammonia",direction:"high",weight:1}],
   notes:"Carbamoyl phosphate synthetase 1 deficiency. CPS1 catalyses the ATP-dependent condensation of bicarbonate and NH4+ to form carbamoyl phosphate — the first committed step of the urea cycle. CPS1 requires N-acetylglutamate (NAG) as an allosteric activator (not a substrate); NAG is synthesised by NAGS from glutamate and acetyl-CoA. Biochemical profile: normal or low orotic acid (key distinction from OTC), low Cit and Arg, elevated Gln. Does NOT respond to N-carbamylglutamate (NCG), distinguishing it from NAGS deficiency. Low citrulline also reflects impaired systemic arginine synthesis via the intestinal-renal axis (small intestine OTC requires CP from CPS1 for citrulline production → renal ASS1+ASL → arginine). Definitive diagnosis: CPS1 enzyme assay (liver biopsy) or CPS1 sequencing."},
  {id:"NAGS",     name:"NAGS deficiency",                       category:"Urea Cycle Disorder", gene:"NAGS",
   signature:[{panel:"PAA",id:"Gln",direction:"high",weight:2},{panel:"PAA",id:"Ala",direction:"high",weight:1},{panel:"PAA",id:"Cit",direction:"low",weight:2},{panel:"PAA",id:"Arg",direction:"low",weight:1},{panel:"MISC",id:"Ammonia",direction:"high",weight:1}],
   notes:"N-acetylglutamate synthase deficiency. NAGS synthesises NAG from glutamate and acetyl-CoA. NAG is the obligate allosteric activator of CPS1 — without NAG, CPS1 is inactive regardless of substrate availability. This is why NAGS deficiency produces an identical biochemical profile to CPS1 deficiency: low Cit/Arg, normal orotic acid, elevated Gln. Critical distinction: NAGS deficiency responds rapidly and dramatically to N-carbamylglutamate (NCG/carglumic acid), a stable NAG analogue that directly activates CPS1 and bypasses the NAGS block. NCG trial should be attempted in any CPS1-like presentation before committing to a CPS1 diagnosis — response confirms NAGS deficiency and is both diagnostic and curative. Arginine also stimulates NAGS activity (feedback loop), so arginine supplementation can partially activate residual NAGS. Gene: NAGS."},
  {id:"CAVA",     name:"Carbonic anhydrase VA deficiency",      category:"Urea Cycle Disorder", gene:"CA5A",
   signature:[{panel:"PAA",id:"Gln",direction:"high",weight:2},{panel:"PAA",id:"Ala",direction:"high",weight:1},{panel:"PAA",id:"Cit",direction:"low",weight:2},{panel:"PAA",id:"Arg",direction:"low",weight:1},{panel:"MISC",id:"Ammonia",direction:"high",weight:1},{panel:"MISC",id:"Lactate",direction:"high",weight:1}],
   notes:"CA5A deficiency. Carbonic anhydrase VA provides bicarbonate to CPS1 in the mitochondrial matrix — its deficiency causes secondary CPS1 impairment and hyperammonemia. Biochemical profile mimics CPS1/NAGS: low Cit/Arg, normal orotic acid, elevated Gln. Key distinguishers: (1) responds to NCG (like NAGS), (2) also may respond to bicarbonate supplementation, (3) plasma lactate may be elevated (secondary to impaired pyruvate carboxylase). Increasingly recognised with next-generation sequencing. Gene: CA5A."},
  {id:"HHH",      name:"HHH syndrome",                          category:"Urea Cycle Disorder", gene:"SLC25A15",
   signature:[{panel:"PAA",id:"Orn",direction:"high",weight:3},{panel:"UOA",id:"Orotic",direction:"high",weight:2},{panel:"PAA",id:"Gln",direction:"high",weight:1},{panel:"MISC",id:"Ammonia",direction:"high",weight:1}],
   notes:"Mitochondrial ornithine transporter (ORNT1/SLC25A15) defect. Ornithine elevated 3–10× normal (typically 300–800 µmol/L, somewhat lower than gyrate atrophy). Pathognomonic triad: hyperornithinemia + hyperammonemia + homocitrullinuria. Critical differentiator from OAT deficiency: Citrulline is NORMAL in HHH (not low as in UCDs, not elevated). Orotic aciduria present — secondary to carbamoylphosphate overflow. Homocitrulline in urine pathognomonic but requires urine amino acid/organic acid analysis. More common in French-Canadians. Treatment: protein restriction, citrulline supplementation. Use arginine with caution (may worsen spastic paraparesis). F188Δ common mutation in French-Canadian patients."},
  {id:"OAT",      name:"Gyrate atrophy (OAT deficiency)",       category:"Urea Cycle Disorder", gene:"OAT",
   signature:[{panel:"PAA",id:"Orn",direction:"high",weight:3},{panel:"PAA",id:"Pro",direction:"low",weight:1},{panel:"PAA",id:"Arg",direction:"low",weight:1}],
   notes:"Ornithine aminotransferase (OAT) deficiency. OAT is a PLP-requiring mitochondrial matrix enzyme. Two physiological roles depending on age: (1) neonatal period — net flux synthesises ornithine from glutamate (P5CS→OAT), supporting urea cycle substrate provision; (2) after a few months — net flux reverses to ornithine catabolism via P5C toward proline and glutamate. Beyond neonatal period: fasting plasma ornithine 400–1200 µmol/L (5–20×normal) due to impaired catabolism. Primary feature: progressive gyrate atrophy of choroid and retina — chorioretinal degeneration, night blindness → blindness by age 45–65. Creatine deficiency: high ornithine inhibits glycine transamidinase (GATM) — the first enzyme of creatine biosynthesis (which normally uses arginine as amidino donor). This impairs creatine synthesis, reducing plasma creatinine and muscle phosphocreatine. Brain NMR spectroscopy shows reduced creatine; low serum creatinine is a useful clinical marker. No homocitrullinuria (key distinction from HHH). Neonatal form: LOW Orn/Cit/Arg + hyperammonemia (paradox explained above). Treatment: arginine-restricted diet target Orn <200 µmol/L; pyridoxine trial (300–500 mg/day); creatine supplementation. Gene OAT at 10q26; highest incidence in Finnish population (OAT-L402P accounts for >85% Finnish alleles)."},
  {id:"P5CS",     name:"P5C synthase (P5CS) deficiency",        category:"Urea Cycle Disorder", gene:"ALDH18A1",
   signature:[{panel:"PAA",id:"Orn",direction:"low",weight:3},{panel:"PAA",id:"Cit",direction:"low",weight:2},{panel:"PAA",id:"Arg",direction:"low",weight:2},{panel:"PAA",id:"Pro",direction:"low",weight:2},{panel:"PAA",id:"Gln",direction:"high",weight:1}],
   notes:"Δ1-Pyrroline-5-carboxylate synthase (P5CS) deficiency. Rare autosomal recessive neurocutaneous disorder (ALDH18A1 mutations). P5CS catalyses glutamate → P5C, the committed step in proline, ornithine and arginine biosynthesis from glutamate. Metabolic phenotype: LOW ornithine, citrulline, arginine AND proline — this pattern of low amino acids is the diagnostic clue (contrast with HHH/OAT where ornithine is HIGH). Paradoxical FASTING hyperammonemia (post-prandial arginine from diet temporarily corrects urea cycle). Clinical: lax/wrinkled skin, joint laxity, bilateral cataracts, developmental delay, peripheral neuropathy. Metabolic profile normalises post-prandially — diagnose with fasting amino acids. Only two affected families reported (Algerian and New Zealand Maori). Gene: ALDH18A1."},
  {id:"LPI",      name:"Lysinuric protein intolerance",         category:"Urea Cycle Disorder", gene:"SLC7A7",
   signature:[{panel:"PAA",id:"Lys",direction:"low",weight:2},{panel:"PAA",id:"Arg",direction:"low",weight:2},{panel:"PAA",id:"Orn",direction:"low",weight:2},{panel:"PAA",id:"Gln",direction:"high",weight:1},{panel:"UOA",id:"Orotic",direction:"high",weight:1}],
   notes:"SLC7A7 deficiency — defect of the y+LAT1 light chain of the cationic amino acid transporter (heterodimer with 4F2hc). Impairs transport of all dibasic amino acids (Lys, Arg, Orn) at both intestinal epithelium (absorption) and renal tubular epithelium (reabsorption). All three are therefore LOW in plasma despite being abundant in food, and ELEVATED in urine (dibasic hyperaminoaciduria). Hyperammonemia mechanism: post-prandial protein digestion generates ammonia, but inadequate Orn and Arg availability limits urea cycle capacity → ammonia accumulates. Patients develop protein aversion and self-restrict protein to avoid post-prandial symptoms (nausea, vomiting, drowsiness). Key clinical distinction from other UCDs: hyperammonemia occurs AFTER, not during fasting. Treatment principle: citrulline supplementation is preferred over arginine or ornithine supplementation — citrulline is NOT a dibasic amino acid and crosses the intestinal barrier normally via neutral amino acid transporters; once absorbed, it is converted to arginine by ASS1+ASL in peripheral tissues, bypassing the SLC7A7 defect. Oral L-lysine supplementation separately (lysine is essential and dietary intake is impaired). Protein restriction during acute hyperammonemia; moderate restriction chronically. The arginine-lysine transport competition described by Bouchereau & Schiff (2020): at y+LAT transporters, arginine and lysine compete for entry — this is exploited therapeutically in PDE (arginine supplementation reduces lysine brain transport) and explains why all dibasic AAs are mutually competitive. Serious systemic complications beyond hyperammonemia: (1) Pulmonary alveolar proteinosis (PAP) — secondary to impaired alveolar macrophage function; can be life-threatening; (2) Haematological: haemophagocytic lymphohistiocytosis (HLH), pancytopenia, bone marrow abnormalities; (3) Renal disease (glomerulosclerosis, focal segmental); (4) Osteoporosis. Monitor these complications regularly regardless of metabolic control status. Autosomal recessive; incidence ~1:50,000–1:70,000 in Finland (Finnish disease enrichment)."},
  {id:"GAMT",     name:"Guanidinoacetate methyltransferase def.", category:"Creatine Disorder",   gene:"GAMT",
   signature:[{panel:"PAA",id:"Arg",direction:"low",weight:1},{panel:"PAA",id:"Gly",direction:"high",weight:1}],
   notes:"GAMT deficiency — second step of creatine biosynthesis: GAMT methylates guanidinoacetate (GAA) to produce creatine, using S-adenosylmethionine as methyl donor. GAA accumulates (neurotoxic — binds glycine and GABA receptors) and creatine is absent. Clinical: intellectual disability, absent/severely delayed speech, autistic features, hypotonia, seizures (often myoclonic). Onset in infancy. Primary diagnostic markers: elevated plasma and urine GAA + absent creatine peak on brain MRS (not on standard PAA panel but GAA can appear on some extended amino acid panels). PAA may show mildly low Arg and elevated Gly. Treatment: creatine monohydrate + ornithine (suppresses GATM to reduce GAA production) + arginine restriction (reduces GATM substrate). Triple therapy normalises GAA, restores brain creatine, improves seizures. Early treatment before irreversible brain injury is critical. Autosomal recessive."},
  {id:"GATM",     name:"AGAT / GATM deficiency",                category:"Creatine Disorder",   gene:"GATM",
   signature:[{panel:"PAA",id:"Arg",direction:"low",weight:1},{panel:"PAA",id:"Gly",direction:"low",weight:1}],
   notes:"GATM (AGAT) deficiency — first step of creatine biosynthesis: GATM (L-arginine:glycine amidinotransferase) transfers the amidino group of arginine to glycine, producing guanidinoacetate (GAA) and ornithine. GATM deficiency causes primary creatine deficiency without GAA accumulation — this is the key distinction from GAMT deficiency. Clinical: intellectual disability, hypotonia, neurodevelopmental delay — generally milder than GAMT deficiency. Creatine synthesis consumes 20–30% of daily arginine production, so GATM deficiency represents a significant metabolic sink disruption. PAA: mildly low Arg and Gly (both consumed in the reaction). Urine: absent GAA (distinguishes from GAMT where GAA is markedly elevated). Brain MRS: absent creatine peak. Creatine monohydrate supplementation is highly effective — full neurological recovery is possible with early treatment. Autosomal recessive."},
  {id:"SLC6A8",   name:"Creatine transporter deficiency (SLC6A8)", category:"Creatine Disorder", gene:"SLC6A8 (X-linked)",
   signature:[{panel:"PAA",id:"Arg",direction:"high",weight:1},{panel:"PAA",id:"Gly",direction:"high",weight:1}],
   notes:"SLC6A8 deficiency — X-linked creatine transporter defect. SLC6A8 is the sodium-chloride-dependent creatine transporter that imports creatine into cells, primarily neurons. Without SLC6A8, cells cannot concentrate intracellular creatine despite normal plasma creatine levels — de novo creatine synthesis is intact but brain cells cannot take it up. Clinical: males: moderate-severe intellectual disability, absent/minimal speech, autistic features, seizures, hyperactivity — can be the most common X-linked ID syndrome after fragile X. Females: ~50% of carrier females are symptomatic (learning difficulties, behavioural problems). Key distinguisher from GAMT/GATM: plasma creatine NORMAL or elevated (synthesis intact), GAA NORMAL, but brain MRS shows absent creatine. Urine creatine/creatinine ratio markedly elevated (transporter dysfunction → creatine not reabsorbed in kidney). PAA signature is weak — mild Arg and Gly elevation may occur as creatine synthesis substrate backs up, but is non-specific. Creatine supplementation has limited benefit (transporter needed to get creatine into brain); high-dose creatine, arginine + glycine supplementation (to boost intracellular synthesis), and creatine analogues (cyclocreatine) are under investigation. Gene: SLC6A8 at Xq28."},
  {id:"PA",       name:"Propionic acidemia",                    category:"Organic Acidemia",    gene:"PCCA, PCCB",
   signature:[{panel:"AC",id:"C3",direction:"high",weight:3},{panel:"AC",id:"C3C2",direction:"high",weight:2},{panel:"UOA",id:"MCA",direction:"high",weight:3},{panel:"UOA",id:"3OHprop",direction:"high",weight:2},{panel:"UOA",id:"PG",direction:"high",weight:2},{panel:"PAA",id:"Gly",direction:"high",weight:1},{panel:"PAA",id:"C3Gly",direction:"high",weight:2},{panel:"AC",id:"C3C16",direction:"high",weight:1},{panel:"MISC",id:"Ammonia",direction:"high",weight:1},{panel:"MISC",id:"UricAc",direction:"high",weight:1},{panel:"MISC",id:"Lactate",direction:"high",weight:1}],
   notes:"PCC deficiency. C3 and methylcitric acid primary markers. MCA more prominent than in MMA. Neutropenia, cardiomyopathy."},
  {id:"MMA",      name:"Methylmalonic acidemia (mut/cblA/B)",   category:"Organic Acidemia",    gene:"MMUT, MMAA, MMAB",
   signature:[{panel:"AC",id:"C3",direction:"high",weight:3},{panel:"AC",id:"C3C2",direction:"high",weight:2},{panel:"UOA",id:"MMA",direction:"high",weight:3},{panel:"UOA",id:"MCA",direction:"high",weight:1},{panel:"PAA",id:"Gly",direction:"high",weight:1},{panel:"PAA",id:"C3Gly",direction:"high",weight:2},{panel:"UOA",id:"MMAtoMCA",direction:"high",weight:2},{panel:"AC",id:"C3C16",direction:"high",weight:1},{panel:"MISC",id:"Ammonia",direction:"high",weight:1},{panel:"MISC",id:"UricAc",direction:"high",weight:1},{panel:"MISC",id:"Lactate",direction:"high",weight:1}],
   notes:"MCM or adenosylcobalamin defect. MMA markedly elevated (can be >1000 mmol/mol Cr). Normal Hcy distinguishes from cblC. Renal involvement common."},
  {id:"CBLC",     name:"Combined MMA + Homocystinuria (cblC/D)",category:"Organic Acidemia",    gene:"MMACHC, MMADHC",
   analyticalCeiling:0.76, // Oglesbee 2017: AA clinical sensitivity 76.3% for combined MMA+Hcy
   signature:[{panel:"PAA",id:"Hcy",direction:"high",weight:3},{panel:"AC",id:"C3",direction:"high",weight:2},{panel:"UOA",id:"MMA",direction:"high",weight:2},{panel:"PAA",id:"Met",direction:"low",weight:1},{panel:"PAA",id:"MetHcy",direction:"low",weight:2},{panel:"MISC",id:"tHcy",direction:"high",weight:2}],
   notes:"Cobalamin C/D defect. Elevated Hcy with elevated MMA and low-normal Met. Most common neonatal-onset cobalamin defect. Retinopathy."},
  {id:"IVA",      name:"Isovaleric acidemia",                   category:"Organic Acidemia",    gene:"IVD",
   signature:[{panel:"AC",id:"C5",direction:"high",weight:3},{panel:"UOA",id:"IVG",direction:"high",weight:3},{panel:"UOA",id:"3OHIV",direction:"high",weight:2},{panel:"AC",id:"C5C3",direction:"high",weight:2}],
   notes:"IVD deficiency. C5 and isovalerylglycine primary markers. Sweaty feet odor. Acute ketoacidotic crises."},
  {id:"MCC",      name:"3-Methylcrotonyl-CoA carboxylase def.", category:"Organic Acidemia",    gene:"MCCC1, MCCC2",
   signature:[{panel:"AC",id:"C5OH",direction:"high",weight:3},{panel:"UOA",id:"MCG",direction:"high",weight:3},{panel:"UOA",id:"3OHIV",direction:"high",weight:2}],
   notes:"3-MCC deficiency. C5-OH and 3-methylcrotonylglycine primary. Often clinically benign. Distinguish from biotinidase deficiency."},
  {id:"HMGCL",    name:"HMG-CoA lyase deficiency",             category:"Organic Acidemia",    gene:"HMGCL",
   signature:[{panel:"UOA",id:"HMG",direction:"high",weight:3},{panel:"AC",id:"C6DC",direction:"high",weight:2},{panel:"MISC",id:"Glucose",direction:"low",weight:1},{panel:"MISC",id:"BHB",direction:"low",weight:1}],
   notes:"HMGCL deficiency. HMG in urine. Hypoketotic hypoglycemia. Impairs both ketogenesis and leucine catabolism."},
  {id:"BKT",      name:"Beta-ketothiolase deficiency",          category:"Organic Acidemia",    gene:"ACAT1",
   analyticalCeiling:0.78, // Oglesbee 2017: clinical sensitivity 77.5% — C5-OH nonspecific
   flags:[{type:"nonspecific",text:"ANALYTICAL UNCERTAINTY: C5-OH acylcarnitine (3-OH-isovalerylcarnitine) is isobaric with 3-OH-2-methylbutyrylcarnitine and 3-methylglutarylcarnitine — C5-OH elevation is shared with 3-MCC deficiency, MCD/biotinidase deficiency, and HMG-CoA lyase deficiency. Acylcarnitine alone cannot distinguish these. Real-world analytic sensitivity for BKT ~77.5% (Oglesbee 2017). The primary diagnostic markers are urinary tiglylglycine (TG) and 2-methylacetoacetic acid (2MAA) — these are pathognomonic for BKT when present together. Note that all markers may normalise between ketoacidotic crises; testing should ideally be performed during or shortly after an acute episode."}],
   signature:[{panel:"UOA",id:"TG",direction:"high",weight:3},{panel:"UOA",id:"2MAA",direction:"high",weight:3},{panel:"AC",id:"C5_1",direction:"high",weight:2},{panel:"AC",id:"C5OH",direction:"high",weight:2},{panel:"MISC",id:"BHB",direction:"high",weight:1},{panel:"MISC",id:"AcAc",direction:"high",weight:1}],
   notes:"ACAT1 deficiency. TG and 2-methylacetoacetic acid pathognomonic. Episodic ketoacidosis. May normalize between crises."},
  {id:"SCOT",     name:"SCOT deficiency (succinyl-CoA:3-oxoacid CoA transferase)", category:"Organic Acidemia", gene:"OXCT1",
   flags:[{type:"negativepanel",text:"NEGATIVE-PANEL DIAGNOSIS: SCOT deficiency is characterised by a NORMAL acylcarnitine profile and NORMAL urine organic acids. A high score here is only meaningful if both AC and UOA panels have been run and are normal. Persistent non-diabetic ketoacidosis with normal panels in an infant should prompt OXCT1 enzyme assay or molecular genetics. If AC and UOA panels have not been entered or are incomplete, this result cannot be adequately evaluated."}],
   negativeEvidence:[
     {panel:"UOA",id:"MMA",weight:2},   // organic acidemias (PA/MMA/IVA) will elevate these
     {panel:"UOA",id:"MCA",weight:2},
     {panel:"UOA",id:"EMA",weight:1},
     {panel:"UOA",id:"TG",weight:1},    // BKT
     {panel:"AC", id:"C3", weight:2},   // propionylcarnitine (PA/MMA)
     {panel:"AC", id:"C5", weight:1},   // isovalerylcarnitine (IVA)
     {panel:"AC", id:"C8", weight:1},   // octanoylcarnitine (MCAD)
   ],
   signature:[{panel:"MISC",id:"BHB",direction:"high",weight:3},{panel:"MISC",id:"AcAc",direction:"high",weight:3}],
   notes:"OXCT1 deficiency. Inability to utilise ketone bodies → persistent severe non-diabetic ketoacidosis from infancy. Acylcarnitine and UOA profiles are NORMAL — diagnosis rests on finding persistent unexplained ketosis. BHB and acetoacetate markedly elevated even in the fed state. Episodic ketoacidotic crises triggered by fasting or illness. Exclude diabetic ketoacidosis and other organic acidemias first. Confirm with OXCT1 enzyme assay (leukocytes/fibroblasts) or molecular genetics. Treatment: avoidance of fasting, carbohydrate-rich diet, emergency IV glucose during crises; prognosis good with management."},
  {id:"HMGCS2D",  name:"Mitochondrial HMG-CoA synthase 2 deficiency", category:"Organic Acidemia", gene:"HMGCS2",
   flags:[{type:"negativepanel",text:"NEGATIVE-PANEL DIAGNOSIS: HMGCS2 deficiency is distinguished from fatty acid oxidation disorders by a NORMAL acylcarnitine profile during hypoglycaemic episodes. A low BHB / low glucose signal is only diagnostically meaningful if the AC panel has been entered and is normal. If AC data are absent or incomplete, this result cannot be reliably distinguished from LCHAD, VLCAD, or other FAO disorders presenting with hypoketotic hypoglycaemia. Confirm diagnosis with HMGCS2 enzyme assay (liver) or molecular genetics."}],
   negativeEvidence:[
     {panel:"AC",id:"C14_1",weight:3},  // elevated in VLCAD — if normal, VLCAD less likely
     {panel:"AC",id:"C16OH", weight:3}, // elevated in LCHAD/TFP — if normal, LCHAD less likely
     {panel:"AC",id:"C8",    weight:2}, // elevated in MCAD — if normal, MCAD less likely
     {panel:"AC",id:"C14",   weight:1},
   ],
   signature:[{panel:"MISC",id:"BHB",direction:"low",weight:3},{panel:"MISC",id:"Glucose",direction:"low",weight:2},{panel:"MISC",id:"AcAc",direction:"low",weight:1}],
   notes:"HMGCS2 deficiency. Failure of mitochondrial ketogenesis → hypoketotic hypoglycaemia during fasting or febrile illness. Acylcarnitine profile is NORMAL (key distinction from FAO disorders). UOA: mild dicarboxylic aciduria during crises (non-specific). Blood BHB inappropriately low or absent during hypoglycaemic episodes. Presents with encephalopathy, hepatomegaly, elevated transaminases during metabolic stress. Confirm by HMGCS2 enzyme assay or molecular genetics. Treatment: avoidance of fasting; uncooked cornstarch or continuous feeds in young children; high-carbohydrate, low-fat diet; emergency IV glucose during illness. Prognosis generally good."},
  {id:"GA1",      name:"Glutaric aciduria type I (GA-I)",       category:"Organic Acidemia",    gene:"GCDH",
   flags:[{type:"lowexcreter",text:"LOW EXCRETER WARNING: ~25% of GA1 patients are 'low excreters' — urinary glutaric acid and 3-hydroxyglutaric acid may be near-normal or only mildly elevated even with confirmed GCDH deficiency. A low score here does NOT exclude GA1. If macrocephaly, frontotemporal atrophy on MRI, or clinical risk window (age 3–36 months) is present, pursue C5DC (acylcarnitines) and GCDH molecular analysis regardless of organic acid results. Gallagher et al. ACMG 2018."}],
   signature:[{panel:"AC",id:"C5DC",direction:"high",weight:3},{panel:"UOA",id:"GA",direction:"high",weight:3},{panel:"UOA",id:"3OHGA",direction:"high",weight:2},{panel:"UAG",id:"GG",direction:"high",weight:2},{panel:"AC",id:"C5DCC8",direction:"high",weight:2},{panel:"UOA",id:"OHGAtoGA",direction:"high",weight:2}],
   notes:"GCDH (glutaryl-CoA dehydrogenase) deficiency — defect of lysine, hydroxylysine, and tryptophan catabolism. Lysine and tryptophan are both catabolised through glutaryl-CoA; both substrates contribute to toxic dicarboxylic accumulation. Accumulation of glutaryl-CoA, glutaric acid (GA), 3-hydroxyglutaric acid (3-OH-GA), glutaconic acid, and glutarylcarnitine (C5DC). Clinical risk window: ages 3–36 months — bilateral striatal injury (putamen/caudate) during or after febrile illness → acute or insidious dystonia/movement disorder with high morbidity. After age 6, risk declines substantially. Macrocephaly in ~50% (may be present at birth or progressive). Important: LOW vs HIGH excreter variants — both carry equal neurological risk if untreated (low excreters may have near-normal urinary GA). MRI: frontotemporal atrophy + widened Sylvian fissures (characteristic, present even asymptomatically); striatal injury (caudate + putamen) in symptomatic patients. C5DC on acylcarnitines is the most sensitive NBS marker. Treatment: (1) low-lysine AND low-tryptophan diet + essential amino acid supplement without lysine/tryptophan; (2) carnitine supplementation (secondary carnitine depletion); (3) emergency protocol at every febrile illness — urgent high glucose/insulin infusion + extra carnitine to prevent striatal injury. Early NBS diagnosis and adherence to diet and emergency protocol prevents neurological injury in the majority of children. Diet compliance is the major risk factor for insidious-onset dystonia. Incidence ~1:112,700 in Germany."},
  {id:"PDE",      name:"Pyridoxine-dependent epilepsy (antiquitin def.)", category:"Aminoacidopathy", gene:"ALDH7A1",
   signature:[{panel:"PAA",id:"Pip",direction:"high",weight:2},{panel:"PAA",id:"AAAdp",direction:"high",weight:1},{panel:"PAA",id:"Lys",direction:"high",weight:1}],
   notes:"Antiquitin (α-aminoadipic semialdehyde dehydrogenase, ALDH7A1) deficiency — the most common form of pyridoxine-dependent epilepsy. Step 4 of the lysine catabolism saccharopine pathway: antiquitin oxidises α-aminoadipic semialdehyde (AASA) to α-aminoadipic acid. Block at this step causes accumulation of AASA and its spontaneous cyclisation product Δ1-piperideine-6-carboxylate (P6C). P6C forms an irreversible complex with pyridoxal phosphate (PLP), the active B6 vitamer — PLP depletion causes multiple PLP-dependent enzyme failures, principally glutamate decarboxylase → GABA deficiency → seizures. Plasma lysine may be mildly elevated (reduced catabolism) but is NOT a reliable or consistently elevated marker. Pipecolic acid (Pip) elevated in plasma (lysine also catabolised via the peroxisomal pipecolic acid pathway). α-Aminoadipic acid (AAAdp) may be elevated. Primary diagnostic biomarker is URINARY AASA — remains elevated even after pyridoxine treatment is initiated (unlike seizures which respond). Clinical: neonatal seizures refractory to conventional antiepileptic drugs, dramatically responsive to pyridoxine. Seizures controlled in ~90% on pyridoxine monotherapy — but ≥75% have intellectual disability and developmental (speech) delay despite prompt treatment. Extended 'triple therapy' improves outcome: (1) pyridoxine (seizure control); (2) lysine restriction (reduces AASA production); (3) arginine supplementation (arginine competes with lysine at the y+LAT transport system, reducing intestinal lysine absorption and lysine entry into the brain across the blood-brain barrier). Early treatment is critical. Gene: ALDH7A1; autosomal recessive. Wide phenotypic spectrum from neonatal to post-12-month-onset; autistic features reported."},
  {id:"GA2",      name:"Glutaric aciduria type II / MADD",      category:"Organic Acidemia",    gene:"ETFA, ETFB, ETFDH",
   signature:[{panel:"AC",id:"C4",direction:"high",weight:2},{panel:"AC",id:"C5",direction:"high",weight:2},{panel:"AC",id:"C6",direction:"high",weight:2},{panel:"AC",id:"C8",direction:"high",weight:2},{panel:"AC",id:"C10",direction:"high",weight:2},{panel:"AC",id:"C12",direction:"high",weight:2},{panel:"UOA",id:"EMA",direction:"high",weight:2},{panel:"UOA",id:"Adipic",direction:"high",weight:2},{panel:"UOA",id:"Suberic",direction:"high",weight:2},{panel:"MISC",id:"Triglyc",direction:"high",weight:1}],
   notes:"ETF/ETFDH deficiency. Multiple acylcarnitine elevations (short-to-medium chain). Dicarboxylic aciduria. Late-onset form riboflavin-responsive."},
  {id:"MCD",      name:"Multiple carboxylase deficiency",       category:"Organic Acidemia",    gene:"BTD / HLCS",
   signature:[{panel:"AC",id:"C5OH",direction:"high",weight:2},{panel:"UOA",id:"MCG",direction:"high",weight:2},{panel:"UOA",id:"3OHIV",direction:"high",weight:1},{panel:"UOA",id:"MCA",direction:"high",weight:1},{panel:"UOA",id:"Lactic",direction:"high",weight:1},{panel:"UOA",id:"LacPyr",direction:"high",weight:1}],
   notes:"Biotin-responsive disorder. Combined 3-MCC, PCC, pyruvate carboxylase deficiency. Alopecia, dermatitis, ataxia. Highly responsive to biotin."},
  {id:"SSADH",    name:"Succinic semialdehyde dehydrogenase def.",category:"Organic Acidemia",  gene:"ALDH5A1",
   signature:[{panel:"UOA",id:"4OHbut",direction:"high",weight:3}],
   notes:"ALDH5A1 deficiency. GHB accumulates. Intellectual disability, ataxia, seizures, behavioral symptoms."},
  {id:"L2HGA",    name:"L-2-Hydroxyglutaric aciduria",          category:"Organic Acidemia",    gene:"L2HGDH",
   signature:[{panel:"UOA",id:"2OHglut",direction:"high",weight:3}],
   notes:"L2HGDH deficiency. Progressive cerebellar ataxia, subcortical leukodystrophy (characteristic MRI: subcortical white matter + dentate nucleus + putamen signal abnormality), macrocephaly, intellectual disability, seizures. Elevated L-2-hydroxyglutaric acid in urine, plasma, and CSF. STEREOSPECIFIC analysis is essential to distinguish L-form (L2HGDH deficiency) from D-form (D2HGDH/IDH2 deficiency) — the two disorders have entirely different clinical phenotypes. L-2-HGA is NOT associated with enchondromatosis (that is D-2-HG from somatic IDH1/IDH2 mutations). Brain tumours (gliomas, medulloblastomas) are an emerging risk in L-2-HGA patients — surveillance recommended. No proven treatment; riboflavin + FAD trialled (L2HGDH is FAD-dependent)."},
  {id:"FUMAR",    name:"Fumaric aciduria (fumarase def.)",       category:"Organic Acidemia",    gene:"FH",
   signature:[{panel:"UOA",id:"Fumaric",direction:"high",weight:3},{panel:"UOA",id:"Succinic",direction:"high",weight:1}],
   notes:"FH deficiency. Profound fumaric aciduria. Severe encephalopathy, brain malformations, polycythemia."},
  {id:"PCD",      name:"Primary carnitine deficiency (OCTN2)",  category:"Fatty Acid Oxidation", gene:"SLC22A5",
   analyticalCeiling:0.76, // Oglesbee 2017: clinical sensitivity 75.7%
   flags:[{type:"analytical",text:"ANALYTICAL UNCERTAINTY: Real-world clinical sensitivity for PCD is ~75.7% by acylcarnitines alone (Oglesbee 2017). Low C0 (free carnitine) on the AC panel is insufficient for diagnosis — definitive assessment requires BOTH plasma free carnitine AND total carnitine with calculation of the acylcarnitine fraction. Secondary carnitine depletion (from organic acidemias, FAO disorders, valproate, renal losses, or dietary deficiency) is a far more common cause of low C0 and must be excluded. Confirm primary deficiency by absence of an underlying disorder, response to carnitine supplementation, and/or SLC22A5 molecular testing."}],
   signature:[{panel:"CAR",id:"CarFree",direction:"low",weight:3},{panel:"CAR",id:"CarTotal",direction:"low",weight:3},{panel:"CAR",id:"CarRatio",direction:"low",weight:1},{panel:"AC",id:"C0",direction:"low",weight:2}],
   notes:"OCTN2 (SLC22A5) deficiency — carnitine uptake transporter defect. Free and total carnitine profoundly low (<5 µmol/L in symptomatic cases). Acylcarnitine profile normal or shows low absolute values across all species. Clinical: cardiomyopathy (infantile), hypoglycaemia, skeletal muscle weakness. Maternal PCD may be identified incidentally via infant NBS showing low C0. Responds dramatically to high-dose oral L-carnitine supplementation. Distinguish from secondary carnitine depletion (organic acidemias, FAO disorders, dietary, renal losses, valproate)."},
  {id:"MCAD",     name:"MCAD deficiency",                       category:"Fatty Acid Oxidation", gene:"ACADM",
   signature:[{panel:"AC",id:"C8",direction:"high",weight:3},{panel:"AC",id:"C8C10",direction:"high",weight:2},{panel:"AC",id:"C6",direction:"high",weight:2},{panel:"AC",id:"C10",direction:"high",weight:2},{panel:"UAG",id:"HG",direction:"high",weight:2},{panel:"UAG",id:"SG",direction:"high",weight:2},{panel:"UAG",id:"PPG",direction:"high",weight:2},{panel:"UOA",id:"Adipic",direction:"high",weight:1},{panel:"UOA",id:"Suberic",direction:"high",weight:1},{panel:"MISC",id:"Glucose",direction:"low",weight:1}],
   notes:"ACADM deficiency. C8 primary marker. Most common FAO disorder. Hypoketotic hypoglycemia during fasting/illness. Sudden death risk."},
  {id:"VLCAD",    name:"VLCAD deficiency",                      category:"Fatty Acid Oxidation", gene:"ACADVL",
   signature:[{panel:"AC",id:"C14_1",direction:"high",weight:3},{panel:"AC",id:"C14_1C16",direction:"high",weight:2},{panel:"AC",id:"C14",direction:"high",weight:2},{panel:"AC",id:"C12",direction:"high",weight:1},{panel:"AC",id:"C14_1C14",direction:"high",weight:2},{panel:"AC",id:"C14_1C12",direction:"high",weight:1},{panel:"AC",id:"C16C18_1C2",direction:"high",weight:1},{panel:"MISC",id:"CK",direction:"high",weight:1},{panel:"MISC",id:"Glucose",direction:"low",weight:1}],
   notes:"ACADVL deficiency. C14:1 primary. Cardiomyopathy (neonatal), hypoketotic hypoglycemia (infant), rhabdomyolysis (older)."},
  {id:"LCHAD",    name:"LCHAD / TFP deficiency",                category:"Fatty Acid Oxidation", gene:"HADHA, HADHB",
   analyticalCeiling:0.65, // Oglesbee 2017: 64.5% analytic sensitivity — lowest of any screened FAO disorder
   flags:[{type:"analytical",text:"ANALYTICAL SENSITIVITY WARNING: LCHAD/TFP has the lowest real-world acylcarnitine analytic sensitivity of any screened FAO disorder (~64.5%, Oglesbee 2017). C16-OH and C18:1-OH elevations can be subtle — a near-normal result does NOT exclude LCHAD in a clinically suspicious case (neuropathy, pigmentary retinopathy, rhabdomyolysis, or maternal AFLP/HELLP history). C16-OH quantification shows significant interlaboratory variability; result interpretation must account for lab-specific reference ranges and analytical platform. If clinical suspicion is high, pursue HADHA/HADHB molecular analysis and/or enzyme assay regardless of acylcarnitine result."}],
   signature:[{panel:"AC",id:"C16OH",direction:"high",weight:3},{panel:"AC",id:"C18_1OH",direction:"high",weight:3},{panel:"AC",id:"C18OH",direction:"high",weight:2},{panel:"AC",id:"C16OHC16",direction:"high",weight:2},{panel:"AC",id:"C16OHC18_1OH",direction:"high",weight:1},{panel:"MISC",id:"CK",direction:"high",weight:1},{panel:"MISC",id:"Glucose",direction:"low",weight:1}],
   notes:"HADHA/HADHB deficiency. 3-OH long-chain acylcarnitines hallmark. Neuropathy, retinopathy, cardiomyopathy. Maternal AFLP/HELLP association."},
  {id:"SCAD",     name:"SCAD deficiency",                       category:"Fatty Acid Oxidation", gene:"ACADS",
   signature:[{panel:"AC",id:"C4",direction:"high",weight:3},{panel:"UOA",id:"EMA",direction:"high",weight:2}],
   notes:"ACADS deficiency. C4 and EMA elevated. Clinical significance debated — many NBS-identified cases appear clinically benign."},
  {id:"CPT1",     name:"CPT-I deficiency",                      category:"Fatty Acid Oxidation", gene:"CPT1A",
   signature:[{panel:"AC",id:"C0",direction:"high",weight:3},{panel:"AC",id:"C0LC",direction:"high",weight:3},{panel:"AC",id:"C16",direction:"low",weight:1},{panel:"AC",id:"C18",direction:"low",weight:1},{panel:"MISC",id:"Glucose",direction:"low",weight:1}],
   notes:"CPT1A deficiency. High C0 with low long-chain acylcarnitines — elevated C0/(C16+C18) ratio (>100). Arctic P479L variant has uncertain pathogenicity."},
  {id:"CPT2",     name:"CPT-II / CACT deficiency",              category:"Fatty Acid Oxidation", gene:"CPT2 / SLC25A20",
   signature:[{panel:"AC",id:"C16",direction:"high",weight:3},{panel:"AC",id:"C18",direction:"high",weight:2},{panel:"AC",id:"C18_1",direction:"high",weight:2},{panel:"AC",id:"C16C18_1C2",direction:"high",weight:2},{panel:"AC",id:"C0",direction:"low",weight:1},{panel:"MISC",id:"CK",direction:"high",weight:1},{panel:"MISC",id:"Glucose",direction:"low",weight:1}],
   notes:"CPT2 or CACT defect. Elevated long-chain acylcarnitines with secondary free carnitine depletion. Neonatal form vs. adult myopathic CPT2."},
  {id:"SCHAD",    name:"SCHAD deficiency (HADH / hyperinsulinism)", category:"Fatty Acid Oxidation", gene:"HADH",
   signature:[{panel:"AC",id:"C4OH",direction:"high",weight:3},{panel:"AC",id:"C4OHC4",direction:"high",weight:2},{panel:"MISC",id:"Glucose",direction:"low",weight:1}],
   notes:"HADH (short-chain 3-hydroxyacyl-CoA dehydrogenase) deficiency. C4-OH (3-hydroxybutyrylcarnitine) elevated. Uniquely associated with hyperinsulinism — the only FAO disorder causing hypoglycemia via hyperinsulinism rather than hypoketosis alone. Protein-sensitive hyperinsulinism (leucine-sensitive). Distinguish from other causes of congenital hyperinsulinism. Acylcarnitine profile may be subtle — C4-OH elevation is the key marker but can be borderline."},
  {id:"IBD",      name:"Isobutyryl-CoA dehydrogenase deficiency",  category:"Fatty Acid Oxidation", gene:"ACAD8",
   analyticalCeiling:0.75, // Oglesbee 2017: OA clinical sensitivity 75.0%
   signature:[{panel:"AC",id:"C4",direction:"high",weight:2},{panel:"UAG",id:"IBG",direction:"high",weight:3}],
   notes:"ACAD8 deficiency. C4 acylcarnitine elevated (shared with SCAD — IBG on urine acylglycines is the distinguishing marker). Isobutyrylglycine is the specific urinary marker. Clinical significance debated — many NBS-identified patients appear clinically benign. Distinguish from SCAD (SCAD: EMA elevated; IBD: IBG elevated without EMA)."},
  {id:"2MBD",     name:"2-Methylbutyryl-CoA dehydrogenase def. (2-MBD)", category:"Fatty Acid Oxidation", gene:"ACADSB",
   signature:[{panel:"AC",id:"C5",direction:"high",weight:2},{panel:"UAG",id:"2MBG",direction:"high",weight:3}],
   notes:"ACADSB deficiency. C5 acylcarnitine elevated (shared with IVA — 2-MBG on urine acylglycines is the distinguishing marker). 2-Methylbutyrylglycine is pathognomonic. Distinguish from IVA (IVA: C5 elevated + isovalerylglycine + sweaty-feet odour; 2-MBD: C5 elevated + 2-methylbutyrylglycine, no odour). Clinical significance uncertain — likely mostly benign."},

  // ─── METHIONINE / SULFUR ────────────────────────────────────
  {id:"MTHFR",    name:"MTHFR deficiency (homocystinuria, remethylation)", category:"Aminoacidopathy", gene:"MTHFR",
   signature:[{panel:"PAA",id:"Hcy",direction:"high",weight:3},{panel:"PAA",id:"Met",direction:"low",weight:2},{panel:"PAA",id:"MetHcy",direction:"low",weight:3},{panel:"MISC",id:"tHcy",direction:"high",weight:2}],
   notes:"Methylenetetrahydrofolate reductase (MTHFR) deficiency — severe form. MTHFR reduces 5,10-methylene-THF to 5-methyl-THF, which donates its methyl group (via B12) to homocysteine → methionine. MTHFR deficiency → impaired remethylation → homocysteine accumulates, methionine FALLS (or is normal-low). CRITICAL DISTINGUISHING FEATURE from CBS-homocystinuria: in CBS, methionine is HIGH; in MTHFR deficiency, methionine is LOW or normal. This difference is diagnostically key. Hcy typically 50–200 µmol/L (total Hcy). No MMA elevation (distinguishes from cblC/D). Heterozygous MTHFR polymorphisms (677C>T, 1298A>C) are extremely common (~10% homozygosity for 677TT) and generally benign — mild Hcy elevation only, clinically insignificant with adequate folate/B12 intake. Severe MTHFR deficiency (rare, biallelic pathogenic mutations): neurological features (intellectual disability, psychiatric disease — schizophrenia-like, seizures, ataxia, spasticity), thromboembolism, peripheral neuropathy. Neonatal: respiratory distress, apnoea, severe encephalopathy in the most severe forms. No lens dislocation (unlike CBS). Folate absorption normal. Treatment: betaine (most effective for biochemical control — provides alternative remethylation via betaine-homocysteine methyltransferase), B12, folate, methionine supplementation (essential amino acid). Target Hcy <50 µmol/L (ideally <30)."},

  {id:"CBLE",     name:"Homocystinuria — cblE / cblG (MTR/MTRR def.)",  category:"Aminoacidopathy", gene:"MTRR, MTR",
   signature:[{panel:"PAA",id:"Hcy",direction:"high",weight:3},{panel:"PAA",id:"Met",direction:"low",weight:2},{panel:"MISC",id:"tHcy",direction:"high",weight:2}],
   notes:"Cobalamin E (cblE, MTRR deficiency) and cobalamin G (cblG, MTR deficiency) are remethylation defects. MTR (methionine synthase, gene MTR) catalyses Hcy + 5-methyl-THF → Met, using methylcobalamin as cofactor. MTRR (methionine synthase reductase, gene MTRR) reactivates inactive MTR by reductive methylation of its cobalamin cofactor. Both defects → impaired remethylation → Hcy↑ + Met↓. KEY DISTINCTION FROM cblC/D: NO methylmalonic acid elevation (MMA normal) — because methylmalonyl-CoA mutase function (adenosylcobalamin pathway) is intact. This is the major diagnostic differentiator from cblC/D, which has BOTH MMA and Hcy elevated. Biochemistry mirrors severe MTHFR deficiency. Megaloblastic anaemia (haematological presentation often precedes neurological features — check for macrocytosis). Neurological: developmental regression, intellectual disability, psychiatric features, seizures. Treatment: hydroxocobalamin (high dose IM/SC), betaine, folate. Dramatic response to B12 in many patients."},

  {id:"MAT1A",    name:"Methionine adenosyltransferase I/III def. (MAT1A)", category:"Aminoacidopathy", gene:"MAT1A",
   signature:[{panel:"PAA",id:"Met",direction:"high",weight:3}],
   notes:"MAT1A encodes the liver-specific MATI and MATIII isoenzymes of methionine adenosyltransferase, which catalyse Met + ATP → SAM (S-adenosylmethionine). MAT1A deficiency → isolated, marked hypermethioninemia (plasma Met typically 100–1000 µmol/L) with NORMAL Hcy — distinguishes from CBS (Hcy↑ + Met↑) and MTHFR (Hcy↑ + Met↓). The liver-specific nature means peripheral metabolism is unaffected. IMPORTANT CLINICAL PRINCIPLE: the vast majority of MAT1A-deficient individuals are asymptomatic and require no treatment. However, a small proportion develop demyelinating leukoencephalopathy (MRI: symmetric white matter changes, often in posterior fossa), optic neuropathy, and neuropsychiatric symptoms — possibly due to SAM or SAH imbalance affecting transmethylation reactions in brain. Characteristic breath odour: boiled cabbage or sulfurous (volatile methylthioether compounds). Diagnosis: plasma Met elevated, Hcy normal/low, SAM/SAH ratio in plasma or RBC. Treatment: SAM supplementation for the rare neurological form. Avoid excessive methionine restriction (may cause Met deficiency in asymptomatic patients). Autosomal recessive (homozygous or compound heterozygous MAT1A mutations)."},

  {id:"GNMT",     name:"Glycine N-methyltransferase deficiency",          category:"Aminoacidopathy", gene:"GNMT",
   signature:[{panel:"PAA",id:"Met",direction:"high",weight:2},{panel:"PAA",id:"Sarc",direction:"high",weight:1}],
   notes:"GNMT (glycine N-methyltransferase) transfers a methyl group from SAM to glycine, producing sarcosine (N-methylglycine) and SAH. This is the major route for disposal of excess SAM — GNMT acts as a SAM 'buffer'. GNMT deficiency → SAM accumulates → feedback elevation of methionine (SAM inhibits remethylation of Hcy → Met accumulates secondary to SAM excess). Plasma Met typically 400–1000 µmol/L; Hcy mildly elevated or normal. Key distinguishing feature from MAT1A: GNMT deficiency causes SAM accumulation (SAM:SAH ratio elevated); in MAT1A deficiency, SAM is reduced. Plasma sarcosine may be mildly elevated (paradoxically, some GNMT substrate backup produces sarcosine via alternative routes). Clinical: hepatomegaly, elevated transaminases, progressive liver disease/cirrhosis — liver is the primary affected organ. Very rare (< 20 cases reported worldwide). Treatment: methionine restriction, SAH supplementation (theoretical). Monitor liver function."},

  // ─── PROLINE ────────────────────────────────────────────────
  {id:"HYPERPROII",name:"Hyperprolinemia type II (ALDH4A1 / P5CDH def.)", category:"Aminoacidopathy", gene:"ALDH4A1",
   signature:[{panel:"PAA",id:"Pro",direction:"high",weight:3},{panel:"PAA",id:"GABA",direction:"high",weight:1}],
   notes:"Δ1-Pyrroline-5-carboxylate dehydrogenase (P5CDH, ALDH4A1) deficiency — second step of proline degradation. P5C (Δ1-pyrroline-5-carboxylate) accumulates; plasma proline markedly elevated (typically >1500–3000 µmol/L, considerably higher than type I which rarely exceeds 1000 µmol/L). P5C is pathognomonic in urine (requires specific assay). CRITICAL MECHANISM: P5C inhibits GABA transaminase → secondary GABA elevation → GABA-mediated CNS excitability paradoxically reduced in some areas, altered seizure threshold. Unlike the purely benign type I, type II is associated with significant clinical phenotype: epilepsy (often in infancy, may be severe and pharmaco-resistant), intellectual disability (variable severity), psychiatric/behavioural manifestations. Renal iminoglycinuria (overflow of proline, hydroxyproline, glycine in urine when plasma Pro very high). Autosomal recessive (ALDH4A1). No established curative treatment — AEDs for seizures, dietary proline restriction has limited effect. Distinguish type I (PRODH deficiency, milder proline elevation, different gene)."},

  {id:"PROLIDASE", name:"Prolidase deficiency",                            category:"Aminoacidopathy", gene:"PEPD",
   signature:[{panel:"PAA",id:"Pro",direction:"high",weight:2},{panel:"PAA",id:"HyPro",direction:"high",weight:3}],
   notes:"PEPD (prolidase / imidodipeptidase) deficiency. Prolidase cleaves the peptide bond C-terminal to proline and hydroxyproline in imidodipeptides (dipeptides ending in -Pro or -HyPro), releasing free proline and hydroxyproline for recycling. Deficiency → massive imidodipeptiduria (glycylproline, alanylproline, etc. — requires specific urine amino acid analysis or HPLC) + elevated free proline and hydroxyproline in plasma. CHARACTERISTIC CLINICAL TRIAD: (1) Progressive skin ulceration — severe, chronic, predominantly affecting lower limbs and face; recalcitrant to standard wound care, often the dominant clinical problem; (2) Intellectual disability (mild-moderate in most); (3) Facial dysmorphism — prominent forehead, proptosis/hypertelorism, saddle nose, ptosis, low-set ears. Additional features: recurrent infections (impaired wound healing + immune dysfunction — prolidase is important for fibronectin recycling which affects immune cell adhesion), splenomegaly, pulmonary involvement. SLE-like picture in some patients (antinuclear antibodies — collagen recycling defect may expose cryptic nuclear antigens). Diagnosis: imidodipeptiduria on urine amino acid analysis + PEPD enzyme activity in erythrocytes + PEPD gene. Treatment: proline supplementation (oral, moderate evidence for improved wound healing), ascorbic acid (collagen synthesis cofactor), vitamin E, MnCl2 (manganese activates prolidase), topical proline + glycine for ulcers. Prognosis: dominated by skin disease; lifespan may be reduced."},

  {id:"HYDROXYPROLINEMIA", name:"Hydroxyprolinemia (PRODH2 def.)",        category:"Aminoacidopathy", gene:"PRODH2",
   signature:[{panel:"PAA",id:"HyPro",direction:"high",weight:3}],
   notes:"Hydroxyproline oxidase (PRODH2) deficiency — isolated hydroxyprolinemia. Hydroxyproline, derived from collagen catabolism (collagen is ~14% hydroxylated proline residues), accumulates in plasma and urine. Proline is NORMAL (unlike prolidase deficiency where both Pro and HyPro are elevated). CLINICAL SIGNIFICANCE: largely benign. Early case reports from the 1960s–70s associated it with intellectual disability and seizures, but this was ascertainment bias from urine screening of institutionalised populations. Subsequent family and population studies demonstrate that most individuals with isolated hydroxyprolinemia are completely asymptomatic and have normal intelligence. Renal tubular reabsorption may be exceeded at very high HyPro levels causing iminoglycinuria. No treatment is required. The condition is a biochemical curiosity rather than a clinical disease. Distinguish from prolidase deficiency (Pro + HyPro elevated) and from conditions with secondary HyPro elevation (severe liver disease, metabolic bone disease — both increase collagen turnover)."},

  // ─── HISTIDINE ──────────────────────────────────────────────
  {id:"HISTID",   name:"Histidinemia",                                    category:"Aminoacidopathy", gene:"HAL",
   signature:[{panel:"PAA",id:"His",direction:"high",weight:3}],
   notes:"Histidase (HAL) deficiency. Histidase catalyses deamination of L-histidine → urocanic acid. Histidinemia — plasma His typically >150 µmol/L (normal 50–130). Urocanic acid absent from urine and skin (histidase is also expressed in epidermis — skin urocanic acid can be used as a non-invasive enzyme marker). This was one of the first conditions detected by NBS in the 1960s–70s, initially creating widespread alarm about associations with intellectual disability and speech impairment. Extensive population studies (particularly the New England NBS program) subsequently showed that untreated histidinemia has NO significant impact on intellectual development or clinical outcomes — the early reports were entirely due to ascertainment bias. Histidinemia is now considered a benign biochemical condition requiring no treatment or dietary restriction. It serves as an important historical lesson about NBS: biochemical detection of a metabolic variant does not automatically imply clinical disease — long-term natural history data are essential before implementing treatment. Autosomal recessive (HAL mutations). No treatment required."},

  {id:"UROCA",    name:"Urocanic aciduria (urocanase / UROC1 def.)",      category:"Aminoacidopathy", gene:"UROC1",
   signature:[{panel:"PAA",id:"His",direction:"high",weight:2}],
   notes:"Urocanase (UROC1) deficiency — the second step of histidine catabolism. Histidase converts His → trans-urocanic acid; urocanase converts trans-urocanic acid → 4-imidazolone-5-propionic acid. Urocanase deficiency → urocanic acid accumulates in urine and plasma; histidine is secondarily mildly elevated (backup of the histidase reaction). Urocanic acid is not present on standard UOA panels (requires specialised amino acid or organic acid analysis) — the plasma His elevation is the main detectable signal. IMPORTANT CONTEXT: very rare (fewer than 50 reported cases). Initially associated with intellectual disability, but again, ascertainment bias is likely — several subsequent cases were clinically asymptomatic. The clinical significance of UROC1 deficiency remains uncertain. Trans-urocanic acid in skin is a photoimmunological modulator (absorbs UVB, triggers immune suppression) — its absence due to skin urocanase deficiency might have subtle immunological effects, but this is not clinically documented. No established treatment."},

  // ─── LYSINE / TRYPTOPHAN ────────────────────────────────────
  {id:"HAWKINS",  name:"Hawkinsinuria",                                   category:"Aminoacidopathy", gene:"HPD (dominant)",
   signature:[{panel:"PAA",id:"Tyr",direction:"high",weight:2},{panel:"UOA",id:"4OHpp",direction:"high",weight:1}],
   notes:"Hawkinsinuria — partial 4-hydroxyphenylpyruvate dioxygenase (HPD) deficiency, autosomal dominant (heterozygous dominant-negative HPD mutation). HPD normally converts 4-hydroxyphenylpyruvate (4-OHpp) → homogentisic acid in a complex multistep reaction involving an epoxide intermediate. In hawkinsinuria, the enzyme partially stalls at the epoxide, which spontaneously reacts with glutathione and cysteine to form the unusual cyclic compound hawkinsin (2-cys(S-L-cysteinyl)-1,4-dihydroxycyclohex-5-en-1-ylacetic acid — excreted in urine). PATHOGNOMONIC SIGN: characteristic chlorine or swimming-pool odour of sweat and urine. CLINICAL COURSE: presents in infancy (particularly breastfed infants — breast milk has low protein, insufficient to upregulate HPD). Symptoms: metabolic acidosis, failure to thrive, hypoglycaemia. Tyrosine mildly elevated; 4-OH-phenylpyruvic acid elevated (same as TYR3 but less marked). SPONTANEOUS RESOLUTION: condition improves and usually resolves entirely once the child transitions to solid foods with higher protein content — protein load upregulates HPD expression, overcoming the dominant-negative effect. No treatment required in most after infancy. High-protein diet during the symptomatic infant period. Distinguishing features: dominant inheritance (one parent affected), characteristic odour, self-limited course, no succinylacetone (distinguishes from TYR1)."},

  {id:"HYPERLYS", name:"Hyperlysinemia (AASS / saccharopinuria)",         category:"Aminoacidopathy", gene:"AASS",
   signature:[{panel:"PAA",id:"Lys",direction:"high",weight:3},{panel:"PAA",id:"AAAdp",direction:"high",weight:1}],
   notes:"AASS (aminoadipic semialdehyde synthase) deficiency — bifunctional enzyme containing lysine-2-oxoglutarate reductase (LOR) and saccharopine dehydrogenase (SDH) activities. The initial steps of lysine catabolism via the saccharopine pathway (predominant in brain). Two types: type I (LOR block) → hyperlysinemia alone; type II (SDH block / saccharopinuria) → saccharopine accumulates in addition to Lys. Plasma lysine typically 400–1500 µmol/L (normal 100–250). Alpha-aminoadipic acid may be mildly elevated. CLINICAL SIGNIFICANCE: considered largely benign — the early association with intellectual disability and behavioural problems was not confirmed in later unbiased population studies. Most individuals with hyperlysinemia are developmentally normal. Lysine itself is not neurotoxic at these concentrations. No treatment required. Distinguish from secondary hyperlysinemia (seen in hyperammonemia from UCDs — Lys elevated due to inhibition of lysosomal transport by ammonia, but Lys is not the primary abnormality). Note: saccharopine is not measurable on standard amino acid panels — specific assay required."},

  {id:"PIPOX",    name:"Pipecolic acidemia (pipecolate oxidase def.)",    category:"Aminoacidopathy", gene:"PIPOX",
   signature:[{panel:"PAA",id:"Pip",direction:"high",weight:3}],
   notes:"Pipecolate oxidase (PIPOX) deficiency — isolated pipecolic acidemia. Pipecolic acid (L-pipecolinic acid) is an unusual ring-form metabolite in the lysine degradation pathway (L-saccharopine pathway via L-pipecolate). PIPOX is a peroxisomal enzyme. Plasma Pip typically >5 µmol/L (normal <3) in the isolated deficiency. CRITICAL DIFFERENTIAL: Pip elevation is NOT specific for PIPOX deficiency — it is a prominent marker of peroxisomal disorders, including Zellweger spectrum disorders (ZSD), neonatal adrenoleukodystrophy, and X-linked adrenoleukodystrophy. Before diagnosing isolated PIPOX deficiency, peroxisomal biogenesis disorders must be excluded (VLCFA, plasmalogens, pristanic acid, bile acid intermediates — all normal in isolated PIPOX deficiency). True PIPOX deficiency is very rare. Clinical features in reported cases: intellectual disability, neurological abnormalities, hepatomegaly in some. Urine Pip also elevated. In the context of NBS or incidental finding, Pip must always trigger peroxisomal workup first."},

  {id:"DHTKD1",   name:"2-Aminoadipic / 2-oxoadipic aciduria",           category:"Aminoacidopathy", gene:"DHTKD1",
   signature:[{panel:"PAA",id:"AAAdp",direction:"high",weight:3}],
   notes:"DHTKD1 (dehydrogenase E1 and transketolase domain-containing 1 — E1 component of the 2-oxoadipate dehydrogenase complex) deficiency. The 2-oxoadipate dehydrogenase complex is a shared step in the catabolism of lysine, tryptophan, and hydroxylysine. Deficiency → 2-aminoadipic acid accumulates in plasma (α-aminoadipic acid, AAAdp); 2-oxoadipic acid accumulates in urine (requires specialized organic acid analysis). CLINICAL SIGNIFICANCE: heterogeneous and debated. Initially thought benign (benign variant of α-ketoadipic aciduria), but later detailed phenotyping identified a proportion of patients with intellectual disability, behavioural problems, mild hypotonia, and Charcot-Marie-Tooth-like peripheral neuropathy. The peripheral neuropathy component is of current interest as DHTKD1 variants have been found in CMT-like neuropathy cohorts (rare). No established treatment. Plasma AAAdp elevation serves as the detectable PAA marker; 2-oxoadipic acid on urine OA panel would confirm but is not standard."},

  // ─── GLYCINE & SERINE ────────────────────────────────────────
  {id:"PHGDH",    name:"Serine deficiency (PHGDH / Neu-Laxova spectrum)", category:"Aminoacidopathy", gene:"PHGDH",
   signature:[{panel:"PAA",id:"Ser",direction:"low",weight:3},{panel:"PAA",id:"Gly",direction:"low",weight:1}],
   notes:"PHGDH (3-phosphoglycerate dehydrogenase) deficiency — the first committed step of de novo L-serine biosynthesis from 3-phosphoglycerate. The serine biosynthesis pathway (PHGDH → PSAT1 → PSPH) is essential in the brain because serine crosses the blood-brain barrier poorly and neural cells depend on de novo synthesis. PHGDH deficiency causes the most severe serine deficiency phenotype (same pathway: PSAT1 and PSPH deficiencies present similarly). Plasma serine strikingly low, often <30 µmol/L (normal 80–200 µmol/L). CAVEAT: serine levels in plasma can normalise after meals or in non-fasted states — fasting sample or CSF serine (always low, more reliable) is required for diagnosis. Glycine follows serine because serine is the precursor of glycine (serine hydroxymethyltransferase, SHMT). PHENOTYPE SPECTRUM: severe — Neu-Laxova syndrome (prenatal lethal: ichthyosis, microcephaly, limb abnormalities, stillbirth or early death); classical infantile — severe intellectual disability, intractable seizures (infantile spasms → Lennox-Gastaut), acquired microcephaly, hypertonia; milder — intellectual disability without severe epilepsy. Serine is also required for phospholipid synthesis (phosphatidylserine), sphingolipid synthesis, and one-carbon metabolism. TREATMENT (one of the most rewarding in IMD): L-serine supplementation 500–600 mg/kg/day (high dose) + glycine 200–300 mg/kg/day. Seizure control often dramatically improves within weeks of starting treatment. Earlier treatment = better developmental outcome. CSF amino acids (serine, glycine) should be measured in ALL infants with unexplained infantile spasms or Lennox-Gastaut syndrome."},

  {id:"SARC",     name:"Sarcosinemia",                                    category:"Aminoacidopathy", gene:"SARDH",
   signature:[{panel:"PAA",id:"Sarc",direction:"high",weight:3}],
   notes:"Sarcosine dehydrogenase (SARDH) deficiency. Sarcosine (N-methylglycine) is an intermediate in choline and glycine metabolism — SARDH demethylates sarcosine → glycine using folate as methyl acceptor, in mitochondria. CLINICAL SIGNIFICANCE: benign biochemical variant. The original association of sarcosinemia with intellectual disability and developmental delay has been refuted by population-based NBS follow-up — most individuals with sarcosine elevation are completely normal. Sarcosine elevation may also be seen in secondary contexts: folate deficiency (folate is a required cofactor for SARDH), GNMT deficiency (sarcosine produced as a by-product), renal failure. No treatment required. Plasma Sarc typically >5 µmol/L (normal <5); urine sarcosine also elevated. Note: sarcosine has been studied as a biomarker for prostate cancer aggressiveness — this is a different, unrelated finding in non-genetic contexts."},

  {id:"ASNSD",    name:"Asparagine synthetase deficiency",               category:"Aminoacidopathy", gene:"ASNS",
   signature:[{panel:"PAA",id:"Asn",direction:"low",weight:3},{panel:"PAA",id:"Gln",direction:"low",weight:1}],
   notes:"ASNS (asparagine synthetase) deficiency — catalyses synthesis of asparagine from aspartate using glutamine as nitrogen donor. Rare, severe. Plasma asparagine strikingly low (often undetectable), glutamine may be mildly low. CSF asparagine also markedly depleted. Like serine deficiency, brain depends on de novo synthesis of asparagine as dietary Asn crosses the BBB poorly; central nervous system is selectively impaired. PHENOTYPE: severe, overlaps with serine deficiency phenotype — congenital microcephaly, progressive cerebral atrophy, severely impaired intellectual development, intractable seizures, spastic quadriplegia. Asparagine is required for N-linked glycosylation of proteins (asparagine is the acceptor for N-glycans) — deficiency may impair glycoprotein synthesis in brain. TREATMENT: asparagine supplementation — currently under investigation; some early evidence of benefit in case reports."},

  // ─── GABA & RELATED ─────────────────────────────────────────
  {id:"GABAT",    name:"GABA-transaminase deficiency",                   category:"Aminoacidopathy", gene:"ABAT",
   signature:[{panel:"PAA",id:"GABA",direction:"high",weight:3},{panel:"PAA",id:"BAla",direction:"high",weight:1}],
   notes:"ABAT (4-aminobutyrate aminotransferase / GABA transaminase) deficiency — extremely rare, fewer than 15 cases reported. GABA transaminase catalyses degradation of GABA → succinic semialdehyde (with α-ketoglutarate as amino acceptor). Deficiency → GABA markedly elevated in plasma and CSF; β-alanine also elevated because ABAT also metabolises β-alanine. PATHOPHYSIOLOGY: paradoxically, very high GABA does not simply increase inhibitory tone — GABA receptors undergo desensitisation/downregulation, and high GABA impairs the precise spatial and temporal control of inhibitory signalling required for normal neural circuit function. High GABA also impairs GABA-B receptor signalling which modulates glutamate release. CLINICAL: neonatal/infantile onset. Severe hypotonia (loss of reflex-mediated muscle tone), hyporeflexia, hypersomnolence, profound psychomotor retardation, seizures (variable severity), accelerated linear growth/macrosomia (GH axis effects?), EEG: high-voltage rhythmic delta with burst suppression. Death in infancy-early childhood in severe cases; milder variants with longer survival. TREATMENT: vigabatrin contraindicated (inhibits GABA transaminase, would worsen by further raising GABA). No effective treatment established. Distinguish from SSADH deficiency (SSADH acts downstream of ABAT — in SSADH, GHB elevated; in GABAT, GHB is normal, GABA itself is the elevated species)."},

  {id:"BALA",     name:"Hyper-β-alaninemia",                            category:"Aminoacidopathy", gene:"AGXT2",
   signature:[{panel:"PAA",id:"BAla",direction:"high",weight:3},{panel:"PAA",id:"GABA",direction:"high",weight:1}],
   notes:"β-Alanine:2-oxoglutarate aminotransferase (AGXT2) deficiency — very rare. β-Alanine is the decarboxylation product of L-aspartate and is also produced from carnosine/anserine (β-Ala-His dipeptides), dihydrouracil catabolism, and pantothenate metabolism. AGXT2 is the primary route for β-alanine catabolism (transamination to malonate semialdehyde → acetyl-CoA). Deficiency → plasma and urine β-alanine markedly elevated. β-Alanine competes with GABA and taurine for neuronal and glial transporters (GAT1, GAT2, TAUT) → GABA may be secondarily elevated. β-Alanine is a weak agonist at glycine receptors and GABA-A receptors. CLINICAL: neonatal lethargy, hypotonia, seizures, respiratory distress. Plasma/urine carnosine (β-Ala+His), anserine, and homocarnosine also elevated (dipeptides containing β-Ala). TREATMENT: none established. Note: AGXT2 also metabolises β-aminoisobutyrate — a separate biochemical marker."},

  // ─── GLUTAMATE ──────────────────────────────────────────────
  {id:"GLULSYN",  name:"Glutamine synthetase deficiency",               category:"Aminoacidopathy", gene:"GLUL",
   signature:[{panel:"PAA",id:"Gln",direction:"low",weight:3},{panel:"PAA",id:"Glu",direction:"high",weight:1}],
   notes:"GLUL (glutamine synthetase) deficiency — very rare, among the most severe IMDs. Glutamine synthetase catalyses Glu + NH3 → Gln (ATP-dependent). Plasma glutamine profoundly low (<100 µmol/L, often undetectable; normal 400–800 µmol/L). Glutamate mildly elevated (substrate accumulation). CSF glutamine even more severely depleted than plasma. PATHOPHYSIOLOGY: glutamine is the most abundant plasma amino acid and serves critical roles: (1) primary nitrogen shuttle (N-donor for nucleotide, glucosamine, asparagine synthesis); (2) fuel for intestinal enterocytes and immune cells; (3) precursor of GABA and the glutamate–GABA cycle at synapses; (4) essential fuel for rapidly proliferating cells (cancer biology); (5) acid-base buffer (renal glutamine → ammoniagenesis). In the brain, the astrocyte–neuron glutamate–glutamine cycle is essential: astrocytes take up synaptically released glutamate → convert to Gln (GLUL) → release Gln → neurons convert Gln → Glu → release as neurotransmitter. GLUL deficiency disrupts both astrocyte buffering and neurotransmitter cycling. PHENOTYPE: fatal neonatal-onset encephalopathy, brain malformations (pachygyria, simplified gyri — suggesting prenatal impairment of neuronal migration and cortical organisation), severe intractable seizures, necrotising enterocolitis (intestinal enterocyte death from Gln deprivation), multi-organ failure. Death usually in early infancy. Only ~10 patients reported. TREATMENT: glutamine supplementation — may partially correct plasma levels but CSF entry uncertain; clinical benefit limited. The profound severity reflects the indispensability of glutamine across multiple cell types."},

  // ─── BRANCHED-CHAIN (additional) ────────────────────────────
  {id:"HSD17B10D",name:"2-Methyl-3-hydroxybutyric aciduria (HSD17B10)",  category:"Organic Acidemia", gene:"HSD17B10 (X-linked)",
   signature:[{panel:"AC",id:"C5OH",direction:"high",weight:3},{panel:"UOA",id:"2MAA",direction:"high",weight:2},{panel:"UOA",id:"TG",direction:"high",weight:1}],
   notes:"HSD17B10 (17β-hydroxysteroid dehydrogenase type 10, also MHBD / 2-methyl-3-hydroxybutyryl-CoA dehydrogenase) deficiency — X-linked. HSD17B10 catalyses a step in isoleucine and branched-chain fatty acid catabolism: 2-methyl-3-hydroxybutyryl-CoA → 2-methylacetoacetyl-CoA. Accumulation of 2-methyl-3-OH-butyric acid (urine), 2-methylacetoacetate (UOA: 2MAA), tiglylglycine (UOA: TG), and C5-OH acylcarnitine. CRITICAL DISTINCTION FROM BETA-KETOTHIOLASE (BKT): the acylcarnitine and UOA profile is nearly identical to BKT — both show TG↑ and 2MAA↑ with C5-OH↑. KEY DIFFERENTIATORS: (1) HSD17B10 is X-linked (males >> affected); (2) HSD17B10 shows progressive neurodegeneration — basal ganglia involvement on MRI, optic atrophy, cardiomyopathy, progressive intellectual deterioration — NOT seen in BKT; (3) clinical deterioration often occurs even without metabolic crisis in HSD17B10 (unlike BKT which is episodic). The HSD17B10 protein has multiple cellular functions including steroid hormone and neurosteroid metabolism, mitochondrial tRNA modification — the progressive CNS involvement likely reflects these non-metabolic functions. Males severely affected; female carriers may be mildly symptomatic. MANAGEMENT: isoleucine restriction (limit substrate for the blocked reaction), avoid fasting, emergency glucose infusion during illness. Prognosis is poor in classic form due to progressive neurodegeneration."},

  {id:"GA3",      name:"Glutaric aciduria type III",                     category:"Organic Acidemia", gene:"C7orf10 / SUGCT",
   signature:[{panel:"UOA",id:"GA",direction:"high",weight:3}],
   notes:"C7orf10 / SUGCT (succinyl-CoA:glutarate-CoA transferase) deficiency — glutaric acid elevated in urine. GA type III is considered largely benign. KEY DISTINGUISHING FEATURE FROM GA TYPE I: absence of 3-OH-glutaric acid. In GA type I (GCDH deficiency), BOTH glutaric acid AND 3-OH-glutaric acid are elevated, and the 3-OHGA elevation is the more specific and diagnostically reliable marker. In GA type III, only glutaric acid is elevated, without 3-OHGA, and without the risk of acute encephalopathic crisis or progressive striatal injury that characterises GA type I. This distinction is critical — misidentifying GA type III as GA type I would lead to unnecessary dietary restriction and surveillance protocols. Incidence is relatively higher in Middle Eastern populations (founder effects). Most NBS-identified GA-III patients remain clinically asymptomatic throughout life. No treatment required. When elevated urine GA is detected, always measure 3-OHGA: if elevated, investigate GA-I aggressively; if normal, GA-III is likely."},

  // ─── MITOCHONDRIAL / ENERGY DISORDERS ────────────────────────
  {id:"PDHD",     name:"Pyruvate dehydrogenase complex deficiency",       category:"Mitochondrial Disorder", gene:"PDHA1, PDHB, DLAT, DLD, PDHX",
   signature:[{panel:"UOA",id:"LacPyr",direction:"high",weight:3},{panel:"MISC",id:"Lactate",direction:"high",weight:2},{panel:"UOA",id:"Lactic",direction:"high",weight:2},{panel:"UOA",id:"Pyruvic",direction:"high",weight:2},{panel:"PAA",id:"Ala",direction:"high",weight:1}],
   notes:"Pyruvate dehydrogenase (PDH) complex deficiency — most common cause of primary lactic acidosis in infancy. Block at pyruvate → acetyl-CoA: lactate and pyruvate accumulate (elevated L/P ratio >25 typical), plasma alanine elevated via transamination. PDHA1 (X-linked) accounts for ~80%; females may have attenuated phenotype. Clinical spectrum: severe neonatal encephalopathy → Leigh syndrome (bilateral basal ganglia) → corpus callosum dysgenesis → intermittent ataxia. Ketogenic diet bypasses PDH block (acetyl-CoA derived from fat, not carbohydrate). Thiamine (cofactor) responsive in select PDHB/PDHX variants. Urine: lactic and pyruvic acid elevated. Note: L/P ratio must be interpreted on properly collected, rapidly processed sample — haemolysis/delay artificially raises both."},
  {id:"PCDEF",    name:"Pyruvate carboxylase deficiency",                 category:"Mitochondrial Disorder", gene:"PC",
   signature:[{panel:"UOA",id:"LacPyr",direction:"high",weight:3},{panel:"MISC",id:"Lactate",direction:"high",weight:2},{panel:"PAA",id:"Gln",direction:"high",weight:2},{panel:"PAA",id:"Ala",direction:"high",weight:1},{panel:"MISC",id:"Ammonia",direction:"high",weight:1},{panel:"MISC",id:"Glucose",direction:"low",weight:1}],
   notes:"Pyruvate carboxylase (PC) deficiency — impaired anaplerosis (pyruvate → oxaloacetate). Three phenotypes: Type A (North American): moderate lactic acidosis, developmental delay, survival years. Type B (French/severe): neonatal, high lactate, hyperammonemia, elevated Gln and Cit (OAA depletion impairs urea cycle aspartate supply), hypoglycaemia — fatal in infancy. Type C: benign intermittent. Distinction from PDHD: PC deficiency type B has elevated plasma Gln and Cit + hyperammonemia; PDHD typically has normal Gln and normal or low Cit. L/P ratio elevated in both. Biotin supplementation not effective despite PC being biotin-dependent (apoenzyme folding defect, not cofactor deficiency). Treatment: triheptanoin (anaplerotic medium-odd-chain triglyceride), aspartate supplementation."},

  // ─── FAO / ORGANIC ACID ADDITIONS ─────────────────────────────
  {id:"ETHE1D",   name:"Ethylmalonic encephalopathy (ETHE1)",             category:"Organic Acidemia",    gene:"ETHE1",
   signature:[{panel:"UOA",id:"EMA",direction:"high",weight:3},{panel:"AC",id:"C4",direction:"high",weight:2},{panel:"MISC",id:"Lactate",direction:"high",weight:2},{panel:"MISC",id:"CK",direction:"high",weight:1}],
   notes:"ETHE1 (persulfide dioxygenase) deficiency — H2S and persulfides accumulate → complex IV (COX) inhibition + capillary endothelial damage. Clinical triad: (1) progressive encephalopathy with developmental regression, (2) petechiae and haemorrhagic tendency (platelet dysfunction), (3) orthostatic acrocyanosis + chronic diarrhoea. Biochemistry: very high EMA in urine (10–1000× ULN — among the highest EMA elevations of any IEM); elevated plasma C4 (butyrylcarnitine); elevated lactate; elevated urinary thiosulfate (not routinely measured). EMA elevation is characteristic and far exceeds what is seen in SCAD deficiency or GA2. Treatment: metronidazole (reduces gut anaerobe H2S) + N-acetylcysteine; liver transplantation curative. AR; ETHE1 chromosome 19q13."},
  {id:"MLYCD",    name:"Malonyl-CoA decarboxylase deficiency",            category:"Fatty Acid Oxidation", gene:"MLYCD",
   signature:[{panel:"AC",id:"C3DC",direction:"high",weight:3},{panel:"UOA",id:"Malonic",direction:"high",weight:3},{panel:"MISC",id:"Glucose",direction:"low",weight:1}],
   notes:"MLYCD (malonyl-CoA decarboxylase) deficiency. Malonyl-CoA accumulates → CPT-I inhibited → secondary FAO impairment. Clinical: dilated cardiomyopathy, hypoglycaemia, developmental delay, hypotonia, seizures. Urine malonic acid markedly elevated; malonylcarnitine (C3-DC) elevated on acylcarnitines. Distinction from methylmalonic acidaemia: malonic acid (not methylmalonic acid) is elevated; C3 acylcarnitine is typically normal or only mildly elevated. Treatment: low-fat, high-carbohydrate diet; avoid fasting; L-carnitine supplementation. Most respond well to dietary management."},
  {id:"SBCAD",    name:"2-Methylbutyrylglycinuria (SBCAD / ACADSB def.)", category:"Fatty Acid Oxidation", gene:"ACADSB",
   flags:[{type:"isomer",text:"ISOMER WARNING: C5 acylcarnitine elevations on standard MS/MS are isobaric — 2-methylbutyrylcarnitine (SBCAD) and isovalerylcarnitine (IVA) cannot be separated by flow-injection MS/MS. Definitive assignment requires GC-MS or isomer-separating LC-MS/MS. Check UAG: isovalerylglycine predominates in IVA; 2-methylbutyrylglycine predominates in SBCAD."}],
   signature:[{panel:"AC",id:"C5",direction:"high",weight:2},{panel:"UAG",id:"2MBG",direction:"high",weight:3}],
   notes:"ACADSB (short/branched-chain acyl-CoA dehydrogenase) deficiency — defect in L-isoleucine catabolism (L-2-methylbutyryl-CoA dehydrogenase activity). C5 acylcarnitine elevated (2-methylbutyrylcarnitine, isobaric with isovalerylcarnitine on FIA-MS/MS). UAG: 2-methylbutyrylglycine elevated — more specific than C5 alone. Clinical significance uncertain: majority of NBS-identified cases are clinically asymptomatic or have very mild symptoms; a minority develop hypoglycaemia or acidosis during stress. Distinguish from IVA (UAG isovalerylglycine) and IBD (UAG isobutyrylglycine). Autosomal recessive; ACADSB chromosome 10q26."},

  // ─── TRANSPORT DEFECTS ──────────────────────────────────────
  {id:"HARTNUP",  name:"Hartnup disorder",                               category:"Aminoacidopathy", gene:"SLC6A19",
   signature:[{panel:"PAA",id:"Trp",direction:"low",weight:3},{panel:"PAA",id:"Phe",direction:"low",weight:1},{panel:"PAA",id:"Ile",direction:"low",weight:1},{panel:"PAA",id:"Leu",direction:"low",weight:1},{panel:"PAA",id:"Val",direction:"low",weight:1}],
   notes:"SLC6A19 (B0AT1) deficiency. Neutral aminoaciduria → reduced tryptophan → niacin deficiency → pellagra-like rash, ataxia, psychiatric features. Treatment: nicotinamide 50–300 mg/day + high-protein diet."},

  // ─── SULFUR AMINO ACID / COFACTOR DISORDERS ─────────────────
  {id:"SULFOX",   name:"Sulfite oxidase deficiency (isolated)",            category:"Aminoacidopathy", gene:"SUOX",
   signature:[{panel:"PAA",id:"SSCys",direction:"high",weight:3},{panel:"MISC",id:"UricAc",direction:"low",weight:1}],
   notes:"SUOX deficiency. S-sulfocysteine elevated on amino acid analysis (pathognomonic). Normal uric acid distinguishes from MoCo deficiency. Severe neonatal seizures, lens subluxation, progressive encephalopathy. No effective treatment; supportive care only."},
  {id:"MOCO",     name:"Molybdenum cofactor deficiency",                   category:"Aminoacidopathy", gene:"MOCS1, MOCS2, GPHN",
   signature:[{panel:"PAA",id:"SSCys",direction:"high",weight:3},{panel:"MISC",id:"UricAc",direction:"low",weight:3}],
   notes:"MoCo deficiency. Combined sulfite oxidase + xanthine oxidase + aldehyde oxidase deficiency. S-sulfocysteine elevated + LOW uric acid (xanthine oxidase deficient). Xanthine + hypoxanthine elevated in urine. Clinically identical to sulfite oxidase deficiency. Type A (MOCS1): cPMP-responsive (fosdenopterin, FDA-approved 2021)."},
  {id:"AHCY",     name:"S-Adenosylhomocysteine hydrolase deficiency",      category:"Aminoacidopathy", gene:"AHCY",
   signature:[{panel:"PAA",id:"Met",direction:"high",weight:3},{panel:"PAA",id:"Hcy",direction:"low",weight:1}],
   notes:"AHCY deficiency. Isolated hypermethioninaemia with normal or LOW homocysteine. S-adenosylhomocysteine and S-adenosylmethionine elevated. Myopathy, developmental delay, liver dysfunction. Distinguish from MAT1A (also isolated high Met) by SAH/SAM levels."},
  {id:"CTH",      name:"Cystathioninuria (cystathionase def.)",            category:"Aminoacidopathy", gene:"CTH",
   signature:[{panel:"PAA",id:"Hcy",direction:"high",weight:1}],
   notes:"CTH (cystathionine gamma-lyase) deficiency. Elevated cystathionine in plasma and urine. Mostly considered benign — low clinical significance. Mildly elevated homocysteine in some. B6-responsive."},
  {id:"PSAT1",    name:"Phosphoserine aminotransferase deficiency",        category:"Aminoacidopathy", gene:"PSAT1",
   signature:[{panel:"PAA",id:"Ser",direction:"low",weight:3},{panel:"PAA",id:"Gly",direction:"low",weight:1}],
   notes:"PSAT1 deficiency. Serine biosynthesis defect (like PHGDH). Low plasma AND CSF serine. Microcephaly, seizures, psychomotor retardation. Treatment: oral L-serine + glycine supplementation (must be started early)."},
  {id:"PSPH",     name:"Phosphoserine phosphatase deficiency",             category:"Aminoacidopathy", gene:"PSPH",
   signature:[{panel:"PAA",id:"Ser",direction:"low",weight:3},{panel:"PAA",id:"Gly",direction:"low",weight:1}],
   notes:"PSPH deficiency. Third enzyme in serine biosynthesis pathway. Same biochemical and clinical phenotype as PHGDH and PSAT1 — low plasma/CSF serine. Very rare. Treatment: oral L-serine + glycine."},

  // ─── ORGANIC ACIDEMIAS — ADDITIONAL ─────────────────────────
  {id:"CANAVAN",  name:"Canavan disease (aspartoacylase def.)",            category:"Organic Acidemia", gene:"ASPA",
   signature:[{panel:"UOA",id:"NAA",direction:"high",weight:3}],
   notes:"ASPA deficiency. Massively elevated N-acetylaspartic acid (NAA) in urine — pathognomonic. Progressive leukodystrophy, macrocephaly, hypotonia → spasticity. MRI: diffuse white matter involvement. No definitive treatment; gene therapy trials ongoing."},
  {id:"MGA1",     name:"3-Methylglutaconic aciduria type I (AUH def.)",    category:"Organic Acidemia", gene:"AUH",
   signature:[{panel:"UOA",id:"3MGA",direction:"high",weight:3},{panel:"UOA",id:"3MGR",direction:"high",weight:2},{panel:"AC",id:"C6DC",direction:"high",weight:1}],
   notes:"AUH (3-methylglutaconyl-CoA hydratase) deficiency. Primary 3-methylglutaconic aciduria — elevated 3MGA + 3-methylglutaric acid in urine. Leucine catabolism defect. Variable phenotype from asymptomatic to speech delay/leukoencephalopathy. Distinguish from secondary 3MGA (Barth/TMEM70/OPA3/SERAC1) where 3MGA is a non-specific marker of mitochondrial dysfunction."},
  {id:"GSS",      name:"Glutathione synthetase deficiency",                category:"Organic Acidemia", gene:"GSS",
   signature:[{panel:"UOA",id:"5OxoPro",direction:"high",weight:3},{panel:"MISC",id:"Lactate",direction:"high",weight:1}],
   notes:"GSS deficiency. Massive urinary 5-oxoproline (pyroglutamic acid) — 10–100× ULN. 5-oxoproline accumulates via gamma-glutamyl cycle feedback (loss of glutathione removes feedback inhibition on gamma-glutamylcysteine synthetase). Haemolytic anaemia (oxidative stress), metabolic acidosis, progressive neurological deterioration. Treatment: N-acetylcysteine, vitamin C + E (antioxidants), bicarbonate for acidosis."},
  {id:"D2HGA",    name:"D-2-Hydroxyglutaric aciduria",                     category:"Organic Acidemia", gene:"D2HGDH, IDH2 (also somatic IDH1)",
   flags:[{type:"enchondromatosis",text:"ENCHONDROMATOSIS ASSOCIATION: Elevated D-2-hydroxyglutaric acid can be caused by somatic mosaic IDH1 (98%) or IDH2 (2%) gain-of-function mutations — the same mutations found in Ollier disease (multiple enchondromatosis) and Maffucci syndrome (enchondromatosis + soft-tissue haemangiomas). OMIM 614875: 'Metaphyseal enchondromatosis with D-2-hydroxyglutaric aciduria.' If D-2-HG elevation is found in a patient with bone lesions, suspect somatic IDH1/IDH2 mosaicism — this is NOT a germline enzyme deficiency but an oncometabolite produced by mutant IDH neomorphic activity (alpha-KG → D-2-HG). D-2-HG inhibits TET2, KDMs, and PHDs → epigenetic dysregulation → tumour formation. Germline D2HGDH deficiency (Type I) and de novo IDH2 mutations (Type II) do NOT cause enchondromatosis."}],
   signature:[{panel:"UOA",id:"D2HG",direction:"high",weight:3}],
   notes:"D-2-Hydroxyglutaric aciduria — three genetic causes: (1) Type I: germline D2HGDH (D-2-hydroxyglutarate dehydrogenase) deficiency, autosomal recessive. Epilepsy, cardiomyopathy (dilated), variable developmental delay. (2) Type II: germline de novo IDH2 gain-of-function (p.R140Q most common), autosomal dominant. Severe neonatal epileptic encephalopathy, cardiomyopathy, high mortality. (3) Somatic mosaic IDH1/IDH2: Ollier disease / Maffucci syndrome — multiple enchondromatosis ± haemangiomas with detectable D-2-HG in urine. IDH1 p.R132C/H/S most common. STEREOSPECIFIC ANALYSIS required: D-2-HG must be distinguished from L-2-HG (L2HGDH deficiency — completely different disorder with leukodystrophy, no enchondromas). Standard urine organic acid GC-MS may report '2-hydroxyglutaric acid' without specifying stereoisomer — request chiral separation if elevated. Mechanism: mutant IDH1/IDH2 converts alpha-ketoglutarate to D-2-HG (oncometabolite) which inhibits alpha-KG-dependent dioxygenases (TET2, Jumonji KDMs, PHDs) → epigenetic dysregulation. No specific treatment for germline forms; tumour surveillance for somatic forms."},
  {id:"MVK",      name:"Mevalonic aciduria (mevalonate kinase def.)",       category:"Organic Acidemia", gene:"MVK",
   signature:[{panel:"UOA",id:"MevA",direction:"high",weight:3}],
   notes:"MVK deficiency. Mevalonic acid elevated in urine (severe form) or intermittently (HIDS/MKD periodic fever form). Mevalonate kinase in cholesterol/isoprenoid pathway. Severe form: dysmorphic, failure to thrive, cataracts, cerebellar ataxia, death in infancy. Mild form (HIDS/MKD): periodic fever + elevated IgD — may have only transient mevalonic aciduria during febrile crises. IL-1 blockade (anakinra, canakinumab) for HIDS."},
  {id:"ALDH6A1",  name:"3-Hydroxyisobutyric aciduria (ALDH6A1 def.)",      category:"Organic Acidemia", gene:"ALDH6A1",
   signature:[{panel:"UOA",id:"3HIB",direction:"high",weight:3}],
   notes:"ALDH6A1 (methylmalonate semialdehyde dehydrogenase) deficiency. Elevated 3-hydroxyisobutyric acid in urine. Valine catabolism defect. Also known as MMSDH deficiency. Variable phenotype — some asymptomatic, others with developmental delay, brain malformations. Distinct from methylmalonic acidaemia (MMA not markedly elevated)."},
  {id:"MCEE",     name:"Methylmalonyl-CoA epimerase deficiency",            category:"Organic Acidemia", gene:"MCEE",
   signature:[{panel:"UOA",id:"MMA",direction:"high",weight:2},{panel:"AC",id:"C3",direction:"high",weight:1}],
   notes:"MCEE deficiency. Mild methylmalonic aciduria. MMA elevation less marked than in mut or cblA/B. Often benign / uncertain clinical significance. C3 mildly elevated. Distinguish from other MMA causes by complementation studies or MCEE gene sequencing."},
  {id:"AKGDH",    name:"Alpha-ketoglutarate dehydrogenase deficiency",      category:"Mitochondrial Disorder", gene:"OGDH, DLST, DLD",
   signature:[{panel:"UOA",id:"2KG",direction:"high",weight:3},{panel:"MISC",id:"Lactate",direction:"high",weight:2},{panel:"PAA",id:"Glu",direction:"high",weight:1}],
   notes:"Alpha-ketoglutarate dehydrogenase (OGDH/DLST/DLD) deficiency. Krebs cycle block → elevated 2-ketoglutaric acid in urine, lactic acidosis, elevated glutamate. E3 (DLD) deficiency also impairs PDH and BCKD → combined presentation with elevated BCAAs. Progressive encephalopathy, hypotonia, seizures."},

  // ─── CARBOHYDRATE METABOLISM ────────────────────────────────
  {id:"GALT",     name:"Classic galactosemia (GALT def.)",                  category:"Carbohydrate Disorder", gene:"GALT",
   signature:[{panel:"MISC",id:"Glucose",direction:"low",weight:1},{panel:"MISC",id:"ALT",direction:"high",weight:1},{panel:"MISC",id:"AST",direction:"high",weight:1}],
   notes:"GALT deficiency. Galactose-1-phosphate accumulates → hepatotoxicity, E. coli sepsis, cataracts. Diagnosed by GALT enzyme activity (NBS) + erythrocyte Gal-1-P. Not reliably diagnosed by standard metabolic panels — requires specific enzyme assay on DBS. If suspected: remove galactose/lactose immediately. Long-term: galactose-restricted diet, though outcome for speech/cognitive/ovarian function often suboptimal despite treatment."},
  {id:"FBP1",     name:"Fructose-1,6-bisphosphatase deficiency",            category:"Carbohydrate Disorder", gene:"FBP1",
   signature:[{panel:"MISC",id:"Lactate",direction:"high",weight:3},{panel:"MISC",id:"Glucose",direction:"low",weight:2},{panel:"UOA",id:"Glycerol",direction:"high",weight:2},{panel:"UOA",id:"Lactic",direction:"high",weight:2},{panel:"PAA",id:"Ala",direction:"high",weight:1}],
   notes:"FBP1 deficiency. Gluconeogenesis defect → fasting/illness-triggered lactic acidosis + ketotic hypoglycaemia. Glycerol elevated in urine (key distinguishing marker). Elevated alanine. Normal between episodes. Treatment: avoid fasting; uncooked cornstarch for overnight fasting; emergency IV glucose during illness."},
  {id:"GSD1A",    name:"Glycogen storage disease type Ia (Von Gierke)",     category:"Carbohydrate Disorder", gene:"G6PC1",
   signature:[{panel:"MISC",id:"Glucose",direction:"low",weight:3},{panel:"MISC",id:"Lactate",direction:"high",weight:3},{panel:"MISC",id:"UricAc",direction:"high",weight:2},{panel:"MISC",id:"Triglyc",direction:"high",weight:2}],
   notes:"G6PC1 deficiency. Glucose-6-phosphatase block → severe fasting hypoglycaemia + lactic acidosis + hyperuricaemia + hyperlipidaemia (triglycerides AND cholesterol). Hepatomegaly. Characteristic tetrad on routine metabolic screen: low glucose, high lactate, high uric acid, high triglycerides. Treatment: frequent feeds + uncooked cornstarch (every 4–6h); restrict fructose/galactose (feed into pathway above the block)."},
  {id:"GSD3",     name:"Glycogen storage disease type III (Cori/Forbes)",   category:"Carbohydrate Disorder", gene:"AGL",
   signature:[{panel:"MISC",id:"Glucose",direction:"low",weight:2},{panel:"MISC",id:"CK",direction:"high",weight:2},{panel:"MISC",id:"ALT",direction:"high",weight:2},{panel:"MISC",id:"AST",direction:"high",weight:2},{panel:"MISC",id:"Lactate",direction:"low",weight:1}],
   notes:"AGL (glycogen debrancher enzyme) deficiency. Fasting ketotic hypoglycaemia with elevated CK + transaminases. Key distinction from GSD Ia: lactate is NORMAL or LOW during fasting (no gluconeogenesis block), and rises POSTPRANDIALLY. Hepatomegaly in childhood may resolve with age; myopathy and cardiomyopathy are long-term concerns. Treatment: high-protein diet + uncooked cornstarch."},

  // ─── COBALAMIN — ADDITIONAL ─────────────────────────────────
  {id:"CBLF",     name:"Cobalamin disorder — cblF (LMBRD1)",               category:"Organic Acidemia", gene:"LMBRD1",
   signature:[{panel:"PAA",id:"Hcy",direction:"high",weight:2},{panel:"AC",id:"C3",direction:"high",weight:2},{panel:"UOA",id:"MMA",direction:"high",weight:2},{panel:"PAA",id:"Met",direction:"low",weight:1},{panel:"MISC",id:"tHcy",direction:"high",weight:2}],
   notes:"LMBRD1 (cblF) deficiency. Lysosomal cobalamin release defect → combined MMA + homocystinuria. Same biochemical triad as cblC (elevated MMA + tHcy + low Met) but different gene. Milder phenotype possible. Treatment: hydroxocobalamin IM injections."},
  {id:"CBLJ",     name:"Cobalamin disorder — cblJ (ABCD4)",                category:"Organic Acidemia", gene:"ABCD4",
   signature:[{panel:"PAA",id:"Hcy",direction:"high",weight:2},{panel:"AC",id:"C3",direction:"high",weight:2},{panel:"UOA",id:"MMA",direction:"high",weight:2},{panel:"PAA",id:"Met",direction:"low",weight:1},{panel:"MISC",id:"tHcy",direction:"high",weight:2}],
   notes:"ABCD4 (cblJ) deficiency. Peroxisomal/lysosomal cobalamin trafficking defect → combined MMA + homocystinuria. Very rare. Clinically similar to cblC/cblF. Hydroxocobalamin-responsive."},
  {id:"TCN2",     name:"Transcobalamin II deficiency",                      category:"Organic Acidemia", gene:"TCN2",
   signature:[{panel:"UOA",id:"MMA",direction:"high",weight:2},{panel:"PAA",id:"Hcy",direction:"high",weight:2},{panel:"MISC",id:"tHcy",direction:"high",weight:2}],
   notes:"TCN2 deficiency. Normal serum B12 but absent functional B12 transport protein → intracellular B12 deficiency. Elevated MMA + tHcy after B12 stores are depleted (weeks-months after birth). Pancytopenia, failure to thrive, immunodeficiency. Serum B12 is NORMAL (misleading — most B12 is bound to haptocorrin). Treatment: IM hydroxocobalamin lifelong."},

  // ─── PURINE / PYRIMIDINE ────────────────────────────────────
  {id:"HPRT",     name:"Lesch-Nyhan syndrome (HPRT deficiency)",            category:"Purine/Pyrimidine", gene:"HPRT1 (X-linked)",
   signature:[{panel:"MISC",id:"UricAc",direction:"high",weight:3}],
   notes:"HPRT1 deficiency. Elevated serum uric acid + elevated urinary uric acid/creatinine ratio. Hypoxanthine, xanthine, uric acid all elevated. Severe: self-injurious behaviour (lip/finger biting — pathognomonic), dystonia, intellectual disability, gout, uric acid nephrolithiasis. Partial deficiency (Kelley-Seegmiller): gout without neurological features. Treatment: allopurinol (prevents renal damage); no treatment for neurobehavioural features."},
  {id:"UMPS",     name:"Hereditary orotic aciduria (UMP synthase def.)",    category:"Purine/Pyrimidine", gene:"UMPS",
   signature:[{panel:"UOA",id:"OroticU",direction:"high",weight:3},{panel:"UOA",id:"Orotic",direction:"high",weight:2}],
   notes:"UMPS deficiency. Massively elevated urinary orotic acid (>100× ULN). Megaloblastic anaemia NOT responsive to B12 or folate (de novo pyrimidine synthesis block). Distinguish from OTC deficiency where orotic acid is also elevated but with hyperammonaemia and low citrulline. Treatment: uridine supplementation (oral uridine triacetate) — corrects anaemia and growth."},
  {id:"DPD",      name:"Dihydropyrimidine dehydrogenase deficiency",        category:"Purine/Pyrimidine", gene:"DPYD",
   signature:[{panel:"UOA",id:"Uracil",direction:"high",weight:3},{panel:"UOA",id:"Thymine",direction:"high",weight:3}],
   notes:"DPYD deficiency. Elevated uracil + thymine in urine (GC-MS). Variable phenotype from asymptomatic to severe intellectual disability, seizures, microcephaly. Critically important for pharmacogenomics: 5-fluorouracil (5-FU) is metabolised by DPD → DPD-deficient patients develop severe/fatal 5-FU toxicity. DPYD genotyping now recommended before 5-FU therapy."},
  {id:"ADSL",     name:"Adenylosuccinate lyase deficiency",                 category:"Purine/Pyrimidine", gene:"ADSL",
   signature:[{panel:"UOA",id:"SAICAr",direction:"high",weight:3}],
   notes:"ADSL deficiency. Succinyladenosine (S-Ado) and SAICA-riboside (SAICAr) elevated in urine and CSF. Purine synthesis defect. Severe form: neonatal seizures, profound intellectual disability. Moderate form: psychomotor retardation, seizures, autistic features. Diagnosis by urine purine analysis (modified Bratton-Marshall test or LC-MS/MS). No proven treatment; adenine + allopurinol trialled."},
  {id:"XANTH",    name:"Xanthinuria (xanthine oxidase deficiency)",         category:"Purine/Pyrimidine", gene:"XDH",
   signature:[{panel:"MISC",id:"UricAc",direction:"low",weight:3}],
   notes:"XDH deficiency. Very low serum and urine uric acid. Elevated urine xanthine and hypoxanthine. Xanthine urolithiasis. Type I: isolated XDH deficiency. Type II: combined XDH + aldehyde oxidase (molybdenum cofactor sulfurase deficiency). Generally benign if stones avoided. Treatment: hydration; low-purine diet; avoid allopurinol (XDH is its target)."},

  // ─── FAO — ADDITIONAL ──────────────────────────────────────
  {id:"RFVT",     name:"Riboflavin transporter deficiency (BVVL syndrome)", category:"Fatty Acid Oxidation", gene:"SLC52A2, SLC52A3",
   signature:[{panel:"AC",id:"C4",direction:"high",weight:1},{panel:"AC",id:"C5",direction:"high",weight:1},{panel:"AC",id:"C8",direction:"high",weight:1},{panel:"AC",id:"C10",direction:"high",weight:1},{panel:"AC",id:"C12",direction:"high",weight:1},{panel:"UOA",id:"EMA",direction:"high",weight:2},{panel:"UOA",id:"Adipic",direction:"high",weight:1}],
   notes:"SLC52A2/A3 (riboflavin transporter) deficiency. Brown-Vialetto-Van Laere syndrome. MADD-like acylcarnitine pattern + sensori-neural deafness + cranial nerve palsies (facial weakness, bulbar palsy). Biochemistry mimics late-onset GA2/MADD. Critical to distinguish: responds dramatically to HIGH-DOSE riboflavin (100–400 mg/day) — treatment is lifesaving. Suspect in any MADD-like pattern + deafness + cranial neuropathy."},
  {id:"SUCLA2",   name:"Succinyl-CoA ligase deficiency (mtDNA depletion)",  category:"Mitochondrial Disorder", gene:"SUCLA2, SUCLG1",
   signature:[{panel:"UOA",id:"MMA",direction:"high",weight:2},{panel:"MISC",id:"Lactate",direction:"high",weight:2},{panel:"UOA",id:"3MGA",direction:"high",weight:1}],
   notes:"SUCLA2/SUCLG1 deficiency. TCA cycle enzyme + nucleotide diphosphate kinase activity → mtDNA depletion. Mild-moderate methylmalonic aciduria (less than in mut/cblA/B) + lactic acidosis + 3-methylglutaconic aciduria (non-specific mitochondrial marker). Progressive encephalomyopathy, hypotonia, dystonia, sensorineural deafness (SUCLA2). Leigh-like presentation possible (SUCLG1). No curative treatment."},
  {id:"MTATP6",   name:"MT-ATP6-related mitochondrial disease (NARP / Leigh)", category:"Mitochondrial Disorder", gene:"MT-ATP6 (mitochondrial)",
   flags:[{type:"nbs_triad",text:"NBS TRIAD: Low citrulline + elevated C5-OH + elevated C3 on newborn screening is a distinctive biochemical signature for MT-ATP6-related disease (Ganetzky et al. 2021). This pattern can be mistaken for a proximal urea cycle defect — check lactate and consider mitochondrial DNA testing before concluding CPS1 or OTC deficiency. Heteroplasmy level >90% typically needed for biochemical expression."}],
   negativeEvidence:[
     {panel:"UOA",id:"Orotic",weight:3}, // if orotic acid is elevated → OTC more likely, not ATP6
   ],
   signature:[{panel:"PAA",id:"Cit",direction:"low",weight:3},{panel:"AC",id:"C5OH",direction:"high",weight:2},{panel:"AC",id:"C3",direction:"high",weight:1},{panel:"MISC",id:"Lactate",direction:"high",weight:2},{panel:"UOA",id:"Lactic",direction:"high",weight:1}],
   notes:"MT-ATP6 pathogenic variants (most commonly m.8993T>G and m.8993T>C) cause NARP (neuropathy, ataxia, retinitis pigmentosa) at 70–90% heteroplasmy and maternally-inherited Leigh syndrome at >90% heteroplasmy. MECHANISM OF LOW CITRULLINE: citrulline is synthesised in intestinal enterocyte mitochondria; ATP synthase (Complex V) deficiency impairs ATP-dependent CPS1 and delta-1-pyrroline-5-carboxylate synthetase, reducing citrulline production at source. The triad of low citrulline + elevated C5-OH + mildly elevated C3 on NBS or amino acid/acylcarnitine profiles was described by Ganetzky et al. (Mol Genet Metab 2021) as prospectively diagnostic — all 11 cases had citrulline <1st percentile. Wongkittichote et al. (Clin Chem 2023) confirmed plasma citrulline as low as 3 µmol/L in an infant with m.8993T>G at 96% heteroplasmy. CRITICAL DISTINCTION FROM UCD: urinary orotic acid is NORMAL (excludes OTC); ammonia may be mildly elevated but not to UCD levels; brain MRI shows Leigh-like bilateral basal ganglia/brainstem lesions (not seen in UCD). Early diagnosis via NBS enables prophylactic management (avoid catabolism, manage lactic acidosis), improving outcomes. Confirm by mitochondrial DNA sequencing (m.8993 variants). Prognosis depends on heteroplasmy level and tissue distribution."},
];


const DISORDER_MAP = Object.fromEntries(DISORDERS.map(d=>[d.id,d]));

// ─── CLINICAL MODIFIERS ───────────────────────────────────────
// suppressed[]: analyte signals to attenuate in this context
//   factor: 0=fully suppressed, 1=unaffected; applied as multiplier to matchScore
//   Pathognomonic markers (weight:3) should never be fully suppressed by a single modifier
// disorderWarnings: {dxId: string} — interpretive guidance shown on result card

const MODIFIERS = [
  // ── PATIENT STATE ─────────────────────────────────────────
  {
    id:"premature", label:"Prematurity", group:"patient", icon:"P",
    detail:"Gestational age < 37 weeks",
    suppressed:[
      {panel:"PAA",id:"Tyr",  factor:0.15, reason:"Transient tyrosinemia of prematurity (immature HPD enzyme); Tyr commonly 200–600 µmol/L in preterm"},
      {panel:"PAA",id:"Phe",  factor:0.35, reason:"Immature PAH activity common in preterm; repeat at 48–72h post-birth essential"},
      {panel:"PAA",id:"Met",  factor:0.4,  reason:"Transient hypermethioninemia of prematurity — immature MAT and betaine pathway"},
      {panel:"PAA",id:"Gly",  factor:0.5,  reason:"Glycine physiologically elevated in preterm infants"},
      {panel:"UOA",id:"4OHpp",factor:0.1,  reason:"4-OH-phenylpyruvic aciduria expected in transient neonatal tyrosinemia of prematurity"},
      {panel:"UOA",id:"4OHpl",factor:0.1,  reason:"4-OH-phenyllactic acid expected in transient neonatal tyrosinemia of prematurity"},
    ],
    disorderWarnings:{
      PKU:   "Phe elevation is common in premature neonates (immature PAH); diagnosis requires repeat fasting sample after 48–72h, confirmed Phe:Tyr ratio, and molecular analysis.",
      TYR1:  "Tyr elevation expected in preterm but succinylacetone (SA) is pathognomonic regardless of gestational age — even trace SA elevation should be investigated as TYR1.",
      TYR2:  "Very high Tyr common in preterm transient tyrosinemia; TYR2 is exceptionally rare — requires persistent extreme Tyr and oculocutaneous features after term-corrected age.",
      TYR3:  "Do not diagnose TYR3 on a sample from a premature neonate; repeat after term-corrected age.",
      NKH:   "Glycine is elevated in preterm — do not diagnose NKH without CSF:plasma Gly ratio (>0.09 required) and glycine cleavage enzyme studies.",
      CBS:   "Met elevation can occur in prematurity; elevated Hcy remains meaningful but fasting resample recommended.",
    }
  },
  {
    id:"newborn", label:"Newborn (< 28 days)", group:"patient", icon:"N",
    detail:"Neonatal period; use age-stratified reference intervals",
    suppressed:[
      {panel:"PAA",id:"Phe",  factor:0.5,  reason:"Neonatal Phe reference intervals are wider; age-specific ranges essential"},
      {panel:"PAA",id:"Tyr",  factor:0.5,  reason:"Neonatal Tyr ranges differ; transient neonatal tyrosinemia common in first weeks"},
      {panel:"PAA",id:"Gly",  factor:0.5,  reason:"Glycine physiologically elevated in neonates"},
      {panel:"PAA",id:"Met",  factor:0.5,  reason:"Met neonatal reference intervals are age-dependent"},
      {panel:"AC", id:"C3",   factor:0.4,  reason:"C3 transiently elevated in first days of life; repeat at 3–5 days of age"},
      {panel:"AC", id:"C0",   factor:0.5,  reason:"Free carnitine physiologically low in neonates; absolute values unreliable"},
    ],
    disorderWarnings:{
      PKU:   "NBS-positive Phe requires confirmatory quantitative amino acids; avoid definitive diagnosis on a single value in the first 24h.",
      PA:    "C3 elevation in first 48–72h may be physiological; methylcitric acid on UOA provides specificity.",
      MMA:   "C3 elevation non-specific in neonates; MMA on UOA required for specificity.",
      CPT1:  "Free carnitine physiologically low in neonates; C0/(C16+C18) ratio is more reliable than absolute C0 in this age group.",
      NKH:   "NKH classically presents in neonates — confirm with CSF Gly and glycine cleavage enzyme studies if suspected.",
      OAT:   "Critical neonatal OAT paradox: neonates with OAT deficiency present with LOW ornithine, citrulline and arginine plus hyperammonemia — the opposite of the classic adult hyperornithinemia. The neonatal OAT net flux synthesises ornithine; its absence limits urea cycle substrate. May mimic OTC deficiency. Hyperornithinemia develops only after a few months of age. Arginine supplementation (not restriction) is the acute treatment.",
      HHH:   "HHH syndrome may present neonatally with hyperammonemia; ornithine levels and homocitrullinuria at this age are not well characterised. Molecular diagnosis (SLC25A15 sequencing) is more reliable than biochemical markers in the neonatal period.",
      P5CS:  "P5CS deficiency presents with LOW fasting ornithine, citrulline, arginine and proline — the metabolic profile normalises post-prandially. Fasting sample is essential for diagnosis. Paradoxical fasting hyperammonemia occurs despite normal post-prandial ammonia.",
    }
  },
  {
    id:"catabolic", label:"Acute illness / catabolic", group:"patient", icon:"A",
    detail:"Active fever, sepsis, significant catabolism, or prolonged fasting at time of sample",
    suppressed:[
      {panel:"UOA",id:"Lactic", factor:0.4, reason:"Secondary lactic acidosis common with hypoperfusion, hypoxia, or mitochondrial stress"},
      {panel:"UOA",id:"Pyruvic", factor:0.4, reason:"Pyruvate elevated in catabolic/hypoxic states"},
      {panel:"AC", id:"C8",    factor:0.4,  reason:"C8 rises physiologically during fasting (enhanced FAO induction); not specific for MCAD in acute illness"},
      {panel:"AC", id:"C10",   factor:0.4,  reason:"C10 rises physiologically during fasting/acute illness"},
      {panel:"AC", id:"C6",    factor:0.5,  reason:"C6 can rise non-specifically during fasting"},
      {panel:"UOA",id:"Adipic", factor:0.4, reason:"Dicarboxylic aciduria common in fasting and acute illness (overflow medium-chain FAO)"},
      {panel:"UOA",id:"Suberic",factor:0.4, reason:"Suberic acid elevated physiologically during fasting/illness"},
      {panel:"UOA",id:"EMA",   factor:0.5,  reason:"Ethylmalonic acid can be mildly elevated non-specifically in acute illness"},
    ],
    disorderWarnings:{
      MCAD:  "C8 elevation during illness/fasting can be physiological in partial FAO capacity; resample when clinically well to confirm.",
      GA2:   "Multiple dicarboxylic acids and acylcarnitines are non-specifically elevated during acute illness; do not diagnose MADD solely on acutely ill samples — resample when stable.",
      MMA:   "Catabolic states unmask borderline MMA; confirm on repeat when metabolically stable.",
      MCD:   "Lactic acidosis during illness is non-specific; biotin-responsive disorders should still be trialled but UOA should be repeated when well.",
      NKH:   "Glycine rises non-specifically during catabolism (protein breakdown releases glycine from collagen and muscle). Mildly elevated plasma glycine in an acutely unwell patient is not sufficient to diagnose NKH — CSF:plasma glycine ratio (>0.09 required) and glycine cleavage enzyme/gene studies are mandatory before making this diagnosis.",
    }
  },
  {
    id:"liver", label:"Liver disease", group:"patient", icon:"L",
    detail:"Hepatocellular dysfunction — acute or chronic; elevated transaminases or synthetic impairment",
    suppressed:[
      {panel:"PAA",id:"Tyr",  factor:0.2,  reason:"Tyrosine markedly elevated in hepatic failure (impaired catabolism by TAT and HPD)"},
      {panel:"PAA",id:"Phe",  factor:0.3,  reason:"Phe elevated in liver disease (secondary impaired PAH activity, portosystemic shunting)"},
      {panel:"PAA",id:"Met",  factor:0.3,  reason:"Methionine elevated in hepatic dysfunction (impaired transsulfuration)"},
      {panel:"PAA",id:"Gln",  factor:0.4,  reason:"Glutamine elevated in portosystemic shunting and secondary urea cycle impairment"},
      {panel:"PAA",id:"Ala",  factor:0.5,  reason:"Alanine elevated in hepatic dysfunction"},
      {panel:"UOA",id:"Orotic",factor:0.4, reason:"Secondary orotic aciduria can occur with hepatic dysfunction (secondary UCD impairment)"},
      {panel:"AC", id:"C3",   factor:0.5,  reason:"Secondary propionic acidemia-like pattern possible in acute hepatic failure"},
    ],
    disorderWarnings:{
      TYR1:  "Liver disease is a hallmark of TYR1 (FAH deficiency), not a confounder — succinylacetone (SA) is pathognomonic for FAH deficiency regardless. Elevated Tyr+Met in liver disease should increase, not decrease, suspicion for TYR1.",
      PKU:   "In liver disease Phe is elevated but Tyr is also HIGH (unlike PKU, where Tyr is low). The Phe:Tyr pattern argues against PKU in established liver disease.",
      CBS:   "Met elevation is non-specific in liver disease; elevated Hcy remains meaningful but confirm with fasting resample.",
      OTC:   "Secondary urea cycle impairment in liver disease can cause mild orotic aciduria; low Cit/Arg pattern still informative — consider enzyme/molecular.",
      CPS1:  "Secondary UCD profile in liver disease mimics CPS1; definitive diagnosis requires enzyme assay or sequencing.",
      CITR1: "Secondary Cit elevation possible in liver disease but usually modest; Cit >500 µmol/L is more likely to represent true ASS1 deficiency.",
    }
  },
  {
    id:"renal", label:"Renal insufficiency", group:"patient", icon:"R",
    detail:"Elevated creatinine, dialysis, or known renal impairment",
    suppressed:[
      {panel:"UOA",id:"MMA",   factor:0.3,  reason:"MMA is renally excreted; even mild renal impairment (eGFR <60) causes secondary MMA accumulation"},
      {panel:"UOA",id:"3OHprop",factor:0.5, reason:"3-OH-propionic acid accumulates with impaired renal clearance"},
      {panel:"UOA",id:"Fumaric",factor:0.5, reason:"Fumaric acid accumulates in renal failure"},
      {panel:"UOA",id:"Succinic",factor:0.5,reason:"Succinic acid accumulates in renal failure"},
      {panel:"UOA",id:"2OHglut",factor:0.5, reason:"2-OH-glutaric acid accumulates in renal failure"},
      {panel:"PAA",id:"Gln",   factor:0.5,  reason:"Glutamine elevated in renal failure (impaired nitrogen excretion)"},
    ],
    disorderWarnings:{
      MMA:   "MMA is renally excreted; even mild renal insufficiency can cause biochemically significant secondary MMA elevation — interpret in context of eGFR. Late renal disease in established MMA acidemia causes secondary amplification.",
      PA:    "3-OH-propionic acid accumulation in renal failure can suggest PA; C3 and methylcitric acid are more specific.",
      L2HGA: "2-OH-glutaric acid can accumulate in renal failure; L/D stereospecific analysis remains informative.",
      FUMAR: "Fumaric acid elevation non-specific in renal failure; profound fumaric aciduria (>1000 mmol/mol Cr) still suggestive of FH deficiency.",
    }
  },
  {
    id:"riboflavin_def", label:"Riboflavin deficiency", group:"patient", icon:"B2",
    detail:"Known or clinically suspected riboflavin (B2) deficiency",
    suppressed:[
      {panel:"AC",id:"C4",  factor:0.3,  reason:"Riboflavin deficiency impairs ETF complex, producing MADD-like multi-acylcarnitine pattern"},
      {panel:"AC",id:"C5",  factor:0.3,  reason:"Multiple acylcarnitines elevated in riboflavin deficiency"},
      {panel:"AC",id:"C6",  factor:0.3,  reason:"Multiple acylcarnitines elevated in riboflavin deficiency"},
      {panel:"AC",id:"C8",  factor:0.3,  reason:"Multiple acylcarnitines elevated in riboflavin deficiency"},
      {panel:"AC",id:"C10", factor:0.3,  reason:"Multiple acylcarnitines elevated in riboflavin deficiency"},
      {panel:"UOA",id:"EMA",factor:0.3,  reason:"Ethylmalonic acid elevated in riboflavin deficiency"},
      {panel:"UOA",id:"Adipic",factor:0.3,reason:"Dicarboxylic aciduria in riboflavin deficiency"},
      {panel:"UOA",id:"Suberic",factor:0.3,reason:"Suberic acid elevated in riboflavin deficiency"},
    ],
    disorderWarnings:{
      GA2:   "Riboflavin deficiency produces a biochemically indistinguishable pattern from late-onset MADD (ETFDH mutations). Riboflavin trial (150–300 mg/day × 4 weeks) is both diagnostic and therapeutic — rapid biochemical normalisation confirms riboflavin-responsive MADD.",
      SCAD:  "C4 elevation non-specific in riboflavin deficiency; ACADS sequencing or enzyme assay required if supplementation does not normalise.",
    }
  },
  // ── PRE-ANALYTICAL ────────────────────────────────────────
  {
    id:"postprandial", label:"Post-prandial (< 2h)", group:"preanalytical", icon:"PP",
    detail:"Sample taken less than 2 hours after a protein-containing meal",
    suppressed:[
      {panel:"PAA",id:"Leu",  factor:0.3,  reason:"Branched-chain AAs rise 2–3× within 1–2h of protein meal"},
      {panel:"PAA",id:"Ile",  factor:0.3,  reason:"BCAAs rise substantially after protein meal"},
      {panel:"PAA",id:"Val",  factor:0.3,  reason:"BCAAs rise substantially after protein meal"},
      {panel:"PAA",id:"Phe",  factor:0.4,  reason:"Phe transiently elevated post-prandially"},
      {panel:"PAA",id:"Tyr",  factor:0.4,  reason:"Tyr transiently elevated post-prandially"},
      {panel:"PAA",id:"Met",  factor:0.5,  reason:"Methionine rises after protein intake"},
    ],
    disorderWarnings:{
      MSUD:  "Post-prandial BCAA elevation can mimic MSUD. Alloisoleucine is pathognomonic and not affected by meals — if AlloIle is elevated, MSUD is likely regardless of meal timing.",
      PKU:   "Phe:Tyr ratio is less reliable post-prandially; fasting sample or timed repeat preferred for PKU assessment.",
      CBS:   "Met elevation post-prandially is physiological; Hcy elevation persists and remains a reliable marker for CBS.",
    }
  },
  {
    id:"hemolysis", label:"Hemolyzed sample", group:"preanalytical", icon:"H",
    detail:"Visible hemolysis or laboratory-confirmed hemolysis",
    suppressed:[
      {panel:"PAA",id:"Glu",  factor:0.05, reason:"Glutamate is highly concentrated in erythrocytes; hemolysis causes massive artifactual elevation — this value is uninterpretable"},
      {panel:"PAA",id:"Asp",  factor:0.1,  reason:"Aspartate released from RBCs during hemolysis"},
      {panel:"PAA",id:"Gly",  factor:0.4,  reason:"Glycine elevated artifactually from RBC lysis"},
      {panel:"PAA",id:"Orn",  factor:0.4,  reason:"Ornithine released from erythrocytes during hemolysis"},
      {panel:"PAA",id:"Ala",  factor:0.5,  reason:"Alanine mildly elevated by hemolysis"},
      {panel:"PAA",id:"Hcy",  factor:0.3,  reason:"Intracellular Hcy released from RBCs; total plasma Hcy falsely elevated by hemolysis"},
    ],
    disorderWarnings:{
      NKH:   "Glycine elevation from hemolysis can be substantial and may reach diagnostic-range levels; a hemolyzed sample must be recollected before diagnosing NKH.",
      CBS:   "Total homocysteine is unreliable in hemolyzed samples — resample with careful collection technique.",
      CBLC:  "Both Hcy and acylcarnitine profile may be affected by hemolysis; resample.",
      HHH:   "Ornithine is released from erythrocytes during hemolysis; a hemolyzed sample makes HHH diagnosis unreliable — recollect.",
    }
  },
  {
    id:"tpn", label:"TPN / IV nutrition", group:"preanalytical", icon:"TPN",
    detail:"Active total parenteral or IV lipid nutrition at time of sample collection",
    suppressed:[
      {panel:"PAA",id:"Ala",  factor:0.1,  reason:"TPN amino acid mixtures directly elevate all plasma amino acids; PAA largely uninterpretable on TPN"},
      {panel:"PAA",id:"Leu",  factor:0.1,  reason:"Exogenous BCAAs in TPN cause non-specific elevation"},
      {panel:"PAA",id:"Ile",  factor:0.1,  reason:"Exogenous BCAAs in TPN"},
      {panel:"PAA",id:"Val",  factor:0.1,  reason:"Exogenous BCAAs in TPN"},
      {panel:"PAA",id:"Phe",  factor:0.1,  reason:"Phe in TPN amino acid solution"},
      {panel:"PAA",id:"Tyr",  factor:0.1,  reason:"Tyr in TPN solution"},
      {panel:"PAA",id:"Met",  factor:0.1,  reason:"Met in TPN solution"},
      {panel:"PAA",id:"Gly",  factor:0.1,  reason:"Glycine in TPN solution"},
      {panel:"PAA",id:"Gln",  factor:0.2,  reason:"Glutamine supplemented in TPN; elevates plasma Gln"},
      {panel:"AC", id:"C8",   factor:0.3,  reason:"IV lipid emulsions in TPN can elevate medium-chain acylcarnitines"},
      {panel:"AC", id:"C10",  factor:0.3,  reason:"IV lipid emulsions can elevate C10"},
    ],
    disorderWarnings:{
      MSUD:  "PAA on TPN is unreliable for MSUD diagnosis. Alloisoleucine elevation and branched-chain keto acids on UOA remain informative if present.",
      PKU:   "PAA results on TPN are uninterpretable for PKU diagnosis; sample only when off TPN or with adequate washout.",
      OTC:   "Glutamine elevation on TPN is non-specific; orotic acid on UOA is more reliable for suspected OTC.",
      MCAD:  "Medium-chain acylcarnitines can be elevated from IV lipid; ideally sample off lipids or pre-feed.",
    }
  },
  // ── MEDICATIONS ───────────────────────────────────────────
  {
    id:"pivalate_abx", label:"Pivalate-containing antibiotics", group:"medication", icon:"Piv",
    detail:"Pivampicillin, pivmecillinam, cefditoren pivoxil, or related pivalate-containing drugs within 5 days",
    suppressed:[
      {panel:"AC",id:"C5", factor:0.05, reason:"Pivaloylcarnitine is isobaric with isovalerylcarnitine (C5) on standard tandem MS/MS — apparent C5 elevation is artifactual"},
    ],
    disorderWarnings:{
      IVA:   "Pivaloylcarnitine (from pivalate prodrug antibiotics) is isobaric with C5 (isovalerylcarnitine) by standard NBS MS/MS and is not separated by most clinical platforms. The apparent C5 elevation is artifactual. Confirm with urine isovalerylglycine (IVG), which is NOT affected by pivalate.",
      GA2:   "Apparent C5 elevation from pivalate complicates MADD interpretation; rely on other acylcarnitine species (C4, C6, C8, C10, C12) and urine dicarboxylic acids for the multi-acyl pattern.",
    }
  },
  {
    id:"carnitine_supp", label:"Carnitine supplementation", group:"medication", icon:"Carn",
    detail:"Oral or IV L-carnitine within 48 hours of sample",
    suppressed:[
      {panel:"AC",id:"C0", factor:0.05, reason:"Exogenous carnitine supplementation causes massive elevation of free carnitine (C0); absolute C0 is uninterpretable"},
    ],
    disorderWarnings:{
      CPT1:  "Free carnitine (C0) is the primary diagnostic marker for CPT1 deficiency. On carnitine supplementation, C0 is uninterpretable — sample before next dose or ≥48h after last dose.",
    }
  },
  {
    id:"valproate", label:"Valproate (VPA)", group:"medication", icon:"VPA",
    detail:"Current sodium valproate or valproic acid therapy",
    suppressed:[
      {panel:"AC", id:"C0",   factor:0.3,  reason:"Valproate depletes free carnitine (inhibits renal tubular carnitine reabsorption); secondary carnitine deficiency expected"},
      {panel:"AC", id:"C4",   factor:0.5,  reason:"Valproate metabolites can appear at the C4 position by standard MS/MS"},
      {panel:"UOA",id:"Adipic",factor:0.5, reason:"Dicarboxylic aciduria (especially adipic) is a recognised valproate metabolite effect"},
      {panel:"UOA",id:"Suberic",factor:0.5,reason:"Suberic acid elevation is a recognised valproate effect"},
      {panel:"UOA",id:"Sebacic",factor:0.5,reason:"Sebacic acid elevation is a recognised valproate effect"},
    ],
    disorderWarnings:{
      CPT1:  "Secondary carnitine depletion from VPA reduces free C0; do not interpret C0 as the primary diagnostic marker on VPA therapy.",
      SCAD:  "C4 elevation can occur as a secondary effect of VPA metabolism; confirm SCAD with ACADS sequencing or enzyme assay.",
      GA2:   "Dicarboxylic aciduria pattern (adipic, suberic, sebacic) overlaps extensively with VPA metabolites; riboflavin-responsive MADD should still be considered but VPA must be excluded first.",
      MCAD:  "Dicarboxylic acids on UOA are non-specific on VPA; primary C8 acylcarnitine elevation remains the most informative marker.",
    }
  },
  {
    id:"b12", label:"B12 deficiency / therapy", group:"medication", icon:"B12",
    detail:"Nutritional B12 deficiency, maternal B12 deficiency in breastfed infant, or recent high-dose B12 supplementation",
    suppressed:[
      {panel:"UOA",id:"MMA",  factor:0.2,  reason:"Nutritional/functional B12 deficiency causes MMA elevation biochemically indistinguishable from mut MMA — cobalamin response testing essential"},
      {panel:"AC", id:"C3",   factor:0.3,  reason:"C3 elevated secondarily in B12 deficiency"},
      {panel:"PAA",id:"Hcy",  factor:0.3,  reason:"Hcy elevated in B12 deficiency (impaired remethylation by methionine synthase)"},
    ],
    disorderWarnings:{
      MMA:   "MMA elevation in B12 deficiency is biochemically identical to MCM deficiency (mut MMA) — distinguish by B12-responsiveness testing and MMUT sequencing. B12-responsive cases are NOT mut-/mut-.",
      CBLC:  "Combined MMA + Hcy elevation in a breastfed neonate of a B12-deficient mother can exactly mimic cblC; check maternal B12 levels and supplement — rapid biochemical normalisation confirms nutritional cause.",
      CBS:   "Hcy elevation in B12 deficiency is not due to CBS deficiency. In B12 deficiency, Met will be LOW (not elevated as in CBS) — this pattern reliably distinguishes the two.",
    }
  },
  // ── NUTRITIONAL STATE ─────────────────────────────────────
  {
    id:"fasting_extended", label:"Extended fasting (>12h)", group:"nutrition", icon:"FA",
    detail:"Documented fasting >12 hours at time of sample (not in acute crisis)",
    suppressed:[
      {panel:"AC", id:"C8",    factor:0.3,  reason:"C8 rises 2–5× with extended fasting (physiological FAO induction for ketogenesis); not specific for MCAD in fasted state"},
      {panel:"AC", id:"C10",   factor:0.3,  reason:"C10 rises with extended fasting; FAO induction expected"},
      {panel:"AC", id:"C6",    factor:0.4,  reason:"C6 rises physiologically with fasting"},
      {panel:"AC", id:"C10_1", factor:0.4,  reason:"C10:1 rises with fasting-induced FAO"},
      {panel:"AC", id:"C12",   factor:0.5,  reason:"C12 modestly rises with extended fasting"},
      {panel:"UOA",id:"Adipic", factor:0.35, reason:"Adipic acid elevated physiologically during extended fasting (overflow of medium-chain dicarboxylic acids from FAO)"},
      {panel:"UOA",id:"Suberic",factor:0.35, reason:"Suberic acid elevated physiologically during fasting"},
      {panel:"UOA",id:"Sebacic",factor:0.4,  reason:"Sebacic acid elevated during fasting — C10 dicarboxylic acid from FAO overflow"},
      {panel:"PAA",id:"Ala",   factor:0.4,  reason:"Alanine rises during fasting as gluconeogenic substrate released from muscle"},
      {panel:"PAA",id:"Gln",   factor:0.5,  reason:"Glutamine transiently elevated during fasting (gluconeogenic nitrogen shuttle)"},
      {panel:"PAA",id:"Gly",   factor:0.5,  reason:"Glycine rises during fasting (collagen turnover and gluconeogenic substrate)"},
    ],
    disorderWarnings:{
      MCAD:  "C8 and C10 elevation during extended fasting can be physiological in individuals with partial FAO reserve. Confirm MCAD with acylcarnitine profile in the fed state or with ACADM sequencing. C8/C10 ratio may be informative (MCAD: C8 >> C10).",
      VLCAD: "Long-chain acylcarnitines (C14, C14:1, C16OH, C18OH) are more fasting-sensitive than in MCAD; resample in the fed state for clarification.",
      GA2:   "Multiple dicarboxylic acids during extended fasting can mimic MADD; resample when fed.",
    }
  },
  {
    id:"iv_dextrose", label:"IV dextrose / glucose infusion", group:"nutrition", icon:"IVG",
    detail:"Active IV glucose or dextrose infusion at time of or within 2h before sample collection (e.g. crisis management, emergency protocol)",
    suppressed:[
      {panel:"AC", id:"C8",    factor:0.05, reason:"IV glucose massively suppresses FAO via insulin — C8 will be near-zero even in MCAD; false-negative result expected"},
      {panel:"AC", id:"C10",   factor:0.05, reason:"IV glucose suppresses medium-chain acylcarnitine production — false-negative in MCAD"},
      {panel:"AC", id:"C6",    factor:0.05, reason:"IV glucose suppresses short/medium FAO intermediates"},
      {panel:"AC", id:"C10_1", factor:0.05, reason:"IV glucose suppresses C10:1"},
      {panel:"AC", id:"C14_1", factor:0.1,  reason:"IV glucose partially suppresses long-chain FAO; C14:1 reduced but may persist in VLCAD"},
      {panel:"AC", id:"C14",   factor:0.15, reason:"IV glucose partially suppresses C14 in VLCAD/LCHAD"},
      {panel:"AC", id:"C16",   factor:0.2,  reason:"Long-chain species partially suppressed by IV glucose (less complete than medium-chain)"},
      {panel:"AC", id:"C16OH", factor:0.15, reason:"C16-OH largely suppressed on IV glucose — LCHAD diagnosis may be missed"},
      {panel:"AC", id:"C18_1OH",factor:0.15,reason:"C18:1-OH largely suppressed on IV glucose"},
      {panel:"AC", id:"C0",    factor:0.4,  reason:"Free carnitine may appear relatively preserved on IV glucose as esterification is suppressed"},
      {panel:"UOA",id:"Adipic", factor:0.1,  reason:"Dicarboxylic acids from FAO suppressed when IV glucose is infused"},
      {panel:"UOA",id:"Suberic",factor:0.1,  reason:"Suberic acid suppressed by IV glucose"},
      {panel:"UOA",id:"Sebacic",factor:0.1,  reason:"Sebacic acid suppressed by IV glucose"},
      {panel:"UOA",id:"Lactic", factor:0.4,  reason:"Lactic acid may be partially corrected by glucose infusion even in mitochondrial disease"},
      {panel:"AC", id:"C3",    factor:0.5,  reason:"C3 (propionylcarnitine) partially suppressed by IV glucose/insulin but less completely than FAO markers — PA/MMA detection less affected"},
    ],
    disorderWarnings:{
      MCAD:  "CRITICAL: IV glucose completely suppresses FAO — C8 and C10 will be normal or undetectable even in confirmed MCAD. If MCAD is suspected and the sample was taken on IV glucose, the result CANNOT be used to exclude MCAD. Collect a sample after at least 4–6h off IV glucose with the patient clinically stable.",
      VLCAD: "IV glucose substantially reduces long-chain acylcarnitines; false-negative results are expected in VLCAD on active IV glucose. However, very elevated C14:1 may persist. Resample off IV glucose.",
      LCHAD: "LCHAD markers (C16-OH, C18:1-OH) are heavily suppressed by IV glucose — false-negative results expected. Do not use results on IV glucose to exclude LCHAD/TFP.",
      GA2:   "MADD markers are broadly suppressed by IV glucose; dicarboxylic aciduria on UOA is more resistant and may persist.",
      SCAD:  "C4 elevation in SCAD is less dramatically suppressed by IV glucose than medium/long-chain species, but interpretation remains compromised.",
      PA:    "C3 and methylcitric acid are less completely suppressed by IV glucose than FAO markers; methylcitric acid on UOA is more reliable when IV glucose is active.",
      MMA:   "MMA on UOA is more resistant to IV glucose suppression than acylcarnitines; UOA may still be informative.",
    }
  },
  // ── ACTIVITY ──────────────────────────────────────────────
  {
    id:"exercise_acute", label:"Strenuous exercise (within 6h)", group:"nutrition", icon:"EX",
    detail:"Moderate-to-heavy physical exertion within 6 hours of sample collection",
    suppressed:[
      {panel:"UOA",id:"Lactic",  factor:0.2,  reason:"Lactic acid rises markedly with exercise (anaerobic glycolysis); can reach 20–40 mmol/mol Cr in urine after strenuous activity"},
      {panel:"UOA",id:"Pyruvic", factor:0.3,  reason:"Pyruvate elevated post-exercise (anaerobic metabolism)"},
      {panel:"AC", id:"C3",     factor:0.4,  reason:"C3 (propionylcarnitine) rises during exercise from BCAA catabolism in muscle — non-specific"},
      {panel:"PAA",id:"Leu",    factor:0.3,  reason:"BCAAs (particularly Leu) rise during exercise as muscle protein catabolism accelerates"},
      {panel:"PAA",id:"Ile",    factor:0.3,  reason:"Ile rises during exercise from muscle BCAA catabolism"},
      {panel:"PAA",id:"Val",    factor:0.3,  reason:"Val rises during exercise from muscle BCAA catabolism"},
      {panel:"PAA",id:"Ala",    factor:0.3,  reason:"Alanine rises with exercise (glucose-alanine cycle — muscle exports Ala during exercise)"},
      {panel:"AC", id:"C14_1",  factor:0.4,  reason:"C14:1 can rise post-exercise in some FAO disorders (VLCAD) but also modestly in normal individuals"},
    ],
    disorderWarnings:{
      MSUD:  "BCAA rise post-exercise can mimic MSUD; alloisoleucine is not affected by exercise and remains pathognomonic.",
      VLCAD: "Long-chain acylcarnitines (C14:1, C16) may rise during exercise in VLCAD — exercise-provoked symptoms are characteristic. However, mild post-exercise C14:1 elevation occurs in some normal individuals.",
      PA:    "C3 rises from BCAA catabolism during exercise; resample at baseline.",
      MCD:   "Lactic acid is non-specific post-exercise; UOA should be resampled at rest.",
    }
  },
  // ── SPECIMEN COLLECTION ───────────────────────────────────
  {
    id:"fluoride_oxalate", label:"Fluoride-oxalate tube (wrong tube)", group:"specimen", icon:"FO",
    detail:"Sample collected in fluoride-oxalate tube (NaF/KOx) — correct for lactate/glucose but NOT for amino acid analysis",
    suppressed:[
      {panel:"PAA",id:"Glu",   factor:0.05, reason:"Fluoride-oxalate inhibits enolase and other enzymes but causes extensive amino acid degradation artifacts — amino acid profile is unreliable from this tube"},
      {panel:"PAA",id:"Ala",   factor:0.05, reason:"Amino acid recovery systematically altered in fluoride-oxalate — do not interpret"},
      {panel:"PAA",id:"Phe",   factor:0.1,  reason:"Aromatic amino acid recovery compromised in fluoride-oxalate"},
      {panel:"PAA",id:"Tyr",   factor:0.1,  reason:"Tyrosine recovery affected in fluoride-oxalate tube"},
      {panel:"PAA",id:"Leu",   factor:0.1,  reason:"Leucine recovery partially compromised"},
      {panel:"PAA",id:"Met",   factor:0.05, reason:"Methionine oxidised to methionine sulfoxide in fluoride-oxalate — systematically underestimated"},
      {panel:"PAA",id:"Hcy",   factor:0.05, reason:"Homocysteine measurement particularly unreliable in fluoride-oxalate tube"},
    ],
    disorderWarnings:{
      PKU:   "PAA from fluoride-oxalate tube is unreliable — recollect in EDTA or lithium heparin plasma tube.",
      CBS:   "Homocysteine measurement is invalid from fluoride-oxalate tube. Recollect.",
      MSUD:  "BCAA results from fluoride-oxalate are systematically altered. Recollect.",
    }
  },
  {
    id:"serum_specimen", label:"Serum specimen", group:"specimen", icon:"SR",
    detail:"Serum (clotted tube without anticoagulant) rather than plasma — suboptimal for amino acid quantitation",
    suppressed:[
      {panel:"PAA",id:"Hcy",   factor:0.2,  reason:"During clotting, platelets release intracellular Hcy — serum total Hcy is spuriously elevated vs EDTA plasma (difference up to 10%)"},
      {panel:"PAA",id:"Glu",   factor:0.3,  reason:"Glucose consumption during clotting produces amino acid metabolism changes; glutamate rises from transamination"},
      {panel:"PAA",id:"Ala",   factor:0.4,  reason:"Alanine rises modestly during clotting due to transaminase activity"},
    ],
    disorderWarnings:{
      CBS:   "Serum Hcy is falsely elevated vs EDTA plasma due to platelet release during clotting. For homocysteinemia workup, always use EDTA plasma collected on ice and processed promptly.",
    }
  },
  {
    id:"room_temp_delay", label:"Room-temp delay >2h (unprocessed)", group:"specimen", icon:"RD",
    detail:"Sample left unprocessed at room temperature for more than 2 hours before centrifugation",
    suppressed:[
      {panel:"PAA",id:"Glu",   factor:0.02, reason:"Glutamate rises dramatically at room temperature — in vitro transamination (Asp aminotransferase releases Glu from aspartate, malate, etc.); value is uninterpretable after >2h at room temp"},
      {panel:"PAA",id:"Asp",   factor:0.1,  reason:"Aspartate consumed in vitro by transamination → Glu; Asp is artifactually very low after prolonged room temp storage"},
      {panel:"PAA",id:"Ala",   factor:0.3,  reason:"Alanine rises from alanine aminotransferase activity in vitro at room temperature"},
      {panel:"PAA",id:"Gln",   factor:0.3,  reason:"Glutamine deamidates → glutamate at room temperature (spontaneous chemical reaction); Gln falls, Glu rises"},
      {panel:"PAA",id:"Asn",   factor:0.3,  reason:"Asparagine deamidates → aspartate at room temperature — Asn underestimated after delay"},
      {panel:"PAA",id:"Hcy",   factor:0.2,  reason:"Homocysteine continues to be exported from RBCs after collection at room temp — Hcy rises spuriously unless separated within 60 min"},
      {panel:"PAA",id:"Ser",   factor:0.5,  reason:"Serine is relatively stable but phosphoserine and phosphoethanolamine hydrolyse to Ser at room temp — minor Ser overcounting"},
      {panel:"UOA",id:"Lactic",factor:0.3,  reason:"Lactate rises in vitro from erythrocyte glycolysis at room temperature if urine is unrefrigerated"},
    ],
    disorderWarnings:{
      NKH:   "Glycine rises non-specifically at room temperature from cell lysis (as in hemolysis); Glu elevation at room temp is artifactual. Plasma amino acids from delayed samples are unreliable — recollect with proper handling (ice, prompt centrifugation within 60 min).",
      CBS:   "Homocysteine rises artifactually with room-temp delay due to continued RBC export — the sample may spuriously confirm CBS. Always process on ice and centrifuge within 60 min of collection.",
      GLULSYN:"Glutamine is unstable at room temperature (deamidation Gln→Glu) — low Gln may be artefactual if the sample was not processed promptly. Recollect with immediate separation.",
      ASNSD: "Asparagine deamidates rapidly at room temperature — artificially low Asn from a delayed sample can mimic asparagine synthetase deficiency. Recollect with prompt processing.",
    }
  },
  {
    id:"freeze_thaw", label:"Multiple freeze-thaw cycles (≥2)", group:"specimen", icon:"FT",
    detail:"Sample has undergone 2 or more freeze-thaw cycles before analysis",
    suppressed:[
      {panel:"PAA",id:"Glu",   factor:0.15, reason:"Ice crystal formation causes cell lysis, releasing intracellular glutamate — artifactual elevation with repeated freeze-thaw"},
      {panel:"PAA",id:"Gly",   factor:0.3,  reason:"Glycine released from lysed cells with freeze-thaw"},
      {panel:"PAA",id:"Orn",   factor:0.3,  reason:"Ornithine released from erythrocytes with freeze-thaw-related lysis"},
      {panel:"PAA",id:"Hcy",   factor:0.2,  reason:"Hcy released from RBCs with repeated freeze-thaw — spuriously elevated"},
      {panel:"AC", id:"C4OH",  factor:0.4,  reason:"3-OH-acylcarnitines are less stable than primary acylcarnitines; multiple freeze-thaw cycles may degrade signal"},
      {panel:"AC", id:"C5OH",  factor:0.4,  reason:"C5-OH stability reduced with multiple freeze-thaw cycles"},
    ],
    disorderWarnings:{
      NKH:   "Glycine elevation from freeze-thaw cell lysis can reach diagnostic-mimicking levels — do not diagnose NKH from repeatedly frozen samples. Recollect.",
      CBS:   "Hcy elevation is artefactual from cell lysis; recollect with single-use aliquots.",
      SCHAD: "C4-OH, the primary SCHAD marker, may degrade with repeated freeze-thaw — a normal C4-OH from a multiply-frozen sample does not exclude SCHAD.",
    }
  },
  {
    id:"dbs_specimen", label:"Dried blood spot (DBS / NBS card)", group:"specimen", icon:"DBS",
    detail:"Sample is a dried blood spot (newborn screening card or filter paper) rather than liquid plasma — different matrix and reference intervals apply",
    suppressed:[
      {panel:"PAA",id:"Glu",   factor:0.1,  reason:"DBS amino acid concentrations are whole-blood values (not plasma); quantitative comparison with plasma reference intervals is invalid"},
      {panel:"PAA",id:"Phe",   factor:0.3,  reason:"DBS Phe is semi-quantitative; values are systematically lower than matched plasma by variable factor (hematocrit, spotting volume, elution efficiency)"},
      {panel:"PAA",id:"Tyr",   factor:0.3,  reason:"DBS Tyr is semi-quantitative; hematocrit-dependent"},
      {panel:"PAA",id:"Leu",   factor:0.3,  reason:"DBS BCAA values are whole-blood approximations; use NBS-specific cut-offs"},
      {panel:"AC", id:"C0",    factor:0.4,  reason:"DBS free carnitine values differ from plasma — apply DBS-specific reference intervals"},
      {panel:"AC", id:"C8",    factor:0.4,  reason:"DBS acylcarnitine profiles: apply NBS-specific age-appropriate cut-offs; do not compare to plasma reference intervals"},
    ],
    disorderWarnings:{
      PKU:   "DBS Phe values are used for NBS screening with NBS-specific cut-offs. For diagnostic confirmation and monitoring, quantitative plasma amino acids (EDTA plasma, properly handled) are required.",
      MSUD:  "DBS Leu/Ile/Val values are NBS screening values — absolute concentrations are not equivalent to plasma. Alloisoleucine on DBS is less sensitive; confirmatory plasma amino acids are required.",
      MCAD:  "DBS acylcarnitine screening cut-offs are NBS-validated — do not apply plasma reference intervals to DBS results. Confirmatory plasma acylcarnitines and ACADM sequencing are required for definitive diagnosis.",
    }
  },
  // ── ACTIVE TREATMENT ─────────────────────────────────────
  {
    id:"on_phe_diet", label:"On phenylalanine-restricted diet (PKU treatment)", group:"treatment", icon:"Phe-Rx",
    detail:"Patient is established on dietary phenylalanine restriction ± sapropterin for PKU or HPA management",
    suppressed:[
      {panel:"PAA",id:"Phe",  factor:0.05, reason:"Dietary Phe restriction is the treatment for PKU — a controlled Phe value on diet does NOT exclude PKU; it is the expected treatment effect. Assessment should compare to treatment target (2–6 mg/dL, 120–360 µmol/L for classic PKU), not to population normal range."},
      {panel:"PAA",id:"Tyr",  factor:0.3,  reason:"Tyr may be mildly low on Phe-restricted diet (Phe is a precursor of Tyr; reduced dietary Phe limits substrate for Tyr synthesis in treated PKU patients)"},
    ],
    disorderWarnings:{
      PKU:   "This patient is on PKU dietary treatment. Phe levels reflect treatment efficacy, not diagnosis. Target for classic PKU: Phe 120–360 µmol/L (2–6 mg/dL). If Phe is within treatment target, this represents good dietary control. If Phe remains elevated despite documented adherence, review formula type, undisclosed protein intake, or BH4 responsiveness.",
      PTPS:  "Phe controlled on diet does NOT distinguish classic PKU from BH4 disorders — neurotransmitter monitoring (CSF HVA, 5-HIAA; serum prolactin) is the primary treatment monitoring tool for BH4 disorders.",
    }
  },
  {
    id:"nitrogen_scavenger", label:"Nitrogen scavenger therapy", group:"treatment", icon:"NS",
    detail:"Active sodium benzoate, sodium phenylacetate/phenylbutyrate, or glycerol phenylbutyrate therapy (HPN, Ammonul, Ravicti)",
    suppressed:[
      {panel:"PAA",id:"Gln",   factor:0.2,  reason:"Sodium phenylbutyrate/phenylacetate conjugates glutamine → phenylacetylglutamine for urinary excretion — plasma Gln is therapeutically suppressed; low Gln reflects treatment effect, not primary deficiency"},
      {panel:"PAA",id:"Gly",   factor:0.2,  reason:"Sodium benzoate conjugates glycine → hippuric acid for urinary excretion — plasma Gly is therapeutically suppressed; low Gly reflects treatment effect"},
      {panel:"PAA",id:"Ala",   factor:0.5,  reason:"Alanine may be secondarily affected by nitrogen scavenger treatment (altered aminotransferase flux)"},
    ],
    disorderWarnings:{
      OTC:   "Glutamine suppression by phenylacetate/phenylbutyrate is the intended treatment effect in OTC deficiency. Low plasma Gln does NOT indicate glutamine synthetase deficiency — it reflects adequate nitrogen scavenging.",
      CPS1:  "Nitrogen scavengers therapeutically lower Gln; low Gln in a treated CPS1 patient reflects treatment efficacy. Ammonia and neurological monitoring are the primary endpoints.",
      CITR1: "Glutamine lowering by phenylbutyrate in treated Citrullinemia type I is expected. The Cit level remains informative for treatment response.",
      NKH:   "Sodium benzoate is used therapeutically in NKH to lower plasma glycine — a low plasma glycine in treated NKH is the treatment goal; do not interpret as resolution of NKH.",
    }
  },
  {
    id:"mct_supplement", label:"MCT oil / MCT-containing formula", group:"nutrition", icon:"MCT",
    detail:"Medium-chain triglyceride supplementation (MCT oil, Portagen, Monogen, or MCT-enriched formula) — produces medium-chain acylcarnitine and dicarboxylic acid patterns that mimic FAO disorders",
    suppressed:[
      {panel:"AC", id:"C6",    factor:0.1,  reason:"MCT supplementation directly elevates C6 (hexanoylcarnitine) — cannot be distinguished from MCAD/MADD on acylcarnitine alone"},
      {panel:"AC", id:"C8",    factor:0.1,  reason:"C8 (octanoylcarnitine) is a direct MCT metabolite — elevated C8 on MCT is not diagnostic of MCAD deficiency"},
      {panel:"AC", id:"C10",   factor:0.15, reason:"C10 (decanoylcarnitine) elevated by MCT; C8/C10 ratio may still be useful but overall elevation is dietary"},
      {panel:"AC", id:"C12",   factor:0.2,  reason:"C12 (dodecanoylcarnitine) can be elevated on MCT formula — part of the MCT-related acylcarnitine elevation"},
      {panel:"UOA",id:"Adipic",factor:0.2,  reason:"Dicarboxylic aciduria (adipic acid) from MCT supplementation — ω-oxidation overflow of medium-chain fatty acids"},
      {panel:"UOA",id:"Suberic",factor:0.2, reason:"Suberic acid elevated on MCT via ω-oxidation — does not indicate primary MCAD or MADD in this context"},
      {panel:"UOA",id:"EMA",   factor:0.3,  reason:"Ethylmalonic acid can be mildly elevated with MCT supplementation — interpret cautiously"},
    ],
    disorderWarnings:{
      MCAD:  "MCAD cannot be reliably diagnosed from acylcarnitines alone in a patient on MCT supplementation. C6, C8, and C10 are directly elevated by dietary MCT. Confirm with ACADM molecular analysis or enzyme assay, or repeat acylcarnitines after MCT has been withdrawn for ≥48h.",
      GA2:   "Multiple acylcarnitine elevations and dicarboxylic aciduria are expected on MCT — this pattern cannot be attributed to MADD without withdrawing MCT first. If clinical suspicion persists, repeat on standard formula.",
      LCHAD: "Long-chain species are less affected by MCT (MCT is C8/C10), but the overall acylcarnitine pattern may be distorted — interpret long-chain species independently.",
    }
  },
  {
    id:"biotin_therapy", label:"Biotin supplementation", group:"treatment", icon:"Bio",
    detail:"Active high-dose biotin therapy (≥10 mg/day) — for MCD, HCS deficiency, or empirical biotinidase deficiency treatment",
    suppressed:[
      {panel:"AC", id:"C5OH",  factor:0.05, reason:"High-dose biotin rapidly normalises C5-OH — a normal C5-OH on biotin therapy does NOT exclude MCC deficiency or MCD"},
      {panel:"AC", id:"C3",    factor:0.2,  reason:"C3 normalises with biotin in PC deficiency and MCD; residual elevation may indicate compliance issues"},
      {panel:"UOA",id:"MCG",   factor:0.05, reason:"3-Methylcrotonylglycine rapidly normalises with biotin therapy; normal MCG on biotin does not exclude MCC deficiency"},
      {panel:"UOA",id:"3OHIV", factor:0.1,  reason:"3-OH-isovaleric acid normalises on biotin; use as compliance marker (see below)"},
      {panel:"UOA",id:"MMA",   factor:0.3,  reason:"MMA partially responds to biotin in HCS/biotinidase deficiency (propionyl-CoA carboxylase is biotin-dependent)"},
    ],
    disorderWarnings:{
      MCC:   "C5-OH and 3-methylcrotonylglycine normalise rapidly on biotin. A normal profile on biotin does NOT exclude the biotin-dependent forms of MCC or multiple carboxylase deficiency. For monitoring: use 3-OH-isovaleric acid as a sensitive compliance marker — even minor biotin deficiency causes recurrence.",
      MCD:   "C5-OH, MCG, and MMA normalise on adequate biotin. If any marker remains elevated, consider biotinidase activity, adequate biotin dose, and compliance.",
    }
  },
  // ─── DRUG / NUTRITIONAL ARTIFACT MODIFIERS ──────────────────
  {
    id:"tpn", label:"Total parenteral nutrition (TPN)", group:"nutrition", icon:"TPN",
    detail:"Patient receiving intravenous TPN — causes dramatic amino acid elevations (esp. Phe, Met, Gly, branched-chain) and acylcarnitine artifacts from lipid emulsion",
    suppressed:[
      {panel:"PAA",id:"Phe", factor:0.1, reason:"TPN amino acid infusion causes marked Phe elevation — does NOT indicate PKU"},
      {panel:"PAA",id:"Met", factor:0.1, reason:"TPN causes supraphysiological Met levels — not indicative of CBS or MAT1A"},
      {panel:"PAA",id:"Tyr", factor:0.15,reason:"TPN elevates Tyr via direct infusion — transient tyrosinaemia of prematurity/TPN is common"},
      {panel:"PAA",id:"Gly", factor:0.15,reason:"TPN glycine elevation is expected — does not indicate NKH"},
      {panel:"PAA",id:"Ala", factor:0.2, reason:"TPN elevates Ala via glucose metabolism — non-specific"},
      {panel:"PAA",id:"Leu", factor:0.15,reason:"TPN BCAA elevation from amino acid infusion — does not indicate MSUD"},
      {panel:"PAA",id:"Ile", factor:0.15,reason:"TPN BCAA elevation from amino acid infusion"},
      {panel:"PAA",id:"Val", factor:0.15,reason:"TPN BCAA elevation from amino acid infusion"},
      {panel:"PAA",id:"Gln", factor:0.2, reason:"TPN glutamine supplementation common — Gln elevation non-specific"},
      {panel:"AC", id:"C8",  factor:0.3, reason:"Lipid emulsion (Intralipid) contains medium-chain triglycerides → C6/C8/C10 elevation"},
      {panel:"AC", id:"C6",  factor:0.3, reason:"Lipid emulsion MCT component → C6 artifact"},
      {panel:"AC", id:"C10", factor:0.3, reason:"Lipid emulsion MCT component → C10 artifact"},
      {panel:"AC", id:"C12", factor:0.3, reason:"Lipid emulsion MCT component → C12 artifact"},
    ],
    disorderWarnings:{
      PKU:  "TPN causes dramatic Phe elevation. DO NOT diagnose PKU on TPN sample — repeat off TPN or use Phe/Tyr ratio (Tyr also elevated on TPN → ratio may still be discriminatory). Hall 2020.",
      MSUD: "TPN BCAA infusion causes Leu/Ile/Val elevation. Alloisoleucine is NOT a component of TPN and remains specific for MSUD even during TPN.",
      NKH:  "TPN contains glycine. Plasma Gly elevation on TPN is expected. CSF:plasma glycine ratio remains diagnostic.",
      MCAD: "Lipid emulsion causes C6/C8/C10 elevation mimicking MCAD. C8/C10 ratio may help — but repeat off TPN for definitive interpretation.",
    }
  },
  {
    id:"valproate", label:"Valproic acid (valproate) therapy", group:"medication", icon:"VPA",
    detail:"Active valproate / divalproex sodium therapy — causes C8 elevation (valproylcarnitine isobaric with octanoylcarnitine), secondary carnitine depletion, and hyperammonaemia",
    suppressed:[
      {panel:"AC", id:"C8",  factor:0.1, reason:"Valproylcarnitine is isobaric with C8 (octanoylcarnitine) on standard MS/MS — elevated C8 on valproate is expected artifact"},
      {panel:"AC", id:"C0",  factor:0.3, reason:"Valproate depletes carnitine via conjugation and renal loss — low C0 is secondary, not primary deficiency"},
      {panel:"MISC",id:"Ammonia",factor:0.3,reason:"Valproate causes dose-dependent hyperammonaemia via inhibition of CPS1 and NAGS — not indicative of urea cycle disorder"},
      {panel:"UOA",id:"Adipic",  factor:0.4, reason:"Valproate inhibits mitochondrial beta-oxidation → secondary dicarboxylic aciduria"},
      {panel:"UOA",id:"Suberic", factor:0.4, reason:"Valproate-induced secondary dicarboxylic aciduria"},
      {panel:"UOA",id:"EMA",     factor:0.3, reason:"Valproate causes mild EMA elevation via SCAD inhibition — less marked than ETHE1 or primary SCAD"},
    ],
    disorderWarnings:{
      MCAD: "C8 on valproate is valproylcarnitine, NOT octanoylcarnitine. Elevated C8 alone cannot diagnose MCAD on valproate. Require urine acylglycines (hexanoylglycine) or LC-MS/MS with chromatographic separation. Miller 2021.",
      PCD:  "Valproate causes secondary carnitine depletion. Low C0 on valproate does not indicate primary carnitine deficiency. Measure free and total carnitine OFF valproate, or confirm with SLC22A5 molecular analysis.",
      OTC:  "Valproate-induced hyperammonaemia is common and dose-dependent. If ammonia is the sole abnormality, do NOT diagnose OTC based on this alone. Check orotic acid and plasma amino acids (Gln, Cit) for true UCD pattern.",
      GA2:  "Valproate inhibits beta-oxidation and can produce a mild MADD-like dicarboxylic aciduria pattern. True GA2 shows multi-chain-length acylcarnitine elevation.",
    }
  },
  {
    id:"pivalic_acid", label:"Pivalic acid-containing antibiotic", group:"medication", icon:"Piv",
    detail:"Pivampicillin, pivmecillinam, cefditoren pivoxil, or other pivalic acid prodrug — causes pivaloylcarnitine (isobaric with C5 isovalerylcarnitine) elevation and secondary carnitine depletion",
    suppressed:[
      {panel:"AC", id:"C5",  factor:0.05,reason:"Pivaloylcarnitine is isobaric with isovalerylcarnitine (C5) — elevated C5 on pivalic acid drug is expected artifact, not IVA or SBCAD"},
      {panel:"AC", id:"C0",  factor:0.3, reason:"Pivalic acid conjugation depletes carnitine stores — secondary C0 reduction expected"},
    ],
    disorderWarnings:{
      IVA:  "CRITICAL: Pivaloylcarnitine is isobaric with isovalerylcarnitine on MS/MS. Elevated C5 on a pivalic acid drug is a KNOWN false positive for IVA. Confirm with urine acylglycines: isovalerylglycine is specific for IVA and absent in pivalic acid artifact. Miller 2021, Rinaldo 2008.",
      SBCAD:"C5 elevation from pivalic acid cannot be distinguished from 2-methylbutyrylcarnitine (SBCAD) by MS/MS. Check UAG for 2-methylbutyrylglycine.",
      PCD:  "Pivalic acid drugs deplete carnitine. Low C0 is secondary — rule out drug effect before diagnosing primary carnitine deficiency.",
    }
  },
];

const MODIFIER_MAP = Object.fromEntries(MODIFIERS.map(m=>[m.id,m]));
const MODIFIER_GROUPS = {
  patient:"Patient state",
  nutrition:"Nutritional & metabolic state",
  specimen:"Specimen & collection",
  medication:"Medications",
  treatment:"Active treatment",
};

// ─── SUPPRESSION MAP BUILDER ─────────────────────────────────
function buildSuppressionMap(activeModIds){
  // Returns {"panel:analyteId": {factor, reasons:[{modifier,reason}]}}
  const map={};
  for(const modId of activeModIds){
    const mod=MODIFIER_MAP[modId]; if(!mod) continue;
    for(const s of mod.suppressed||[]){
      const key=`${s.panel}:${s.id}`;
      if(!map[key]) map[key]={factor:1,reasons:[]};
      map[key].factor=Math.min(map[key].factor,s.factor);
      map[key].reasons.push({modifier:mod.label,reason:s.reason});
    }
  }
  return map;
}

function getDisorderWarnings(activeModIds,dxId){
  const warnings=[];
  for(const modId of activeModIds){
    const mod=MODIFIER_MAP[modId]; if(!mod) continue;
    const w=mod.disorderWarnings?.[dxId];
    if(w) warnings.push({modifier:mod.label,text:w});
  }
  return warnings;
}

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
const ANALYTE_DIST = {
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
const DEFAULT_DIST={hS:1.0,hDf:4.0,lS:0.8,lDf:4.0,log:true,hSig:1.0,lSig:1.0};

// ─── AGE-STRATIFIED REFERENCE RANGES ────────────────────────────
// Age-specific plasma amino acid reference ranges (µmol/L, fasting).
// Source: Applegarth et al. Clin Chem 1979 (3mo–10yr);
//         Sharer et al. ACMG 2018 (framework — lab-specific ranges mandated);
//         Chace et al. Clin Chem 2003; ERNDIM paediatric AA surveys.
// Age groups: neonate (<1mo), infant (1–12mo), child (1–18yr), adult (>18yr).
// Only analytes with clinically meaningful age variation are listed;
// others fall back to the default adult ranges in PAA_ANALYTES.
// Format: {lo, hi} overrides for the age group.
const AGE_RANGES = {
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
const AGE_RANGES_AC = {
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

// Derive age group from age in months.
function getAgeGroup(ageMonths){
  if(ageMonths===null||ageMonths===undefined) return "adult";
  if(ageMonths<1)   return "neonate";
  if(ageMonths<12)  return "infant";
  if(ageMonths<216) return "child";
  return "adult";
}

// Parse ageMonths from demo object (uses dob+sampleDate or free-text age field).
// Returns null if age cannot be determined.
function parseAgeMonths(demo, ageStr){
  // Prefer computed DOB-based age
  if(demo?.dob){
    const dob=new Date(demo.dob);
    const ref=demo?.sampleDate?new Date(demo.sampleDate):new Date();
    if(!isNaN(dob.getTime())&&!isNaN(ref.getTime())){
      let m=(ref.getFullYear()-dob.getFullYear())*12+(ref.getMonth()-dob.getMonth());
      if(ref.getDate()<dob.getDate()) m--;
      if(m>=0) return m;
    }
  }
  // Fall back to free-text age string (e.g. "3yr 4mo", "6mo", "2y", "28d")
  if(ageStr){
    const s=ageStr.toLowerCase().replace(/\s+/g,"");
    const yMatch=s.match(/(\d+(?:\.\d+)?)\s*y(?:r|ear)?/);
    const mMatch=s.match(/(\d+(?:\.\d+)?)\s*m(?:o|onth)?/);
    const dMatch=s.match(/(\d+(?:\.\d+)?)\s*d(?:ay)?/);
    const y=yMatch?parseFloat(yMatch[1]):0;
    const mo=mMatch?parseFloat(mMatch[1]):0;
    const d=dMatch?parseFloat(dMatch[1]):0;
    const total=y*12+mo+d/30;
    if(total>0) return total;
  }
  return null;
}

// Get age-adjusted lo/hi for a given analyte and panel.
// Returns the analyte's default lo/hi if no age-specific override exists.
function getAgeAdjustedLimits(analyte, panel, ageMonths){
  const group=getAgeGroup(ageMonths);
  const overrides=panel==="AC"?AGE_RANGES_AC[group]:AGE_RANGES[group];
  if(overrides&&overrides[analyte.id]){
    return {...analyte, ...overrides[analyte.id]};
  }
  return analyte;
}

// ─── CLIR-STYLE CONTINUOUS COVARIATE ADJUSTMENT ────────────────────
// Approximation of CLIR MoM approach (Gavrilov 2020, Rowe 2021):
// For key analytes with strong age/weight dependency, compute an expected
// median based on age-in-hours and birth weight, then express the patient
// value as a Z-score. This supplements the discrete 4-bin system above.
// Model: piecewise linear log-median = f(ageHours, birthWeightG)
// Coefficients derived from published population studies (Rinaldo, Hall, Gavrilov).
const COVARIATE_MODELS = {
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

function computeCovariateZscore(analyteId, value, ageHours, birthWeightG){
  const model=COVARIATE_MODELS[analyteId];
  if(!model) return null;
  if(value<=0) return null;
  // Compute expected log-median given covariates
  const ageOffset=ageHours!==null?(ageHours/100)*model.ageSlope:0;
  const wOffset=birthWeightG!==null?((birthWeightG-2500)/1000)*model.wSlope:0;
  const expectedLogMedian=model.base+ageOffset+wOffset;
  const logVal=Math.log(value);
  return (logVal-expectedLogMedian)/model.sd;
}

function parseDemoForCovariates(demo, ageStr){
  const ageMonths=parseAgeMonths(demo, ageStr);
  let ageHours=null;
  if(ageMonths!==null&&ageMonths<1){
    // Try to compute hours from DOB + sample date
    if(demo?.dob&&demo?.sampleDate){
      const diffMs=new Date(demo.sampleDate)-new Date(demo.dob);
      if(diffMs>0) ageHours=diffMs/3600000;
    }
    if(ageHours===null) ageHours=ageMonths*30*24; // fallback: approximate from months
  } else if(ageMonths!==null){
    ageHours=ageMonths*30*24;
  }
  const birthWeightG=demo?.birthWeight?parseFloat(demo.birthWeight):null;
  return {ageHours, birthWeightG: isNaN(birthWeightG)?null:birthWeightG, ageMonths};
}

// ─── EMPIRICAL SCALE ─────────────────────────────────────────────
// Derives a log-space spread from the published reference range [lo, hi].
// Assumes the range represents approximately the 5th–95th percentile of a
// log-normal distribution (90% reference interval = ±1.645 SD in log-space).
// Source: Marquardt et al., J Pediatr 2012 (CLIR); Schulze et al., Clin Chem 2003.
function empiricalLogScale(analyte){
  const lo=Math.max(analyte.lo>0?analyte.lo:analyte.hi*0.05, 1e-9);
  const hi=Math.max(analyte.hi, 1e-9);
  if(hi<=lo) return 1.0;
  return Math.max(0.05, (Math.log(hi)-Math.log(lo))/(2*1.645));
}

// ─── SCORING ENGINE ──────────────────────────────────────────
// Student-t tail-rarity scoring (replaces binary log10 approach).
// Implements the statistical framework from the Python scoring patch.
// Parameter values are independently calibrated for log-space rather than
// using the Python patch's illustrative raw-space values.

function _logGamma(x){
  const c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,
           771.32342877765313,-176.61502916214059,12.507343278686905,
           -0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if(x<0.5) return Math.log(Math.PI/Math.sin(Math.PI*x))-_logGamma(1-x);
  x-=1; let a=c[0]; const t=x+7.5;
  for(let i=1;i<9;i++) a+=c[i]/(x+i);
  return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a);
}
function _regIncBeta(x,a,b){
  // Regularized incomplete beta I_x(a,b) via Lentz continued fraction
  if(x<=0) return 0; if(x>=1) return 1;
  if(x>(a+1)/(a+b+2)) return 1-_regIncBeta(1-x,b,a);
  const front=Math.exp(a*Math.log(x)+b*Math.log(1-x)-(_logGamma(a+b)-_logGamma(a)-_logGamma(b)))/a;
  const EPS=3e-7,FPMIN=1e-30; let c=1,d=1-(a+b)*x/(a+1);
  if(Math.abs(d)<FPMIN)d=FPMIN; d=1/d; let h=d;
  for(let m=1;m<=200;m++){
    let aa=m*(b-m)*x/((a+2*m-1)*(a+2*m));
    d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN; c=1+aa/c;if(Math.abs(c)<FPMIN)c=FPMIN;
    d=1/d; h*=d*c;
    aa=-(a+m)*(a+b+m)*x/((a+2*m)*(a+2*m+1));
    d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN; c=1+aa/c;if(Math.abs(c)<FPMIN)c=FPMIN;
    d=1/d; const del=d*c; h*=del;
    if(Math.abs(del-1)<EPS) break;
  }
  return front*h;
}
function _tSF(t,df){
  // One-sided survival function P(T > t) for Student-t(df), t ≥ 0
  return 0.5*_regIncBeta(df/(df+t*t),df/2,0.5);
}
function tailRarity(dist,scale,df){
  // Convert distance beyond reference limit → [0,1] rarity score
  // dist=0 → 0.0; dist=scale → ~0.50; dist=2×scale → ~0.85
  if(dist<=0) return 0;
  return Math.max(0,Math.min(1,1-2*_tSF(dist/Math.max(scale,1e-9),Math.max(df,1))));
}
function analyteMatchScore(val,analyte,direction){
  // Returns [0,1] match score using analyte-specific asymmetric tail model.
  // For analytes in ANALYTE_DIST: uses hand-calibrated parameters.
  // For others: scale is data-derived from the published [lo,hi] reference range
  //   using the log-normal 5th–95th percentile assumption (Marquardt 2012, Schulze 2003).
  // Significance multiplier (hSig/lSig) can push above 1 for pathognomonic markers —
  // clamped to 1 in the caller via Math.min so score stays bounded.
  const configured=ANALYTE_DIST[analyte.id];
  const d=configured??DEFAULT_DIST;
  const empiricS=configured?null:empiricalLogScale(analyte);
  if(direction==="high"){
    if(!analyte.hi||val<=analyte.hi) return 0;
    const vt=d.log?Math.log(Math.max(val,1e-9)):val;
    const rt=d.log?Math.log(Math.max(analyte.hi,1e-9)):analyte.hi;
    const scale=empiricS??d.hS;
    return tailRarity(vt-rt,scale,d.hDf)*(d.hSig??1);
  } else {
    if(!analyte.lo||analyte.lo<=0||val>=analyte.lo) return 0;
    const vt=d.log?Math.log(Math.max(val,1e-9)):val;
    const rt=d.log?Math.log(Math.max(analyte.lo,1e-9)):analyte.lo;
    const scale=empiricS??d.lS;
    return tailRarity(rt-vt,scale,d.lDf)*(d.lSig??1);
  }
}

function scoreDisorder(disorder, values, activePanels, suppressionMap, learnedWeights, ageMonths=null){
  let earned=0, maxPoss=0, enteredW=0, activeW=0;
  const supporting=[], missing=[], notRun=[];
  for(const sig of disorder.signature){
    const analyteBase=ANALYTE_MAP[sig.id]; if(!analyteBase) continue;
    // Apply age-adjusted reference limits if age is known
    const analyte=ageMonths!==null?getAgeAdjustedLimits(analyteBase,sig.panel,ageMonths):analyteBase;
    if(!activePanels.has(sig.panel)){notRun.push({...sig,analyte});continue;}
    const lw=learnedWeights?.[disorder.id]?.[sig.id];
    const effectiveWeight=lw?lw.adjustedWeight:sig.weight;
    maxPoss+=effectiveWeight; activeW+=effectiveWeight;
    const raw=values[sig.panel]?.[sig.id];
    const val=(raw===""||raw==null)?null:parseFloat(raw);
    if(val===null||isNaN(val)){missing.push({...sig,analyte,effectiveWeight});continue;}
    enteredW+=effectiveWeight;
    const rawMs=Math.min(1,analyteMatchScore(val,analyte,sig.direction));
    // Apply suppression
    const suppKey=`${sig.panel}:${sig.id}`;
    const suppInfo=suppressionMap?.[suppKey];
    const suppFactor=suppInfo?suppInfo.factor:1;
    const ms=rawMs*suppFactor;
    earned+=effectiveWeight*ms;
    const xl=sig.direction==="high"&&analyte.hi>0?val/analyte.hi:sig.direction==="low"&&analyte.lo>0?val/analyte.lo:null;
    supporting.push({...sig,analyte,val,matchScore:ms,rawMatchScore:rawMs,suppFactor,suppInfo:suppInfo??null,
      xLimit:xl,effectiveWeight,priorWeight:sig.weight,lrInfo:lw??null});
  }
  if(maxPoss===0) return null;
  const rawScore=earned/maxPoss;
  const cov=activeW>0?enteredW/activeW:1;
  // === NEGATIVE EVIDENCE ===
  // Two sources: (A) per-disorder negativeEvidence array (explicit, e.g., SCOT/HMGCS2D)
  // (B) automatic: high-weight (≥2) signature markers that were entered but scored 0 (normal)
  //     — if a pathognomonic marker was measured and is normal, that argues against the dx
  let negEarned=0, negPoss=0;
  // (A) Explicit negativeEvidence entries
  for(const ne of (disorder.negativeEvidence||[])){
    if(!activePanels.has(ne.panel)) continue;
    negPoss+=ne.weight;
    const neBase=ANALYTE_MAP[ne.id]; if(!neBase) continue;
    const neAnalyte=ageMonths!==null?getAgeAdjustedLimits(neBase,ne.panel,ageMonths):neBase;
    const raw=values[ne.panel]?.[ne.id];
    const val=(raw===""||raw==null)?null:parseFloat(raw);
    if(val===null||isNaN(val)) continue;
    const inRange=val>=(neAnalyte.lo||0)&&val<=neAnalyte.hi;
    if(inRange) negEarned+=ne.weight;
  }
  // (B) Automatic: signature markers with weight ≥ 2 that were entered and scored 0
  for(const s of supporting){
    if(s.weight<2) continue; // only high-weight markers count as negative evidence
    if(s.rawMatchScore>0) continue; // marker IS abnormal — no negative evidence
    // Marker was entered (it's in supporting, not missing) and is normal → argues against
    const autoW=s.weight*0.3; // weaker than explicit negativeEvidence (30% of weight)
    negPoss+=autoW;
    negEarned+=autoW;
  }
  // negFactor: 1.0 when no negative evidence; down to 0.55 when all neg-evidence analytes normal
  const negFactor=negPoss>0?(1-0.45*(negEarned/negPoss)):1;
  // Complexity floor: disorders with very few signature analytes are penalised when
  // maxPoss is small (≤4 total weight), preventing single-analyte signatures from
  // trivially topping the ranking via full coverage. This corrects the PCD_DEF/DRD
  // coverage exploit where a weight-1 signature scores 1.0 on one analyte.
  const complexityPenalty=maxPoss<=3?0.65:maxPoss<=5?0.85:1.0;
  // Cross-panel concordance: reward disorders with positive evidence from multiple distinct panels
  const positivePanels=new Set(supporting.filter(m=>m.rawMatchScore>0).map(m=>m.panel));
  const concordanceBonus=positivePanels.size>=3?1.20:positivePanels.size===2?1.10:1.0;
  let finalScore=rawScore*(0.7+0.3*cov)*complexityPenalty*negFactor*concordanceBonus;
  // Analytical ceiling: cap score for disorders with known poor interlaboratory performance (Oglesbee 2017)
  const ceiling=disorder.analyticalCeiling;
  const ceilingHit=ceiling&&finalScore>ceiling;
  if(ceilingHit) finalScore=ceiling;
  return{...disorder,rawScore,score:finalScore,intraCoverage:cov,
    negEarned,negPoss,concordantPanels:positivePanels.size,ceilingHit:!!ceilingHit,
    supporting:supporting.sort((a,b)=>b.rawMatchScore-a.rawMatchScore),missing,notRun};
}

function computeAcRatios(ac){
  const g=id=>{const v=parseFloat(ac?.[id]);return isNaN(v)||v<=0?null:v;};
  const out={};
  const c8=g("C8"),c10=g("C10"); if(c8!==null&&c10!==null) out.C8C10=String(c8/c10);
  const c14_1=g("C14_1"),c16=g("C16"); if(c14_1!==null&&c16!==null) out.C14_1C16=String(c14_1/c16);
  const c3=g("C3"),c2=g("C2"); if(c3!==null&&c2!==null) out.C3C2=String(c3/c2);
  const c0=g("C0"),c16b=g("C16"),c18=g("C18"); if(c0!==null&&c16b!==null&&c18!==null&&(c16b+c18)>0) out.C0LC=String(c0/(c16b+c18));
  // New ratios
  const c16oh=g("C16OH"); if(c16oh!==null&&c16b!==null&&c16b>0) out.C16OHC16=String(c16oh/c16b);
  const c5dc=g("C5DC"); if(c5dc!==null&&c8!==null&&c8>0) out.C5DCC8=String(c5dc/c8);
  const c5=g("C5"); if(c5!==null&&c3!==null&&c3>0) out.C5C3=String(c5/c3);
  const c14=g("C14"),c14_1b=g("C14_1"); if(c14_1b!==null&&c14!==null&&c14>0) out.C14_1C14=String(c14_1b/c14);
  const c3b=g("C3"); if(c3b!==null&&c16b!==null&&c18!==null&&(c16b+c18)>0) out.C3C16=String(c3b/(c16b+c18));
  // Miller 2021 additions
  const c12=g("C12"); if(c14_1!==null&&c12!==null&&c12>0) out.C14_1C12=String(c14_1/c12);      // C14:1/C12
  // C14:1/C12:1 — need C12:1 which is not a standard analyte; skip for now
  const c18_1=g("C18_1"); if(c16b!==null&&c18_1!==null&&c2!==null&&c2>0) out.C16C18_1C2=String((c16b+c18_1)/c2); // (C16+C18:1)/C2
  const c4oh=g("C4OH"),c4=g("C4"); if(c4oh!==null&&c4!==null&&c4>0) out.C4OHC4=String(c4oh/c4);  // C4-OH/C4
  const c18_1oh=g("C18_1OH"); if(c16oh!==null&&c18_1oh!==null&&c18_1oh>0) out.C16OHC18_1OH=String(c16oh/c18_1oh); // C16-OH/C18:1-OH
  return out;
}

function computePaaRatios(paa){
  const g=id=>{const v=parseFloat(paa?.[id]);return isNaN(v)||v<=0?null:v;};
  const out={};
  const phe=g("Phe"),tyr=g("Tyr"); if(phe!==null&&tyr!==null&&tyr>0) out.PheTyr=String(phe/tyr);
  const cit=g("Cit"),arg=g("Arg"); if(cit!==null&&arg!==null&&arg>0) out.CitArg=String(cit/arg);
  const orn=g("Orn"); if(orn!==null&&cit!==null&&cit>0) out.OrnCit=String(orn/cit);
  const gln=g("Gln"),ala=g("Ala"); if(gln!==null&&ala!==null&&ala>0) out.GlnAla=String(gln/ala);
  const gly=g("Gly"); if(gly!==null&&cit!==null&&cit>0) out.GlyCit=String(gly/cit);
  const ser=g("Ser"); if(gly!==null&&ser!==null&&ser>0) out.GlySer=String(gly/ser);
  const leu=g("Leu"),ile=g("Ile"),val=g("Val"); if(leu!==null&&ile!==null&&val!==null&&ala!==null&&ala>0) out.LeuAla=String((leu+ile+val)/ala);
  const met=g("Met"),hcy=g("Hcy"); if(met!==null&&hcy!==null&&hcy>0) out.MetHcy=String(met/hcy);
  return out;
}

function computeUoaRatios(uoa){
  const g=id=>{const v=parseFloat(uoa?.[id]);return isNaN(v)||v<=0?null:v;};
  const out={};
  const lac=g("Lactic"),pyr=g("Pyruvic"); if(lac!==null&&pyr!==null&&pyr>0) out.LacPyr=String(lac/pyr);
  const ohga=g("3OHGA"),ga=g("GA"); if(ohga!==null&&ga!==null&&ga>0) out.OHGAtoGA=String(ohga/ga);
  const mma=g("MMA"),mca=g("MCA"); if(mma!==null&&mca!==null&&mca>0) out.MMAtoMCA=String(mma/mca);
  return out;
}

// ─── BIOCHEMICAL PATTERN LIBRARY ────────────────────────────
// Each pattern encodes a mechanistic axis used in biochemical genetics reasoning.
// Mirrors the diagnostic frameworks in ACMG/SIMD guidelines, Saudubray et al. (IEM 6th ed.),
// Cowan & Barton, and Prasun 2020 (GeneReviews MADD). Detection is deterministic rule-based,
// not probabilistic — patterns are shown when their analyte criteria are met.
// Confidence: "definite" (≥2 specific markers clearly above threshold), "probable" (1 specific + 1 supportive), "possible" (1 specific marker).

const BIOCHEMICAL_PATTERNS = [

  // ── 1. INTOXICATION PATTERN ────────────────────────────────
  // Characteristic of organic acidemias: toxic metabolite accumulation causing
  // encephalopathy. Not a transport/energy defect — a substrate overflow problem.
  // Ref: Saudubray & Baumgartner, IEM 6th ed. 2022, Ch. 3 "Clinical approach".
  {
    id:"intoxication",
    name:"Organic acid intoxication",
    icon:"🧪",
    color:"#be123c",
    bgColor:"#fff1f2",
    borderColor:"#fecdd3",
    mechanism:"Accumulation of toxic organic acid intermediates proximal to an enzymatic block causes secondary inhibition of urea cycle enzymes (glycine elevation via ketotic hyperglycinemia mechanism), mitochondrial function, and gluconeogenesis. This is a substrate-overflow disorder, not an energy defect.",
    differentials:"Propionic acidemia (PA), Methylmalonic acidemia (MMA), Isovaleric acidemia (IVA), Multiple carboxylase deficiency (MCD)",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      const mca=g("UOA","MCA"), mma=g("UOA","MMA"), c3=g("AC","C3"), ivg=g("UOA","IVG"), c5=g("AC","C5");
      const gly=g("PAA","Gly"), c3c2=g("AC","C3C2");
      if(mca!==null&&mca>1.5) hit.push({label:"Methylcitric acid ↑↑",specificity:"high"});
      if(mma!==null&&mma>4&&c3!==null&&c3>3.5) hit.push({label:"MMA↑ + C3↑",specificity:"high"});
      if(ivg!==null&&ivg>1) hit.push({label:"Isovalerylglycine ↑↑",specificity:"high"});
      if(c3!==null&&c3>3.5) hit.push({label:"C3 (propionylcarnitine) ↑",specificity:"medium"});
      if(gly!==null&&gly>450&&(mca!==null&&mca>0.5||c3!==null&&c3>2)) hit.push({label:"Secondary hyperglycinemia",specificity:"medium"});
      if(c3c2!==null&&c3c2>0.15) hit.push({label:"C3/C2 ratio ↑ (propionyl burden)",specificity:"medium"});
      return hit.length>=2?{confidence:"definite",hits}:hit.length>=1?{confidence:"probable",hits:hit}:null;
      function hits(){return hit;}
    }
  },

  // ── 2. PROXIMAL UREA-CYCLE PATTERN ────────────────────────
  // CPS1, OTC, NAGS, CA-VA: no citrulline synthesis → low Cit + NH3 accumulation
  // → Gln and Ala rise as nitrogen carriers. OTC specifically: orotic aciduria.
  // Ref: Häberle et al., J Inherit Metab Dis 2019.
  {
    id:"proximal_ucd",
    name:"Proximal urea-cycle block",
    icon:"↓",
    color:"#7c3aed",
    bgColor:"#f5f3ff",
    borderColor:"#ddd6fe",
    mechanism:"Block at or before carbamoyl phosphate synthesis (CPS1, NAGS, CA-VA) or carbamoylphosphate transfer to ornithine (OTC) prevents citrulline formation. Ammonia accumulates. Glutamine rises as the primary nitrogen buffer; alanine rises via transamination. Citrulline and arginine are depleted downstream. OTC block specifically diverts carbamoyl phosphate to pyrimidine synthesis → orotic aciduria (distinguishes OTC from CPS1/NAGS).",
    differentials:"OTC deficiency (X-linked), CPS1 deficiency, NAGS deficiency, CA-VA deficiency",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      const cit=g("PAA","Cit"), gln=g("PAA","Gln"), ala=g("PAA","Ala"), orotic=g("UOA","Orotic");
      const arg=g("PAA","Arg"), glnAla=g("PAA","GlnAla");
      if(cit!==null&&cit<10) hit.push({label:"Citrulline low/absent",specificity:"high"});
      if(gln!==null&&gln>800) hit.push({label:"Glutamine ↑↑ (nitrogen buffering)",specificity:"high"});
      if(orotic!==null&&orotic>10&&cit!==null&&cit<15) hit.push({label:"Orotic aciduria + low Cit → OTC",specificity:"high"});
      if(ala!==null&&ala>550&&gln!==null&&gln>700) hit.push({label:"Ala↑ + Gln↑ (nitrogen overflow)",specificity:"medium"});
      if(glnAla!==null&&glnAla>6) hit.push({label:"Gln/Ala ratio ↑ (hyperammonemia axis)",specificity:"medium"});
      if(arg!==null&&arg<10&&cit!==null&&cit<10) hit.push({label:"Arg depleted (downstream of block)",specificity:"medium"});
      return hit.length>=2?{confidence:"definite",hits:hit}:hit.length>=1?{confidence:"probable",hits:hit}:null;
    }
  },

  // ── 3. DISTAL UREA-CYCLE PATTERN ──────────────────────────
  // ASS1 (CITR1): Cit >> normal. ASL: ASA↑ + Cit↑. ARG1: Arg >> normal.
  // Key: orotic acid elevated (excess CP still diverted to pyrimidines).
  // Ref: Batshaw et al., Ann Neurol 1982; Summar & Tuchman 2001.
  {
    id:"distal_ucd",
    name:"Distal urea-cycle block",
    icon:"↑",
    color:"#0891b2",
    bgColor:"#ecfeff",
    borderColor:"#a5f3fc",
    mechanism:"Block distal to citrulline synthesis (ASS1, ASL, ARG1) causes accumulation of upstream intermediates: citrulline (ASS1/ASL), argininosuccinate (ASL), or arginine (ARG1). Citrulline:arginine ratio is markedly elevated in ASS1 deficiency (Cit/Arg >4, often >100). Orotic aciduria may be present (upstream CP overflow).",
    differentials:"Citrullinemia type I (ASS1), Argininosuccinic aciduria (ASL), Argininemia (ARG1)",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      const cit=g("PAA","Cit"), asa=g("PAA","ASA"), arg=g("PAA","Arg"), citArg=g("PAA","CitArg");
      const orotic=g("UOA","Orotic");
      if(cit!==null&&cit>200) hit.push({label:"Citrulline markedly ↑↑",specificity:"high"});
      if(asa!==null&&asa>2) hit.push({label:"Argininosuccinate ↑ (pathognomonic for ASL)",specificity:"high"});
      if(arg!==null&&arg>200) hit.push({label:"Arginine ↑↑ (ARG1 deficiency)",specificity:"high"});
      if(citArg!==null&&citArg>4) hit.push({label:"Cit/Arg ratio >4 (ASS1 deficiency)",specificity:"high"});
      if(orotic!==null&&orotic>10&&cit!==null&&cit>50) hit.push({label:"Orotic aciduria + ↑Cit",specificity:"medium"});
      return hit.length>=2?{confidence:"definite",hits:hit}:hit.length>=1?{confidence:"probable",hits:hit}:null;
    }
  },

  // ── 4. FAO PATTERN — MEDIUM-CHAIN ─────────────────────────
  // MCAD prototype: C8 predominant elevation; C8/C10 > ULN; dicarboxylic aciduria.
  // Suppressed during active FAO (fasting/illness); typical presentation: hypoketotic hypoglycaemia.
  // Ref: Rinaldo et al., NEJM 1988; Waisbren et al., J Pediatr 2008 (NBS outcomes).
  {
    id:"fao_medium_chain",
    name:"Medium-chain FAO defect",
    icon:"⚡",
    color:"#d97706",
    bgColor:"#fffbeb",
    borderColor:"#fde68a",
    mechanism:"Defective β-oxidation of C8–C12 chain-length acylcarnitines. C8 accumulates disproportionately (MCAD: C8 >> C10). Medium-chain dicarboxylic acids appear in urine (overflow via ω-oxidation when mitochondrial β-oxidation is impaired). Hypoketotic hypoglycaemia is the metabolic consequence (failure to generate acetyl-CoA for ketogenesis). Urine acylglycines (hexanoylglycine, suberylglycine) are specific conjugation products.",
    differentials:"MCAD deficiency (ACADM)",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      const c8=g("AC","C8"), c10=g("AC","C10"), c8c10=g("AC","C8C10"), c6=g("AC","C6");
      const adipic=g("UOA","Adipic"), suberic=g("UOA","Suberic"), hg=g("UAG","HG"), sg=g("UAG","SG");
      if(c8!==null&&c8>0.3) hit.push({label:"C8 (octanoylcarnitine) ↑",specificity:"high"});
      if(c8c10!==null&&c8c10>2) hit.push({label:"C8/C10 ratio ↑↑ (MCAD-specific)",specificity:"high"});
      if(hg!==null&&hg>0.5) hit.push({label:"Hexanoylglycine ↑ (MCAD-specific UAG)",specificity:"high"});
      if(sg!==null&&sg>1.0) hit.push({label:"Suberylglycine ↑ (MCAD-specific UAG)",specificity:"high"});
      if(c6!==null&&c6>0.16) hit.push({label:"C6 ↑",specificity:"medium"});
      if(adipic!==null&&adipic>10&&c8!==null&&c8>0.2) hit.push({label:"Dicarboxylic aciduria (Adipic) + C8↑",specificity:"medium"});
      if(suberic!==null&&suberic>4&&c8!==null&&c8>0.2) hit.push({label:"Suberic acid ↑ + C8↑",specificity:"medium"});
      return hit.length>=2?{confidence:"definite",hits:hit}:hit.length>=1?{confidence:"probable",hits:hit}:null;
    }
  },

  // ── 5. FAO PATTERN — LONG-CHAIN ───────────────────────────
  // VLCAD / LCHAD / TFP: C14:1, C14, C16, C16-OH, C18:1-OH elevated.
  // Cardiac risk (cardiomyopathy neonatal), rhabdomyolysis in older patients.
  // Ref: Strauss et al., J Inherit Metab Dis 2007 (VLCAD phenotypes).
  {
    id:"fao_long_chain",
    name:"Long-chain FAO defect",
    icon:"⚡",
    color:"#b45309",
    bgColor:"#fefce8",
    borderColor:"#fef08a",
    mechanism:"Defective mitochondrial β-oxidation of long-chain (C14–C20) acylcarnitines. VLCAD: C14:1 disproportionately elevated; C14:1/C16 ratio raised. LCHAD/TFP: 3-hydroxylated long-chain species (C16-OH, C18:1-OH, C18-OH) selectively accumulate due to the 3-hydroxyacyl-CoA dehydrogenase step being blocked within the trifunctional protein. The hydroxy-acylcarnitine profile is the discriminating feature between LCHAD and VLCAD.",
    differentials:"VLCAD deficiency (ACADVL), LCHAD/TFP deficiency (HADHA/HADHB)",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      const c14_1=g("AC","C14_1"), c16oh=g("AC","C16OH"), c18_1oh=g("AC","C18_1OH"), c14_1c16=g("AC","C14_1C16");
      const c18oh=g("AC","C18OH"), c16ohc16=g("AC","C16OHC16"), c14_1c14=g("AC","C14_1C14");
      if(c14_1!==null&&c14_1>0.16) hit.push({label:"C14:1 (tetradecenoylcarnitine) ↑",specificity:"high"});
      if(c14_1c16!==null&&c14_1c16>0.08) hit.push({label:"C14:1/C16 ratio ↑ (VLCAD-specific)",specificity:"high"});
      if(c14_1c14!==null&&c14_1c14>0.5) hit.push({label:"C14:1 > C14 (VLCAD pattern)",specificity:"high"});
      if(c16oh!==null&&c16oh>0.1) hit.push({label:"C16-OH ↑ (LCHAD/TFP marker)",specificity:"high"});
      if(c18_1oh!==null&&c18_1oh>0.12) hit.push({label:"C18:1-OH ↑ (LCHAD/TFP marker)",specificity:"high"});
      if(c16ohc16!==null&&c16ohc16>0.04) hit.push({label:"C16-OH/C16 ratio ↑ (hydroxylation excess)",specificity:"high"});
      if(c18oh!==null&&c18oh>0.1) hit.push({label:"C18-OH ↑",specificity:"medium"});
      return hit.length>=2?{confidence:"definite",hits:hit}:hit.length>=1?{confidence:"probable",hits:hit}:null;
    }
  },

  // ── 6. MULTIPLE ACYL-CoA DEHYDROGENATION PATTERN (MADD) ───
  // Prasun 2020 (GeneReviews): MADD defined by BROAD multi-chain acylcarnitine elevation
  // from C4–C16 SIMULTANEOUSLY + dicarboxylic acids (EMA is the most specific) + multi-chain UAG.
  // This is the defining differentiator from single-enzyme FAO disorders.
  {
    id:"madd_pattern",
    name:"Multiple acyl-CoA dehydrogenation (MADD)",
    icon:"⊕",
    color:"#dc2626",
    bgColor:"#fef2f2",
    borderColor:"#fecaca",
    mechanism:"Defective electron transfer from all FAD-linked acyl-CoA dehydrogenases (SCAD, MCAD, VLCAD, LCHAD, isovaleryl-CoA-DH, glutaryl-CoA-DH, sarcosine-DH) to the mitochondrial respiratory chain via ETF/ETFDH. Because ALL chain-lengths are affected simultaneously, acylcarnitines accumulate across short, medium, and long-chain species. This pan-acyl elevation is pathognomonic and distinguishes MADD from single-enzyme FAO disorders. Ethylmalonic acid (EMA) elevation is the most specific UOA marker. Late-onset riboflavin-responsive MADD (ETFDH mutations) responds dramatically to riboflavin 100–300 mg/day — this is both diagnostic and therapeutic. Ref: Prasun P, GeneReviews 2020.",
    differentials:"MADD / GA type II (ETFA, ETFB, ETFDH mutations); riboflavin-responsive late-onset MADD",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      // Must have ≥3 different chain-length acylcarnitines elevated
      const c4=g("AC","C4"), c5=g("AC","C5"), c6=g("AC","C6"), c8=g("AC","C8"), c10=g("AC","C10"), c12=g("AC","C12");
      const ema=g("UOA","EMA"), adipic=g("UOA","Adipic"), suberic=g("UOA","Suberic");
      const elevated=[c4>0.6,c5>0.3,c6>0.16,c8>0.3,c10>0.2,c12>0.2].filter(Boolean).length;
      if(elevated>=4) hit.push({label:`≥4 acylcarnitine chain-lengths ↑ (${elevated} elevated)`,specificity:"high"});
      else if(elevated>=3) hit.push({label:`${elevated} acylcarnitine chain-lengths ↑ (multi-chain pattern)`,specificity:"medium"});
      if(ema!==null&&ema>10) hit.push({label:"Ethylmalonic acid ↑↑ (most specific MADD marker)",specificity:"high"});
      if(adipic!==null&&adipic>10&&suberic!==null&&suberic>4) hit.push({label:"Dicarboxylic aciduria (adipic + suberic)",specificity:"medium"});
      return hit.length>=2?{confidence:"definite",hits:hit}:hit.length>=1?{confidence:"probable",hits:hit}:null;
    }
  },

  // ── 7. SECONDARY CARNITINE DEPLETION PATTERN ─────────────
  // Seen in organic acidemias (PA, MMA, IVA) and FAO disorders where acyl-CoAs
  // exhaust the free carnitine pool. Distinguishable from primary carnitine deficiency
  // (PCD) where ALL acylcarnitines are low, not just free carnitine.
  {
    id:"secondary_carnitine_dep",
    name:"Secondary carnitine depletion",
    icon:"↓",
    color:"#059669",
    bgColor:"#f0fdf4",
    borderColor:"#bbf7d0",
    mechanism:"Acyl-CoA intermediates (especially propionyl-CoA in PA/MMA, or long-chain acyl-CoAs in FAO disorders) are conjugated to carnitine by carnitine acyltransferases. When the acyl-CoA load is high and sustained, free carnitine is consumed faster than it can be recycled, leading to secondary depletion. C0 (free carnitine) falls while specific acylcarnitine species are elevated. This is distinct from primary carnitine deficiency (OCTN2/SLC22A5 mutation) where free carnitine is depleted without proportional acylcarnitine elevation.",
    differentials:"Propionic acidemia, Methylmalonic acidemia, Isovaleric acidemia, MCAD, VLCAD — all can deplete carnitine secondarily",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      const c0=g("AC","C0"), c3=g("AC","C3"), c8=g("AC","C8"), c14_1=g("AC","C14_1");
      const c0lc=g("AC","C0LC"), carFree=g("CAR","CarFree"), carRatio=g("CAR","CarRatio");
      // C0 low with elevated acylcarnitines = secondary depletion (not primary)
      const anyAcylElevated=(c3!==null&&c3>3.5)||(c8!==null&&c8>0.3)||(c14_1!==null&&c14_1>0.16);
      if(c0!==null&&c0<20&&anyAcylElevated) hit.push({label:"C0 (free carnitine) low with ↑acylcarnitines",specificity:"high"});
      if(carFree!==null&&carFree<20&&anyAcylElevated) hit.push({label:"Plasma free carnitine low with ↑acylcarnitines",specificity:"high"});
      if(carRatio!==null&&carRatio>0.4&&anyAcylElevated) hit.push({label:"Acyl/free ratio ↑ (esterification exceeds free pool)",specificity:"high"});
      if(c0lc!==null&&c0lc<8&&anyAcylElevated) hit.push({label:"C0/(C16+C18) ratio low (C0 depleted by high acyl-CoA load)",specificity:"medium"});
      return hit.length>=1?{confidence:hit.length>=2?"definite":"probable",hits:hit}:null;
    }
  },

  // ── 8. KETOLYSIS / KETOGENESIS IMPAIRMENT ─────────────────
  // BKT (ACAT1) and HSD17B10 share the same acylcarnitine + UOA signature.
  // TG and 2MAA are the discriminating markers vs general organic acid intoxication.
  {
    id:"ketolysis_impairment",
    name:"Ketolysis / terminal isoleucine catabolism block",
    icon:"🔑",
    color:"#7c3aed",
    bgColor:"#faf5ff",
    borderColor:"#e9d5ff",
    mechanism:"Impaired cleavage of acetoacetyl-CoA (beta-ketothiolase, BKT/ACAT1) or 2-methylacetoacetyl-CoA (HSD17B10) — the terminal step in ketone body utilisation and isoleucine catabolism respectively. Tiglylglycine (TG) and 2-methylacetoacetate (2MAA) are pathognomonic metabolites that do not accumulate in any other disorder. C5:1 (tiglylcarnitine) and C5-OH acylcarnitines provide the acylcarnitine correlate. Episodic ketoacidosis provoked by protein intake or illness.",
    differentials:"Beta-ketothiolase deficiency (ACAT1), 2-Methyl-3-hydroxybutyric aciduria (HSD17B10)",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      const tg=g("UOA","TG"), maa=g("UOA","2MAA"), c5_1=g("AC","C5_1"), c5oh=g("AC","C5OH");
      if(tg!==null&&tg>1) hit.push({label:"Tiglylglycine ↑↑ (pathognomonic)",specificity:"high"});
      if(maa!==null&&maa>3) hit.push({label:"2-Methylacetoacetate ↑↑ (pathognomonic)",specificity:"high"});
      if(c5_1!==null&&c5_1>0.1) hit.push({label:"C5:1 (tiglylcarnitine) ↑",specificity:"high"});
      if(c5oh!==null&&c5oh>0.25&&(tg!==null&&tg>0.5||maa!==null&&maa>1)) hit.push({label:"C5-OH ↑ with ketolysis markers",specificity:"medium"});
      return hit.length>=2?{confidence:"definite",hits:hit}:hit.length>=1?{confidence:"probable",hits:hit}:null;
    }
  },

  // ── 9. MITOCHONDRIAL STRESS / ENERGY FAILURE PATTERN ──────
  // Lactic acid + pyruvate elevation; L/P ratio >25 indicates oxidative phosphorylation
  // or pyruvate dehydrogenase complex (PDHC) failure, not just secondary lactacidosis.
  // Ref: Brown & Squier, Curr Opin Neurol 2005 (L/P ratio interpretation).
  {
    id:"mito_stress",
    name:"Mitochondrial energy failure",
    icon:"⚠",
    color:"#0369a1",
    bgColor:"#eff6ff",
    borderColor:"#bfdbfe",
    mechanism:"Impaired mitochondrial oxidative phosphorylation (respiratory chain complexes I–V, PDHC, or Krebs cycle) causes pyruvate and lactate to accumulate. The lactate:pyruvate ratio (L/P) is the critical discriminator: L/P >25 suggests NADH/NAD+ imbalance from respiratory chain dysfunction or PDH deficiency; L/P <25 with elevated lactate is more consistent with secondary tissue hypoxia or non-mitochondrial causes. Succinate, fumarate elevation in urine can support a Krebs cycle enzyme defect. Amino acids (Ala elevation) reflect transamination from pyruvate accumulation.",
    differentials:"Respiratory chain disorders (Complex I–IV), PDHC deficiency, Fumarase deficiency, SSADH",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      const lac=g("UOA","Lactic"), pyr=g("UOA","Pyruvic"), lacPyr=g("UOA","LacPyr");
      const suc=g("UOA","Succinic"), fumar=g("UOA","Fumaric"), ala=g("PAA","Ala");
      if(lacPyr!==null&&lacPyr>25) hit.push({label:"L/P ratio >25 (mitochondrial redox impairment)",specificity:"high"});
      if(lac!==null&&lac>20&&pyr!==null&&pyr>4) hit.push({label:"Lactic ↑↑ + Pyruvic ↑ (PDHC pattern)",specificity:"high"});
      if(lac!==null&&lac>20) hit.push({label:"Lactic aciduria ↑",specificity:"medium"});
      if(suc!==null&&suc>30&&fumar!==null&&fumar>4) hit.push({label:"Succinate + Fumarate ↑ (Krebs cycle involvement)",specificity:"medium"});
      if(ala!==null&&ala>550&&lac!==null&&lac>15) hit.push({label:"Alanine ↑ (pyruvate-derived transamination) + lactic acid ↑",specificity:"medium"});
      return hit.length>=2?{confidence:"definite",hits:hit}:hit.length>=1?{confidence:"probable",hits:hit}:null;
    }
  },

  // ── 10. REMETHYLATION DEFECT PATTERN ──────────────────────
  // Hcy ↑ with Met LOW (or low-normal) = remethylation failure.
  // Distinguishes from CBS (transsulfuration block) where Met is HIGH.
  // Ref: Mudd et al., Am J Hum Genet 2001; Watkins & Rosenblatt, JIMD 2011.
  {
    id:"remethylation_defect",
    name:"Remethylation defect (Hcy↑, Met low)",
    icon:"↔",
    color:"#0891b2",
    bgColor:"#f0f9ff",
    borderColor:"#bae6fd",
    mechanism:"Impaired remethylation of homocysteine → methionine via the methionine synthase (MTR) or MTHFR pathways. Homocysteine accumulates while methionine is depleted or low-normal — this is the biochemical axis that distinguishes remethylation defects (MTHFR, cblC, cblE, cblG) from the transsulfuration block in CBS deficiency (where methionine is HIGH). The Met/Hcy ratio is low in remethylation defects. Methylmalonic acid is elevated in cblC/D (adenosylcobalamin also impaired); MMA is absent in MTHFR/cblE/cblG.",
    differentials:"MTHFR deficiency, cblC (MMACHC), cblD (MMADHC), cblE (MTRR), cblG (MTR)",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      const hcy=g("PAA","Hcy"), met=g("PAA","Met"), metHcy=g("PAA","MetHcy"), mma=g("UOA","MMA");
      if(hcy!==null&&hcy>30&&met!==null&&met<15) hit.push({label:"Hcy↑ + Met low (remethylation impaired)",specificity:"high"});
      if(metHcy!==null&&metHcy<1.5&&hcy!==null&&hcy>20) hit.push({label:"Met/Hcy ratio low (remethylation axis)",specificity:"high"});
      if(hcy!==null&&hcy>20&&mma!==null&&mma>4) hit.push({label:"Hcy↑ + MMA↑ → cobalamin defect (cblC/D)",specificity:"high"});
      if(hcy!==null&&hcy>30&&(met===null||met<20)) hit.push({label:"Isolated Hcy ↑↑ with low/normal Met",specificity:"medium"});
      return hit.length>=2?{confidence:"definite",hits:hit}:hit.length>=1?{confidence:"probable",hits:hit}:null;
    }
  },

  // ── 11. TRANSSULFURATION BLOCK (CBS) PATTERN ─────────────
  // Classic homocystinuria: Hcy ↑↑ AND Met ↑. Both elevated = transsulfuration block.
  {
    id:"transsulfuration_block",
    name:"Transsulfuration block (Hcy↑, Met↑)",
    icon:"↑↑",
    color:"#9333ea",
    bgColor:"#fdf4ff",
    borderColor:"#f0abfc",
    mechanism:"Cystathionine beta-synthase (CBS) catalyses the first step of the transsulfuration pathway (condensation of homocysteine + serine → cystathionine). Deficiency causes both homocysteine and methionine to accumulate (methionine cannot be consumed forward via the CBS reaction, and the remethylation cycle feeds more methionine back from Hcy). This bidirectional accumulation — Hcy ↑↑ AND Met ↑↑ — is the specific biochemical signature distinguishing CBS deficiency from remethylation defects (where Met is LOW). Total Hcy >50 µmol/L in untreated classic CBS; often >100–200 µmol/L.",
    differentials:"CBS deficiency (classic homocystinuria)",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      const hcy=g("PAA","Hcy"), met=g("PAA","Met"), metHcy=g("PAA","MetHcy");
      if(hcy!==null&&hcy>30&&met!==null&&met>45) hit.push({label:"Hcy↑ + Met↑ (transsulfuration block)",specificity:"high"});
      if(metHcy!==null&&metHcy>1.5&&hcy!==null&&hcy>20) hit.push({label:"Met/Hcy ratio preserved/high (CBS pattern)",specificity:"medium"});
      if(hcy!==null&&hcy>50) hit.push({label:"Total Hcy >50 µmol/L (above diagnostic threshold)",specificity:"medium"});
      return hit.length>=2?{confidence:"definite",hits:hit}:hit.length>=1?{confidence:"probable",hits:hit}:null;
    }
  },

  // ── 12. LIVER-FAILURE MIMIC ────────────────────────────────
  // Liver disease causes secondary PAA pattern: Tyr+Phe+Met all elevated,
  // secondary UCD impairment (low Cit/Arg, elevated Gln), secondary MMA.
  // Risk: this mimics multiple genetic diagnoses simultaneously.
  {
    id:"liver_failure_mimic",
    name:"Liver-failure metabolic mimic",
    icon:"⚠",
    color:"#b45309",
    bgColor:"#fff7ed",
    borderColor:"#fed7aa",
    mechanism:"Hepatocellular dysfunction impairs the hepatic enzymes responsible for phenylalanine hydroxylation (PAH), tyrosine catabolism (TAT, HPD), methionine transsulfuration (CBS, MAT I/III), and urea cycle function. The result is simultaneous elevation of Tyr, Phe, Met — creating a pattern that superficially resembles TYR1, PKU, CBS, or UCD. CRITICAL: succinylacetone (SA) is pathognomonic for TYR1 (FAH deficiency) regardless of liver disease, and must be measured whenever this pattern is present.",
    differentials:"Acute liver failure, TYR1 (must exclude with SA), neonatal hepatitis, Wilson disease",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      const tyr=g("PAA","Tyr"), phe=g("PAA","Phe"), met=g("PAA","Met"), gln=g("PAA","Gln");
      const sa=g("UOA","SA");
      if(tyr!==null&&tyr>200&&phe!==null&&phe>100) hit.push({label:"Tyr↑ + Phe↑ (hepatic PAH/TAT impairment)",specificity:"high"});
      if(tyr!==null&&tyr>150&&met!==null&&met>60) hit.push({label:"Tyr↑ + Met↑ (hepatocellular pattern)",specificity:"high"});
      if(tyr!==null&&tyr>200&&phe!==null&&phe>90&&met!==null&&met>45) hit.push({label:"Tyr+Phe+Met all ↑ (liver synthetic failure pattern)",specificity:"high"});
      if(gln!==null&&gln>900&&tyr!==null&&tyr>200) hit.push({label:"Gln↑ + Tyr↑ → secondary UCD + hepatic pattern",specificity:"medium"});
      if(sa!==null&&sa>1) hit.push({label:"⚠ Succinylacetone ↑ → TYR1 (not liver mimic!)",specificity:"high"});
      return hit.length>=2?{confidence:sa!==null&&sa>1?"definite":"definite",hits:hit}:hit.length>=1?{confidence:"probable",hits:hit}:null;
    }
  },

  // ── 13. PRIMARY CARNITINE DEFICIENCY PATTERN ─────────────
  // Distinct from secondary depletion: ALL carnitine species are very low
  // (no acylcarnitine accumulation because FAO is also limited by substrate delivery).
  {
    id:"primary_carnitine_def",
    name:"Primary carnitine deficiency (transport defect)",
    icon:"↓↓",
    color:"#065f46",
    bgColor:"#f0fdf4",
    borderColor:"#86efac",
    mechanism:"OCTN2 (SLC22A5) transporter deficiency prevents cellular carnitine uptake. Both free carnitine (C0) and total carnitine are depleted in plasma (<5 µmol/L in severe cases). Unlike secondary carnitine depletion, specific acylcarnitines are NOT disproportionately elevated — the absence of a specific acylcarnitine accumulation pattern alongside profound carnitine depletion is the key discriminating feature. Cardiomyopathy is the primary clinical presentation; responds dramatically to carnitine supplementation.",
    differentials:"Primary carnitine deficiency (OCTN2/SLC22A5 mutation)",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      const carFree=g("CAR","CarFree"), carTotal=g("CAR","CarTotal"), c0=g("AC","C0");
      const c3=g("AC","C3"), c8=g("AC","C8"), c14_1=g("AC","C14_1");
      const noSpecificAccum=(c3===null||c3<=3.5)&&(c8===null||c8<=0.3)&&(c14_1===null||c14_1<=0.16);
      if(carFree!==null&&carFree<10&&noSpecificAccum) hit.push({label:"Free carnitine critically low (<10 µmol/L) without specific acyl accumulation",specificity:"high"});
      if(carTotal!==null&&carTotal<15&&noSpecificAccum) hit.push({label:"Total carnitine low without dominant acylcarnitine",specificity:"high"});
      if(c0!==null&&c0<10&&noSpecificAccum) hit.push({label:"C0 critically low — primary transport defect",specificity:"high"});
      return hit.length>=1?{confidence:hit.length>=2?"definite":"probable",hits:hit}:null;
    }
  },

  // ── 14. PHENYLALANINE HYDROXYLASE AXIS PATTERN ───────────
  // Phe/Tyr ratio: the fundamental BH4/PAH axis. Captures both PKU and BH4 disorders.
  {
    id:"phe_tyr_axis",
    name:"Phenylalanine hydroxylase axis disruption",
    icon:"↑",
    color:"#1d4ed8",
    bgColor:"#eff6ff",
    borderColor:"#bfdbfe",
    mechanism:"The Phe→Tyr conversion requires PAH enzyme + BH4 cofactor. Elevation of the Phe/Tyr ratio above 3 indicates impaired PAH function (whether due to PAH mutation or BH4 deficiency). Ratio >10 is characteristic of untreated classic PKU and most BH4 disorders. Important: a raised Phe/Tyr ratio alone cannot distinguish classic PKU from BH4 disorders — BH4 disorders cause identical PAA patterns but require urine pterin profiling and DHPR assay for differentiation.",
    differentials:"PKU (PAH), PTPS (PTS), DHPR (QDPR), GTPCH I (GCH1), SR deficiency (SPR)",
    detect(ev, ap){
      const g=(panel,id)=>{const v=parseFloat(ev[panel]?.[id]);return isNaN(v)?null:v;};
      const hit=[];
      const phe=g("PAA","Phe"), tyr=g("PAA","Tyr"), pheTyr=g("PAA","PheTyr");
      if(pheTyr!==null&&pheTyr>10) hit.push({label:"Phe/Tyr ratio >10 (classic PKU / BH4 deficiency range)",specificity:"high"});
      if(pheTyr!==null&&pheTyr>3&&pheTyr<=10) hit.push({label:"Phe/Tyr ratio 3–10 (mild-moderate hyperphenylalaninemia)",specificity:"medium"});
      if(phe!==null&&phe>600) hit.push({label:"Phe >600 µmol/L (untreated classic PKU range)",specificity:"high"});
      if(phe!==null&&phe>90&&tyr!==null&&tyr<40) hit.push({label:"Phe↑ + Tyr↓ (PAH axis impaired)",specificity:"medium"});
      return hit.length>=2?{confidence:"definite",hits:hit}:hit.length>=1?{confidence:"probable",hits:hit}:null;
    }
  },

];

function detectPatterns(enrichedValues, activePanels){
  return BIOCHEMICAL_PATTERNS
    .map(p=>{
      try{
        const result=p.detect(enrichedValues,activePanels);
        if(!result) return null;
        return {...p, confidence:result.confidence, hits:result.hits};
      }catch(e){ return null; }
    })
    .filter(Boolean);
}

// ─── CLINICAL CONTEXT PRIORS ─────────────────────────────────────
// Pre-test probability weights per clinical context.
// Values are relative log-prior adjustments (0 = no effect; positive = boost; negative = attenuate).
// Rationale: in a referred symptomatic patient the prior differs substantially from population NBS.
// Source: Rinaldo et al., Eur J Pediatr 2008; Turgeon et al., JIMD 2014.
// These shift the final score but are bounded so a strong biochemical signal always wins.
const CLINICAL_CONTEXTS = [
  {id:"acute_symptomatic", label:"Acute encephalopathy / decompensation",
   note:"Highest prior for rapidly fatal disorders — UCDs, OAs, MSUD, FAO crisis",
   priors:{OTC:0.6,CPS1:0.5,NAGS:0.4,CITR1:0.5,ASA_AC:0.4,ARG1:0.2,HHH:0.3,CAVA:0.3,
           MSUD:0.6,PA:0.5,MMA:0.5,IVA:0.4,GA2:0.4,MCD:0.3,
           MCAD:0.3,VLCAD:0.3,LCHAD:0.3,CPT2:0.3,
           PKU:-0.4,CBS:-0.3,TYR1:-0.2}},
  {id:"nbs_referral", label:"NBS referral (asymptomatic newborn)",
   note:"Population NBS context — all disorders present equally until biochemistry discriminates",
   priors:{}},
  {id:"developmental_regression", label:"Developmental regression / neurological deterioration",
   note:"Raises prior for CBS, CDG, MTHFR, CBLC, lysosomal — lowers acute-crisis OAs",
   priors:{CBS:0.4,MTHFR:0.4,CBLE:0.4,CBLC:0.4,NKH:0.3,
           GABAT:0.3,SSADH:0.3,MAT1A:0.2,GLULSYN:0.3,
           PA:-0.3,MMA:-0.3,IVA:-0.3,OTC:-0.2}},
  {id:"cardiomyopathy_myopathy", label:"Cardiomyopathy / myopathy / rhabdomyolysis",
   note:"FAO disorders dominate; secondary carnitine important",
   priors:{VLCAD:0.6,LCHAD:0.6,CPT2:0.5,PCD:0.5,MCAD:0.2,
           GA2:0.4,MMA:0.2,PA:0.2}},
  {id:"liver_disease", label:"Liver disease / cholestasis",
   note:"TYR1, CITR2, GAMT, CDG-Ia; Wilson mimics on PAA",
   priors:{TYR1:0.6,CITR2:0.4,GNMT:0.3,MAT1A:0.2,PA:0.1,MMA:0.1}},
  {id:"hypoglycaemia_fao", label:"Hypoglycaemia / hypoketotic hypoglycaemia",
   note:"FAO disorders, HI-HA (SCHAD), ketolysis defects",
   priors:{MCAD:0.6,VLCAD:0.5,LCHAD:0.4,CPT1:0.4,CPT2:0.4,SCHAD:0.5,
           BKT:0.3,HMGCL:0.3,PCD:0.3}},
];
const CLINICAL_CONTEXT_MAP = Object.fromEntries(CLINICAL_CONTEXTS.map(c=>[c.id,c]));

function applyContextPrior(score, disorderId, contextId){
  if(!contextId) return score;
  const ctx=CLINICAL_CONTEXT_MAP[contextId];
  if(!ctx) return score;
  const adj=ctx.priors[disorderId]??0;
  if(adj===0) return score;
  // Additive log-prior shift; bounded to ±0.25 so biochemistry always dominates
  return Math.max(0, Math.min(1, score + Math.sign(adj)*Math.min(Math.abs(adj),0.25)*score*0.6));
}

function runAnalysis(values, activeModifiers=[], learnedWeights=null, clinicalContext=null, ageMonths=null){
  const suppMap=buildSuppressionMap(activeModifiers);
  // Compute cross-panel ratios (require data from multiple panels)
  const crossPanel={};
  const _c3=parseFloat(values.AC?.C3); const _gly=parseFloat(values.PAA?.Gly);
  if(!isNaN(_c3)&&_c3>0&&!isNaN(_gly)&&_gly>0) crossPanel.C3Gly=String(_c3/_gly);
  const enrichedValues={
    ...values,
    AC: {...values.AC,...computeAcRatios(values.AC)},
    PAA:{...values.PAA,...computePaaRatios(values.PAA),...crossPanel},
    UOA:{...values.UOA,...computeUoaRatios(values.UOA)},
  };
  const ap=new Set(Object.entries(enrichedValues).filter(([,p])=>Object.values(p).some(v=>v!=="")).map(([k])=>k));
  const raw=DISORDERS.map(d=>scoreDisorder(d,enrichedValues,ap,suppMap,learnedWeights,ageMonths)).filter(Boolean);
  // Apply clinical context prior adjustment (step 2: additive log-prior shift)
  const r=raw.map(d=>({...d, score:applyContextPrior(d.score,d.id,clinicalContext)}))
             .sort((a,b)=>b.score-a.score);
  const patterns=detectPatterns(enrichedValues,ap);
  if(!r.length) return{results:[],patterns};
  const mx=r[0].score;
  const results=r.map(x=>({...x,
    warnings:getDisorderWarnings(activeModifiers,x.id),
    relativePct:mx>0?(x.score/mx)*100:0,
    lrProduct:scoreLRProduct(x)}));
  return{results,patterns};
}

// ─── LR PRODUCT SCORER ───────────────────────────────────────
// Computes a naive-Bayes likelihood ratio product for a disorder.
// LR_i = P(x_i | disease) / P(x_i | healthy)
//   = (matchScore + ε) / (1 − matchScore + ε)   [bounded odds ratio proxy]
// This gives the score a direct statistical interpretation:
//   LR_product > 10  → strong evidence
//   LR_product > 100 → very strong evidence
// Source: Norris et al., J Inherit Metab Dis 2007; Turgeon et al., JIMD 2014.
// NOTE: LR is computed only for analytes that were entered AND are abnormal in the
// expected direction. Missing analytes are excluded (uninformative under naive Bayes).
function scoreLRProduct(disorderResult){
  const eps=0.02;
  let logLR=0; let n=0;
  for(const s of disorderResult.supporting){
    const ms=s.rawMatchScore??s.matchScore;
    if(ms<=0) continue; // analyte normal → LR_i ≈ 1, no information
    const lr=(ms+eps)/(1-ms+eps);
    logLR+=Math.log(lr);
    n++;
  }
  if(n===0) return null;
  return {lrProduct: Math.exp(logLR), logLR, nAnalytes:n};
}

// ─── LEARNING ENGINE ─────────────────────────────────────────
function isAbnormalInDir(val,analyte,dir){
  if(dir==="high") return val>analyte.hi*0.8;
  if(dir==="low")  return analyte.lo>0&&val<analyte.lo*1.2;
  return false;
}

function computeLearnedWeights(trainingExamples){
  const confirmed=trainingExamples.filter(ex=>ex.confirmedDxId);
  if(confirmed.length===0) return {};
  const result={};
  for(const disorder of DISORDERS){
    result[disorder.id]={};
    for(const sig of disorder.signature){
      const analyte=ANALYTE_MAP[sig.id]; if(!analyte) continue;
      const hasVal=ex=>{const v=ex.values?.[sig.panel]?.[sig.id];return v!==""&&v!=null&&v!==undefined&&!isNaN(parseFloat(v));};
      const posEx=confirmed.filter(ex=>ex.confirmedDxId===disorder.id&&hasVal(ex));
      const negEx=confirmed.filter(ex=>ex.confirmedDxId!==disorder.id&&hasVal(ex));
      const nPos=posEx.length,nNeg=negEx.length;
      if(nPos<2){result[disorder.id][sig.id]={adjustedWeight:sig.weight,lr:null,nPos,nNeg,alpha:0};continue;}
      const countAbn=arr=>arr.filter(ex=>{const v=parseFloat(ex.values[sig.panel][sig.id]);return !isNaN(v)&&isAbnormalInDir(v,analyte,sig.direction);}).length;
      const sens=(countAbn(posEx)+0.5)/(nPos+1);
      const fp=nNeg>0?(countAbn(negEx)+0.5)/(nNeg+1):0.5;
      const lr=Math.min(20,Math.max(0.05,sens/fp));
      const lrMult=Math.min(3.0,Math.max(0.2,Math.log2(lr)+1));
      const alpha=Math.min(1,(Math.min(nPos,8)/8)*(nNeg>0?Math.min(nNeg,4)/4:0.3));
      result[disorder.id][sig.id]={adjustedWeight:sig.weight*(1-alpha)+sig.weight*lrMult*alpha,lr,nPos,nNeg,alpha,sensitivity:sens,falsePos:fp};
    }
  }
  return result;
}

// ─── UTILS ───────────────────────────────────────────────────
function initValues(){return{PAA:Object.fromEntries(PAA_ANALYTES.map(a=>[a.id,""])),UOA:Object.fromEntries(UOA_ANALYTES.map(a=>[a.id,""])),AC:Object.fromEntries(AC_ANALYTES.map(a=>[a.id,""])),CAR:Object.fromEntries(CAR_ANALYTES.map(a=>[a.id,""])),UAG:Object.fromEntries(UAG_ANALYTES.map(a=>[a.id,""])),MISC:Object.fromEntries(MISC_ANALYTES.map(a=>[a.id,""]))}}
function mergeExtracted(base,ext){const o={PAA:{...base.PAA},UOA:{...base.UOA},AC:{...base.AC},CAR:{...base.CAR},UAG:{...base.UAG},MISC:{...base.MISC}};for(const[p,vs]of Object.entries(ext||{})){if(!o[p])continue;for(const[id,v]of Object.entries(vs||{})){if(id in o[p]&&v!=null&&v!=="")o[p][id]=String(v);}}return o;}
function countEntered(v){return Object.values(v).reduce((s,p)=>s+Object.values(p).filter(x=>x!=="").length,0);}
const PANEL_ANALYTES={PAA:PAA_ANALYTES,UOA:UOA_ANALYTES,AC:AC_ANALYTES,CAR:CAR_ANALYTES,UAG:UAG_ANALYTES,MISC:MISC_ANALYTES};
function countAbnormal(v){let n=0;for(const[p,pv]of Object.entries(v)){const al=PANEL_ANALYTES[p];if(!al)continue;for(const a of al){const x=parseFloat(pv[a.id]);if(!isNaN(x)&&(x>a.hi||(a.lo>0&&x<a.lo)))n++;}}return n;}
function confLevel(s){if(s>=0.4)return{label:"HIGH",cls:"text-red-700 bg-red-50 border-red-300"};if(s>=0.2)return{label:"MODERATE",cls:"text-amber-700 bg-amber-50 border-amber-300"};if(s>=0.08)return{label:"LOW",cls:"text-blue-700 bg-blue-50 border-blue-300"};return{label:"TRACE",cls:"text-slate-500 bg-slate-50 border-slate-200"};}
const CAT_CLR={Aminoacidopathy:"#1d4ed8","Urea Cycle Disorder":"#7c3aed","Organic Acidemia":"#b45309","Fatty Acid Oxidation":"#065f46","Creatine Disorder":"#0e7490","BH4 Disorder":"#be185d","Mitochondrial Disorder":"#6d28d9","Carbohydrate Disorder":"#c2410c","Purine/Pyrimidine":"#4338ca"};
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function fmtDate(iso){const d=new Date(iso);return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})+" "+d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});}
function lrColor(lr){if(lr===null||lr===undefined)return"text-slate-400";if(lr>=5)return"text-emerald-700 font-bold";if(lr>=2)return"text-emerald-600";if(lr>=1)return"text-slate-500";if(lr>=0.5)return"text-amber-600";return"text-red-600 font-bold";}
function wtDelta(adj,prior){const d=(adj-prior)/prior;if(Math.abs(d)<0.05)return null;return{pct:Math.round(d*100),up:d>0};}

// ─── CLAUDE EXTRACTION ───────────────────────────────────────
async function extractWithClaude(content){
  const sys=`You are a metabolic laboratory data extractor. Extract all analyte numeric values from a lab report.
Return ONLY valid JSON — no markdown fences, no explanation, no preamble.
Format exactly: {"PAA":{"Phe":450},"UOA":{"MMA":120},"AC":{"C3":8.5}}
Only include analytes with explicit numeric values in the source. Omit all others.
Map analyte names/abbreviations to these exact IDs:\n${ANALYTE_ID_REFERENCE}`;
  const res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[{role:"user",content}]})});
  const data=await res.json();
  if(data.error)throw new Error(data.error.message);
  const text=data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}
async function extractFromImage(b64,mt){return extractWithClaude([{type:"image",source:{type:"base64",media_type:mt,data:b64}},{type:"text",text:"Extract all metabolite values from this lab report image."}]);}
async function extractFromText(txt){return extractWithClaude([{type:"text",text:"Extract all metabolite values from this lab data:\n\n"+txt}]);}
function xlsxToText(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>{try{const wb=XLSX.read(new Uint8Array(e.target.result),{type:"array"});const ws=wb.Sheets[wb.SheetNames[0]];res(XLSX.utils.sheet_to_csv(ws));}catch(e){rej(e);}};r.onerror=()=>rej(new Error("Read failed"));r.readAsArrayBuffer(file);});}
function toB64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result.split(",")[1]);r.onerror=()=>rej(new Error("Read failed"));r.readAsDataURL(file);});}

// ─── STORAGE ─────────────────────────────────────────────────
// ─── STORAGE ─────────────────────────────────────────────────
// Supabase client initialised at module level.
// VITE_ env vars are replaced by Vite at BUILD TIME — they must be set
// in the Vercel environment before the build runs, not just at runtime.
const _sbUrl  = import.meta.env.VITE_SUPABASE_URL  ?? "";
const _sbKey  = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const sb = _sbUrl && _sbKey ? createClient(_sbUrl, _sbKey) : null;

// Exposed so the UI can show a storage health indicator
const STORAGE_MODE = sb ? "supabase" : "memory";

// In-memory fallback — data lost on page reload
const _mem = {};
const mem = {
  get: async (k)    => _mem[k] ? {value:_mem[k]} : null,
  set: async (k,v)  => { _mem[k]=v; return {value:v}; },
  del: async (k)    => { delete _mem[k]; return {deleted:true}; },
};

async function dbGet(key){
  if(!sb) return mem.get(key);
  const {data,error}=await sb.from("cases").select("data").eq("id",key).maybeSingle();
  if(error) throw new Error(error.message);
  if(!data) return null;
  return {value:JSON.stringify(data.data)};
}
async function dbSet(key,value){
  if(!sb) return mem.set(key,value);
  const parsed=JSON.parse(value);
  const {error}=await sb.from("cases").upsert({id:key,data:parsed,updated_at:new Date()});
  if(error) throw new Error(`Supabase write failed for key "${key}": ${error.message}`);
  return {value};
}
async function dbDel(key){
  if(!sb){ delete _mem[key]; return {deleted:true}; }
  const {error}=await sb.from("cases").delete().eq("id",key);
  if(error) throw new Error(error.message);
  return {deleted:true};
}

// Strip notes and other large fields from results before saving.
// Notes are already compiled into the bundle — storing them in the DB is
// redundant and can push individual case payloads over 200KB.
function stripResultsForStorage(results){
  if(!results) return null;
  return results.map(r=>({
    id:r.id, name:r.name, category:r.category, gene:r.gene,
    score:r.score, rawScore:r.rawScore, relativePct:r.relativePct,
    intraCoverage:r.intraCoverage,
    supporting:r.supporting?.map(s=>({id:s.id,panel:s.panel,direction:s.direction,
      val:s.val,matchScore:s.matchScore,xLimit:s.xLimit,effectiveWeight:s.effectiveWeight})),
    missing:r.missing?.map(s=>({id:s.id,panel:s.panel})),
    notRun:r.notRun?.map(s=>({id:s.id,panel:s.panel})),
    warnings:r.warnings,
  }));
}

// Re-hydrate stripped results with full disorder data (notes, signature etc.)
function hydrateResults(stripped){
  if(!stripped) return null;
  return stripped.map(r=>{
    const d=DISORDER_MAP[r.id];
    return d?{...d,...r}:r;
  });
}

const CASES_KEY="mdx_cases_v2", TRAINING_KEY="mdx_training_v1";

async function loadList(){
  try{ const r=await dbGet(CASES_KEY); return r?JSON.parse(r.value):[]; }
  catch(e){ console.warn("loadList error:",e.message); return []; }
}
async function persistCase(c){
  const list=await loadList();
  const idx=list.findIndex(x=>x.id===c.id);
  const summ={id:c.id,label:c.label,age:c.age??null,sex:c.sex??null,
    clinicalNote:c.clinicalNote??null,createdAt:c.createdAt,panels:c.panels,
    enteredCount:c.enteredCount,abnormalCount:c.abnormalCount,
    topDx:c.results?.[0]?.name??null,confirmedDxId:c.confirmedDxId??null,
    modifierCount:(c.activeModifiers||[]).length,reportSigned:c.reportSigned??false};
  if(idx>=0)list[idx]=summ; else list.unshift(summ);
  // Strip notes from results to keep payload small
  const caseToStore={...c, results:stripResultsForStorage(c.results)};
  await dbSet(CASES_KEY,JSON.stringify(list));
  await dbSet("mdx_case_"+c.id,JSON.stringify(caseToStore));
}
async function loadFullCase(id){
  try{
    const r=await dbGet("mdx_case_"+id);
    if(!r) return null;
    const c=JSON.parse(r.value);
    // Re-hydrate results with full disorder data
    return {...c, results:hydrateResults(c.results)};
  }catch(e){ console.warn("loadFullCase error:",e.message); return null; }
}
async function removeCase(id){
  const list=await loadList();
  await dbSet(CASES_KEY,JSON.stringify(list.filter(x=>x.id!==id)));
  await dbDel("mdx_case_"+id);
}
async function loadTraining(){
  try{ const r=await dbGet(TRAINING_KEY); return r?JSON.parse(r.value):[]; }
  catch(e){ console.warn("loadTraining error:",e.message); return []; }
}
async function upsertTrainingExample(ex){
  const list=await loadTraining();
  const idx=list.findIndex(x=>x.caseId===ex.caseId);
  if(idx>=0)list[idx]=ex; else list.push(ex);
  await dbSet(TRAINING_KEY,JSON.stringify(list));
}
async function removeTrainingExample(caseId){
  const list=await loadTraining();
  await dbSet(TRAINING_KEY,JSON.stringify(list.filter(x=>x.caseId!==caseId)));
}

// ─── UI PRIMITIVES ───────────────────────────────────────────
function Spinner({s=4}){return(<svg className={`w-${s} h-${s} animate-spin`} viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>);}

// ─── MODIFIER PANEL ───────────────────────────────────────────
function ModifierPanel({active, onChange}){
  const [open, setOpen]=useState(active.length>0);
  const toggle=id=>onChange(active.includes(id)?active.filter(x=>x!==id):[...active,id]);
  const groups=Object.entries(MODIFIER_GROUPS);
  return(
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button onClick={()=>setOpen(o=>!o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span className="text-sm font-semibold text-slate-700">Clinical context &amp; modifiers</span>
          {active.length>0&&(
            <div className="flex items-center gap-1">
              {active.map(id=>{
                const m=MODIFIER_MAP[id];
                return <span key={id} className="text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded">{m?.icon??id}</span>;
              })}
            </div>
          )}
          {active.length===0&&<span className="text-xs text-slate-400">None active — scoring uses unadjusted priors</span>}
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open&&(
        <div className="border-t border-slate-100 px-4 py-3 space-y-4">
          {groups.map(([groupId,groupLabel])=>(
            <div key={groupId}>
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">{groupLabel}</div>
              <div className="flex flex-wrap gap-2">
                {MODIFIERS.filter(m=>m.group===groupId).map(m=>{
                  const on=active.includes(m.id);
                  return(
                    <button key={m.id} onClick={()=>toggle(m.id)}
                      title={m.detail}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all
                        ${on?"bg-orange-600 border-orange-600 text-white shadow-sm":"bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-700"}`}>
                      <span className="font-mono text-[10px] opacity-70">{m.icon}</span>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {active.length>0&&(
            <div className="space-y-1.5">
              {active.map(id=>{
                const m=MODIFIER_MAP[id];
                return(
                  <div key={id} className="text-[11px] text-slate-500 bg-orange-50 border border-orange-100 rounded-lg px-3 py-1.5 leading-relaxed flex items-start gap-1.5">
                    <span className="text-orange-400 mt-0.5 flex-shrink-0">⚠</span>
                    <span><strong className="text-orange-700">{m.label}:</strong> {m.suppressed.length} analyte signal{m.suppressed.length!==1?"s":""} attenuated in scoring. Disorder-specific warnings shown in results.</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DROP ZONE ───────────────────────────────────────────────
function DropZone({onFile,busy}){
  const [drag,setDrag]=useState(false);
  const ref=useRef();
  const go=f=>{if(f&&!busy)onFile(f);};
  return(
    <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);go(e.dataTransfer.files[0]);}}
      onClick={()=>!busy&&ref.current.click()}
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-8 px-6 cursor-pointer select-none transition-all
        ${drag?"border-blue-400 bg-blue-50":"border-slate-200 bg-slate-50 hover:border-slate-300"}
        ${busy?"pointer-events-none opacity-60":""}`}>
      <input ref={ref} type="file" accept=".png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv" className="hidden" onChange={e=>go(e.target.files[0])}/>
      {busy?(
        <><Spinner s={7}/><span className="text-sm text-slate-400 font-medium">Extracting via Claude…</span></>
      ):(
        <>
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">Drop file or click to upload</p>
            <p className="text-xs text-slate-400 mt-0.5">Upload each report separately — PAA, UOA and/or AC · Screenshot · Excel · CSV</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── VALUE CELL ──────────────────────────────────────────────
function ValueCell({analyte,value,onChange,highlighted}){
  const v=parseFloat(value);
  const hi=!isNaN(v)&&v>analyte.hi, lo=!isNaN(v)&&analyte.lo>0&&v<analyte.lo;
  const hasVal=!isNaN(v)&&value!=="";
  return(
    <div className={`rounded-xl p-2.5 border transition-all ${highlighted?"ring-2 ring-blue-400 border-blue-300":hi?"border-rose-200":lo?"border-sky-200":"border-slate-200"}`}
      style={{background: hi?"#fff5f5":lo?"#f0f9ff":highlighted?"#eff6ff":"white", boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div className="text-[10px] font-bold text-slate-500 truncate mb-1.5 uppercase tracking-wide" title={analyte.name}>{analyte.name}</div>
      <input type="number" value={value} step="any" min="0" placeholder="—"
        onChange={e=>onChange(analyte.id,e.target.value)}
        style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight: hasVal?"700":"400"}}
        className={`w-full rounded-lg border px-2 py-1.5 text-sm outline-none transition-colors
          ${hi?"border-rose-300 bg-rose-50 text-rose-700":lo?"border-sky-300 bg-sky-50 text-sky-700":"border-slate-200 bg-slate-50 focus:border-blue-400 focus:bg-white text-slate-800"}`}/>
      <div className="flex justify-between mt-1 text-[9px] text-slate-300">
        <span className="font-mono">{analyte.lo>0?`${analyte.lo}–${analyte.hi}`:`≤${analyte.hi}`} <span className="not-italic">{analyte.unit}</span></span>
        {hi&&<span className="text-rose-500 font-black">↑{(v/analyte.hi).toFixed(1)}×</span>}
        {lo&&<span className="text-sky-500 font-black">↓{(v/analyte.lo).toFixed(2)}×</span>}
      </div>
    </div>
  );
}

// ─── RESULT CARD ─────────────────────────────────────────────
// ─── ANALYTE DISTRIBUTION STRIP ──────────────────────────────
// Renders a single analyte's log-scale distribution with:
//   • Student-t density curve derived from ANALYTE_DIST parameters
//   • Normal reference interval shaded
//   • Patient value marked as a vertical line
// No training data required — uses published [lo,hi] and ANALYTE_DIST tail params.
// Scientific basis: log-normal metabolite distributions (Schulze 2003, Marquardt 2012).
const STRIP_W=260, STRIP_H=52, STRIP_PAD=6;

function _studentTPDF(t,df){
  // Unnormalized Student-t PDF value at t given df
  return Math.pow(1+t*t/Math.max(df,1),-(df+1)/2);
}

function AnalyteDistributionStrip({analyte,value}){
  const d=ANALYTE_DIST[analyte.id]??DEFAULT_DIST;
  const lo=analyte.lo>0?analyte.lo:analyte.hi*0.05;
  const hi=analyte.hi;
  if(!hi||hi<=0) return null;

  // Log-space display bounds: 0.02×lo to 12×hi (clamped to sane values)
  const logMin=Math.log(Math.max(lo*0.05, hi*0.001, 1e-9));
  const logMax=Math.log(hi*12);
  const logRange=logMax-logMin;
  if(logRange<=0) return null;

  const toX=logV=>STRIP_PAD+(Math.log(Math.max(logV,1e-9))-logMin)/logRange*(STRIP_W-2*STRIP_PAD);
  const xLo=toX(lo), xHi=toX(hi);
  const xVal=toX(Math.max(value,1e-9));

  // Distribution center = geometric mean of reference interval in log-space
  const logCenter=(Math.log(lo)+Math.log(hi))/2;

  // Build PDF curve: 80 points across display range
  const pts=[];
  for(let i=0;i<=80;i++){
    const logX=logMin+logRange*i/80;
    const dist=logX-logCenter;
    const scale=dist>=0?(d.hS??1.0):(d.lS??0.8);
    const df=dist>=0?(d.hDf??4.0):(d.lDf??4.0);
    const density=_studentTPDF(dist/Math.max(scale,1e-9),df);
    pts.push([STRIP_PAD+i/80*(STRIP_W-2*STRIP_PAD), density]);
  }
  const maxD=Math.max(...pts.map(p=>p[1]),0.01);
  const curveTop=8, curveBot=STRIP_H-14;
  const svgPts=pts.map(([x,dn])=>`${x.toFixed(1)},${(curveBot-(dn/maxD)*(curveBot-curveTop)).toFixed(1)}`).join(' ');

  // Colour coding
  const isHigh=value>hi;
  const isLow=analyte.lo>0&&value<analyte.lo;
  const markColor=!isHigh&&!isLow?"#22c55e":
    isHigh?(value>hi*3?"#dc2626":value>hi*1.5?"#f59e0b":"#fbbf24"):
           (value<lo*0.3?"#dc2626":value<lo*0.6?"#f59e0b":"#fbbf24");

  // x-axis tick labels: lo, hi, value (if outside)
  const fmtV=v=>v>=100?v.toFixed(0):v>=10?v.toFixed(1):v.toFixed(2);

  return(
    <div className="flex items-center gap-2 py-1 group hover:bg-slate-50 rounded-lg px-1 -mx-1">
      {/* Analyte label */}
      <div className="w-36 flex-shrink-0 text-right">
        <div className={`text-xs font-semibold truncate ${isHigh||isLow?"text-slate-800":"text-slate-500"}`}
             title={analyte.name}>{analyte.name}</div>
        <div className={`text-[10px] font-mono font-bold`} style={{color:markColor}}>
          {fmtV(value)} <span className="font-normal text-slate-400">{analyte.unit}</span>
        </div>
      </div>

      {/* SVG strip */}
      <svg width={STRIP_W} height={STRIP_H} className="flex-shrink-0 overflow-visible">
        {/* Background */}
        <rect x={STRIP_PAD} y={curveTop} width={STRIP_W-2*STRIP_PAD} height={curveBot-curveTop} fill="#f8fafc" rx="2"/>

        {/* Normal range shading */}
        <rect x={Math.max(xLo,STRIP_PAD)} y={curveTop}
              width={Math.min(xHi,STRIP_W-STRIP_PAD)-Math.max(xLo,STRIP_PAD)}
              height={curveBot-curveTop} fill="#dcfce7" opacity="0.7"/>

        {/* Ref limit tick lines */}
        <line x1={xLo} y1={curveTop} x2={xLo} y2={curveBot} stroke="#86efac" strokeWidth="1" strokeDasharray="2,2"/>
        <line x1={xHi} y1={curveTop} x2={xHi} y2={curveBot} stroke="#86efac" strokeWidth="1" strokeDasharray="2,2"/>

        {/* Density curve */}
        <polyline points={svgPts} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round"/>

        {/* Patient value */}
        <line x1={xVal} y1={curveTop-2} x2={xVal} y2={curveBot+2} stroke={markColor} strokeWidth="2"/>
        <circle cx={xVal} cy={curveBot+2} r="3" fill={markColor}/>

        {/* Axis labels */}
        <text x={xLo} y={STRIP_H-1} textAnchor="middle" fontSize="8" fill="#86efac">{fmtV(lo)}</text>
        <text x={xHi} y={STRIP_H-1} textAnchor="middle" fontSize="8" fill="#86efac">{fmtV(hi)}</text>
      </svg>

      {/* Fold-change annotation */}
      <div className="w-12 flex-shrink-0 text-left">
        {isHigh&&<span className="text-[10px] font-mono font-bold" style={{color:markColor}}>↑{(value/hi).toFixed(1)}×</span>}
        {isLow&&<span className="text-[10px] font-mono font-bold" style={{color:markColor}}>↓{(value/lo).toFixed(2)}×</span>}
      </div>
    </div>
  );
}

// ─── PROFILE TAB ─────────────────────────────────────────────
function ProfileTab({values}){
  const panelOrder=["PAA","UOA","AC","CAR","UAG","MISC"];
  const panelLabels={PAA:"Plasma Amino Acids",UOA:"Urine Organic Acids",AC:"Acylcarnitines",CAR:"Carnitine Panel",UAG:"Urine Acylglycines",MISC:"Miscellaneous"};

  // For each panel, collect analytes that have a numeric value entered
  const sections=panelOrder.map(p=>{
    const al=PANEL_ANALYTES[p]??[];
    const entered=al.filter(a=>{const v=parseFloat(values[p]?.[a.id]);return !isNaN(v)&&v>0;});
    return {panel:p, label:panelLabels[p], analytes:entered};
  }).filter(s=>s.analytes.length>0);

  if(sections.length===0){
    return <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Enter analyte values to see distributions.</div>;
  }

  // Count abnormal for each panel
  const abnCount=p=>PANEL_ANALYTES[p]?.filter(a=>{
    const v=parseFloat(values[p]?.[a.id]);
    return !isNaN(v)&&(v>a.hi||(a.lo>0&&v<a.lo));
  }).length??0;

  return(
    <div className="max-w-screen-lg mx-auto px-5 py-4 space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-700">Analyte Distribution Profile</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Each strip shows the log-normal reference distribution (Student-t tail model) with the normal range shaded green.
            Your value is the vertical line — colour indicates deviation.
            Scale parameters: Schulze 2003, Marquardt 2012.
          </p>
        </div>
      </div>

      {sections.map(({panel,label,analytes})=>(
        <div key={panel} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">{label}</span>
            <span className="text-[10px] text-slate-400">{analytes.length} entered</span>
            {abnCount(panel)>0&&<span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
              {abnCount(panel)} abnormal
            </span>}
            <span className="ml-auto text-[10px] text-slate-300 italic">log scale · green band = reference interval</span>
          </div>
          <div className="px-4 py-2 divide-y divide-slate-50">
            {analytes.map(a=>(
              <AnalyteDistributionStrip key={a.id} analyte={a} value={parseFloat(values[panel][a.id])}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultCard({result,rank}){
  const [open,setOpen]=useState(rank<=3);
  const conf=confLevel(result.score);
  const cc=CAT_CLR[result.category]??"#64748b";
  const hasLearnedAdjust=result.supporting.some(m=>m.lrInfo&&m.lrInfo.lr!==null);
  const hasSuppressed=result.supporting.some(m=>m.suppFactor<1);
  const warningCount=result.warnings?.length??0;
  const hasNegEvidence=result.negPoss>0&&result.negEarned>0;
  const hasConcordance=(result.concordantPanels||0)>=2;
  return(
    <div className={`border rounded-xl overflow-hidden bg-white ${warningCount>0?"border-orange-200":"border-slate-200"}`}>
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors">
        <span className="text-sm font-black text-slate-200 w-5 flex-shrink-0 text-right">{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-800">{result.name}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${conf.cls}`}>{conf.label}</span>
            {hasLearnedAdjust&&<span className="text-[10px] text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded font-semibold">model-adjusted</span>}
            {hasSuppressed&&<span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded font-semibold">⚠ context-modified</span>}
            {hasNegEvidence&&<span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold" title={`${result.negEarned.toFixed(1)}/${result.negPoss.toFixed(1)} negative-evidence weight: normal analytes in run panels reduce this score`}>↓ neg-evidence</span>}
            {result.ceilingHit&&<span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-semibold" title={`Score capped at ${Math.round(result.analyticalCeiling*100)}% — real-world analytic sensitivity is limited for this disorder (Oglesbee 2017)`}>⚠ sensitivity-capped</span>}
            {warningCount>0&&<span className="text-[10px] text-orange-700 font-bold">· {warningCount} warning{warningCount>1?"s":""}</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white" style={{background:cc}}>{result.category}</span>
            <span className="text-[10px] text-slate-400 font-mono">{result.gene}</span>
            {[...new Set(result.supporting.filter(m=>m.rawMatchScore>0).map(m=>m.panel))].map(p=>(
              <span key={p} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{p}</span>
            ))}
            {hasConcordance&&(
              <span className="text-[10px] font-semibold text-blue-600" title={`Positive evidence from ${result.concordantPanels} panels — concordance bonus applied (+${result.concordantPanels>=3?"20":"10"}%)`}>✦ cross-panel ×{result.concordantPanels}</span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 w-24 text-right">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{width:`${result.relativePct}%`,background:cc}}/>
          </div>
          <div className="text-right text-[10px] text-slate-400 mt-0.5">{(result.score*100).toFixed(0)} pts</div>
          {result.lrProduct&&result.lrProduct.lrProduct>=2&&(
            <div className="text-right text-[10px] font-mono font-bold mt-0.5"
              style={{color:result.lrProduct.lrProduct>=100?"#15803d":result.lrProduct.lrProduct>=10?"#d97706":"#64748b"}}
              title={`Naive Bayes LR product across ${result.lrProduct.nAnalytes} abnormal analyte(s). LR >10 = strong evidence; >100 = very strong. Source: Norris et al. JIMD 2007.`}>
              LR {result.lrProduct.lrProduct>=1000?"≥1000":result.lrProduct.lrProduct>=100?result.lrProduct.lrProduct.toFixed(0):result.lrProduct.lrProduct.toFixed(1)}×
            </div>
          )}
        </div>
        <svg className={`w-4 h-4 text-slate-300 flex-shrink-0 transition-transform ${open?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open&&(
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          {/* Context warnings — shown first and prominently */}
          {result.warnings?.length>0&&(
            <div className="space-y-1.5">
              {result.warnings.map((w,i)=>(
                <div key={i} className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  <span className="text-orange-500 flex-shrink-0 mt-0.5 text-sm">⚠</span>
                  <div className="text-xs leading-relaxed">
                    <span className="font-bold text-orange-700">{w.modifier}: </span>
                    <span className="text-orange-800">{w.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Supporting markers */}
          {result.supporting.length>0&&(
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Supporting Markers</div>
              <div className="flex flex-wrap gap-1.5">
                {result.supporting.map((m,i)=>{
                  const delta=wtDelta(m.effectiveWeight,m.priorWeight);
                  const suppressed=m.suppFactor<1;
                  const suppressedMuch=m.suppFactor<0.3;
                  return(
                    <div key={i}
                      title={suppressed?m.suppInfo?.reasons?.map(r=>`${r.modifier}: ${r.reason}`).join("\n"):""}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border cursor-default
                        ${suppressedMuch?"bg-orange-50 border-orange-200 text-orange-700 opacity-70":
                          suppressed?"bg-orange-50 border-orange-200 text-orange-700":
                          m.rawMatchScore>0?"bg-emerald-50 border-emerald-200 text-emerald-800":
                          "bg-slate-50 border-slate-200 text-slate-500"}`}>
                      {suppressed&&<span className="text-orange-400 text-[10px]">⚠</span>}
                      <span className="text-[9px] font-bold opacity-50">{m.panel}</span>
                      <span className="font-semibold">{m.analyte.name}</span>
                      <span className="font-mono text-[10px]">{m.val}</span>
                      {m.xLimit&&<span className={`font-bold text-[10px] ${m.direction==="high"?"text-rose-600":"text-sky-600"}`}>{m.direction==="high"?"↑":"↓"}{m.xLimit.toFixed(1)}×</span>}
                      {m.covariateZ!=null&&<span className={`font-mono text-[9px] px-1 rounded ${Math.abs(m.covariateZ)>2?"bg-violet-100 text-violet-700 font-bold":"text-violet-500"}`} title="CLIR-style covariate-adjusted Z-score (age/weight)">Z={m.covariateZ>0?"+":""}{m.covariateZ.toFixed(1)}</span>}
                      {m.rawMatchScore>0.3&&!suppressed&&<span className="text-emerald-500 font-black text-[10px]">★</span>}
                      {suppressed&&<span className="text-[9px] text-orange-500">({Math.round(m.suppFactor*100)}%)</span>}
                      {delta&&<span className={`text-[9px] font-bold ${delta.up?"text-violet-600":"text-rose-500"}`}>{delta.up?"▲":"▼"}{Math.abs(delta.pct)}%</span>}
                    </div>
                  );
                })}
              </div>
              {hasSuppressed&&(
                <p className="text-[10px] text-orange-600 mt-1.5">⚠ Suppressed markers — hover for modifier reason. Percentage shows retained signal weight.</p>
              )}
            </div>
          )}

          {result.missing?.length>0&&(
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-amber-400 mb-1">Not Entered — Panel Was Run</div>
              <div className="flex flex-wrap gap-1">
                {result.missing.map((m,i)=><span key={i} className="text-[11px] px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-700">{m.analyte.name}{m.weight===3&&<span className="ml-0.5 font-bold">★</span>}</span>)}
              </div>
            </div>
          )}
          {result.notRun?.length>0&&(
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300 mb-1">Panel Not Performed</div>
              <div className="flex flex-wrap gap-1">
                {result.notRun.map((m,i)=><span key={i} className="text-[11px] px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-400">{m.analyte.name}<span className="text-[9px] ml-1 text-slate-300">({m.panel})</span>{m.weight===3&&<span className="ml-0.5 text-slate-300">★</span>}</span>)}
              </div>
            </div>
          )}
          {/* Isobaric species resolution — structured decision trees (Miller 2021, Rinaldo 2008) */}
          {(()=>{
            const trees=[];
            const hasC4=result.supporting.some(m=>m.id==="C4"&&m.rawMatchScore>0);
            const hasC5=result.supporting.some(m=>m.id==="C5"&&m.rawMatchScore>0);
            const hasC5OH=result.supporting.some(m=>m.id==="C5OH"&&m.rawMatchScore>0);
            const hasC5DC=result.supporting.some(m=>m.id==="C5DC"&&m.rawMatchScore>0);
            const getUAG=id=>{const s=result.supporting.find(m=>m.panel==="UAG"&&m.id===id);return s?{val:s.val,abn:s.rawMatchScore>0}:null;};

            if(hasC5){
              const ivg=getUAG("IVG"), mbg=getUAG("2MBG");
              const steps=[];
              steps.push({q:"Is patient on pivalic acid drug (pivampicillin, pivmecillinam, cefditoren pivoxil)?",a:"Yes → C5 is pivaloylcarnitine ARTIFACT. No further workup needed.",status:"check"});
              if(ivg||mbg){
                if(ivg?.abn) steps.push({q:"UAG isovalerylglycine (IVG)",a:`${ivg.val} — ELEVATED → Isovaleric acidemia (IVA)`,status:"positive"});
                else if(ivg) steps.push({q:"UAG isovalerylglycine (IVG)",a:`${ivg.val} — normal → IVA excluded`,status:"negative"});
                if(mbg?.abn) steps.push({q:"UAG 2-methylbutyrylglycine (2MBG)",a:`${mbg.val} — ELEVATED → SBCAD (ACADSB deficiency)`,status:"positive"});
                else if(mbg) steps.push({q:"UAG 2-methylbutyrylglycine (2MBG)",a:`${mbg.val} — normal → SBCAD excluded`,status:"negative"});
                if(!ivg?.abn&&!mbg?.abn&&ivg&&mbg) steps.push({q:"Both IVG and 2MBG normal",a:"→ Pivalic acid artifact or transient finding. Consider repeat off medication.",status:"resolved"});
              } else {
                steps.push({q:"Urine acylglycines (UAG) not available",a:"ORDER UAG: isovalerylglycine (IVG) distinguishes IVA; 2-methylbutyrylglycine distinguishes SBCAD",status:"needed"});
              }
              trees.push({key:"c5",title:"C5 acylcarnitine — isobaric species resolution",species:"Isovalerylcarnitine (IVA) vs 2-methylbutyrylcarnitine (SBCAD) vs pivaloylcarnitine (drug artifact)",steps});
            }
            if(hasC4){
              const ibg=getUAG("IBG"), bg=getUAG("BG");
              const steps=[];
              if(ibg||bg){
                if(ibg?.abn) steps.push({q:"UAG isobutyrylglycine (IBG)",a:`${ibg.val} — ELEVATED → IBD (ACAD8 deficiency)`,status:"positive"});
                else if(ibg) steps.push({q:"UAG isobutyrylglycine (IBG)",a:`${ibg.val} — normal → IBD excluded`,status:"negative"});
                if(bg?.abn) steps.push({q:"UAG butyrylglycine (BG)",a:`${bg.val} — ELEVATED → SCAD (ACADS deficiency)`,status:"positive"});
                else if(bg) steps.push({q:"UAG butyrylglycine (BG)",a:`${bg.val} — normal → SCAD excluded`,status:"negative"});
              } else {
                steps.push({q:"Urine acylglycines (UAG) not available",a:"ORDER UAG: isobutyrylglycine distinguishes IBD; butyrylglycine distinguishes SCAD",status:"needed"});
              }
              steps.push({q:"Alternative: LC-MS/MS with chromatographic separation",a:"Resolves butyrylcarnitine from isobutyrylcarnitine directly",status:"check"});
              trees.push({key:"c4",title:"C4 acylcarnitine — isobaric species resolution",species:"Butyrylcarnitine (SCAD) vs isobutyrylcarnitine (IBD)",steps});
            }
            if(hasC5OH){
              const steps=[];
              steps.push({q:"Check biotinidase activity (serum/DBS)",a:"Low → Biotinidase deficiency / MCD. Normal → proceed below",status:"check"});
              steps.push({q:"UOA: 3-methylcrotonylglycine (MCG) and 3-OH-isovaleric acid (3OHIV)",a:"Both elevated → 3-MCC deficiency. Only 3OHIV → non-specific.",status:"check"});
              steps.push({q:"UOA: tiglylglycine (TG) + 2-methylacetoacetic acid (2MAA)",a:"Both elevated → BKT (beta-ketothiolase). TG alone → HSD10 disease (X-linked)",status:"check"});
              steps.push({q:"UOA: 3-OH-3-methylglutaric acid (HMG)",a:"Elevated → HMG-CoA lyase deficiency",status:"check"});
              trees.push({key:"c5oh",title:"C5-OH acylcarnitine — isobaric species resolution",species:"3-OH-isovalerylcarnitine (3-MCC/MCD) vs 3-OH-2-methylbutyrylcarnitine (BKT/HSD10) vs 3-methylglutarylcarnitine (HMG-CoA lyase)",steps});
            }
            if(hasC5DC){
              const steps=[];
              steps.push({q:"UOA: glutaric acid (GA) + 3-OH-glutaric acid (3OHGA)",a:"Both elevated → GA-I (glutaric aciduria type I). Note: ~25% are low excreters",status:"check"});
              steps.push({q:"C5DC may also be 3-OH-decanoylcarnitine (C10-OH)",a:"If GA/3OHGA normal → consider C10-OH assignment; not pathological in most cases",status:"check"});
              trees.push({key:"c5dc",title:"C5-DC acylcarnitine — isobaric species resolution",species:"Glutarylcarnitine (GA-I) vs 3-OH-decanoylcarnitine",steps});
            }
            if(!trees.length) return null;
            const statusColor={positive:"bg-rose-50 border-rose-200 text-rose-800",negative:"bg-emerald-50 border-emerald-200 text-emerald-800",needed:"bg-amber-50 border-amber-200 text-amber-800",check:"bg-blue-50 border-blue-200 text-blue-800",resolved:"bg-slate-50 border-slate-200 text-slate-700"};
            return(
              <div className="space-y-2">
                {trees.map(t=>(
                  <div key={t.key} className="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">{t.title}</div>
                    <div className="text-[10px] text-blue-600 mb-2 italic">{t.species}</div>
                    <div className="space-y-1">
                      {t.steps.map((s,i)=>(
                        <div key={i} className={`flex items-start gap-2 rounded px-2 py-1.5 border text-xs ${statusColor[s.status]||statusColor.check}`}>
                          <span className="font-bold flex-shrink-0">{s.status==="positive"?"⊕":s.status==="negative"?"⊖":s.status==="needed"?"▸":s.status==="resolved"?"✓":"→"}</span>
                          <div><span className="font-semibold">{s.q}</span> <span className="ml-1">{s.a}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          {result.flags?.length>0&&(
            <div className="space-y-1">
              {result.flags.map((f,i)=>(
                <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
                  <span className="text-amber-500 flex-shrink-0 mt-0.5 text-sm">⚠</span>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">{f.text}</p>
                </div>
              ))}
            </div>
          )}
          {hasNegEvidence&&(
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <span className="text-emerald-600 flex-shrink-0 mt-0.5 text-sm">↓</span>
              <p className="text-xs text-emerald-900 leading-relaxed">
                <span className="font-semibold">Negative evidence applied:</span> {result.negEarned.toFixed(1)}/{result.negPoss.toFixed(1)} negative-evidence weight accounted for — analytes expected to be abnormal in competing diagnoses are within reference range, reducing this score proportionally.
              </p>
            </div>
          )}
          <div className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">{result.notes}</div>
          {(()=>{
            const ct=CONFIRMATORY[result.id];
            if(!ct||result.score<0.08) return null;
            return(
              <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Recommended confirmatory testing</div>
                {ct.molecular&&<div className="text-xs text-slate-700"><span className="font-semibold text-violet-800">Molecular:</span> {ct.molecular}</div>}
                {ct.enzyme&&<div className="text-xs text-slate-700"><span className="font-semibold text-violet-800">Enzyme:</span> {ct.enzyme}</div>}
                {ct.biochem&&<div className="text-xs text-slate-700"><span className="font-semibold text-violet-800">Biochemical:</span> {ct.biochem}</div>}
                {ct.specimen&&<div className="text-xs text-slate-500"><span className="font-semibold">Specimen:</span> {ct.specimen}</div>}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── MODEL VIEW ──────────────────────────────────────────────
function ModelView({learnedWeights,trainingExamples}){
  const [filter,setFilter]=useState("all");
  const confirmed=trainingExamples.filter(ex=>ex.confirmedDxId);
  const dxCounts={};
  for(const ex of confirmed) dxCounts[ex.confirmedDxId]=(dxCounts[ex.confirmedDxId]||0)+1;
  const disorders=DISORDERS.filter(d=>{
    if(filter==="trained") return (dxCounts[d.id]||0)>=2;
    if(filter==="pending") return (dxCounts[d.id]||0)>0&&(dxCounts[d.id]||0)<2;
    return true;
  });
  return(
    <div className="max-w-screen-xl mx-auto px-5 py-5 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Model</h2>
          <p className="text-xs text-slate-400 mt-0.5">{confirmed.length} confirmed {confirmed.length===1?"case":"cases"} · {Object.keys(dxCounts).length} disorders with training data</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {[["all","All"],["trained","Active"],["pending","Pending"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${filter===v?"bg-white text-slate-800 shadow-sm":"text-slate-500 hover:text-slate-700"}`}>{l}</button>
          ))}
        </div>
      </div>
      {confirmed.length===0?(
        <div className="border border-dashed border-slate-200 rounded-xl py-12 text-center">
          <div className="text-sm font-semibold text-slate-500">No confirmed diagnoses yet</div>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Open a case, analyze, and confirm the diagnosis in the Results tab.</p>
        </div>
      ):(
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-black text-slate-800">{confirmed.length}</div>
              <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 mt-0.5">Confirmed cases</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-black text-violet-700">{Object.keys(dxCounts).length}</div>
              <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 mt-0.5">Disorders trained</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-black text-emerald-700">{DISORDERS.filter(d=>(dxCounts[d.id]||0)>=2).length}</div>
              <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 mt-0.5">Active (n≥2)</div>
            </div>
          </div>
          <div className="space-y-2">
            {disorders.map(d=>{
              const n=dxCounts[d.id]||0, dLW=learnedWeights[d.id]||{}, cc=CAT_CLR[d.category]??"#64748b", isActive=n>=2;
              return(
                <div key={d.id} className={`bg-white border rounded-xl px-4 py-3 ${isActive?"border-slate-200":"border-slate-100"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800">{d.name}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white" style={{background:cc}}>{d.category}</span>
                        {isActive&&<span className="text-[10px] text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded font-semibold">active</span>}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isActive?"bg-violet-100 text-violet-700":"bg-slate-100 text-slate-500"}`}>n={n}</span>
                  </div>
                  {isActive&&(
                    <div className="flex flex-wrap gap-1.5">
                      {d.signature.map(sig=>{
                        const analyte=ANALYTE_MAP[sig.id]; if(!analyte) return null;
                        const lw=dLW[sig.id], delta=lw?wtDelta(lw.adjustedWeight,sig.weight):null;
                        return(
                          <div key={sig.id} className={`text-[11px] px-2 py-1 rounded-lg border flex items-center gap-1.5 ${delta?.up?"bg-emerald-50 border-emerald-200":delta&&!delta.up?"bg-red-50 border-red-200":"bg-slate-50 border-slate-200"}`}>
                            <span className="font-semibold text-slate-600">{analyte.name}</span>
                            {lw?.lr!=null&&<span className={`font-mono text-[10px] ${lrColor(lw.lr)}`}>LR={lw.lr.toFixed(1)}</span>}
                            {delta&&<span className={`text-[10px] font-bold ${delta.up?"text-emerald-700":"text-red-600"}`}>{delta.up?"▲":"▼"}{Math.abs(delta.pct)}%</span>}
                            {lw?.nPos>0&&<span className="text-[9px] text-slate-300">({lw.nPos}+/{lw.nNeg}-)</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!isActive&&n>0&&<p className="text-[11px] text-slate-400">{n} confirmation{n!==1?"s":""} recorded — needs ≥2 to activate weight adjustments.</p>}
                </div>
              );
            })}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-700">How learning works:</strong> Each confirmed case contributes to an empirical LR⁺ per analyte-disorder pair (Laplace-smoothed). The blend between prior and empirical weights scales with evidence count: full empirical requires ≥8 positive and ≥4 negative examples. <strong className="text-slate-700">▲/▼</strong> shows weight shift from the literature prior.
          </div>
        </>
      )}
    </div>
  );
}

// ─── MONITORING GUIDANCE KB ──────────────────────────────────
// ─── CONFIRMATORY / SECOND-TIER TESTING RECOMMENDATIONS ─────
// Per-disorder recommended confirmatory tests when score reaches MODERATE or HIGH.
// Based on ACMG technical standards: Sharer 2018, Gallagher 2018, Miller 2021.
const CONFIRMATORY = {
  PKU:    {molecular:"PAH gene sequencing",enzyme:null,biochem:"BH4 loading test (sapropterin); urine pterins + DHPR activity to exclude BH4 disorders",specimen:"Plasma (fasting preferred)"},
  PTPS:   {molecular:"PTS gene sequencing",enzyme:"DHPR activity (dried blood spot)",biochem:"Urine pterins (biopterin, neopterin); prolactin + HVA/5-HIAA in CSF",specimen:"Urine + CSF + DBS"},
  DHPR:   {molecular:"QDPR gene sequencing",enzyme:"DHPR activity (dried blood spot)",biochem:"Urine pterins; CSF neurotransmitters (HVA, 5-HIAA, 3-O-methyldopa)",specimen:"DBS + urine + CSF"},
  MSUD:   {molecular:"BCKDHA, BCKDHB, DBT gene panel",enzyme:"BCKD activity (fibroblasts/lymphocytes)",biochem:"Alloisoleucine confirmation by LC-MS/MS or amino acid analyser",specimen:"Plasma + fibroblasts"},
  CBS:    {molecular:"CBS gene sequencing",enzyme:"CBS activity (fibroblasts/liver)",biochem:"Total homocysteine (reducing agent method); plasma Met, B12, folate",specimen:"Plasma (EDTA, on ice)"},
  TYR1:   {molecular:"FAH gene sequencing",enzyme:"FAH activity (DBS/lymphocytes)",biochem:"Urine succinylacetone (SA) — pathognomonic; plasma alpha-fetoprotein",specimen:"Urine + plasma"},
  NKH:    {molecular:"GLDC, AMT, GCSH gene panel",enzyme:"GCS activity (liver biopsy)",biochem:"CSF glycine + simultaneous plasma glycine → CSF:plasma ratio (>0.08 diagnostic)",specimen:"CSF (pre-valproate) + plasma"},
  CITR1:  {molecular:"ASS1 gene sequencing",enzyme:"ASS activity (fibroblasts)",biochem:"Plasma citrulline >100 µmol/L strongly supports; >1000 = classic",specimen:"Plasma"},
  ASA_AC: {molecular:"ASL gene sequencing",enzyme:"ASL activity (RBC)",biochem:"Urine ASA (argininosuccinic acid) — pathognomonic",specimen:"Plasma + urine"},
  OTC:    {molecular:"OTC gene sequencing (X-linked; carrier females may need functional testing)",enzyme:"OTC activity (liver biopsy — invasive, rarely done)",biochem:"Urine orotic acid (elevated in OTC, normal in CPS1/NAGS); allopurinol loading test in suspected female carriers",specimen:"Urine + plasma"},
  CPS1:   {molecular:"CPS1 gene sequencing",enzyme:"CPS1 activity (liver biopsy)",biochem:"Low/absent citrulline with normal orotic acid distinguishes from OTC",specimen:"Plasma + urine (orotic acid)"},
  PA:     {molecular:"PCCA, PCCB gene panel",enzyme:"PCC activity (fibroblasts/lymphocytes)",biochem:"Urine methylcitric acid + 3-OH-propionic acid; C3/glycine ratio; urine propionylglycine",specimen:"Urine OA + plasma AC + PAA"},
  MMA:    {molecular:"MMUT, MMAA, MMAB gene panel",enzyme:"MCM activity (fibroblasts) + cobalamin complementation studies",biochem:"Urine MMA (quantitative); plasma total Hcy to exclude cblC; vitamin B12 level",specimen:"Urine OA + plasma + serum B12"},
  CBLC:   {molecular:"MMACHC gene sequencing (cblC); MMADHC (cblD)",enzyme:"Cobalamin complementation (fibroblasts)",biochem:"Plasma total Hcy (elevated) + urine MMA (elevated) + low Met — triad diagnostic; ophthalmology exam urgently",specimen:"Plasma + urine + fibroblasts"},
  IVA:    {molecular:"IVD gene sequencing",enzyme:"IVD activity (fibroblasts)",biochem:"Urine isovalerylglycine (UAG) — specific; distinguish C5 isomers by LC-MS/MS",specimen:"Urine acylglycines + plasma AC"},
  GA1:    {molecular:"GCDH gene sequencing",enzyme:"GCDH activity (fibroblasts/leukocytes)",biochem:"Urine 3-OH-glutaric acid (more specific than GA); plasma C5DC; brain MRI (frontotemporal atrophy)",specimen:"Urine OA + plasma AC + MRI"},
  GA2:    {molecular:"ETFA, ETFB, ETFDH gene panel",enzyme:"ETF/ETFDH activity (fibroblasts)",biochem:"Riboflavin trial (100–300 mg/day) for late-onset MADD; urine EMA + multi-chain dicarboxylic acids",specimen:"Urine OA + plasma AC"},
  MCD:    {molecular:"BTD (biotinidase) + HLCS gene panel",enzyme:"Biotinidase activity (serum/DBS) — FIRST test",biochem:"Serum biotinidase activity (quantitative); urine 3-OH-isovaleric acid, 3-methylcrotonylglycine",specimen:"Serum + urine OA"},
  MCAD:   {molecular:"ACADM gene sequencing (c.985A>G accounts for ~80%)",enzyme:"MCAD activity (fibroblasts — rarely needed)",biochem:"Urine hexanoylglycine + suberylglycine (UAG); plasma C8/C10 ratio",specimen:"Urine acylglycines + plasma AC"},
  VLCAD:  {molecular:"ACADVL gene sequencing",enzyme:"VLCAD activity (fibroblasts/lymphocytes); acylcarnitine flux studies",biochem:"Plasma C14:1/C16 ratio; fasting study (supervised, AVOID in acute illness)",specimen:"Plasma AC + fibroblasts"},
  LCHAD:  {molecular:"HADHA gene sequencing (c.1528G>C common mutation)",enzyme:"LCHAD/TFP activity (fibroblasts)",biochem:"Plasma 3-OH-long-chain acylcarnitines; maternal history (AFLP/HELLP); eye exam (retinopathy)",specimen:"Plasma AC + fibroblasts + ophthalmology"},
  CPT1:   {molecular:"CPT1A gene sequencing",enzyme:"CPT1 activity (fibroblasts/lymphocytes)",biochem:"C0/(C16+C18) ratio markedly elevated (>100); fasting study contraindicated unless supervised",specimen:"Plasma AC + fibroblasts"},
  CPT2:   {molecular:"CPT2 gene sequencing",enzyme:"CPT2 activity (fibroblasts/muscle)",biochem:"Elevated long-chain AC (C16, C18:1, C18) with low C0; CK in myopathic form",specimen:"Plasma AC + fibroblasts + CK"},
  PCD:    {molecular:"SLC22A5 gene sequencing",enzyme:null,biochem:"Plasma free AND total carnitine (both profoundly low <5 µmol/L); exclude secondary causes first; fibroblast carnitine uptake study",specimen:"Plasma carnitine + fibroblasts"},
  SCAD:   {molecular:"ACADS gene sequencing (caution: common polymorphisms)",enzyme:"SCAD activity (fibroblasts)",biochem:"Urine EMA — non-specific; C4 on AC; clinical significance uncertain in most NBS-identified cases",specimen:"Urine OA + plasma AC"},
  BKT:    {molecular:"ACAT1 gene sequencing",enzyme:"T2 (mitochondrial thiolase) activity (fibroblasts)",biochem:"Urine tiglylglycine + 2-methylacetoacetic acid (pathognomonic pair); sample DURING or shortly after ketoacidotic episode",specimen:"Urine OA (acute sample) + fibroblasts"},
  HMGCL:  {molecular:"HMGCL gene sequencing",enzyme:"HMG-CoA lyase activity (fibroblasts/leukocytes)",biochem:"Urine 3-OH-3-methylglutaric acid; plasma C6DC (3-methylglutarylcarnitine)",specimen:"Urine OA + plasma AC"},
  SCOT:   {molecular:"OXCT1 gene sequencing",enzyme:"SCOT activity (fibroblasts/leukocytes)",biochem:"Persistent ketosis in fed state; NORMAL organic acids and NORMAL acylcarnitines — diagnosis of exclusion",specimen:"Plasma ketones + fibroblasts"},
  HMGCS2D:{molecular:"HMGCS2 gene sequencing",enzyme:"HMG-CoA synthase 2 activity (liver — rarely available)",biochem:"Hypoketotic hypoglycaemia with NORMAL acylcarnitines; mild dicarboxylic aciduria during crisis",specimen:"Plasma BHB + glucose + AC (during fasting episode)"},
  PDHD:   {molecular:"PDHA1, PDHB, DLAT, DLD, PDHX gene panel",enzyme:"PDH complex activity (fibroblasts/muscle/leukocytes)",biochem:"Blood lactate + pyruvate with L/P ratio; CSF lactate; thiamine trial",specimen:"Plasma (paired L/P) + fibroblasts + CSF"},
  PCDEF:  {molecular:"PC gene sequencing",enzyme:"Pyruvate carboxylase activity (fibroblasts/leukocytes)",biochem:"Plasma amino acids (Gln, Cit elevated in type B); blood lactate + L/P ratio; ammonia",specimen:"Plasma + fibroblasts"},
  ETHE1D: {molecular:"ETHE1 gene sequencing",enzyme:null,biochem:"Urine EMA (very high, 10–1000× ULN); urine thiosulfate (elevated); plasma C4; consider liver transplant evaluation",specimen:"Urine OA + plasma AC"},
  MLYCD:  {molecular:"MLYCD gene sequencing",enzyme:"Malonyl-CoA decarboxylase activity (fibroblasts)",biochem:"Urine malonic acid (markedly elevated); plasma C3-DC (malonylcarnitine); echocardiography (cardiomyopathy)",specimen:"Urine OA + plasma AC + echo"},
  GAMT:   {molecular:"GAMT gene sequencing",enzyme:null,biochem:"Urine guanidinoacetate (GAA) — markedly elevated; plasma GAA elevated; brain MRS (creatine peak absent/reduced)",specimen:"Urine + plasma GAA + brain MRS"},
  MTHFR:  {molecular:"MTHFR gene sequencing (severe deficiency, not common C677T polymorphism)",enzyme:"MTHFR activity (fibroblasts)",biochem:"Total homocysteine (elevated); Met (low); CSF 5-methylTHF (low)",specimen:"Plasma + CSF folate"},
  HHH:    {molecular:"SLC25A15 gene sequencing",enzyme:null,biochem:"Urine homocitrulline (elevated — pathognomonic); urine orotic acid; plasma ornithine markedly elevated",specimen:"Urine amino acids + plasma"},
};

// Per-disorder treatment context, monitoring targets, and analyte-specific
// clinical interpretation for the monitoring report.
const MONITORING_GUIDANCE = {
  PKU: {
    interventions:"Low-phenylalanine diet (Phe-free formula + controlled natural protein). Sapropterin (BH4) in responsive cases (≥30% Phe reduction on loading test). Large neutral amino acid supplementation in some protocols. IMPORTANT: rule out BH4 disorders before commencing PKU dietary management.",
    targets:"Phe target: 120–360 µmol/L (classic PKU, paediatric); 120–600 µmol/L (adults, some guidelines). Tyr should remain in range — low Tyr indicates under-supplementation of formula.",
    analytes:{
      Phe:{good:"Phe within target — dietary control adequate.",hi:"Phe above target — review Phe intake, formula compliance, and protein consumption from natural foods.",lo:"Phe below target — may indicate over-restriction; risk of essential amino acid deficiency."},
      Tyr:{good:"Tyr within range.",lo:"Low Tyr suggests insufficient Phe-free formula intake or inadequate Tyr supplementation — review formula dose.",hi:"Tyr elevated — assess for over-supplementation or secondary cause."},
    },
  },
  PTPS: {
    interventions:"BH4 (sapropterin) 1–10 mg/kg/day (lower dose than PKU BH4-responsiveness — full cofactor replacement). L-dopa/carbidopa (dopamine replacement — start low, titrate slowly). 5-hydroxytryptophan (serotonin precursor). Dietary Phe restriction if BH4 does not fully normalise Phe. Monitor neurotransmitters via CSF HVA/5-HIAA periodically; serum prolactin as surrogate for dopamine adequacy (elevated prolactin = dopamine under-replaced).",
    targets:"Phe: 120–360 µmol/L (paediatric). Tyr: within normal range. CSF HVA and 5-HIAA: within age-appropriate reference ranges. Serum prolactin: within normal range (marker of adequate dopamine replacement). Neurodevelopmental milestones.",
    analytes:{
      Phe:{good:"Phe within target — BH4 dose adequate for PAH activity.",hi:"Phe above target — review BH4 dose and dietary compliance.",lo:"Phe below normal — may indicate over-restriction."},
      Tyr:{good:"Tyr within range — dopamine precursor available.",lo:"Tyr low — review Tyr supplementation and BH4 dose.",hi:"Tyr elevated — review supplementation."},
    },
  },
  DHPR: {
    interventions:"BH4 (sapropterin) + L-dopa/carbidopa + 5-hydroxytryptophan (same as PTPS). FOLINIC ACID supplementation — ESSENTIAL and specific to DHPR deficiency: DHPR maintains folate in active tetrahydro form; its deficiency causes cerebral folate deficiency independent of dietary folate. Standard folic acid is NOT adequate (also needs DHPR for activation in brain). Selegiline (MAO-B inhibitor) may be added. Monitor for white matter changes and basal ganglia calcifications on brain MRI.",
    targets:"Phe: 120–360 µmol/L. CSF HVA/5-HIAA within range. Serum prolactin normal. CSF folate: within normal range (marker of folinic acid adequacy). Annual/biennial brain MRI for white matter and calcification surveillance.",
    analytes:{
      Phe:{good:"Phe within target.",hi:"Phe above target — review BH4 and dietary compliance.",lo:"Phe below normal."},
      Tyr:{good:"Tyr within range.",lo:"Tyr low — review supplementation and BH4.",},
    },
  },
  DRD: {
    interventions:"Levodopa/carbidopa at very low dose (1–3 mg/kg/day) — response is dramatic, sustained, and nearly pathognomonic. Start low to avoid dyskinesias. Lifelong treatment required. Higher doses or adding 5-HTP usually not needed. Clinical response and serum prolactin normalisation monitor adequacy.",
    targets:"Dystonia resolution. Normal gait and motor function. Serum prolactin within normal range. No dyskinesias (sign of over-dosing).",
    analytes:{
      Tyr:{lo:"Tyr mildly low — reflects impaired neuronal tyrosine hydroxylase (brain BH4 deficiency); should not be used alone as a diagnostic marker.",good:"Tyr within range."},
    },
  },
  SR_DEF: {
    interventions:"L-dopa/carbidopa + 5-hydroxytryptophan. BH4 supplementation generally not needed (peripheral Phe normal — hepatic PAH intact). Titrate neurotransmitter precursors against CSF HVA/5-HIAA and serum prolactin. Avoid under-dosing — this disease is frequently under-treated due to diagnostic delay.",
    targets:"Resolution of dystonia and motor symptoms. Diurnal fluctuation should improve with adequate dosing. CSF HVA/5-HIAA normalisation. Serum prolactin within normal range.",
    analytes:{
      Tyr:{lo:"Tyr mildly low — reflects impaired neuronal TH activity (brain-specific BH4 deficiency); standard PAA is a weak marker for this disorder.",good:"Tyr within range."},
    },
  },
  NKH: {
    interventions:"Sodium benzoate (primary — conjugates glycine to hippurate for urinary excretion, reducing plasma glycine; dose 250–750 mg/kg/day in 3–4 divided doses). NMDA receptor antagonists: dextromethorphan (5–35 mg/kg/day, widely used) or ketamine — reduce seizures and improve tone by blocking glycine-potentiated NMDA excitotoxicity; these target the neurological mechanism, not the metabolic defect. Pyridoxine (B6) trial (GCS requires PLP cofactor). Folinic acid considered in some patients (GCS block impairs methylene-THF generation, potentially affecting folate cycle). Standard antiepileptic drugs for seizures. IMPORTANT: sodium benzoate reduces plasma glycine effectively but has limited effect on CSF glycine — neurotransmitter effects persist despite plasma normalisation.",
    targets:"Plasma glycine target: <75–120 µmol/L (institutional variation; some centres target <75 µmol/L). CSF glycine monitoring — should decrease with treatment but often remains elevated. EEG: aim to suppress burst-suppression pattern. Seizure frequency reduction. Neurodevelopmental monitoring — primary outcome measure.",
    analytes:{
      Gly:{good:"Glycine within target on sodium benzoate — metabolic control adequate. Note: plasma control does not guarantee CSF normalisation.",hi:"Glycine above target — review sodium benzoate dose and compliance. Check for intercurrent illness (catabolic states release glycine from collagen/muscle). Correlate with seizure control.",lo:"Glycine below normal — possible sodium benzoate over-dosing; risk of glycine deficiency; review dose."},
      Ser:{lo:"Serine mildly low — may reflect reduced methylene-THF generation from impaired GCS; consider folinic acid supplementation.",good:"Serine within range."},
      Thr:{hi:"Threonine mildly elevated — minor secondary finding from impaired glycine catabolism (threonine→glycine pathway backup); not a primary treatment target.",good:"Threonine within range."},
    },
  },
  MSUD: {
    interventions:"BCAA-restricted diet with MSUD formula (Leu-free or low-BCAA). Isoleucine and valine supplementation commonly required. Thiamine trial in thiamine-responsive variant. Liver transplant curative.",
    targets:"Leu target: 75–200 µmol/L. Ile and Val should remain within normal range. AlloIle should be undetectable.",
    analytes:{
      Leu:{good:"Leucine within target range — BCAA restriction effective.",hi:"Leucine above target — risk of neurological decompensation; review diet, check for intercurrent illness triggering catabolism.",lo:"Leucine below target — risk of essential BCAA deficiency; may need to relax restriction."},
      Ile:{good:"Isoleucine within range.",lo:"Isoleucine low — commonly seen with aggressive Leu restriction; supplement Ile as needed.",hi:"Isoleucine elevated — adjust individual BCAA intake."},
      Val:{good:"Valine within range.",lo:"Valine low — supplement Val as needed.",hi:"Valine elevated — adjust intake."},
      AlloIle:{good:"Alloisoleucine undetectable — consistent with good metabolic control.",hi:"Alloisoleucine detectable — signals active BCKDC substrate accumulation; review control urgently."},
    },
  },
  CBS: {
    interventions:"Pyridoxine (B6) trial — ~50% are B6-responsive. B6-responsive: high-dose pyridoxine. B6-non-responsive: methionine-restricted diet + betaine (homocysteine remethylation), folate, B12.",
    targets:"Total homocysteine target: <50 µmol/L (ideally <30 µmol/L). Methionine should remain within normal range.",
    analytes:{
      Hcy:{good:"Homocysteine within target — treatment effective.",hi:"Homocysteine above target — increased thrombotic and lens dislocation risk; review B6/betaine dose and dietary compliance.",lo:"Homocysteine below normal — ensure Met not excessively restricted."},
      Met:{good:"Methionine within range.",hi:"Methionine elevated — review dietary Met intake and betaine dose (betaine remethylation raises Met).",lo:"Methionine low — may reflect over-restriction; risk of Met deficiency."},
    },
  },
  TYR1: {
    interventions:"Nitisinone (NTBC) — blocks 4-HPPD upstream of succinylacetone. Tyrosine- and phenylalanine-restricted diet required alongside NTBC (since 4-HPPD block accumulates Tyr). Liver transplant in refractory cases.",
    targets:"Succinylacetone (SA) should be undetectable on NTBC. Tyr target on NTBC: 200–500 µmol/L is typical (NTBC causes secondary Tyr elevation — excessive Tyr accumulation causes ocular/skin toxicity). AFP normalisation is a key treatment endpoint.",
    analytes:{
      SA:{good:"Succinylacetone undetectable — NTBC dose adequate, FAH pathway effectively blocked.",hi:"Succinylacetone detectable on NTBC — critically important finding; indicates NTBC under-dosing or compliance failure. Check NTBC levels and renal tubular function urgently."},
      Tyr:{good:"Tyrosine within expected on-treatment range (elevation is expected and required on NTBC).",hi:"Tyrosine markedly elevated on NTBC — risk of oculocutaneous toxicity (pseudodendritic keratitis, painful photophobia); review dietary Phe/Tyr restriction.",lo:"Tyrosine below expected — assess dietary restriction; very low Tyr on NTBC suggests over-restriction."},
      Met:{hi:"Methionine elevated — may reflect residual or recurrent liver disease on NTBC; check LFTs and AFP.",good:"Methionine within range — liver function appears stable."},
    },
  },
  ARG1: {
    interventions:"Protein restriction (natural protein limit based on tolerance) + arginine-free/low formula. Nitrogen scavengers: sodium benzoate and/or sodium phenylacetate/phenylbutyrate (reduces nitrogen load). Dietary management aims to prevent arginine accumulation while maintaining adequate nitrogen balance. Note: arginine is required for creatine biosynthesis (via GATM) — arginine restriction on treatment may reduce creatine availability; monitor serum creatinine as a surrogate for total body creatine stores.",
    targets:"Arginine target: 50–200 µmol/L (some centres target <150 µmol/L). Glutamine reflects ammonia burden — target within normal range. Alanine normalisation reflects overall nitrogen balance. BCAAs should remain within low-normal range (dietary restriction effects expected but deficiency should be avoided). Serum creatinine should remain within low-normal range.",
    analytes:{
      Arg:{good:"Arginine within target — nitrogen restriction effective.",hi:"Arginine above target — increased risk of neurological toxicity and progressive spastic diplegia; review protein restriction and scavenger dosing.",lo:"Arginine low — risk of arginine deficiency; titrate protein restriction carefully."},
      Gln:{good:"Glutamine within range — ammonia burden adequately controlled.",hi:"Glutamine elevated — marker of ongoing hyperammonemia; review nitrogen scavenger dose, protein intake, and check for intercurrent illness-driven catabolism.",lo:"Glutamine low — non-specific; monitor nutritional status."},
      Ala:{good:"Alanine within range — overall nitrogen balance adequate.",hi:"Alanine elevated — reflects nitrogen excess or catabolism; correlate with ammonia level and clinical status.",lo:"Alanine low — possible over-restriction or inadequate caloric intake."},
      Leu:{good:"Leucine within range.",lo:"Leucine below normal — consistent with protein restriction therapy; ensure not excessive. Monitor for BCAA deficiency syndrome.",hi:"Leucine elevated — review protein intake."},
      Ile:{lo:"Isoleucine below normal — protein restriction effect; monitor for deficiency.",good:"Within range.",hi:"Elevated — review intake."},
    },
  },
  GAMT: {
    interventions:"Creatine monohydrate supplementation (primary treatment — restores brain and muscle creatine). Ornithine supplementation (reduces GATM activity via product inhibition, decreasing GAA production and its neurotoxic accumulation). Arginine restriction (reduces GATM substrate, decreasing GAA production). All three in combination optimise biochemical control.",
    targets:"Guanidinoacetate (GAA) normalisation on urine testing. Brain creatine peak restoration on MRS. Seizure frequency reduction. Creatine/creatinine normalisation in plasma.",
    analytes:{
      Arg:{lo:"Arginine low — intentional on arginine-restricted diet to reduce GAA production; monitor for deficiency.",good:"Arginine within low-normal range — restriction appropriate."},
      Gly:{good:"Glycine within range.",hi:"Glycine elevated — non-specific; may reflect reduced consumption via GATM reaction."},
    },
  },
  GATM: {
    interventions:"Creatine monohydrate supplementation — highly effective; full neurological recovery possible with early treatment. No dietary restriction required (GAA does not accumulate in GATM deficiency).",
    targets:"Brain creatine restoration on MRS (primary endpoint). Developmental milestones. Plasma creatinine normalisation.",
    analytes:{
      Arg:{lo:"Arginine low — may reflect reduced GATM activity effect on arginine consumption; generally mild.",good:"Arginine within range."},
    },
  },
  OTC: {
    interventions:"Protein restriction + essential amino acid supplementation. Nitrogen scavengers: sodium benzoate, sodium phenylbutyrate, or glycerol phenylbutyrate. Citrulline or arginine supplementation (arginine essential downstream of the block). Liver transplant curative in severe cases.",
    targets:"Glutamine target: within normal range (primary ammonia marker). Orotic acid (UOA) should be suppressed on treatment. Citrulline should normalise with supplementation. Arginine should be maintained in normal range.",
    analytes:{
      Gln:{good:"Glutamine within range — ammonia load well-controlled.",hi:"Glutamine elevated — ongoing hyperammonemia; review scavenger dosing and protein intake. Urgent ammonia level if markedly elevated.",lo:"Glutamine low — monitor nutritional status."},
      Ala:{good:"Alanine within range.",hi:"Alanine elevated — nitrogen excess; review dietary management.",lo:"Alanine low — review caloric and protein intake."},
      Cit:{lo:"Citrulline low — ensure adequate citrulline supplementation (citrulline is the preferred nitrogen donor supplement in OTC deficiency).",good:"Citrulline within range — supplementation adequate.",hi:"Citrulline elevated — review supplementation dose."},
      Arg:{lo:"Arginine low — arginine is essential downstream of the OTC block; supplement as indicated.",good:"Arginine within range.",hi:"Arginine elevated — review supplementation."},
    },
  },
  CPS1: {
    interventions:"Protein restriction + essential amino acid supplementation. N-carbamylglutamate (NCG/carglumic acid) — specifically effective as NAGS activator in NAGS deficiency and sometimes useful in CPS1. Nitrogen scavengers. Citrulline supplementation (essential downstream of block).",
    targets:"Glutamine as ammonia marker — target within range. Citrulline target: low-normal to normal with supplementation. Arginine supplementation required.",
    analytes:{
      Gln:{good:"Glutamine within range.",hi:"Glutamine elevated — hyperammonemia; review management and check plasma ammonia.",lo:"Low — monitor nutritional status."},
      Cit:{lo:"Citrulline low — expected in CPS1 (no carbamyl phosphate for OTC); maintain supplementation.",good:"Citrulline within supplemented range.",hi:"Citrulline elevated — review supplementation."},
    },
  },
  PA: {
    interventions:"Protein restriction (especially odd-chain precursors: Ile, Val, Met, Thr) + propionic acid-free formula. Biotin supplementation (PCC requires biotin as cofactor). Metronidazole to reduce gut propionate production. Carnitine supplementation. Liver or liver+kidney transplant in severe cases.",
    targets:"C3 acylcarnitine target: <5 µmol/L ideally; <10 µmol/L acceptable. Methylcitric acid on UOA should be suppressed. Glycine within range. Carnitine (C0) should be maintained within normal range with supplementation.",
    analytes:{
      Gly:{good:"Glycine within range.",hi:"Glycine elevated — non-specific secondary finding in PA; monitor but less specific than C3/methylcitric for control assessment.",},
      Ala:{good:"Alanine within range.",hi:"Alanine elevated — may reflect intercurrent illness or excess nitrogen; correlate with clinical status.",},
    },
  },
  MMA: {
    interventions:"Protein restriction (Ile, Val, Met, Thr restriction) + MMA-free/low formula. B12 supplementation (high-dose hydroxocobalamin) — essential for cblA/cblB subtypes; minimal response in mut⁰. Carnitine supplementation. Metronidazole. Renal monitoring (MMA nephropathy). Liver or liver+kidney transplant.",
    targets:"MMA (urine) target: <500 mmol/mol Cr (ideally lower). C3 target: <5 µmol/L. Glycine within range. Renal function monitoring essential.",
    analytes:{
      Gly:{good:"Glycine within range.",hi:"Glycine elevated — non-specific; monitor.",},
    },
  },
  CBLC: {
    interventions:"Hydroxocobalamin (IM or SC) — high-dose, lifelong. Betaine (for homocysteine remethylation). Folate (5-methylTHF). Carnitine. Methionine supplementation if low. Early treatment critical for retinal and neurological outcomes.",
    targets:"Homocysteine target: <50 µmol/L (ideally <30 µmol/L). MMA (urine) should normalise with hydroxocobalamin. Methionine should be maintained within normal range.",
    analytes:{
      Hcy:{good:"Homocysteine within target — hydroxocobalamin dose effective.",hi:"Homocysteine above target — review hydroxocobalamin dose, frequency, and compliance. Check folate and B12 levels. Increased risk of retinopathy progression.",lo:"Homocysteine low — optimal or over-supplemented."},
      Met:{lo:"Methionine low — ensure methionine supplementation adequate; deficiency worsens neurological outcome.",good:"Methionine within range.",hi:"Methionine elevated — review betaine dose (betaine remethylation raises Met)."},
    },
  },
  GA1: {
    interventions:"Low-lysine AND low-tryptophan diet + lysine/tryptophan-free amino acid mixture (both lysine and tryptophan catabolise to glutaryl-CoA — both must be restricted). L-carnitine supplementation (secondary carnitine depletion from C5DC). EMERGENCY PROTOCOL at every febrile illness (temperature >38.5°C): immediately increase caloric intake as glucose, add emergency carnitine dose, seek medical review — preventing striatal injury during the vulnerable window (age 3–36 months) is the primary treatment goal. Diet compliance is the major risk factor for insidious-onset dystonia.",
    targets:"C5DC (glutarylcarnitine) target: <0.5 µmol/L. Glutaric acid (urine) suppressed (note: low-excreter variant may show minimal GA even untreated — C5DC is a more reliable monitoring marker). Carnitine (C0) within normal range with supplementation. Key endpoint: no striatal injury, normal neurodevelopment.",
    analytes:{},
  },
  PDE: {
    interventions:"Pyridoxine (B6) — primary therapy, controls seizures in ~90%. Dose: 15–30 mg/kg/day (neonates); 200 mg/day (older children). Triple therapy (better neurodevelopmental outcome): pyridoxine + dietary lysine restriction (reduces AASA/P6C production) + arginine supplementation (arginine competes with lysine at y+LAT cationic amino acid transport, reducing intestinal lysine absorption and brain lysine entry). Urinary AASA remains elevated after pyridoxine — useful as ongoing disease biomarker.",
    targets:"Seizure freedom. Plasma pipecolic acid normalisation. Urinary AASA reduction (does not fully normalise on pyridoxine alone; decreases with lysine restriction). Neurodevelopmental assessment — only 25% show normal development on pyridoxine monotherapy.",
    analytes:{
      Pip:{hi:"Pipecolic acid elevated — marker of impaired lysine catabolism via peroxisomal pathway; should decrease with triple therapy. Confirms ongoing enzymatic block.",good:"Pipecolic acid within range — catabolism adequate on treatment."},
      Lys:{hi:"Lysine mildly elevated — reduced saccharopine pathway catabolism; review dietary lysine restriction.",good:"Lysine within target range."},
      AAAdp:{hi:"α-Aminoadipic acid elevated — downstream of antiquitin block, proximal accumulation product.",good:"Within range."},
    },
  },
  LPI: {
    interventions:"Citrulline supplementation (preferred over arginine/ornithine — citrulline is not a dibasic amino acid and crosses the intestinal barrier normally; peripheral conversion to arginine bypasses the SLC7A7 defect). Separate L-lysine supplementation (dietary lysine not absorbed normally). Moderate protein restriction chronically; strict restriction + scavengers during acute hyperammonemia. Systemic monitoring: annual chest CT + pulmonary function for PAP; haematology for HLH; renal function and urine protein.",
    targets:"Plasma lysine within reference range with supplementation. Glutamine within normal range (ammonia surrogate). Arginine and ornithine normalisation with citrulline supplementation. No pulmonary, haematological, or renal complications.",
    analytes:{
      Lys:{lo:"Lysine low — impaired intestinal absorption; ensure adequate oral L-lysine supplementation. Lysine deficiency impairs protein synthesis and growth.",good:"Lysine within range — supplementation adequate.",hi:"Lysine elevated — review supplementation dose."},
      Arg:{lo:"Arginine low — downstream of dibasic transport defect; citrulline supplementation should correct via peripheral conversion.",good:"Arginine within range — citrulline conversion adequate."},
      Orn:{lo:"Ornithine low — reduced intestinal absorption; should normalise with adequate citrulline supplementation.",good:"Ornithine within range."},
      Gln:{hi:"Glutamine elevated — ongoing ammonia burden; review citrulline dose and dietary protein intake.",good:"Glutamine within range — urea cycle substrate adequate."},
    },
  },
  MCAD: {
    interventions:"Avoidance of fasting (primary intervention). Emergency regimen during illness (IV glucose if unable to feed). Carnitine supplementation in some centres (not universal). No ongoing dietary restriction when well. Genetic counselling.",
    targets:"C8 acylcarnitine should normalise when patient is well and fed. Carnitine (C0) within normal range. Key endpoint: no hypoglycaemic episodes.",
    analytes:{},
  },
  LCHAD: {
    interventions:"Long-chain fat restriction with MCT supplementation (MCT bypasses LCHAD). Essential fatty acid (DHA) supplementation — critical for retinopathy prevention. Carnitine supplementation. Avoidance of fasting.",
    targets:"C16-OH and C18:1-OH acylcarnitines should normalise on MCT diet. C0 within range with supplementation. Ophthalmology monitoring for retinopathy (independent of metabolic control).",
    analytes:{},
  },
  CPT1: {
    interventions:"Avoidance of prolonged fasting. High-carbohydrate diet. Medium-chain fat is tolerated (bypasses CPT1). Emergency glucose during illness. Carnitine supplementation not indicated (C0 already high).",
    targets:"Free carnitine (C0) expected to be elevated — this is the biochemical phenotype, not a treatment target. Long-chain acylcarnitines (C16, C18) should remain low. Key endpoint: no hypoglycaemic episodes.",
    analytes:{
      C0:{hi:"Free carnitine elevated — this is the expected biochemical phenotype in CPT1 deficiency (high C0 with low long-chain acylcarnitines). Not a target for treatment. Carnitine supplementation is contraindicated.",good:"C0 within range — verify CPT1 diagnosis and clinical context."},
    },
  },
  CPT2: {
    interventions:"Avoid fasting, prolonged exercise, fever, general anaesthesia. High-carbohydrate diet. MCT supplementation. Bezafibrate in some adult myopathic cases. Carnitine supplementation (secondary depletion).",
    targets:"Long-chain acylcarnitines (C16, C18, C18:1) should suppress on MCT diet. C0 should normalise with carnitine supplementation. Key endpoint: absence of rhabdomyolysis episodes.",
    analytes:{},
  },
  IVA: {
    interventions:"Leucine restriction (primary substrate). Glycine supplementation (conjugates isovaleryl-CoA → isovalerylglycine, accelerating excretion). Carnitine supplementation. Avoid prolonged fasting.",
    targets:"C5 acylcarnitine target: <1 µmol/L. Isovalerylglycine (urine) should be suppressed. Carnitine within normal range.",
    analytes:{},
  },
  VLCAD: {
    interventions:"Long-chain fat restriction with MCT supplementation. Avoidance of fasting. Emergency glucose protocol during illness. Carnitine supplementation in some centres.",
    targets:"C14:1 should normalise on MCT diet when well. C0 within range. Key endpoint: absence of cardiomyopathy (neonatal form) and hypoglycaemic episodes.",
    analytes:{},
  },
  HHH: {
    interventions:"Protein restriction + citrulline supplementation (citrulline bypasses the defective ornithine import). Sodium benzoate for nitrogen scavenging. Avoid arginine supplementation — may worsen spastic paraparesis. Emergency ammonia management as per UCD protocols during illness.",
    targets:"Ornithine target: suppress toward normal range (complete normalisation difficult). Glutamine as ammonia surrogate — target within normal range. Citrulline should normalise with supplementation.",
    analytes:{
      Orn:{hi:"Ornithine elevated — primary accumulating metabolite. Review protein restriction and citrulline dose.",good:"Ornithine controlled — metabolic management effective."},
      Gln:{hi:"Glutamine elevated — ongoing hyperammonemia. Review nitrogen scavenger dose and protein intake.",good:"Glutamine within range — ammonia burden controlled."},
    },
  },
  OAT: {
    interventions:"Arginine-restricted diet (arginine is dietary precursor of ornithine — nuts, seeds, meat are high). Semisynthetic essential amino acid supplement. Pyridoxine trial (300–500 mg/day for 2–4 weeks) in all newly diagnosed patients — ~10% B6-responsive, show ≥30% ornithine reduction. Creatine supplementation corrects muscle creatine deficiency. Annual ophthalmological review + ERG essential.",
    targets:"Ornithine target: <200 µmol/L to slow chorioretinal degeneration. Early treatment compliance is critical — delay associated with faster visual loss. Annual ERG and fundoscopy as primary treatment endpoints.",
    analytes:{
      Orn:{good:"Ornithine within target (<200 µmol/L) — arginine restriction effective. Chorioretinal progression likely slowed.",hi:"Ornithine above target — review arginine restriction and dietary compliance. Consider pyridoxine responsiveness if not yet tested.",lo:"Ornithine below normal — possible over-restriction; monitor for hypoargininaemia, poor growth, and skin rash."},
      Arg:{lo:"Arginine low — risk of hypoargininaemia with growth failure and skin rash. Arginine is essential in OAT deficiency — titrate restriction carefully.",good:"Arginine within low-normal range — restriction appropriate.",hi:"Arginine elevated — review dietary arginine intake."},
      Pro:{lo:"Proline low — may reflect over-restriction; ensure adequate essential amino acid supplementation.",good:"Proline within range."},
    },
  },
  CITR1: {
    interventions:"Protein restriction (natural protein limit) + arginine-free/low formula (citrulline-free diet). Arginine supplementation (arginine becomes essential downstream of the ASS1 block — 200–400 mg/kg/day). Nitrogen scavengers: sodium benzoate and/or sodium phenylbutyrate/phenylacetate. Hemodiafiltration for acute severe hyperammonemia (>500 µmol/L or symptomatic). Liver transplantation curative in severe cases.",
    targets:"Citrulline target: <100 µmol/L (ideally approaching normal). Arginine within normal range — supplementation required as arginine is not synthesised downstream of the block. Glutamine as ammonia surrogate — target within normal range. Ammonia normal.",
    analytes:{
      Cit:{good:"Citrulline within target range — protein restriction effective.",hi:"Citrulline significantly elevated — review dietary protein and formula compliance. Assess for intercurrent catabolic illness.",lo:"Citrulline very low — review protein restriction; risk of over-restriction."},
      Arg:{lo:"Arginine low — essential downstream of ASS1 block; ensure adequate arginine supplementation (200–400 mg/kg/day). Arginine deficiency causes poor growth, skin rash, and worsens hyperammonemia.",good:"Arginine within range — supplementation adequate.",hi:"Arginine elevated — review supplementation dose."},
      Gln:{good:"Glutamine within range — ammonia burden controlled.",hi:"Glutamine elevated — ongoing hyperammonemia; review nitrogen scavenger dose and protein intake. Measure plasma ammonia urgently.",lo:"Glutamine low — monitor nutritional status."},
    },
  },
  SLC6A8: {
    interventions:"Creatine monohydrate supplementation (high dose — limited benefit in males due to transport defect, but may help carrier females). Arginine + glycine supplementation (to boost intracellular de novo creatine synthesis via GATM/GAMT within neurons). Creatine analogues (cyclocreatine, not yet clinically available) under investigation. Symptomatic: antiepileptic treatment for seizures; behavioural/speech therapy.",
    targets:"Brain creatine on MRS (primary endpoint — may not normalise with current treatments in males). Urine creatine/creatinine ratio (elevated in SLC6A8 — monitor for compliance with supplementation). Developmental milestones and seizure frequency.",
    analytes:{
      Arg:{hi:"Arginine elevated — may reflect impaired creatine synthesis flux with substrate backup; correlate with clinical context.",good:"Arginine within range."},
      Gly:{hi:"Glycine elevated — may reflect impaired GATM flux; correlate with clinical context.",good:"Glycine within range."},
    },
  },
  CITR2: {
    interventions:"NICCD (neonatal form): lactose-free, low-carbohydrate formula — frequently resolves by age 1. Adult-onset Citrullinemia type II: high-protein, high-fat, low-carbohydrate diet (patients self-select this). Sodium pyruvate supplementation. Liver transplantation curative for severe adult cases. Avoid high-carbohydrate loads — worsen hyperammonemia in this disorder.",
    targets:"Citrulline toward normal range. Ammonia within normal. Avoid prolonged fasting and high-carbohydrate meals.",
    analytes:{
      Cit:{hi:"Citrulline elevated — review dietary carbohydrate content and formula/diet.",good:"Citrulline within range — metabolic management effective."},
      Gln:{hi:"Glutamine elevated — ongoing ammonia burden; review management.",good:"Glutamine within range."},
    },
  },
  NAGS: {
    interventions:"N-carbamylglutamate (NCG/carglumic acid, Carbaglu) — both primary treatment and diagnostic test. NAGS deficiency responds rapidly and dramatically to NCG (typically within hours to days). Protein restriction during acute hyperammonemia. Some patients maintained on NCG alone long-term without protein restriction.",
    targets:"Ammonia within normal range. Glutamine as ammonia surrogate — target within range. Citrulline should normalise with NCG treatment.",
    analytes:{
      Gln:{hi:"Glutamine elevated — ammonia burden ongoing. Ensure adequate NCG dose. Urgent ammonia level indicated.",good:"Glutamine within range — NCG dose adequate."},
      Cit:{lo:"Citrulline low — upstream block; should improve with NCG treatment.",good:"Citrulline normalising — NCG response confirmed."},
    },
  },
  CAVA: {
    interventions:"N-carbamylglutamate (NCG/carglumic acid) — similar response to NAGS deficiency. Bicarbonate supplementation may also be helpful. Acute hyperammonemia managed as per UCD protocols. Increasingly identified by NGS panels.",
    targets:"Ammonia within normal range. Glutamine within normal range. Lactate should normalise with treatment.",
    analytes:{
      Gln:{hi:"Glutamine elevated — ongoing hyperammonemia; review NCG dose.",good:"Glutamine within range — metabolic control achieved."},
      Cit:{lo:"Citrulline low — upstream block; should improve with NCG.",good:"Citrulline improving — treatment response."},
    },
  },
  PCD: {
    interventions:"L-carnitine oral supplementation — high dose, lifelong. Typical dose: 100–400 mg/kg/day in 3 divided doses (infants/children); 1–3 g/day (adults). Cardiac monitoring — cardiomyopathy reverses rapidly and completely with carnitine supplementation in most cases if started before irreversible damage. Dietary carnitine (red meat) encouraged but insufficient alone. Renal carnitine wasting may require higher doses. Maternal PCD: mother requires supplementation; infant usually unaffected but should be monitored.",
    targets:"Free carnitine target: >20 µmol/L (normal range). Total carnitine normal. Acyl/free ratio normal. Cardiac function — echocardiogram normalisation is the primary endpoint in cardiomyopathy cases. Muscle strength and exercise tolerance.",
    analytes:{
      CarFree:{lo:"Free carnitine below target — increase L-carnitine dose. Risk of cardiomyopathy and hypoglycaemia if persistently low.",good:"Free carnitine within normal range — supplementation adequate.",hi:"Free carnitine above normal — dose may be excessive; titrate if causing GI side effects."},
      CarTotal:{lo:"Total carnitine low — confirms inadequate supplementation or poor compliance. Review dose and formulation.",good:"Total carnitine within range — treatment effective."},
      CarRatio:{hi:"Acyl/free ratio elevated — suggests secondary carnitine esterification (intercurrent illness or organic acid accumulation); review clinical context.",good:"Acyl/free ratio normal — carnitine metabolism balanced."},
    },
  },
  SCAD: {
    interventions:"Avoidance of fasting (primary measure). Riboflavin (B2) supplementation — may benefit symptomatic patients. Clinical significance debated: many NBS-identified patients remain asymptomatic lifelong and require no active treatment. Carnitine supplementation if secondary depletion.",
    targets:"C4 acylcarnitine and EMA normalise when well and fed. Key endpoint: avoidance of hypoglycaemia and metabolic decompensation during illness. No treatment target established for asymptomatic patients.",
    analytes:{
      C4:{hi:"C4 elevated — primary marker; expected to normalise when well-fed and not in catabolic stress. If persistently elevated when clinically stable, review dietary fat intake.",good:"C4 within range — metabolic stability maintained."},
      EMA:{hi:"Ethylmalonic acid elevated — secondary SCAD metabolite; correlates with C4 elevation. Should suppress when clinically stable.",good:"EMA within range — good metabolic control."},
    },
  },
  GTPCH1: {
    interventions:"BH4 (sapropterin, Kuvan) if BH4-responsive phenylalanine hydroxylase activity present — phenylalanine loading test required. Neurotransmitter precursor replacement: L-DOPA + carbidopa (dopamine precursor) and 5-hydroxytryptophan (serotonin precursor) — essential for neurological form; these do not cross-correct via peripheral BH4. Low-phenylalanine diet if BH4 unresponsive.",
    targets:"Phenylalanine toward normal range. Adequacy of neurotransmitter synthesis assessed via CSF HVA and 5-HIAA (not plasma markers). Neurological monitoring — movement disorder, developmental progress.",
    analytes:{
      Phe:{hi:"Phenylalanine elevated — impaired PAH activity from reduced BH4 cofactor. Review BH4 dose and dietary phenylalanine. Neurological neurotransmitter status assessed separately via CSF.",good:"Phenylalanine within range — BH4 availability adequate for PAH activity."},
    },
  },
  PCD_DEF: {
    interventions:"Usually no treatment required — PCBD1 deficiency causes transient hyperphenylalaninemia that self-resolves in infancy. BH4 (sapropterin) normalises phenylalanine if supplementation is chosen. Low-phenylalanine diet is not required. Neurotransmitter precursors are not needed (BH4 regeneration is impaired only mildly; neurotransmitter synthesis is unaffected at clinically relevant levels).",
    targets:"Phenylalanine — monitor to confirm resolution. Most patients normalise spontaneously by 12–18 months without intervention.",
    analytes:{
      Phe:{hi:"Phenylalanine elevated — consistent with BH4 regeneration impairment. Usually transient; confirm resolution with serial monitoring. BH4 loading test if persistent.",good:"Phenylalanine normalised — consistent with expected natural history of PCBD1 deficiency."},
    },
  },
  HYPER_PRO: {
    interventions:"No specific treatment established or generally required for type I. Avoid excessive protein intake. Type II (PRODH2): associated with seizures — pyridoxine may reduce proline levels; antiepileptic treatment for seizures as needed. Dietary proline restriction has limited evidence.",
    targets:"Proline monitoring — no established treatment target. Neurological monitoring for seizures and neurodevelopmental issues.",
    analytes:{
      Pro:{hi:"Proline elevated — consistent with PRODH deficiency. Degree of elevation does not reliably predict neurological risk. Monitor neurological status; consider proline restriction if symptomatic.",good:"Proline within range — metabolic stability."},
    },
  },
  ASA_AC: {
    interventions:"Protein restriction + arginine supplementation (arginine becomes essential downstream of ASL block — 200–400 mg/kg/day). Sodium benzoate and/or sodium phenylbutyrate for nitrogen scavenging. Liver transplant reduces hyperammonemia burden but does NOT prevent systemic complications (neurocognitive impairment, systemic hypertension, hepatic fibrosis) — these appear to be due to nitric oxide cycle dysfunction independent of ammonia.",
    targets:"ASA may remain elevated even on treatment (it is the substrate of the defective enzyme — some residual accumulation is expected). Arginine within normal range with supplementation. Glutamine as ammonia surrogate — target within range. Monitor blood pressure (systemic hypertension common even with good ammonia control).",
    analytes:{
      ASA:{hi:"Argininosuccinic acid elevated — primary accumulating substrate. Some elevation expected even on treatment; trend over time more informative than absolute level. Markedly elevated ASA suggests poor dietary compliance or catabolic stress.",good:"ASA within/near range — enzymatic substrate suppression on treatment."},
      Arg:{lo:"Arginine low — essential downstream of ASL block; ensure adequate supplementation. Arginine deficiency worsens hyperammonemia and neurological outcome.",good:"Arginine within range — supplementation adequate.",hi:"Arginine elevated — review supplementation dose."},
      Gln:{hi:"Glutamine elevated — ongoing ammonia burden; review nitrogen scavenger dose and protein intake.",good:"Glutamine within range — ammonia load controlled."},
    },
  },
  P5CS: {
    interventions:"Proline supplementation — proline becomes conditionally essential when P5CS (de novo proline synthesis) is deficient. Citrulline or arginine supplementation if urea cycle function is compromised. Antiepileptic treatment for seizures. Very rare disorder — management is largely supportive and empirical.",
    targets:"Proline should be maintained within normal range with supplementation. Glutamine, ornithine, and arginine monitoring. Neurodevelopmental monitoring.",
    analytes:{
      Pro:{lo:"Proline low — impaired de novo synthesis; ensure adequate proline supplementation. Proline deficiency impairs connective tissue synthesis and neurological function.",good:"Proline within range — supplementation adequate."},
      Orn:{lo:"Ornithine low — P5CS is shared pathway for proline and ornithine synthesis; ornithine may also be reduced.",good:"Ornithine within range."},
      Gln:{hi:"Glutamine elevated — may indicate secondary urea cycle compromise; review management.",good:"Glutamine within range."},
    },
  },
  MCC: {
    interventions:"Leucine restriction (leucine catabolism via methylcrotonyl-CoA is the metabolic block). Carnitine supplementation (secondary carnitine depletion from C5-OH acylcarnitine accumulation). Biotin supplementation (MCC is biotin-dependent — always confirm it is isolated MCC deficiency and not biotinidase/holocarboxylase deficiency, which responds dramatically to biotin). Avoidance of fasting. Note: many NBS-identified patients — including maternal cases (elevated C5-OH in mother's DBS from affected fetus) — are asymptomatic.",
    targets:"C5-OH target: <0.5 µmol/L. 3-Methylcrotonylglycine (urine) suppressed. Carnitine (C0) within normal range with supplementation.",
    analytes:{
      C5OH:{hi:"C5-OH elevated — primary marker of 3-MCC deficiency. Review leucine intake and carnitine status. Confirm biotin responsiveness has been excluded.",good:"C5-OH within range — leucine restriction and carnitine supplementation effective."},
    },
  },
  HMGCL: {
    interventions:"Low-leucine AND low-fat diet (both leucine and fatty acids feed into the blocked HMG-CoA lyase step — impairs both ketogenesis and leucine catabolism). Avoidance of fasting (hypoketotic hypoglycemia). High-carbohydrate diet. Emergency IV glucose protocol during illness. Carnitine supplementation.",
    targets:"HMG in urine suppressed. C6DC (3-methylglutarylcarnitine) normalised. Glucose stability — primary clinical endpoint. No hypoglycaemic episodes.",
    analytes:{
      C6DC:{hi:"3-Methylglutarylcarnitine elevated — primary acylcarnitine marker of HMGCL deficiency; reflects substrate accumulation upstream of block. Review dietary fat and leucine intake.",good:"C6DC within range — dietary management effective."},
    },
  },
  BKT: {
    interventions:"Isoleucine restriction (2-methylacetoacetate and tiglylglycine accumulate from isoleucine catabolism via the beta-ketothiolase pathway). Carnitine supplementation. Avoidance of fasting and ketogenic states — episodes triggered by catabolic stress and ketosis. Excellent prognosis with dietary management — episodic ketoacidotic crises are largely preventable.",
    targets:"Tiglylglycine (UOA) suppressed. 2-Methylacetoacetic acid (UOA) suppressed. C5:1 (tiglylcarnitine) and C5-OH normalised. Carnitine within range.",
    analytes:{
      C5_1:{hi:"Tiglylcarnitine elevated — reflects tiglyl-CoA accumulation; primary acylcarnitine marker of BKT deficiency. Review isoleucine intake and ketotic state.",good:"C5:1 within range — good metabolic control."},
      C5OH:{hi:"C5-OH elevated — secondary marker; review isoleucine restriction and carnitine supplementation.",good:"C5-OH within range."},
    },
  },
  GA2: {
    interventions:"Riboflavin (B2) supplementation — late-onset/mild form (usually ETFDH mutations) is often riboflavin-responsive: 100–300 mg/day. Biochemical and clinical response within weeks. Low-fat diet + MCT substitution for long-chain fats. Carnitine supplementation (secondary depletion). CoQ10 supplementation in some cases. Neonatal-onset (ETF mutations) is severe and unresponsive to riboflavin.",
    targets:"Multiple acylcarnitines should normalise in riboflavin-responsive cases — C4, C5, C6, C8 normalisation is the primary biochemical endpoint. Dicarboxylic aciduria should suppress. Key test: riboflavin trial with pre/post acylcarnitine profile to confirm responsiveness.",
    analytes:{
      C8:{hi:"C8 elevated — medium-chain marker; should normalise with riboflavin in responsive cases. Persistent elevation suggests non-responsive form.",good:"C8 within range — riboflavin response confirmed or diet effective."},
      C4:{hi:"C4 elevated — short-chain marker of ETF/ETFDH deficiency; monitor response to riboflavin.",good:"C4 within range — metabolic control achieved."},
    },
  },
  MCD: {
    interventions:"Biotin supplementation — highly and rapidly effective in both biotinidase deficiency (BTD) and holocarboxylase synthetase deficiency (HLCS). Biotinidase deficiency: 5–10 mg/day. HLCS deficiency: 10–40 mg/day (higher doses required). Lifelong treatment mandatory. Excellent prognosis if treated before neurological symptoms; irreversible neurological damage if untreated. Alopecia and skin rash rapidly reverse with biotin treatment.",
    targets:"C5-OH should normalise rapidly (days to weeks) with biotin supplementation. 3-Methylcrotonylglycine and MCA (urine) suppressed. Lactate normalised. Hair regrowth and resolution of skin rash confirm clinical response.",
    analytes:{
      C5OH:{hi:"C5-OH elevated — reflects impaired 3-MCC activity (biotin-dependent); should normalise rapidly with biotin. If persistent despite biotin, confirm diagnosis and adequate dose.",good:"C5-OH within range — biotin supplementation effective."},
    },
  },
  SSADH: {
    interventions:"Vigabatrin (GABA transaminase inhibitor) — reduces GABA catabolism, partially normalises GABA pathway, but clinical benefit is debated and visual field restriction is a significant side effect. GABA-B antagonists (saclofen, SGS-742) investigational. Antiepileptic treatment for seizures. No established curative treatment — management is largely symptomatic.",
    targets:"GHB (4-OH-butyric acid, UOA) — serves as disease activity biomarker. No established GHB treatment target; correlation between GHB levels and clinical severity is variable. Neuropsychiatric monitoring (seizures, behaviour, cognition) is the primary clinical endpoint.",
    analytes:{
      "4OHbut":{hi:"GHB (4-OH-butyric acid) elevated — primary biomarker reflecting SSADH deficiency severity. Correlates imperfectly with clinical course; monitor trends alongside neurological status.",good:"GHB within range — disease activity relatively low; continue neurological monitoring."},
    },
  },
  L2HGA: {
    interventions:"Riboflavin supplementation — some evidence for modest biochemical benefit. Antioxidant therapy (CoQ10, ascorbic acid) used in some protocols. No proven effective treatment — management is supportive. Avoidance of metabolic stressors. Serial neuroimaging essential (progressive leukodystrophy).",
    targets:"2-OH-glutaric acid (urine) monitoring as disease biomarker and treatment response indicator. Serial MRI for leukodystrophy and cerebellar atrophy progression. Neurodevelopmental assessment.",
    analytes:{
      "2OHglut":{hi:"L-2-Hydroxyglutaric acid elevated — primary biomarker. Trends may reflect disease activity; reduction with riboflavin suggests partial biochemical response. Stereospecific analysis confirms L-form.",good:"2-OH-glutaric acid near normal — monitor with serial neuroimaging regardless of biochemistry."},
    },
  },
  FUMAR: {
    interventions:"No effective treatment established. Supportive and palliative care. Antiepileptic treatment for seizures. Most patients have severe neonatal-onset encephalopathy with malformations and short survival. Milder late-onset cases (some FH variants) have been described — prognosis more variable.",
    targets:"Fumaric acid (urine) as disease biomarker. Neurological monitoring. Brain MRI for malformations and progressive changes.",
    analytes:{
      Fumaric:{hi:"Fumaric acid elevated — primary biomarker reflecting fumarase deficiency. Level correlates poorly with severity. Serial neuroimaging and clinical status are primary monitoring endpoints.",good:"Fumaric acid within range — monitor neurological status."},
    },
  },
  SCHAD: {
    interventions:"Diazoxide (primary for hyperinsulinism; 5–15 mg/kg/day in 2–3 divided doses) — inhibits KATP channels less potently in SCHAD but effective due to different mechanism (SCHAD loss → GDH overactivation). Some SCHAD patients respond well. Frequent feeding (avoid fasting >3–4h in infancy). Fat supplementation (medium-chain triglycerides) if fatty acid oxidation impact is significant. Octreotide as second-line for diazoxide-refractory HI. Partial pancreatectomy rarely required (unlike KATP-HI where focal lesions occur).",
    targets:"Blood glucose: maintain >3.5 mmol/L. C4-OH acylcarnitine: normalisation expected on treatment. Insulin:glucose ratio normalisation. Avoid hypoglycaemia — primary clinical endpoint.",
    analytes:{
      C4OH:{hi:"C4-OH (3-OH-butyrylcarnitine) elevated — primary biochemical marker of SCHAD deficiency. Reflects HADH enzyme dysfunction. Monitor trend alongside glucose control.",good:"C4-OH within range — HADH activity reflected; continue glucose monitoring."},
    },
  },
  IBD: {
    interventions:"Largely benign — most NBS-identified IBD patients require no treatment. Avoid prolonged fasting. Carnitine supplementation if free carnitine low. Low-protein diet generally not required. Clinical surveillance for metabolic decompensation during severe catabolic illness (intercurrent fever, surgery) — in the rare symptomatic patient, provide emergency glucose infusion.",
    targets:"C4 acylcarnitine and isobutyrylglycine as biochemical markers. Clinical monitoring for hypoglycaemia during stress. Long-term neurological/developmental surveillance — evidence suggests most patients are developmentally normal.",
    analytes:{
      C4:{hi:"C4 (butyrylcarnitine) elevated — shared with SCAD deficiency; IBG on urine acylglycines is the distinguishing marker. Monitor trend; high C4 alone has low specificity.",good:"C4 within range — residual enzyme activity may be adequate; clinical surveillance sufficient."},
      IBG:{hi:"Isobutyrylglycine elevated — specific marker for IBD (ACAD8 deficiency). Confirms the diagnosis over SCAD. Severity generally correlates poorly with IBG levels.",good:"Isobutyrylglycine normal — ACAD8 pathway functioning adequately; low clinical risk."},
    },
  },
  MTHFR: {
    interventions:"Betaine (trimethylglycine) — primary and most effective treatment; provides an alternative remethylation pathway (betaine-homocysteine methyltransferase) independent of folate/B12. Dose: 3–6 g/day in adults, 100–200 mg/kg/day in children. Hydroxocobalamin (B12) supplementation. Folate (5-methyl-THF form — folinic acid or methylfolate preferred over folic acid in severe deficiency). Methionine supplementation (essential in severe deficiency — Hcy cannot be remethylated to Met). Pyridoxine trial (unlikely to help in MTHFR unlike CBS, but may be tried).",
    targets:"Total plasma homocysteine: target <30 µmol/L (ideally <15 µmol/L for secondary prevention of thrombosis/neurological events). Plasma methionine: maintain within reference range (supplement if low). Monitor betaine dose — high betaine can cause hypermethioninemia (Met↑) if pushed too hard.",
    analytes:{
      Hcy:{hi:"Homocysteine elevated — MTHFR remethylation inadequate. Increase betaine dose. Check B12, folate, and methionine levels. Hcy >100 µmol/L indicates high thrombotic and neurological risk.",good:"Homocysteine within target range — remethylation treatment effective. Maintain current dose."},
      Met:{lo:"Methionine low — confirms impaired remethylation. Increase betaine and/or add methionine supplementation.",good:"Methionine within range — remethylation sufficient to maintain methionine pool."},
    },
  },
  CBLE: {
    interventions:"Hydroxocobalamin (high-dose IM/SC, 1–2 mg/day initially, then 1 mg 1–3 times/week maintenance) — most important treatment; bypasses MTRR/MTR dysfunction by saturating the cobalamin cofactor. Betaine (alternative remethylation). Folate (5-methyl-THF). Methionine supplementation. Most patients respond dramatically to hydroxocobalamin.",
    targets:"Total homocysteine: target <30 µmol/L. Plasma methionine: maintain normal range. Megaloblastic anaemia: normalise MCV and haemoglobin.",
    analytes:{
      Hcy:{hi:"Homocysteine elevated — cobalamin treatment inadequate. Increase hydroxocobalamin dose/frequency. Check compliance with injections.",good:"Homocysteine within target range — treatment effective."},
      Met:{lo:"Methionine low — remethylation still deficient. Review B12 dose and add methionine supplementation.",good:"Methionine within range — remethylation restored."},
    },
  },
  MAT1A: {
    interventions:"For asymptomatic patients: no treatment required — dietary methionine restriction is NOT indicated and may cause harm (Met is an essential amino acid). Monitor for leukoencephalopathy with periodic brain MRI (every 2–5 years, or if neurological symptoms develop). For neurological/demyelinating form: S-adenosylmethionine (SAM) supplementation (30–45 mg/kg/day) — provides downstream SAM for transmethylation reactions in brain. Methionine restriction (mild, not strict — maintain plasma Met 100–300 µmol/L) for symptomatic patients.",
    targets:"Plasma methionine: for asymptomatic — observe; for symptomatic — mild reduction to 100–300 µmol/L without restricting below normal essential intake. Brain MRI surveillance for white matter changes. Neurological and cognitive follow-up.",
    analytes:{
      Met:{hi:"Methionine elevated — if asymptomatic, monitoring only; if neurological symptoms present, consider mild dietary restriction and SAM supplementation. Avoid over-restriction.",good:"Methionine at target level — continue surveillance."},
    },
  },
  PHGDH: {
    interventions:"L-Serine supplementation — high dose: 200–600 mg/kg/day in 3–5 divided doses (24h coverage essential). Glycine supplementation — 200–300 mg/kg/day (glycine co-agonism at NMDA receptors improves seizure control synergistically with serine). Start treatment as early as possible — outcome directly related to age at treatment start. For prenatal diagnosis in known family: maternal serine supplementation during pregnancy has been used to improve brain development in the fetus.",
    targets:"Plasma serine: target 100–200 µmol/L (within reference range). CSF serine: monitor where practical (>40 µmol/L target). Seizure frequency reduction. Developmental milestones — improvement expected but depends on age at treatment start. MRI: arrest of cortical atrophy with treatment.",
    analytes:{
      Ser:{lo:"Serine below target — increase supplementation dose. Ensure distribution across full 24h (night-time dose critical). Malabsorption, illness, or missed doses cause rapid relapse.",good:"Serine within target range — serine biosynthesis adequately supplemented. Maintain close monitoring."},
      Gly:{lo:"Glycine also low — ensure glycine co-supplementation is adequate; may reflect deficiency of serine precursor for glycine synthesis.",good:"Glycine within range — serine and glycine supplementation balanced."},
    },
  },
  HSD17B10D: {
    interventions:"Isoleucine restriction (limit primary substrate — reduce protein from isoleucine-rich foods). Avoid fasting (triggers catabolism). Emergency glucose/insulin infusion during intercurrent illness (suppress catabolism, prevent crisis). Low-fat diet may reduce branched-chain fatty acid substrate load. Riboflavin (cofactor support). Carnitine supplementation if secondary depletion. Note: prognosis is often poor due to the progressive neurodegeneration component — treatment aims to minimise metabolic crises but cannot reverse HSD17B10's non-metabolic cellular functions.",
    targets:"C5-OH acylcarnitine within reference range. TG and 2MAA suppressed or absent when clinically stable. Avoidance of metabolic acidosis/crisis. Neurological monitoring (MRI, ophthalmology, cardiac echo) — primary endpoints.",
    analytes:{
      C5OH:{hi:"C5-OH elevated — isoleucine catabolism blocked; indicates inadequate substrate restriction or catabolic stress. Review dietary compliance and intercurrent illness status.",good:"C5-OH within range — isoleucine catabolism relatively stable."},
      "2MAA":{hi:"2-Methylacetoacetate elevated — active metabolic stress. Ensure emergency protocol: glucose intake, IV glucose if unwell. Distinguish from BKT crisis (clinical context and genetics).",good:"2-MAA within range — metabolic stability maintained."},
      TG:{hi:"Tiglylglycine elevated — indicates active isoleucine catabolism with substrate backup.",good:"Tiglylglycine suppressed — good metabolic control."},
    },
  },
  "2MBD": {
    interventions:"Generally benign — most NBS-identified 2-MBD patients are asymptomatic and require no specific treatment. Avoid prolonged fasting. Carnitine supplementation if free carnitine low. Low isoleucine diet not generally indicated. Emergency glucose infusion for rare metabolic decompensation during severe catabolism.",
    targets:"C5 acylcarnitine and 2-methylbutyrylglycine as biochemical markers. Clinical monitoring for hypoglycaemia during stress. Developmental surveillance — outcome generally favourable.",
    analytes:{
      C5:{hi:"C5 (isovalerylcarnitine) elevated — shared with isovaleric acidemia (IVA); 2-MBG on urine acylglycines distinguishes 2-MBD from IVA. High C5 alone is non-specific.",good:"C5 within range — residual ACADSB activity may be adequate."},
      "2MBG":{hi:"2-Methylbutyrylglycine elevated — specific marker for 2-MBD (ACADSB deficiency). Confirms diagnosis over IVA. Levels do not reliably predict clinical severity.",good:"2-Methylbutyrylglycine normal — ACADSB pathway functioning adequately; low clinical risk."},
    },
  },
  SCOT: {
    interventions:"Avoidance of fasting and prolonged exercise (both states generate ketone bodies that cannot be cleared). Carbohydrate-rich diet to minimise endogenous ketogenesis. Emergency protocol: IV 10% glucose at fluid maintenance rates at onset of any ketoacidotic episode — oral glucose/sucrose at home if still alert. Avoid fat restriction between crises (not necessary). Monitor BHB and acid-base during illness. No specific dietary protein or fat restriction required outside of crises.",
    targets:"BHB and acetoacetate within normal range between crises. No acidosis. Resolution of symptoms during crises with glucose infusion. Normal growth and neurodevelopment on treatment.",
    analytes:{
      BHB:{hi:"Beta-hydroxybutyrate elevated — persistent ketosis without alternative explanation is the hallmark of SCOT deficiency. If acylcarnitines and UOA are normal, SCOT deficiency should be actively considered. Emergency glucose infusion indicated if symptomatic.",good:"BHB within normal range — adequate dietary control; no active ketosis."},
      AcAc:{hi:"Acetoacetate elevated — consistent with persistent ketosis. Confirm acid-base status urgently.",good:"Acetoacetate normal — metabolic stability maintained."},
    },
  },
  HMGCS2D: {
    interventions:"Prevention of fasting — key intervention. Uncooked cornstarch at bedtime to extend fasting tolerance (from age ~2 years). Continuous nasogastric feeds in infants during illness. High-carbohydrate, moderate-fat diet. Emergency IV glucose protocol: any illness with reduced oral intake requires immediate IV 10% glucose — do not wait for symptomatic hypoglycaemia. Avoid prolonged fasting for procedures — admit for IV glucose cover. No protein restriction required.",
    targets:"Fasting glucose ≥3.5 mmol/L. BHB should be detectable but low-normal during controlled fasting (not absent — some residual enzyme activity expected). No hypoglycaemic episodes. Normal growth and neurodevelopment.",
    analytes:{
      BHB:{hi:"BHB elevated — unexpected in HMGCS2 deficiency; consider concurrent illness-related ketosis or reassess diagnosis.",good:"BHB low-normal or trace — appropriate for HMGCS2 deficiency; confirms impaired but not absent ketogenesis. Monitor fasting glucose closely."},
      Glucose:{hi:"Glucose elevated — not typical; exclude diabetes.",good:"Glucose within range — adequate carbohydrate provision."},
    },
  },
};

// ─── MONITORING REPORT ───────────────────────────────────────
function MonitoringReport({disorder, values, activePanels}){
  const cc=CAT_CLR[disorder.category]??"#64748b";
  const guidance=MONITORING_GUIDANCE[disorder.id]??{
    interventions:"See disorder-specific management guidelines.",
    targets:"Interpret against disorder-specific treatment targets.",
    analytes:{},
  };

  // Score each signature analyte for adequacy
  const rows=disorder.signature.map(sig=>{
    const analyte=ANALYTE_MAP[sig.id]; if(!analyte) return null;
    const inPanel=activePanels.has(sig.panel);
    const raw=values[sig.panel]?.[sig.id];
    const val=(raw===""||raw==null)?null:parseFloat(raw);
    let status="not-entered", valStr="", foldStr="", interpretation="";

    if(!inPanel){
      status="not-run";
      valStr="panel not performed";
    } else if(val===null||isNaN(val)){
      status="not-entered";
      valStr="not entered";
    } else {
      const hi=val>analyte.hi, lo=analyte.lo>0&&val<analyte.lo;
      const xH=analyte.hi>0?val/analyte.hi:null;
      const xL=analyte.lo>0?val/analyte.lo:null;
      valStr=`${val} ${analyte.unit}`;

      // Grade severity of out-of-range
      if(sig.direction==="high"){
        if(!hi){ status="controlled"; foldStr=xH?`(${(xH*100).toFixed(0)}% of ULN)`:""; }
        else if(xH&&xH<1.5){ status="mild"; foldStr=`↑${xH.toFixed(1)}×`; }
        else if(xH&&xH<3)  { status="moderate"; foldStr=`↑${xH.toFixed(1)}×`; }
        else                { status="poor"; foldStr=xH?`↑${xH.toFixed(1)}×`:"↑"; }
      } else {
        if(!lo){ status="controlled"; foldStr=xL?`(${(xL*100).toFixed(0)}% of LLN)`:""; }
        else if(xL&&xL>0.5){ status="mild"; foldStr=`↓${xL.toFixed(2)}×`; }
        else                { status="poor"; foldStr=`↓${xL?.toFixed(2)}×`; }
      }

      // Get analyte-specific interpretation
      const ag=guidance.analytes?.[sig.id];
      if(ag){
        interpretation = status==="controlled"||status==="mild"
          ? (ag.good??"") 
          : sig.direction==="high"?(ag.hi??""):((ag.lo??""));
        if((status==="mild"||status==="moderate"||status==="poor")&&sig.direction==="high"&&ag.hi) interpretation=ag.hi;
        if((status==="mild"||status==="moderate"||status==="poor")&&sig.direction==="low"&&ag.lo) interpretation=ag.lo;
      }
    }

    const statusCfg={
      controlled: {cls:"bg-emerald-50 border-emerald-200 text-emerald-800", bar:"bg-emerald-400", label:"Controlled"},
      mild:       {cls:"bg-yellow-50 border-yellow-200 text-yellow-800",   bar:"bg-yellow-400", label:"Mildly off-target"},
      moderate:   {cls:"bg-orange-50 border-orange-200 text-orange-800",   bar:"bg-orange-400", label:"Suboptimal"},
      poor:       {cls:"bg-rose-50 border-rose-200 text-rose-800",         bar:"bg-rose-400",   label:"Poorly controlled"},
      "not-entered":{cls:"bg-slate-50 border-slate-200 text-slate-500",    bar:"bg-slate-200",  label:"Not entered"},
      "not-run":  {cls:"bg-slate-50 border-slate-200 text-slate-400",      bar:"bg-slate-100",  label:"Panel not performed"},
    }[status]??{cls:"bg-slate-50 border-slate-200 text-slate-400",bar:"bg-slate-100",label:status};

    return{sig,analyte,status,valStr,foldStr,interpretation,statusCfg};
  }).filter(Boolean);

  const enteredRows=rows.filter(r=>r.status!=="not-entered"&&r.status!=="not-run");
  const controlled=enteredRows.filter(r=>r.status==="controlled").length;
  const mild=enteredRows.filter(r=>r.status==="mild").length;
  const moderate=enteredRows.filter(r=>r.status==="moderate").length;
  const poor=enteredRows.filter(r=>r.status==="poor").length;
  const missing=rows.filter(r=>r.status==="not-entered"||r.status==="not-run").length;

  const overallStatus = poor>0?"Poorly controlled"
    :moderate>0?"Suboptimal control"
    :mild>0?"Mild residual abnormalities"
    :missing===rows.length?"Insufficient data"
    :"Well controlled";
  const overallCls = poor>0?"text-rose-700 bg-rose-50 border-rose-200"
    :moderate>0?"text-orange-700 bg-orange-50 border-orange-200"
    :mild>0?"text-yellow-700 bg-yellow-50 border-yellow-200"
    :missing===rows.length?"text-slate-500 bg-slate-50 border-slate-200"
    :"text-emerald-700 bg-emerald-50 border-emerald-200";

  return(
    <div className="rounded-xl border-2 overflow-hidden" style={{borderColor:cc+"55"}}>

      {/* Header */}
      <div className="px-5 py-4" style={{background:`linear-gradient(135deg, ${cc}18 0%, ${cc}08 100%)`}}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{color:cc}}>
              Established diagnosis · Treatment monitoring report
            </div>
            <div className="text-base font-bold text-slate-900">{disorder.name}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono">{disorder.gene} · {disorder.category}</div>
          </div>
          <div className={`text-sm font-bold px-3 py-1.5 rounded-xl border ${overallCls} flex-shrink-0`}>
            {overallStatus}
          </div>
        </div>
        {/* Mini summary bar */}
        {enteredRows.length>0&&(
          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
            <div className="flex h-2 rounded-full overflow-hidden flex-1 max-w-[160px] bg-slate-200">
              {controlled>0&&<div className="bg-emerald-400 h-full transition-all" style={{width:`${controlled/rows.length*100}%`}}/>}
              {mild>0&&      <div className="bg-yellow-400 h-full transition-all" style={{width:`${mild/rows.length*100}%`}}/>}
              {moderate>0&&  <div className="bg-orange-400 h-full transition-all" style={{width:`${moderate/rows.length*100}%`}}/>}
              {poor>0&&      <div className="bg-rose-400 h-full transition-all" style={{width:`${poor/rows.length*100}%`}}/>}
            </div>
            <span>{controlled} controlled</span>
            {mild>0&&<span className="text-yellow-600">{mild} mild</span>}
            {moderate>0&&<span className="text-orange-600">{moderate} suboptimal</span>}
            {poor>0&&<span className="text-rose-600 font-bold">{poor} poor</span>}
            {missing>0&&<span className="text-slate-400">{missing} missing</span>}
          </div>
        )}
      </div>

      {/* Intervention summary */}
      <div className="px-5 py-3 bg-white border-t border-slate-100 space-y-2">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Standard interventions</div>
          <div className="text-xs text-slate-700 leading-relaxed">{guidance.interventions}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Monitoring targets</div>
          <div className="text-xs text-slate-600 leading-relaxed">{guidance.targets}</div>
        </div>
      </div>

      {/* Per-analyte adequacy table */}
      <div className="border-t border-slate-100">
        <div className="px-5 py-2 bg-slate-50">
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Biochemical adequacy — signature analytes</div>
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((r,i)=>(
            <div key={i} className={`px-5 py-3 flex items-start gap-3 ${r.status==="not-run"||r.status==="not-entered"?"opacity-50":""}`}>
              {/* Status pill */}
              <div className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg border mt-0.5 min-w-[90px] text-center ${r.statusCfg.cls}`}>
                {r.statusCfg.label}
              </div>
              {/* Analyte info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800">{r.analyte.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">{r.valStr}</span>
                  {r.foldStr&&<span className={`text-[10px] font-bold ${
                    r.status==="poor"?"text-rose-600":r.status==="moderate"?"text-orange-600":
                    r.status==="mild"?"text-yellow-600":"text-emerald-600"}`}>{r.foldStr}</span>}
                  <span className="text-[9px] text-slate-300">ref {r.analyte.lo>0?`${r.analyte.lo}–`:``}{r.analyte.hi} {r.analyte.unit}</span>
                  {r.sig.weight===3&&<span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 rounded">primary marker</span>}
                </div>
                {r.interpretation&&(
                  <div className={`text-[11px] mt-0.5 leading-snug ${
                    r.status==="poor"||r.status==="moderate"?"text-rose-700 font-medium":
                    r.status==="mild"?"text-orange-700":"text-slate-500"}`}>
                    {r.interpretation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NARRATIVE GENERATION ────────────────────────────────────
async function generateNarrative(caseLabel, values, activeModifiers, knownDxId, results, activePanels, patterns=[]){
  const panelNames={PAA:"Plasma Amino Acids",UOA:"Urine Organic Acids",AC:"Plasma Acylcarnitines",CAR:"Plasma Carnitine",UAG:"Urine Acylglycines",MISC:"Miscellaneous"};
  const panels=[...activePanels].map(p=>panelNames[p]||p).join(", ");

  // Build abnormal values summary — all panels including CAR and UAG
  const abnLines=[];
  const allLines=[];
  for(const[panelId,panelVals]of Object.entries(values)){
    const analytes=PANEL_ANALYTES[panelId]; if(!analytes) continue;
    for(const a of analytes){
      const v=parseFloat(panelVals[a.id]);
      if(isNaN(v)||panelVals[a.id]==="") continue;
      const hi=v>a.hi, lo=a.lo>0&&v<a.lo;
      const line=`[${panelId}] ${a.name}: ${v} ${a.unit} [ref ${a.lo>0?a.lo+`–`:"≤"}${a.hi}] ${hi?"HIGH":lo?"LOW":"normal"}`;
      allLines.push(line);
      if(hi||lo) abnLines.push(line);
    }
  }
  // Also include all entered normal values so Claude has full context for synthesis
  const contextLines=abnLines.length?abnLines:allLines;

  // Build top differential
  const top5=(results||[]).filter(r=>r.score>0.02).slice(0,5);
  const diffLines=top5.map((r,i)=>`${i+1}. ${r.name} (${r.category}) — score ${(r.score*100).toFixed(0)}/100`);

  const modLabels=activeModifiers.map(id=>MODIFIER_MAP[id]?.label||id);
  const knownDx=knownDxId?DISORDER_MAP[knownDxId]?.name:null;

  const prompt=`You are a clinical biochemist writing a formal metabolic laboratory report narrative.
Be precise, factual, and clinical in tone. Use standard medical terminology. Do not speculate beyond the data.
Write in third person (e.g. "The results show...", "These findings are consistent with...").
IMPORTANT: When multiple panels are provided (e.g. plasma acylcarnitines AND urine acylglycines), synthesise findings across ALL panels together — explicitly describe how findings from different panels corroborate or complement each other. Do not describe each panel in isolation.
Structure your response in three paragraphs:
1. FINDINGS: Summarise the significant biochemical abnormalities from ALL panels performed (${panels}), integrating cross-panel findings into a unified biochemical picture.
2. INTERPRETATION: Interpret the combined cross-panel pattern in clinical context.${knownDx?" The patient has a known diagnosis of "+knownDx+" — focus on adequacy of metabolic control and whether the biochemical profile is consistent with the known diagnosis.":""}${modLabels.length?" Clinical modifiers active: "+modLabels.join(", ")+".":""}
3. RECOMMENDATIONS: State what additional investigations or management adjustments are warranted based on these results. Be specific and actionable.
Keep each paragraph to 3–5 sentences. Do not use bullet points. Do not include headings.

Case: ${caseLabel||"Unnamed"}
Panels performed: ${panels}
${modLabels.length?"Clinical context: "+modLabels.join(", "):""}
${knownDx?"Known diagnosis: "+knownDx:""}

Abnormal analytes:
${contextLines.length?contextLines.join("\n"):"None flagged"}

${!knownDx?`Top differential (scoring engine):\n${diffLines.join("\n")}`:""}
${patterns.length?`\nBiochemical patterns active:\n${patterns.map(p=>`[${p.confidence.toUpperCase()}] ${p.name}: ${p.hits.map(h=>h.label).join(" | ")}`).join("\n")}`:""}`;

  const res=await fetch("/api/claude",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,
      messages:[{role:"user",content:prompt}]})});
  const data=await res.json();
  if(data.error) throw new Error(data.error.message);
  return data.content.filter(b=>b.type==="text").map(b=>b.text).join("").trim();
}

// ─── REVIEW TAB ──────────────────────────────────────────────
function ReviewTab({reviewer,setReviewer,narrative,onGenerateNarrative,narrativeBusy,narrativeErr,onSign,signed,results,entered}){
  const canSign=reviewer.name.trim().length>0&&reviewer.role.trim().length>0&&narrative.length>0;
  return(
    <div className="max-w-screen-lg mx-auto px-5 py-5 space-y-5">
      <div>
        <h2 className="text-sm font-bold text-slate-800">Pre-report review</h2>
        <p className="text-xs text-slate-400 mt-0.5">Generate the narrative interpretation, review it, then sign out to produce the final report.</p>
      </div>

      {/* Reviewer identity */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Reviewing clinician</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Name</label>
            <input value={reviewer.name} onChange={e=>setReviewer(p=>({...p,name:e.target.value}))}
              placeholder="Dr. A. Smith" disabled={signed}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Role / credentials</label>
            <input value={reviewer.role} onChange={e=>setReviewer(p=>({...p,role:e.target.value}))}
              placeholder="Clinical Biochemist, FACMG" disabled={signed}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"/>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Additional comments (optional)</label>
          <textarea value={reviewer.comments} onChange={e=>setReviewer(p=>({...p,comments:e.target.value}))}
            placeholder="Any additional clinical notes for the report…" rows={2} disabled={signed}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-slate-400 resize-none disabled:bg-slate-50 disabled:text-slate-500"/>
        </div>
      </div>

      {/* Narrative */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Narrative interpretation</div>
            <div className="text-[11px] text-slate-400 mt-0.5">AI-generated draft — review and edit before signing</div>
          </div>
          {!signed&&(
            <button onClick={onGenerateNarrative} disabled={narrativeBusy||entered===0||!results}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40">
              {narrativeBusy?<><Spinner s={3}/> Generating…</>:"✦ Generate narrative"}
            </button>
          )}
        </div>
        {narrativeErr&&<div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{narrativeErr}</div>}
        {narrative?(
          <textarea value={narrative} onChange={e=>setReviewer(p=>({...p,_narrative:e.target.value}))}
            disabled={signed} rows={8}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm leading-relaxed outline-none focus:border-slate-400 resize-none font-serif disabled:bg-slate-50"
            style={{fontFamily:"Georgia, 'Times New Roman', serif"}}/>
        ):(
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-400 text-sm">
            Click "Generate narrative" to draft the interpretation
          </div>
        )}
      </div>

      {/* Sign-out */}
      {!signed?(
        <button onClick={onSign} disabled={!canSign}
          className="w-full py-3 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-700 active:scale-[0.99] transition-all disabled:opacity-30 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Sign out report — {reviewer.name||"enter name above"}
        </button>
      ):(
        <div className="flex items-center gap-2 justify-center py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm">
          ✓ Report signed by {reviewer.name} · {reviewer.role}
        </div>
      )}
    </div>
  );
}

// ─── REPORT TAB ──────────────────────────────────────────────
function printReport(id){
  const el=document.getElementById(id);
  if(!el) return;
  const w=window.open("","_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>MetabolicDx Report</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'IBM Plex Sans',sans-serif;font-size:11pt;color:#000;background:#fff;padding:18mm 20mm}
h1{font-size:20pt;font-weight:900;margin-bottom:4px}
h2{font-size:13pt;font-weight:700;margin-bottom:8px;margin-top:18px;border-bottom:2px solid #000;padding-bottom:4px}
h3{font-size:11pt;font-weight:700;margin-bottom:4px;margin-top:12px}
p{margin-bottom:6px}
table{width:100%;border-collapse:collapse;margin-bottom:12px;page-break-inside:avoid}
th,td{border:1px solid #ccc;padding:4px 8px;font-size:9.5pt;vertical-align:top}
th{background:#f0f0f0;font-weight:700;color:#333;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.hi{color:#be123c;font-weight:700} .lo{color:#0369a1;font-weight:700}
.flag-hi{color:#be123c;font-weight:900} .flag-lo{color:#0369a1;font-weight:900}
.section{margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #ccc;page-break-inside:avoid}
.label{font-size:8pt;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#555;margin-bottom:5px}
.narrative{font-family:Georgia,'Times New Roman',serif;font-size:11pt;line-height:1.8;white-space:pre-wrap}
.dx-row{display:flex;align-items:flex-start;gap:12px;padding:5px 0;border-bottom:1px solid #e8e8e8}
.dx-row:last-child{border:none}
.badge{font-size:8.5pt;font-weight:700;padding:2px 7px;border-radius:3px;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.conf{font-size:8.5pt;font-weight:700;padding:2px 7px;border-radius:3px;border:1px solid}
.footer{margin-top:20px;font-size:8.5pt;color:#555;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;border-top:1px solid #ccc;padding-top:8px}
.no-print{display:none}
@page{margin:12mm;size:A4}
@media print{
  body{padding:0}
  h2{page-break-before:auto}
  .section{page-break-inside:avoid}
  .dx-row{page-break-inside:avoid}
  table{page-break-inside:avoid}
}
</style></head><body>${el.innerHTML}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(()=>{w.print();},400);
}

function ReportTab({caseLabel, createdAt, values, activePanels, activeModifiers, knownDxId,
                    results, reviewer, narrative, confirmedDxId, demo}){
  const top=(results||[]).filter(r=>r.score>0.02).slice(0,10);
  const cc=knownDxId?CAT_CLR[DISORDER_MAP[knownDxId]?.category]??"#1d4ed8":"#1d4ed8";
  const now=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"});
  const modLabels=activeModifiers.map(id=>MODIFIER_MAP[id]?.label||id);

  // All entered analytes grouped by panel
  const panelNames={PAA:"Plasma Amino Acids",UOA:"Urine Organic Acids (mmol/mol Cr)",AC:"Plasma Acylcarnitines",CAR:"Plasma Carnitine",UAG:"Urine Acylglycines (mmol/mol Cr)"};

  return(
    <div className="max-w-screen-lg mx-auto px-5 py-5">
      <div className="flex justify-end mb-3">
        <button onClick={()=>printReport("metabolicdx-report")}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          Print / PDF
        </button>
      </div>
      {/* Report document */}
      <div id="metabolicdx-report" className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100" style={{background:`linear-gradient(135deg,${cc}10,transparent)`}}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="grid grid-cols-3 gap-0.5 w-5 h-5 mb-2">
                {["bg-blue-400","bg-yellow-400","bg-green-400","bg-purple-400","bg-red-400","bg-cyan-400","bg-pink-400","bg-orange-400","bg-teal-400"].map((c,i)=><div key={i} className={`${c} rounded-[1px]`}/>)}
              </div>
              <div className="text-xs font-bold tracking-widest uppercase text-slate-400">MetabolicDx · Biochemical Genetics Report</div>
              <div className="text-xl font-black text-slate-900 mt-1">{caseLabel||"Unnamed case"}</div>
            </div>
            <div className="text-right text-xs text-slate-400 space-y-0.5 flex-shrink-0">
              <div>Report date: <span className="font-semibold text-slate-600">{now}</span></div>
              {demo?.sampleDate?<div>Sample date: <span className="font-semibold text-slate-600">{demo.sampleDate}</span></div>
               :createdAt&&<div>Sample date: <span className="font-semibold text-slate-600">{fmtDate(createdAt)}</span></div>}
              {demo?.dob&&<div>DOB: <span className="font-semibold text-slate-600">{demo.dob}</span></div>}
              {demo?.gender&&<div>Gender: <span className="font-semibold text-slate-600">{demo.gender}</span></div>}
              <div>Panels: <span className="font-semibold text-slate-600">{[...activePanels].map(p=>p).join(", ")}</span></div>
            </div>
          </div>
          {(knownDxId||modLabels.length>0)&&(
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {knownDxId&&<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white" style={{background:cc}}>
                Known diagnosis: {DISORDER_MAP[knownDxId]?.name}
              </span>}
              {modLabels.map(m=><span key={m} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">⚠ {m}</span>)}
            </div>
          )}
        </div>

        {/* Biochemical data table */}
        <div className="px-8 py-5 border-b border-slate-100">
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Biochemical results</div>
          {["PAA","UOA","AC","CAR","UAG","MISC"].filter(p=>activePanels.has(p)).map(panelId=>{
            const analytes=PANEL_ANALYTES[panelId]??[];
            const entered=analytes.filter(a=>values[panelId]?.[a.id]!==""&&values[panelId]?.[a.id]!=null);
            if(!entered.length) return null;
            return(
              <div key={panelId} className="mb-4">
                <div className="text-xs font-bold text-slate-600 mb-1.5">{panelNames[panelId]}</div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-2 py-1 font-semibold text-slate-500 border border-slate-100 w-1/2">Analyte</th>
                      <th className="text-right px-2 py-1 font-semibold text-slate-500 border border-slate-100">Result</th>
                      <th className="text-center px-2 py-1 font-semibold text-slate-500 border border-slate-100">Flag</th>
                      <th className="text-right px-2 py-1 font-semibold text-slate-500 border border-slate-100">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entered.map(a=>{
                      const v=parseFloat(values[panelId][a.id]);
                      const hi=!isNaN(v)&&v>a.hi, lo=!isNaN(v)&&a.lo>0&&v<a.lo;
                      return(
                        <tr key={a.id} className={hi||lo?"bg-rose-50":"even:bg-slate-50/50"}>
                          <td className="px-2 py-1 border border-slate-100 text-slate-700">{a.name}</td>
                          <td className={`px-2 py-1 border border-slate-100 text-right font-mono font-semibold ${hi?"text-rose-700":lo?"text-sky-700":"text-slate-700"}`}>
                            {values[panelId][a.id]}
                          </td>
                          <td className="px-2 py-1 border border-slate-100 text-center">
                            {hi&&<span className="text-[10px] font-black text-rose-600">H</span>}
                            {lo&&<span className="text-[10px] font-black text-sky-600">L</span>}
                          </td>
                          <td className="px-2 py-1 border border-slate-100 text-right text-slate-400 font-mono">
                            {a.lo>0?`${a.lo}–${a.hi}`:`≤${a.hi}`} {a.unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Monitoring report (if known dx) */}
        {knownDxId&&DISORDER_MAP[knownDxId]&&(
          <div className="px-8 py-5 border-b border-slate-100">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Treatment adequacy — {DISORDER_MAP[knownDxId]?.name}</div>
            <MonitoringReport disorder={DISORDER_MAP[knownDxId]} values={values} activePanels={activePanels}/>
          </div>
        )}

        {/* Differential (if no known dx, or secondary considerations) */}
        {top.length>0&&(
          <div className="px-8 py-5 border-b border-slate-100">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">
              {knownDxId?"Secondary diagnostic considerations":"Differential diagnosis — ranked"}
            </div>
            <div className="space-y-1">
              {top.filter(r=>r.id!==knownDxId).slice(0,5).map((r,i)=>{
                const conf=confLevel(r.score);
                const cc2=CAT_CLR[r.category]??"#64748b";
                return(
                  <div key={r.id} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-xs font-black text-slate-200 w-4">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-slate-800">{r.name}</span>
                      <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded text-white" style={{background:cc2}}>{r.category}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${conf.cls}`}>{conf.label}</span>
                    <span className="text-[10px] font-mono text-slate-400 w-14 text-right">{(r.score*100).toFixed(0)}/100</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Negative findings — disorders excluded */}
        {(()=>{
          // Identify high-prevalence disorders that were evaluated but scored very low
          const prevalentIds=["PKU","MSUD","PA","MMA","IVA","MCAD","VLCAD","LCHAD","GA1","CBS","OTC","TYR1","CITR1","NKH","PCD","CPT2","GA2","CBLC","PDHD"];
          const excluded=prevalentIds
            .filter(id=>{
              const d=DISORDER_MAP[id]; if(!d) return false;
              // Disorder's panels must have been run
              const panels=new Set(d.signature.map(s=>s.panel));
              const anyRun=[...panels].some(p=>activePanels.has(p));
              if(!anyRun) return false;
              // Score must be very low or absent
              const match=results?.find(r=>r.id===id);
              return !match||match.score<0.05;
            })
            .map(id=>{
              const d=DISORDER_MAP[id];
              // Find the key markers that were normal
              const keyMarkers=d.signature.filter(s=>s.weight>=2).slice(0,3).map(s=>{
                const a=ANALYTE_MAP[s.id]; if(!a) return null;
                const raw=values[s.panel]?.[s.id];
                const v=parseFloat(raw);
                if(isNaN(v)) return null;
                const normal=v>=(a.lo||0)&&v<=a.hi;
                return normal?a.name:null;
              }).filter(Boolean);
              if(!keyMarkers.length) return null;
              return {name:d.name,markers:keyMarkers};
            }).filter(Boolean);
          if(!excluded.length) return null;
          return(
            <div className="px-8 py-5 border-b border-slate-100">
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Negative findings — disorders excluded</div>
              <div className="space-y-1">
                {excluded.map((e,i)=>(
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="text-emerald-500 font-bold flex-shrink-0">✗</span>
                    <span><span className="font-semibold text-slate-800">{e.name}</span> — excluded: {e.markers.join(", ")} within reference range</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Narrative interpretation */}
        <div className="px-8 py-5 border-b border-slate-100">
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Interpretation</div>
          <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap"
            style={{fontFamily:"Georgia,'Times New Roman',serif"}}>
            {narrative||"No narrative generated."}
          </div>
          {reviewer.comments&&(
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Reviewer comments</div>
              <div className="text-sm text-slate-600 italic" style={{fontFamily:"Georgia,'Times New Roman',serif"}}>
                {reviewer.comments}
              </div>
            </div>
          )}
        </div>

        {/* Signature block */}
        <div className="px-8 py-5 bg-slate-50">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Reviewed and signed by</div>
              <div className="text-sm font-bold text-slate-900">{reviewer.name||"—"}</div>
              <div className="text-xs text-slate-500">{reviewer.role||""}</div>
              <div className="text-xs text-slate-400 mt-0.5">{now}</div>
            </div>
            {confirmedDxId&&(
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Confirmed diagnosis</div>
                <div className="text-sm font-bold text-emerald-700">{DISORDER_MAP[confirmedDxId]?.name}</div>
              </div>
            )}
            <div className="text-right text-[10px] text-slate-300 leading-relaxed max-w-xs">
              This report was generated by MetabolicDx (prototype). Pattern-based probabilistic ranking only. Not a substitute for specialist clinical interpretation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CASE EDITOR ─────────────────────────────────────────────
const PANELS=[
  {id:"PAA",label:"Plasma Amino Acids",analytes:PAA_ANALYTES},
  {id:"UOA",label:"Urine Organic Acids",analytes:UOA_ANALYTES},
  {id:"AC", label:"Plasma Acylcarnitines",analytes:AC_ANALYTES},
  {id:"CAR",label:"Plasma Carnitine",analytes:CAR_ANALYTES},
  {id:"UAG",label:"Urine Acylglycines",analytes:UAG_ANALYTES},
  {id:"MISC",label:"Miscellaneous",analytes:MISC_ANALYTES},
];

function DxSelect({value, onChange, placeholder}){
  return(
    <select value={value||""} onChange={e=>onChange(e.target.value||null)}
      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-violet-400 bg-white text-slate-700"
      style={{fontFamily:"'IBM Plex Sans',sans-serif"}}>
      <option value="">{placeholder}</option>
      {Object.entries(DISORDERS.reduce((acc,d)=>{(acc[d.category]=acc[d.category]||[]).push(d);return acc;},{})).map(([cat,ds])=>(
        <optgroup key={cat} label={cat}>{ds.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</optgroup>
      ))}
    </select>
  );
}

function CaseEditor({init,onSave,onBack,learnedWeights}){
  const [label,setLabel]=useState(init?.label??"");
  const [age,setAge]=useState(init?.age??"");
  const [clinicalNote,setClinicalNote]=useState(init?.clinicalNote??"");
  const [demo,setDemo]=useState(init?.demo??{dob:"",gender:"",sampleDate:"",notes:"",method:"",birthWeight:"",fasting:""});
  const sex=demo.gender||init?.sex||"";
  const [values,setValues]=useState(init?.values??initValues());
  const [activeModifiers,setActiveModifiers]=useState(init?.activeModifiers??[]);
  const [knownDxId,setKnownDxId]=useState(init?.knownDxId??null);
  const [clinicalContext,setClinicalContext]=useState(init?.clinicalContext??null);
  const [results,setResults]=useState(init?.results??null);
  const [patterns,setPatterns]=useState([]);
  const [confirmedDxId,setConfirmedDxId]=useState(init?.confirmedDxId??null);
  const [confirmSaved,setConfirmSaved]=useState(!!init?.confirmedDxId);
  const [hits,setHits]=useState(new Set());
  const [extractErr,setExtractErr]=useState(null);
  const [extractBusy,setExtractBusy]=useState(false);
  const [tab,setTab]=useState(init?.results?"results":"data");
  const [panel,setPanel]=useState("PAA");
  const [saving,setSaving]=useState(false);
  // Review/report state
  const [reviewer,setReviewer]=useState(init?.reviewer??{name:"",role:"",comments:""});
  const [narrative,setNarrative]=useState(init?.narrative??"");
  const [narrativeBusy,setNarrativeBusy]=useState(false);
  const [narrativeErr,setNarrativeErr]=useState(null);
  const [reportSigned,setReportSigned]=useState(!!init?.reportSigned);

  // Derived demographics
  const ageStr=useMemo(()=>{
    if(!demo.dob) return "";
    const dob=new Date(demo.dob);
    const ref=demo.sampleDate?new Date(demo.sampleDate):new Date();
    if(isNaN(dob.getTime())) return "";
    let months=(ref.getFullYear()-dob.getFullYear())*12+(ref.getMonth()-dob.getMonth());
    if(ref.getDate()<dob.getDate()) months--;
    if(months<0) return "";
    if(months<24) return `${months}mo`;
    const yrs=Math.floor(months/12);
    const mo=months%12;
    return mo>0?`${yrs}yr ${mo}mo`:`${yrs}yr`;
  },[demo.dob,demo.sampleDate]);

  const onChange=useCallback((panelId,id,v)=>{
    setValues(p=>({...p,[panelId]:{...p[panelId],[id]:v}}));
    setResults(null); setNarrative(""); setReportSigned(false);
  },[]);

  const handleModifiers=useCallback((mods)=>{
    setActiveModifiers(mods); setResults(null); setNarrative(""); setReportSigned(false);
  },[]);

  const handleFile=async(file)=>{
    setExtractErr(null);setExtractBusy(true);
    try{
      const ext=file.type.startsWith("image/")
        ?await extractFromImage(await toB64(file),file.type)
        :await extractFromText(await xlsxToText(file));
      setValues(p=>mergeExtracted(p,ext));
      const ids=new Set();
      for(const[,vs]of Object.entries(ext||{}))for(const[id,v]of Object.entries(vs||{}))if(v!=null&&v!=="")ids.add(id);
      setHits(ids);setResults(null);setNarrative("");setReportSigned(false);
    }catch(e){setExtractErr("Extraction failed: "+e.message);}
    finally{setExtractBusy(false);}
  };

  const analyze=()=>{
    const am=parseAgeMonths(demo,age);
    const cov=parseDemoForCovariates(demo,age);
    const {results:r,patterns:p}=runAnalysis(values,activeModifiers,learnedWeights,clinicalContext,am);
    // Compute covariate Z-scores for key analytes and attach to results
    if(cov.ageHours!==null||cov.birthWeightG!==null){
      const zScores={};
      for(const aid of Object.keys(COVARIATE_MODELS)){
        const panel=PAA_ANALYTES.find(a=>a.id===aid)?"PAA":AC_ANALYTES.find(a=>a.id===aid)?"AC":null;
        if(!panel) continue;
        const raw=values[panel]?.[aid];
        const v=parseFloat(raw);
        if(isNaN(v)||v<=0) continue;
        const z=computeCovariateZscore(aid,v,cov.ageHours,cov.birthWeightG);
        if(z!==null) zScores[aid]={z,panel};
      }
      // Attach Z-scores to supporting markers in each result
      for(const res of r){
        for(const s of res.supporting){
          if(zScores[s.id]) s.covariateZ=zScores[s.id].z;
        }
        res.covariateInfo=cov;
      }
    }
    setResults(r); setPatterns(p); setNarrative(""); setReportSigned(false); setTab("results");
  };

  const handleGenerateNarrative=async()=>{
    setNarrativeBusy(true); setNarrativeErr(null);
    try{
      const ap=new Set(Object.entries(values).filter(([,p])=>Object.values(p).some(v=>v!=="")).map(([k])=>k));
      const text=await generateNarrative(label,values,activeModifiers,knownDxId,results,ap,patterns);
      setNarrative(text);
    }catch(e){setNarrativeErr("Narrative generation failed: "+e.message);}
    finally{setNarrativeBusy(false);}
  };

  const handleSign=()=>{
    setReportSigned(true); setTab("report");
  };

  const [saveError,setSaveError]=useState(null);

  const save=async()=>{
    setSaving(true); setSaveError(null);
    const caseObj={id:init?.id??uid(),label:label||"Untitled",
      age,sex,clinicalNote,
      createdAt:init?.createdAt??new Date().toISOString(),
      values,results,confirmedDxId,knownDxId,activeModifiers,reviewer,narrative,reportSigned,demo,
      panels:Object.entries(values).filter(([,p])=>Object.values(p).some(v=>v!=="")).map(([k])=>k),
      enteredCount:countEntered(values),abnormalCount:countAbnormal(values)};
    try{
      await persistCase(caseObj);
      if(confirmedDxId){
        await upsertTrainingExample({id:uid(),caseId:caseObj.id,confirmedDxId,values,confirmedAt:new Date().toISOString()});
        setConfirmSaved(true);
      }else{
        await removeTrainingExample(caseObj.id);
      }
      setSaving(false); onSave();
    }catch(e){
      setSaveError(e.message);
      setSaving(false);
    }
  };

  const entered=countEntered(values),abnormal=countAbnormal(values);
  const top=results?.filter(r=>r.score>0.02).slice(0,15)??[];
  const totalWarnings=top.reduce((s,r)=>s+(r.warnings?.length??0),0);
  const activePanels=new Set(Object.entries(values).filter(([,p])=>Object.values(p).some(v=>v!=="")).map(([k])=>k));

  const TABS=[
    {id:"data",     label:"Data",     avail:true},
    {id:"results",  label:"Results",  avail:!!results, badge:results?`(${top.length})`:"", warn:totalWarnings>0},
    {id:"profile",  label:"Profile",  avail:entered>0},
    {id:"review",   label:"Review",   avail:!!results},
    {id:"report",   label:"Report",   avail:reportSigned},
  ];

  return(
    <div className="flex flex-col h-full">
      {/* Toolbar — row 1: identity + status + actions */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 pt-3 pb-0">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Case label / patient ID…"
            className="flex-1 text-base font-semibold text-slate-800 bg-transparent outline-none placeholder-slate-300 min-w-0"/>
          {/* Status chips */}
          <div className="flex items-center gap-2 flex-shrink-0 text-xs text-slate-400">
            {ageStr&&<span className="font-medium text-slate-500">{ageStr}</span>}
            {demo.gender&&<span className="font-medium text-slate-500">{demo.gender}</span>}
            <span className="font-medium">{entered} values</span>
            {abnormal>0&&<span className="text-rose-500 font-semibold">{abnormal} abnormal</span>}
            {activeModifiers.length>0&&<span className="text-orange-600 font-semibold">⚠ {activeModifiers.length} modifier{activeModifiers.length>1?"s":""}</span>}
            {knownDxId&&<span className="text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full text-xs font-semibold">{DISORDER_MAP[knownDxId]?.name?.split("(")[0].trim()}</span>}
            {confirmedDxId&&<span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${confirmSaved?"text-emerald-700 bg-emerald-50 border-emerald-200":"text-violet-700 bg-violet-50 border-violet-200"}`}>
              {confirmSaved?"✓ confirmed":"unsaved"}
            </span>}
            {reportSigned&&<span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold">✓ signed</span>}
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <select value={clinicalContext??""} onChange={e=>setClinicalContext(e.target.value||null)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 max-w-[200px] truncate focus:outline-none focus:ring-1 focus:ring-blue-400"
              title="Clinical context adjusts pre-test probability priors">
              <option value="">Context: none</option>
              {CLINICAL_CONTEXTS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={analyze} disabled={entered===0}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40">
              Analyze
            </button>
            <button onClick={save} disabled={saving||entered===0}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40">
              {saving?<Spinner s={3}/>:"Save"}
            </button>
            {saveError&&<span className="text-xs text-red-500 font-semibold max-w-[160px] truncate" title={saveError}>✗ {saveError}</span>}
          </div>
        </div>
        {/* Row 2: tabs */}
        <div className="flex items-center gap-0.5 pt-1">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>t.avail&&setTab(t.id)} disabled={!t.avail}
              className={`text-sm px-4 py-2 font-medium transition-colors border-b-2 -mb-px
                ${tab===t.id?"border-slate-900 text-slate-900":t.avail?"border-transparent text-slate-400 hover:text-slate-700":"border-transparent text-slate-200 cursor-not-allowed"}`}>
              {t.label}{t.badge?" "+t.badge:""}
              {t.warn&&<span className="ml-1 text-orange-500">⚠</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab==="data"&&(
          <div className="max-w-screen-2xl mx-auto px-5 py-4 space-y-4">
            {/* Demographics */}
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Patient demographics</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Date of birth</label>
                  <input type="date" value={demo.dob} onChange={e=>setDemo(p=>({...p,dob:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-300"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Gender</label>
                  <select value={demo.gender} onChange={e=>setDemo(p=>({...p,gender:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-300 bg-white">
                    <option value="">—</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Sample collection date</label>
                  <input type="date" value={demo.sampleDate} onChange={e=>setDemo(p=>({...p,sampleDate:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-300"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Age at collection</label>
                  <div className="border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 bg-slate-50">
                    {ageStr||"—"}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Age (free text)</label>
                  <input value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 3y 4m"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-300"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Analytical method</label>
                  <select value={demo.method||""} onChange={e=>setDemo(p=>({...p,method:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-300 bg-white">
                    <option value="">— not specified —</option>
                    <option value="IEC">IEC (ion exchange chromatography)</option>
                    <option value="UPLC">UPLC / HPLC</option>
                    <option value="LCMSMS">LC-MS/MS</option>
                    <option value="GCMS">GC-MS (organic acids)</option>
                    <option value="MSMS_FIA">MS/MS flow injection (NBS)</option>
                    <option value="other">Other / unknown</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Birth weight (g)</label>
                  <input type="number" value={demo.birthWeight||""} onChange={e=>setDemo(p=>({...p,birthWeight:e.target.value}))}
                    placeholder="e.g. 3200" min="250" max="6000" step="10"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-300"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Fasting state</label>
                  <select value={demo.fasting||""} onChange={e=>setDemo(p=>({...p,fasting:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-300 bg-white">
                    <option value="">— not specified —</option>
                    <option value="fasting">Fasting (≥4h infant / ≥8h child/adult)</option>
                    <option value="postprandial">Postprandial (&lt;4h since feed/meal)</option>
                    <option value="random">Random / unknown</option>
                  </select>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Clinical note (brief)</label>
                  <input value={clinicalNote} onChange={e=>setClinicalNote(e.target.value)} placeholder="e.g. hypoglycaemia, failure to thrive…"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-300"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Extended clinical notes</label>
                  <textarea value={demo.notes} onChange={e=>setDemo(p=>({...p,notes:e.target.value}))}
                    placeholder="Presenting symptoms, clinical context, relevant history…"
                    rows={2} className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-300 resize-none"/>
                </div>
              </div>
            </div>

            <DropZone onFile={handleFile} busy={extractBusy}/>
            <div className="flex gap-2">
              {[["PAA","Plasma Amino Acids",PAA_ANALYTES],["UOA","Urine Organic Acids",UOA_ANALYTES],["AC","Acylcarnitines",AC_ANALYTES],["CAR","Plasma Carnitine",CAR_ANALYTES],["UAG","Urine Acylglycines",UAG_ANALYTES],["MISC","Miscellaneous",MISC_ANALYTES]].map(([key,label,analytes])=>{
                const loaded=analytes.some(a=>values[key]?.[a.id]!=="");
                return(
                  <div key={key} className={`flex-1 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors
                    ${loaded?"border-emerald-300 bg-emerald-50 text-emerald-700":"border-slate-200 bg-slate-50 text-slate-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${loaded?"bg-emerald-400":"bg-slate-300"}`}/>
                    <span>{key}</span>
                    <span className="font-normal hidden sm:inline truncate">{label}</span>
                    {loaded&&<span className="ml-auto">✓</span>}
                  </div>
                );
              })}
            </div>
            {extractErr&&<div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{extractErr}</div>}
            {hits.size>0&&!extractErr&&(
              <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"/>
                {hits.size} values extracted — blue cells. Review and correct before analyzing.
              </div>
            )}
            <ModifierPanel active={activeModifiers} onChange={handleModifiers}/>

            {/* Known diagnosis */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
                <div className="flex-shrink-0">
                  <div className="text-xs font-bold text-slate-700">Known diagnosis</div>
                  <div className="text-[11px] text-slate-400">If set, results show monitoring view + secondary considerations</div>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <DxSelect value={knownDxId} onChange={id=>{setKnownDxId(id);setResults(null);}}
                    placeholder="— no known diagnosis (diagnostic mode) —"/>
                </div>
                {knownDxId&&(
                  <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1 rounded-lg font-semibold flex-shrink-0">
                    📋 Monitoring: {DISORDER_MAP[knownDxId]?.name?.split("(")[0].trim()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-0.5 border-b border-slate-200">
              {PANELS.map(p=>{
                const cnt=Object.values(values[p.id]).filter(v=>v!=="").length;
                const abn=p.analytes.filter(a=>{const v=parseFloat(values[p.id][a.id]);return !isNaN(v)&&(v>a.hi||(a.lo>0&&v<a.lo));}).length;
                return(
                  <button key={p.id} onClick={()=>setPanel(p.id)}
                    className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px
                      ${panel===p.id?"border-slate-800 text-slate-800":"border-transparent text-slate-400 hover:text-slate-600"}`}>
                    {p.label}{cnt>0&&<span className="ml-1.5 font-normal text-slate-400">({cnt}{abn>0&&<span className="text-rose-500"> · {abn}↑</span>})</span>}
                  </button>
                );
              })}
            </div>
            {PANELS.filter(p=>p.id===panel).map(p=>(
              <div key={p.id} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                {p.analytes.map(a=>(
                  <ValueCell key={a.id} analyte={a} value={values[p.id][a.id]}
                    onChange={(id,v)=>onChange(p.id,id,v)} highlighted={hits.has(a.id)}/>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab==="profile"&&(
          <div className="flex-1 overflow-y-auto">
            <ProfileTab values={values}/>
          </div>
        )}

        {tab==="results"&&results&&(
          <div className="max-w-screen-xl mx-auto px-5 py-4 space-y-4">

            {/* ── NBS / FIA method warning ── */}
            {demo?.method==="MSMS_FIA"&&(
              <div className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-xl px-4 py-3">
                <span className="text-red-500 flex-shrink-0 text-lg mt-0.5">⚠</span>
                <div className="text-xs text-red-900 leading-relaxed">
                  <span className="font-bold">Flow injection MS/MS (NBS platform) is not adequate for primary diagnosis.</span> The ACMG technical standard (Miller 2021; Sharer 2018) explicitly states that non-separatory FIA-MS/MS cannot resolve isobaric and isomeric species, making it unsuitable for diagnostic use. Results from NBS cards should be confirmed by separatory methods (LC-MS/MS, IEC, UPLC, or GC-MS) before any diagnosis is established.
                </div>
              </div>
            )}

            {/* ── Age-adjusted scoring notice ── */}
            {(()=>{const am=parseAgeMonths(demo,age); const grp=getAgeGroup(am); return am!==null&&grp!=="adult"?(
              <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5 text-xs text-sky-800">
                <span className="text-sky-500">ℹ</span>
                <span>Age-adjusted reference ranges applied for <strong>{grp}</strong> ({ageStr}) — reference limits for Phe, Tyr, Gly, Leu, Ile, Val, Cit, Orn{grp==="neonate"?" and selected acylcarnitines":""} adjusted to age-appropriate intervals (Applegarth 1979; ACMG 2018/2021).</span>
              </div>
            ):null;})()}

            {/* ── CLIR covariate notice ── */}
            {(()=>{
              const cov=parseDemoForCovariates(demo,age);
              if(cov.ageHours===null&&cov.birthWeightG===null) return null;
              const parts=[];
              if(cov.ageHours!==null) parts.push(`age ${cov.ageHours<48?cov.ageHours.toFixed(0)+"h":cov.ageHours<720?(cov.ageHours/24).toFixed(0)+"d":(cov.ageHours/720).toFixed(0)+"mo"}`);
              if(cov.birthWeightG!==null) parts.push(`BW ${cov.birthWeightG}g`);
              return(
                <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5 text-xs text-violet-800">
                  <span className="text-violet-500">Z</span>
                  <span>Continuous covariate-adjusted Z-scores computed ({parts.join(", ")}) for key analytes (C3, C0, C8, C16, C5-OH, Phe, Tyr, Met, Gly) — approximating CLIR MoM methodology (Gavrilov 2020, Rowe 2021). Z-scores shown alongside standard x-fold values on result markers.</span>
                </div>
              );
            })()}

            {/* ── Specimen quality / data adequacy assessment ── */}
            {(()=>{
              const issues=[];
              // Check minimum panel completeness
              const panelCounts={};
              const panelTotals={PAA:PAA_ANALYTES.length,UOA:UOA_ANALYTES.length,AC:AC_ANALYTES.length,CAR:CAR_ANALYTES.length,UAG:UAG_ANALYTES.length,MISC:MISC_ANALYTES.length};
              const coreAC=["C0","C3","C5","C8","C14_1","C16","C16OH"]; // minimum for meaningful AC interpretation
              const corePAA=["Phe","Tyr","Met","Gly","Leu","Cit","Orn"]; // minimum for meaningful PAA interpretation
              const coreUOA=["MMA","EMA","GA","Lactic"]; // minimum for meaningful UOA interpretation
              for(const [p,analytes] of Object.entries(PANEL_ANALYTES)){
                const filled=analytes.filter(a=>values[p]?.[a.id]!==""&&values[p]?.[a.id]!=null).length;
                panelCounts[p]=filled;
              }
              // Check if panels were started but very incomplete
              if(panelCounts.AC>0&&panelCounts.AC<5) issues.push({level:"warn",text:`Acylcarnitine panel has only ${panelCounts.AC} of ${panelTotals.AC} analytes entered. Insufficient for reliable pattern recognition — at minimum enter ${coreAC.join(", ")}.`});
              if(panelCounts.PAA>0&&panelCounts.PAA<5) issues.push({level:"warn",text:`Amino acid panel has only ${panelCounts.PAA} of ${panelTotals.PAA} analytes entered. At minimum enter ${corePAA.join(", ")}.`});
              if(panelCounts.UOA>0&&panelCounts.UOA<3) issues.push({level:"warn",text:`Organic acid panel has only ${panelCounts.UOA} of ${panelTotals.UOA} analytes entered. At minimum enter ${coreUOA.join(", ")}.`});
              // Check if only one panel type was entered
              const activePanelCount=Object.values(panelCounts).filter(c=>c>0).length;
              if(activePanelCount===1) issues.push({level:"info",text:"Only a single panel has been entered. Multi-panel interpretation (amino acids + organic acids + acylcarnitines) provides substantially more diagnostic power. Sharer 2018, Miller 2021."});
              // Check if carnitine panel missing when AC entered
              if(panelCounts.AC>3&&panelCounts.CAR===0) issues.push({level:"info",text:"Acylcarnitine panel entered without free/total carnitine. Add carnitine data to distinguish primary from secondary carnitine depletion (Oglesbee 2017)."});
              // Check fasting state not specified
              if(!demo?.fasting&&panelCounts.PAA>0) issues.push({level:"info",text:"Fasting state not specified. Amino acid levels (particularly BCAA, alanine, glycine) are significantly affected by postprandial status. Indicate fasting state in demographics for optimal interpretation."});
              // No issues
              if(!issues.length) return null;
              const worst=issues.some(i=>i.level==="warn")?"warn":"info";
              return(
                <div className={`rounded-xl border px-4 py-3 ${worst==="warn"?"border-amber-300 bg-amber-50":"border-slate-200 bg-slate-50"}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${worst==="warn"?"text-amber-700":"text-slate-500"}`}>
                    Data quality assessment
                  </div>
                  <div className="space-y-1">
                    {issues.map((iss,i)=>(
                      <div key={i} className={`flex items-start gap-2 text-xs ${iss.level==="warn"?"text-amber-800":"text-slate-600"}`}>
                        <span className="flex-shrink-0 mt-0.5">{iss.level==="warn"?"⚠":"ℹ"}</span>
                        <span>{iss.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── Biochemical Pattern Panel ── */}
            {patterns&&patterns.length>0&&(
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-600">Biochemical patterns detected</span>
                  <span className="text-[10px] text-slate-400 ml-1">— mechanistic axes active in this profile</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {patterns.map(p=>(
                    <details key={p.id} className="group">
                      <summary className="cursor-pointer select-none list-none flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                          {/* Confidence badge */}
                          <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            p.confidence==="definite"?"bg-red-50 text-red-700 border-red-200":
                            p.confidence==="probable"?"bg-amber-50 text-amber-700 border-amber-200":
                            "bg-blue-50 text-blue-700 border-blue-200"}`}>
                            {p.confidence==="definite"?"●●● DEFINITE":p.confidence==="probable"?"●● PROBABLE":"● POSSIBLE"}
                          </span>
                          <span className="text-sm font-bold text-slate-800">{p.name}</span>
                          {/* Hit chips */}
                          <div className="flex flex-wrap gap-1 ml-1">
                            {p.hits.map((h,i)=>(
                              <span key={i} style={{background:p.bgColor,borderColor:p.borderColor,color:p.color}}
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded border">{h.label}</span>
                            ))}
                          </div>
                        </div>
                        <span className="text-slate-300 text-xs shrink-0 group-open:rotate-180 transition-transform mt-0.5">▼</span>
                      </summary>
                      <div className="px-4 pb-4 pt-1 space-y-2 text-[11.5px] text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                        <div>
                          <span className="font-bold text-slate-700">Mechanism: </span>{p.mechanism}
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Differentials: </span>
                          <span style={{color:p.color}} className="font-semibold">{p.differentials}</span>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Scoring key */}
            <details className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-500 group">
              <summary className="cursor-pointer font-semibold text-slate-600 select-none list-none flex items-center gap-2">
                <span className="text-slate-400">?</span> How scoring works
                <span className="ml-auto text-slate-300 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] leading-relaxed">
                <div>
                  <div className="font-bold text-slate-700 mb-1">Score (pts)</div>
                  Each disorder has signature analytes weighted 1–3.<br/>
                  <span className="font-semibold">Weight 3</span> = pathognomonic (e.g. succinylacetone in TYR1).<br/>
                  <span className="font-semibold">Weight 2</span> = highly specific.<br/>
                  <span className="font-semibold">Weight 1</span> = supportive.<br/>
                  Score = weighted match sum ÷ max possible × 100. The top result is always 100 pts; others are shown relative to it.
                </div>
                <div>
                  <div className="font-bold text-slate-700 mb-1">Confidence levels</div>
                  <span className="font-bold text-red-700">HIGH</span> — strong biochemical signal (≥40 pts raw)<br/>
                  <span className="font-bold text-amber-700">MODERATE</span> — consistent pattern (≥20 pts)<br/>
                  <span className="font-bold text-blue-700">LOW</span> — partial or weak signal (≥8 pts)<br/>
                  <span className="font-bold text-slate-500">TRACE</span> — minimal signal (&lt;8 pts)<br/><br/>
                  <span className="font-bold">↑x.x×</span> on each marker = fold above/below the reference limit.
                </div>
                <div>
                  <div className="font-bold text-slate-700 mb-1">Cross-panel synthesis</div>
                  All panels (PAA, UOA, AC, CAR, UAG) are scored together simultaneously. A disorder with markers across multiple panels will accumulate evidence from all of them in one combined score.<br/><br/>
                  <span className="font-bold text-blue-600">✦ cross-panel</span> on a result card means markers from more than one panel are contributing to that score.
                </div>
                <div>
                  <div className="font-bold text-slate-700 mb-1">LR product &amp; clinical context</div>
                  The <span className="font-bold">LR ×</span> figure is a naive Bayes likelihood ratio product across all abnormal analytes (Norris et al., JIMD 2007). It gives the score a direct statistical interpretation: LR &gt;10 = strong evidence, &gt;100 = very strong.<br/><br/>
                  The <span className="font-bold">Context</span> dropdown applies a pre-test probability prior that shifts rankings based on the clinical presentation (Turgeon et al., JIMD 2014). Biochemical signal always dominates — context provides a tiebreaker when signals are similar.
                </div>
              </div>
            </details>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.keys(CAT_CLR).map(cat=>{
                const best=top.find(r=>r.category===cat);
                const cc=CAT_CLR[cat],conf=best?confLevel(best.score):null;
                return(
                  <div key={cat} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                    <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{color:cc}}>{cat}</div>
                    {best?(<><div className="text-xs font-semibold text-slate-700 leading-tight truncate" title={best.name}>{best.name.split("(")[0].trim()}</div>
                      <span className={`text-[10px] font-bold px-1 py-0.5 rounded border mt-1 inline-block ${conf.cls}`}>{conf.label}</span></>)
                      :<div className="text-xs text-slate-300">No signal</div>}
                  </div>
                );
              })}
            </div>

            {activeModifiers.length>0&&(
              <div className="flex items-center gap-2 flex-wrap text-xs bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                <span className="text-orange-600 font-bold">⚠ Active modifiers:</span>
                {activeModifiers.map(id=>{
                  const m=MODIFIER_MAP[id];
                  return <span key={id} className="text-orange-700 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded font-semibold">{m?.label}</span>;
                })}
                <span className="text-orange-500 ml-1">— affected analyte signals are attenuated. Warnings shown on individual cards.</span>
              </div>
            )}

            {/* Monitoring report — shown when known diagnosis is set */}
            {knownDxId&&DISORDER_MAP[knownDxId]&&(()=>{
              const ap=new Set(Object.entries(values).filter(([,p])=>Object.values(p).some(v=>v!=="")).map(([k])=>k));
              return(
                <MonitoringReport disorder={DISORDER_MAP[knownDxId]} values={values} activePanels={ap}/>
              );
            })()}

            {/* Confirm diagnosis panel */}
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <div className="text-xs font-bold text-slate-700">Confirm diagnosis</div>
                  <div className="text-[11px] text-slate-400">Trains the model for future analyses</div>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <DxSelect value={confirmedDxId} onChange={id=>{setConfirmedDxId(id);setConfirmSaved(false);}}
                    placeholder="— select confirmed diagnosis —"/>
                </div>
                {confirmedDxId&&<div className="flex items-center gap-2 text-xs">
                  <span className="text-violet-700 bg-violet-50 border border-violet-200 px-2 py-1 rounded-lg font-semibold">{DISORDER_MAP[confirmedDxId]?.name}</span>
                  <span className="text-slate-400">— save case to commit</span>
                </div>}
              </div>
            </div>

            {/* Differential — labelled differently depending on whether there's a known diagnosis */}
            {knownDxId?(
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold text-slate-600">Secondary diagnostic considerations</div>
                  <div className="text-[11px] text-slate-400">— engine runs on full profile regardless of known diagnosis; review for co-existing or alternative conditions</div>
                </div>
                {top.filter(r=>r.id!==knownDxId).length===0
                  ?<div className="text-center py-8 text-slate-400 text-sm">No secondary candidates above threshold.</div>
                  :top.filter(r=>r.id!==knownDxId).map((r,i)=><ResultCard key={r.id} result={r} rank={i+1}/>)}
              </div>
            ):(
              <div className="space-y-2">
                {top.length===0?<div className="text-center py-12 text-slate-400 text-sm">No disorders scored above threshold.</div>
                 :top.map((r,i)=><ResultCard key={r.id} result={r} rank={i+1}/>)}
              </div>
            )}

            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800 leading-relaxed">
              <strong>Disclaimer:</strong> Pattern-based probabilistic ranking from published biochemical signatures. Not a clinical diagnosis. All findings require confirmatory testing and specialist interpretation.
            </div>
          </div>
        )}

        {tab==="review"&&(
          <ReviewTab
            reviewer={reviewer} setReviewer={v=>typeof v==="function"?setReviewer(v):setReviewer(v)}
            narrative={narrative}
            onGenerateNarrative={handleGenerateNarrative}
            narrativeBusy={narrativeBusy}
            narrativeErr={narrativeErr}
            onSign={handleSign}
            signed={reportSigned}
            results={results}
            entered={entered}
          />
        )}

        {tab==="report"&&reportSigned&&(
          <ReportTab
            caseLabel={label}
            createdAt={init?.createdAt??new Date().toISOString()}
            values={values}
            activePanels={activePanels}
            activeModifiers={activeModifiers}
            knownDxId={knownDxId}
            results={results}
            reviewer={reviewer}
            narrative={narrative}
            confirmedDxId={confirmedDxId}
            demo={demo}
          />
        )}
      </div>
    </div>
  );
}

// ─── CASE LIST ───────────────────────────────────────────────
function CaseList({cases,loading,onOpen,onNew,onDelete,onRefresh,onSaveAll,saveAllBusy}){
  const [search,setSearch]=useState("");
  const sorted=[...cases].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const filtered=search.trim()===""?sorted:sorted.filter(c=>{
    const q=search.toLowerCase();
    const confirmedName=c.confirmedDxId?DISORDER_MAP[c.confirmedDxId]?.name??"":"";
    return (c.label??"").toLowerCase().includes(q)||(c.topDx??"").toLowerCase().includes(q)||confirmedName.toLowerCase().includes(q)||(c.clinicalNote??"").toLowerCase().includes(q);
  });

  return(
    <div className="max-w-screen-xl mx-auto px-5 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Case Library</h2>
          <p className="text-xs text-slate-400 mt-0.5">Shared · {cases.length} {cases.length===1?"case":"cases"} · newest first</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search cases…"
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-300 w-40"/>
          <button onClick={onRefresh} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Refresh">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
          <button onClick={onSaveAll} disabled={saveAllBusy}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-40">
            {saveAllBusy?<><Spinner s={3}/> Saving…</>:"↑ Save all"}
          </button>
          <button onClick={onNew} className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-700 active:scale-95 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            New Case
          </button>
        </div>
      </div>

      {loading?<div className="flex items-center justify-center py-20 text-slate-300"><Spinner s={6}/></div>
      :sorted.length===0?(
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <p className="text-sm font-semibold text-slate-600">No cases yet</p>
          <p className="text-xs text-slate-400 mt-1">Cases are shared with all collaborators.</p>
          <button onClick={onNew} className="mt-4 bg-slate-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-colors">New Case</button>
        </div>
      ):(
        <div className="space-y-2">
          {filtered.length===0&&search.trim()!==""&&(
            <div className="text-center py-10 text-sm text-slate-400">No cases match "{search}"</div>
          )}
          {filtered.map((c,idx)=>{
            const cc=c.confirmedDxId?CAT_CLR[DISORDER_MAP[c.confirmedDxId]?.category]??null:null;
            const topDxShort=c.topDx?.split("(")[0].trim();
            const confirmedShort=c.confirmedDxId?DISORDER_MAP[c.confirmedDxId]?.name?.split("(")[0].trim():null;
            return(
              <div key={c.id} onClick={()=>onOpen(c.id)}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-sm cursor-pointer group transition-all">
                <div className="flex items-stretch">
                  {/* Colour left bar — green if confirmed, blue if analyzed, grey if not */}
                  <div className="w-1 flex-shrink-0 rounded-l-xl"
                    style={{background: cc?cc:c.topDx?"#94a3b8":"#e2e8f0"}}/>

                  <div className="flex-1 min-w-0 px-4 py-3">
                    {/* Top row — case number + label */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-slate-300">#{sorted.length-idx}</span>
                          <span className="font-semibold text-sm text-slate-800 truncate">{c.label}</span>
                        </div>

                        {/* Demographics row */}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {c.age&&<span className="text-xs text-slate-600 font-medium">{c.age}</span>}
                          {c.sex&&<span className="text-xs text-slate-500">{c.sex}</span>}
                          {c.clinicalNote&&<span className="text-xs text-slate-500 italic truncate max-w-[200px]" title={c.clinicalNote}>{c.clinicalNote}</span>}
                        </div>

                        {/* Middle row — panels + values + abnormals */}
                        <div className="flex items-center gap-3 mt-1 flex-wrap text-[10px] text-slate-400">
                          <span>{fmtDate(c.createdAt)}</span>
                          {c.panels?.length>0&&(
                            <span className="font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                              {c.panels.join(" · ")}
                            </span>
                          )}
                          <span>{c.enteredCount} values</span>
                          {c.abnormalCount>0&&(
                            <span className="text-rose-500 font-semibold">{c.abnormalCount} abnormal</span>
                          )}
                          {(c.modifierCount||0)>0&&(
                            <span className="text-orange-500 font-semibold">⚠ {c.modifierCount} modifier{c.modifierCount>1?"s":""}</span>
                          )}
                          {c.reportSigned&&(
                            <span className="text-emerald-600 font-semibold">✓ signed</span>
                          )}
                        </div>
                      </div>

                      {/* Right side — diagnosis badge + arrow */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          {confirmedShort?(
                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg text-white inline-block"
                              style={{background:cc??"#059669"}}>
                              ✓ {confirmedShort}
                            </span>
                          ):topDxShort?(
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block max-w-[140px] truncate"
                              title={c.topDx}>
                              {topDxShort}
                            </span>
                          ):c.topDx===null&&c.enteredCount>0?(
                            <span className="text-[10px] text-slate-300">not analyzed</span>
                          ):null}
                        </div>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                        </svg>
                        <button onClick={e=>{e.stopPropagation();if(window.confirm("Delete this case?"))onDelete(c.id);}}
                          className="text-slate-200 hover:text-red-500 transition-colors p-1 rounded">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SEED DATA ───────────────────────────────────────────────
// Case 1: Quest Diagnostics PAA, DOB 07/29/2020, collected 08/06/2020 (day-8 neonate)
// Sample noted slightly icteric. UOA and acylcarnitines not performed.
// Analytes not in current panel (reported but unmapped): Sarcosine 2, Beta-Alanine H12,
//   Taurine 68, Beta-Aminoisobutyric Acid 7, Cystathionine <1.
// Homocystine reported as <1 (disulfide dimer form) — distinct from total plasma Hcy;
//   Hcy field left blank as the two assays are not equivalent.
const SEED_CASE_1 = {
  id:"seed_case_1",
  label:"Case 1 — Quest PAA (DOB 29/07/2020, day-8 neonate)",
  createdAt:"2020-08-06T15:25:00.000Z",
  activeModifiers:["newborn"],
  panels:["PAA"],
  values:{
    PAA:{
      Ala:"304", Arg:"11",  Asn:"37",  Asp:"42",  Cit:"11",
      Gln:"608", Glu:"171", Gly:"380", His:"102", Ile:"82",
      Leu:"143", Lys:"149", Met:"18",  Orn:"242", Phe:"666",
      Pro:"183", Ser:"353", Thr:"100", Tyr:"63",  Val:"217",
      AlloIle:"", Hcy:"",   ASA:"",    Pip:"",
      Trp:"45",  AABA:"14", Etha:"21", "3MHis":"3",
      GABA:"0.5","1MHis":"0.5", AAAdp:"0.5", HyPro:"42",
      Sarc:"2",  BAla:"12",
    },
    UOA:Object.fromEntries(UOA_ANALYTES.map(a=>[a.id,""])),
    AC: Object.fromEntries(AC_ANALYTES.map(a=>[a.id,""])),
  },
  confirmedDxId:null,
  results:null,
  enteredCount:28,
  abnormalCount:4,  // Phe↑, Orn↑, Ser↑, Asp↑
  topDx:null,
};

// Case 2: 2-month-old male infant. PAA only.
// Notable unmapped analytes: Phosphoethanolamine 8 µmol/L (ref 0–2) — 4× ULN,
//   primary plasma marker for hypophosphatasia (ALPL deficiency).
//   Homocitrulline <2 (ref 0–2) — normal, argues against HHH syndrome.
// Note: app reference ranges are approximate adult values. Age-specific infant
//   ranges should supersede for interpretation — Citrulline and Met may have
//   wider normal intervals at 2 months; however lab-reported flags are used here.
// AlloIle <2 and ASA <2 entered as 1 (below detection).
// Data cuts off at Phenylalanine — remaining analytes left blank.
const SEED_CASE_2 = {
  id:"seed_case_2",
  label:"Case 2 — 2mo male · PAA · Cit↑ Met↑ Glu↑ PEA↑(unmapped)",
  createdAt:new Date().toISOString(),
  activeModifiers:[],   // past neonatal period; no specific modifier applies without more clinical info
  panels:["PAA"],
  values:{
    PAA:{
      Ala:"401", Arg:"101", Asn:"38",  Asp:"26",  Cit:"52",
      Gln:"471", Glu:"222", Gly:"397", His:"",    Ile:"44",
      Leu:"75",  Lys:"244", Met:"54",  Orn:"128", Phe:"54",
      Pro:"",    Ser:"",    Thr:"",    Tyr:"",    Val:"",
      AlloIle:"1", Hcy:"", ASA:"1",   Pip:"",
      Trp:"",  AABA:"8",  Etha:"",   "3MHis":"",
      GABA:"", "1MHis":"", AAAdp:"",  HyPro:"",
    },
    UOA:Object.fromEntries(UOA_ANALYTES.map(a=>[a.id,""])),
    AC: Object.fromEntries(AC_ANALYTES.map(a=>[a.id,""])),
  },
  confirmedDxId:null,
  results:null,
  enteredCount:16,
  abnormalCount:3,
  topDx:null,
};

// Case 3: 8-month-old male. Three serial PAA timepoints from UF Health Pathology.
// Pattern: Gln markedly elevated (hyperammonemia marker), Arg↑, Ala↑, Cit↑→normalising,
//   BCAAs persistently low (protein restriction), Phe↓ (protein restriction).
//   Phosphoethanolamine elevated at all three timepoints (hypophosphatasia — unmapped).
//   Homocitrulline <2 at all timepoints (argues against HHH).
//   AlloIle <2 at all timepoints (argues against MSUD).
// Data provided cuts off at Phenylalanine — Pro, Ser, Thr, Tyr, Val, Trp etc. left blank.
// <2 entered as 1. Citrulline T3 = 0 entered as 0.5 (below detection).

const _case3base = ()=>({
  activeModifiers:[],
  panels:["PAA"],
  confirmedDxId:null, results:null,
  UOA:Object.fromEntries(UOA_ANALYTES.map(a=>[a.id,""])),
  AC: Object.fromEntries(AC_ANALYTES.map(a=>[a.id,""])),
});
const SEED_CASE_3A = {
  id:"seed_case_3a",
  label:"Case 3a — T1 · 8mo male · Gln↑↑ Arg↑ Ala↑ Cit↑ BCAAs↓",
  createdAt:new Date().toISOString(),
  ..._case3base(),
  knownDxId:"ARG1",
  values:{
    PAA:{
      Ala:"841", Arg:"236", Asn:"63",  Asp:"6",   Cit:"83",
      Gln:"1439",Glu:"61",  Gly:"299", His:"",    Ile:"11",
      Leu:"20",  Lys:"95",  Met:"30",  Orn:"163", Phe:"30",
      Pro:"",    Ser:"",    Thr:"",    Tyr:"",    Val:"",
      AlloIle:"1", Hcy:"", ASA:"1",   Pip:"",
      Trp:"",  AABA:"7",  Etha:"",   "3MHis":"",
      GABA:"", "1MHis":"", AAAdp:"",  HyPro:"",
    },
    UOA:Object.fromEntries(UOA_ANALYTES.map(a=>[a.id,""])),
    AC: Object.fromEntries(AC_ANALYTES.map(a=>[a.id,""])),
  },
  enteredCount:16, abnormalCount:6, topDx:null,
};
const SEED_CASE_3B = {
  id:"seed_case_3b",
  label:"Case 3b — T2 · 8mo male · Gln↑ Arg↑ Ala↑ (improving)",
  createdAt:new Date().toISOString(),
  ..._case3base(),
  knownDxId:"ARG1",
  values:{
    PAA:{
      Ala:"747", Arg:"222", Asn:"42",  Asp:"11",  Cit:"40",
      Gln:"940", Glu:"99",  Gly:"189", His:"",    Ile:"6",
      Leu:"13",  Lys:"77",  Met:"22",  Orn:"129", Phe:"23",
      Pro:"",    Ser:"",    Thr:"",    Tyr:"",    Val:"",
      AlloIle:"1", Hcy:"", ASA:"1",   Pip:"",
      Trp:"",  AABA:"8",  Etha:"",   "3MHis":"",
      GABA:"", "1MHis":"", AAAdp:"",  HyPro:"",
    },
    UOA:Object.fromEntries(UOA_ANALYTES.map(a=>[a.id,""])),
    AC: Object.fromEntries(AC_ANALYTES.map(a=>[a.id,""])),
  },
  enteredCount:16, abnormalCount:5, topDx:null,
};
const SEED_CASE_3C = {
  id:"seed_case_3c",
  label:"Case 3c — T3 · 8mo male · Gln normalising · Arg↓ on treatment",
  createdAt:new Date().toISOString(),
  ..._case3base(),
  knownDxId:"ARG1",
  values:{
    PAA:{
      Ala:"333", Arg:"134", Asn:"27",  Asp:"7",   Cit:"0.5",
      Gln:"742", Glu:"69",  Gly:"131", His:"",    Ile:"8",
      Leu:"15",  Lys:"50",  Met:"21",  Orn:"79",  Phe:"21",
      Pro:"",    Ser:"",    Thr:"",    Tyr:"",    Val:"",
      AlloIle:"1", Hcy:"", ASA:"1",   Pip:"",
      Trp:"",  AABA:"7",  Etha:"",   "3MHis":"",
      GABA:"", "1MHis":"", AAAdp:"",  HyPro:"",
    },
    UOA:Object.fromEntries(UOA_ANALYTES.map(a=>[a.id,""])),
    AC: Object.fromEntries(AC_ANALYTES.map(a=>[a.id,""])),
  },
  enteredCount:16, abnormalCount:4, topDx:null,
};

// Case 4: 5-day-old male infant.
// Key abnormals: Orn 381 (2.4× ULN), Ser 707 (3.5× ULN), Gly 747 (1.7× ULN),
//   Asp 114 (2.85× ULN), Asn 110 (mild), PEA 27 (13.5× ULN — unmapped).
// Unmapped analytes: Phosphoethanolamine 27 High (ref 0–2) — primary plasma marker for
//   hypophosphatasia (ALPL deficiency); Sarcosine 2 (normal); Taurine 214 (unmapped, ref ~29–161);
//   Homocitrulline <2 (normal — argues against HHH syndrome despite Orn↑).
// AlloIle 2 within ref (0–3) — argues against MSUD.
// Clinical note: Orn↑ without homocitrullinuria in a neonate — consider P5CS deficiency
//   (pyrroline-5-carboxylate synthase), OAT deficiency (ornithine aminotransferase),
//   or artifact (erythrocytic arginase — see Case 1). Very high Ser: consider phosphoserine
//   phosphatase deficiency or phosphoglycerate dehydrogenase deficiency (though those
//   classically cause LOW serine — elevated Ser is less explained; neonatal physiology
//   and sample timing should be considered). PEA elevation warrants urgent ALP + X-ray.
// Newborn modifier active.
const SEED_CASE_4 = {
  id:"seed_case_4",
  label:"Case 4 — 5d male · Orn↑↑ Ser↑↑ Gly↑ Asp↑ · PEA 13×↑ (unmapped)",
  createdAt:new Date().toISOString(),
  activeModifiers:["newborn"],
  knownDxId:null,
  panels:["PAA"],
  values:{
    PAA:{
      Ala:"436", Arg:"27",  Asn:"110", Asp:"114", Cit:"35",
      Gln:"733", Glu:"166", Gly:"747", His:"",    Ile:"67",
      Leu:"147", Lys:"252", Met:"39",  Orn:"381", Phe:"59",
      Pro:"251", Ser:"707", Thr:"214", Tyr:"96",  Val:"240",
      AlloIle:"2", Hcy:"", ASA:"1",   Pip:"",
      Trp:"60",  AABA:"20", Etha:"",  "3MHis":"",
      GABA:"",   "1MHis":"", AAAdp:"", HyPro:"",
      Sarc:"2",  BAla:"",
    },
    UOA:Object.fromEntries(UOA_ANALYTES.map(a=>[a.id,""])),
    AC: Object.fromEntries(AC_ANALYTES.map(a=>[a.id,""])),
  },
  confirmedDxId:null, results:null,
  enteredCount:22, abnormalCount:5,
  topDx:null,
};

// Case 5: 7-year-old male with elevated ketones.
// Remarkably clean amino acid profile — only mild Gln↑ and Trp↑.
// AlloIle 3 is at the upper limit of the lab's reference range (0–3); borderline only.
// PEA <2 — normal (contrast with Cases 2, 3, 4).
// Key point: elevated ketones in a school-age male with an essentially normal PAA
//   strongly indicates the diagnostic yield lies in UOA (organic acidemias, HMGCL, BKT,
//   ketone utilisation defects) and acylcarnitines (FAO disorders) — neither was performed.
// Catabolic modifier considered: elevated ketones may reflect intercurrent illness or
//   fasting, which would non-specifically elevate Gln. Applied "catabolic" to reflect
//   the clinical context of ketosis.
// AlloIle at upper limit of normal: insufficient evidence for MSUD (intermittent forms
//   require clearly detectable AlloIle above range; borderline values warrant repeat
//   fasting sample and UOA for branched-chain keto acids).
const SEED_CASE_5 = {
  id:"seed_case_5",
  label:"Case 5 — 7yr male · elevated ketones · near-normal PAA · UOA+AC needed",
  createdAt:new Date().toISOString(),
  activeModifiers:["catabolic"],
  knownDxId:null,
  panels:["PAA"],
  values:{
    PAA:{
      Ala:"496", Arg:"101", Asn:"64",  Asp:"2",   Cit:"34",
      Gln:"832", Glu:"23",  Gly:"382", His:"",    Ile:"68",
      Leu:"121", Lys:"145", Met:"33",  Orn:"59",  Phe:"51",
      Pro:"339", Ser:"204", Thr:"168", Tyr:"68",  Val:"264",
      AlloIle:"3", Hcy:"", ASA:"1",   Pip:"",
      Trp:"88",  AABA:"15", Etha:"",  "3MHis":"",
      GABA:"",   "1MHis":"", AAAdp:"", HyPro:"",
    },
    UOA:Object.fromEntries(UOA_ANALYTES.map(a=>[a.id,""])),
    AC: Object.fromEntries(AC_ANALYTES.map(a=>[a.id,""])),
  },
  confirmedDxId:null, results:null,
  enteredCount:22, abnormalCount:2,
  topDx:null,
};

async function seedIfEmpty(){
  try{
    const list=await loadList();
    const ids=new Set(list.map(c=>c.id));
    const seeds=[SEED_CASE_1,SEED_CASE_2,SEED_CASE_3A,SEED_CASE_3B,SEED_CASE_3C,SEED_CASE_4,SEED_CASE_5];
    for(const s of seeds){
      if(!ids.has(s.id)) try{ await persistCase(s); }catch(e){ console.warn("seed failed",s.id,e); }
    }
  }catch(e){ console.warn("seedIfEmpty error",e); }
}

// ─── DISORDERS ENCYCLOPEDIA ──────────────────────────────────
function DisordersScreen({onBack}){
  const [search,setSearch]=useState("");
  const [expanded,setExpanded]=useState(null);

  const q=search.trim().toLowerCase();
  const filtered=q.length>1
    ?DISORDERS.filter(d=>d.name.toLowerCase().includes(q)||d.gene?.toLowerCase().includes(q)||d.category?.toLowerCase().includes(q))
    :DISORDERS;

  const byCat={};
  const catOrder=["Aminoacidopathy","Urea Cycle Disorder","Organic Acidemia","Fatty Acid Oxidation","Carbohydrate Disorder","Mitochondrial Disorder","Purine/Pyrimidine","BH4 Disorder","Creatine Disorder"];
  for(const d of filtered){const cat=d.category||"Other";if(!byCat[cat])byCat[cat]=[];byCat[cat].push(d);}
  const entries=catOrder.filter(c=>byCat[c]).map(c=>[c,byCat[c]]);
  Object.keys(byCat).filter(c=>!catOrder.includes(c)).forEach(c=>entries.push([c,byCat[c]]));

  return(
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200 bg-white flex items-center gap-3">
        <button onClick={onBack} className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">← Back</button>
        <h2 className="font-bold text-slate-800 text-sm flex-1">Metabolic Disorders</h2>
        <input
          type="text" value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search by name, gene or category…"
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-56 focus:outline-none focus:border-cyan-400"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8" style={{background:"#f8fafc"}}>
        {entries.length===0&&<p className="text-sm text-slate-400 text-center py-8">No disorders match "{search}"</p>}
        {entries.map(([cat,disorders])=>{
          const cc=CAT_CLR[cat]??"#64748b";
          return(
            <div key={cat}>
              {/* Category header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white" style={{background:cc}}>{cat}</span>
                <span className="text-[10px] text-slate-400">{disorders.length} disorder{disorders.length!==1?"s":""}</span>
              </div>
              <div className="space-y-2">
                {disorders.map(d=>{
                  const mg=MONITORING_GUIDANCE[d.id];
                  const isOpen=expanded===d.id;
                  return(
                    <div key={d.id} className="rounded-xl overflow-hidden bg-white"
                      style={{border:`1px solid ${isOpen?cc:"#e2e8f0"}`,boxShadow:isOpen?"0 2px 8px rgba(0,0,0,0.07)":"0 1px 2px rgba(0,0,0,0.04)",transition:"border-color 0.15s,box-shadow 0.15s"}}>
                      {/* Collapsed row */}
                      <button onClick={()=>setExpanded(isOpen?null:d.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors">
                        {/* Color bar */}
                        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{background:cc,minHeight:"2rem"}}/>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <span className="font-semibold text-sm text-slate-800 leading-tight">{d.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{d.gene}</span>
                        </div>
                        <span className="text-slate-300 text-xs ml-2 flex-shrink-0">{isOpen?"▲":"▼"}</span>
                      </button>
                      {/* Expanded detail — always same 3 sections */}
                      {isOpen&&(
                        <div className="border-t border-slate-100">
                          {/* Section 1: Key markers */}
                          <div className="px-5 py-3 border-b border-slate-100">
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:cc}}>Key diagnostic markers</p>
                            <div className="flex flex-wrap gap-1.5">
                              {d.signature.map((s,i)=>{
                                const aInfo=ANALYTE_MAP[s.id];
                                const label=aInfo?aInfo.name.replace(/ ratio$/i,""):s.id;
                                return(
                                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                                  style={{background:`${cc}15`,color:cc,border:`1px solid ${cc}30`}}>
                                  {s.panel==="MISC"?`${label}*`:label}
                                  <span>{s.direction==="high"?"↑":"↓"}</span>
                                  {s.weight>=3&&<span title="Pathognomonic / very high weight">★</span>}
                                </span>
                                );
                              })}
                            </div>
                            {d.signature.some(s=>s.panel==="MISC")&&
                              <p className="text-[10px] text-slate-400 mt-1.5">* Miscellaneous panel analyte</p>}
                          </div>
                          {/* Section 2: Mechanism & clinical features */}
                          <div className="px-5 py-3 border-b border-slate-100">
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:cc}}>Mechanism &amp; clinical features</p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {d.notes||"See disorder-specific literature for detailed mechanism and clinical phenotype."}
                            </p>
                          </div>
                          {/* Section 3: Management */}
                          <div className="px-5 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:cc}}>Management</p>
                            {mg?(
                              <div className="space-y-2 text-xs text-slate-600">
                                <p className="leading-relaxed">{mg.interventions}</p>
                                {mg.targets&&(
                                  <div className="rounded-lg px-3 py-2 text-xs" style={{background:`${cc}08`,border:`1px solid ${cc}20`}}>
                                    <span className="font-semibold" style={{color:cc}}>Treatment targets: </span>
                                    <span className="text-slate-600">{mg.targets}</span>
                                  </div>
                                )}
                              </div>
                            ):(
                              <p className="text-xs text-slate-400 italic">Management details not yet included — consult disorder-specific guidelines.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────
export default function App(){
  const [screen,setScreen]=useState("home");
  const [cases,setCases]=useState([]);
  const [listLoading,setListLoading]=useState(true);
  const [editCase,setEditCase]=useState(null);
  const [trainingExamples,setTrainingExamples]=useState([]);

  const reload=async()=>{
    setListLoading(true);
    await seedIfEmpty();
    const [list,training]=await Promise.all([loadList(),loadTraining()]);
    setCases(list);setTrainingExamples(training);setListLoading(false);
  };
  useEffect(()=>{reload();},[]);

  const learnedWeights=useMemo(()=>computeLearnedWeights(trainingExamples),[trainingExamples]);
  const confirmedCount=trainingExamples.filter(ex=>ex.confirmedDxId).length;

  const openCase=async(id)=>{const c=await loadFullCase(id);if(c){setEditCase(c);setScreen("editor");}};
  const deleteCase=async(id)=>{await removeCase(id);await removeTrainingExample(id);await reload();};

  return(
    <div style={{fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",background:"#f0f4f8"}} className="h-screen flex flex-col">
      <FontLink/>
      <header className="flex-shrink-0 text-white px-5 py-0 flex items-center gap-4"
        style={{background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1e4d6b 100%)",minHeight:"52px"}}>
        <button onClick={()=>setScreen("home")} className="flex items-center gap-3 hover:opacity-80 transition-opacity py-3">
          {/* Logo: 3×3 coloured squares */}
          <div className="grid grid-cols-3 gap-[3px] w-5 h-5 flex-shrink-0">
            {[["#60a5fa"],["#facc15"],["#34d399"],["#c084fc"],["#f87171"],["#22d3ee"],["#f472b6"],["#fb923c"],["#2dd4bf"]].map(([c],i)=>(
              <div key={i} style={{background:c,borderRadius:"1.5px"}}/>
            ))}
          </div>
          <div className="leading-none">
            <span className="text-lg font-black tracking-tight" style={{letterSpacing:"-0.03em"}}>Metabolic</span><span className="text-lg font-black tracking-tight text-cyan-400" style={{letterSpacing:"-0.03em"}}>Dx</span>
          </div>
        </button>
        <div className="w-px h-5 bg-white/10 flex-shrink-0"/>
        <div className="flex items-center gap-1">
          <button onClick={()=>setScreen("list")} className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${screen==="list"?"bg-white/10 text-white":"text-white/50 hover:text-white/80 hover:bg-white/5"}`}>Cases</button>
          <button onClick={()=>setScreen("disorders")} className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${screen==="disorders"?"bg-white/10 text-white":"text-white/50 hover:text-white/80 hover:bg-white/5"}`}>Disorders</button>
          <button onClick={()=>setScreen("model")} className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${screen==="model"?"bg-white/10 text-white":"text-white/50 hover:text-white/80 hover:bg-white/5"}`}>
            Model
            {confirmedCount>0&&<span className="bg-cyan-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">{confirmedCount}</span>}
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-white/25 border border-white/10 rounded px-1.5 py-0.5 tracking-wide">PROTOTYPE · NOT FOR CLINICAL USE</span>
          {STORAGE_MODE==="memory"&&(
            <span className="text-[10px] font-bold text-amber-400 border border-amber-600/50 rounded px-1.5 py-0.5" title="Supabase env vars not set at build time — saves lost on reload">⚠ MEMORY ONLY</span>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {screen==="home"&&(
          <div className="h-full overflow-y-auto flex flex-col items-center justify-center px-6"
            style={{background:"linear-gradient(160deg,#e8f0fe 0%,#f0f4f8 40%,#e6f4f1 100%)"}}>
            <div className="max-w-lg w-full text-center space-y-8">
              {/* Logo + wordmark */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-[5px] w-16 h-16 mx-auto">
                  {[["#60a5fa"],["#facc15"],["#34d399"],["#c084fc"],["#f87171"],["#22d3ee"],["#f472b6"],["#fb923c"],["#2dd4bf"]].map(([c],i)=>(
                    <div key={i} style={{background:c,borderRadius:"4px",boxShadow:`0 2px 6px ${c}88`}}/>
                  ))}
                </div>
                <div>
                  <h1 className="font-black tracking-tight" style={{fontSize:"2.6rem",lineHeight:1.05,letterSpacing:"-0.04em",color:"#0f172a"}}>
                    Metabolic<span style={{color:"#0891b2"}}>Dx</span>
                  </h1>
                  <p className="text-sm text-slate-500 mt-2 font-light leading-relaxed">Analysis tool for laboratory data used for the diagnosis of inborn errors of metabolism — with insights in the various inborn errors of metabolism</p>
                </div>
              </div>

              {/* Action cards */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={()=>{setEditCase(null);setScreen("editor");}}
                  className="flex flex-col items-start gap-2 rounded-2xl px-5 py-5 text-left group transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{background:"white",border:"1px solid #e2e8f0",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                  <span className="text-2xl">＋</span>
                  <span className="font-bold text-slate-800 text-sm">New case</span>
                  <span className="text-xs text-slate-400 leading-relaxed">Enter lab values and run analysis</span>
                </button>
                <button onClick={()=>setScreen("list")}
                  className="flex flex-col items-start gap-2 rounded-2xl px-5 py-5 text-left group transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{background:"white",border:"1px solid #e2e8f0",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                  <span className="text-2xl">📁</span>
                  <span className="font-bold text-slate-800 text-sm">Cases</span>
                  <span className="text-xs text-slate-400 leading-relaxed">{listLoading?"Loading…":`${cases.length} saved case${cases.length!==1?"s":""}`}</span>
                </button>
                <button onClick={()=>setScreen("disorders")}
                  className="flex flex-col items-start gap-2 rounded-2xl px-5 py-5 text-left group transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{background:"white",border:"1px solid #e2e8f0",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                  <span className="text-2xl">🔬</span>
                  <span className="font-bold text-slate-800 text-sm">Metabolic disorders</span>
                  <span className="text-xs text-slate-400 leading-relaxed">{DISORDERS.length} disorders — mechanisms, markers &amp; management</span>
                </button>
                <button onClick={()=>setScreen("model")}
                  className="flex flex-col items-start gap-2 rounded-2xl px-5 py-5 text-left group transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{background:"white",border:"1px solid #e2e8f0",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                  <span className="text-2xl">🧠</span>
                  <span className="font-bold text-slate-800 text-sm">Model</span>
                  <span className="text-xs text-slate-400 leading-relaxed">{confirmedCount>0?`${confirmedCount} confirmed case${confirmedCount!==1?"s":""} in training set`:"No training data yet"}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-300 border border-slate-200 rounded-xl px-4 py-2.5 bg-white/50">
                PROTOTYPE · NOT FOR CLINICAL USE · Results require expert biochemical genetics interpretation
              </p>
            </div>
          </div>
        )}
        {screen==="list"&&<div className="h-full overflow-y-auto"><CaseList cases={cases} loading={listLoading} onOpen={openCase} onNew={()=>{setEditCase(null);setScreen("editor");}} onDelete={deleteCase} onRefresh={reload}/></div>}
        {screen==="model"&&<div className="h-full overflow-y-auto"><ModelView learnedWeights={learnedWeights} trainingExamples={trainingExamples}/></div>}
        {screen==="disorders"&&<div className="h-full overflow-hidden"><DisordersScreen onBack={()=>setScreen("home")}/></div>}
        {screen==="editor"&&<div className="h-full flex flex-col overflow-hidden"><CaseEditor init={editCase} learnedWeights={learnedWeights} onSave={async()=>{await reload();setScreen("list");}} onBack={()=>setScreen("list")}/></div>}
      </div>
    </div>
  );
}
