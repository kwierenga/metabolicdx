// Does each verified citation actually concern the disorder it is cited under?
//
// check-citations.mjs answers "is this a real paper?". It cannot answer "is it
// about the right thing", and that gap is not theoretical: ALDH6A1 cited a
// genuine, perfectly-resolving paper on *succinic* semialdehyde dehydrogenase in
// support of five claims about *methylmalonate* semialdehyde dehydrogenase.
// Real authors, real journal, exact title match, live PMID, wrong enzyme.
//
//   node scripts/check-relevance.mjs            # screen everything (cached)
//   node scripts/check-relevance.mjs --report   # re-print from cache, no network
//   node scripts/check-relevance.mjs --limit 50
//
// This is a SCREEN, not a verdict. It fetches each citation's abstract and asks
// whether the paper mentions anything specific to the disorder — the gene, the
// enzyme, the disorder's own name, its signature analytes. A citation that
// mentions none of them is worth a human look. A citation that mentions several
// is probably fine, but "probably fine" is not "supports the claim": only
// reading the paper against the sentence can establish that.
//
// Two deliberate limits, both chosen to keep false alarms low enough that the
// output is worth reading:
//
//   - References cited by three or more disorders are skipped. Those are method
//     papers and guidelines — an ACMG acylcarnitine standard legitimately never
//     mentions glutaric aciduria, and flagging it would bury the real hits.
//   - Citations with no abstract in PubMed are reported separately rather than
//     flagged. Many older papers have none; absence of an abstract is not
//     evidence of irrelevance.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DISORDERS } from "../src/disorders.js";
import { ANALYTE_MAP } from "../src/analytes.js";
import { citedPmid, citationText } from "../src/citations.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = resolve(HERE, ".abstract-cache.json");
const OUT = resolve(HERE, "relevance-report.json");
const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const API_KEY = process.env.NCBI_API_KEY || null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

// Words that appear in nearly every metabolic paper and so discriminate nothing.
const GENERIC = new Set(`deficiency disease disorder syndrome inborn error errors metabolism
  metabolic acid acidemia acidaemia aciduria type patient patients human clinical infant
  infantile neonatal newborn screening diagnosis management treatment gene mutation mutations
  variant variants case report review children child adult plasma urine urinary serum blood
  and the for with from novel new study analysis`.split(/\s+/).filter(Boolean));

/** Terms that would only appear in a paper genuinely about this disorder. */
function vocabularyFor(d) {
  const terms = new Set();
  const add = (s) => {
    for (const w of norm(s).split(" ")) if (w.length > 3 && !GENERIC.has(w)) terms.add(w);
  };
  add(d.name);
  if (d.gene) { for (const g of String(d.gene).split(/[,/\s]+/)) if (g.length > 1) terms.add(norm(g)); }
  for (const m of d.signature ?? []) {
    const a = ANALYTE_MAP[m.id];
    if (a?.name) add(a.name);
    if (m.id.length > 3) terms.add(norm(m.id));
  }
  terms.delete("");
  return terms;
}

async function efetch(pmids) {
  const qs = new URLSearchParams({
    db: "pubmed", id: pmids.join(","), rettype: "abstract", retmode: "xml",
    tool: "metabolicdx", email: "klaaswierenga@gmail.com", ...(API_KEY ? { api_key: API_KEY } : {}),
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(`${EUTILS}/efetch.fcgi?${qs}`);
      if (r.status === 429 || r.status >= 500) { await sleep(1200 * (attempt + 1)); continue; }
      if (!r.ok) return null;
      const text = await r.text();
      if (text.trim()) return text;
    } catch { await sleep(900 * (attempt + 1)); }
  }
  return null;   // never cached — a failed fetch must not read as "no abstract"
}

/** Split the XML into one record per article. Regex is enough for these fields. */
function parseArticles(xml) {
  const out = new Map();
  for (const chunk of xml.split("</PubmedArticle>")) {
    const pmid = chunk.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1];
    if (!pmid) continue;
    const title = (chunk.match(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/)?.[1] ?? "").replace(/<[^>]+>/g, " ");
    const abstract = [...chunk.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, " ")).join(" ");
    const mesh = [...chunk.matchAll(/<DescriptorName[^>]*>([\s\S]*?)<\/DescriptorName>/g)].map((m) => m[1]).join(" ");
    const keywords = [...chunk.matchAll(/<Keyword[^>]*>([\s\S]*?)<\/Keyword>/g)].map((m) => m[1]).join(" ");
    out.set(pmid, { title, abstract, mesh, keywords });
  }
  return out;
}

// ── collect every verified citation, with where it is cited ─────────────────
const uses = new Map();   // pmid -> { pmid, raw, disorders:Set }
for (const d of DISORDERS) {
  for (const raw of [...(d.narrative?.references ?? []), ...(d.followUp?.references ?? [])]) {
    const pmid = citedPmid(raw);
    if (!pmid) continue;
    if (!uses.has(pmid)) uses.set(pmid, { pmid, raw, disorders: new Set() });
    uses.get(pmid).disorders.add(d.id);
  }
}

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};

if (!process.argv.includes("--report")) {
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg > -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;
  const todo = [...uses.keys()].filter((p) => !(p in cache)).slice(0, limit);
  console.error(`${uses.size} verified citations; ${uses.size - todo.length} cached; fetching ${todo.length} abstracts...`);
  const PER = 150;
  for (let i = 0; i < todo.length; i += PER) {
    const batch = todo.slice(i, i + PER);
    const xml = await efetch(batch);
    if (!xml) { console.error(`  batch ${i}: request failed, will retry next run`); continue; }
    const parsed = parseArticles(xml);
    for (const p of batch) cache[p] = parsed.get(p) ?? { title: "", abstract: "", mesh: "", keywords: "", missing: true };
    writeFileSync(CACHE, JSON.stringify(cache));
    console.error(`  ${Math.min(i + PER, todo.length)}/${todo.length}`);
  }
}

// ── screen ──────────────────────────────────────────────────────────────────
const rows = [];
for (const d of DISORDERS) {
  const vocab = vocabularyFor(d);
  if (!vocab.size) continue;
  for (const raw of [...(d.narrative?.references ?? []), ...(d.followUp?.references ?? [])]) {
    const pmid = citedPmid(raw);
    if (!pmid) continue;
    const shared = uses.get(pmid).disorders.size;
    if (shared >= 3) continue;              // method paper / guideline
    const rec = cache[pmid];
    if (!rec) continue;
    const hay = norm([rec.title, rec.abstract, rec.mesh, rec.keywords].join(" "));
    if (!hay) { rows.push({ disorder: d.id, pmid, hits: [], noAbstract: true, text: citationText(raw) }); continue; }
    const hits = [...vocab].filter((t) => hay.includes(t));
    rows.push({ disorder: d.id, pmid, hits, noAbstract: false, vocab: vocab.size, text: citationText(raw) });
  }
}

const flagged = rows.filter((r) => !r.noAbstract && r.hits.length === 0);
const weak = rows.filter((r) => !r.noAbstract && r.hits.length === 1);
const noAbs = rows.filter((r) => r.noAbstract);

console.log(`\n=== relevance screen (${rows.length} disorder-specific verified citations) ===`);
console.log(`  mentions nothing specific to the disorder : ${flagged.length}`);
console.log(`  mentions exactly one term (weak)          : ${weak.length}`);
console.log(`  no abstract in PubMed (not assessable)    : ${noAbs.length}`);
console.log(`  looks relevant                            : ${rows.length - flagged.length - weak.length - noAbs.length}`);

console.log(`\n--- flagged: abstract mentions no gene, enzyme, disorder name or signature analyte ---`);
for (const r of flagged) {
  console.log(`  ${r.disorder.padEnd(9)} PMID ${r.pmid}`);
  console.log(`     ${r.text.slice(0, 120)}`);
}
if (weak.length) {
  console.log(`\n--- weak (one term only) ---`);
  for (const r of weak.slice(0, 25)) {
    console.log(`  ${r.disorder.padEnd(9)} PMID ${r.pmid}  [${r.hits.join(",")}]`);
    console.log(`     ${r.text.slice(0, 110)}`);
  }
}

writeFileSync(OUT, JSON.stringify(rows, null, 2));
console.log(`\nfull report: scripts/relevance-report.json`);
