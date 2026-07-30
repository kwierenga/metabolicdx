// The scoring engine.
//
// Age/covariate resolution, the Student-t tail rarity model, per-disorder
// scoring, derived ratios, the likelihood-ratio product and the learning
// engine. Extracted from App.jsx so it can be imported, tested and reasoned
// about without React — the differential is the part of this app that has to be
// defensible, and it should not be entangled with rendering.
//
// Method provenance is recorded in references.js (METHOD_REFS).

import { DISORDERS } from "./disorders.js";
import { AC_ANALYTES, AGE_RANGES, AGE_RANGES_AC, ANALYTE_DIST, ANALYTE_MAP, CAR_ANALYTES, COVARIATE_MODELS, DEFAULT_DIST, MISC_ANALYTES, PAA_ANALYTES, PANEL_ANALYTES, UAG_ANALYTES, UOA_ANALYTES } from "./analytes.js";
import { applyContextPrior, buildSuppressionMap, getDisorderWarnings } from "./modifiers.js";
import { detectPatterns } from "./patterns.js";

// Derive age group from age in months.
export function getAgeGroup(ageMonths){
  if(ageMonths===null||ageMonths===undefined) return "adult";
  if(ageMonths<1)   return "neonate";
  if(ageMonths<12)  return "infant";
  if(ageMonths<216) return "child";
  return "adult";
}

// Parse ageMonths from demo object (uses dob+sampleDate or free-text age field).
// Returns null if age cannot be determined.
export function parseAgeMonths(demo, ageStr){
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
export function getAgeAdjustedLimits(analyte, panel, ageMonths){
  const group=getAgeGroup(ageMonths);
  const overrides=panel==="AC"?AGE_RANGES_AC[group]:AGE_RANGES[group];
  if(overrides&&overrides[analyte.id]){
    return {...analyte, ...overrides[analyte.id]};
  }
  return analyte;
}

// COVARIATE_MODELS were fit on CLIR data covering the first year of life only
// (Gavrilov 2020 reports age range 1–8760 h). The linear log model extrapolates
// to nonsense beyond that — by adult ages it predicts C3 ≈ 0, generating
// extreme negative Z-scores for normal values. To prevent misleading display,
// we suppress the Z-score for ages outside the validation range.
export const COVARIATE_MAX_AGE_HOURS = 8760; // 1 year — CLIR-validated upper bound

export function computeCovariateZscore(analyteId, value, ageHours, birthWeightG){
  const model=COVARIATE_MODELS[analyteId];
  if(!model) return null;
  if(value<=0) return null;
  // Out of validated CLIR age range — discrete AGE_RANGES bins handle scoring at older ages
  if(ageHours!==null && ageHours > COVARIATE_MAX_AGE_HOURS) return null;
  // Compute expected log-median given covariates
  const ageOffset=ageHours!==null?(ageHours/100)*model.ageSlope:0;
  const wOffset=birthWeightG!==null?((birthWeightG-2500)/1000)*model.wSlope:0;
  const expectedLogMedian=model.base+ageOffset+wOffset;
  const logVal=Math.log(value);
  return (logVal-expectedLogMedian)/model.sd;
}

// ─── COVARIATE-ADJUSTED REFERENCE LIMITS (feeds the score) ──────────
// Converts the continuous covariate model into an age/weight-adjusted [lo,hi]
// so the SAME tail-rarity machinery used everywhere else can consume it. This
// is what wires COVARIATE_MODELS into scoreDisorder — previously the Z-score
// was computed for display only and never influenced the differential.
//
// VALIDITY WINDOW: the linear log-median model is fit on CLIR NBS data, whose
// sample density is concentrated in the first days of life. Extrapolated past
// the early neonatal period the linear age term drives the predicted median
// far too low (e.g. C3 median ≈ 0.07 µmol/L by 6 months), which would make
// normal infant values score as grossly abnormal and conflict with the broad
// clinical AGE_RANGES bins. We therefore apply it for scoring ONLY within the
// first 14 days, where (a) the model is best calibrated, (b) precise age-in-
// hours adds the most discrimination (a 12h-old vs a 5-day-old differ greatly),
// and (c) it does not contradict the discrete infant/child bins. Beyond 14 days
// scoring falls back to getAgeAdjustedLimits. The display Z-score keeps its own
// wider COVARIATE_MAX_AGE_HOURS cap — that path is informational, not scoring.
export const COVARIATE_SCORING_MAX_AGE_HOURS = 336; // 14 days

export function covariateAdjustedLimits(analyteId, ageHours, birthWeightG){
  const model=COVARIATE_MODELS[analyteId];
  if(!model) return null;
  // Requires a precise age in hours; birth weight alone is not enough to anchor the median.
  if(ageHours===null||ageHours===undefined) return null;
  if(ageHours>COVARIATE_SCORING_MAX_AGE_HOURS) return null;
  const ageOffset=(ageHours/100)*model.ageSlope;
  const wOffset=(birthWeightG!==null&&birthWeightG!==undefined)?((birthWeightG-2500)/1000)*model.wSlope:0;
  const med=model.base+ageOffset+wOffset; // expected log-median given covariates
  const z=1.96; // 95% reference-interval boundary (2.5th–97.5th percentile)
  return {lo:Math.exp(med-z*model.sd), hi:Math.exp(med+z*model.sd)};
}

// Resolve the reference limits the scorer should use for an analyte, in priority
// order: (1) continuous covariate adjustment inside the neonatal window,
// (2) discrete age-bin override, (3) the static adult range.
export function resolveAnalyteLimits(analyteBase, panel, ageMonths, covariates){
  if(covariates){
    const cl=covariateAdjustedLimits(analyteBase.id, covariates.ageHours, covariates.birthWeightG);
    if(cl) return {...analyteBase, ...cl, covariateAdjusted:true};
  }
  if(ageMonths!==null&&ageMonths!==undefined) return getAgeAdjustedLimits(analyteBase, panel, ageMonths);
  return analyteBase;
}

export function parseDemoForCovariates(demo, ageStr){
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
// The interpretation of [lo, hi] is controlled by analyte.refPercentile:
//   95 (default)  → lo,hi = central 95% (2.5–97.5%, clinical 95% RI; z=1.96)
//   90            → lo,hi = central 90% (5–95%; z=1.645) — older CLIR/NBS publications
//   98            → lo,hi = central 98% (1–99%; z=2.326) — wide-interval publications
// 95% RI is the convention for clinical biochemistry references and the safe default.
// Calibration check (docs/IJNS-06-00033 Gavrilov 2020): with refPercentile=95, the
// implied P99 for C3 (lo=0.5, hi=3.5) is 4.20 µmol/L vs CLIR-published 3.59 (+17%);
// for C3/C2 (hi=0.15) is 0.20 vs published 0.19 (+4%). Substantially closer than
// the previous unconditional 5–95% assumption (which gave +46% / +47%).
//
// PROVENANCE AUDIT (completed): of ~150 total analytes, ANALYTE_DIST hand-tunes
// ~120; only 29 analytes reach this empirical fallback path (22 rare UOA, 7 AC).
// All 29 appear to be standard clinical 95% RI publications, so the default is
// correct and no per-analyte refPercentile tags are needed. AGE_RANGES overrides
// inherit the base analyte's refPercentile via the spread in getAgeAdjustedLimits.
// Edge cases (SAICAr, SSCys with lo=0/hi=0) fall through to scale=1.0 and would
// benefit from being promoted into ANALYTE_DIST with tight hand-tuned scales.
//
// Source: Marquardt et al., J Pediatr 2012 (CLIR); Schulze et al., Clin Chem 2003.
export const Z_DIVISORS = {90: 1.645, 95: 1.96, 98: 2.326};

export function empiricalLogScale(analyte){
  const lo=Math.max(analyte.lo>0?analyte.lo:analyte.hi*0.05, 1e-9);
  const hi=Math.max(analyte.hi, 1e-9);
  if(hi<=lo) return 1.0;
  const z = Z_DIVISORS[analyte.refPercentile] ?? Z_DIVISORS[95];
  return Math.max(0.05, (Math.log(hi)-Math.log(lo))/(2*z));
}

// ─── SCORING ENGINE ──────────────────────────────────────────
// Student-t tail-rarity scoring (replaces binary log10 approach).
// Implements the statistical framework from the Python scoring patch.
// Parameter values are independently calibrated for log-space rather than
// using the Python patch's illustrative raw-space values.

export function _logGamma(x){
  const c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,
           771.32342877765313,-176.61502916214059,12.507343278686905,
           -0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if(x<0.5) return Math.log(Math.PI/Math.sin(Math.PI*x))-_logGamma(1-x);
  x-=1; let a=c[0]; const t=x+7.5;
  for(let i=1;i<9;i++) a+=c[i]/(x+i);
  return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a);
}

export function _regIncBeta(x,a,b){
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

export function _tSF(t,df){
  // One-sided survival function P(T > t) for Student-t(df), t ≥ 0
  return 0.5*_regIncBeta(df/(df+t*t),df/2,0.5);
}

export function tailRarity(dist,scale,df){
  // Convert distance beyond reference limit → [0,1] rarity score
  // dist=0 → 0.0; dist=scale → ~0.50; dist=2×scale → ~0.85
  if(dist<=0) return 0;
  return Math.max(0,Math.min(1,1-2*_tSF(dist/Math.max(scale,1e-9),Math.max(df,1))));
}

export function analyteMatchScore(val,analyte,direction){
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

export function scoreDisorder(disorder, values, activePanels, suppressionMap, learnedWeights, ageMonths=null, covariates=null){
  let earned=0, maxPoss=0, enteredW=0, activeW=0;
  const supporting=[], missing=[], notRun=[];
  for(const sig of disorder.signature){
    const analyteBase=ANALYTE_MAP[sig.id]; if(!analyteBase) continue;
    // Apply covariate-adjusted (neonatal) or discrete age-adjusted reference limits if known
    const analyte=resolveAnalyteLimits(analyteBase,sig.panel,ageMonths,covariates);
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
    const neAnalyte=resolveAnalyteLimits(neBase,ne.panel,ageMonths,covariates);
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
  // Analytical ceiling: cap score for disorders with known poor interlaboratory
  // performance (METHOD_REFS.analyticalCeiling — Oglesbee 2018, PMID 28661487;
  // online-first in 2017, which earlier comments here cited as the year)
  const ceiling=disorder.analyticalCeiling;
  const ceilingHit=ceiling&&finalScore>ceiling;
  if(ceilingHit) finalScore=ceiling;
  return{...disorder,rawScore,score:finalScore,intraCoverage:cov,
    negEarned,negPoss,concordantPanels:positivePanels.size,ceilingHit:!!ceilingHit,
    supporting:supporting.sort((a,b)=>b.rawMatchScore-a.rawMatchScore),missing,notRun};
}

export function computeAcRatios(ac){
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

export function computePaaRatios(paa){
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

export function computeUoaRatios(uoa){
  const g=id=>{const v=parseFloat(uoa?.[id]);return isNaN(v)||v<=0?null:v;};
  const out={};
  const lac=g("Lactic"),pyr=g("Pyruvic"); if(lac!==null&&pyr!==null&&pyr>0) out.LacPyr=String(lac/pyr);
  const ohga=g("3OHGA"),ga=g("GA"); if(ohga!==null&&ga!==null&&ga>0) out.OHGAtoGA=String(ohga/ga);
  const mma=g("MMA"),mca=g("MCA"); if(mma!==null&&mca!==null&&mca>0) out.MMAtoMCA=String(mma/mca);
  // Both succinylpurines must be detectable — g() already rejects <=0, so this
  // ratio simply does not exist for a sample without ADSL deficiency.
  const sado=g("SAdo"),saicar=g("SAICAr"); if(sado!==null&&saicar!==null&&saicar>0) out.SAdoSAICAr=String(sado/saicar);
  return out;
}

export function runAnalysis(values, activeModifiers=[], learnedWeights=null, clinicalContext=null, ageMonths=null, covariates=null){
  const suppMap=buildSuppressionMap(activeModifiers);
  // Compute cross-panel ratios (require data from multiple panels)
  const crossPanel={};
  const _c3=parseFloat(values.AC?.C3); const _gly=parseFloat(values.PAA?.Gly);
  if(!isNaN(_c3)&&_c3>0&&!isNaN(_gly)&&_gly>0) crossPanel.C3Gly=String(_c3/_gly);
  // Within-MISC derived ratios (creatine-deficiency axis)
  const miscDerived={};
  const _pgaa=parseFloat(values.MISC?.pGAA); const _pcreat=parseFloat(values.MISC?.pCreat);
  if(!isNaN(_pgaa)&&_pgaa>0&&!isNaN(_pcreat)&&_pcreat>0) miscDerived.pGAACr=String(_pgaa/_pcreat);
  const enrichedValues={
    ...values,
    AC: {...values.AC,...computeAcRatios(values.AC)},
    PAA:{...values.PAA,...computePaaRatios(values.PAA),...crossPanel},
    UOA:{...values.UOA,...computeUoaRatios(values.UOA)},
    MISC:{...values.MISC,...miscDerived},
  };
  const ap=new Set(Object.entries(enrichedValues).filter(([,p])=>Object.values(p).some(v=>v!=="")).map(([k])=>k));
  const raw=DISORDERS.map(d=>scoreDisorder(d,enrichedValues,ap,suppMap,learnedWeights,ageMonths,covariates)).filter(Boolean);
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
// PROVENANCE (METHOD_REFS.lrProduct): the >10 / >100 interpretive bands are the
// standard diagnostic-test likelihood-ratio thresholds (Jaeschke 1994, PMID
// 8309035); treating post-analytical interpretation as likelihood-based rather
// than cutoff-based follows CLIR (Marquardt 2012, PMID 22766634). The product
// itself is THIS TOOL'S OWN construction — it is not a published algorithm and
// has not been externally validated. Earlier revisions of this file attributed
// it to "Norris et al., JIMD 2007" and "Turgeon et al., JIMD 2014"; neither
// paper exists in PubMed, so those attributions were removed.
// NOTE: LR is computed only for analytes that were entered AND are abnormal in the
// expected direction. Missing analytes are excluded (uninformative under naive Bayes).
export function scoreLRProduct(disorderResult){
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
export function isAbnormalInDir(val,analyte,dir){
  if(dir==="high") return val>analyte.hi*0.8;
  if(dir==="low")  return analyte.lo>0&&val<analyte.lo*1.2;
  return false;
}

export function computeLearnedWeights(trainingExamples){
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
export function initValues(){return{PAA:Object.fromEntries(PAA_ANALYTES.map(a=>[a.id,""])),UOA:Object.fromEntries(UOA_ANALYTES.map(a=>[a.id,""])),AC:Object.fromEntries(AC_ANALYTES.map(a=>[a.id,""])),CAR:Object.fromEntries(CAR_ANALYTES.map(a=>[a.id,""])),UAG:Object.fromEntries(UAG_ANALYTES.map(a=>[a.id,""])),MISC:Object.fromEntries(MISC_ANALYTES.map(a=>[a.id,""]))}}

/**
 * Bring a stored case's values up to the full six-panel shape.
 *
 * A stored case is not guaranteed to carry every panel: the seeded demo cases
 * only ever held PAA, and a case saved by an older build (or imported from
 * anywhere else) can be missing panels too. Consumers index panels directly —
 * `Object.values(values[p.id])` in the CaseEditor panel tabs, for one — so a
 * missing panel was a TypeError that blanked the whole editor the moment such a
 * case was opened. Normalising on load is the fix: absent panels become empty,
 * absent analytes become "", and unknown ids are dropped rather than carried
 * into scoring.
 */
export function normalizeValues(stored){
  const out=initValues();
  for(const [panel,vals] of Object.entries(stored||{})){
    if(!out[panel]) continue;                       // panel this build does not know
    for(const [id,v] of Object.entries(vals||{})){
      if(!(id in out[panel])) continue;             // analyte this build does not know
      out[panel][id]=v==null?"":String(v);
    }
  }
  return out;
}

export function countEntered(v){return Object.values(v).reduce((s,p)=>s+Object.values(p||{}).filter(x=>x!=="").length,0);}

export function countAbnormal(v){let n=0;for(const[p,pv]of Object.entries(v)){const al=PANEL_ANALYTES[p];if(!al)continue;for(const a of al){const x=parseFloat(pv[a.id]);if(!isNaN(x)&&(x>a.hi||(a.lo>0&&x<a.lo)))n++;}}return n;}

export function confLevel(s){if(s>=0.4)return{label:"HIGH",cls:"text-red-700 bg-red-50 border-red-300"};if(s>=0.2)return{label:"MODERATE",cls:"text-amber-700 bg-amber-50 border-amber-300"};if(s>=0.08)return{label:"LOW",cls:"text-blue-700 bg-blue-50 border-blue-300"};return{label:"TRACE",cls:"text-slate-500 bg-slate-50 border-slate-200"};}
