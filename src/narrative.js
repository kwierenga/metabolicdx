// ─── NARRATIVE PROMPT ────────────────────────────────────────
// Builds the request sent to the model for the report narrative.
//
// Why this is its own module. The prompt leaves the building: it goes to a
// third-party API. Until 2026-11-13 it began "Case: <label>", and the label is
// the patient identifier the app has (patient.js keys longitudinal matching on
// it), so patient names were being sent with every narrative. The prompt now
// carries age, sex, panels, values, modifiers and the differential — what the
// interpretation actually needs — and nothing that identifies the person.
// narrative.test.js asserts that the label and date of birth never appear.
import { PANEL_ANALYTES, DISORDER_MAP } from "./analytes.js";
import { MODIFIER_MAP } from "./modifiers.js";

export const PANEL_NAMES = {
  PAA: "Plasma Amino Acids", UOA: "Urine Organic Acids", AC: "Plasma Acylcarnitines",
  CAR: "Plasma Carnitine", UAG: "Urine Acylglycines", MISC: "Miscellaneous",
};

/** One line per entered analyte, flagged against its reference limits. */
export function describeValues(values) {
  const abn = [], all = [];
  for (const [panelId, panelVals] of Object.entries(values ?? {})) {
    const analytes = PANEL_ANALYTES[panelId]; if (!analytes) continue;
    for (const a of analytes) {
      const raw = panelVals?.[a.id];
      const v = parseFloat(raw);
      if (raw === "" || raw == null || isNaN(v)) continue;
      const hi = v > a.hi, lo = a.lo > 0 && v < a.lo;
      const line = `[${panelId}] ${a.name}: ${v} ${a.unit} [ref ${a.lo > 0 ? a.lo + "–" : "≤"}${a.hi}] ${hi ? "HIGH" : lo ? "LOW" : "normal"}`;
      all.push(line);
      if (hi || lo) abn.push(line);
    }
  }
  return { abnormal: abn, all };
}

/**
 * The de-identified prompt. `ageStr` and `sex` are the only demographics; the
 * case label, date of birth, clinical free text and reviewer identity are
 * deliberately not parameters, so they cannot be included by accident.
 */
export function buildNarrativePrompt({ ageStr = "", sex = "", values, activeModifiers = [], knownDxId = null, results = [], activePanels = new Set(), patterns = [] }) {
  const panels = [...activePanels].map((p) => PANEL_NAMES[p] || p).join(", ");
  const { abnormal, all } = describeValues(values);
  const contextLines = abnormal.length ? abnormal : all;
  const top5 = (results || []).filter((r) => r.score > 0.02).slice(0, 5);
  const lead = top5[0];
  const diffLines = top5.map((r, i) => {
    const rel = lead && lead.score > 0 ? (r.score / lead.score) : 0;
    const tag = i === 0
      ? (r.separation ? ` — ${r.separation.label.toLowerCase()}${Number.isFinite(r.leadRatio) ? `, ${r.leadRatio.toFixed(2)}× the next candidate` : ""}` : "")
      : ` — ${(rel * 100).toFixed(0)}% of the leader's score`;
    return `${i + 1}. ${r.name} (${r.category})${tag}`;
  });
  const modLabels = activeModifiers.map((id) => MODIFIER_MAP[id]?.label || id);
  const knownDx = knownDxId ? DISORDER_MAP[knownDxId]?.name : null;

  return `You are a clinical biochemist writing a formal metabolic laboratory report narrative.
Be precise, factual, and clinical in tone. Use standard medical terminology. Do not speculate beyond the data.
Write in third person (e.g. "The results show...", "These findings are consistent with...").
The patient is identified to you only by age and sex. Do not invent, request or include any name, date of birth or identifier.
IMPORTANT: When multiple panels are provided (e.g. plasma acylcarnitines AND urine acylglycines), synthesise findings across ALL panels together — explicitly describe how findings from different panels corroborate or complement each other. Do not describe each panel in isolation.
Structure your response in three paragraphs:
1. FINDINGS: Summarise the significant biochemical abnormalities from ALL panels performed (${panels}), integrating cross-panel findings into a unified biochemical picture.
2. INTERPRETATION: Interpret the combined cross-panel pattern in clinical context.${knownDx ? " The patient has a known diagnosis of " + knownDx + " — focus on adequacy of metabolic control and whether the biochemical profile is consistent with the known diagnosis." : ""}${modLabels.length ? " Clinical modifiers active: " + modLabels.join(", ") + "." : ""} The differential below is a ranking by biochemical separation, not a probability; do not quote the scores as percentages.
3. RECOMMENDATIONS: State what additional investigations or management adjustments are warranted based on these results. Be specific and actionable.
Keep each paragraph to 3–5 sentences. Do not use bullet points. Do not include headings.

Patient: ${ageStr || "age not recorded"}${sex ? ", " + sex : ""}
Panels performed: ${panels}
${modLabels.length ? "Clinical context: " + modLabels.join(", ") : ""}
${knownDx ? "Known diagnosis: " + knownDx : ""}

Abnormal analytes:
${contextLines.length ? contextLines.join("\n") : "None flagged"}

${!knownDx ? `Top differential (scoring engine, ranked):\n${diffLines.join("\n")}` : ""}
${patterns.length ? `\nBiochemical patterns active:\n${patterns.map((p) => `[${p.confidence.toUpperCase()}] ${p.name}: ${p.hits.map((h) => h.label).join(" | ")}`).join("\n")}` : ""}`;
}
