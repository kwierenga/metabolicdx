# Drop full-text papers here

Put a paper in this folder and the claim judge can read its body instead of only
its abstract.

## Naming

Name it however the journal site did. The PMID is best if you have it, but a
file that arrives as author and year is named from its own first page:

```
docs/fulltext/30982989.pdf          ✅  the PMID, plain
docs/fulltext/30982989 Haberle.pdf  ✅  the PMID, with anything after it
docs/fulltext/Wolf 2012.pdf         ✅  named from the title and author line
docs/fulltext/paper (3).pdf         ⚠️  will be read, but probably not named
```

A file with no PMID is matched three ways, and where two of them speak they
have to agree: the title printed on page one, a key-word score against page one,
and the author and year in the filename checked against the author line of the
paper. A file it cannot name confidently is reported, not guessed at — rename it
with the PMID in front and run again.

`.pdf` and `.txt` are both accepted. PDFs are converted with `pdftotext`.

## Scanned papers

An old article is often a photograph of a page — it opens and prints, but there
is no text in it to read. `--ingest` spots this (a few hundred characters where
there should be tens of thousands) and OCRs the file itself, using the PDF
renderer and OCR engine built into Windows. Nothing to install. It costs about
five seconds a page, and the result is good enough for 1960s journal type:
Perry 1968 went from 593 characters to 16,830.

To look at the text before letting it in:

```
powershell -File scripts/ocr-pdf.ps1 -Path "docs/fulltext/Perry 1968.pdf"
```

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
