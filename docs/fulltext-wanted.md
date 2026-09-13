# Papers worth obtaining by hand

Regenerate with `node scripts/fetch-fulltext.mjs --wanted` rather than editing —
the ranking shifts as claims are settled.

PMC open access covers **139 of the 876** cited papers (16%). The rest are closed.
These are the ones where getting the paper would actually settle something, ranked
by how many claims rest on them that no abstract could confirm.

660 closed-access papers carry at least one unsettled claim.
Obtaining the top 60 would resolve 383 claims.

**To feed one back in:** save it as `docs/fulltext/<PMID>.pdf` (or `.txt`), then run
`node scripts/fetch-fulltext.mjs --ingest`. PDFs are converted with pdftotext, and
the judge then treats a hand-supplied body exactly like a PMC one. That folder is
gitignored — publisher PDFs are not redistributable.

> Note: GeneReviews chapters (e.g. PMID 26684475, 20301495) are free on NCBI
> Bookshelf even though they are not in PMC, so those cost nothing but a download.

---


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

### 12 claims — PMID 26684475

*GAMT, GATM, SLC6A8*

Mercimek-Mahmutoglu S, Salomons GS. Creatine deficiency syndromes. GeneReviews®. 2015 [updated 2023].
<https://pubmed.ncbi.nlm.nih.gov/26684475/>

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

### 6 claims — PMID 20301495

*MSUD*

Strauss KA, Puffenberger EG, Morton DH. Maple Syrup Urine Disease. GeneReviews®. Seattle: University of Washington; 2013 [updated 2020].
<https://pubmed.ncbi.nlm.nih.gov/20301495/>

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

### 5 claims — PMID 20301360

*CITR2*

Saheki T, Song YZ. Citrin deficiency. GeneReviews®. 2005 [updated 2023].
<https://pubmed.ncbi.nlm.nih.gov/20301360/>

### 5 claims — PMID 24530203

*CAVA*

van Karnebeek CDM et al. Bi-allelic mutations in the mitochondrial carbonic anhydrase VA gene cause hyperammonaemia, metabolic acidosis, and cognitive impairment. Am J Hum Genet. 2014;94(3):453–61.
<https://pubmed.ncbi.nlm.nih.gov/24530203/>

### 5 claims — PMID 33071282

*IVA, VLCAD, LCHAD, CPT2*

Miller MJ et al. Laboratory analysis of acylcarnitines, 2020 update: a technical standard of the American College of Medical Genetics and Genomics (ACMG). Genet Med. 2021;23(2):249–58.
<https://pubmed.ncbi.nlm.nih.gov/33071282/>

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

### 5 claims — PMID 20301597

*MCAD*

Merritt JL, Chang IJ. Medium-chain acyl-coenzyme A dehydrogenase deficiency. GeneReviews®. 2000 [updated 2019].
<https://pubmed.ncbi.nlm.nih.gov/20301597/>

### 5 claims — PMID 11826276

*MCAD, CPT2*

Rinaldo P et al. Fatty acid oxidation disorders. Annu Rev Physiol. 2002;64:477–502.
<https://pubmed.ncbi.nlm.nih.gov/11826276/>

### 5 claims — PMID 20696606

*CPT1*

Collins SA et al. Carnitine palmitoyltransferase 1A P479L prevalence in Nunavut. Int J Circumpolar Health. 2010;69(2):179–92.
<https://pubmed.ncbi.nlm.nih.gov/20696606/>

### 5 claims — PMID 20301431

*CPT2*

Wieser T. Carnitine palmitoyltransferase II deficiency. GeneReviews®. 2004 [updated 2019].
<https://pubmed.ncbi.nlm.nih.gov/20301431/>

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

### 4 claims — PMID 20301681

*DRD*

Furukawa Y. GTP cyclohydrolase 1-deficient dopa-responsive dystonia. GeneReviews®. 2002 [updated 2019].
<https://pubmed.ncbi.nlm.nih.gov/20301681/>

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

### 4 claims — PMID 20301631

*CITR1*

Quinonez SC, Thoene JG. Citrullinemia type I. GeneReviews®. 2004 [updated 2020].
<https://pubmed.ncbi.nlm.nih.gov/20301631/>
