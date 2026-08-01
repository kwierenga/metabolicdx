import { Component } from "react";

/**
 * Catches render errors so one bad value cannot blank the whole application.
 *
 * This matters more here than in most apps. A clinician opens a case mid-consult;
 * if a render throws, React unmounts the entire tree and they are left with a
 * white page and no indication whether the case was saved. That is not
 * hypothetical — a partially-populated case crashed the app until f07b8c1, and
 * the knowledge base is large, hand-maintained data that will produce more
 * surprises of that shape.
 *
 * The boundary deliberately does not offer to "retry" by clearing the error:
 * re-rendering the same state would throw again. It offers the two things that
 * actually help — reload, and the error text to paste into a bug report.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // Keep the stack in the console for anyone with devtools open; there is no
    // error-reporting backend to send it to.
    console.error("Unhandled render error:", error, info?.componentStack);
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    const detail = [error?.stack || String(error), info?.componentStack].filter(Boolean).join("\n\n");

    return (
      <div role="alert" className="min-h-screen flex items-start justify-center bg-slate-50 px-5 py-16">
        <div className="max-w-lg w-full bg-white border border-rose-200 rounded-xl shadow-sm p-6">
          <h1 className="text-sm font-bold text-rose-700">Something went wrong displaying this page</h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            The error was caught before it could affect anything else.
            <span className="font-semibold text-slate-700"> Saved cases are not affected</span> — this
            is a display fault, not a data fault. Reloading usually clears it.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700">
              Reload
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(detail)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">
              Copy error details
            </button>
          </div>
          <details className="mt-4">
            <summary className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600">
              Technical details
            </summary>
            <pre className="mt-2 text-[10px] leading-snug text-slate-500 whitespace-pre-wrap break-words max-h-64 overflow-auto">
              {detail}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
