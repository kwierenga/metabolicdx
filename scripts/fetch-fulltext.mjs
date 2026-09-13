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
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectClaims, judgeablePairs } from "./parse-claims.mjs";

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
      "Save it as `docs/fulltext/<PMID>.pdf` (or `.txt`) — the filename must be the",
      "PMID — then run:", "", "```", "node scripts/fetch-fulltext.mjs --ingest", "```", "",
      "PDFs are converted with pdftotext. A scanned PDF with no text layer is rejected",
      "rather than silently judged on nothing. The folder is gitignored: publisher PDFs",
      "are not redistributable and this repository is public.", "", "---", "",
    ];
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

  let added = 0, skipped = 0;
  for (const file of readdirSync(DROP)) {
    if (file === "README.md") continue;   // the folder documents itself
    const pmid = file.replace(/\.(txt|pdf)$/i, "");
    if (!/^\d+$/.test(pmid)) { console.error(`  skip ${file}: filename must be <PMID>.txt or <PMID>.pdf`); skipped++; continue; }
    const full = resolve(DROP, file);
    if (!statSync(full).isFile()) continue;

    let text = "";
    if (/\.pdf$/i.test(file)) {
      try { text = execFileSync("pdftotext", ["-q", full, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }); }
      catch { console.error(`  skip ${file}: pdftotext failed or is not installed`); skipped++; continue; }
    } else {
      text = readFileSync(full, "utf8");
    }
    text = text.replace(/\s+/g, " ").trim();
    if (text.length < 500) { console.error(`  skip ${file}: only ${text.length} chars — not a readable body`); skipped++; continue; }

    cache[pmid] = { pmcid: null, text, closed: false, source: "manual" };
    added++;
    console.error(`  ${pmid}: ${text.length.toLocaleString()} chars`);
  }
  writeFileSync(CACHE, JSON.stringify(cache));
  console.error(`\ningested ${added} papers, skipped ${skipped}.`);
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
