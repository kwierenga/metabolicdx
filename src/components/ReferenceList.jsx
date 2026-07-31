import { citationStatus, citationText, CITATION_LEVELS } from "../citations.js";

/**
 * The literature references on a disorder page, each marked with whether it
 * actually resolves against PubMed.
 *
 * This matters more here than it would in an ordinary bibliography. The
 * narratives were largely bulk-generated, and resolving all 1,021 unique
 * citations found that a quarter of them name a real-looking journal, volume
 * and page belonging to no paper — or to an unrelated one.
 *
 * Those are **withheld, not badged**: their bibliographic details are never
 * rendered. A fabricated citation shown with a warning is still a fabricated
 * citation on the page, and it will eventually be copied into a letter or a
 * referral. The slot is kept, and numbered, because the narrative prose cites
 * references by ordinal — removing an entry would renumber the rest and
 * mis-attribute every later claim.
 *
 * Verified references are marked by their PubMed link rather than by a badge:
 * they are the majority, and badging all of them would bury the ones that
 * warrant a second look. See scripts/check-citations.mjs.
 */
const TONE = {
  verified: "bg-emerald-50 border-emerald-200 text-emerald-700",
  check: "bg-amber-50 border-amber-200 text-amber-700",
  unverified: "bg-slate-100 border-slate-200 text-slate-500",
  wrong: "bg-rose-50 border-rose-200 text-rose-700",
};

export default function ReferenceList({refs,accent}){
  const rows=refs.map(raw=>({raw,text:citationText(raw),...citationStatus(raw)}));
  const counts=rows.reduce((a,r)=>({...a,[r.level]:(a[r.level]??0)+1}),{});

  return(
    <div className="px-5 py-3 border-b border-slate-100">
      <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{color:accent}}>References</p>
        {["verified","check","unverified","wrong"].map(l=>counts[l]?(
          <span key={l} className={`text-[9px] px-1 py-0.5 rounded border font-medium ${TONE[l]}`} title={CITATION_LEVELS[l].title}>
            {counts[l]} {CITATION_LEVELS[l].label}
          </span>
        ):null)}
      </div>
      <ol className="text-[10px] text-slate-500 leading-relaxed space-y-1 list-decimal list-inside">
        {rows.map((r,i)=>r.level==="wrong"?(
          // Nothing of the citation itself is emitted here — not the title, not
          // the journal, not the PMID it mis-resolved to.
          <li key={i} className="leading-snug">
            <span className="italic text-rose-700/80" title={CITATION_LEVELS.wrong.title}>
              Reference withheld — matches no publication in PubMed.
            </span>
          </li>
        ):(
          <li key={i} className="font-mono leading-snug">
            <span>{r.text}</span>
            {r.level==="verified"&&r.pmid&&!/PMID/i.test(r.text)&&(
              <a href={`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`} target="_blank" rel="noopener noreferrer"
                title={CITATION_LEVELS.verified.title}
                className="ml-1 text-[9px] px-1 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-medium whitespace-nowrap">
                PMID {r.pmid}
              </a>
            )}
            {r.level!=="verified"&&(
              <span className={`ml-1 text-[9px] px-1 py-0.5 rounded border font-medium whitespace-nowrap ${TONE[r.level]}`}
                title={CITATION_LEVELS[r.level].title}>
                {CITATION_LEVELS[r.level].label}
              </span>
            )}
            {r.note&&<span className="ml-1 text-[9px] italic text-slate-400">— {r.note}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
