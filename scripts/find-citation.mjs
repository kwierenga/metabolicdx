// Find the real paper behind a garbled citation.
//
// The repair companion to check-citations.mjs. That script tells you a citation
// resolves to nothing; this one helps you work out what it was meant to be.
//
//   node scripts/find-citation.mjs "Sacksteder KA" "malonyl-CoA decarboxylase"
//   node scripts/find-citation.mjs --raw 'Brown GK[Author] AND malonic[Title]'
//
// With two or more plain arguments it treats the first as an author surname and
// the rest as title keywords, then widens in steps: author+all-keywords in the
// title, author+any-keyword, author alone, keywords alone. The corpus's usual
// damage is a real author and a real subject wrapped in an invented journal,
// volume and page, so the author is the most reliable thing in the string and
// the search is built around keeping it.
import { setTimeout as sleep } from "node:timers/promises";

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const API_KEY = process.env.NCBI_API_KEY || null;
const common = { retmode: "json", tool: "metabolicdx", email: "klaaswierenga@gmail.com", ...(API_KEY ? { api_key: API_KEY } : {}) };

async function eutils(path, params) {
  const qs = new URLSearchParams({ ...common, ...params });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`${EUTILS}/${path}?${qs}`);
      if (r.ok) return await r.json();
    } catch {}
    await sleep(800 * (attempt + 1));
  }
  return null;
}

const esearch = async (term, retmax = 8) =>
  (await eutils("esearch.fcgi", { db: "pubmed", term, retmax: String(retmax), sort: "relevance" }))?.esearchresult?.idlist ?? [];

async function esummary(ids) {
  if (!ids.length) return [];
  const r = (await eutils("esummary.fcgi", { db: "pubmed", id: ids.join(",") }))?.result;
  if (!r) return [];
  return (r.uids ?? []).map((u) => ({
    pmid: u,
    title: r[u]?.title ?? "",
    journal: r[u]?.source ?? "",
    date: r[u]?.pubdate ?? "",
    authors: (r[u]?.authors ?? []).map((a) => a.name).slice(0, 4).join(", "),
    volume: r[u]?.volume ?? "",
    issue: r[u]?.issue ?? "",
    pages: r[u]?.pages ?? "",
  }));
}

const args = process.argv.slice(2);
const rawIdx = args.indexOf("--raw");
let queries;
if (rawIdx > -1) {
  queries = [args[rawIdx + 1]];
} else {
  const [author, ...words] = args;
  if (!author) {
    console.error('usage: node scripts/find-citation.mjs "Surname AB" "title keywords..."');
    process.exit(1);
  }
  const kw = words.join(" ").split(/\s+/).filter((w) => w.length > 3);
  const surname = author.split(/\s+/)[0];
  queries = [
    kw.length ? `${surname}[Author] AND ${kw.map((w) => `${w}[Title]`).join(" AND ")}` : null,
    kw.length ? `${surname}[Author] AND (${kw.map((w) => `${w}[Title]`).join(" OR ")})` : null,
    kw.length ? `${surname}[Author] AND (${kw.join(" OR ")})` : null,
    `${surname}[Author]`,
    kw.length >= 2 ? kw.map((w) => `${w}[Title]`).join(" AND ") : null,
  ].filter(Boolean);
}

const seen = new Set();
for (const q of queries) {
  const ids = (await esearch(q)).filter((id) => !seen.has(id));
  if (!ids.length) { console.log(`— no new hits: ${q}`); continue; }
  console.log(`\n### ${q}`);
  for (const h of await esummary(ids)) {
    seen.add(h.pmid);
    console.log(`  ${h.date.padEnd(9)} PMID ${h.pmid}`);
    console.log(`    ${h.title}`);
    console.log(`    ${h.journal}. ${h.date.slice(0, 4)};${h.volume}${h.issue ? `(${h.issue})` : ""}:${h.pages}.  [${h.authors}]`);
  }
  if (seen.size >= 12) break;   // enough to judge by hand
}
