"""One-shot generator: inserts followUp blocks into src/App.jsx and emits
matching markdown summaries in docs/act_sheets/.

For each disorder id in FOLLOW_UPS:
  1. Locates `   notes:"` line in the disorder's declaration in src/App.jsx
     (anchored on the disorder id) and inserts the followUp block above it.
     If a followUp block already exists in that disorder, it is REPLACED.
  2. Writes docs/act_sheets/<id>.md with the same content in markdown form
     (urgency, confirmatory testing, pitfalls, references).
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
APP = ROOT / "src" / "App.jsx"
ACT_DIR = ROOT / "docs" / "act_sheets"


def fu(name, urgency, urgency_note, confirmatory, pitfalls, references):
    return {
        "name": name,
        "urgency": urgency,
        "urgencyNote": urgency_note,
        "confirmatory": confirmatory,
        "pitfalls": pitfalls,
        "references": references,
    }


def render_jsx(d):
    """Render a followUp dict as JSX literal text (for inserting into App.jsx)."""
    lines = ["   followUp:{",
             f'     urgency:"{d["urgency"]}",',
             f'     urgencyNote:{js_dq(d["urgencyNote"])},',
             "     confirmatory:["]
    for c in d["confirmatory"]:
        lines.append(f"       {js_dq(c)},")
    lines.append("     ],")
    lines.append("     pitfalls:[")
    for p in d["pitfalls"]:
        lines.append(f"       {js_dq(p)},")
    lines.append("     ],")
    lines.append("     references:[")
    for r in d["references"]:
        lines.append(f"       {js_dq(r)},")
    lines.append("     ]")
    lines.append("   },")
    return "\n".join(lines) + "\n"


def js_dq(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def render_md(did, d):
    """Render a followUp dict as a standalone ACT-sheet markdown document."""
    md = [f"# ACT sheet — {d['name']} ({did})", ""]
    md.append(f"**Urgency:** {d['urgency'].upper()}")
    md.append("")
    md.append(d["urgencyNote"])
    md.append("")
    md.append("## Confirmatory testing")
    md.append("")
    for i, c in enumerate(d["confirmatory"], 1):
        md.append(f"{i}. {c}")
    md.append("")
    md.append("## Pitfalls and false-positive causes")
    md.append("")
    for i, p in enumerate(d["pitfalls"], 1):
        md.append(f"{i}. {p}")
    md.append("")
    md.append("## References")
    md.append("")
    for i, r in enumerate(d["references"], 1):
        md.append(f"{i}. {r}")
    md.append("")
    return "\n".join(md)


# Standard ACMG ACT-sheet citation, used in addition to disorder-specific guidelines
ACMG = "American College of Medical Genetics and Genomics. ACT Sheets and Confirmatory Algorithms — Newborn Screening. ACMG, 2001 (updated periodically). Available at https://www.acmg.net/ACMG/Medical-Genetics-Practice-Resources/ACT_Sheets_and_Algorithms.aspx"


FOLLOW_UPS = {}

# ── Aminoacidopathies ─────────────────────────────────────────────────
FOLLOW_UPS["PKU"] = fu(
    name="Phenylketonuria (PKU) / hyperphenylalaninaemia",
    urgency="routine",
    urgency_note="Routine within 1–2 weeks. Untreated PKU does not produce harm in the first months — early diagnosis allows preventive dietary intervention before brain development is impaired.",
    confirmatory=[
        "**Repeat plasma amino acids** — quantify Phe, Tyr and the Phe/Tyr ratio (>3 suspicious; >10 classical PKU).",
        "**Urine pterins (neopterin + biopterin) AND DBS DHPR activity** — MUST be performed in every newborn with hyperphenylalaninaemia to exclude BH4 disorders (1–3% of HPA, different therapy).",
        "**BH4 loading test (20 mg/kg)** — ≥30% Phe reduction at 24 h identifies BH4-responsive PAH variants (sapropterin candidates).",
        "**PAH molecular analysis** — predicts BH4-responsiveness (e.g., p.Y414C, p.A403V responsive; p.R408W classic non-responsive).",
        "**CSF neurotransmitter metabolites (HVA, 5-HIAA, 5-MTHF)** — only if pterins suggest BH4 disorder.",
    ],
    pitfalls=[
        "**TPN / amino acid infusion** — protein loading transiently elevates Phe; repeat off TPN.",
        "**Premature infants** — immature PAH activity gives mild HPA that resolves.",
        "**Tyrosinaemia (TYR1/2/3)** — Phe rises secondary to liver dysfunction with markedly higher Tyr; succinylacetone identifies TYR1.",
        "**Liver dysfunction of any cause** — secondary HPA, with Tyr and Met also elevated.",
        "**Maternal PKU syndrome** — high NBS Phe in well infant born to a poorly-controlled PKU mother; not infant disease.",
        "**Missing a BH4 disorder** — same Phe profile as PAH deficiency, but diet alone causes neurological deterioration; this is the most catastrophic interpretive error in PKU workup.",
    ],
    references=[
        "Vockley J et al. Phenylalanine hydroxylase deficiency: diagnosis and management guideline. Genet Med. 2014;16(2):188–200.",
        "van Wegberg AMJ et al. The complete European guidelines on phenylketonuria. Orphanet J Rare Dis. 2017;12(1):162.",
        "Opladen T et al. Consensus guideline for the diagnosis and treatment of tetrahydrobiopterin (BH4) deficiencies. Orphanet J Rare Dis. 2020;15(1):126.",
        ACMG,
    ],
)

FOLLOW_UPS["MSUD"] = fu(
    name="Maple syrup urine disease",
    urgency="critical",
    urgency_note="Same-day callback. Classic MSUD presents with encephalopathy and cerebral oedema between days 3–7 — admit for plasma BCAA + alloisoleucine quantitation if NBS shows leucine elevation.",
    confirmatory=[
        "**Plasma amino acids** — confirm Leu/Ile/Val elevation; (Leu+Ile+Val)/Ala ratio (low Ala due to anaplerosis block).",
        "**Plasma alloisoleucine** — pathognomonic at >5 µmol/L; persists between crises in intermittent forms (only reliable marker in remission).",
        "**Urine organic acids** — branched-chain α-ketoacids (2-ketoisocaproic, 2-keto-3-methylvaleric, 2-ketoisovaleric); bedside DNPH positive.",
        "**Plasma ammonia, blood gas, lactate, glucose** — assess decompensation.",
        "**BCKDHA / BCKDHB / DBT / DLD molecular analysis** — DLD (E3) deficiency adds combined PDH + α-KGDH deficiency with lactic acidosis.",
        "**Brain MRI if symptomatic** — characteristic MSUD oedema in dorsal brainstem, cerebellar white matter, globus pallidus, thalami.",
    ],
    pitfalls=[
        "**TPN with branched-chain enriched solutions / preterm parenteral feeds** — secondary BCAA elevation; repeat off TPN.",
        "**Intermittent MSUD between crises** — plasma BCAAs may NORMALISE; alloisoleucine is the only persistent marker.",
        "**Premature infants** — modest BCAA elevations; correlate with clinical picture.",
        "**Liver failure of any cause** — non-specific BCAA elevation.",
        "**Thiamine-responsive MSUD** — milder biochem may evade NBS thresholds; trial 100–300 mg/day after diagnosis.",
        "**Sample drawn during catabolism / fasting** in well infant — transient mild BCAA rise that resolves on feeding.",
    ],
    references=[
        "Strauss KA, Puffenberger EG, Morton DH. Maple Syrup Urine Disease. GeneReviews®. Seattle: University of Washington; 2013 [updated 2020].",
        "Frazier DM et al. Nutrition management guideline for maple syrup urine disease: an evidence- and consensus-based approach. Mol Genet Metab. 2014;112(3):210–7.",
        "Oglesbee D et al. Second-tier test for quantification of alloisoleucine and branched-chain amino acids in dried blood spots to improve newborn screening for maple syrup urine disease. Clin Chem. 2008;54(3):542–9.",
        ACMG,
    ],
)

FOLLOW_UPS["CBS"] = fu(
    name="Homocystinuria due to cystathionine β-synthase (CBS) deficiency",
    urgency="urgent",
    urgency_note="Confirm within 1–2 weeks. NBS by free homocystine has high false-negative rate for milder/B6-responsive forms — second-tier plasma total homocysteine is essential.",
    confirmatory=[
        "**Plasma total homocysteine (tHcy)** — diagnostic; >50 µmol/L confirms; correlates with severity.",
        "**Plasma amino acids** — methionine HIGH (key feature distinguishing CBS from remethylation defects), low cystathionine, low cysteine.",
        "**Plasma + urine methylmalonic acid** — must be NORMAL to confirm CBS (rules out cblC/D and isolated MMA).",
        "**Plasma B12 + folate + holoTC** — exclude nutritional / cofactor causes.",
        "**CBS molecular analysis** — predicts B6-responsiveness (p.I278T responsive; p.G307S non-responsive Celtic founder).",
        "**Pyridoxine challenge (200–500 mg/day × 4 weeks)** — B6-responsive if tHcy falls ≥30%; defines treatment arm.",
    ],
    pitfalls=[
        "**Free homocystine on NBS misses B6-responsive forms** — homocystine appears in urine only above plasma tHcy ~50 µmol/L; second-tier plasma tHcy mandatory.",
        "**Remethylation defects (cblC, cblG, MTHFR)** — high Hcy with LOW methionine; opposite Met/Hcy pattern.",
        "**B12 / folate deficiency** — secondary hyperhomocysteinaemia; resolves on supplementation.",
        "**Sample handling — Hcy in serum/whole blood rises rapidly post-collection** — chill within 15 min and centrifuge promptly or value will be falsely high.",
        "**MAT1A deficiency** — isolated hypermethioninaemia with normal/low Hcy.",
        "**Hawkinsinuria, GNMT** — high Met without Hcy elevation.",
    ],
    references=[
        "Morris AA et al. Guidelines for the diagnosis and management of cystathionine beta-synthase deficiency. J Inherit Metab Dis. 2017;40(1):49–74.",
        "Mudd SH et al. Disorders of transsulfuration. In: Scriver et al., OMMBID, ch. 88.",
        "Huemer M et al. Guidelines for diagnosis and management of the cobalamin-related remethylation disorders cblC, cblD, cblE, cblF, cblG, cblJ and MTHFR deficiency. J Inherit Metab Dis. 2017;40(1):21–48.",
        ACMG,
    ],
)

FOLLOW_UPS["TYR1"] = fu(
    name="Tyrosinaemia type I (hepatorenal tyrosinaemia)",
    urgency="critical",
    urgency_note="Same-day callback. Risk of fulminant liver failure within weeks; nitisinone is dramatically effective and must start before liver injury becomes irreversible.",
    confirmatory=[
        "**Whole blood / plasma succinylacetone (SA)** — pathognomonic even at trace levels; the diagnostic biochemical test.",
        "**Plasma amino acids** — Tyr typically elevated but NOT a sensitive screen on its own; Met also elevated in severe disease.",
        "**Urine organic acids** — succinylacetone, 4-OH-phenylpyruvate, 4-OH-phenyllactate.",
        "**LFTs, INR, alpha-fetoprotein (AFP)** — AFP characteristically very high; baseline for hepatocellular carcinoma surveillance.",
        "**Renal tubular function (Fanconi panel)** — electrolytes, glucosuria, generalised aminoaciduria, phosphaturia, hypophosphataemic rickets.",
        "**FAH molecular analysis** — confirms; Quebec/Saguenay-Lac-Saint-Jean founder p.E364G (c.1062+5G>A) common.",
    ],
    pitfalls=[
        "**Tyrosine-only NBS has low sensitivity** — modern programmes use SA on DBS; if Tyr-only is in use, second-tier SA is essential.",
        "**TYR2 (Richner-Hanhart, TAT)** — high Tyr (>500 µmol/L) but NO succinylacetone, NO liver disease, oculocutaneous features; benign on dietary control.",
        "**TYR3 (HPD)** — modest Tyr elevation, no SA, variable phenotype.",
        "**Transient tyrosinaemia of newborn / preterm liver immaturity** — mild Tyr rise without SA; resolves spontaneously.",
        "**TPN with hepatic dysfunction** — secondary Tyr/Met/Phe elevation; SA absent.",
        "**Sample after nitisinone started** — SA suppressed; document pre-treatment biochem before therapy.",
    ],
    references=[
        "Chinsky JM et al. Diagnosis and treatment of tyrosinemia type I: a US and Canadian consensus group review and recommendations. Genet Med. 2017;19(12):1380.",
        "de Laet C et al. Recommendations for the management of tyrosinaemia type 1. Orphanet J Rare Dis. 2013;8:8.",
        "Morrow G, Tanguay RM. Biochemical and clinical aspects of hereditary tyrosinemia type 1. Adv Exp Med Biol. 2017;959:9–21.",
        ACMG,
    ],
)

# ── Urea cycle disorders ──────────────────────────────────────────────
FOLLOW_UPS["CITR1"] = fu(
    name="Citrullinemia type I (ASS1 deficiency)",
    urgency="critical",
    urgency_note="Same-day callback. Neonatal hyperammonaemia in classic form develops days 2–7 — admit for plasma ammonia and amino acids before discharge if NBS shows markedly elevated citrulline.",
    confirmatory=[
        "**Plasma ammonia STAT** — >150 µmol/L mandates emergency UCD protocol; >500 µmol/L mandates haemodiafiltration.",
        "**Plasma amino acids** — Cit markedly elevated (>500–1000 µmol/L in classic); Arg low; Cit/Arg ratio >4 supports diagnosis (>10 strongly supports).",
        "**Plasma argininosuccinic acid** — should be NORMAL (presence indicates ASL deficiency, not ASS1).",
        "**Urine orotic acid** — elevated downstream of carbamoyl-phosphate accumulation; distinguishes from CPS1/NAGS where normal.",
        "**ASS1 molecular analysis** — confirms; phenotype-genotype correlation moderate.",
        "**For mild/late-onset suspected** — protein loading test with serial ammonia + Cit measurement under supervision.",
    ],
    pitfalls=[
        "**Citrin deficiency (CITR2 / SLC25A13)** — mild-moderate Cit elevation with NICCD (cholestasis, lactosuria, galactosuria); very different management.",
        "**Argininosuccinic aciduria (ASL)** — Cit also elevated; ASA on AA panel distinguishes.",
        "**Sample after dialysis** — Cit normalises rapidly; document pre-dialysis biochem.",
        "**Pyrroline-5-carboxylate synthase (P5CS) deficiency** — low Cit AND low Arg AND low Orn; opposite pattern but on differential of UCD-like presentations.",
        "**TPN with Cit-containing solution** — uncommon but described.",
        "**Arginine therapy started before sampling** — alters Cit/Arg ratio interpretation.",
    ],
    references=[
        "Häberle J et al. Suggested guidelines for the diagnosis and management of urea cycle disorders: first revision. J Inherit Metab Dis. 2019;42(6):1192–230.",
        "Quinonez SC, Thoene JG. Citrullinemia type I. GeneReviews®. 2004 [updated 2022].",
        "Summar ML et al. The incidence of urea cycle disorders. Mol Genet Metab. 2013;110(1–2):179–80.",
        ACMG,
    ],
)

FOLLOW_UPS["ASA_AC"] = fu(
    name="Argininosuccinic aciduria (ASL deficiency)",
    urgency="critical",
    urgency_note="Same-day callback. Neonatal hyperammonaemia presents days 2–7; long-term hepatopathy and hypertension require ongoing surveillance even with biochemical control.",
    confirmatory=[
        "**Plasma ammonia STAT**.",
        "**Plasma amino acids** — argininosuccinic acid (ASA) pathognomonic; Cit elevated; Arg low.",
        "**Urine orotic acid** — typically elevated.",
        "**ASL molecular analysis** — confirms.",
        "**Baseline LFTs and BP** — chronic hepatopathy and hypertension are common despite biochem control.",
        "**Echocardiogram and renal function** — cardiovascular and renal complications are part of the long-term phenotype.",
    ],
    pitfalls=[
        "**ASA can be falsely low** — anhydroform interconversion during storage; chromatographic conditions and prompt analysis matter.",
        "**Citrullinemia type I (ASS1)** — also high Cit but NO ASA on AA panel.",
        "**Mild / late-onset cases** — biochem may be near-normal at baseline; require protein challenge to provoke.",
        "**TPN with Cit-containing solutions** — secondary Cit elevation without ASA.",
        "**Arginine supplementation already started** — alters interpretation of Cit/Arg/ASA balance.",
    ],
    references=[
        "Häberle J et al. Suggested guidelines for the diagnosis and management of urea cycle disorders: first revision. J Inherit Metab Dis. 2019;42(6):1192–230.",
        "Erez A et al. Argininosuccinic aciduria: from a monogenic to a complex disorder. Mol Genet Metab. 2011;104(1–2):14–9.",
        "Nagamani SC et al. Argininosuccinate lyase deficiency. GeneReviews®. 2011 [updated 2019].",
        ACMG,
    ],
)

FOLLOW_UPS["ARG1"] = fu(
    name="Argininaemia (ARG1 deficiency)",
    urgency="urgent",
    urgency_note="Confirm within 1–2 weeks. Unlike other UCDs, hyperammonaemia is rare and subtle in infancy; presentation is progressive spastic diplegia. Early diet + pegzilarginase prevents neurological deterioration.",
    confirmatory=[
        "**Plasma amino acids** — Arg markedly elevated (often >500 µmol/L); Cit normal.",
        "**Plasma ammonia** — usually only mildly elevated in ARG1, unlike other UCDs.",
        "**Urine orotic acid** — mild-moderate elevation.",
        "**ARG1 molecular analysis** — confirms; founder variants in some populations.",
        "**Baseline neurological exam + brain MRI** — establish progression baseline.",
        "**Erythrocyte arginase activity** — adjunct when molecular result equivocal.",
    ],
    pitfalls=[
        "**Lysinuric protein intolerance (LPI)** — low Arg, Lys, Orn; opposite plasma pattern.",
        "**TPN with arginine-containing solution** — usually transient and modest.",
        "**Hepatic dysfunction of any cause** — secondary mild Arg elevation.",
        "**Neonatal Arg elevation can be transient** — reassess at 1 month if borderline.",
        "**Pegzilarginase therapy** — biochem normalises rapidly; document pre-treatment values.",
    ],
    references=[
        "Sun A, Crombez EA. Arginase deficiency. GeneReviews®. 2004 [updated 2020].",
        "Häberle J et al. Suggested guidelines for the diagnosis and management of urea cycle disorders: first revision. J Inherit Metab Dis. 2019;42(6):1192–230.",
        "Diaz GA et al. Pegzilarginase for arginase 1 deficiency. Mol Genet Metab. 2021;134(3):216–21.",
        ACMG,
    ],
)

FOLLOW_UPS["OTC"] = fu(
    name="Ornithine transcarbamylase (OTC) deficiency",
    urgency="critical",
    urgency_note="Same-day for symptomatic neonatal males; expedited workup for asymptomatic NBS-flagged females (X-linked, variable expression). Emergency UCD protocol if any encephalopathy.",
    confirmatory=[
        "**Plasma ammonia STAT**.",
        "**Plasma amino acids** — low Cit, low Arg, elevated Gln (often >1000 µmol/L).",
        "**Urine orotic acid** — markedly elevated; the diagnostic marker that distinguishes OTC from CPS1/NAGS (where normal).",
        "**OTC molecular analysis** — X-linked; confirms; genetic counselling for heterozygote risk.",
        "**Allopurinol orotic acid challenge** — for symptomatic carrier females with normal baseline biochem (orotic aciduria provoked).",
        "**N-carbamylglutamate (NCG) trial** — should reverse biochemistry only in NAGS deficiency; if response in CPS1-like presentation, suspect NAGS.",
    ],
    pitfalls=[
        "**CPS1 / NAGS deficiency** — same low Cit/Arg pattern but orotic acid NORMAL.",
        "**Heterozygous OTC female carriers** — biochem may be intermittent/normal; clinical picture and molecular result key.",
        "**Hereditary orotic aciduria (UMPS deficiency)** — also high orotic but with megaloblastic anaemia, NOT hyperammonaemia.",
        "**Allopurinol exposure** — produces false-positive orotic aciduria.",
        "**Sample after dialysis** — biochem normalises rapidly.",
        "**Pyrimidine-pathway disorders** — can produce orotic-aciduria patterns unrelated to urea-cycle function.",
    ],
    references=[
        "Lichter-Konecki U et al. Ornithine transcarbamylase deficiency. GeneReviews®. 2013 [updated 2022].",
        "Häberle J et al. Suggested guidelines for the diagnosis and management of urea cycle disorders: first revision. J Inherit Metab Dis. 2019;42(6):1192–230.",
        "Tuchman M et al. Cross-sectional multicenter study of patients with urea cycle disorders in the United States. Mol Genet Metab. 2008;94(4):397–402.",
        ACMG,
    ],
)

# ── Organic acidaemias (PA / GA1 / MCAD already inserted earlier — included here for re-run idempotence) ──
FOLLOW_UPS["PA"] = fu(
    name="Propionic acidaemia",
    urgency="critical",
    urgency_note="Same-day clinical callback. Risk of irreversible neonatal decompensation within the first week — admit and start metabolic emergency protocol pre-emptively if presymptomatic NBS-positive on day 5–7.",
    confirmatory=[
        "**Plasma ammonia, lactate, blood gas, anion gap, glucose** — characterise acute decompensation; ammonia >200 µmol/L mandates dialysis planning.",
        "**Repeat plasma acylcarnitines** — confirm C3 elevation and C3/C2, C3/(C16+C18:1) ratios; C3/Gly is the most specific single ratio.",
        "**Urine organic acids** — methylcitrate (MCA), 3-hydroxypropionate, propionylglycine, tiglylglycine; MCA >> MMA distinguishes from MMA.",
        "**Plasma total homocysteine + plasma methionine** — REQUIRED to exclude cblC/cblD (also elevates C3, but with hyperhomocysteinaemia and low Met).",
        "**PCCA / PCCB molecular analysis** — confirms diagnosis; clarifies founder variants (Inuit PCCA c.1540+1G>A, Saudi PCCB c.990dupT).",
        "**Baseline echocardiogram, ECG, CBC** — establish pre-treatment cardiac and haematological status (cardiomyopathy and cytopenias are core complications).",
    ],
    pitfalls=[
        "**Maternal B12 deficiency / pernicious anaemia / vegan diet / gastric bypass** — elevates infant C3 with secondary hyperhomocysteinaemia and methylmalonic aciduria; resolves on maternal repletion. Always ask.",
        "**cblC / cblD / cblF / cblJ** — same C3 signature with low Met and high homocysteine; missing these is the commonest interpretive error.",
        "**Sample after blood transfusion or post-haemodialysis** — can normalise C3 and mask abnormality; defer second-tier testing 48–72 h.",
        "**Premature / sick infants with secondary mitochondrial dysfunction** — modest C3 elevation that resolves with clinical recovery.",
        "**Valproate, ECMO, parenteral nutrition with propionate-containing components** — secondary C3 elevation.",
    ],
    references=[
        "Forny P et al. Guidelines for the diagnosis and management of methylmalonic acidaemia and propionic acidaemia: first revision. J Inherit Metab Dis. 2021;44(3):566–92.",
        "Baumgartner MR et al. Proposed guidelines for the diagnosis and management of methylmalonic and propionic acidemia. Orphanet J Rare Dis. 2014;9:130.",
        "Shchelochkov OA et al. Propionic acidemia. GeneReviews®. 2012 [updated 2022].",
        ACMG,
    ],
)

FOLLOW_UPS["MMA"] = fu(
    name="Methylmalonic acidaemia (mut / cblA / cblB)",
    urgency="critical",
    urgency_note="Same-day callback. Neonatal decompensation similar to PA; B12-responsive forms (cblA/B) have better outcome but only if hydroxocobalamin started early.",
    confirmatory=[
        "**Plasma ammonia, lactate, blood gas, anion gap, glucose** — assess decompensation.",
        "**Repeat plasma acylcarnitines** — confirm C3 and C3/C2 ratio.",
        "**Urine organic acids** — methylmalonic acid (markedly elevated); methylcitrate (less prominent than in PA, the inverse of the PA pattern).",
        "**Plasma total homocysteine — REQUIRED** to exclude cblC/D/F/J (combined disorders need different therapy).",
        "**Plasma + urine MMA quantitation** — distinguishes MUT (very high) from cblA/B (intermediate) from MCEE / TCN2 / nutritional (mild).",
        "**Hydroxocobalamin challenge (1 mg IM × 5 days)** — defines B12-responsiveness; cblA/B respond, mut does not.",
        "**MMUT / MMAA / MMAB / MMACHC molecular analysis**.",
        "**Baseline renal function + cystatin C** — CKD is the long-term complication.",
    ],
    pitfalls=[
        "**cblC / cblD (MMACHC, MMADHC)** — high MMA + high Hcy + low Met; very different therapy (lifelong hydroxocobalamin + betaine).",
        "**Maternal B12 deficiency** — infant secondary MMA elevation; ask about maternal vegan diet, gastric bypass, autoimmune gastritis, PPI use.",
        "**TCN2 deficiency** — combined MMA + Hcy with NORMAL serum B12 (most B12 is haptocorrin-bound; misleading).",
        "**MCEE deficiency** — mild MMA elevation; usually clinically benign.",
        "**Acquired B12 / folate deficiency in older child** — reversible with supplementation.",
        "**Sample post-transfusion or post-haemodialysis** — masks abnormality; defer testing 48–72 h.",
        "**Vitamin B12 pre-treatment** — biochem normalises rapidly; document pre-treatment values.",
    ],
    references=[
        "Forny P et al. Guidelines for the diagnosis and management of methylmalonic acidaemia and propionic acidaemia: first revision. J Inherit Metab Dis. 2021;44(3):566–92.",
        "Manoli I, Sloan JL, Venditti CP. Isolated methylmalonic acidemia. GeneReviews®. 2005 [updated 2022].",
        "Baumgartner MR et al. Proposed guidelines for the diagnosis and management of methylmalonic and propionic acidemia. Orphanet J Rare Dis. 2014;9:130.",
        ACMG,
    ],
)

FOLLOW_UPS["CBLC"] = fu(
    name="Combined methylmalonic acidaemia and homocystinuria (cblC/D type)",
    urgency="critical",
    urgency_note="Same-day callback. Multi-organ involvement (haemolytic uraemic syndrome, retinopathy, leukoencephalopathy) develops fast in early-onset disease; hydroxocobalamin starts day 1 of suspicion.",
    confirmatory=[
        "**Plasma total homocysteine** — typically markedly elevated (>100 µmol/L).",
        "**Plasma + urine methylmalonic acid** — elevated (less than in mut MMA but consistent).",
        "**Plasma amino acids** — METHIONINE LOW (key distinguishing feature from CBS deficiency).",
        "**Plasma acylcarnitines** — C3 elevated.",
        "**MMACHC / MMADHC molecular analysis** — c.271dupA most common Caucasian variant; confirms cblC vs cblD.",
        "**Urgent ophthalmology** — pigmentary retinopathy is progressive; baseline ERG.",
        "**Hydroxocobalamin challenge (1 mg IM)** — biochem response defines therapy.",
    ],
    pitfalls=[
        "**CBS deficiency** — also high Hcy but Met HIGH (not low) and MMA NORMAL.",
        "**MTHFR deficiency** — high Hcy, low Met, but MMA NORMAL.",
        "**Isolated MMA (mut/cblA/B)** — high MMA but Hcy NORMAL.",
        "**Maternal B12 deficiency** — infant has same triad; reversible with maternal repletion.",
        "**TCN2 deficiency** — combined MMA + Hcy with normal serum B12.",
        "**cblF (LMBRD1) and cblJ (ABCD4)** — same biochem; molecular result distinguishes.",
        "**Pre-treatment with hydroxocobalamin** — biochem normalises within days.",
    ],
    references=[
        "Huemer M et al. Guidelines for diagnosis and management of the cobalamin-related remethylation disorders cblC, cblD, cblE, cblF, cblG, cblJ and MTHFR deficiency. J Inherit Metab Dis. 2017;40(1):21–48.",
        "Sloan JL et al. Disorders of intracellular cobalamin metabolism. GeneReviews®. 2008 [updated 2018].",
        "Carrillo-Carrasco N et al. Combined methylmalonic acidemia and homocystinuria, cblC type. I. Clinical presentations, diagnosis and management. J Inherit Metab Dis. 2012;35(1):91–102.",
        ACMG,
    ],
)

FOLLOW_UPS["IVA"] = fu(
    name="Isovaleric acidaemia",
    urgency="critical",
    urgency_note="Same-day callback. Acute neonatal form presents with ketoacidotic crisis days 3–7; chronic form presents later but each crisis carries CNS injury risk.",
    confirmatory=[
        "**Repeat plasma acylcarnitines** — confirm C5 elevation.",
        "**Urine acylglycines** — ISOVALERYLGLYCINE pathognomonic; persistent between crises.",
        "**Urine organic acids** — isovalerylglycine, 3-OH-isovaleric, 4-OH-isovaleric (distinguishes from pivalate confounder).",
        "**Plasma ammonia, blood gas, glucose** — assess decompensation.",
        "**IVD molecular analysis** — c.932C>T (p.A282V) is a common mild allele identified by NBS that is likely clinically benign.",
    ],
    pitfalls=[
        "**Pivampicillin / pivalate-containing antibiotics** — produce pivaloylcarnitine that elevates C5 with NORMAL urinary isovalerylglycine; the most common false-positive.",
        "**2-Methylbutyryl-CoA dehydrogenase deficiency (SBCAD / ACADSB)** — also elevates C5; the distinguishing UAG marker is 2-methylbutyrylglycine, NOT isovalerylglycine.",
        "**Mild p.A282V variant** — frequently identified on NBS with low isovalerylglycine and usually clinically benign.",
        "**TPN with cysteine-deficient solutions** — secondary mild C5 elevation.",
        "**Valproate therapy** — secondary C5 elevation.",
        "**Sample drawn during illness** — non-specific transient C5 in healthy infants.",
    ],
    references=[
        "Vockley J, Ensenauer R. Isovaleric acidemia: new aspects of genetic and phenotypic heterogeneity. Am J Med Genet C. 2006;142C(2):95–103.",
        "Grünert SC et al. Clinical and neurocognitive outcome in symptomatic isovaleric acidemia. Orphanet J Rare Dis. 2012;7:9.",
        "Schlune A et al. Single-newborn screening for isovaleric acidemia: experience and follow-up. Eur J Pediatr. 2018;177(7):1001–9.",
        ACMG,
    ],
)

FOLLOW_UPS["MCC"] = fu(
    name="3-Methylcrotonyl-CoA carboxylase (3-MCC) deficiency",
    urgency="routine",
    urgency_note="Routine within 2–4 weeks. Most NBS-identified 3-MCC is clinically benign — but the C5-OH pattern can also signal treatable MCD/biotinidase deficiency or MATERNAL 3-MCC, both of which need separate management.",
    confirmatory=[
        "**Repeat plasma acylcarnitines** — confirm C5-OH elevation.",
        "**Urine organic acids** — 3-methylcrotonylglycine (MCG) + 3-OH-isovaleric acid.",
        "**Plasma biotinidase activity — RULE OUT biotinidase / MCD first** (treatable, biotin-responsive).",
        "**Plasma free + total carnitine** — often low (secondary).",
        "**MATERNAL biotinidase activity AND maternal urine MCG** — NBS detection is sometimes due to maternal MCC or biotinidase deficiency, not infant disease.",
        "**MCCC1 / MCCC2 molecular analysis** — confirms infant disease.",
    ],
    pitfalls=[
        "**MATERNAL 3-MCC deficiency** — placental / breast-milk transfer produces a positive infant NBS that resolves on formula feeding; the most common cause of positive C5-OH NBS.",
        "**Maternal biotinidase deficiency** — same picture.",
        "**MCD / biotinidase / HLCS deficiency in INFANT** — must be excluded first; treatable with biotin.",
        "**HMG-CoA lyase deficiency** — also high C5-OH; distinguished by hypoketotic hypoglycaemia and HMG in urine.",
        "**β-Ketothiolase, isolated MCD** — share C5-OH elevation.",
        "**Hydroxylated AC of generic mitochondrial dysfunction** — non-specific elevation.",
    ],
    references=[
        "Grünert SC et al. 3-methylcrotonyl-CoA carboxylase deficiency: clinical, biochemical, enzymatic and molecular studies in 88 individuals. Orphanet J Rare Dis. 2012;7:31.",
        "Koeberl DD et al. Evaluation of 3-methylcrotonyl-CoA carboxylase deficiency detected by tandem mass spectrometry newborn screening. J Inherit Metab Dis. 2003;26(1):25–35.",
        "Wilcken B. 3-methylcrotonyl-CoA carboxylase deficiency: to screen or not to screen? J Inherit Metab Dis. 2016;39(2):171–2.",
        ACMG,
    ],
)

FOLLOW_UPS["HMGCL"] = fu(
    name="3-Hydroxy-3-methylglutaryl-CoA lyase (HMG-CoA lyase) deficiency",
    urgency="critical",
    urgency_note="Same-day callback. Hypoketotic hypoglycaemia + acidosis presents within first months and can be fatal; preventable with simple feeding regimen if recognised.",
    confirmatory=[
        "**Repeat plasma acylcarnitines** — C5-OH and C6DC elevated.",
        "**Urine organic acids** — 3-HYDROXY-3-METHYLGLUTARIC ACID (HMG) pathognomonic; also 3-methylglutaconic, 3-methylglutaric, 3-OH-isovaleric.",
        "**Glucose, ketones, blood gas during illness** — confirms hypoketotic hypoglycaemia + acidosis.",
        "**HMGCL molecular analysis** — Saudi/Middle East founder variants common.",
    ],
    pitfalls=[
        "**Isolated 3-MCC** — also high C5-OH but NO HMG in urine.",
        "**MCD / biotinidase deficiency** — share C5-OH; biotinidase activity distinguishes.",
        "**AUH (3-MGA type I)** — primary 3-methylglutaconic aciduria but no HMG and no hypoketotic hypoglycaemia.",
        "**Secondary 3-MGA (Barth syndrome, TMEM70, OPA3, SERAC1)** — non-specific marker of mitochondrial dysfunction.",
        "**Sample taken when fed and well** — UOA may be near-normal; collect during illness for diagnostic yield.",
    ],
    references=[
        "Pié J et al. Molecular genetics of HMG-CoA lyase deficiency. Mol Genet Metab. 2007;92(3):198–209.",
        "Mir C et al. 3-hydroxy-3-methylglutaric aciduria: clinical and biochemical findings in 31 patients. J Inherit Metab Dis. 2014;37(4):539–45.",
        ACMG,
    ],
)

FOLLOW_UPS["BKT"] = fu(
    name="β-Ketothiolase deficiency (T2 / mitochondrial acetoacetyl-CoA thiolase deficiency)",
    urgency="urgent",
    urgency_note="Confirm within 1–2 weeks. Episodic ketoacidotic crises are precipitated by intercurrent illness — emergency-glucose protocol prevents most morbidity.",
    confirmatory=[
        "**Repeat plasma acylcarnitines** — C5:1 (tiglylcarnitine) elevation; C5-OH may also rise.",
        "**Urine organic acids** — 2-methyl-3-hydroxybutyric acid + tiglylglycine + 2-methylacetoacetic acid (request fresh sample — methylacetoacetate is unstable).",
        "**ACAT1 molecular analysis** — preferred over biochem alone, which can normalise between crises.",
        "**Glucose, ketones, anion gap during illness** — diagnostic episode is the highest-yield biochem opportunity.",
    ],
    pitfalls=[
        "**Between crises BIOCHEMISTRY MAY BE NORMAL** — re-test during illness if clinical suspicion persists.",
        "**HSD17B10 deficiency (2-methyl-3-hydroxybutyric aciduria)** — overlapping urinary marker; X-linked + neurodegeneration; clinically distinct.",
        "**SCHAD / MHBD** — overlapping markers.",
        "**Ketogenic state in well child** — secondary mild 2-methylacetoacetate.",
        "**Sample storage** — methylacetoacetic acid degrades rapidly; freeze immediately.",
    ],
    references=[
        "Fukao T et al. Beta-ketothiolase (T2) deficiency. J Hum Genet. 2014;59(12):643–50.",
        "Sass JO et al. Inborn errors of ketogenesis and ketone body utilisation. J Inherit Metab Dis. 2012;35(1):23–8.",
        "Abdelkreem E et al. Mitochondrial acetoacetyl-CoA thiolase (T2) deficiency: 26 new cases. Mol Genet Metab. 2017;120(1–2):85–9.",
        ACMG,
    ],
)

FOLLOW_UPS["GA1"] = fu(
    name="Glutaric aciduria type I",
    urgency="urgent",
    urgency_note="Confirm before age 3 months. The clinical risk window for striatal injury opens around 3 months, so emergency-protocol education and dietary management must be in place before the first febrile illness.",
    confirmatory=[
        "**Repeat plasma acylcarnitines** — confirm C5DC and C5DC/C8 ratio (separates from medium-chain FAO disorders).",
        "**Urine organic acids** — glutaric acid, 3-hydroxyglutaric acid, glutaconic acid; 3-OHGA/GA ratio >0.3 favours GA1 over GA3.",
        "**Urine acylglycines** — glutarylglycine adds specificity, particularly when UOA values are borderline.",
        "**GCDH molecular analysis — ESSENTIAL** — single most important confirmatory test because ~25% of patients are biochemical low excreters. Do not omit even if biochem is borderline.",
        "**GCDH enzyme activity on cultured fibroblasts** — reserved for cases with VUS or non-diagnostic molecular result.",
        "**Baseline brain MRI + serial occipitofrontal head circumference** — fronto-temporal atrophy and macrocephaly are diagnostic supporting features.",
    ],
    pitfalls=[
        "**LOW EXCRETER PHENOTYPE (~25%)** — C5DC, urinary GA and 3-OHGA may all be near-normal despite confirmed GCDH deficiency and full neurological risk. A negative biochemical workup does NOT exclude GA1 — go to molecular.",
        "**GA3 / SUGCT deficiency** — modest urinary GA but normal C5DC and 3-OHGA/GA <0.3; clinically benign.",
        "**MADD / GA-II (ETFA/ETFB/ETFDH)** — multi-chain AC profile (C4, C5, C8, C10, C14:1) plus elevated GA; check the rest of the AC profile before settling on GA1.",
        "**Riboflavin transporter deficiency (SLC52A2/3)** — secondary GA-like profile; responds to high-dose riboflavin.",
        "**Methylmalonic acidaemia** — can show mild urinary GA secondary to abnormal CoA metabolism.",
        "**Valproate therapy** — mild secondary C5DC elevation.",
    ],
    references=[
        "Boy N et al. Proposed recommendations for diagnosing and managing individuals with glutaric aciduria type I: third revision. J Inherit Metab Dis. 2017;40(1):75–101.",
        "Gallagher RC et al. Glutaric acidemia, type I — ACMG ACT sheet. Genet Med. 2018;20(12):1574–87.",
        "Kölker S et al. Diagnosis and management of glutaric aciduria type I — revised recommendations. J Inherit Metab Dis. 2011;34(3):677–94.",
        ACMG,
    ],
)

FOLLOW_UPS["GA2"] = fu(
    name="Glutaric aciduria type II / Multiple acyl-CoA dehydrogenase deficiency (MADD)",
    urgency="critical",
    urgency_note="Same-day for severe neonatal form (acidosis, hypoglycaemia, dysmorphic features, polycystic kidneys). Late-onset/riboflavin-responsive forms can be confirmed routinely — but riboflavin trial is dramatically effective and should not be delayed.",
    confirmatory=[
        "**Repeat plasma acylcarnitines** — multi-chain elevation: C4, C5, C6, C8, C10, C12, C14, C14:1, C16, C18 (the 'shotgun' MADD pattern).",
        "**Urine organic acids** — multiple dicarboxylic acids (adipic, suberic, sebacic), glutaric, ethylmalonic, hexanoylglycine, isovalerylglycine, isobutyrylglycine.",
        "**Urine acylglycines** — broad pattern (isovaleryl + isobutyryl + 2-methylbutyryl + hexanoyl).",
        "**ETFA / ETFB / ETFDH molecular analysis** — confirms; ETFDH variants associate with riboflavin-responsive late-onset.",
        "**Riboflavin challenge (100–400 mg/day × 4 weeks)** — late-onset forms (especially ETFDH) respond dramatically.",
        "**SLC52A2 / SLC52A3 sequencing** — riboflavin transporter deficiency mimics MADD biochem (BVVL syndrome).",
    ],
    pitfalls=[
        "**Riboflavin transporter deficiency (BVVL, SLC52A2/A3)** — multi-chain AC pattern with deafness + cranial nerve palsy; lifesavingly riboflavin-responsive.",
        "**Late-onset ETFDH milder pattern** — may be missed on NBS but presents in childhood/adolescence with myopathy or Reye-like illness.",
        "**Maternal riboflavin deficiency** — secondary MADD-like pattern in infant.",
        "**Critical illness / ECMO / TPN with intralipid** — non-specific multi-chain AC elevation.",
        "**Single-enzyme FAO disorders (MCAD, VLCAD, etc.)** — narrower AC pattern; do not confuse with MADD's broad spectrum.",
    ],
    references=[
        "Frerman FE, Goodman SI. Defects of electron transfer flavoprotein and electron transfer flavoprotein-ubiquinone oxidoreductase: glutaric acidemia type II. In: Scriver et al., OMMBID.",
        "Olsen RKJ et al. ETFDH mutations as a major cause of riboflavin-responsive multiple acyl-CoA dehydrogenation deficiency. Brain. 2007;130(Pt 8):2045–54.",
        "Grünert SC. Clinical and genetical heterogeneity of late-onset multiple acyl-coenzyme A dehydrogenase deficiency. Orphanet J Rare Dis. 2014;9:117.",
        ACMG,
    ],
)

FOLLOW_UPS["MCD"] = fu(
    name="Multiple carboxylase deficiency (biotinidase / HLCS deficiency)",
    urgency="urgent",
    urgency_note="Confirm within 1–2 weeks. Highly biotin-responsive — early biotin starts before any neurological/cutaneous manifestation and reverses biochemistry rapidly.",
    confirmatory=[
        "**Plasma biotinidase activity** — definitive for biotinidase deficiency (most common form); profound <10%, partial 10–30%.",
        "**Urine organic acids** — 3-OH-isovaleric, 3-methylcrotonylglycine, methylcitric acid, lactic acid, propionylglycine (combined-carboxylase pattern).",
        "**Plasma acylcarnitines** — C5-OH + C3 + lactic acid.",
        "**HLCS sequencing** — for neonatal-onset / severe MCD with normal biotinidase activity.",
        "**BTD molecular analysis** — confirms biotinidase deficiency.",
        "**Biotin trial (5–10 mg/day)** — biochemical normalisation within days; therapeutic and confirmatory.",
    ],
    pitfalls=[
        "**Isolated 3-MCC deficiency** — C5-OH elevated but biotinidase activity NORMAL.",
        "**HMG-CoA lyase deficiency** — high C5-OH; distinguished by HMG in UOA.",
        "**Maternal biotinidase deficiency** — affects newborn screen biochem; usually mild and self-resolving.",
        "**Anti-epileptic medication (carbamazepine, phenytoin, valproate)** — induce biotinidase activity reduction; spurious low NBS.",
        "**Premature infants** — biotinidase activity can be transiently low.",
        "**TPN without biotin supplementation** — secondary functional deficiency.",
        "**Heat-degraded DBS** — falsely-low biotinidase activity; resampling normal.",
    ],
    references=[
        "Wolf B. Biotinidase deficiency. GeneReviews®. 2003 [updated 2016].",
        "Suormala T et al. Newborn screening for biotinidase deficiency: results, outcome and incidence. Pediatr Res. 1985;19(11):1156–61.",
        "Donti TR et al. Holocarboxylase synthetase deficiency: pre and post newborn screening. Mol Genet Metab Rep. 2016;7:40–4.",
        ACMG,
    ],
)

# ── Fatty acid oxidation ──────────────────────────────────────────────
FOLLOW_UPS["MCAD"] = fu(
    name="Medium-chain acyl-CoA dehydrogenase (MCAD) deficiency",
    urgency="urgent",
    urgency_note="Confirm and educate the family before the infant's first prolonged fast or intercurrent illness — first crisis can be fatal and is preventable with simple fasting avoidance + emergency-glucose protocol.",
    confirmatory=[
        "**Repeat plasma acylcarnitines** — confirm C8 elevation (typically >0.3 µmol/L) and C8/C10 ratio (>2, often >5 in classic disease).",
        "**Urine acylglycines — hexanoylglycine and suberylglycine** — more specific than urine organic acids; the confirmatory biochemical test even between crises.",
        "**ACADM molecular analysis** — c.985A>G (p.K329E) homozygosity in ~80% of Northern European patients; compound heterozygotes with c.199T>C / p.Y67H or other mild alleles have attenuated biochemistry and may evade NBS.",
        "**Plasma free + total carnitine** — often low; informs whether carnitine supplementation is needed.",
        "**Urine organic acids** — only diagnostic during acute illness (dicarboxylic aciduria with inappropriately low ketones); a normal between-crisis sample does NOT exclude MCAD.",
    ],
    pitfalls=[
        "**MCT-containing formula (premature infant formula, ketogenic regimens)** — produces marked C8 elevation that mimics MCAD; check feeding history before workup.",
        "**Valproate therapy** — secondary C6/C8/C10 elevation on AC.",
        "**Mild ACADM variants (e.g., p.Y67H, p.Y42H)** — borderline DBS C8 may evade NBS thresholds while still carrying meaningful crisis risk; molecular result reframes interpretation.",
        "**Heterozygote carriers** — occasional borderline C8 on AC with no biallelic ACADM variants and no clinical risk.",
        "**Pivampicillin / pivalate-containing antibiotics** — elevate C5, NOT C8; common confounder when reviewing AC panels but unrelated to MCAD.",
        "**Sample collected during acute illness** — transient elevations can occur in healthy infants; repeat when well.",
    ],
    references=[
        "Merritt JL, Chang IJ. Medium-chain acyl-coenzyme A dehydrogenase deficiency. GeneReviews®. 2000 [updated 2019].",
        "Miller MJ et al. Recommendations for the diagnosis and management of medium-chain acyl-CoA dehydrogenase deficiency. Mol Genet Metab. 2021;132(1):5–11.",
        "Wilcken B et al. Outcome of neonatal screening for medium-chain acyl-CoA dehydrogenase deficiency. Lancet. 2007;369(9555):37–42.",
        ACMG,
    ],
)

FOLLOW_UPS["VLCAD"] = fu(
    name="Very-long-chain acyl-CoA dehydrogenase (VLCAD) deficiency",
    urgency="urgent",
    urgency_note="Confirm within 1–2 weeks. Risk spectrum spans neonatal cardiomyopathy, infantile hepatic and adult-onset myopathic phenotypes — confirm before discharge and stratify by phenotype.",
    confirmatory=[
        "**Repeat plasma acylcarnitines** — C14:1 elevated; C14:1/C2 and C14:1/C12 ratios; (C16+C18:1)/C2 long-chain burden ratio.",
        "**Urine organic acids during illness** — C6–C14 dicarboxylic aciduria; often normal between crises.",
        "**ACADVL molecular analysis** — confirms; phenotype roughly correlates with residual activity.",
        "**Echocardiogram + ECG + CK** — establish baseline cardiac and skeletal muscle status.",
        "**Lymphocyte / fibroblast VLCAD enzyme assay** — adjunct when molecular result is equivocal.",
    ],
    pitfalls=[
        "**Late-onset / mild ACADVL variants** — borderline C14:1 may evade NBS thresholds; carriers can also show borderline biochem.",
        "**MCT-containing formulas / ketogenic diets** — secondary C8/C10 rise; less effect on C14:1 but alters AC interpretation.",
        "**MATERNAL VLCAD** — passive C14:1 in well infant; resolves spontaneously.",
        "**Sample drawn during illness** — non-specific transient long-chain AC elevation.",
        "**Premature infants** — immature LCFAO produces modest C14:1.",
        "**TPN with intralipid infusion** — alters AC profile broadly.",
    ],
    references=[
        "Spiekerkoetter U et al. Treatment recommendations in long-chain fatty acid oxidation defects: consensus from a workshop. J Inherit Metab Dis. 2009;32(4):498–505.",
        "Leslie ND et al. Very long-chain acyl-coenzyme A dehydrogenase deficiency. GeneReviews®. 2009 [updated 2022].",
        "Vockley J et al. Long-chain fatty acid oxidation disorders and current management strategies. Expert Rev Endocrinol Metab. 2019;14(2):109–18.",
        ACMG,
    ],
)

FOLLOW_UPS["LCHAD"] = fu(
    name="Long-chain 3-hydroxyacyl-CoA dehydrogenase / mitochondrial trifunctional protein (LCHAD/TFP) deficiency",
    urgency="urgent",
    urgency_note="Confirm within 1–2 weeks. Hypoketotic hypoglycaemia, cardiomyopathy, peripheral neuropathy, retinopathy — prevention via fasting avoidance + low-LCT/MCT diet, but neuropathy/retinopathy may still develop and require ongoing surveillance.",
    confirmatory=[
        "**Repeat plasma acylcarnitines** — long-chain 3-OH species (C16-OH, C18-OH, C18:1-OH); C16-OH/C18:1-OH ratio differentiates LCHAD from full TFP.",
        "**Urine organic acids during illness** — long-chain 3-hydroxy-dicarboxylic acids.",
        "**HADHA / HADHB molecular analysis** — c.1528G>C (p.E510Q) is the common North-European LCHAD allele; biallelic pathogenic = LCHAD; full TFP loss = TFP deficiency.",
        "**Maternal pregnancy history** — AFLP and HELLP syndrome occur in ~15–25% of LCHAD pregnancies (heterozygous mother + affected fetus).",
        "**Baseline echo + ECG + CK + ophthalmology + neurology + retinal exam**.",
    ],
    pitfalls=[
        "**MTP single-deficiency vs full TFP** — clinical severity differs; HADHA mutations bias toward LCHAD-only phenotype.",
        "**Sample during illness** — non-specific 3-OH-AC elevation.",
        "**Premature infants** — modest 3-OH long-chain AC.",
        "**MCT in formula** — masks LCHAD pattern by bypassing the block.",
        "**Maternal LCHAD heterozygosity** — AFLP/HELLP risk in subsequent pregnancies; counsel maternal heterozygote testing.",
    ],
    references=[
        "Spiekerkoetter U et al. Treatment recommendations in long-chain fatty acid oxidation defects. J Inherit Metab Dis. 2009;32(4):498–505.",
        "Strauss AW et al. Long-chain 3-hydroxyacyl-CoA dehydrogenase deficiency / TFP deficiency. GeneReviews®. 2009 [updated 2021].",
        "Sander J et al. Neonatal screening for medium-chain and long-chain fatty acid oxidation defects. Mol Genet Metab. 2005;85(2):108–14.",
        ACMG,
    ],
)

FOLLOW_UPS["SCAD"] = fu(
    name="Short-chain acyl-CoA dehydrogenase (SCAD) deficiency",
    urgency="routine",
    urgency_note="Routine. Current evidence does not consistently link SCAD with disease; many centres no longer treat asymptomatic NBS-positive SCAD. Confirm and document but counsel reassurance.",
    confirmatory=[
        "**Repeat plasma acylcarnitines** — C4 elevated.",
        "**Urine organic acids** — ethylmalonic acid (EMA) ± methylsuccinic.",
        "**Urine acylglycines** — butyrylglycine.",
        "**ACADS molecular analysis** — c.625G>A (p.G185S) and c.511C>T (p.R171W) are common low-penetrance variants frequently identified by NBS; clinical significance very limited.",
    ],
    pitfalls=[
        "**IBD / ACAD8 deficiency** — also elevates C4; distinguishing UAG marker is isobutyrylglycine (no EMA).",
        "**MADD (GA2)** — multi-chain AC pattern includes C4 — broader profile distinguishes.",
        "**Riboflavin transporter deficiency (SLC52A2/A3)** — multi-chain AC pattern; MADD-like.",
        "**Common ACADS variants are very prevalent in the general population** — biochem may persist with no clinical phenotype; counselling matters.",
        "**ETHE1 (ethylmalonic encephalopathy)** — also high EMA but with chronic acidosis, petechiae, severe neurological phenotype; very different disorder.",
    ],
    references=[
        "van Maldegem BT et al. Clinical, biochemical, and genetic heterogeneity in short-chain acyl-coenzyme A dehydrogenase deficiency. JAMA. 2006;296(8):943–52.",
        "Gallant NM et al. Biochemical, molecular, and clinical characteristics of children with short-chain acyl-CoA dehydrogenase deficiency detected by newborn screening. Mol Genet Metab. 2012;106(1):55–61.",
        "Wolfe L et al. Short-chain acyl-CoA dehydrogenase deficiency. GeneReviews®. 2014 [updated 2019].",
        ACMG,
    ],
)

FOLLOW_UPS["CPT1"] = fu(
    name="Carnitine palmitoyltransferase I (CPT1A) deficiency",
    urgency="urgent",
    urgency_note="Confirm within 1–2 weeks. Hypoketotic hypoglycaemia + Reye-like crises occur during fasting; preventable with strict fasting avoidance.",
    confirmatory=[
        "**Repeat plasma acylcarnitines** — C0 HIGH; long-chain AC LOW (the inverse pattern of CPT2/CACT).",
        "**C0/(C16+C18) ratio** — markedly elevated; the diagnostic ratio for CPT1.",
        "**Urine organic acids during illness** — dicarboxylic aciduria.",
        "**CPT1A molecular analysis** — confirms; the Arctic founder variant p.P479L (c.1436C>T) is very common in Inuit / First-Nations populations with variable clinical risk.",
        "**Glucose + ketones during illness** — confirms hypoketotic hypoglycaemia.",
    ],
    pitfalls=[
        "**Arctic p.P479L variant** — extremely common in Inuit/First-Nations populations; phenotype variable; counselling cautiously and prioritising fasting-avoidance education.",
        "**MATERNAL CPT1** — passive high infant C0; resolves on independent feeding.",
        "**MCT-containing formula** — modest secondary effects on AC profile.",
        "**Lab interpretation note** — CPT1 is one of the few FAO disorders with HIGH C0 (most show low C0); ensure NBS lab applies the correct directionality.",
        "**Premature infants** — immature LCFAO; C0 can be elevated transiently.",
    ],
    references=[
        "Bennett MJ, Santani AB. Carnitine palmitoyltransferase 1A deficiency. GeneReviews®. 2005 [updated 2016].",
        "Greenberg CR et al. The paradox of the carnitine palmitoyltransferase type Ia P479L variant in Canadian Aboriginal populations. Mol Genet Metab. 2009;96(4):201–7.",
        "Bonnefont JP et al. Carnitine palmitoyltransferases 1 and 2: biochemical, molecular and medical aspects. Mol Aspects Med. 2004;25(5–6):495–520.",
        ACMG,
    ],
)

FOLLOW_UPS["CPT2"] = fu(
    name="Carnitine palmitoyltransferase II / Carnitine-acylcarnitine translocase (CPT2 / CACT) deficiency",
    urgency="critical",
    urgency_note="Same-day for neonatal-onset (severe acidosis + cardiomyopathy days 1–3); routine for adult-onset myopathic form. CACT is uniformly severe-neonatal.",
    confirmatory=[
        "**Repeat plasma acylcarnitines** — long-chain AC elevated (C16, C18, C18:1); (C16+C18:1)/C2 ratio; C0 normal/low (opposite of CPT1).",
        "**Urine organic acids during illness** — dicarboxylic aciduria.",
        "**CPT2 / SLC25A20 molecular analysis** — distinguishes CPT2 (myopathic + severe neonatal forms) from CACT (always severe neonatal).",
        "**Echocardiogram + ECG + CK**.",
        "**For adult myopathic CPT2** — exercise/fasting provocation under controlled conditions; biochem can be normal at rest.",
    ],
    pitfalls=[
        "**Late-onset CPT2 myopathic adult form** — biochem may be near-normal at rest; provoked by exercise / fasting / illness / cold.",
        "**VLCAD deficiency** — overlapping long-chain AC pattern; ACADVL vs CPT2 molecular analysis distinguishes.",
        "**MCT-containing formulas** — mask the long-chain pattern.",
        "**Premature infants** — immature LCFAO produces modest long-chain AC.",
        "**Maternal heterozygosity** — passive AC pattern in well infant.",
    ],
    references=[
        "Wieser T. Carnitine palmitoyltransferase II deficiency. GeneReviews®. 2004 [updated 2019].",
        "Bonnefont JP et al. Carnitine palmitoyltransferases 1 and 2: biochemical, molecular and medical aspects. Mol Aspects Med. 2004;25(5–6):495–520.",
        "Iacobazzi V et al. Molecular and functional analysis of SLC25A20 mutations causing carnitine-acylcarnitine translocase deficiency. Hum Mutat. 2004;24(4):312–20.",
        ACMG,
    ],
)

FOLLOW_UPS["PCD"] = fu(
    name="Primary carnitine deficiency (organic cation/carnitine transporter, OCTN2)",
    urgency="urgent",
    urgency_note="Confirm within 1–2 weeks. Sudden cardiac death and skeletal myopathy are the principal risks; lifelong oral carnitine fully prevents.",
    confirmatory=[
        "**Plasma free + total carnitine** — markedly low (typically <10 µmol/L).",
        "**Plasma acylcarnitines** — generally low across the board (the 'empty profile'); C0 minimal.",
        "**Urinary carnitine + fractional excretion** — INAPPROPRIATELY HIGH given low plasma (renal wasting; the diagnostic signature).",
        "**SLC22A5 molecular analysis** — confirms.",
        "**MATERNAL plasma carnitine** — NBS may detect MOTHER, not infant; check mother's free carnitine and screen for cardiomyopathy.",
        "**Echocardiogram baseline** — cardiomyopathy can be silent and is reversible with carnitine.",
    ],
    pitfalls=[
        "**MATERNAL PCD detected by infant NBS** — passively low neonatal C0 reflects maternal disease in ~25–30% of low-C0 NBS positives; identifies an at-risk mother.",
        "**Maternal vegan/vegetarian diet** — secondary mild low C0.",
        "**Sample collected on day 1** — maternal carnitine still circulating; repeat at 1–2 weeks.",
        "**Premature infants** — physiologically low C0.",
        "**Pivampicillin / pivalate antibiotics** — deplete carnitine; secondary low C0.",
        "**Valproate therapy** — secondary low C0.",
        "**Other FAO disorders (mut MMA, PA, MCAD long-term)** — secondary carnitine depletion.",
        "**TPN without carnitine supplementation** — easily-overlooked iatrogenic cause.",
    ],
    references=[
        "Magoulas PL, El-Hattab AW. Systemic primary carnitine deficiency. Orphanet J Rare Dis. 2012;7:68.",
        "El-Hattab AW. Systemic primary carnitine deficiency. GeneReviews®. 2012 [updated 2022].",
        "Schimmenti LA et al. Expanded newborn screening identifies maternal primary carnitine deficiency. Mol Genet Metab. 2007;90(4):441–5.",
        ACMG,
    ],
)

# ── Carbohydrate ──────────────────────────────────────────────────────
FOLLOW_UPS["GALT"] = fu(
    name="Classic galactosaemia (GALT deficiency)",
    urgency="critical",
    urgency_note="Same-day callback. Acute liver failure and E. coli sepsis present in the first week if galactose continues; remove ALL galactose/lactose immediately on suspicion (well before confirmatory results return).",
    confirmatory=[
        "**Erythrocyte GALT enzyme activity** — definitive for classic galactosemia; MUST be performed before any blood transfusion (or molecular substituted).",
        "**Erythrocyte galactose-1-phosphate (Gal-1-P)** — markedly elevated; monitors dietary control thereafter.",
        "**GALT molecular analysis** — c.563A>G (p.Q188R) most common classic; Duarte variant (p.N314D) milder. Essential when transfusion makes enzyme assay unreliable.",
        "**Plasma galactose, urine reducing substances, Beutler test (DBS)** — supportive markers.",
        "**Liver function, coagulation, sepsis workup** — if any clinical concern; E. coli sepsis is the classical lethal complication.",
        "**Ophthalmology** — cataracts can develop within weeks of continued galactose exposure.",
    ],
    pitfalls=[
        "**Recent blood transfusion (within 90 days)** — donor RBC GALT activity gives false-NORMAL result; cannot rule out classic galactosemia by enzyme assay until 90 days post-transfusion. Use molecular instead.",
        "**Duarte variant (D/G compound heterozygote)** — partial deficiency (~25% activity); usually clinically benign and most centres no longer impose lifelong restriction.",
        "**Heterozygote GALT carriers** — ~50% activity; clinically silent.",
        "**Galactokinase (GALK1) deficiency** — galactose elevated but Gal-1-P NORMAL; isolated cataracts only.",
        "**Galactose epimerase (GALE) deficiency, generalised form** — elevated Gal-1-P but normal GALT activity.",
        "**Liver disease of any cause** — can secondarily impair GALT activity on assay.",
        "**Heat-degraded DBS** — falsely-low activity on Beutler test; repeat with fresh sample.",
    ],
    references=[
        "Berry GT. Classic galactosemia and clinical variant galactosemia. GeneReviews®. 2000 [updated 2021].",
        "Welling L et al. International clinical guideline for the management of classical galactosemia: diagnosis, treatment, and follow-up. J Inherit Metab Dis. 2017;40(2):171–6.",
        "Bosch AM. Classical galactosaemia revisited. J Inherit Metab Dis. 2006;29(4):516–25.",
        ACMG,
    ],
)


# ── Driver ─────────────────────────────────────────────────────────────

FOLLOWUP_BLOCK_RE = re.compile(r"   followUp:\{[\s\S]*?\n   \},\n", re.MULTILINE)


def main():
    text = APP.read_text(encoding="utf-8")
    inserted = []
    replaced = []
    skipped = []
    for did, d in FOLLOW_UPS.items():
        # Disorder declarations carry a `category:` field; analyte/ratio
        # definitions sharing the same id (e.g. "MMA", "ASA") do not. Anchor
        # on `category:` to disambiguate.
        m = re.search(
            r'^\s+\{id:"' + re.escape(did) + r'",[^\n]*?category:',
            text,
            re.MULTILINE,
        )
        if not m:
            print(f"!! disorder declaration not found: {did}", file=sys.stderr)
            continue
        start = m.end()
        notes_match = re.search(r'\n   notes:"', text[start:])
        if not notes_match:
            print(f"!! notes: line not found for {did}", file=sys.stderr)
            continue
        notes_pos = start + notes_match.start() + 1  # +1 to land on `   notes:`

        block_excerpt = text[start:notes_pos]
        block = render_jsx(d)

        existing = FOLLOWUP_BLOCK_RE.search(block_excerpt)
        if existing:
            # Replace existing followUp block
            absolute_start = start + existing.start()
            absolute_end = start + existing.end()
            text = text[:absolute_start] + block + text[absolute_end:]
            replaced.append(did)
        else:
            text = text[:notes_pos] + block + text[notes_pos:]
            inserted.append(did)

    APP.write_text(text, encoding="utf-8")
    print(f"inserted: {inserted}")
    print(f"replaced: {replaced}")
    print(f"skipped: {skipped}")

    # Emit docs/act_sheets/<id>.md for each disorder
    ACT_DIR.mkdir(parents=True, exist_ok=True)
    written = []
    for did, d in FOLLOW_UPS.items():
        path = ACT_DIR / f"{did}.md"
        path.write_text(render_md(did, d), encoding="utf-8")
        written.append(str(path))

    # Emit an index file
    index = ["# ACT sheets — index", ""]
    index.append("ACT-style follow-up sheets for RUSP-aligned disorders. Mirrors the `followUp` field rendered inline in the disorder cards in src/App.jsx.")
    index.append("")
    index.append("| ID | Disorder | Urgency |")
    index.append("|----|----------|---------|")
    for did, d in sorted(FOLLOW_UPS.items()):
        index.append(f"| [{did}]({did}.md) | {d['name']} | {d['urgency'].upper()} |")
    index.append("")
    (ACT_DIR / "README.md").write_text("\n".join(index), encoding="utf-8")

    print(f"wrote {len(written)} markdown files in {ACT_DIR}")


if __name__ == "__main__":
    main()
