# Drop full-text papers here

Put a paper in this folder and the claim judge can read its body instead of only
its abstract.

## Naming

The filename must be the **PMID**, nothing else:

```
docs/fulltext/30982989.pdf     ✅
docs/fulltext/30982989.txt     ✅
docs/fulltext/haberle-2019.pdf ❌  ignored — the PMID is how it is matched
```

`.pdf` and `.txt` are both accepted. PDFs are converted with `pdftotext`.

## Then run

```
node scripts/fetch-fulltext.mjs --ingest
```

It reports each file it takes in, and skips anything it cannot read (a
scanned-image PDF with no text layer yields almost no characters, so it is
rejected rather than silently judged on nothing).

Once ingested, a hand-supplied paper is indistinguishable to the judge from one
fetched automatically from PMC.

## Which papers are worth getting

`docs/fulltext-wanted.md` — ranked by how many claims currently rest on each
paper that no abstract could confirm. Regenerate it with:

```
node scripts/fetch-fulltext.mjs --wanted
```

PMC open access already covers 139 of the 876 cited papers, and those need
nothing from you. The list is only the closed-access remainder.

## Why the PDFs are not committed

Everything in this folder except this README is gitignored. Publisher PDFs are
licensed to the subscriber, not redistributable, and the repository is public.
The extracted text lives in `scripts/.fulltext-cache.json`, which is ignored for
the same reason.
