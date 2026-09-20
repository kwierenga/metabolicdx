// Rewrite the citations whose stamped PMID names a different title.
//
// check-stamped-titles.mjs finds them offline; this repairs them, which needs
// the record. For each mismatch it fetches the PubMed record and rebuilds the
// citation from what PubMed holds — title, journal, year, volume, issue, pages —
// keeping the author segment the knowledge base already uses, because the house
// style is "Surname AB et al." and PubMed's full author list is not that.
//
//   node scripts/repair-stamped-titles.mjs           # show the rewrite, change nothing
//   node scripts/repair-stamped-titles.mjs --write   # apply
//
// Why rebuild the coordinates and not just the title. A citation that carries an
// invented title usually carries invented volume and pages with it: the whole
// tail was generated, not transcribed. Fixing the title alone leaves a reference
// that looks right and still cannot be looked up on paper. The one thing NOT
// taken from PubMed is the author, so a citation naming the wrong author keeps
// naming them and stays visible to the author check in check-citations.mjs.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stampedTitleMismatches } from "./check-stamped-titles.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DISORDERS = resolve(HERE, "..", "src", "disorders.js");
const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const API_KEY = process.env.NCBI_API_KEY || null;
const CONTACT = { tool: "metabolicdx", email: "klaaswierenga@gmail.com" };

const arg = (f) => process.argv.includes(f);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const qs = (p) => new URLSearchParams({ ...p, ...CONTACT, ...(API_KEY ? { api_key: API_KEY } : {}) });

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

/** One efetch for every mismatched PMID; returns pmid -> record fields. */
async function records(pmids) {
  const xml = await get(`${EUTILS}/efetch.fcgi?${qs({ db: "pubmed", id: pmids.join(","), retmode: "xml" })}`);
  if (!xml) return null;
  const out = new Map();
  for (const chunk of xml.split(/<PubmedArticle>|<PubmedBookArticle>/).slice(1)) {
    const pmid = chunk.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1];
    if (!pmid) continue;
    const strip = (s) => (s ?? "").replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
      .replace(/\s+/g, " ").trim();
    out.set(pmid, {
      pmid,
      title: strip(chunk.match(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/)?.[1]).replace(/\.$/, ""),
      journal: strip(chunk.match(/<ISOAbbreviation>([^<]*)<\/ISOAbbreviation>/)?.[1]).replace(/\.$/, ""),
      year: strip(chunk.match(/<JournalIssue[\s\S]*?<Year>(\d{4})<\/Year>/)?.[1]),
      volume: strip(chunk.match(/<Volume>([^<]*)<\/Volume>/)?.[1]),
      issue: strip(chunk.match(/<Issue>([^<]*)<\/Issue>/)?.[1]),
      pages: strip(chunk.match(/<MedlinePgn>([^<]*)<\/MedlinePgn>/)?.[1]),
    });
  }
  return out;
}

/** The citation rebuilt: the KB's authors, everything else from PubMed. */
function rebuild(raw, rec) {
  const authors = raw.match(/^(.*?)\.\s/)?.[1];
  if (!authors) return null;
  // PubMed writes page ranges with an ASCII hyphen; this file uses an en-dash
  // throughout, and a repair should not leave a trail of inconsistent typography.
  const pages = rec.pages.replace(/(\d)-(\d)/, "$1–$2");
  const vol = rec.volume ? `;${rec.volume}${rec.issue ? `(${rec.issue})` : ""}${pages ? `:${pages}` : ""}` : "";
  const journal = rec.journal ? `${rec.journal}. ` : "";
  if (!rec.title || !rec.year) return null;
  return `${authors}. ${rec.title}. ${journal}${rec.year}${vol}. PMID ${rec.pmid}.`;
}

const { mismatches } = stampedTitleMismatches();
if (!mismatches.length) { console.log("nothing to repair"); process.exit(0); }
console.error(`${mismatches.length} citations name a title their PMID does not have\n`);

const recs = await records([...new Set(mismatches.map((m) => m.pmid))]);
if (!recs) { console.error("efetch failed — nothing changed"); process.exit(1); }

let src = readFileSync(DISORDERS, "utf8");
const planned = [];
for (const m of mismatches) {
  const rec = recs.get(m.pmid);
  if (!rec) { console.log(`?  ${m.disorder} PMID ${m.pmid}: no record returned`); continue; }
  // Find the exact reference string in the file by its PMID stamp.
  const needle = src.match(new RegExp(`"[^"]*PMID ${m.pmid}\\.[^"]*"`))?.[0]?.slice(1, -1);
  if (!needle) { console.log(`?  ${m.disorder} PMID ${m.pmid}: reference string not found`); continue; }
  const next = rebuild(needle, rec);
  if (!next) { console.log(`?  ${m.disorder} PMID ${m.pmid}: record too sparse to rebuild`); continue; }
  if (next === needle) continue;
  planned.push({ ...m, needle, next });
  console.log(`${m.disorder} PMID ${m.pmid}`);
  console.log(`  was: ${needle}`);
  console.log(`  now: ${next}\n`);
}

if (!arg("--write")) { console.error(`${planned.length} would be rewritten. Re-run with --write.`); process.exit(0); }
let done = 0;
for (const p of planned) {
  const count = src.split(p.needle).length - 1;
  if (!count) { console.error(`  skipped (not found): ${p.needle.slice(0, 60)}`); continue; }
  src = src.split(p.needle).join(p.next);
  done += count;
}
writeFileSync(DISORDERS, src);
console.error(`\n${done} citation strings rewritten in src/disorders.js`);
