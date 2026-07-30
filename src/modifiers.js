// Clinical modifiers and context priors.
//
// MODIFIERS suppress specific markers once a confounder is known (diet, drug,
// specimen handling); CLINICAL_CONTEXTS shift pre-test probability. Both are
// expert-set for this tool — see the PROVENANCE note above CLINICAL_CONTEXTS.


// ─── CLINICAL MODIFIERS ───────────────────────────────────────
// suppressed[]: analyte signals to attenuate in this context
//   factor: 0=fully suppressed, 1=unaffected; applied as multiplier to matchScore
//   Pathognomonic markers (weight:3) should never be fully suppressed by a single modifier
// disorderWarnings: {dxId: string} — interpretive guidance shown on result card

export const MODIFIERS = [
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

export const MODIFIER_MAP = Object.fromEntries(MODIFIERS.map(m=>[m.id,m]));

export const MODIFIER_GROUPS = {
  patient:"Patient state",
  nutrition:"Nutritional & metabolic state",
  specimen:"Specimen & collection",
  medication:"Medications",
  treatment:"Active treatment",
};

// ─── SUPPRESSION MAP BUILDER ─────────────────────────────────
export function buildSuppressionMap(activeModIds){
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

export function getDisorderWarnings(activeModIds,dxId){
  const warnings=[];
  for(const modId of activeModIds){
    const mod=MODIFIER_MAP[modId]; if(!mod) continue;
    const w=mod.disorderWarnings?.[dxId];
    if(w) warnings.push({modifier:mod.label,text:w});
  }
  return warnings;
}

// ─── CLINICAL CONTEXT PRIORS ─────────────────────────────────────
// Pre-test probability weights per clinical context.
// Values are relative log-prior adjustments (0 = no effect; positive = boost; negative = attenuate).
// Rationale: in a referred symptomatic patient the prior differs substantially from population NBS.
// PROVENANCE: these prior values are EXPERT-SET for this tool and are not
// derived from published prevalence or pre-test-probability data. That the
// prior differs between population screening and a symptomatic referral is
// itself well established (Marquardt 2012, PMID 22766634; Hall 2020, PMID
// 33073017), but the specific magnitudes below are not. Earlier revisions
// attributed them to "Rinaldo et al., Eur J Pediatr 2008" and "Turgeon et al.,
// JIMD 2014"; neither paper exists in PubMed, so those were removed.
// These shift the final score but are bounded so a strong biochemical signal always wins.
export const CLINICAL_CONTEXTS = [
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

export const CLINICAL_CONTEXT_MAP = Object.fromEntries(CLINICAL_CONTEXTS.map(c=>[c.id,c]));

export function applyContextPrior(score, disorderId, contextId){
  if(!contextId) return score;
  const ctx=CLINICAL_CONTEXT_MAP[contextId];
  if(!ctx) return score;
  const adj=ctx.priors[disorderId]??0;
  if(adj===0) return score;
  // Additive log-prior shift; bounded to ±0.25 so biochemistry always dominates
  return Math.max(0, Math.min(1, score + Math.sign(adj)*Math.min(Math.abs(adj),0.25)*score*0.6));
}
