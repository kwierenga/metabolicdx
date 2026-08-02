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

### 9. SUCLA2 — a glycogen storage disease III paper

PMID 21857385 is *Successful treatment of severe cardiomyopathy in glycogen
storage disease type III with D,L-3-hydroxybutyrate*. It may have been cited for
the ketone-body therapy principle rather than the disorder, which would be
defensible — but that intent is not visible to a reader.

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
