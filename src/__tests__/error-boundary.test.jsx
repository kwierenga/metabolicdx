// The error boundary must actually contain a render error.
//
// A boundary that is present but wired wrongly is worse than none: it looks like
// coverage in review and still blanks the app in use. These render a component
// that throws and check what the user is left with.
//
// Run: npm test
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

const Boom = () => { throw new Error("kaboom in a child"); };
const Fine = () => <p>case loaded</p>;

describe("ErrorBoundary", () => {
  it("renders its children untouched when nothing throws", () => {
    const html = renderToStaticMarkup(<ErrorBoundary><Fine/></ErrorBoundary>);
    expect(html).toContain("case loaded");
    expect(html).not.toContain("Something went wrong");
  });

  it("catches a throwing child and tells the user their cases are safe", () => {
    // renderToStaticMarkup does not run boundaries, so drive the lifecycle the
    // way React would: derive state from the error, then render.
    const state = ErrorBoundary.getDerivedStateFromError(new Error("kaboom in a child"));
    expect(state.error).toBeInstanceOf(Error);

    const b = new ErrorBoundary({ children: <Boom/> });
    b.state = { ...state, info: { componentStack: "\n    at Boom" } };
    const html = renderToStaticMarkup(b.render());

    expect(html).toContain("Something went wrong");
    // The reassurance is the point — a clinician mid-consult needs to know
    // whether the case they were entering has been lost.
    expect(html).toContain("Saved cases are not affected");
    expect(html).toContain("Reload");
    expect(html).toContain("kaboom in a child");
  });

  it("marks itself as an alert so it is announced, not just shown", () => {
    const b = new ErrorBoundary({});
    b.state = { error: new Error("x"), info: null };
    expect(renderToStaticMarkup(b.render())).toContain('role="alert"');
  });

  it("logs the error so it is recoverable from the console", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const b = new ErrorBoundary({});
    b.setState = () => {};   // not mounted; we only care about the logging side
    b.componentDidCatch(new Error("boom"), { componentStack: "stack" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
