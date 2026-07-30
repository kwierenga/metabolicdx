// Biochemical pattern library.
//
// Deterministic rule-based recognition of mechanistic axes (intoxication,
// energy deficiency, and so on), run in parallel with the probabilistic
// differential rather than feeding into it.


// ─── BIOCHEMICAL PATTERN LIBRARY ────────────────────────────
// Each pattern encodes a mechanistic axis used in biochemical genetics reasoning.
// Mirrors the diagnostic frameworks in ACMG/SIMD guidelines, Saudubray et al. (IEM 6th ed.),
// Cowan & Barton, and Prasun 2020 (GeneReviews MADD). Detection is deterministic rule-based,
// not probabilistic — patterns are shown when their analyte criteria are met.
// Confidence: "definite" (≥2 specific markers clearly above threshold), "probable" (1 specific + 1 supportive), "possible" (1 specific marker).

export const BIOCHEMICAL_PATTERNS = [

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
      return hit.length>=2?{confidence:"definite",hits:hit}:hit.length>=1?{confidence:"probable",hits:hit}:null;
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

export function detectPatterns(enrichedValues, activePanels){
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
