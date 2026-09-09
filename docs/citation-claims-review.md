# Claims whose citations are real but do not support them

**Status:** needs clinical review. Nothing here is a broken link or a fabricated
reference — every citation below resolves against PubMed and renders as
verified. That is exactly the problem.

## Why this list exists

The citation pipeline (`scripts/check-citations.mjs`) answers one question: *does
this citation describe a real paper?* It cannot answer the one that matters
clinically: *is that paper about the right thing, and does it support the
sentence pointing at it?*

Repairing a garbled citation can make this worse rather than better. Before
repair, a fabricated reference at least looked suspect. After repair it is a real
paper with a working PubMed link — and if the claim attached to it was never
supported, the repair has laundered an unsourced statement into a sourced-looking
one.

The clearest example was ALDH6A1, which cited a genuine paper on *succinic*
semialdehyde dehydrogenase in support of five claims about *methylmalonate*
semialdehyde dehydrogenase — a different enzyme, different gene, different
disorder. Real authors, real journal, exact title match, live PMID. Nothing in
this repository could see it; it was found by reading.

Regenerate the evidence for any entry with:

    node scripts/show-citations.mjs --claims HIBCH

## Entries

### 1. MLYCD[4] — a diagnostic discriminator with no supporting source

> **biochemistry:** The malonic:methylmalonic ratio is typically >1 (distinguishes
> from MMUT mutase deficiency, where ratio <1) [1,4]

`[4]` is Gao J et al, *Cloning and mutational analysis of human malonyl-coenzyme
A decarboxylase*, J Lipid Res 1999 (PMID 9869665) — a cloning study, which cannot
establish a diagnostic ratio threshold. `[1]` is FitzPatrick's molecular-basis
paper.

**Most consequential entry in this list.** This is a stated discriminator between
two disorders, and neither cited paper establishes it. Either a source that
reports the ratio should be found, or the parenthetical cut-off removed.

### 2. HIBCH[9] — therapeutic efficacy resting on a gene-identification paper

> **treatment:** VALINE RESTRICTION — low-protein or specifically valine-restricted
> diet … may produce clinical stabilisation and sometimes improvement,
> particularly if initiated early [2,9]
>
> **prognosis:** Cerebral damage is largely irreversible — early dietary treatment
> before established injury is key [2,9]

`[9]` is Soler-Alfonso C et al, *Identification of HIBCH gene mutations causing
autosomal recessive Leigh syndrome*, Pediatr Neurol 2015 (PMID 25591832). It
identifies mutations; it reports no therapy trial and no dietary outcome.

The corpus originally cited this as "L-valine therapy in HIBCH deficiency: novel
treatment approach" — a paper that does not exist. The repair made the citation
real without making the treatment claim supported.

### 3. SLC6A8[5] — right analytes, wrong disease population

> **biochemistry:** Elevated URINE creatine:creatinine ratio is the diagnostic
> biochemical finding … can be used as a screening test [1,5]

`[5]` is Arias A et al, *Guanidinoacetate and creatine/creatinine levels in
controls and patients with urea cycle defects*, Mol Genet Metab 2004
(PMID 15234335). It measures the right analytes in the wrong patients — urea
cycle defects, not creatine transporter deficiency. Reference ranges and
screening performance do not transfer between those populations.

### 4. TCN2[4] — a 1983 genetics review carrying a modern diagnostic algorithm

> **introduction:** Diagnosis requires measurement of HOLOTRANSCOBALAMIN (holo-TC,
> 'active B12'), direct TCN2 protein quantitation, or biochemical demonstration
> of MMA + HCY elevation [4,5]

`[4]` is Fràter-Schröder M, *Genetic patterns of transcobalamin II and the
relationships with congenital defects*, Mol Cell Biochem 1983 (PMID 6355816),
which predates routine holo-TC assays. This substitution was flagged as uncertain
when made: it is a *related* paper by the cited author, not a corrected version
of the paper the corpus named. `[1]` (Huemer 2017 guidelines) plausibly carries
the claim on its own.

### 5. MLYCD[2] — four general claims on a single case report

> **summary:** Clinical phenotype: developmental delay, cardiomyopathy,
> hypoglycaemia, and a distinctive urinary excretion … [1,2]
>
> **presentation:** Some patients have more subtle presentation picked up through
> expanded NBS [1,2,7]
>
> **treatment:** Trimetazidine … has theoretical relevance; limited use in this
> disease [1,2]
>
> **prognosis:** Cardiomyopathy is the main determinant of morbidity and
> mortality [1,2]

`[2]` is de Wit MC et al, *Brain abnormalities in a case of malonyl-CoA
decarboxylase deficiency*, Mol Genet Metab 2006 (PMID 16275149) — a single case
report on neuroimaging. It cannot support a prognosis claim about the main
determinant of mortality, nor a statement about NBS-detected mild cases.

### 6. CAVA molecular — a claim left resting on one source by deletion

> **molecular:** … founder variants have been identified in consanguineous
> populations [1]

Both original sources for this sentence (Gougeard, Al-Hassnan) were fabricated
and deleted, leaving it on van Karnebeek 2014 alone. Worth confirming that the
discovery paper actually reports founder variants in consanguineous populations,
rather than that detail having come from the deleted references.

## Found by the relevance screen (2026-07-31)

`scripts/check-relevance.mjs` fetches each verified citation's abstract and asks
whether the paper mentions anything specific to the disorder — gene, enzyme,
disorder name, signature analytes. Of 700 disorder-specific verified citations:
**43 mention nothing specific, 96 mention exactly one term.**

It is a screen, not a verdict, and it has honest false positives: historical
first descriptions (Menkes 1954 for MSUD, Carson & Neill for homocystinuria) do
not use the modern disease name, eponymous syndromes (HIDS for mevalonate
kinase deficiency, Brown-Vialetto-Van Laere for riboflavin transporter) do not
share vocabulary with the gene, and a claim can legitimately be *about* another
disorder — MCC's biotinidase reference is correct precisely because the sentence
concerns biotinidase deficiency.

Confirmed defects so far:

### 7. MCC[3] — an MCAD paper supporting a 3-MCC incidence figure

> **introduction:** 3-MCC deficiency … has an NBS incidence of ~1:36,000 in the
> USA — making it one of the most commonly detected organic acid disorders [1,3]

`[3]` is Wilcken B et al, *Outcome of neonatal screening for medium-chain
acyl-CoA dehydrogenase deficiency in Australia*, Lancet 2007 (PMID 17208640) —
a different disorder, a different country, and an outcome study rather than an
incidence figure for 3-MCC.

### 8. HPRT — an APRT paper under Lesch-Nyhan

PMID 8643571 is *Adenine phosphoribosyltransferase-deficient mice develop
2,8-dihydroxyadenine nephrolithiasis*. APRT deficiency is a different purine
disorder from HPRT deficiency. Same shape as the ALDH6A1 error.

### 7a. MCC[3] — resolved 2026-08-02

Replaced with Koeberl DD et al, *Evaluation of 3-methylcrotonyl-CoA carboxylase
deficiency detected by tandem mass spectrometry newborn screening*, JIMD 2003
(PMID 12872837) — a genuine 3-MCC newborn-screening evaluation.

**Still needs checking:** the sentence gives the incidence as "~1:36,000 in the
USA". No source stating that figure was found. Koeberl supports the existence of
an NBS-detected cohort, not that specific rate. Either confirm the number against
a source or drop the precision.

### 8a. HPRT — resolved 2026-08-02, and a second problem underneath

The APRT mouse paper is deleted. But the claim it supported —

> **treatment:** Gene therapy is in preclinical development [9,10]

was cited to `[9]` as well, which is Pozzo's *Deep brain stimulation in
Lesch-Nyhan syndrome*. Neither citation concerned gene therapy. The markers have
been removed, so the sentence now stands unsourced, which is at least honest.
**It needs either a real preclinical gene-therapy source or deletion** — searching
found nothing convincing for Lesch-Nyhan specifically.

### 9. SUCLA2 — a glycogen storage disease III paper

PMID 21857385 is *Successful treatment of severe cardiomyopathy in glycogen
storage disease type III with D,L-3-hydroxybutyrate*. It may have been cited for
the ketone-body therapy principle rather than the disorder, which would be
defensible — but that intent is not visible to a reader.

### 10. HYDROXYPROLINEMIA[3] — a different disorder, and no replacement found

> **introduction:** Hydroxyprolinaemia (OMIM #237000) was first described in the
> 1960s [3]

`[3]` is Efron ML, *Familial hyperprolinaemia: report of a second case…*, N Engl J
Med 1965 (PMID 14290545). **Hyper**prolinaemia (PRODH) and **hydroxy**prolinaemia
(PRODH2) are different disorders. Efron did describe hydroxyprolinaemia in the
same period, but that paper does not surface in PubMed searches and the only
indexed hydroxyprolinaemia papers are a 1989 Indian J Pediatr note and a 1998
Japanese review — neither a 1960s first description.

Left in place because replacing it with a paper that does not support "first
described in the 1960s" would trade one mis-citation for another. Either the
Efron hydroxyprolinaemia paper needs finding by hand, or the sentence should
drop the attribution.

### Checked and found sound (relevance screen)

- **SULFOX[10]** cites a cyclic pyranopterin monophosphate trial in *molybdenum
  cofactor deficiency* — flagged because it never mentions sulfite oxidase. It is
  correct: the sentence explicitly contrasts SUOX with MoCo type A, which does
  have a specific treatment, as the reason to distinguish them.
- **MCC[4]** cites a biotinidase deficiency review, because the claim is that
  biotin-responsive 3-MCC usually indicates biotinidase or holocarboxylase
  synthetase deficiency.
- Historical first descriptions predate their modern disease names — Menkes 1954
  for MSUD, Carson & Neill for homocystinuria, Baron 1956 for Hartnup — and
  eponymous syndromes share no vocabulary with their gene (HIDS for mevalonate
  kinase deficiency, Brown-Vialetto-Van Laere for the riboflavin transporter).

## The "check details" tranche (2026-08-16)

Thirty-four citations sat at `check` — a real paper existed, but a bibliographic
detail did not match PubMed. Thirty-three were repaired. Twenty-five of those were
the *same* paper with mangled bibliography (Shih 1969 *Pediatrics* was really 1972
*J Pediatr*; Koike's PNAS paper is 1992, not 1990), so no claim changed hands and
they need no review.

The eight below swapped in a *different* paper, chosen because it carries the
claim rather than because it matches the string. Same judgement call as the UMPS
and TCN2 entries above, and someone should agree with them:

| Reference | String named | Now cites |
|---|---|---|
| BKT[1] | an Orphanet entry, not PubMed-indexed | Fukao 2001, 26-patient outcome series (PMID 11161836) |
| BKT[5] | Fukao, *Eur J Pediatr* 2010 | Abdelkreem 2019 ACAT1 mutation update (PMID 31268215) |
| BKT followUp[3] | Abdelkreem, "26 new cases" | Abdelkreem 2017, ten Indian patients (PMID 27928777) |
| PCD[12] | "Heterozygosity for OCTN2 deficiency" | Amat di San Filippo 2008, cardiomyopathy and carnitine deficiency (PMID 18337137) |
| VLCAD[15], CPT2[8] | *Genet Med* 2021 "phase 3 trial" | Vockley 2021 open-label extension (PMID 32885845) |
| PCDEF[4] | Saudubray, "Variation in the clinical presentation" | Robinson/Saudubray 1987, French vs North American phenotypes (PMID 3101494) |
| GSD1A[11] | Lee, *Hum Gene Ther* 2022 | Weinstein 2025, DTX401 trial (PMID 40064185) |

There is no triheptanoin paper in *Genet Med* at all — the journal returns
nothing for the term — so the VLCAD and CPT2 strings were inventions rather than
garbled renderings. PCDEF[4] is a partial fit: Robinson establishes the French and
North American phenotypes, which is the A/B distinction, but not type C.

### 11. BKT[4] — an incidence range with no source anywhere

> **introduction:** Incidence is ~1:111,000–1:232,000 [4]

Searched several ways; nothing in PubMed carries those numbers. The slot now holds
Fukao 1995, *Molecular basis of beta-ketothiolase deficiency* (PMID 7749408) — the
paper the string actually named, and a mutations study that cannot establish an
incidence. **Either find the figure's source or drop the range.**

### 12. BKT[9] — prose names one author, the reference is another

> **biochemistry:** Oglesbee 2017 proficiency data show BKT real-world AC
> sensitivity ~77.5% … [9]

`[9]` is Hall PL et al, *Post-analytical tools for the triage of newborn screening
results* (PMID 33073017). The same 77.5% figure drives `analyticalCeiling: 0.78`
and the disorder's `nonspecific` flag, so this is load-bearing. Either the
Oglesbee source is added or the attribution comes out of the prose.

### 13. GA2[12] — a trial that does not exist for this disorder

> **treatment:** Severe neonatal: supportive care; triheptanoin in trial [12]

The only citation left at `check`. Triheptanoin was trialled in long-chain FAO
disorders — CPT1, CPT2, CACT, VLCAD, LCHAD/TFP — and PubMed returns no
triheptanoin study in MADD. Deliberately **not** repaired: pointing it at an
LC-FAOD trial would attach the wrong population to a MADD claim, which is the
laundering this document exists to prevent. Same reasoning as GA2[7], which stays
withheld.

### 14. PCDEF[3] — a PEPCK paper as the first description of PC deficiency

> **introduction:** PC deficiency (OMIM #266150) was first described by Hommes in
> 1968 [3]

`[3]` is Hommes FA et al, *Two cases of phosphoenolpyruvate carboxykinase
deficiency*, Acta Paediatr Scand (PMID 176867). Two problems: it is **PEPCK**, a
different enzyme from pyruvate carboxylase, and PubMed dates it to **1976**, not
the 1968 the sentence gives. The repair corrected the year on the citation and
left the prose alone, so the sentence and its source now disagree in print.

### Relevance screen re-run (2026-08-16)

Of **926** disorder-specific verified citations: **38** mention nothing specific
to the disorder, **125** mention exactly one term, 6 have no abstract. The counts
moved because the verified population grew from 700, not because the screen
changed. Nothing in this tranche's repairs entered the flagged set except MCD[7]
(Wolf, biotinidase newborn screening), which joins three other Wolf biotinidase
papers already flagged under MCD for the same reason and is sound for the same
reason MCC[4] is.

## The claim-support screen (2026-08-19)

`scripts/judge-claims.mjs` now asks the third question — does the cited paper
support *this sentence*? — over the whole corpus. It reads abstracts, never full
texts, so its output is a worklist, not a set of verdicts.

Calibration against the labelled cases above: **9 of 10 judgeable cases correct,
with zero false positives** — SULFOX[10], MCC[4] and SLC6A8[10] all cleared. Three
labelled cases could not be judged at all because PubMed holds no abstract for
them (Menkes 1954, Carson & Neill 1962, Efron 1965), which also means entry 10
(HYDROXYPROLINEMIA[3]) is permanently invisible to this tool.

The one disagreement is worth resolving by hand: for **HIBCH[9]** the judge read
Soler-Alfonso's abstract as reporting a patient who improved on a valine-restricted
diet, which contradicts entry 2 above. One of the two is wrong.

Full corpus: 1,806 verdicts over 868 papers. 252 claims have at least one source
that affirms them; **152 have none and at least one explicit rejection**; 749 have
no affirming source but only partial or not-assessable verdicts. The 749 are mostly
the method's own limit — a review cited for a specific number its abstract does not
repeat — and should not be read as defects. Full output in
`scripts/claim-support-report.json`.

### Repaired from this screen

Each of these had a reference that was real, correctly filed, and did not carry the
claim. In every case the cited paper was load-bearing for *other* claims, so the fix
was to add the right paper and retarget only the failing marker — never to replace a
reference other sentences depend on.

- **AADC[12]** — the 2022 EMA-approval sentence cited Pearson's investigational
  MR-guided midbrain AAV2 trial. Now Keam, *Eladocagene exuparvovec: first approval*
  (PMID 36103022).
- **CANAVAN[13]** — the "aspartoacylase activity <5% of normal" figure cited
  GeneReviews, which gives the diagnostic approach without the activity data. Now
  Matalon 1988 (PMID 3354621).
- **CPT1[9]** — "increased SIDS risk" cited Collins's *prevalence* survey, whose
  abstract explicitly concludes the mortality question is unanswered. Now Sinclair
  2012, *Carnitine palmitoyltransferase I and sudden unexpected infant death in
  British Columbia First Nations* (PMID 23090344). The claim was supportable; the
  citation was simply the wrong Arctic-variant paper.
- **SCHAD[5]** — protein/leucine-loading as a diagnostic clue cited two papers that
  give the biochemical markers but not the provocation. Now Babiker 2015
  (PMID 25915078).

### Claims with no source in the literature at all

Searched and not found. These are prose problems, not citation problems, and each
needs either a source or the removal of the specific assertion:

- **PSPH summary** — "PSPH deficiency accounts for ~25% of all serine-biosynthesis-
  disorder cases, second most common after PHGDH." Both cited reviews give no
  relative-frequency data, and no paper reporting that split could be found.
- **MLYCD molecular** — "Some founder variants identified." Both cited papers report
  private or novel mutations; no founder variant is described for MLYCD anywhere.
- **HIBCH molecular** — "A founder variant c.488G>A (p.Ala163Val) has been reported
  in several populations." Neither cited paper mentions it and no other paper does.

### Needs a clinician's eye

- **CPT1[4] and CPT1[8] are the same paper.** Both carry PMID 20696606; [8] matches
  the real record (*Mol Genet Metab* 2010;101(2–3):200–4) and [4]'s journal, volume
  and pages are invented. [4] is cited by three further claims, so correcting it is
  not a deletion — deleting it would renumber every later marker.
- **PDHD presentation** — "Some adult males have isolated intermittent cerebellar
  ataxia; heterozygous females often mild" is two claims in one sentence. Debray 2008
  (PMID 18504677) carries the ataxia limb cleanly; nothing found carries the
  female-heterozygote limb, and the cited natural-history review reports no
  gender-related differences.

## One PMID stamped on two different papers

The mechanism by which a fabricated citation survives stage-1 verification: it
resolves to a real paper that is *already correctly cited elsewhere*, so the
identifier is valid and the titles overlap enough to pass.

The clearest case is **PMID 12777559**. GA1 cites it correctly as Schulze's
German 250,000-neonate cohort. HARTNUP cites the same PMID as *"Wilcken B et al.
Incidence of inborn errors of metabolism by expanded newborn screening in a
Californian cohort"* — wrong author, wrong country, wrong title. One of the two
is fabricated.

`citations.test.js` now detects this class by comparing parsed author and title
across every reference sharing a PMID, ignoring cosmetic differences. Ten
conflicts exist today and are ratcheted; each needs its source checked by hand:

    PMID 12777559  GA1.narrative[5]      vs HARTNUP.narrative[6]   ← confirmed
    PMID 15896654  LCHAD.narrative[4]    vs LCHAD.followUp[2]
    PMID 10677294  MAT1A.narrative[0]    vs MAT1A.narrative[5]
    PMID 26684475  GAMT.narrative[0]     vs GAMT.narrative[8]
    PMID 22424739  SCAD.narrative[2]     vs SCAD.followUp[1]
    PMID 18178665  MSUD.narrative[6]     vs MSUD.followUp[2]
    PMID 17208640  MCC.narrative[2]      vs MCAD.narrative[0]      ← see entry 7
    PMID 33325055  ARG1.narrative[7]     vs ARG1.followUp[2]
    PMID 19217814  CPT1.narrative[4]     vs CPT1.followUp[1]
    PMID 15896654  LCHAD.narrative[4]    vs LCHAD.followUp[2]

Several are likely benign — an abbreviated title in one place and the full title
in the other — but each needs looking at, because the benign and the fabricated
cases are indistinguishable from the string alone.

## Two attributions changed during repair

Not defects, but judgement calls made while renumbering, and someone should agree
with them:

- **UMPS molecular/treatment** — deleting fabricated references left "<20
  pathogenic variants reported" pointing at a drug note and the uridine-triacetate
  sentence pointing at a 1969 paper predating the drug by 46 years. Both were
  repointed to sources that carry the claim.
- **TCN2 molecular** — "Multiple pathogenic variants; loss-of-function
  predominant" lost its only source when the fabricated Kaikov reference was
  deleted; it now points at Li N's genomic-structure paper and the Trakadis
  update.

## Checked and found sound

- **SLC6A8[10]** (Kurosawa, cyclocreatine in mice) supports "Cyclocreatine and
  gene therapy in development" correctly. An earlier review flagged this as a
  mismatch on the strength of the *fabricated* title ("Gene therapy for X-linked
  creatine transporter deficiency"); the repaired citation fits the claim.
- **ALDH6A1 narrative** — audited in full after the wrong-enzyme citation was
  found. The prose is correct throughout for MMSDH; only the references had been
  confabulated.
