// Patient identity for longitudinal matching.
//
// Extracted from App.jsx so the matching rules can be tested directly; see
// src/__tests__/patient-matching.test.js for the behaviour this pins down.


// ─── TRENDS / LONGITUDINAL TAB ───────────────────────────────
// Compares the current case against prior saved cases sharing the same case
// label (used as the patient identifier) to show how key analytes and the top
// differential have moved over time — distinguishing a persistent disorder from
// a transient elevation and showing treatment response.
export const TREND_KEY_ANALYTES = {
  PAA:["Phe","Tyr","Met","Gly","Leu","Cit","Orn","Arg","Val","Hcy"],
  UOA:["MMA","MCA","GA","3OHGA","IVG","Lactic","SA","Orotic","EMA"],
  AC:["C0","C2","C3","C4","C5","C5DC","C5OH","C8","C10","C14_1","C16","C16OH"],
  CAR:["CarFree","CarTotal"],
  MISC:["Ammonia","Lactate","Glucose","tHcy","BHB"],
};
// ─── PATIENT IDENTITY FOR LONGITUDINAL MATCHING ──────────────
// Trends join a patient's samples on the free-text case label, because that is
// the only patient identifier the app has. Matching on `label.trim().toLowerCase()`
// meant a stray double space, a changed accent or a trailing full stop silently
// started a *second* longitudinal record — and silence is the whole problem: the
// clinician sees "no prior samples" and cannot tell that from "no match found".
//
// Two defences, since neither alone is enough:
//   1. patientKey() — normalise away the differences that are never meaningful
//      in a name (case, diacritics, whitespace runs, surrounding punctuation).
//   2. nearMissKeys() — for the differences that ARE potentially meaningful (a
//      real typo, a digit change), do not guess. Surface them and let the
//      clinician decide, so a split record is at least visible.

/** Normalise a case label to a patient key. Empty string when there is no usable label. */

export function patientKey(label){
  if(typeof label!=="string") return "";
  return label
    .normalize("NFD").replace(/\p{M}/gu,"")             // strip combining marks: é → e, ü → u
    .toLowerCase()
    .replace(/[.,;:'"`´]/g,"")                          // punctuation that is never identity
    .replace(/[_\-/\\]+/g," ")                          // separators → space (hyphen/slash styles vary)
    .replace(/\s+/g," ")                                // collapse whitespace runs
    .trim();
}

/** Levenshtein distance, capped: returns >max as soon as it is certain. */

export function editDistance(a,b,max=2){
  if(a===b) return 0;
  if(Math.abs(a.length-b.length)>max) return max+1;
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    const cur=[i];
    let best=i;
    for(let j=1;j<=b.length;j++){
      cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
      if(cur[j]<best) best=cur[j];
    }
    if(best>max) return max+1;   // whole row already past the cap
    prev=cur;
  }
  return prev[b.length];
}

/**
 * Labels that look like typo variants of `label` — same patient, split record.
 * Deliberately conservative: only near-identical keys, never a fuzzy name match,
 * because merging two genuinely different patients is far worse than splitting one.
 */

export function nearMissKeys(label,cases){
  const key=patientKey(label);
  if(key.length<3) return [];            // too short to distinguish typo from a different patient
  const seen=new Map();
  for(const c of cases||[]){
    const k=patientKey(c?.label);
    if(!k||k===key||seen.has(k)) continue;
    // Allow 1 edit for short keys, 2 for longer ones — proportionate to typo risk.
    const max=key.length>=8?2:1;
    if(editDistance(key,k,max)<=max) seen.set(k,c.label);
  }
  return [...seen.values()];
}
