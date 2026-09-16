// Fetch open-access full text for cited papers, so the claim judge can read the
// body and not only the abstract.
//
// Why this exists. judge-claims.mjs sees the abstract and nothing else, and its
// own report says so: 749 claims came back with no affirming source but only
// partial or not-assessable verdicts, which is mostly the method's limit rather
// than a defect list. A review cited for a specific number whose abstract does
// not repeat that number is unjudgeable from the abstract and perfectly
// judgeable from the paper.
//
// The LCHAD repair on 2026-09-09 is the worked example. The site quoted a 64.5%
// analytic sensitivity to "Oglesbee 2017". That figure appears nowhere in the
// abstract; the body says "The lowest analytic sensitivity (64.5%) was seen for
// the 2009A challenge of long-chain hydroxyacyl-CoA dehydrogenase deficiency."
// Reading the body confirmed the figure AND killed a neighbouring claim about
// C16-OH interlaboratory variability, whose real subject is C5DC and C3DC. One
// fetch, two answers the abstract could not give.
//
//   node scripts/fetch-fulltext.mjs --coverage   # how many papers are reachable, no fetching
//   node scripts/fetch-fulltext.mjs              # fetch and cache everything reachable
//   node scripts/fetch-fulltext.mjs --limit 50   # fetch at most 50 this run
//
// Only the PMC open-access subset is retrievable. A paper that is indexed but
// not open access is recorded as unavailable and never retried in a way that
// would look like "no full text" — same rule as check-relevance.mjs, where a
// failed request must never be cached as a negative finding.
import { readFileSync, writeFileSync, existsSync, renameSync, copyFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectClaims, judgeablePairs } from "./parse-claims.mjs";
import { parseCitation } from "./parse-citations.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = resolve(HERE, ".fulltext-cache.json");

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const API_KEY = process.env.NCBI_API_KEY || null;
const CONTACT = { tool: "metabolicdx", email: "klaaswierenga@gmail.com" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const arg = (f) => process.argv.includes(f);
const flagValue = (f, d) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : d; };

/** Retrying fetch. Returns null on give-up, which callers must not cache. */
async function get(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url);
      if (r.status === 429 || r.status >= 500) { await sleep(1200 * (attempt + 1)); continue; }
      if (!r.ok) return null;
      const text = await r.text();
      if (text.trim()) return text;
    } catch { await sleep(900 * (attempt + 1)); }
  }
  return null;
}

/**
 * PMID -> PMCID for a batch, via elink. Papers with no PMC record are absent.
 *
 * The ids MUST go in as repeated `id=` parameters. Comma-separating them makes
 * elink return a SINGLE merged linkset holding every input id and every output
 * id with no correspondence between them — which silently pairs the first PMID
 * with an arbitrary PMC id and drops the rest. That is a wrong-paper bug, not
 * just a coverage bug, so it is worth the ugly loop.
 */
async function linkToPmc(pmids) {
  const qs = new URLSearchParams({
    dbfrom: "pubmed", db: "pmc", retmode: "json", ...CONTACT,
    ...(API_KEY ? { api_key: API_KEY } : {}),
  });
  for (const p of pmids) qs.append("id", p);
  const body = await get(`${EUTILS}/elink.fcgi?${qs}`);
  if (!body) return null;
  let json;
  try { json = JSON.parse(body); } catch { return null; }
  const out = new Map();
  for (const set of json.linksets ?? []) {
    const pmid = String(set.ids?.[0] ?? "");
    const link = (set.linksetdbs ?? []).find((d) => d.linkname === "pubmed_pmc");
    if (pmid && link?.links?.length) out.set(pmid, `PMC${link.links[0]}`);
  }
  return out;
}

/**
 * Full text for one PMCID from the open-access service.
 *
 * JATS carries the body in <sec>/<p>; references, tables and figure captions are
 * dropped. Keeping them would triple the payload and the judge is being asked
 * about prose claims, not about a reference list.
 */
async function fetchBody(pmcid) {
  const qs = new URLSearchParams({
    db: "pmc", id: pmcid, retmode: "xml", ...CONTACT,
    ...(API_KEY ? { api_key: API_KEY } : {}),
  });
  const xml = await get(`${EUTILS}/efetch.fcgi?${qs}`);
  if (xml === null) return null;                       // request failed — retry later
  if (!/<body[\s>]/.test(xml)) return { text: "", closed: true };  // indexed, not open access

  const body = xml.slice(xml.indexOf("<body"), xml.lastIndexOf("</body>") + 7);
  const text = body
    .replace(/<(table-wrap|fig|xref|ref-list)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return { text, closed: false };
}

// ── which papers the judge actually asks about ──────────────────────────────
const pairs = judgeablePairs(collectClaims());
const pmids = [...new Set(pairs.map((p) => p.pmid).filter(Boolean))];
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};

if (arg("--coverage")) {
  const have = pmids.filter((p) => cache[p]?.text);
  const closed = pmids.filter((p) => cache[p] && !cache[p].text);
  console.log(`${pmids.length} cited papers`);
  console.log(`  full text cached : ${have.length}`);
  console.log(`  known closed     : ${closed.length}`);
  console.log(`  not yet checked  : ${pmids.length - have.length - closed.length}`);
  if (have.length) {
    const chars = have.map((p) => cache[p].text.length).sort((a, b) => a - b);
    const med = chars[Math.floor(chars.length / 2)];
    console.log(`  median length    : ${med.toLocaleString()} chars (~${Math.round(med / 4).toLocaleString()} tokens)`);
  }
  process.exit(0);
}

// ── papers already stored under docs/ ───────────────────────────────────────
// references.js records `localCopy` and `pmid` for the standards and CLIR papers
// held in the repository, with text already extracted under docs/txt/. Those are
// full texts we own and had not been wiring in. Staged by PMID like everything
// else so a fresh clone can rebuild the cache without re-fetching them.
if (arg("--local")) {
  const { mkdirSync } = await import("node:fs");
  const { REFERENCES } = await import("../src/references.js");
  const DROP = resolve(HERE, "..", "docs", "fulltext");
  mkdirSync(DROP, { recursive: true });

  let staged = 0;
  for (const [key, r] of Object.entries(REFERENCES)) {
    if (!r.localCopy || !r.pmid) continue;
    const base = r.localCopy.replace(/^docs\//, "").replace(/\.pdf$/i, "");
    const txt = resolve(HERE, "..", "docs", "txt", `${base}.txt`);
    if (!existsSync(txt)) { console.error(`  no extract for ${key}: docs/txt/${base}.txt`); continue; }
    const body = readFileSync(txt, "utf8").replace(/\s+/g, " ").trim();
    if (body.length < 500) { console.error(`  too short for ${key}: ${body.length} chars`); continue; }
    writeFileSync(resolve(DROP, `${r.pmid}.txt`), body);
    console.error(`  ${r.pmid}  ${String(body.length).padStart(7)} chars  ${key}`);
    staged++;
  }
  console.error(`\n${staged} staged to docs/fulltext/. Run: node scripts/fetch-fulltext.mjs --ingest`);
  process.exit(0);
}

// ── GeneReviews chapters, which are free but not in PMC ─────────────────────
// A GeneReviews chapter is fully readable on NCBI Bookshelf and costs nothing,
// but it is not in the PMC open-access set, so the PMC pass above reports it as
// closed and it lands on the "obtain by hand" list. It does not belong there.
//
// Chapters are written to docs/fulltext/<PMID>.txt — the same drop folder a
// hand-retrieved PDF goes into — rather than straight to the cache, so every
// paper the judge can read sits in one visible place regardless of who fetched
// it. Run --ingest afterwards, exactly as for a PDF.
if (arg("--genereviews")) {
  const { mkdirSync } = await import("node:fs");
  const DROP = resolve(HERE, "..", "docs", "fulltext");
  mkdirSync(DROP, { recursive: true });

  const wanted = pairs.filter((g) => /GeneReviews/i.test(g.citation) && !cache[g.pmid]?.text);
  console.error(`${wanted.length} GeneReviews chapters cited without full text`);

  let got = 0;
  for (const g of wanted) {
    // The PubMed record for a book chapter carries its Bookshelf accession.
    const qs = new URLSearchParams({ db: "pubmed", id: g.pmid, retmode: "xml", ...CONTACT,
      ...(API_KEY ? { api_key: API_KEY } : {}) });
    const rec = await get(`${EUTILS}/efetch.fcgi?${qs}`);
    await sleep(API_KEY ? 120 : 360);
    const nbk = rec?.match(/NBK\d+/)?.[0];
    if (!nbk) { console.error(`  ${g.pmid}: no Bookshelf accession — not a book record`); continue; }

    const html = await get(`https://www.ncbi.nlm.nih.gov/books/${nbk}/`);
    await sleep(500);
    if (!html) { console.error(`  ${g.pmid} (${nbk}): fetch failed`); continue; }

    // Everything before the body-content div is site chrome and a cookie notice;
    // keeping it would spend a few thousand tokens per chapter on nothing.
    const start = html.search(/<div[^>]*class="[^"]*body-content[^"]*"/);
    const slice = start > -1 ? html.slice(start) : html;
    const text = slice
      .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
      .replace(/\s+/g, " ").trim();
    if (text.length < 2000) { console.error(`  ${g.pmid} (${nbk}): only ${text.length} chars`); continue; }

    writeFileSync(resolve(DROP, `${g.pmid}.txt`), text);
    console.error(`  ${g.pmid} (${nbk}): ${text.length.toLocaleString()} chars`);
    got++;
  }
  console.error(`\n${got} chapters written to docs/fulltext/. Run: node scripts/fetch-fulltext.mjs --ingest`);
  process.exit(0);
}

// ── papers worth obtaining by hand ──────────────────────────────────────────
// PMC covers about one paper in six here. The rest are closed access, and some
// of them are load-bearing: a closed paper carrying six claims the abstract
// could not settle is worth a library request, while one whose claims are all
// already affirmed is not. Rank by what obtaining it would actually resolve.
if (arg("--wanted")) {
  const VERDICTS = resolve(HERE, ".claim-verdict-cache.json");
  const verdicts = existsSync(VERDICTS) ? JSON.parse(readFileSync(VERDICTS, "utf8")) : {};
  const settled = new Set(
    Object.entries(verdicts).filter(([, v]) => v?.verdict === "supports")
      .map(([k]) => k.split("|").slice(1).join("|")),
  );

  const rows = [];
  for (const g of pairs) {
    if (cache[g.pmid]?.text) continue;                       // already have it
    const unsettled = g.claims.filter((c) => !settled.has(`${g.pmid}|${c.id}`));
    if (!unsettled.length) continue;                         // nothing to gain
    rows.push({ pmid: g.pmid, citation: g.citation, n: unsettled.length, disorders: [...new Set(unsettled.map((c) => c.disorder))] });
  }
  rows.sort((a, b) => b.n - a.n);

  const top = Number(flagValue("--top", "40"));
  const held = Object.values(cache).filter((v) => v.text).length;
  const pick = rows.slice(0, top);
  const resolves = pick.reduce((n, r) => n + r.n, 0);

  /**
   * Pull the identifying bits out of a citation string: who, when, where.
   *
   * The list is worked through over days, a few papers at a time, so what it has
   * to support is recognising a paper at a glance and finding it again. Full
   * citations are for the reference list; "Häberle 2019, J Inherit Metab Dis" is
   * what someone actually searches on. Anything that does not parse keeps its
   * full string rather than being silently blanked.
   */
  function shortOf(citation) {
    const s = String(citation || "");
    const author = (s.match(/^([^.]+?)(?:\s+et al)?\./)?.[1] || "").split(",")[0].trim();
    // The publication year is the one the volume follows, "…2001;21(12):2080–5".
    // Taking the last four-digit year in the string instead reads that citation
    // as "Yap S 2080", because the first page is in the same range as a year.
    const year = s.match(/\b(?:19|20)\d{2}(?=\s*[;:.])/)?.[0] || s.match(/\b(?:19|20)\d{2}\b/)?.[0] || "";
    // The journal is the segment immediately before the year, which is how every
    // citation in this corpus is shaped. Books and chapters have no such segment.
    const journal = (s.match(/\.\s*([^.]{3,60}?)\.\s*\d{4}\s*[;:]/)?.[1] || "").trim();
    return {
      who: author && year ? `${author} ${year}` : (author || "—"),
      journal: journal || (/GeneReviews|In:|eds\./i.test(s) ? "book/chapter" : "—"),
    };
  }

  // --csv for a spreadsheet: same rows, sortable and filterable, one per line.
  if (arg("--csv")) {
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = ["claims,pmid,author_year,journal,disorders,url,citation"];
    for (const r of pick) {
      const { who, journal } = shortOf(r.citation);
      lines.push([r.n, r.pmid, esc(who), esc(journal), esc(r.disorders.join(" ")),
        `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`, esc(r.citation)].join(","));
    }
    writeFileSync(resolve(HERE, "..", "docs", "fulltext-wanted.csv"), lines.join("\n") + "\n");
    console.log(`docs/fulltext-wanted.csv written: ${pick.length} rows`);
    process.exit(0);
  }

  // --md rewrites docs/fulltext-wanted.md in place. The ranking moves every time
  // a claim is settled or a paper arrives, and a stale list sends someone off to
  // retrieve a paper that is already in hand — so regenerating has to be one
  // command, not a shell pipeline nobody remembers.
  if (arg("--md")) {
    const out = [
      "# Papers worth obtaining by hand", "",
      "Regenerate with `node scripts/fetch-fulltext.mjs --wanted --md` rather than",
      "editing. The ranking moves as claims are settled and as papers arrive, and a",
      "stale list sends you after something already in hand.", "",
      `Full text is held for **${held} of ${pmids.length}** cited papers. That covers the PMC`,
      "open-access set, every GeneReviews chapter (free on Bookshelf, fetched with",
      "`--genereviews`), and the papers already stored under `docs/`.", "",
      `**${rows.length}** closed-access papers still carry at least one claim no abstract could`,
      `confirm. The top ${pick.length} below would settle **${resolves}** of them.`, "",
      "## How to feed one back", "",
      "Drop it in `docs/fulltext/` under whatever name the journal site gave it, then",
      "run:", "", "```", "node scripts/fetch-fulltext.mjs --ingest", "```", "",
      "`<PMID>.pdf` is the surest name, but a file called `Wolf 2012.pdf` is identified",
      "from its own first page. A scan with no text layer is OCRed with the renderer and",
      "OCR engine built into Windows, so an old paper that is a photograph of a page",
      "still gets read. The folder is gitignored: publisher PDFs are not redistributable",
      "and this repository is public.", "", "---", "",
    ];
    // The checklist is the working view: one line per paper, tickable, with the
    // three things needed to recognise and find it. Full citations follow below
    // for anyone who needs the volume and pages.
    out.push("## The list", "",
      "Ranked by claims settled. Tick as you go — the numbers shift when you re-run",
      "`--wanted --md`, so re-tick against PMIDs rather than positions.", "",
      "| ✓ | Claims | PMID | Author | Journal | Disorders |",
      "|---|---:|---|---|---|---|");
    for (const r of pick) {
      const { who, journal } = shortOf(r.citation);
      out.push(`| ☐ | ${r.n} | [${r.pmid}](https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/) | ${who} | ${journal} | ${r.disorders.join(", ")} |`);
    }
    out.push("", "Also written as `docs/fulltext-wanted.csv` (`--wanted --csv`) if you would",
      "rather work in a spreadsheet.", "", "---", "", "## Full citations", "");
    for (const r of pick) {
      out.push("", `### ${r.n} claims — PMID ${r.pmid}`, "", `*${r.disorders.join(", ")}*`, "",
        r.citation, `<https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/>`);
    }
    writeFileSync(resolve(HERE, "..", "docs", "fulltext-wanted.md"), out.join("\n") + "\n");
    console.log(`docs/fulltext-wanted.md rewritten: top ${pick.length} of ${rows.length}, ${resolves} claims`);
    process.exit(0);
  }

  console.log(`${rows.length} closed-access papers carry at least one unsettled claim.`);
  console.log(`Obtaining the top ${pick.length} would resolve ${resolves} claims.`);
  console.log(`\nDrop each as docs/fulltext/<PMID>.pdf (or .txt), then:`);
  console.log(`  node scripts/fetch-fulltext.mjs --ingest\n`);
  for (const r of pick) {
    console.log(`${String(r.n).padStart(2)} claims  PMID ${r.pmid}  [${r.disorders.join(", ")}]`);
    console.log(`          ${r.citation}`);
    console.log(`          https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`);
  }
  process.exit(0);
}

// ── take in papers obtained by hand ─────────────────────────────────────────
// docs/fulltext/<PMID>.txt is merged into the same cache the PMC fetch fills,
// so the judge needs no knowledge of where a body came from. PDFs are converted
// with pdftotext if it is installed; anything else is reported and skipped.
if (arg("--ingest")) {
  const { readdirSync, statSync } = await import("node:fs");
  const { execFileSync } = await import("node:child_process");
  const DROP = resolve(HERE, "..", "docs", "fulltext");
  if (!existsSync(DROP)) { console.error(`nothing to ingest: ${DROP} does not exist`); process.exit(0); }

  const { createHash } = await import("node:crypto");
  const ABSTRACTS = resolve(HERE, ".abstract-cache.json");
  const abstracts = existsSync(ABSTRACTS) ? JSON.parse(readFileSync(ABSTRACTS, "utf8")) : {};

  const MIN_BODY_CHARS = 3000;
  const cited = new Set(pmids);

  // Bodies already held, so a duplicate is caught against earlier runs too.
  const byFingerprint = new Map();
  for (const [p, v] of Object.entries(cache)) {
    if (v?.text) byFingerprint.set(createHash("sha1").update(v.text).digest("hex"), p);
  }

  const GENERIC = new Set(`deficiency disease disorder disorders syndrome inborn error errors
    metabolism metabolic acid acidemia acidaemia aciduria type patients human clinical infant
    neonatal newborn screening diagnosis management treatment gene mutations variant variants
    case report review children child adult plasma urine serum blood novel study analysis their
    with from and the for combined causes encoding`.split(/\s+/).filter(Boolean));

  /**
   * Does the body look like the paper this PMID names?
   *
   * Compared against the title PubMed holds, which the abstract cache already
   * has for every cited paper. Distinctive title words should appear somewhere
   * in the body of the paper they came from; when almost none do, the file is
   * some other paper. Deliberately lenient -- half the words is enough -- since
   * the job is catching a different paper, not policing wording.
   */
  function titleMismatch(pmid, body) {
    const title = abstracts[pmid]?.title;
    if (!title) return null;                       // nothing to check against
    const words = [...new Set(title.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/))]
      .filter((w) => w.length > 4 && !GENERIC.has(w));
    if (words.length < 3) return null;             // too generic a title to judge
    const hay = body.toLowerCase();
    const hits = words.filter((w) => hay.includes(w)).length;
    if (hits / words.length >= 0.5) return null;
    return `body does not match the cited title (${hits}/${words.length} key words) — "${title.slice(0, 70)}"`;
  }

  /**
   * Which cited paper is this body, if not the one the filename claims?
   *
   * Scores the body against every cited title the abstract cache holds and
   * returns the best, so a file saved under the wrong PMID can be renamed to
   * the right one instead of simply refused. Requires a clear winner: a strong
   * match, and comfortably ahead of the runner-up, because renaming a file to
   * the wrong PMID is the very failure being guarded against.
   */
  function identify(body) {
    const hay = body.toLowerCase();
    const scored = [];
    for (const [p, rec] of Object.entries(abstracts)) {
      if (!cited.has(p) || !rec?.title) continue;
      const words = [...new Set(rec.title.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/))]
        .filter((w) => w.length > 4 && !GENERIC.has(w));
      if (words.length < 4) continue;
      scored.push({ pmid: p, title: rec.title, score: words.filter((w) => hay.includes(w)).length / words.length });
    }
    scored.sort((a, b) => b.score - a.score);
    const [best, next] = scored;
    if (!best || best.score < 0.8) return null;
    if (next && best.score - next.score < 0.15) return null;   // not a clear winner
    return best;
  }

  // ── naming a file that arrived without a PMID ───────────────────────────────
  // Saved from a publisher's site a paper is called "Wolf 2012.pdf", because the
  // PMID is the one thing the person doing the retrieving does not have in front
  // of them. Two independent signals can name it, and where both speak they have
  // to agree:
  //
  //   the body  — identify() run against the FIRST PAGE rather than the whole
  //               paper. Whole-body scoring is useless here: a review quotes
  //               dozens of other titles verbatim in its reference list, which
  //               puts twenty papers at a perfect score and names none of them.
  //   the name  — surname and year off the filename, matched against the parsed
  //               citation strings, with the surname required to appear on that
  //               same first page. The filename is the user's own label, so on
  //               its own it is a claim, not evidence; the author line of the
  //               paper is what corroborates it.
  //
  // Where the body can speak it decides. It cannot always: the key-word test
  // needs four distinctive words, and "Disorders of biopterin metabolism" has
  // exactly one. For those the filename hint is all there is, and its silence is
  // not evidence against it.
  const HEAD_CHARS = 3000;
  const fold = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const keyWordsOf = (title) =>
    [...new Set(title.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/))]
      .filter((w) => w.length > 4 && !GENERIC.has(w));

  const citedAuthors = new Map();   // pmid -> { surname, year }
  for (const g of pairs) {
    if (citedAuthors.has(g.pmid)) continue;
    const c = parseCitation(g.citation);
    if (!c?.matchAuthor || !c.year) continue;
    citedAuthors.set(g.pmid, { surname: fold(c.matchAuthor.replace(/\s+[A-Za-z]{1,4}$/, "").trim()), year: c.year });
  }

  /**
   * The one cited paper whose title is printed, word for word, on this first
   * page. The strongest signal there is, and the only one that works on a title
   * too short for the key-word test — "Disorders of biopterin metabolism" has a
   * single distinctive word but is unmistakable as a printed line. It stays
   * silent rather than guessing: a ligature lost in PDF extraction (de[fi]ciency
   * arriving as "de ciency") breaks the match, and two hits mean a paper quoting
   * another title on its own first page.
   */
  const flatten = (s) => fold(s).replace(/[^a-z0-9]+/g, " ").trim();
  function titleOnFirstPage(head) {
    const hay = flatten(head);
    const hits = [];
    for (const p of cited) {
      const t = abstracts[p]?.title;
      if (!t) continue;
      const n = flatten(t.replace(/\.$/, ""));
      if (n.length > 25 && hay.includes(n)) hits.push({ pmid: p, title: t });
    }
    return hits.length === 1 ? hits[0] : null;
  }

  /** Cited papers whose first author and year match what the filename says. */
  function fromFilename(file) {
    const m = file.match(/^([A-Za-z][A-Za-z'À-ɏ-]+(?:\s+[a-z]+)?)\s+((?:19|20)\d{2})\b/);
    if (!m) return { surname: null, year: null, hits: [] };
    const surname = fold(m[1]);
    const year = Number(m[2]);
    const hits = [];
    for (const [pmid, a] of citedAuthors) {
      if (Math.abs(a.year - year) > 1) continue;
      if (a.surname === surname || a.surname.endsWith(` ${surname}`) || surname.endsWith(` ${a.surname}`)) hits.push(pmid);
    }
    return { surname, year, hits };
  }

  /** Body text of a PDF, or "" if pdftotext could not read it. */
  const pdfText = (path) => {
    try { return execFileSync("pdftotext", ["-q", path, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }); }
    catch { return ""; }
  };

  let added = 0, skipped = 0, renamed = 0;
  for (const file of readdirSync(DROP)) {
    if (file === "README.md") continue;   // the folder documents itself

    // Accept "<PMID>.pdf" and also "<PMID> Author Year.pdf", which is how a
    // paper arrives when it is saved by hand from a journal site. The leading
    // digits are only believed if they are a PMID this knowledge base actually
    // cites — otherwise "20_papers_-_batch_3.zip" would read as PMID 20.
    //
    // A name with no PMID at all is not refused. Saved from a publisher's site
    // a paper is usually called "Wolf 2012.pdf", and the PMID is the one thing
    // the person doing the retrieving does not have in front of them. The body
    // says which paper it is, so identify() is asked — at the same high bar it
    // has to clear when a file is saved under the WRONG PMID.
    const lead = file.match(/^(\d{4,8})\b/)?.[1];
    const pmid = lead && cited.has(lead) ? lead : null;
    const full = resolve(DROP, file);
    if (!statSync(full).isFile()) continue;

    let text = "";
    if (/\.pdf$/i.test(file)) {
      text = pdfText(full);
      // pdftotext hands a non-ASCII path to the OS in the wrong encoding and
      // gets nothing back, silently: "Barić 2005.pdf" produced zero characters
      // while a byte-identical copy called baric.pdf produced 60,000. The name
      // of the file is not a reason to lose the paper, so retry through a plain
      // ASCII temporary copy. An author with an accent is not a rare case here.
      if (!text.trim() && /[^\x20-\x7E]/.test(full)) {
        const tmp = resolve(tmpdir(), `fulltext-${Date.now()}.pdf`);
        try {
          copyFileSync(full, tmp);
          text = pdfText(tmp);
          if (text.trim()) console.error(`  ${file}: read through an ASCII copy (the accent in the name defeats pdftotext)`);
        } catch { /* fall through to the length check below */ }
        finally { try { unlinkSync(tmp); } catch { /* nothing to clean up */ } }
      }
      if (!text.trim()) { console.error(`  skip ${file}: pdftotext returned nothing (not installed, or an unreadable file)`); skipped++; continue; }
    } else {
      text = readFileSync(full, "utf8");
    }
    text = text.replace(/\s+/g, " ").trim();
    // A scanned paper with no text layer yields a few hundred characters of
    // cover furniture. Judging a claim against that produces a confident
    // "unsupported" from no evidence at all, which is worse than no verdict.
    //
    // It is also the normal state of the papers this project most needs. The
    // oldest citations are the ones no abstract can settle, and a 1968 article
    // arrives as a photograph of a page. Windows can render and read one with no
    // third-party tools, so try that before giving up.
    if (text.length < MIN_BODY_CHARS && /\.pdf$/i.test(file) && process.platform === "win32") {
      const script = resolve(HERE, "ocr-pdf.ps1");
      if (existsSync(script)) {
        console.error(`  ${file}: ${text.length} chars — looks scanned, running OCR (this takes a moment)`);
        try {
          text = execFileSync("powershell.exe",
            ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "-Path", full],
            { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] },
          ).replace(/\s+/g, " ").trim();
        } catch { /* leave the short text in place and report it below */ }
      }
    }
    if (text.length < MIN_BODY_CHARS) {
      const why = cache[pmid]?.text ? `already held from another file` : `no text layer? (scanned PDFs need OCR)`;
      console.error(`  skip ${file}: ${text.length} chars — ${why}`);
      skipped++;
      continue;
    }

    const fingerprint = createHash("sha1").update(text).digest("hex");

    // Named by author rather than PMID: work out which paper it is.
    if (!pmid) {
      const twin = byFingerprint.get(fingerprint);
      if (twin) {
        console.error(`  skip ${file}: byte-for-byte the paper already held for PMID ${twin}`);
        skipped++;
        continue;
      }
      const head = text.slice(0, HEAD_CHARS);
      const best = identify(head);
      const { surname, hits } = fromFilename(file);
      const named = surname ? new RegExp(`\\b${surname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(fold(head)) : false;

      let choice = null, how = "";
      const printed = titleOnFirstPage(head);
      if (printed) {
        choice = printed.pmid;
        how = hits.length && !hits.includes(printed.pmid)
          ? `its own title is printed on the first page (the filename pointed elsewhere: ${hits.join(", ")})`
          : `its own title is printed on the first page`;
      } else if (best && (!hits.length || hits.includes(best.pmid))) {
        choice = best.pmid; how = `first page reads as this paper (${best.score.toFixed(2)})`;
      } else if (hits.length === 1 && named) {
        // The filename's candidate only yields to the body when it could have
        // competed there: a title with too few distinctive words never scores.
        const own = abstracts[hits[0]]?.title;
        if (!best || !own || keyWordsOf(own).length < 4) {
          choice = hits[0]; how = `filename author and year, with the author on the first page`;
        }
      }

      if (!choice) {
        const why = best && hits.length ? `the first page reads as PMID ${best.pmid}, but the filename points at ${hits.join(", ")}`
          : hits.length > 1 ? `the filename matches ${hits.length} cited papers and the first page settles none of them`
          : `the first page matches no cited title clearly enough to name it`;
        console.error(`  skip ${file}: ${why}`);
        skipped++;
        continue;
      }
      if (cache[choice]?.text) {
        console.error(`  skip ${file}: reads as PMID ${choice}, whose full text is already held`);
        skipped++;
        continue;
      }
      const moved = `${choice} ${file}`;
      renameSync(full, resolve(DROP, moved));
      cache[choice] = { pmcid: null, text, closed: false, source: "manual" };
      byFingerprint.set(fingerprint, choice);
      renamed++; added++;
      console.error(`  NAMED   ${file}`);
      console.error(`       -> ${moved}  (${(abstracts[choice]?.title ?? "").slice(0, 60)})`);
      console.error(`          ${how}`);
      continue;
    }

    // Is this actually the paper the filename claims? Two ways it is not, both
    // seen in the first batch: the same PDF saved twice under different PMIDs,
    // and a paper downloaded under the wrong name. Either attaches a body to a
    // citation it does not belong to -- the exact defect this project exists to
    // catch, arriving through the back door.
    const twin = byFingerprint.get(fingerprint);
    if (twin && twin !== pmid) {
      console.error(`  skip ${file}: byte-for-byte the paper already held for PMID ${twin}`);
      console.error(`         so PMID ${pmid} was not actually retrieved — it is still wanted`);
      skipped++;
      continue;
    }

    const mismatch = titleMismatch(pmid, text);
    if (mismatch) {
      // Saved under the wrong PMID: work out which paper it really is and move
      // the file, rather than refusing a paper that was correctly retrieved.
      const real = identify(text);
      if (real && !cache[real.pmid]?.text) {
        const moved = file.replace(/^\d{4,8}/, real.pmid);
        renameSync(resolve(DROP, file), resolve(DROP, moved));
        cache[real.pmid] = { pmcid: null, text, closed: false, source: "manual" };
        byFingerprint.set(fingerprint, real.pmid);
        renamed++; added++;
        console.error(`  RENAMED ${file}`);
        console.error(`       -> ${moved}  (${real.title.slice(0, 60)})`);
        continue;
      }
      console.error(`  skip ${file}: ${mismatch}`);
      if (real) console.error(`         looks like PMID ${real.pmid}, already held`);
      skipped++;
      continue;
    }
    byFingerprint.set(fingerprint, pmid);

    cache[pmid] = { pmcid: null, text, closed: false, source: "manual" };
    added++;
    console.error(`  ${pmid}: ${text.length.toLocaleString()} chars`);
  }
  writeFileSync(CACHE, JSON.stringify(cache));
  console.error(`\ningested ${added} papers${renamed ? ` (${renamed} named from their own text)` : ""}, skipped ${skipped}.`);
  process.exit(0);
}

const unresolved = pmids.filter((p) => !(p in cache));
const todo = unresolved.slice(0, Number(flagValue("--limit", "100000")));
console.error(`${pmids.length} cited papers; ${pmids.length - unresolved.length} already resolved; checking ${todo.length} of ${unresolved.length} outstanding...`);

let linked = 0, fetched = 0, closed = 0;
for (let i = 0; i < todo.length; i += 100) {
  const batch = todo.slice(i, i + 100);
  const links = await linkToPmc(batch);
  await sleep(API_KEY ? 120 : 360);
  if (!links) { console.error(`  elink failed for batch ${i / 100 + 1} — leaving uncached`); continue; }

  for (const pmid of batch) {
    const pmcid = links.get(pmid);
    if (!pmcid) { cache[pmid] = { pmcid: null, text: "", closed: true }; closed++; continue; }
    linked++;
    const body = await fetchBody(pmcid);
    await sleep(API_KEY ? 120 : 360);
    if (body === null) continue;                       // failed — do not cache
    cache[pmid] = { pmcid, text: body.text, closed: body.closed };
    if (body.text) fetched++; else closed++;
  }
  writeFileSync(CACHE, JSON.stringify(cache));
  console.error(`  ${Math.min(i + 100, todo.length)}/${todo.length} — ${fetched} with full text, ${closed} closed`);
}

writeFileSync(CACHE, JSON.stringify(cache));
console.error(`\n${linked} had a PMC record; ${fetched} yielded full text; ${closed} closed or absent.`);
