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
