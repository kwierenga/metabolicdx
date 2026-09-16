# Papers worth obtaining by hand

Regenerate with `node scripts/fetch-fulltext.mjs --wanted --md` rather than
editing. The ranking moves as claims are settled and as papers arrive, and a
stale list sends you after something already in hand.

Full text is held for **214 of 874** cited papers. That covers the PMC
open-access set, every GeneReviews chapter (free on Bookshelf, fetched with
`--genereviews`), and the papers already stored under `docs/`.

**590** closed-access papers still carry at least one claim no abstract could
confirm. The top 40 below would settle **153** of them.

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
| ☐ | 4 | [11891283](https://pubmed.ncbi.nlm.nih.gov/11891283/) | Liu H 2002 | Proc Natl Acad Sci USA | HYPER_PRO |
| ☐ | 4 | [17538087](https://pubmed.ncbi.nlm.nih.gov/17538087/) | Enns GM 2007 | N Engl J Med | CITR1, OTC, CPS1 |
| ☐ | 4 | [12684900](https://pubmed.ncbi.nlm.nih.gov/12684900/) | Bachmann C 2003 | Eur J Pediatr | CITR1, OTC, CPS1 |
| ☐ | 4 | [26913920](https://pubmed.ncbi.nlm.nih.gov/26913920/) | Diez-Fernandez C 2016 | Genet Med | CAVA |
| ☐ | 4 | [11181649](https://pubmed.ncbi.nlm.nih.gov/11181649/) | Baumgartner MR 2001 | J Clin Invest | MCC |
| ☐ | 4 | [19177531](https://pubmed.ncbi.nlm.nih.gov/19177531/) | Menao S 2009 | Hum Mutat | HMGCL |
| ☐ | 4 | [20847235](https://pubmed.ncbi.nlm.nih.gov/20847235/) | Kranendijk M 2010 | Science | L2HGA, D2HGA |
| ☐ | 4 | [10607472](https://pubmed.ncbi.nlm.nih.gov/10607472/) | Bonnefont JP 1999 | Mol Genet Metab | CPT2 |
| ☐ | 4 | [16317551](https://pubmed.ncbi.nlm.nih.gov/16317551/) | Madsen PP 2006 | Hum Genet | 2MBD, SBCAD |
| ☐ | 4 | [12145770](https://pubmed.ncbi.nlm.nih.gov/12145770/) | Stabler SP 2002 | Metabolism | GNMT |
| ☐ | 4 | [20677779](https://pubmed.ncbi.nlm.nih.gov/20677779/) | Brownlee JM 2010 | Biochemistry | HAWKINS |
| ☐ | 4 | [12743223](https://pubmed.ncbi.nlm.nih.gov/12743223/) | Pearl PL 2003 | Neurology | GABAT |
| ☐ | 4 | [21353613](https://pubmed.ncbi.nlm.nih.gov/21353613/) | Häberle J 2011 | Mol Genet Metab | GLULSYN |
| ☐ | 4 | [22127393](https://pubmed.ncbi.nlm.nih.gov/22127393/) | Zschocke J 2012 | J Inherit Metab Dis | HSD17B10D |
| ☐ | 4 | [18926513](https://pubmed.ncbi.nlm.nih.gov/18926513/) | Sherman EA 2008 | Am J Hum Genet | GA3 |
| ☐ | 4 | [29421601](https://pubmed.ncbi.nlm.nih.gov/29421601/) | La Serna-Infantes J 2018 | Eur J Med Genet | GA3 |
| ☐ | 4 | [19136963](https://pubmed.ncbi.nlm.nih.gov/19136963/) | Tiranti V 2009 | Nat Med | ETHE1D |
| ☐ | 4 | [16275149](https://pubmed.ncbi.nlm.nih.gov/16275149/) | de Wit MC 2006 | Mol Genet Metab | MLYCD |
| ☐ | 4 | [19472175](https://pubmed.ncbi.nlm.nih.gov/19472175/) | Bröer S 2008 | J Inherit Metab Dis | HARTNUP |
| ☐ | 4 | [1404882](https://pubmed.ncbi.nlm.nih.gov/1404882/) | Mudd SH 2001 | book/chapter | CTH |
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

Also written as `docs/fulltext-wanted.csv` (`--wanted --csv`) if you would
rather work in a spreadsheet.

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

### 4 claims — PMID 11891283

*HYPER_PRO*

Liu H et al. Genetic variation at the 22q11.2 PRODH locus deregulates translation in schizophrenia. Proc Natl Acad Sci USA. 2002;99(6):3717–22.
<https://pubmed.ncbi.nlm.nih.gov/11891283/>

### 4 claims — PMID 17538087

*CITR1, OTC, CPS1*

Enns GM et al. Survival after treatment with phenylacetate and benzoate for urea-cycle disorders. N Engl J Med. 2007;356(22):2282–92.
<https://pubmed.ncbi.nlm.nih.gov/17538087/>

### 4 claims — PMID 12684900

*CITR1, OTC, CPS1*

Bachmann C. Outcome and survival of 88 patients with urea cycle disorders. Eur J Pediatr. 2003;162(6):410–6.
<https://pubmed.ncbi.nlm.nih.gov/12684900/>

### 4 claims — PMID 26913920

*CAVA*

Diez-Fernandez C et al. Defective hepatic bicarbonate production due to carbonic anhydrase VA deficiency leads to early-onset life-threatening metabolic crisis. Genet Med. 2016;18(10):991–1000.
<https://pubmed.ncbi.nlm.nih.gov/26913920/>

### 4 claims — PMID 11181649

*MCC*

Baumgartner MR et al. The molecular basis of human 3-methylcrotonyl-CoA carboxylase deficiency. J Clin Invest. 2001;107(4):495–504.
<https://pubmed.ncbi.nlm.nih.gov/11181649/>

### 4 claims — PMID 19177531

*HMGCL*

Menao S et al. Clinical, biochemical and molecular study of 24 patients with HMG-CoA lyase deficiency. Hum Mutat. 2009;30(8):E520–40.
<https://pubmed.ncbi.nlm.nih.gov/19177531/>

### 4 claims — PMID 20847235

*L2HGA, D2HGA*

Kranendijk M et al. IDH2 mutations in patients with D-2-hydroxyglutaric aciduria. Science. 2010;330(6002):336.
<https://pubmed.ncbi.nlm.nih.gov/20847235/>

### 4 claims — PMID 10607472

*CPT2*

Bonnefont JP et al. Carnitine palmitoyltransferase deficiencies. Mol Genet Metab. 1999;68(4):424–40.
<https://pubmed.ncbi.nlm.nih.gov/10607472/>

### 4 claims — PMID 16317551

*2MBD, SBCAD*

Madsen PP et al. Short/branched-chain acyl-CoA dehydrogenase deficiency due to an IVS3+3A>G mutation that causes exon skipping. Hum Genet. 2006;118(6):680–90.
<https://pubmed.ncbi.nlm.nih.gov/16317551/>

### 4 claims — PMID 12145770

*GNMT*

Stabler SP et al. Metabolic profiling of total homocysteine and related compounds in hyperhomocysteinaemia. Metabolism. 2002;51(8):981–8.
<https://pubmed.ncbi.nlm.nih.gov/12145770/>

### 4 claims — PMID 20677779

*HAWKINS*

Brownlee JM et al. Product analysis and inhibition studies of a causative Asn to Ser variant of 4-hydroxyphenylpyruvate dioxygenase suggest a simple route to the treatment of Hawkinsinuria. Biochemistry. 2010;49(33):7218–26.
<https://pubmed.ncbi.nlm.nih.gov/20677779/>

### 4 claims — PMID 12743223

*GABAT*

Pearl PL et al. Clinical spectrum of succinic semialdehyde dehydrogenase deficiency. Neurology. 2003;60(9):1413–7.
<https://pubmed.ncbi.nlm.nih.gov/12743223/>

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

### 4 claims — PMID 1404882

*CTH*

Mudd SH. Disorders of transsulfuration. In: Scriver CR et al., eds. The Metabolic and Molecular Bases of Inherited Disease. 8th ed. 2001. p. 2007–56.
<https://pubmed.ncbi.nlm.nih.gov/1404882/>

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
