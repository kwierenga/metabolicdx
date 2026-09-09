# Scope: a claim-support checker

**Status:** proposed, not built. Numbers below are measured against the knowledge
base as of 2026-08-17, not estimated.

## The question it answers

Three layers, only two instrumented:

| Layer | Question | Tool | State |
|---|---|---|---|
| 1 | Is this a real paper? | `scripts/check-citations.mjs` | 891 verified, 3 withheld, 1 check |
| 2 | Is it about the right disorder? | `scripts/check-relevance.mjs` | 38 flagged, 125 weak |
| 3 | **Does it support *this claim*?** | — | manual, `citation-claims-review.md` |

Layer 3 is where every entry in `citation-claims-review.md` lives, and every one
of them was found by reading. The ALDH6A1 wrong-enzyme citation, the MLYCD ratio
threshold resting on a cloning paper, BKT's incidence range with no source — none
of them are visible to layers 1 or 2, because each is a real paper, correctly
about the right disorder, attached to a claim it does not carry.

## What the data actually looks like

Before designing anything, the prose was measured. Six findings, and two of them
overturn the obvious design.

| Measure | Count |
|---|---|
| Disorders with narrative references | 115 |
| Narrative prose blocks | 805 |
| Substantive sentences (≥25 chars) | 2,950 |
| Sentences carrying a `[n]` marker | 1,254 |
| Sentence→reference pairs | 2,119 |
| …of which point at a reference with a PMID | **1,886** |
| Unique papers those pairs span | **838** (2.25 claims each) |
| Markers pointing past the end of the list | **0** |

**Citation is paragraph-level, not sentence-level.** Of the 1,696 sentences with
no marker, 1,676 sit inside a paragraph that *is* cited elsewhere; only **20** sit
in a block with no marker anywhere. A sentence-by-sentence judge would therefore
report roughly 1,676 false "unsourced" findings. The unit of judgement has to be
the paragraph's reference set, not the individual sentence.

**No marker is out of range.** The numbering drift visible in BKT — prose crediting
Oglesbee where reference [9] is Hall 2020 — is not an indexing bug. It is a content
mismatch, which is exactly the class only layer 3 can see.

**The marker grammar is trivial.** Only four shapes occur: `[N]` (530), `[N,N]`
(664), `[N,N,N]` (83), `[N,N,N,N]` (3). No ranges, no letters, no nesting. The
parser is a one-line regex, not a project.

## Design

**Unit of judgement:** one `(claim, reference)` verdict, where a claim is a
sentence plus its surrounding paragraph, and the reference is one of the papers
that paragraph cites.

**Batch by reference, not by claim.** The abstract is the expensive payload and
2.25 claims cite each paper on average. One call per paper carries the abstract
once and returns a verdict per claim — 838 calls instead of 1,886, and the judge
sees related claims together.

**Aggregate by claim, escalate only on unanimity.** A claim citing `[1,4]` is
flagged only when *both* papers come back unsupported. This is the rule that keeps
the report readable, and it is what the register's real findings already look like:
MLYCD[4] is a finding precisely because "neither cited paper establishes it."

**Four verdicts, not two.** `supports` / `partial` / `unsupported` /
`not-assessable`. The fourth is load-bearing: an abstract is not the paper, and a
claim the abstract simply does not address is a different thing from a claim it
contradicts. Collapsing those two produces a report nobody finishes reading.

Verdict shape, one per claim, via structured outputs so it parses without regex:

```json
{ "claim_id": "BKT.introduction.2",
  "verdict": "unsupported",
  "reason": "Abstract reports mutation spectrum; gives no incidence figure.",
  "quote": null }
```

**Numbers first.** All four statements currently in the register's newest section
are numeric or attributional — an incidence range, 77.5%, "phase 3 trial", "first
described in 1968". A specific number is checkable against an abstract far more
reliably than a qualitative claim. Run the numeric subset first: small, high
precision, and it is where the known defects are.

## Phase 1 — deterministic, no model involved

Worth building first and shipping alone, because it needs no judgement and no
budget:

- Parse the markers, join prose to references, emit the claim table.
- Report the **20** sentences in blocks with no citation anywhere.
- Report any claim whose entire reference set is withheld or unverified.
- Report markers out of range (currently zero — this becomes a regression guard).

All of this is deterministic, so it can carry a test ratchet like the existing
counts. The claim table is also the input phase 2 needs, so none of it is throwaway.

## Phase 2 — the judge

Model **`claude-opus-5`**, adaptive thinking, `effort: "high"`, structured
outputs, run through the **Batches API** for the 50% discount. Abstracts come
from `scripts/.abstract-cache.json`, which `check-relevance.mjs` already
populates — no new PubMed traffic for the 838 papers already cached.

Two mechanical notes that are easy to get wrong:

- Batch results return **in any order**; key them by `custom_id`, never by
  position.
- Prompt caching on the shared system prompt is unreliable inside a batch —
  parallel requests cannot read an entry the first one is still writing. The
  50% batch discount is the dependable saving; treat cache hits as a bonus.

**Second pass.** Only claims flagged `unsupported` by every cited reference go to
a refute pass, which is given the same evidence and asked to argue the claim *is*
supported. Findings that survive both go in the report. On a flag rate of ~10%
that is ~84 extra calls.

## Cost

Per full pass over all 838 papers / 1,886 claims:

| | Full price | Batched (−50%) |
|---|---|---|
| Input (~960 tok/call) | $4 | $2 |
| Output incl. thinking (~800 tok/call) | $17 | $8 |
| Refute pass (~10% flagged) | $2 | $1 |
| **Total** | **~$23** | **~$11** |

Output tokens dominate, and most of those are thinking — so `effort` is the cost
dial, not the model choice. Dropping to `medium` roughly halves it.

**Cost is not the constraint on this project.** A full pass is one restaurant
meal. The real budget is the clinician-hours spent reading whatever it flags,
which is why the design above spends its effort on precision rather than recall.

## Validation — the eval set already exists

`docs/citation-claims-review.md` is a labelled calibration set, written by hand
before any of this was contemplated:

- **Should flag:** MLYCD[4] (ratio threshold on a cloning paper), HIBCH[9]
  (therapy claim on a gene-identification paper), SLC6A8[5] (right analytes,
  wrong population), MLYCD[2] (four general claims on one case report), MCC[3]
  (an MCAD paper under 3-MCC), HPRT (an APRT paper).
- **Should not flag:** SULFOX[10] (a MoCo trial cited deliberately as a
  contrast), MCC[4] (a biotinidase review, because the sentence is about
  biotinidase), and the historical first descriptions — Menkes 1954, Carson &
  Neill, Baron 1956 — which predate their modern disease names.

That second list is the harder test and the reason to build this carefully. A
judge that flags SULFOX[10] is worse than no judge, because it trains the reader
to skim. Calibrate against both lists before running the full 838.

## What it cannot do

State these in the report header, not in a footnote:

- **Abstract only.** An `unsupported` verdict means the abstract does not carry
  the claim — not that the paper doesn't. Full text would resolve many of these
  and is out of scope.
- **Narrative only.** `followUp.references` carry no `[n]` markers in the
  confirmatory and pitfalls lists, so those references cannot be tied to a claim.
  That is ~1 in 6 of the knowledge base's references, untouched.
- **Six papers have no abstract** in PubMed and are not assessable at all.
- Unlike `check-relevance.mjs`, references shared by three or more disorders must
  **not** be skipped here. A guideline legitimately never mentions a specific
  disorder, which is why the relevance screen ignores it — but a guideline can
  perfectly well support or fail to support a specific claim.

## What not to build

**No test ratchet on judge output.** Every other count in this repo ratchets
because it is deterministic; an LLM verdict is not, and a ratchet over it would
either fail spuriously or get loosened until it means nothing. The judge's output
is advisory. Confirmed findings get promoted by hand into
`citation-claims-review.md`, the same way the existing entries got there — which
also keeps the standing rule intact: a citation is never presented as sound
because a machine said so.

## Build order

1. Parser + claim table + the deterministic reports, with unit tests against the
   four marker shapes. Ratchet the deterministic counts.
2. Judge harness against the ~20 labelled cases from the register only. Iterate
   the prompt until it catches the six known defects and clears the known-sound
   ones. **Do not proceed until it clears SULFOX[10] and the historical
   first descriptions.**
3. Numeric-claim subset over the full corpus. Triage, promote confirmed findings.
4. Full corpus, if step 3 earns it.

Steps 1 and 2 are the work. Step 1 is mostly mechanical and well-specified by the
measurements above; step 2 is prompt iteration against a fixed eval set, which is
bounded but not quick. Steps 3 and 4 are a script run and a reading session.
