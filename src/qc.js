// Quality-control guardrails and artifact detection.
//
// Value-level sanity checks that run independently of the differential: unit and
// transcription errors, physiologically impossible combinations, diagnostic
// ratio flags, and pre-analytic/iatrogenic interference signals.

import { AC_ANALYTES, AC_RATIOS, ANALYTE_MAP, PAA_RATIOS, PANEL_ANALYTES, UOA_RATIOS } from "./analytes.js";
import { computeAcRatios, computePaaRatios, computeUoaRatios } from "./scoring.js";

// ─── DATA PLAUSIBILITY / QC GUARDRAILS ───────────────────────
// Value-level sanity checks run independently of the differential. Catches
// transcription, unit and decimal-point errors and physiologically impossible
// combinations that would otherwise silently drive the scoring. This is distinct
// from the existing "data adequacy" assessment, which only checks how MUCH was
// entered (panel completeness) — here we check whether the entered numbers are
// internally and physiologically coherent.
export const QC_UNIT_FACTOR = 50; // value > N× ULN (or < lo/N) → likely unit / decimal / transcription error

// Markers that legitimately reach extreme multiples of the reference limit in disease
// (pathognomonic overflow) — excluded from the high-multiple unit-error heuristic.
export const QC_EXTREME_OK = new Set(["NAA","5OxoPro","SA","MMA","uGAA","Orotic","OroticU","HGA",
  "SAICAr","SAdo","SSCys","MevA","D2HG","2OHglut","3OMD","VLA","Hcy","tHcy"]);

export function runQcChecks(values){
  const out=[];
  const num=(p,id)=>{const raw=values?.[p]?.[id];if(raw===""||raw==null)return null;const v=parseFloat(raw);return v;};
  // 1. Non-numeric / negative values
  for(const [p,analytes] of Object.entries(PANEL_ANALYTES)){
    for(const a of analytes){
      const raw=values?.[p]?.[a.id];
      if(raw===""||raw==null) continue;
      const v=parseFloat(raw);
      if(isNaN(v)){ out.push({severity:"error",panel:p,ids:[a.id],message:`${a.name} (${p}): "${raw}" is not a number.`}); continue; }
      if(v<0){ out.push({severity:"error",panel:p,ids:[a.id],message:`${a.name} (${p}) is negative (${v}) — not physiologically possible.`}); continue; }
      // 2. Unit / decimal sanity (soft "verify" warning)
      if(!QC_EXTREME_OK.has(a.id) && a.hi>0 && v>a.hi*QC_UNIT_FACTOR){
        out.push({severity:"warn",panel:p,ids:[a.id],message:`${a.name} (${p}) = ${v} ${a.unit} is >${QC_UNIT_FACTOR}× the upper reference limit (${a.hi}). Verify units / decimal point / transcription.`});
      } else if(a.lo>0 && v>0 && v<a.lo/QC_UNIT_FACTOR){
        out.push({severity:"warn",panel:p,ids:[a.id],message:`${a.name} (${p}) = ${v} ${a.unit} is far below the lower reference limit (${a.lo}). Verify units / decimal point.`});
      }
    }
  }
  // 3. Carnitine internal consistency (CAR panel)
  const ok=x=>x!==null&&!isNaN(x);
  const cFree=num("CAR","CarFree"), cTotal=num("CAR","CarTotal"), cEst=num("CAR","CarEst"), cRatio=num("CAR","CarRatio");
  if(ok(cFree)&&ok(cTotal)&&cFree>cTotal*1.05)
    out.push({severity:"error",panel:"CAR",ids:["CarFree","CarTotal"],message:`Free carnitine (${cFree}) exceeds total carnitine (${cTotal}) — impossible (total must be ≥ free).`});
  if(ok(cEst)&&ok(cTotal)&&cEst>cTotal*1.05)
    out.push({severity:"error",panel:"CAR",ids:["CarEst","CarTotal"],message:`Esterified carnitine (${cEst}) exceeds total carnitine (${cTotal}) — impossible.`});
  if(ok(cFree)&&ok(cEst)&&ok(cTotal)){
    const sum=cFree+cEst;
    if(Math.abs(sum-cTotal)>0.2*cTotal)
      out.push({severity:"warn",panel:"CAR",ids:["CarFree","CarEst","CarTotal"],message:`Free + esterified carnitine (${sum.toFixed(1)}) does not reconcile with total (${cTotal}); expected free + esterified ≈ total.`});
  }
  if(ok(cRatio)&&ok(cFree)&&ok(cEst)&&cFree>0){
    const implied=cEst/cFree;
    if(Math.abs(implied-cRatio)>0.15+0.3*cRatio)
      out.push({severity:"warn",panel:"CAR",ids:["CarRatio"],message:`Acyl/free carnitine ratio (${cRatio}) is inconsistent with esterified/free from entered values (${implied.toFixed(2)}).`});
  }
  // 4. Cross-panel free carnitine (AC C0 vs CAR CarFree should be the same analyte)
  const c0=num("AC","C0");
  if(ok(c0)&&ok(cFree)&&c0>0&&cFree>0){
    const r=Math.max(c0,cFree)/Math.min(c0,cFree);
    if(r>2)
      out.push({severity:"warn",panel:"AC",ids:["C0","CarFree"],message:`Free carnitine differs markedly between the acylcarnitine panel (C0=${c0}) and the carnitine panel (CarFree=${cFree}). Confirm same specimen / units.`});
  }
  return out;
}

// ─── DIAGNOSTIC RATIO FLAGS ──────────────────────────────────
// Surfaces which derived diagnostic ratios are abnormal, with a one-line
// interpretation. Ratios already feed the score (computeAcRatios/Paa/Uoa); this
// makes the ratio reasoning explicit and auditable rather than buried in scoring.
export const RATIO_INTERP = {
  C8C10:"MCAD — C8 ≫ C10 (medium-chain FAO block)",
  C14_1C16:"VLCAD — C14:1 elevated relative to C16",
  C3C2:"Propionate disorders (PA / MMA)",
  C0LC:"CPT-I deficiency — high free carnitine, low long-chain acyl",
  C16OHC16:"LCHAD / TFP — disproportionate 3-OH-C16",
  C5DCC8:"GA-I vs MCAD — C5DC ≫ C8 favours GA-I",
  C5C3:"IVA — isovaleryl (C5) disproportionate to propionyl (C3)",
  C14_1C14:"VLCAD — C14:1 exceeds C14",
  C3C16:"Propionate axis relative to long-chain pool",
  C14_1C12_1:"VLCAD — C14:1 / C12:1",
  C16C18_1C2:"Long-chain FAO burden (CPT2 / CACT / VLCAD)",
  C4OHC4:"SCHAD (HADH) — 3-OH-C4 disproportionate",
  C16OHC18_1OH:"LCHAD vs TFP discrimination",
  C14_1C12:"VLCAD — C14:1 exceeds C12",
  PheTyr:"PKU / BH4 defect — Phe/Tyr (>3 suspicious, >10 classic)",
  CitArg:"Citrullinemia (ASS1) — citrulline relative to arginine",
  OrnCit:"HHH syndrome — ornithine high, citrulline low",
  GlnAla:"Hyperammonemia axis — glutamine relative to alanine",
  GlyCit:"Proximal UCD (NAGS / CPS1) — high glycine, low citrulline",
  GlySer:"NKH (plasma proxy) — glycine ≫ serine",
  LeuAla:"MSUD — branched-chain sum relative to alanine",
  MetHcy:"Methionine / homocysteine axis (CBS vs MTHFR)",
  C3Gly:"Propionic acidemia — propionylcarnitine / glycine",
  LacPyr:"Lactate / pyruvate >25 — PDHC / respiratory chain",
  OHGAtoGA:"GA-I — 3-OH-glutaric more specific than glutaric",
  MMAtoMCA:"MMA vs PA — MMA ≫ methylcitrate favours MMA",
  pGAACr:"GAMT deficiency — GAA / creatine elevated",
  SAdoSAICAr:"ADSL severity — ratio 1–2 seen in the severe phenotype, ≈5 in milder disease (Jaeken 1988)",
};

export function diagnosticRatioFlags(values){
  // Reconstruct the same enriched ratio set runAnalysis uses
  const ac={...(values.AC||{}),...computeAcRatios(values.AC||{})};
  const paa={...(values.PAA||{}),...computePaaRatios(values.PAA||{})};
  const uoa={...(values.UOA||{}),...computeUoaRatios(values.UOA||{})};
  const c3=parseFloat(values.AC?.C3), gly=parseFloat(values.PAA?.Gly);
  if(!isNaN(c3)&&c3>0&&!isNaN(gly)&&gly>0) paa.C3Gly=String(c3/gly);
  const misc={...(values.MISC||{})};
  const pgaa=parseFloat(values.MISC?.pGAA), pcreat=parseFloat(values.MISC?.pCreat);
  if(!isNaN(pgaa)&&pgaa>0&&!isNaN(pcreat)&&pcreat>0) misc.pGAACr=String(pgaa/pcreat);
  const groups=[["AC",AC_RATIOS,ac],["PAA",PAA_RATIOS,paa],["UOA",UOA_RATIOS,uoa],["MISC",[{id:"pGAACr"}],misc]];
  const flags=[];
  for(const [panel,defs,src] of groups){
    for(const def of defs){
      const meta=ANALYTE_MAP[def.id]; if(!meta) continue;
      const raw=src?.[def.id]; if(raw==null||raw==="") continue;
      const v=parseFloat(raw); if(isNaN(v)) continue;
      // Most ratios are informative when HIGH. A few (SAdoSAICAr) invert: the low
      // side carries the meaning, so `fold` is the reciprocal deviation and the
      // threshold is `lo`. Without this branch an inverted ratio either never
      // flags or sorts nonsensically against the high-side ones.
      if(meta.flagWhen==="low"){
        if(!(meta.lo>0)||v>=meta.lo) continue;
        flags.push({id:def.id,panel,name:meta.name,value:v,lo:meta.lo,unit:meta.unit,
          fold:meta.lo/Math.max(v,1e-9),low:true,interp:RATIO_INTERP[def.id]||""});
        continue;
      }
      if(!(meta.hi>0)||v<=meta.hi) continue;
      flags.push({id:def.id,panel,name:meta.name,value:v,hi:meta.hi,unit:meta.unit,fold:v/meta.hi,interp:RATIO_INTERP[def.id]||""});
    }
  }
  return flags.sort((a,b)=>b.fold-a.fold);
}

// ─── DATA-DRIVEN INTERFERENCE / ARTIFACT DETECTION ───────────
// Flags result patterns that commonly reflect an iatrogenic or pre-analytic cause
// (diet, drug, specimen handling) BEFORE they are mistaken for a metabolic block —
// even when the clinician has not selected the corresponding modifier. Complements
// MODIFIERS (which suppress scores once a cause is known) by surfacing the suspicion
// from the data itself. Conservative heuristics — advisory only.
export function detectArtifactSignals(values, activeModifiers=[]){
  const mods=new Set(activeModifiers||[]);
  const num=(p,id)=>{const raw=values?.[p]?.[id];if(raw===""||raw==null)return null;const v=parseFloat(raw);return isNaN(v)?null:v;};
  const hiOf=id=>ANALYTE_MAP[id]?.hi??Infinity;
  const high=(p,id,mult=1)=>{const v=num(p,id);return v!==null&&v>hiOf(id)*mult;};
  const out=[];
  // A. MCT oil / MCT formula / IV lipid (TPN) — broad medium-chain elevation
  if(!mods.has("mct_supplement")&&!mods.has("tpn")){
    const mc=["C6","C8","C10"].filter(id=>high("AC",id));
    if(mc.length>=2){
      const c8=num("AC","C8"),c10=num("AC","C10");
      const nonMcadRatio=c8!==null&&c10!==null&&c8/c10<(ANALYTE_MAP.C8C10?.hi??2);
      out.push({severity:"info",title:"Possible MCT / lipid (TPN) effect",suggestModifier:"mct_supplement",
        detail:`Broad medium-chain elevation (${mc.join(", ")})${nonMcadRatio?" with a non-MCAD C8/C10 ratio":""}. MCT oil, MCT-containing formula or IV lipid can elevate C6–C10 and mimic MCADD. Confirm dietary/iatrogenic source; if an FAO disorder remains a concern, repeat off MCT/lipid and check urine acylglycines (hexanoylglycine).`});
    }
  }
  // B. Valproate / pivalate — C4 and/or C5 elevation that co-elutes on FIA-MS/MS
  if(!mods.has("valproate")&&!mods.has("pivalate_abx")&&!mods.has("pivalic_acid")){
    const c4=high("AC","C4"), c5=high("AC","C5"), c8=high("AC","C8");
    if(c4||c5){
      out.push({severity:"info",title:"Possible valproate / pivalate artefact",suggestModifier:"valproate",
        detail:`${[c4?"C4":"",c5?"C5":""].filter(Boolean).join(" and ")} elevated. Valproate generates valproylcarnitine (co-elutes with C4/C8) and pivalate-containing antibiotics generate pivaloylcarnitine (co-elutes with C5), mimicking SCAD / IVA${c8?" / MCAD":""}. These cannot be resolved by non-separatory FIA-MS/MS — confirm with chromatographic LC-MS/MS and urine acylglycines (isovalerylglycine for true IVA).`});
    }
  }
  // C. Generalised acylcarnitine elevation — specimen degradation / handling
  if(!mods.has("room_temp_delay")&&!mods.has("freeze_thaw")){
    const measured=AC_ANALYTES.filter(a=>num("AC",a.id)!==null);
    if(measured.length>=6){
      const elevated=measured.filter(a=>high("AC",a.id)).length;
      if(elevated/measured.length>=0.7)
        out.push({severity:"info",title:"Possible specimen degradation",suggestModifier:"room_temp_delay",
          detail:`${elevated} of ${measured.length} measured acylcarnitines are above range. A near-global elevation is more consistent with ester hydrolysis from delayed processing or repeated freeze–thaw than with a single metabolic block. Verify specimen handling and consider recollection.`});
    }
  }
  return out;
}
