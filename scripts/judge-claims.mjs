// Does the cited paper actually support the sentence pointing at it?
//
// The third layer of citation checking. check-citations.mjs asks whether a
// paper is real; check-relevance.mjs asks whether it concerns the right
// disorder; neither can catch a genuine, correctly-filed paper attached to a
// claim it does not carry — which is what every entry in
// docs/citation-claims-review.md turned out to be.
//
//   node scripts/judge-claims.mjs --calibrate     # the labelled set only
//   node scripts/judge-claims.mjs --numeric       # claims with a number in them
//   node scripts/judge-claims.mjs                 # everything
//   node scripts/judge-claims.mjs --batch         # via the Batches API, 50% cheaper
//   node scripts/judge-claims.mjs --report        # re-print from cache, no spend
//
// This is a SCREEN, not a verdict, and the distinction is load-bearing. The
// judge sees the abstract, never the paper. "unsupported" therefore means the
// abstract does not carry the claim — a full text very often would. Nothing
// here is ever promoted automatically: confirmed findings go into
// citation-claims-review.md by hand, the same way the existing entries did.
//
// Two design choices that follow from measurements in parse-claims.mjs:
//
//   - Requests are grouped BY PAPER, not by claim. 2.3 claims cite each paper
//     on average, and the abstract is the expensive half of the payload, so
//     grouping halves the token cost and lets the judge see related claims
//     together.
//   - A claim is escalated on the ABSENCE of support, not on the presence of
//     the word "unsupported". The corpus cites at paragraph granularity, so a
//     claim citing [1,4] is routinely carried by one of the two; one affirming
//     source is enough to clear it. Calibration settled the wording: the judge
//     repeatedly reached the register's own conclusion while grading it
//     "not-assessable", because a cloning paper genuinely never engages a claim
//     about a diagnostic ratio. Keying on the literal token hid six of eight
//     known defects.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { collectClaims, judgeablePairs } from "./parse-claims.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ABSTRACTS = resolve(HERE, ".abstract-cache.json");
const FULLTEXTS = resolve(HERE, ".fulltext-cache.json");
const CACHE = resolve(HERE, ".claim-verdict-cache.json");
const OUT = resolve(HERE, "claim-support-report.json");
const CALIBRATION = resolve(HERE, "claim-calibration.json");

// The key is read from .env.local, which is already gitignored via `.env*.local`
// and is where api/claude.js expects ANTHROPIC_API_KEY to live in development.
// Node reads it natively, so the key never has to be exported, pasted into a
// terminal, or committed. A missing file is fine — an exported environment
// variable works just as well.
try { process.loadEnvFile(resolve(HERE, "..", ".env.local")); } catch { /* no local env file */ }

const MODEL = "claude-opus-5";
// Bump when the prompt changes, so cached verdicts from an older prompt are not
// silently mixed with new ones.
const PROMPT_VERSION = 1;
// Full-text verdicts live in their own key namespace rather than bumping the
// version above. They answer a different question against different evidence,
// and the 1,806 abstract verdicts already in the cache cost real money — there
// is no reason to invalidate them to add a second, better-informed opinion.
const FULLTEXT_PROMPT_VERSION = 1;

const arg = (f) => process.argv.includes(f);
const flagValue = (f, d) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : d; };

// ── the prompt ──────────────────────────────────────────────────────────────

const SYSTEM = `You screen medical reference lists. For each claim you are given a sentence from a rare-metabolic-disease knowledge base and ONE paper's title and abstract, and you decide whether that abstract supports that sentence.

You see the abstract, never the full paper. That limit governs the whole task.

Verdicts:

- "supports"       — the abstract states the claim, or states something the claim follows directly from. Quote the span.
- "partial"        — the abstract supports some of the claim but not a specific, checkable part of it (typically a number, a threshold, a rate, or a date). Say which part is missing.
- "unsupported"    — the abstract is ON the topic of the claim and the claim's specific content is absent from it or contradicted by it.
- "not-assessable" — the abstract does not address the claim's topic at all, or is too short or too structural to tell. This is the correct answer when you are unsure.

The difference between "unsupported" and "not-assessable" is the whole point of the exercise. "unsupported" is a finding that a clinician will spend time on, so reserve it for cases where the abstract engages the topic and the claim's content is genuinely not there. If the abstract is simply about something else, that is "not-assessable".

Three patterns look like defects and are not:

1. Historical first descriptions predate their modern disease names. A 1954 paper describing a new syndrome legitimately supports "first described in 1954" without ever using the disorder's current name.
2. A paper about a DIFFERENT disorder can be correct, when the sentence is itself about that other disorder — a contrast being drawn, a differential being excluded, or a shared treatment principle.
3. Guidelines, method papers and technical standards legitimately never name a specific disorder while still supporting a claim about how a test behaves.

The prose cites at paragraph granularity, and a sentence often cites several papers jointly. You are judging ONE paper against the sentence. If this paper carries part of the claim and another plainly carries the rest, that is "partial" or "supports", not "unsupported".

Judge the sentence as written, including its numbers. A sentence giving an incidence of "~1:36,000" is not supported by an abstract that establishes only that a screened cohort exists.`;

const SCHEMA = {
  type: "object",
  properties: {
    verdicts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim_id: { type: "string" },
          verdict: { type: "string", enum: ["supports", "partial", "unsupported", "not-assessable"] },
          reason: { type: "string", description: "One sentence. What the abstract does or does not carry." },
          quote: { type: "string", description: "Verbatim span from the abstract, or empty string if none." },
        },
        required: ["claim_id", "verdict", "reason", "quote"],
        additionalProperties: false,
      },
    },
  },
  required: ["verdicts"],
  additionalProperties: false,
};

// The abstract prompt's central caveat — "you see the abstract, never the full
// paper" — is exactly what stops being true here, and every verdict definition
// turned on it. "not-assessable" was the safe answer when the evidence was a
// summary; with the body in hand it becomes a near-empty category, and
// "unsupported" stops meaning "the summary omitted it" and starts meaning the
// paper does not carry the claim. That is a finding worth a clinician's time,
// so the bar for it is raised to match.
const FULLTEXT_SYSTEM = `You check medical reference lists. For each claim you are given a sentence from a rare-metabolic-disease knowledge base and the FULL TEXT of ONE paper it cites, and you decide whether that paper supports that sentence.

You have the body of the paper, not just the abstract. A figure caption, a methods detail or a single sentence in the discussion counts as support — search the whole text before concluding something is absent. Tables and reference lists have been stripped, so a number that would only appear in a table may be genuinely unreachable; say so rather than calling it absent.

- "supports"       — the paper states the claim, or states something the claim follows directly from. Quote the span.
- "partial"        — the paper supports some of the claim but not a specific, checkable part of it (typically a number, a threshold, a rate, or a date). Say which part is missing.
- "unsupported"    — the paper is ON the topic and the claim's specific content is genuinely absent from it or contradicted by it. With the full text in hand this is a strong statement: it means you read the paper and the claim is not in it.
- "not-assessable" — the paper is about something else entirely, or the relevant content would live in a stripped table. This should be rare now that you have the body.

Judge the sentence as written, including its numbers. Reserve "unsupported" for claims you have actually looked for and failed to find.`;

function fulltextPrompt(group, paper, body) {
  const claims = group.claims.map((c) => [
    `claim_id: ${c.id}`,
    `disorder: ${c.disorderName}${c.gene ? ` (${c.gene})` : ""}`,
    `sentence: ${c.text}`,
    `paragraph it sits in: ${c.paragraph}`,
  ].join("\n")).join("\n\n---\n\n");

  return `PAPER (PMID ${group.pmid})
citation as printed: ${group.citation}
title: ${paper?.title || "(title unknown)"}

FULL TEXT
${body}

CLAIMS CITING THIS PAPER (${group.claims.length})

${claims}

Return one verdict per claim_id.`;
}

function userPrompt(group, abstract) {
  const claims = group.claims.map((c) => [
    `claim_id: ${c.id}`,
    `disorder: ${c.disorderName}${c.gene ? ` (${c.gene})` : ""}`,
    `sentence: ${c.text}`,
    `paragraph it sits in: ${c.paragraph}`,
    `other papers this sentence also cites: ${c.refs.filter((r) => r.pmid !== group.pmid).map((r) => r.text).join(" | ") || "none"}`,
  ].join("\n")).join("\n\n---\n\n");

  return `PAPER (PMID ${group.pmid})
citation as printed: ${group.citation}
title: ${abstract.title}
abstract: ${abstract.abstract || "(no abstract)"}

CLAIMS CITING THIS PAPER (${group.claims.length})

${claims}

Return one verdict per claim_id.`;
}

// ── model plumbing ──────────────────────────────────────────────────────────

// Constructed lazily: --report and --calibrate --report must work with no key set.
let _client;
const client = () => (_client ??= new Anthropic());

const REQUEST = (group, abstract) => ({
  model: MODEL,
  max_tokens: 8000,
  system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
  thinking: { type: "adaptive" },
  output_config: { effort: flagValue("--effort", "high"), format: { type: "json_schema", schema: SCHEMA } },
  messages: [{ role: "user", content: userPrompt(group, abstract) }],
});

// Long papers are capped rather than skipped. The cap is generous enough that
// almost nothing is cut, and a truncated tail is still far more evidence than
// an abstract — but it stops one 165,000-character guideline from costing more
// than the rest of a batch put together.
const MAX_BODY_CHARS = 160_000;

const FULLTEXT_REQUEST = (group, paper, body) => ({
  model: MODEL,
  max_tokens: 8000,
  system: [{ type: "text", text: FULLTEXT_SYSTEM, cache_control: { type: "ephemeral" } }],
  thinking: { type: "adaptive" },
  output_config: { effort: flagValue("--effort", "high"), format: { type: "json_schema", schema: SCHEMA } },
  messages: [{ role: "user", content: fulltextPrompt(group, paper, body.slice(0, MAX_BODY_CHARS)) }],
});

const parseVerdicts = (msg) => {
  const text = (msg?.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("");
  if (!text.trim()) throw new Error("no text block in response");
  return JSON.parse(text).verdicts;
};

// `build` turns a group into a request and `key` decides where its verdicts are
// filed, so the abstract pass and the full-text pass share one loop rather than
// drifting apart as two near-copies.
async function judgeDirect(groups, cache, build, key) {
  let done = 0;
  for (const g of groups) {
    process.stderr.write(`\r  ${++done}/${groups.length} papers`);
    try {
      const msg = await client().messages.create(build(g));
      for (const v of parseVerdicts(msg)) cache[key(g.pmid, v.claim_id)] = v;
    } catch (e) {
      console.error(`\n  ! PMID ${g.pmid}: ${e.message}`);
    }
    writeFileSync(CACHE, JSON.stringify(cache));
  }
  process.stderr.write("\n");
}

/**
 * The Batches API halves the price and is the right tool for a full corpus run.
 * Results come back in ANY order, so everything is keyed by custom_id — never
 * by position, which is the classic way to silently mis-file a whole run.
 */
async function judgeBatched(groups, cache, build, key) {
  const requests = groups.map((g) => ({ custom_id: `p${g.pmid}`, params: build(g) }));
  const byId = new Map(groups.map((g) => [`p${g.pmid}`, g]));

  console.error(`submitting ${requests.length} requests...`);
  let batch = await client().messages.batches.create({ requests });
  console.error(`batch ${batch.id} submitted; polling`);

  while (batch.processing_status !== "ended") {
    await new Promise((r) => setTimeout(r, 20000));
    batch = await client().messages.batches.retrieve(batch.id);
    process.stderr.write(`\r  ${batch.processing_status} — succeeded ${batch.request_counts?.succeeded ?? 0}, errored ${batch.request_counts?.errored ?? 0}`);
  }
  process.stderr.write("\n");

  for await (const r of await client().messages.batches.results(batch.id)) {
    const g = byId.get(r.custom_id);
    if (!g) continue;
    if (r.result?.type !== "succeeded") { console.error(`  ! ${r.custom_id}: ${r.result?.type}`); continue; }
    try {
      for (const v of parseVerdicts(r.result.message)) cache[key(g.pmid, v.claim_id)] = v;
    } catch (e) {
      console.error(`  ! ${r.custom_id}: ${e.message}`);
    }
  }
  writeFileSync(CACHE, JSON.stringify(cache));
}

const verdictKey = (pmid, claimId) => `v${PROMPT_VERSION}|${pmid}|${claimId}`;
const fulltextKey = (pmid, claimId) => `f${FULLTEXT_PROMPT_VERSION}|${pmid}|${claimId}`;

/** The best verdict held for a claim-paper pair: the full text outranks the abstract. */
const bestVerdict = (cache, pmid, claimId) =>
  cache[fulltextKey(pmid, claimId)] ?? cache[verdictKey(pmid, claimId)];

// ── selection ───────────────────────────────────────────────────────────────

/** Claims carrying a checkable quantity — the highest-yield subset to run first. */
const NUMERIC = /\b\d+([.,]\d+)?\s*(%|:\s*\d|-fold|×)|\b1\s*:\s*[\d,]{3,}|\b(19|20)\d{2}\b|\bper\s+\d/;

function selectGroups(claims, abstracts) {
  let groups = judgeablePairs(claims);
  if (arg("--numeric")) {
    groups = groups
      .map((g) => ({ ...g, claims: g.claims.filter((c) => NUMERIC.test(c.text)) }))
      .filter((g) => g.claims.length);
  }
  const missing = groups.filter((g) => !abstracts[g.pmid] || !abstracts[g.pmid].abstract);
  return {
    groups: groups.filter((g) => abstracts[g.pmid]?.abstract),
    noAbstract: missing,
  };
}

// ── aggregation and reporting ───────────────────────────────────────────────

/** A claim is escalated only when every paper it cites came back unsupported. */
function aggregate(claims, cache) {
  const rows = [];
  for (const c of claims) {
    const judged = c.refs
      .filter((r) => r.pmid)
      .map((r) => ({
        ref: r,
        v: bestVerdict(cache, r.pmid, c.id),
        source: cache[fulltextKey(r.pmid, c.id)] ? "full text" : "abstract",
      }))
      .filter((x) => x.v);
    if (!judged.length) continue;
    const verdicts = judged.map((x) => x.v.verdict);
    // Escalation turns on the ABSENCE of support, not on the presence of the
    // word "unsupported". Calibration showed the judge reaching the register's
    // own conclusion while grading it "not-assessable", because a cloning paper
    // genuinely never engages a claim about a diagnostic ratio. Requiring the
    // literal token would have hidden six of the eight known defects.
    const supported = verdicts.includes("supports");
    const contradicted = !supported && verdicts.includes("unsupported");
    rows.push({
      id: c.id, disorder: c.disorder, text: c.text,
      status: supported ? "supported" : contradicted ? "contradicted" : "unverified",
      judged: judged.map((x) => ({ pmid: x.ref.pmid, citation: x.ref.text, evidence: x.source, ...x.v })),
    });
  }
  return rows;
}

function calibrate(cache) {
  const spec = JSON.parse(readFileSync(CALIBRATION, "utf8"));
  const claims = collectClaims();
  const results = [];
  for (const kase of spec.cases) {
    const forRef = claims.filter((c) => c.disorder === kase.disorder && c.refs.some((r) => r.pmid === kase.pmidHint));
    const verdicts = forRef.map((c) => cache[verdictKey(kase.pmidHint, c.id)]).filter(Boolean);
    // A "flag" case passes when the judge declines to affirm support — any of
    // unsupported / partial / not-assessable surfaces the citation to a reader.
    // A "sound" case passes only on the strong negative: an explicit
    // "unsupported" is the verdict that would waste a clinician's time.
    const anyUnsupported = verdicts.some((v) => v.verdict === "unsupported");
    const anySupports = verdicts.some((v) => v.verdict === "supports");
    const pass = kase.expect === "flag" ? !anySupports : !anyUnsupported;
    results.push({ ...kase, claims: forRef.length, verdicts, pass: verdicts.length ? pass : null });
  }
  return results;
}

// ── main ────────────────────────────────────────────────────────────────────

if (!existsSync(ABSTRACTS)) {
  console.error("no scripts/.abstract-cache.json — run: node scripts/check-relevance.mjs");
  process.exit(1);
}
const abstracts = JSON.parse(readFileSync(ABSTRACTS, "utf8"));
const fulltexts = existsSync(FULLTEXTS) ? JSON.parse(readFileSync(FULLTEXTS, "utf8")) : {};
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
const allClaims = collectClaims();

if (arg("--calibrate")) {
  const spec = JSON.parse(readFileSync(CALIBRATION, "utf8"));

  // Assert the reference list has not shifted under the labelled set.
  const drift = [];
  for (const k of spec.cases) {
    const known = allClaims.some((x) => x.disorder === k.disorder && x.refs.some((r) => r.pmid === k.pmidHint));
    if (!known) drift.push(`${k.disorder}[${k.ref}] PMID ${k.pmidHint} is no longer cited by any claim`);
  }
  if (drift.length) { console.error("calibration set is stale:\n  " + drift.join("\n  ")); process.exit(1); }

  const wanted = new Set(spec.cases.map((k) => k.pmidHint));
  const { groups } = selectGroups(allClaims, abstracts);
  const todo = groups
    .filter((g) => wanted.has(g.pmid))
    .map((g) => ({ ...g, claims: g.claims.filter((c) => !cache[verdictKey(g.pmid, c.id)]) }))
    .filter((g) => g.claims.length);

  if (todo.length && !arg("--report")) {
    console.error(`calibration: ${todo.length} papers to judge`);
    await judgeDirect(todo, abstracts, cache);
  }

  const results = calibrate(cache);
  let pass = 0, fail = 0, skipped = 0;
  console.log(`\n=== calibration against docs/citation-claims-review.md ===\n`);
  for (const r of results) {
    const mark = r.pass === null ? "— " : r.pass ? "OK" : "!!";
    if (r.pass === null) skipped++; else r.pass ? pass++ : fail++;
    console.log(`${mark} ${r.disorder}[${r.ref}] expect ${r.expect.padEnd(5)} — ${r.claims} claim(s)`);
    for (const v of r.verdicts) console.log(`     ${v.verdict.padEnd(15)} ${v.reason}`);
    if (r.pass === false) console.log(`     WHY IT MATTERS: ${r.why}`);
  }
  console.log(`\n${pass} pass, ${fail} fail, ${skipped} not judged`);
  if (fail) console.log(`\nDo not run the full corpus until the "sound" cases clear — a judge that\nflags them trains the reader to skim.`);
  process.exit(0);
}

if (arg("--fulltext")) {
  // A second opinion, not a re-run. Only claims the abstract could not settle
  // are asked again — a claim already affirmed by its abstract needs no help,
  // and re-judging it would be most of the corpus for no new information.
  const groups = judgeablePairs(allClaims)
    .map((g) => ({
      ...g,
      claims: g.claims.filter((c) => {
        if (cache[fulltextKey(g.pmid, c.id)]) return false;
        const prior = cache[verdictKey(g.pmid, c.id)];
        return !prior || prior.verdict !== "supports";
      }),
    }))
    .filter((g) => g.claims.length && fulltexts[g.pmid]?.text);

  const pairs = groups.reduce((n, g) => n + g.claims.length, 0);
  const chars = groups.reduce((n, g) => n + Math.min(fulltexts[g.pmid].text.length, MAX_BODY_CHARS), 0);
  const tokens = Math.round(chars / 4);
  console.error(`full-text pass: ${groups.length} papers, ${pairs} claim-paper pairs`);
  console.error(`~${tokens.toLocaleString()} input tokens — about $${(tokens / 1e6 * 5).toFixed(2)} at list, half that batched`);
  const held = Object.keys(fulltexts).filter((p) => fulltexts[p].text).length;
  console.error(`${held} papers have full text; the rest are closed access and keep their abstract verdict`);

  if (!arg("--report") && groups.length) {
    const build = (g) => FULLTEXT_REQUEST(g, abstracts[g.pmid], fulltexts[g.pmid].text);
    if (arg("--batch")) await judgeBatched(groups, cache, build, fulltextKey);
    else await judgeDirect(groups, cache, build, fulltextKey);
  }
} else {
  const { groups, noAbstract } = selectGroups(allClaims, abstracts);
  const todo = groups
    .map((g) => ({ ...g, claims: g.claims.filter((c) => !cache[verdictKey(g.pmid, c.id)]) }))
    .filter((g) => g.claims.length);

  if (!arg("--report")) {
    const pairs = todo.reduce((n, g) => n + g.claims.length, 0);
    console.error(`${groups.length} papers in scope, ${todo.length} not yet judged (${pairs} claim-paper pairs)`);
    console.error(`${noAbstract.length} papers skipped: no abstract in PubMed`);
    if (todo.length) {
      const build = (g) => REQUEST(g, abstracts[g.pmid]);
      if (arg("--batch")) await judgeBatched(todo, cache, build, verdictKey);
      else await judgeDirect(todo, cache, build, verdictKey);
    }
  }
}

const rows = aggregate(allClaims, cache);
const flagged = rows.filter((r) => r.status === "contradicted");
const unverified = rows.filter((r) => r.status === "unverified");

console.log(`\n=== claim support screen (${rows.length} claims judged) ===`);
console.log(`  contradicted by every source  : ${flagged.length}`);
console.log(`  no source affirms it          : ${unverified.length}`);
console.log(`  at least one source supports  : ${rows.filter((r) => r.status === "supported").length}`);


console.log(`\n--- claims no cited abstract supports ---`);
for (const r of flagged) {
  console.log(`\n  ${r.id}`);
  console.log(`    ${r.text.slice(0, 160)}`);
  for (const j of r.judged) console.log(`    [${j.pmid}] ${j.reason}`);
}

writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), promptVersion: PROMPT_VERSION, rows }, null, 2));
console.log(`\nfull report: scripts/claim-support-report.json`);
console.log(`Nothing here is a verdict. Confirmed findings belong in docs/citation-claims-review.md, by hand.`);
