// ─── EXTRACTION ──────────────────────────────────────────────
// Schema and fold step for reading lab values out of a dropped report.
//
// Extraction is schema-constrained rather than prompt-constrained. The model is
// given an explicit output schema whose `id` enum is generated from the panel
// definitions, so it is structurally unable to return an analyte id the app
// does not know, a non-numeric value, or a value for a derived ratio.
// Previously all three were possible and failed silently: mergeExtracted()
// drops any id it does not recognise, so a mis-mapped analyte simply vanished.
//
// Units (added 2026-11-13). Every row now carries the unit AS PRINTED on the
// report. foldExtractedValues converts it to the panel unit with units.js where
// the arithmetic is unambiguous and REFUSES otherwise, reporting both so the
// clinician sees exactly what was converted and what was left out. Before this,
// a mg/dL amino-acid report was scored as if it were in µmol/L, silently.
//
// A flat array is used rather than a nested object because extraction is sparse
// — a report contains a handful of the ~135 analytes, and an object schema with
// `additionalProperties:false` would require every field on every response.
import { PANEL_ANALYTES } from "./analytes.js";
import { convertToPanelUnit, roundConverted } from "./units.js";

export const EXTRACTABLE_IDS = Object.values(PANEL_ANALYTES).flat().map((a) => a.id);

export const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    values: {
      type: "array",
      description: "One entry per analyte with an explicit numeric value in the source. Omit analytes that are absent, qualitative, or below the reporting limit.",
      items: {
        type: "object",
        properties: {
          panel: { type: "string", enum: Object.keys(PANEL_ANALYTES),
            description: "Panel the analyte belongs to." },
          id: { type: "string", enum: EXTRACTABLE_IDS,
            description: "Exact analyte identifier." },
          value: { type: "number", description: "Numeric result exactly as printed, in the unit printed beside it. Never convert." },
          unit: { type: "string", description: "The unit exactly as printed beside the value (e.g. µmol/L, mg/dL, mmol/mol creat, µmol/mmol creat, U/L). Use an empty string if none is printed." },
        },
        required: ["panel", "id", "value", "unit"],
        additionalProperties: false,
      },
    },
  },
  required: ["values"],
  additionalProperties: false,
};

/**
 * Fold the flat array into the {panel:{id:value}} shape mergeExtracted expects,
 * converting units on the way. Returns:
 *   values    — converted values, in panel units, ready to merge
 *   converted — rows whose unit differed from the panel unit and were converted
 *   skipped   — rows read from the report but NOT merged, with the reason
 *   dropped   — count of rows naming an unknown panel/analyte pairing
 */
export function foldExtractedValues(parsed) {
  const values = {};
  const converted = [], skipped = [];
  let dropped = 0;
  for (const row of parsed?.values ?? []) {
    const list = PANEL_ANALYTES[row?.panel];
    const analyte = list?.find((a) => a.id === row.id);
    if (!analyte) { dropped++; continue; }
    if (typeof row.value !== "number" || !isFinite(row.value)) { dropped++; continue; }
    const conv = convertToPanelUnit(analyte, row.value, row.unit);
    if (!conv.ok) {
      skipped.push({ panel: row.panel, id: row.id, name: analyte.name, raw: row.value, from: conv.from, to: conv.to, reason: conv.reason });
      continue;
    }
    const v = conv.converted ? roundConverted(conv.value) : conv.value;
    (values[row.panel] ??= {})[row.id] = v;
    if (conv.converted) converted.push({ panel: row.panel, id: row.id, name: analyte.name, raw: row.value, from: conv.from, to: conv.to, value: v, factor: conv.factor });
  }
  if (dropped) console.warn(`extraction: dropped ${dropped} row(s) with an unknown panel/analyte pairing`);
  return { values, converted, skipped, dropped };
}
