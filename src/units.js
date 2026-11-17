// ─── UNITS ───────────────────────────────────────────────────
// Every analyte in analytes.js carries one unit, and the engine scores a value
// as if it were in that unit. Laboratories do not all report that way: amino
// acids arrive in mg/dL, ammonia in µg/dL, urine organic acids in mg/g
// creatinine or µmol/mmol creatinine, lactate in mg/dL. Until 2026-11-13 the
// extraction schema had no unit field and the prompt said "do not convert", so
// a mg/dL phenylalanine of 20 was scored as 20 µmol/L — a normal value — with
// no warning. This module gives the app one place to recognise a unit, convert
// it where the arithmetic is unambiguous, and REFUSE where it is not.
//
// Conversion needs the molar mass of the analyte. The table below lists each
// analyte's molecular formula with the mass computed from it using IUPAC
// standard atomic weights (C 12.011, H 1.008, N 14.007, O 15.999, S 32.06).
// A mass is physical chemistry, not a clinical claim, so it cites no paper; the
// formula is there so each value can be checked by anyone, and units.test.js
// recomputes every mass from its formula. Analytes without an entry
// (acylcarnitines, enzymes, succinylpurines) are only ever reported in their
// panel unit or a scalar multiple of it; a mass-based conversion for them is
// refused rather than guessed.
//
// Urine analytes are expressed per mol creatinine. A value reported per litre
// of urine cannot be normalised without the urine creatinine, which the report
// may not carry — so that conversion is refused and the clinician is told why.

export const CREATININE_G_PER_MOL = 113.12; // C4H7N3O

export const MOLAR_MASS = {
  // ── Plasma amino acids (µmol/L) ──
  Ala:    { formula: "C3H7NO2",     g: 89.09 },
  Arg:    { formula: "C6H14N4O2",   g: 174.20 },
  Asn:    { formula: "C4H8N2O3",    g: 132.12 },
  Asp:    { formula: "C4H7NO4",     g: 133.10 },
  Cit:    { formula: "C6H13N3O3",   g: 175.19 },
  Gln:    { formula: "C5H10N2O3",   g: 146.14 },
  Glu:    { formula: "C5H9NO4",     g: 147.13 },
  Gly:    { formula: "C2H5NO2",     g: 75.07 },
  His:    { formula: "C6H9N3O2",    g: 155.15 },
  Ile:    { formula: "C6H13NO2",    g: 131.17 },
  Leu:    { formula: "C6H13NO2",    g: 131.17 },
  Lys:    { formula: "C6H14N2O2",   g: 146.19 },
  Met:    { formula: "C5H11NO2S",   g: 149.21 },
  Orn:    { formula: "C5H12N2O2",   g: 132.16 },
  Phe:    { formula: "C9H11NO2",    g: 165.19 },
  Pro:    { formula: "C5H9NO2",     g: 115.13 },
  Ser:    { formula: "C3H7NO3",     g: 105.09 },
  Thr:    { formula: "C4H9NO3",     g: 119.12 },
  Tyr:    { formula: "C9H11NO3",    g: 181.19 },
  Val:    { formula: "C5H11NO2",    g: 117.15 },
  AlloIle:{ formula: "C6H13NO2",    g: 131.17 },
  Hcy:    { formula: "C4H9NO2S",    g: 135.18 },
  tHcy:   { formula: "C4H9NO2S",    g: 135.18 },
  ASA:    { formula: "C10H18N4O6",  g: 290.27 },
  Pip:    { formula: "C6H11NO2",    g: 129.16 },
  Trp:    { formula: "C11H12N2O2",  g: 204.23 },
  "3OMD": { formula: "C10H13NO4",   g: 211.21 },
  AABA:   { formula: "C4H9NO2",     g: 103.12 },
  Etha:   { formula: "C2H7NO",      g: 61.08 },
  "3MHis":{ formula: "C7H11N3O2",   g: 169.18 },
  GABA:   { formula: "C4H9NO2",     g: 103.12 },
  "1MHis":{ formula: "C7H11N3O2",   g: 169.18 },
  AAAdp:  { formula: "C6H11NO4",    g: 161.16 },
  HyPro:  { formula: "C5H9NO3",     g: 131.13 },
  Sarc:   { formula: "C3H7NO2",     g: 89.09 },
  BAla:   { formula: "C3H7NO2",     g: 89.09 },
  // ── Miscellaneous ──
  Ammonia:{ formula: "NH3",         g: 17.03 },
  Lactate:{ formula: "C3H6O3",      g: 90.08 },
  UricAc: { formula: "C5H4N4O3",    g: 168.11 },
  Glucose:{ formula: "C6H12O6",     g: 180.16 },
  BHB:    { formula: "C4H8O3",      g: 104.10 },
  AcAc:   { formula: "C4H6O3",      g: 102.09 },
  pGAA:   { formula: "C3H7N3O2",    g: 117.11 },
  uGAA:   { formula: "C3H7N3O2",    g: 117.11 },
  pCreat: { formula: "C4H9N3O2",    g: 131.13 },
  uCreat: { formula: "C4H9N3O2",    g: 131.13 },
  // Triglycerides have no single formula; 885.4 g/mol (triolein) is the
  // conventional reporting basis behind the usual 0.01129 mg/dL→mmol/L factor.
  Triglyc:{ formula: "triolein basis", g: 885.4 },
  // ── Urine organic acids (mmol/mol creatinine) ──
  MMA:     { formula: "C4H6O4",  g: 118.09 },
  "3OHprop":{ formula: "C3H6O3", g: 90.08 },
  MCA:     { formula: "C7H10O7", g: 206.15 },
  PG:      { formula: "C5H9NO3", g: 131.13 },
  TG:      { formula: "C7H11NO3",g: 157.17 },
  EMA:     { formula: "C5H8O4",  g: 132.11 },
  Malonic: { formula: "C3H4O4",  g: 104.06 },
  IVG:     { formula: "C7H13NO3",g: 159.18 },
  MCG:     { formula: "C7H11NO3",g: 157.17 },
  "3OHIV": { formula: "C5H10O3", g: 118.13 },
  GA:      { formula: "C5H8O4",  g: 132.11 },
  "3OHGA": { formula: "C5H8O5",  g: 148.11 },
  HMG:     { formula: "C6H10O5", g: 162.14 },
  Adipic:  { formula: "C6H10O4", g: 146.14 },
  Suberic: { formula: "C8H14O4", g: 174.19 },
  Sebacic: { formula: "C10H18O4",g: 202.25 },
  SA:      { formula: "C7H10O4", g: 158.15 },
  "4OHpp": { formula: "C9H8O4",  g: 180.16 },
  "4OHpl": { formula: "C9H10O4", g: 182.17 },
  HGA:     { formula: "C8H8O4",  g: 168.15 },
  Orotic:  { formula: "C5H4N2O4",g: 156.10 },
  OroticU: { formula: "C5H4N2O4",g: 156.10 },
  Fumaric: { formula: "C4H4O4",  g: 116.07 },
  Succinic:{ formula: "C4H6O4",  g: 118.09 },
  Lactic:  { formula: "C3H6O3",  g: 90.08 },
  Pyruvic: { formula: "C3H4O3",  g: 88.06 },
  "2OHglut":{ formula: "C5H8O5", g: 148.11 },
  D2HG:    { formula: "C5H8O5",  g: 148.11 },
  "4OHbut":{ formula: "C4H8O3",  g: 104.10 },
  "2MAA":  { formula: "C5H8O3",  g: 116.12 },
  NAA:     { formula: "C6H9NO5", g: 175.14 },
  "5OxoPro":{ formula: "C5H7NO3",g: 129.11 },
  "3MGA":  { formula: "C6H8O4",  g: 144.13 },
  "3MGR":  { formula: "C6H10O4", g: 146.14 },
  MevA:    { formula: "C6H12O4", g: 148.16 },
  "3HIB":  { formula: "C4H8O3",  g: 104.10 },
  "2KG":   { formula: "C5H6O5",  g: 146.10 },
  Glycerol:{ formula: "C3H8O3",  g: 92.09 },
  Uracil:  { formula: "C4H4N2O2",g: 112.09 },
  Thymine: { formula: "C5H6N2O2",g: 126.11 },
  "23DHMB":{ formula: "C5H10O4", g: 134.13 },
  SSCys:   { formula: "C3H7NO5S2",g: 201.22 },
  VLA:     { formula: "C10H12O5",g: 212.20 },
  // ── Urine acylglycines (mmol/mol creatinine) ──
  HG:   { formula: "C8H15NO3",  g: 173.21 },
  SG:   { formula: "C10H17NO5", g: 231.25 },
  PPG:  { formula: "C11H13NO3", g: 207.23 },
  GG:   { formula: "C7H11NO5",  g: 189.17 },
  OG:   { formula: "C10H19NO3", g: 201.26 },
  IBG:  { formula: "C6H11NO3",  g: 145.16 },
  "2MBG":{ formula: "C7H13NO3", g: 159.18 },
  BG:   { formula: "C6H11NO3",  g: 145.16 },
  DG:   { formula: "C12H23NO3", g: 229.32 },
};

// ── Unit recognition ────────────────────────────────────────
// Canonical unit names. Everything a report might print is folded onto one of
// these; an unrecognised string stays as typed and is refused by name.
export const UNITS = {
  UMOL_L: "µmol/L",
  MMOL_L: "mmol/L",
  MG_DL: "mg/dL",
  MG_L: "mg/L",
  UG_DL: "µg/dL",
  UG_L: "µg/L",
  MMOL_MOL_CR: "mmol/mol Cr",
  UMOL_MMOL_CR: "µmol/mmol Cr",
  MG_G_CR: "mg/g Cr",
  U_L: "U/L",
  RATIO: "ratio",
};

// Keys are lower-case with all whitespace removed and the micro sign written
// as ASCII "u" (normalizeUnit folds µ and μ to u before lookup).
const ALIASES = new Map(Object.entries({
  "umol/l": UNITS.UMOL_L, "micromol/l": UNITS.UMOL_L, "mcmol/l": UNITS.UMOL_L, "nmol/ml": UNITS.UMOL_L,
  "um": UNITS.UMOL_L, "umol/liter": UNITS.UMOL_L, "umol/litre": UNITS.UMOL_L,
  "mmol/l": UNITS.MMOL_L, "mm": UNITS.MMOL_L, "mmol/liter": UNITS.MMOL_L, "mmol/litre": UNITS.MMOL_L, "umol/ml": UNITS.MMOL_L,
  "mg/dl": UNITS.MG_DL, "mg/100ml": UNITS.MG_DL, "mg%": UNITS.MG_DL, "mg/deciliter": UNITS.MG_DL,
  "mg/l": UNITS.MG_L, "ug/ml": UNITS.MG_L, "mcg/ml": UNITS.MG_L,
  "ug/dl": UNITS.UG_DL, "mcg/dl": UNITS.UG_DL,
  "ug/l": UNITS.UG_L, "mcg/l": UNITS.UG_L, "ng/ml": UNITS.UG_L,
  "mmol/molcr": UNITS.MMOL_MOL_CR, "mmol/molcreat": UNITS.MMOL_MOL_CR, "mmol/molcreatinine": UNITS.MMOL_MOL_CR,
  "mmol/molcrea": UNITS.MMOL_MOL_CR, "mmol/mol": UNITS.MMOL_MOL_CR,
  "umol/mmolcr": UNITS.UMOL_MMOL_CR, "umol/mmolcreat": UNITS.UMOL_MMOL_CR, "umol/mmolcreatinine": UNITS.UMOL_MMOL_CR,
  "umol/mmolcrea": UNITS.UMOL_MMOL_CR, "umol/mmol": UNITS.UMOL_MMOL_CR,
  "mg/gcr": UNITS.MG_G_CR, "mg/gcreat": UNITS.MG_G_CR, "mg/gcreatinine": UNITS.MG_G_CR, "mg/gcrea": UNITS.MG_G_CR, "mg/g": UNITS.MG_G_CR,
  "ug/mgcr": UNITS.MG_G_CR, "ug/mgcreat": UNITS.MG_G_CR, "ug/mgcreatinine": UNITS.MG_G_CR, "ug/mg": UNITS.MG_G_CR,
  "u/l": UNITS.U_L, "iu/l": UNITS.U_L, "units/l": UNITS.U_L,
  "ratio": UNITS.RATIO, "": UNITS.RATIO, "-": UNITS.RATIO, "none": UNITS.RATIO,
}));

/** Fold a printed unit onto a canonical name; returns the trimmed input when unknown. */
export function normalizeUnit(raw) {
  if (raw == null) return UNITS.RATIO;
  const trimmed = String(raw).trim();
  const key = trimmed.toLowerCase().replace(/[µμ]/g, "u").replace(/\s+/g, "");
  return ALIASES.get(key) ?? trimmed;
}

const SCALAR = {
  // [from][to] = multiplier, for unit pairs that need no molar mass
  [UNITS.UMOL_L]:      { [UNITS.UMOL_L]: 1, [UNITS.MMOL_L]: 1e-3 },
  [UNITS.MMOL_L]:      { [UNITS.MMOL_L]: 1, [UNITS.UMOL_L]: 1e3 },
  [UNITS.UMOL_MMOL_CR]:{ [UNITS.MMOL_MOL_CR]: 1, [UNITS.UMOL_MMOL_CR]: 1 },
  [UNITS.MMOL_MOL_CR]: { [UNITS.MMOL_MOL_CR]: 1, [UNITS.UMOL_MMOL_CR]: 1 },
  [UNITS.U_L]:         { [UNITS.U_L]: 1 },
  [UNITS.RATIO]:       { [UNITS.RATIO]: 1 },
  [UNITS.MG_DL]:       { [UNITS.MG_DL]: 1, [UNITS.MG_L]: 10 },
  [UNITS.MG_L]:        { [UNITS.MG_L]: 1, [UNITS.MG_DL]: 0.1 },
  [UNITS.UG_DL]:       { [UNITS.UG_DL]: 1, [UNITS.UG_L]: 10 },
  [UNITS.UG_L]:        { [UNITS.UG_L]: 1, [UNITS.UG_DL]: 0.1 },
};

// Mass-based: factor from a mass concentration to a molar one, divided by g/mol.
//   mg/dL → mmol/L : ×10 / M        mg/L  → mmol/L : ×1 / M
//   mg/dL → µmol/L : ×10000 / M     mg/L  → µmol/L : ×1000 / M
//   µg/dL → µmol/L : ×10 / M        µg/L  → µmol/L : ×1 / M
//   mg/g creatinine → mmol/mol creatinine : ×113.12 / M
const MASS_TO_MOLAR = {
  [UNITS.MG_DL]: { [UNITS.MMOL_L]: 10, [UNITS.UMOL_L]: 10000 },
  [UNITS.MG_L]:  { [UNITS.MMOL_L]: 1,  [UNITS.UMOL_L]: 1000 },
  [UNITS.UG_DL]: { [UNITS.UMOL_L]: 10, [UNITS.MMOL_L]: 0.01 },
  [UNITS.UG_L]:  { [UNITS.UMOL_L]: 1,  [UNITS.MMOL_L]: 0.001 },
  [UNITS.MG_G_CR]:{ [UNITS.MMOL_MOL_CR]: CREATININE_G_PER_MOL, [UNITS.UMOL_MMOL_CR]: CREATININE_G_PER_MOL },
};

const PER_VOLUME = [UNITS.UMOL_L, UNITS.MMOL_L, UNITS.MG_DL, UNITS.MG_L, UNITS.UG_DL, UNITS.UG_L];

/**
 * Convert `value` reported in `rawUnit` to the analyte's panel unit.
 * Returns {ok:true, value, from, to, factor, converted} or {ok:false, from, to, reason}.
 * Never guesses: anything not in the tables above is refused with a reason.
 */
export function convertToPanelUnit(analyte, value, rawUnit) {
  const to = analyte?.unit ?? UNITS.RATIO;
  const from = normalizeUnit(rawUnit);
  const v = Number(value);
  if (!Number.isFinite(v)) return { ok: false, from, to, reason: "value is not a number" };
  if (from === to) return { ok: true, value: v, from, to, factor: 1, converted: false };

  const scalar = SCALAR[from]?.[to];
  if (scalar != null) return { ok: true, value: v * scalar, from, to, factor: scalar, converted: scalar !== 1 };

  const massFactor = MASS_TO_MOLAR[from]?.[to];
  if (massFactor != null) {
    const mm = MOLAR_MASS[analyte.id];
    if (!mm) return { ok: false, from, to, reason: `no molar mass on file for ${analyte.name ?? analyte.id}; enter the value in ${to} by hand` };
    const factor = massFactor / mm.g;
    return { ok: true, value: v * factor, from, to, factor, converted: true, formula: mm.formula };
  }

  if ((to === UNITS.MMOL_MOL_CR || to === UNITS.UMOL_MMOL_CR) && PER_VOLUME.includes(from))
    return { ok: false, from, to, reason: "reported per litre of urine; normalising to creatinine needs the urine creatinine, which was not read" };

  if (!Object.values(UNITS).includes(from))
    return { ok: false, from, to, reason: `unit "${from}" not recognised` };
  return { ok: false, from, to, reason: `no conversion from ${from} to ${to}` };
}

/** Round a converted value to a sensible number of decimals for display/storage. */
export function roundConverted(v) {
  if (!Number.isFinite(v)) return v;
  const a = Math.abs(v);
  const d = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3;
  return Number(v.toFixed(d));
}
