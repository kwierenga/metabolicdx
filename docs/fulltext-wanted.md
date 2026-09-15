# Papers worth obtaining by hand

Regenerate with `node scripts/fetch-fulltext.mjs --wanted --md` rather than
editing. The ranking moves as claims are settled and as papers arrive, and a
stale list sends you after something already in hand.

Full text is held for **196 of 874** cited papers. That covers the PMC
open-access set, every GeneReviews chapter (free on Bookshelf, fetched with
`--genereviews`), and the papers already stored under `docs/`.

**608** closed-access papers still carry at least one claim no abstract could
confirm. The top 40 below would settle **179** of them.

## How to feed one back

Save it as `docs/fulltext/<PMID>.pdf` (or `.txt`) — the filename must be the
PMID — then run:

```
node scripts/fetch-fulltext.mjs --ingest
```

PDFs are converted with pdftotext. A scanned PDF with no text layer is rejected
rather than silently judged on nothing. The folder is gitignored: publisher PDFs
are not redistributable and this repository is public.

---

## The list

Ranked by claims settled. Tick as you go — the numbers shift when you re-run
`--wanted --md`, so re-tick against PMIDs rather than positions.

| ✓ | Claims | PMID | Author | Journal | Disorders |
|---|---:|---|---|---|---|
| ☐ | 6 | [5637757](https://pubmed.ncbi.nlm.nih.gov/5637757/) | Perry TL 1968 | N Engl J Med | CTH |
| ☐ | 5 | [11826276](https://pubmed.ncbi.nlm.nih.gov/11826276/) | Rinaldo P 2002 | Annu Rev Physiol | MCAD, CPT2 |
| ☐ | 5 | [20696606](https://pubmed.ncbi.nlm.nih.gov/20696606/) | Collins SA 2010 | Int J Circumpolar Health | CPT1 |
| ☐ | 5 | [17393751](https://pubmed.ncbi.nlm.nih.gov/17393751/) | van Calcar SC 2007 | Wis Med J | 2MBD, SBCAD |
| ☐ | 5 | [19235232](https://pubmed.ncbi.nlm.nih.gov/19235232/) | Tabatabaie L 2009 | Hum Mutat | PHGDH |
| ☐ | 5 | [23463425](https://pubmed.ncbi.nlm.nih.gov/23463425/) | van der Crabben SN 2013 | J Inherit Metab Dis | PSAT1, PSPH |
| ☐ | 5 | [23628343](https://pubmed.ncbi.nlm.nih.gov/23628343/) | Häberle J 2013 | Arch Biochem Biophys | GLULSYN |
| ☐ | 5 | [16278852](https://pubmed.ncbi.nlm.nih.gov/16278852/) | Robinson BH 2001 | book/chapter | PCDEF |
| ☐ | 5 | [10417274](https://pubmed.ncbi.nlm.nih.gov/10417274/) | FitzPatrick DR 1999 | Am J Hum Genet | MLYCD |
| ☐ | 5 | [9428520](https://pubmed.ncbi.nlm.nih.gov/9428520/) | Kisker C 1997 | Cell | SULFOX |
| ☐ | 5 | [16435181](https://pubmed.ncbi.nlm.nih.gov/16435181/) | Barić I 2005 | J Inherit Metab Dis | AHCY |
| ☐ | 5 | [1404882](https://pubmed.ncbi.nlm.nih.gov/1404882/) | Mudd SH 2007 | book/chapter | CTH |
| ☐ | 5 | [23296368](https://pubmed.ncbi.nlm.nih.gov/23296368/) | Wortmann SB 2013 | J Inherit Metab Dis | MGA1 |
| ☐ | 5 | [12438653](https://pubmed.ncbi.nlm.nih.gov/12438653/) | Dobson CM 2002 | Proc Natl Acad Sci USA | MCEE |
| ☐ | 5 | [10448086](https://pubmed.ncbi.nlm.nih.gov/10448086/) | Shany E 1999 | Biochem Biophys Res Commun | AKGDH |
| ☐ | 5 | [4341015](https://pubmed.ncbi.nlm.nih.gov/4341015/) | Pagliara AS 1972 | J Clin Invest | FBP1 |
| ☐ | 5 | [20631546](https://pubmed.ncbi.nlm.nih.gov/20631546/) | Kishnani PS 2010 | Genet Med | GSD3 |
| ☐ | 5 | [16549399](https://pubmed.ncbi.nlm.nih.gov/16549399/) | Jinnah HA 2006 | Brain | HPRT |
| ☐ | 4 | [22522443](https://pubmed.ncbi.nlm.nih.gov/22522443/) | Friedman J 2012 | Ann Neurol | SR_DEF |
| ☐ | 4 | [24204001](https://pubmed.ncbi.nlm.nih.gov/24204001/) | Ferrè S 2014 | J Am Soc Nephrol | PCD_DEF |
| ☐ | 4 | [11742888](https://pubmed.ncbi.nlm.nih.gov/11742888/) | Yap S 2080 | Arterioscler Thromb Vasc Biol | CBS |
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

Also written as `docs/fulltext-wanted.csv` (`--wanted --csv`) if you would
rather work in a spreadsheet.

---

## Full citations


### 6 claims — PMID 5637757

*CTH*

Perry TL et al. Cystathioninuria in two healthy siblings. N Engl J Med. 1968;278(11):590–2.
<https://pubmed.ncbi.nlm.nih.gov/5637757/>

### 5 claims — PMID 11826276

*MCAD, CPT2*

Rinaldo P et al. Fatty acid oxidation disorders. Annu Rev Physiol. 2002;64:477–502.
<https://pubmed.ncbi.nlm.nih.gov/11826276/>

### 5 claims — PMID 20696606

*CPT1*

Collins SA et al. Carnitine palmitoyltransferase 1A P479L prevalence in Nunavut. Int J Circumpolar Health. 2010;69(2):179–92.
<https://pubmed.ncbi.nlm.nih.gov/20696606/>

### 5 claims — PMID 17393751

*2MBD, SBCAD*

van Calcar SC et al. 2-Methylbutyryl-CoA dehydrogenase deficiency in Hmong infants identified by expanded newborn screen. Wis Med J. 2007;106(1):12–5.
<https://pubmed.ncbi.nlm.nih.gov/17393751/>

### 5 claims — PMID 19235232

*PHGDH*

Tabatabaie L et al. Novel mutations in 3-phosphoglycerate dehydrogenase (PHGDH) are distributed throughout the protein and result in altered enzyme kinetics. Hum Mutat. 2009;30(5):749–56.
<https://pubmed.ncbi.nlm.nih.gov/19235232/>

### 5 claims — PMID 23463425

*PSAT1, PSPH*

van der Crabben SN et al. An update on serine deficiency disorders. J Inherit Metab Dis. 2013;36(4):613–9.
<https://pubmed.ncbi.nlm.nih.gov/23463425/>

### 5 claims — PMID 23628343

*GLULSYN*

Häberle J. Clinical and biochemical aspects of primary and secondary hyperammonaemic disorders. Arch Biochem Biophys. 2013;536(2):101–8.
<https://pubmed.ncbi.nlm.nih.gov/23628343/>

### 5 claims — PMID 16278852

*PCDEF*

Robinson BH. Pyruvate carboxylase deficiency. In: Scriver CR et al., eds. The Metabolic and Molecular Bases of Inherited Disease. 8th ed. 2001. p. 2275–95.
<https://pubmed.ncbi.nlm.nih.gov/16278852/>

### 5 claims — PMID 10417274

*MLYCD*

FitzPatrick DR et al. The molecular basis of malonyl-CoA decarboxylase deficiency. Am J Hum Genet. 1999;65(2):318–26.
<https://pubmed.ncbi.nlm.nih.gov/10417274/>

### 5 claims — PMID 9428520

*SULFOX*

Kisker C et al. Molecular basis of sulfite oxidase deficiency from the structure of sulfite oxidase. Cell. 1997;91(7):973–83.
<https://pubmed.ncbi.nlm.nih.gov/9428520/>

### 5 claims — PMID 16435181

*AHCY*

Barić I et al. S-Adenosylhomocysteine hydrolase deficiency: a second patient, the first with homozygosity for a novel missense mutation. J Inherit Metab Dis. 2005;28(6):885–902.
<https://pubmed.ncbi.nlm.nih.gov/16435181/>

### 5 claims — PMID 1404882

*CTH*

Mudd SH. Disorders of transsulfuration. In: Scriver CR et al., eds. The Metabolic and Molecular Bases of Inherited Disease. 8th ed. 2001. p. 2007–56.
<https://pubmed.ncbi.nlm.nih.gov/1404882/>

### 5 claims — PMID 23296368

*MGA1*

Wortmann SB et al. Inborn errors of metabolism with 3-methylglutaconic aciduria as discriminative feature: proper classification and nomenclature. J Inherit Metab Dis. 2013;36(6):923–8.
<https://pubmed.ncbi.nlm.nih.gov/23296368/>

### 5 claims — PMID 12438653

*MCEE*

Dobson CM et al. Identification of the gene responsible for the cblA complementation group of vitamin B12-responsive methylmalonic acidaemia based on analysis of prokaryotic gene arrangements. Proc Natl Acad Sci USA. 2002;99(24):15554–9.
<https://pubmed.ncbi.nlm.nih.gov/12438653/>

### 5 claims — PMID 10448086

*AKGDH*

Shany E et al. Lipoamide dehydrogenase deficiency due to a novel mutation in the interface domain. Biochem Biophys Res Commun. 1999;262(1):163–6.
<https://pubmed.ncbi.nlm.nih.gov/10448086/>

### 5 claims — PMID 4341015

*FBP1*

Pagliara AS et al. Fructose-1,6-diphosphatase deficiency: a cause of lactic acidosis and hypoglycaemia in infancy. J Clin Invest. 1972;51(8):2115–23.
<https://pubmed.ncbi.nlm.nih.gov/4341015/>

### 5 claims — PMID 20631546

*GSD3*

Kishnani PS et al. Glycogen storage disease type III diagnosis and management guidelines. Genet Med. 2010;12(7):446–63.
<https://pubmed.ncbi.nlm.nih.gov/20631546/>

### 5 claims — PMID 16549399

*HPRT*

Jinnah HA et al. Delineation of the motor disorder of Lesch-Nyhan disease. Brain. 2006;129(Pt 5):1201–17.
<https://pubmed.ncbi.nlm.nih.gov/16549399/>

### 4 claims — PMID 22522443

*SR_DEF*

Friedman J et al. Sepiapterin reductase deficiency: a treatable mimic of cerebral palsy. Ann Neurol. 2012;71(4):520–30.
<https://pubmed.ncbi.nlm.nih.gov/22522443/>

### 4 claims — PMID 24204001

*PCD_DEF*

Ferrè S et al. Mutations in PCBD1 cause hypomagnesemia and renal magnesium wasting. J Am Soc Nephrol. 2014;25(3):574–86.
<https://pubmed.ncbi.nlm.nih.gov/24204001/>

### 4 claims — PMID 11742888

*CBS*

Yap S et al. Vascular outcome in patients with homocystinuria due to cystathionine beta-synthase deficiency treated chronically: a multicenter observational study. Arterioscler Thromb Vasc Biol. 2001;21(12):2080–5.
<https://pubmed.ncbi.nlm.nih.gov/11742888/>

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
