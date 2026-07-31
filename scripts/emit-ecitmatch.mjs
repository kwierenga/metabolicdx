// Emit ecitmatch request URLs, one per batch, for the knowledge-base citations.
//
// Fallback path, not the normal one: check-citations.mjs now calls ecitmatch
// itself. This exists for when eutils.ncbi.nlm.nih.gov is unreachable from the
// machine holding the repo — which was the case when this was written, with
// connect timeouts from both node and curl. The emitted URLs can be fetched by
// whatever agent or CI job *can* reach NCBI, and the replies concatenated into
// scripts/.ecitmatch/results.txt, which check-citations.mjs reads back as a
// cache seed.
//
//   node scripts/emit-ecitmatch.mjs            # write scripts/.ecitmatch/*.url
//   node scripts/emit-ecitmatch.mjs --stats    # just the coverage summary
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectCitations, dedupe, ecitmatchBatches } from "./parse-citations.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(HERE, ".ecitmatch");
const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/ecitmatch.cgi?db=pubmed&retmode=xml&bdata=";

// `|` must be percent-encoded: it is not a legal URL character, and strict
// clients reject the URL outright. Spaces go to `+`, which is shorter than %20.
const encode = (s) => s.replace(/\r/g, "%0D").replace(/ /g, "+").replace(/[^A-Za-z0-9+%._~-]/g, (c) => encodeURIComponent(c));

const uniq = dedupe(collectCitations());
const { batches, usable, unusable } = ecitmatchBatches(uniq, 25);

console.log(`unique citations   : ${uniq.length}`);
console.log(`ecitmatch-eligible : ${usable.length}  (journal + year + volume + first page + author)`);
console.log(`need title search  : ${unusable.length}`);
console.log(`batches            : ${batches.length}`);

const missingWhy = { noJournal: 0, noYear: 0, noVolume: 0, noPage: 0, noAuthor: 0 };
for (const c of unusable) {
  if (!c.journal) missingWhy.noJournal++;
  else if (!c.year) missingWhy.noYear++;
  else if (!c.volume) missingWhy.noVolume++;
  else if (!c.firstPage) missingWhy.noPage++;
  else if (!c.matchAuthor) missingWhy.noAuthor++;
}
console.log(`  why not eligible : ${JSON.stringify(missingWhy)}`);

if (!process.argv.includes("--stats")) {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  batches.forEach((b, i) => {
    const url = BASE + encode(b.bdata);
    writeFileSync(resolve(DIR, `batch-${String(i).padStart(2, "0")}.url`), url + "\n");
    writeFileSync(
      resolve(DIR, `batch-${String(i).padStart(2, "0")}.json`),
      JSON.stringify(b.items.map((c, j) => ({ key: `ref_${b.start + j}`, title: c.title, year: c.year, journal: c.journal, uses: c.uses })), null, 1),
    );
  });
  console.log(`\nwrote ${batches.length} batches to scripts/.ecitmatch/`);
  console.log(`first URL length: ${(BASE + encode(batches[0].bdata)).length} chars`);
  if (process.argv.includes("--print")) {
    batches.forEach((b, i) => console.log(`\n@@${i}@@ ` + BASE + encode(b.bdata)));
  }
}
