# Papers worth obtaining by hand

Regenerate with `node scripts/fetch-fulltext.mjs --wanted --md` rather than
editing. The ranking moves as claims are settled and as papers arrive, and a
stale list sends you after something already in hand.

Full text is held for **228 of 867** cited papers. That covers the PMC
open-access set, every GeneReviews chapter (free on Bookshelf, fetched with
`--genereviews`), and the papers already stored under `docs/`.

**573** closed-access papers still carry at least one claim no abstract could
confirm. The top 30 below would settle **110** of them.

## How to feed one back

Drop it in `docs/fulltext/` under whatever name the journal site gave it, then
run:

```
node scripts/fetch-fulltext.mjs --ingest
```

`<PMID>.pdf` is the surest name, but a file called `Wolf 2012.pdf` is identified
from its own first page. A scan with no text layer is OCRed with the renderer and
OCR engine built into Windows, so an old paper that is a photograph of a page
still gets read. The folder is gitignored: publisher PDFs are not redistributable
and this repository is public.

---

## The list

Ranked by claims settled. Tick as you go — the numbers shift when you re-run
`--wanted --md`, so re-tick against PMIDs rather than positions.

| ✓ | Claims | PMID | Author | Journal | Disorders |
|---|---:|---|---|---|---|
| ☐ | 5 | [11826276](https://pubmed.ncbi.nlm.nih.gov/11826276/) | Rinaldo P 2002 | Annu Rev Physiol | MCAD, CPT2 |
| ☐ | 5 | [17393751](https://pubmed.ncbi.nlm.nih.gov/17393751/) | van Calcar SC 2007 | Wis Med J | 2MBD, SBCAD |
| ☐ | 4 | [1356171](https://pubmed.ncbi.nlm.nih.gov/1356171/) | Chitayat D 1992 | J Inherit Metab Dis | TYR2 |
| ☐ | 4 | [21353613](https://pubmed.ncbi.nlm.nih.gov/21353613/) | Häberle J 2011 | Mol Genet Metab | GLULSYN |
| ☐ | 4 | [22127393](https://pubmed.ncbi.nlm.nih.gov/22127393/) | Zschocke J 2012 | J Inherit Metab Dis | HSD17B10D |
| ☐ | 4 | [18926513](https://pubmed.ncbi.nlm.nih.gov/18926513/) | Sherman EA 2008 | Am J Hum Genet | GA3 |
| ☐ | 4 | [29421601](https://pubmed.ncbi.nlm.nih.gov/29421601/) | La Serna-Infantes J 2018 | Eur J Med Genet | GA3 |
| ☐ | 4 | [19136963](https://pubmed.ncbi.nlm.nih.gov/19136963/) | Tiranti V 2009 | Nat Med | ETHE1D |
| ☐ | 4 | [16275149](https://pubmed.ncbi.nlm.nih.gov/16275149/) | de Wit MC 2006 | Mol Genet Metab | MLYCD |
| ☐ | 4 | [19472175](https://pubmed.ncbi.nlm.nih.gov/19472175/) | Bröer S 2008 | J Inherit Metab Dis | HARTNUP |
| ☐ | 4 | [12434311](https://pubmed.ncbi.nlm.nih.gov/12434311/) | IJlst L 2002 | Am J Hum Genet | MGA1 |
| ☐ | 4 | [16601864](https://pubmed.ncbi.nlm.nih.gov/16601864/) | Struys EA 2006 | J Inherit Metab Dis | D2HGA |
| ☐ | 4 | [28588020](https://pubmed.ncbi.nlm.nih.gov/28588020/) | Stein EM 2017 | Blood | D2HGA |
| ☐ | 4 | [34687058](https://pubmed.ncbi.nlm.nih.gov/34687058/) | Gorce M 2022 | J Inherit Metab Dis | FBP1 |
| ☐ | 4 | [21910240](https://pubmed.ncbi.nlm.nih.gov/21910240/) | Alfadhel M 2011 | Am J Med Genet A | CBLF |
| ☐ | 4 | [5050553](https://pubmed.ncbi.nlm.nih.gov/5050553/) | Nyhan WL 1972 | Arch Intern Med | HPRT |
| ☐ | 4 | [6775961](https://pubmed.ncbi.nlm.nih.gov/6775961/) | Webster DR 2001 | book/chapter | UMPS |
| ☐ | 4 | [23385875](https://pubmed.ncbi.nlm.nih.gov/23385875/) | El-Hattab AW 2013 | Neurotherapeutics | SUCLA2 |
| ☐ | 3 | [20971365](https://pubmed.ncbi.nlm.nih.gov/20971365/) | Blau N 2010 | Lancet | PKU |
| ☐ | 3 | [22885033](https://pubmed.ncbi.nlm.nih.gov/22885033/) | Larochelle J 2012 | Mol Genet Metab | TYR1 |
| ☐ | 3 | [11916315](https://pubmed.ncbi.nlm.nih.gov/11916315/) | Ellaway CJ 2001 | J Inherit Metab Dis | TYR3 |
| ☐ | 3 | [12501223](https://pubmed.ncbi.nlm.nih.gov/12501223/) | Phornphutkul C 2002 | N Engl J Med | ALKAPT |
| ☐ | 3 | [12111366](https://pubmed.ncbi.nlm.nih.gov/12111366/) | Saheki T 2002 | J Hum Genet | CITR1, CITR2 |
| ☐ | 3 | [14680984](https://pubmed.ncbi.nlm.nih.gov/14680984/) | Kobayashi K 2003 | Mol Genet Metab | CITR2 |
| ☐ | 3 | [15542392](https://pubmed.ncbi.nlm.nih.gov/15542392/) | Tazawa Y 2004 | J Pediatr | CITR2 |
| ☐ | 3 | [1720458](https://pubmed.ncbi.nlm.nih.gov/1720458/) | Maestri NE 1991 | J Pediatr | OTC |
| ☐ | 3 | [15868473](https://pubmed.ncbi.nlm.nih.gov/15868473/) | Nassogne MC 2005 | J Inherit Metab Dis | CPS1 |
| ☐ | 3 | [11092761](https://pubmed.ncbi.nlm.nih.gov/11092761/) | Baumgartner MR 2000 | Hum Mol Genet | P5CS |
| ☐ | 3 | [15517380](https://pubmed.ncbi.nlm.nih.gov/15517380/) | Baumgartner MR 2005 | Eur J Pediatr | P5CS |
| ☐ | 3 | [18478038](https://pubmed.ncbi.nlm.nih.gov/18478038/) | Bicknell LS 2008 | Eur J Hum Genet | P5CS |

Also written as `docs/fulltext-wanted.csv` (`--wanted --csv`) if you would
rather work in a spreadsheet.

---

## No PMID to look them up by

**52** citations carry claims and have no PubMed id at all, so they never
appear in the ranking above. Most are book chapters, which are not indexed;
a few are GeneReviews chapters whose citation did not resolve, and those are
free on Bookshelf; the rest are journal articles the resolver could not
identify. Drop any of them in `docs/fulltext/` under any name — the ingest
identifies a paper from its own first page — though one with no PMID in the
knowledge base cannot be matched automatically, so name those by PMID once
you have it.

| Claims | Where to get it | Disorders | Citation |
|---:|---|---|---|
| 9 | book chapter (library) | HYPER_PRO, HYPERPROII | Phang JM et al. Proline metabolism and neurological function. In: Scriver et al., OMMBID. |
| 8 | book chapter (library) | TYR2, TYR3 | Chakrapani A et al. Disorders of tyrosine metabolism. In: Saudubray JM et al. (eds). Inborn Metabolic Diseases. 6th ed. Springer; 2016. |
| 7 | book chapter (library) | CBS | Mudd SH et al. Disorders of transsulfuration. In: Scriver et al., OMMBID, ch. 88. |
| 7 | book chapter (library) | HARTNUP | Levy HL. Hartnup disorder. In: Scriver CR et al., eds. The Metabolic and Molecular Bases of Inherited Disease. 8th ed. 2001. p. 4957–69. |
| 6 | book chapter (library) | HHH, OAT | Valle D, Simell O. The hyperornithinemias. In: Scriver et al., OMMBID, ch. 83. |
| 5 | book chapter (library) | HYDROXYPROLINEMIA | Phang JM et al. Disorders of proline and hydroxyproline metabolism. In: Scriver CR et al., eds. The Metabolic and Molecular Bases of Inherited Disease. 8th ed. McGraw-Hill; 2001. p. 1821–38. |
| 5 | book chapter (library) | SARC | Scott CR. Sarcosinaemia. In: Scriver CR et al., eds. The Metabolic and Molecular Bases of Inherited Disease. 8th ed. McGraw-Hill; 2001. p. 2057–60. |
| 4 | book chapter (library) | PTPS, GTPCH1 | Blau N et al. Disorders of tetrahydrobiopterin and related biogenic amines. In: Scriver et al., OMMBID. |
| 4 | book chapter (library) | HAWKINS | Chakrapani A et al. Disorders of tyrosine metabolism. In: Saudubray JM et al., eds. Inborn Metabolic Diseases. 6th ed. Springer; 2016. p. 265–76. |
| 4 | journal article (no PMID resolved) | HYPERLYS | Dancis J et al. The familial hyperlysinaemias. J Pediatr. 1983;103(5):689–95. |
| 4 | journal article (no PMID resolved) | GA3 | Knerr I et al. Glutaric aciduria type III: a distinct non-disease? Dev Med Child Neurol. 2002;44(11):787–91. |
| 4 | book chapter (library) | PCDEF | Robinson BH. Pyruvate carboxylase deficiency. In: Scriver CR et al., eds. The Metabolic and Molecular Bases of Inherited Disease. 8th ed. 2001. p. 2275–95. |
| 4 | book chapter (library) | CTH | Mudd SH. Disorders of transsulfuration. In: Scriver CR et al., eds. The Metabolic and Molecular Bases of Inherited Disease. 8th ed. 2001. p. 2007–56. |
| 3 | book chapter (library) | MSUD | Chuang DT, Shih VE. Maple syrup urine disease (branched-chain ketoaciduria). In: Scriver et al., OMMBID, ch. 87. |
| 3 | book chapter (library) | NKH | Hamosh A, Johnston MV. Nonketotic hyperglycinemia. In: Scriver et al., OMMBID, ch. 90. |
| 3 | journal article (no PMID resolved) | GAMT | Pasquali M et al. GAMT: a new disorder added to the Recommended Uniform Screening Panel. Mol Genet Metab. 2023. |
| 3 | book chapter (library) | GA2 | Frerman FE, Goodman SI. Defects of electron transfer flavoprotein. In: Scriver et al., OMMBID. |
| 3 | journal article (no PMID resolved) | MCAD | Derks TGJ, van Spronsen FJ. Medium-chain acyl-CoA dehydrogenase deficiency: still an early death risk? J Pediatr. 2009;154(2):170–1. |
| 3 | book chapter (library) | PROLIDASE | Royce PM, Steinmann B. Prolidase deficiency. In: Connective Tissue and its Heritable Disorders. 2nd ed. Wiley-Liss; 2002. p. 727–45. |
| 3 | journal article (no PMID resolved) | HISTID | Taylor RG et al. Histidinaemia: an update. Mol Genet Metab. 2005;85(1):1–13. |
| 3 | book chapter (library) | HISTID | Scriver CR, Levy HL. Histidinaemia part 2: impact on laboratory medicine and public health. N Engl J Med. 1983;308(16):993–7. |
| 3 | book chapter (library) | BALA | Scriver CR, Perry TL. Disorders of β-alanine and related compounds. In: Scriver CR et al., eds. The Metabolic and Molecular Bases of Inherited Disease. 8th ed. McGraw-Hill; 2001. p. 2079–85. |
| 3 | book chapter (library) | GSD1A | Chen YT, Burchell A. Glycogen storage diseases. In: Scriver CR et al., eds. The Metabolic and Molecular Bases of Inherited Disease. 8th ed. 2001. p. 1521–51. |
| 2 | journal article (no PMID resolved) | CITR1 | Häberle J et al. Citrullinemia type I: clinical findings and treatment. Eur J Pediatr. 2002;161 Suppl 2:S96–102. |
| 2 | book chapter (library) | GATM | Stockler-Ipsiroglu S, Schulze A. Creatine disorders. In: Sarafoglou et al., Pediatric Endocrinology and IEM. 2nd ed. |
| 2 | journal article (no PMID resolved) | SLC6A8 | Dover GJ et al. Cyclocreatine: first-in-human trial for SLC6A8 deficiency. J Inherit Metab Dis. 2022. |
| 2 | book chapter (library) | GA1 | Goodman SI, Frerman FE. Organic acidemias due to defects in lysine oxidation. In: Scriver et al., OMMBID, ch. 92. |
| 2 | book chapter (library) | SULFOX, MOCO | Johnson JL, Duran M. Molybdenum cofactor deficiency and isolated sulfite oxidase deficiency. In: Scriver CR et al., eds. The Metabolic and Molecular Bases of Inherited Disease. 8th ed. 2001. p. 3163–77. |
| 2 | journal article (no PMID resolved) | AKGDH | Bao X et al. Clinical and molecular studies of Chinese patients with mitochondrial α-ketoglutarate dehydrogenase deficiency. Mol Genet Metab Rep. 2014;1:90–4. |
| 2 | book chapter (library) | TCN2 | Rosenblatt DS. Inborn errors of folate and cobalamin metabolism. In: Scriver CR et al., eds. The Metabolic and Molecular Bases of Inherited Disease. 8th ed. 2001. p. 3897–933. |
| 1 | book chapter (library) | DRD | Hyland K, Heales SJ. Tetrahydrobiopterin and inborn errors of biogenic amine metabolism. In: Scriver et al., OMMBID. |
| 1 | journal article (no PMID resolved) | TYR1 | Sakai K, Kitagawa T. An atypical case of tyrosinosis. Jikeikai Med J. 1957;4:1–15. |
| 1 | journal article (no PMID resolved) | TYR2 | Richner H. Hornhautaffektion bei Keratoma palmare et plantare. Klin Monatsbl Augenheilkd. 1938;100:580–8. |
| 1 | book chapter (library) | TYR2 | Goldsmith LA. Tyrosinemia II. In: Scriver et al., OMMBID. |
| 1 | journal article (no PMID resolved) | ALKAPT | HGD mutation database: www.hgddatabase.cvtisr.sk. |
| 1 | journal article (no PMID resolved) | CITR1 | McMurray WC et al. Citrullinuria: a new aminoaciduria associated with mental retardation. Lancet. 1962;1(7231):138. |
| 1 | journal article (no PMID resolved) | CITR1 | Matsuura T et al. Citrullinemia. Hum Mutat. 2000;15(1):125. |
| 1 | journal article (no PMID resolved) | OAT | Jacobsohn E. Ein Fall von Retinitis pigmentosa atypica. Klin Monatsbl Augenheilk. 1888;26:202. |
| 1 | journal article (no PMID resolved) | BKT | Miller MJ et al. Recommendations for the diagnosis and management of FAO disorders. Mol Genet Metab. 2021. |
| 1 | book chapter (library) | GA1 | Gallagher RC et al. Glutaric acidemia, type I — ACMG ACT sheet. Genet Med. 2018;20(12):1574–87. |
| 1 | journal article (no PMID resolved) | PDE | Plecko B et al. Paediatric epilepsy — the pyridoxine-responsive and pyridoxine-dependent forms. Eur J Paediatr Neurol. 2016. |
| 1 | journal article (no PMID resolved) | GA2 | Goodman SI et al. The molecular basis of glutaric aciduria, type II. Am J Hum Genet. 1985;37(6):A12. |
| 1 | journal article (no PMID resolved) | MTHFR | Schiff M et al. Should metabolic diseases be systematically screened in non-traumatic neurological disease in children? Orphanet J Rare Dis. 2011;6:10. |
| 1 | book chapter (library) | HYPERLYS | Ghadimi H et al. Familial hyperlysinaemia: a new inborn error of metabolism? Proc Soc Exp Biol Med. 1965;119(1):101–3. |
| 1 | book chapter (library) | SARC | Gerritsen T, Waisman HA. Hypersarcosinaemia. In: Stanbury JB et al., eds. The Metabolic Basis of Inherited Disease. 3rd ed. 1972. p. 383–8. |
| 1 | book chapter (library) | PDHD | Robinson BH et al. Lactic acidaemia: disorders of pyruvate carboxylase, pyruvate dehydrogenase. In: Scriver CR et al., eds. The Metabolic and Molecular Bases of Inherited Disease. 8th ed. 2001. p. 2275–95. |
| 1 | journal article (no PMID resolved) | CANAVAN | Canavan MM. Schilder's encephalitis periaxialis diffusa. Arch Neurol Psychiatry. 1931;25:299–308. |
| 1 | journal article (no PMID resolved) | MGA1 | Wortmann SB et al. The 3-methylglutaconic acidurias: what's new? J Inherit Metab Dis. 2012;35(1):13–22. |
| 1 | journal article (no PMID resolved) | GALT | von Reuss A. Zuckerausscheidung im Sauglingsalter. Wien Med Wochenschr. 1908;58:799–803. |
| 1 | book chapter (library) | FBP1 | Gitzelmann R et al. Fructose-1-phosphate aldolase deficiency (hereditary fructose intolerance) and fructose-1,6-bisphosphatase deficiency. In: The Metabolic and Molecular Bases of Inherited Disease. 8th ed. 2001. p. 1489–520. |
| 1 | journal article (no PMID resolved) | GSD1A | von Gierke E. Hepato-nephromegalia glykogenica. Beitr Pathol Anat. 1929;82:497–513. |
| 1 | book chapter (library) | HPRT | Jinnah HA, Friedmann T. Lesch-Nyhan disease and its variants. In: The Metabolic and Molecular Bases of Inherited Disease. 8th ed. 2001. p. 2537–70. |

---

## Full citations


### 5 claims — PMID 11826276

*MCAD, CPT2*

Rinaldo P et al. Fatty acid oxidation disorders. Annu Rev Physiol. 2002;64:477–502.
<https://pubmed.ncbi.nlm.nih.gov/11826276/>

### 5 claims — PMID 17393751

*2MBD, SBCAD*

van Calcar SC et al. 2-Methylbutyryl-CoA dehydrogenase deficiency in Hmong infants identified by expanded newborn screen. Wis Med J. 2007;106(1):12–5.
<https://pubmed.ncbi.nlm.nih.gov/17393751/>

### 4 claims — PMID 1356171

*TYR2*

Chitayat D et al. Hereditary tyrosinaemia type II in a consanguineous Ashkenazi Jewish family: intrafamilial variation in phenotype; absence of parental phenotype effects on the fetus. J Inherit Metab Dis. 1992;15(2):198–203.
<https://pubmed.ncbi.nlm.nih.gov/1356171/>

### 4 claims — PMID 21353613

*GLULSYN*

Häberle J et al. Natural course of glutamine synthetase deficiency in a 3-year-old patient. Mol Genet Metab. 2011;103(1):89–91.
<https://pubmed.ncbi.nlm.nih.gov/21353613/>

### 4 claims — PMID 22127393

*HSD17B10D*

Zschocke J. HSD10 disease: clinical consequences of mutations in the HSD17B10 gene. J Inherit Metab Dis. 2012;35(1):81–9.
<https://pubmed.ncbi.nlm.nih.gov/22127393/>

### 4 claims — PMID 18926513

*GA3*

Sherman EA et al. Genetic mapping of glutaric aciduria type 3 to chromosome 7 and identification of mutations in C7orf10. Am J Hum Genet. 2008;83(5):604–9.
<https://pubmed.ncbi.nlm.nih.gov/18926513/>

### 4 claims — PMID 29421601

*GA3*

La Serna-Infantes J et al. Novel contiguous gene deletion in Peruvian girl with trichothiodystrophy type 4 and glutaric aciduria type 3. Eur J Med Genet. 2018;61(7):388–92.
<https://pubmed.ncbi.nlm.nih.gov/29421601/>

### 4 claims — PMID 19136963

*ETHE1D*

Tiranti V et al. Loss of ETHE1, a mitochondrial dioxygenase, causes fatal sulphide toxicity in ethylmalonic encephalopathy. Nat Med. 2009;15(2):200–5.
<https://pubmed.ncbi.nlm.nih.gov/19136963/>

### 4 claims — PMID 16275149

*MLYCD*

de Wit MC et al. Brain abnormalities in a case of malonyl-CoA decarboxylase deficiency. Mol Genet Metab. 2006;87(2):102–6.
<https://pubmed.ncbi.nlm.nih.gov/16275149/>

### 4 claims — PMID 19472175

*HARTNUP*

Bröer S. The role of the neutral amino acid transporter B⁰AT1 in Hartnup disorder and glucose homeostasis. J Inherit Metab Dis. 2008;31(4):529–36.
<https://pubmed.ncbi.nlm.nih.gov/19472175/>

### 4 claims — PMID 12434311

*MGA1*

IJlst L et al. 3-Methylglutaconic aciduria type I is caused by mutations in AUH. Am J Hum Genet. 2002;71(6):1463–6.
<https://pubmed.ncbi.nlm.nih.gov/12434311/>

### 4 claims — PMID 16601864

*D2HGA*

Struys EA. D-2-Hydroxyglutaric aciduria: unravelling the biochemical pathway and the genetic defect. J Inherit Metab Dis. 2006;29(1):21–9.
<https://pubmed.ncbi.nlm.nih.gov/16601864/>

### 4 claims — PMID 28588020

*D2HGA*

Stein EM et al. Enasidenib in mutant IDH2 relapsed or refractory acute myeloid leukemia. Blood. 2017;130(6):722–31.
<https://pubmed.ncbi.nlm.nih.gov/28588020/>

### 4 claims — PMID 34687058

*FBP1*

Gorce M et al. Fructose-1,6-bisphosphatase deficiency causes fatty liver disease and requires long-term hepatic follow-up. J Inherit Metab Dis. 2022;45(2):215–22.
<https://pubmed.ncbi.nlm.nih.gov/34687058/>

### 4 claims — PMID 21910240

*CBLF*

Alfadhel M et al. Eighteen-year follow-up of a patient with cobalamin F disease (cblF): report and review. Am J Med Genet A. 2011;155A(10):2571–7.
<https://pubmed.ncbi.nlm.nih.gov/21910240/>

### 4 claims — PMID 5050553

*HPRT*

Nyhan WL. Clinical features of the Lesch-Nyhan syndrome. Arch Intern Med. 1972;130(2):186–92.
<https://pubmed.ncbi.nlm.nih.gov/5050553/>

### 4 claims — PMID 6775961

*UMPS*

Webster DR et al. Hereditary orotic aciduria and other disorders of pyrimidine metabolism. In: The Metabolic and Molecular Bases of Inherited Disease. 8th ed. 2001. p. 2663–702.
<https://pubmed.ncbi.nlm.nih.gov/6775961/>

### 4 claims — PMID 23385875

*SUCLA2*

El-Hattab AW, Scaglia F. Mitochondrial DNA depletion syndromes: review and updates of genetic basis, manifestations, and therapeutic options. Neurotherapeutics. 2013;10(2):186–98.
<https://pubmed.ncbi.nlm.nih.gov/23385875/>

### 3 claims — PMID 20971365

*PKU*

Blau N, van Spronsen FJ, Levy HL. Phenylketonuria. Lancet. 2010;376(9750):1417–27.
<https://pubmed.ncbi.nlm.nih.gov/20971365/>

### 3 claims — PMID 22885033

*TYR1*

Larochelle J et al. Effect of nitisinone treatment on HCC in tyrosinaemia type 1. Mol Genet Metab. 2012;107(1–2):49–54.
<https://pubmed.ncbi.nlm.nih.gov/22885033/>

### 3 claims — PMID 11916315

*TYR3*

Ellaway CJ et al. Outcome of tyrosinaemia type III. J Inherit Metab Dis. 2001;24(8):824–32.
<https://pubmed.ncbi.nlm.nih.gov/11916315/>

### 3 claims — PMID 12501223

*ALKAPT*

Phornphutkul C et al. Natural history of alkaptonuria. N Engl J Med. 2002;347(26):2111–21.
<https://pubmed.ncbi.nlm.nih.gov/12501223/>

### 3 claims — PMID 12111366

*CITR1, CITR2*

Saheki T, Kobayashi K. Mitochondrial aspartate glutamate carrier (citrin) deficiency as the cause of adult-onset type II citrullinemia (CTLN2) and idiopathic neonatal hepatitis (NICCD). J Hum Genet. 2002;47(7):333–41.
<https://pubmed.ncbi.nlm.nih.gov/12111366/>

### 3 claims — PMID 14680984

*CITR2*

Kobayashi K et al. Screening of nine SLC25A13 mutations. Mol Genet Metab. 2003;80(1–2):207–13.
<https://pubmed.ncbi.nlm.nih.gov/14680984/>

### 3 claims — PMID 15542392

*CITR2*

Tazawa Y et al. Clinical heterogeneity of neonatal intrahepatic cholestasis caused by citrin deficiency. J Pediatr. 2004;145(2):231–8.
<https://pubmed.ncbi.nlm.nih.gov/15542392/>

### 3 claims — PMID 1720458

*OTC*

Maestri NE et al. Prospective treatment of urea cycle disorders. J Pediatr. 1991;119(6):923–8.
<https://pubmed.ncbi.nlm.nih.gov/1720458/>

### 3 claims — PMID 15868473

*CPS1*

Nassogne MC et al. Urea cycle defects: management and outcome. J Inherit Metab Dis. 2005;28(3):407–14.
<https://pubmed.ncbi.nlm.nih.gov/15868473/>

### 3 claims — PMID 11092761

*P5CS*

Baumgartner MR et al. Hyperammonaemia with reduced ornithine, citrulline, arginine and proline: a new inborn error caused by a mutation in the gene encoding Δ¹-pyrroline-5-carboxylate synthase. Hum Mol Genet. 2000;9(19):2853–8.
<https://pubmed.ncbi.nlm.nih.gov/11092761/>

### 3 claims — PMID 15517380

*P5CS*

Baumgartner MR et al. Δ¹-pyrroline-5-carboxylate synthase deficiency: neurodegeneration, cataracts and connective-tissue manifestations combined with hyperammonaemia and reduced ornithine, citrulline, arginine and proline. Eur J Pediatr. 2005;164(1):31–6.
<https://pubmed.ncbi.nlm.nih.gov/15517380/>

### 3 claims — PMID 18478038

*P5CS*

Bicknell LS et al. A missense mutation in ALDH18A1, encoding Δ¹-pyrroline-5-carboxylate synthase (P5CS), causes an autosomal recessive neurocutaneous syndrome. Eur J Hum Genet. 2008;16(10):1176–86.
<https://pubmed.ncbi.nlm.nih.gov/18478038/>
