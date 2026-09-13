# Papers worth obtaining by hand

Regenerate with `node scripts/fetch-fulltext.mjs --wanted --md` rather than
editing. The ranking moves as claims are settled and as papers arrive, and a
stale list sends you after something already in hand.

Full text is held for **167 of 876** cited papers. That covers the PMC
open-access set, every GeneReviews chapter (free on Bookshelf, fetched with
`--genereviews`), and the papers already stored under `docs/`.

**639** closed-access papers still carry at least one claim no abstract could
confirm. The top 60 below would settle **369** of them.

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
| ☐ | 26 | [30982989](https://pubmed.ncbi.nlm.nih.gov/30982989/) | Häberle J 2019 | J Inherit Metab Dis | CITR1, ASA_AC, ARG1, OTC, CPS1, NAGS, CAVA, HHH |
| ☐ | 18 | [21312325](https://pubmed.ncbi.nlm.nih.gov/21312325/) | Watkins D 2011 | Am J Med Genet C Semin Med Genet | CBLE, CBLF, CBLJ, TCN2 |
| ☐ | 14 | [21479626](https://pubmed.ncbi.nlm.nih.gov/21479626/) | Sass JO 2012 | J Inherit Metab Dis | BKT, SCOT, HMGCS2D |
| ☐ | 14 | [19452263](https://pubmed.ncbi.nlm.nih.gov/19452263/) | Spiekerkoetter U 2009 | J Inherit Metab Dis | MCAD, VLCAD, LCHAD, CPT1 |
| ☐ | 11 | [27161889](https://pubmed.ncbi.nlm.nih.gov/27161889/) | El-Hattab AW 2016 | Mol Genet Metab | PHGDH, PSAT1, PSPH |
| ☐ | 11 | [16763900](https://pubmed.ncbi.nlm.nih.gov/16763900/) | de Koning TJ 2006 | J Inherit Metab Dis | PHGDH, PSAT1, PSPH |
| ☐ | 7 | [18563633](https://pubmed.ncbi.nlm.nih.gov/18563633/) | Fowler B 2008 | J Inherit Metab Dis | MMA, MCEE |
| ☐ | 7 | [16950638](https://pubmed.ncbi.nlm.nih.gov/16950638/) | Korman SH 2006 | Mol Genet Metab | 2MBD, HSD17B10D, SBCAD |
| ☐ | 7 | [22108709](https://pubmed.ncbi.nlm.nih.gov/22108709/) | Watkins D 2012 | J Inherit Metab Dis | MTHFR |
| ☐ | 7 | [23561848](https://pubmed.ncbi.nlm.nih.gov/23561848/) | Nota B 2013 | Am J Hum Genet | D2HGA, SLC25A1 |
| ☐ | 6 | [12003346](https://pubmed.ncbi.nlm.nih.gov/12003346/) | Shintaku H 2002 | Curr Drug Metab | PKU, PTPS |
| ☐ | 6 | [26100751](https://pubmed.ncbi.nlm.nih.gov/26100751/) | Wijemanne S 2015 | Nat Rev Neurol | DRD |
| ☐ | 6 | [11161836](https://pubmed.ncbi.nlm.nih.gov/11161836/) | Fukao T 2001 | Mol Genet Metab | BKT |
| ☐ | 6 | [16926354](https://pubmed.ncbi.nlm.nih.gov/16926354/) | van Maldegem BT 2006 | JAMA | SCAD |
| ☐ | 6 | [19304569](https://pubmed.ncbi.nlm.nih.gov/19304569/) | Espinós C 2009 | J Med Genet | UROCA |
| ☐ | 6 | [25860818](https://pubmed.ncbi.nlm.nih.gov/25860818/) | Hagen J 2015 | J Inherit Metab Dis | DHTKD1 |
| ☐ | 6 | [22525402](https://pubmed.ncbi.nlm.nih.gov/22525402/) | van Kuilenburg AB 2012 | Biochim Biophys Acta | BALA |
| ☐ | 6 | [20598931](https://pubmed.ncbi.nlm.nih.gov/20598931/) | Marin-Valencia I 2010 | Mol Genet Metab | PCDEF |
| ☐ | 6 | [12754701](https://pubmed.ncbi.nlm.nih.gov/12754701/) | Reiss J 2003 | Hum Mutat | SULFOX, MOCO |
| ☐ | 6 | [5637757](https://pubmed.ncbi.nlm.nih.gov/5637757/) | Perry TL 1968 | N Engl J Med | CTH |
| ☐ | 5 | [19234759](https://pubmed.ncbi.nlm.nih.gov/19234759/) | Longo N 2009 | J Inherit Metab Dis | DHPR |
| ☐ | 5 | [24881969](https://pubmed.ncbi.nlm.nih.gov/24881969/) | Frazier DM 2014 | Mol Genet Metab | MSUD |
| ☐ | 5 | [24530203](https://pubmed.ncbi.nlm.nih.gov/24530203/) | van Karnebeek CDM 2014 | Am J Hum Genet | CAVA |
| ☐ | 5 | [12872837](https://pubmed.ncbi.nlm.nih.gov/12872837/) | Koeberl DD 2003 | J Inherit Metab Dis | MCC, IBD |
| ☐ | 5 | [22241090](https://pubmed.ncbi.nlm.nih.gov/22241090/) | Wolf B 2012 | Genet Med | MCC, MCD |
| ☐ | 5 | [17692550](https://pubmed.ncbi.nlm.nih.gov/17692550/) | Pié J 2007 | Mol Genet Metab | HMGCL |
| ☐ | 5 | [12888986](https://pubmed.ncbi.nlm.nih.gov/12888986/) | Strauss KA 2003 | Am J Med Genet C | GA1 |
| ☐ | 5 | [16491085](https://pubmed.ncbi.nlm.nih.gov/16491085/) | Mills PB 2006 | Nat Med | PDE, PIPOX |
| ☐ | 5 | [9686819](https://pubmed.ncbi.nlm.nih.gov/9686819/) | Suormala T 1998 | Eur J Pediatr | MCD |
| ☐ | 5 | [17208640](https://pubmed.ncbi.nlm.nih.gov/17208640/) | Wilcken B 2007 | Lancet | MCAD |
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
| ☐ | 4 | [18317232](https://pubmed.ncbi.nlm.nih.gov/18317232/) | Primassin S 2008 | Pediatr Res | VLCAD, LCHAD |
| ☐ | 4 | [10607472](https://pubmed.ncbi.nlm.nih.gov/10607472/) | Bonnefont JP 1999 | Mol Genet Metab | CPT2 |

Also written as `docs/fulltext-wanted.csv` (`--wanted --csv`) if you would
rather work in a spreadsheet.

---

## Full citations


### 26 claims — PMID 30982989

*CITR1, ASA_AC, ARG1, OTC, CPS1, NAGS, CAVA, HHH*

Häberle J et al. Suggested guidelines for the diagnosis and management of urea cycle disorders: first revision. J Inherit Metab Dis. 2019;42(6):1192–230.
<https://pubmed.ncbi.nlm.nih.gov/30982989/>

### 18 claims — PMID 21312325

*CBLE, CBLF, CBLJ, TCN2*

Watkins D, Rosenblatt DS. Inborn errors of cobalamin absorption and metabolism. Am J Med Genet C Semin Med Genet. 2011;157C(1):33–44.
<https://pubmed.ncbi.nlm.nih.gov/21312325/>

### 14 claims — PMID 21479626

*BKT, SCOT, HMGCS2D*

Sass JO. Inborn errors of ketogenesis and ketone body utilization. J Inherit Metab Dis. 2012;35(1):23–8.
<https://pubmed.ncbi.nlm.nih.gov/21479626/>

### 14 claims — PMID 19452263

*MCAD, VLCAD, LCHAD, CPT1*

Spiekerkoetter U et al. Treatment recommendations in long-chain fatty acid oxidation defects. J Inherit Metab Dis. 2009;32(4):498–505.
<https://pubmed.ncbi.nlm.nih.gov/19452263/>

### 11 claims — PMID 27161889

*PHGDH, PSAT1, PSPH*

El-Hattab AW. Serine biosynthesis and transport defects. Mol Genet Metab. 2016;118(3):153–9.
<https://pubmed.ncbi.nlm.nih.gov/27161889/>

### 11 claims — PMID 16763900

*PHGDH, PSAT1, PSPH*

de Koning TJ. Treatment with amino acids in serine deficiency disorders. J Inherit Metab Dis. 2006;29(2–3):347–51.
<https://pubmed.ncbi.nlm.nih.gov/16763900/>

### 7 claims — PMID 18563633

*MMA, MCEE*

Fowler B, Leonard JV, Baumgartner MR. Causes of and diagnostic approach to methylmalonic acidurias. J Inherit Metab Dis. 2008;31(3):350–60.
<https://pubmed.ncbi.nlm.nih.gov/18563633/>

### 7 claims — PMID 16950638

*2MBD, HSD17B10D, SBCAD*

Korman SH. Inborn errors of isoleucine degradation: a review. Mol Genet Metab. 2006;89(4):289–99.
<https://pubmed.ncbi.nlm.nih.gov/16950638/>

### 7 claims — PMID 22108709

*MTHFR*

Watkins D, Rosenblatt DS. Update and new concepts in vitamin-responsive disorders of folate transport and metabolism. J Inherit Metab Dis. 2012;35(4):665–70.
<https://pubmed.ncbi.nlm.nih.gov/22108709/>

### 7 claims — PMID 23561848

*D2HGA, SLC25A1*

Nota B et al. Deficiency in SLC25A1 causes a new syndrome with combined D-2- and L-2-hydroxyglutaric aciduria. Am J Hum Genet. 2013;92(4):627–31.
<https://pubmed.ncbi.nlm.nih.gov/23561848/>

### 6 claims — PMID 12003346

*PKU, PTPS*

Shintaku H. Disorders of tetrahydrobiopterin metabolism and their treatment. Curr Drug Metab. 2002;3(2):123–31.
<https://pubmed.ncbi.nlm.nih.gov/12003346/>

### 6 claims — PMID 26100751

*DRD*

Wijemanne S, Jankovic J. Dopa-responsive dystonia—clinical and genetic heterogeneity. Nat Rev Neurol. 2015;11(7):414–24.
<https://pubmed.ncbi.nlm.nih.gov/26100751/>

### 6 claims — PMID 11161836

*BKT*

Fukao T et al. The clinical phenotype and outcome of mitochondrial acetoacetyl-CoA thiolase deficiency (beta-ketothiolase or T2 deficiency) in 26 enzymatically proved and mutation-defined patients. Mol Genet Metab. 2001;72(2):109–14.
<https://pubmed.ncbi.nlm.nih.gov/11161836/>

### 6 claims — PMID 16926354

*SCAD*

van Maldegem BT et al. Clinical, biochemical, and genetic heterogeneity in short-chain acyl-CoA dehydrogenase deficiency. JAMA. 2006;296(8):943–52.
<https://pubmed.ncbi.nlm.nih.gov/16926354/>

### 6 claims — PMID 19304569

*UROCA*

Espinós C et al. Mutations in the urocanase gene UROC1 are associated with urocanic aciduria. J Med Genet. 2009;46(6):407–11.
<https://pubmed.ncbi.nlm.nih.gov/19304569/>

### 6 claims — PMID 25860818

*DHTKD1*

Hagen J et al. Genetic basis of α-aminoadipic and α-ketoadipic aciduria: a large cohort study. J Inherit Metab Dis. 2015;38(5):873–9.
<https://pubmed.ncbi.nlm.nih.gov/25860818/>

### 6 claims — PMID 22525402

*BALA*

van Kuilenburg AB et al. β-ureidopropionase deficiency: phenotype, genotype and protein structural consequences in 16 patients. Biochim Biophys Acta. 2012;1822(7):1096–108.
<https://pubmed.ncbi.nlm.nih.gov/22525402/>

### 6 claims — PMID 20598931

*PCDEF*

Marin-Valencia I et al. Pyruvate carboxylase deficiency: mechanisms, mimics and anaplerosis. Mol Genet Metab. 2010;101(1):9–17.
<https://pubmed.ncbi.nlm.nih.gov/20598931/>

### 6 claims — PMID 12754701

*SULFOX, MOCO*

Reiss J, Johnson JL. Mutations in the molybdenum cofactor biosynthetic genes MOCS1, MOCS2, and GEPH. Hum Mutat. 2003;21(6):569–76.
<https://pubmed.ncbi.nlm.nih.gov/12754701/>

### 6 claims — PMID 5637757

*CTH*

Perry TL et al. Cystathioninuria in two healthy siblings. N Engl J Med. 1968;278(11):590–2.
<https://pubmed.ncbi.nlm.nih.gov/5637757/>

### 5 claims — PMID 19234759

*DHPR*

Longo N. Disorders of biopterin metabolism. J Inherit Metab Dis. 2009;32(3):333–42.
<https://pubmed.ncbi.nlm.nih.gov/19234759/>

### 5 claims — PMID 24881969

*MSUD*

Frazier DM et al. Nutrition management of maple syrup urine disease. Mol Genet Metab. 2014;112(3):210–7.
<https://pubmed.ncbi.nlm.nih.gov/24881969/>

### 5 claims — PMID 24530203

*CAVA*

van Karnebeek CDM et al. Bi-allelic mutations in the mitochondrial carbonic anhydrase VA gene cause hyperammonaemia, metabolic acidosis, and cognitive impairment. Am J Hum Genet. 2014;94(3):453–61.
<https://pubmed.ncbi.nlm.nih.gov/24530203/>

### 5 claims — PMID 12872837

*MCC, IBD*

Koeberl DD et al. Evaluation of 3-methylcrotonyl-CoA carboxylase deficiency detected by tandem mass spectrometry newborn screening. J Inherit Metab Dis. 2003;26(1):25–35.
<https://pubmed.ncbi.nlm.nih.gov/12872837/>

### 5 claims — PMID 22241090

*MCC, MCD*

Wolf B. Biotinidase deficiency: 'if you have to have an inherited metabolic disease, this is the one to have'. Genet Med. 2012;14(6):565–75.
<https://pubmed.ncbi.nlm.nih.gov/22241090/>

### 5 claims — PMID 17692550

*HMGCL*

Pié J et al. Molecular genetics of HMG-CoA lyase deficiency. Mol Genet Metab. 2007;92(3):198–209.
<https://pubmed.ncbi.nlm.nih.gov/17692550/>

### 5 claims — PMID 12888986

*GA1*

Strauss KA, Morton DH. Type I glutaric aciduria, part 2: a model of acute striatal necrosis. Am J Med Genet C. 2003;121C(1):53–70.
<https://pubmed.ncbi.nlm.nih.gov/12888986/>

### 5 claims — PMID 16491085

*PDE, PIPOX*

Mills PB et al. Mutations in antiquitin in individuals with pyridoxine-dependent seizures. Nat Med. 2006;12(3):307–9.
<https://pubmed.ncbi.nlm.nih.gov/16491085/>

### 5 claims — PMID 9686819

*MCD*

Suormala T et al. Late-onset holocarboxylase synthetase-deficiency: pre- and post-natal diagnosis and evaluation of effectiveness of antenatal biotin therapy. Eur J Pediatr. 1998;157(7):570–5.
<https://pubmed.ncbi.nlm.nih.gov/9686819/>

### 5 claims — PMID 17208640

*MCAD*

Wilcken B et al. Outcome of neonatal screening for medium-chain acyl-CoA dehydrogenase deficiency. Lancet. 2007;369(9555):37–42.
<https://pubmed.ncbi.nlm.nih.gov/17208640/>

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

### 4 claims — PMID 18317232

*VLCAD, LCHAD*

Primassin S et al. Carnitine supplementation induces acylcarnitine production in tissues of VLCAD-deficient mice. Pediatr Res. 2008;63(6):632–7.
<https://pubmed.ncbi.nlm.nih.gov/18317232/>

### 4 claims — PMID 10607472

*CPT2*

Bonnefont JP et al. Carnitine palmitoyltransferase deficiencies. Mol Genet Metab. 1999;68(4):424–40.
<https://pubmed.ncbi.nlm.nih.gov/10607472/>
