// Render smoke tests for the screens a clinician actually sees.
//
// Until 2026-11-13 only ErrorBoundary and ReferenceList had render tests; the
// 750-line CaseEditor, ResultCard, ReportTab, CaseList and DisordersScreen had
// none, and a "Save all" button sat in the case list with no handler wired to
// it. Server-side rendering to a string catches a render that throws, a prop
// that was never passed, and copy that must (or must not) reach the page —
// with no DOM library.
//
// Run: npm test
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App, { AppShell, ResultCard, ReportTab, CaseEditor, CaseList, DisordersScreen, ValueCell, ModelView, TrendsTab } from "../App.jsx";
import { runAnalysis, initValues } from "../scoring.js";
import { ANALYTE_MAP } from "../analytes.js";
import { currentStamp } from "../storage.js";

const render = (el) => renderToStaticMarkup(el);
const pkuValues = () => { const v = initValues(); v.PAA.Phe = "1200"; v.PAA.Tyr = "20"; v.PAA.Leu = "100"; return v; };
const demo = { dob: "", gender: "Female", sampleDate: "2026-01-10", notes: "", method: "", birthWeight: "", fasting: "" };
const reviewer = { name: "Dr Test", role: "Clinical Biochemist", comments: "" };

const values = pkuValues();
const { results } = runAnalysis(values);
const stamp = currentStamp();

describe("ResultCard", () => {
  it("shows separation on the leader and never the retired absolute band", () => {
    const html = render(<ResultCard result={results[0]} rank={1} />);
    expect(html).toContain("Phenylketonuria");
    expect(html).toMatch(/CLEAR LEAD|LEADS|NARROW LEAD|CO-DIFFERENTIAL|SOLE CANDIDATE/);
    expect(html).not.toMatch(/>(HIGH|MODERATE|TRACE)</);
    expect(html).toContain('aria-expanded');
  });
  it("shows the sourced birth prevalence when the disorder has one", () => {
    const html = render(<ResultCard result={results[0]} rank={1} />);
    expect(html).toMatch(/≈1 in [\d,]+ births/);
    expect(html).toContain("pubmed.ncbi.nlm.nih.gov/30479748");
  });
});

describe("ReportTab", () => {
  const html = render(<ReportTab caseLabel="Case X" createdAt="2026-01-10T10:00:00Z" values={values} activePanels={new Set(["PAA"])}
    activeModifiers={[]} knownDxId={null} results={results} reviewer={reviewer} narrative="Narrative text." confirmedDxId={null} demo={demo} scoredWith={stamp} />);
  it("names the knowledge base and engine that produced the results", () => {
    expect(html).toContain("Scored with");
    expect(html).toContain(stamp.kbHash);
    expect(html).toContain(stamp.engineHash);
  });
  it("describes the differential by separation, not as a score out of 100", () => {
    expect(html).not.toMatch(/\d+\/100/);
    expect(html).toMatch(/× next candidate|only candidate/);
    expect(html).toContain("not a probability of disease");
  });
  it("flags results that predate version stamping", () => {
    const h2 = render(<ReportTab caseLabel="Case X" createdAt="2026-01-10T10:00:00Z" values={values} activePanels={new Set(["PAA"])}
      activeModifiers={[]} knownDxId={null} results={results} reviewer={reviewer} narrative="" confirmedDxId={null} demo={demo} scoredWith={null} />);
    expect(h2).toContain("predate version stamping");
  });
});

describe("CaseEditor", () => {
  const init = { id: "t1", label: "Test patient", values, results: null, scoredWith: null, demo, activeModifiers: [], reviewer, createdAt: "2026-01-10T10:00:00Z", version: 3 };
  it("renders the data tab with labelled inputs", () => {
    const html = render(<CaseEditor init={init} learnedWeights={{}} allCases={[]} onSave={() => {}} onBack={() => {}} />);
    expect(html).toContain('for="val-Phe"');
    expect(html).toContain('id="val-Phe"');
    expect(html).toContain('role="tablist"');
    expect(html).toContain("Crop or black out");
  });
  it("warns when stored results were scored under an earlier knowledge base", () => {
    const html = render(<CaseEditor init={{ ...init, results }} learnedWeights={{}} allCases={[]} onSave={() => {}} onBack={() => {}} />);
    expect(html).toContain("before version stamping");
    expect(html).toContain("Re-run");
  });
  it("does not warn when the stored stamp matches this build", () => {
    const html = render(<CaseEditor init={{ ...init, results, scoredWith: stamp }} learnedWeights={{}} allCases={[]} onSave={() => {}} onBack={() => {}} />);
    expect(html).not.toContain("before version stamping");
    expect(html).toContain("Weight by birth prevalence");
  });
});

describe("CaseList", () => {
  const cases = [
    { id: "a", label: "Alpha", createdAt: "2026-01-01T00:00:00Z", panels: ["PAA"], enteredCount: 5, abnormalCount: 1, topDx: "Phenylketonuria (PKU) / HPA", version: 1, isSeed: false },
    { id: "s", label: "Demo one", createdAt: "2025-01-01T00:00:00Z", panels: ["PAA"], enteredCount: 5, abnormalCount: 0, topDx: null, version: 1, isSeed: true },
  ];
  const deleted = [{ id: "d", label: "Gone", deletedAt: "2026-02-01T00:00:00Z", version: 2, isSeed: false }];
  const html = render(<CaseList cases={cases} loading={false} onOpen={() => {}} onNew={() => {}} onDelete={() => {}} onRefresh={() => {}} deletedCases={deleted} onRestore={() => {}} />);
  it("has no dead Save-all button and names its icon buttons", () => {
    expect(html).not.toContain("Save all");
    expect(html).toContain('aria-label="Refresh case list"');
    expect(html).toContain('aria-label="Delete case Alpha"');
  });
  it("marks demo cases and offers restore for deleted ones", () => {
    expect(html).toContain(">demo<");
    expect(html).toContain("Deleted cases (1)");
    expect(html).toContain("Restore");
  });
});

describe("DisordersScreen", () => {
  it("renders the catalogue", () => {
    const html = render(<DisordersScreen onBack={() => {}} />);
    expect(html).toContain("Phenylketonuria");
    expect(html).toContain("Metabolic Disorders");
  });
});

describe("ValueCell", () => {
  it("announces an abnormal value in words, not only colour", () => {
    const html = render(<ValueCell analyte={ANALYTE_MAP.Phe} value="1200" onChange={() => {}} highlighted={false} />);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toMatch(/aria-label="high, [\d.]+ times the upper limit"/);
    expect(html).toContain("H ↑");
  });
});

describe("ModelView and TrendsTab", () => {
  it("render their empty states", () => {
    expect(render(<ModelView learnedWeights={{}} trainingExamples={[]} />)).toContain("No confirmed diagnoses yet");
    expect(render(<TrendsTab currentLabel="X" currentValues={values} currentResults={results} currentDate="2026-01-10" currentId="t1" allCases={[]} />))
      .toContain("No prior timepoints");
  });
});

describe("App shell", () => {
  it("renders the home screen with the data-handling statement", () => {
    // AppShell directly: the gate in front of it depends on whether Supabase
    // credentials are present in the test environment (vitest loads .env.local).
    const html = render(<AppShell session={null} />);
    expect(html).toContain("Metabolic");
    expect(html).toContain("Where case data goes");
    expect(html).toContain("NOT A DIAGNOSTIC DEVICE");
    expect(html).toContain("build ");
  });
  it("the gated App renders without throwing", () => {
    const html = render(<App />);
    expect(html.length).toBeGreaterThan(100);
  });
});
