import { DISORDERS } from "../src/disorders.js";
import { citationStatus } from "../src/citations.js";
const id=process.argv[2];
const d=DISORDERS.find(x=>x.id===id);
console.log(`### ${d.id} — ${d.name} (${d.category})\n`);
const refs=[...(d.narrative?.references??[])];
const fu=(d.followUp?.references??[]).filter(r=>!refs.includes(r));
refs.forEach((r,i)=>{
  const s=citationStatus(r);
  console.log(`[${i+1}] ${s.level.toUpperCase()}${s.pmid?` pmid=${s.pmid}`:""}\n    ${r}`);
});
if(fu.length){console.log("\n-- followUp-only --");fu.forEach(r=>console.log(`  ${citationStatus(r).level.toUpperCase()}  ${r}`));}
console.log("\n--- narrative text (markers show which refs back which claim) ---");
for(const[k,v]of Object.entries(d.narrative??{})){
  if(typeof v!=="string")continue;
  console.log(`\n[${k}] ${v}`);
}
