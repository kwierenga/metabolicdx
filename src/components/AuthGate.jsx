import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

// Authentication gate for the whole application.
//
// Access model is SHARED TEAM LOGIN: any signed-in user can see every case.
// The gate exists because the Supabase anon key is public (it ships in the
// browser bundle) — row-level security keys off the signed-in user, so without
// a session the database is unreadable. See supabase/migrations/0001_cases_rls.sql.
//
// There is deliberately no sign-up path. Accounts are created by an
// administrator in the Supabase dashboard, and public sign-up must be turned
// off there — otherwise anyone could register, become `authenticated`, and the
// RLS policy would let them read all patient data.

function Field({ label, type, value, onChange, autoComplete, disabled, autoFocus }) {
  const id = `auth-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-slate-600 block mb-1">{label}</label>
      <input
        id={id} type={type} value={value} disabled={disabled} autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} required
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none
                   focus:border-blue-400 focus:ring-1 focus:ring-blue-200 disabled:bg-slate-50"
      />
    </div>
  );
}

function SignIn({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Supabase returns the same message for unknown user and wrong password,
      // which is the correct behaviour — don't disclose which it was.
      setError(error.message === "Invalid login credentials"
        ? "Email or password not recognised."
        : error.message);
      setBusy(false);
      return;
    }
    onSignedIn?.(data.session);
    setBusy(false);
  };

  return (
    <div className="h-screen flex items-center justify-center px-6"
      style={{ fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif",
               background: "linear-gradient(160deg,#e8f0fe 0%,#f0f4f8 40%,#e6f4f1 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="grid grid-cols-3 gap-[5px] w-12 h-12 mx-auto mb-3">
            {["#60a5fa","#facc15","#34d399","#c084fc","#f87171","#22d3ee","#f472b6","#fb923c","#2dd4bf"]
              .map((c, i) => <div key={i} style={{ background: c, borderRadius: 3 }} />)}
          </div>
          <h1 className="font-black tracking-tight text-2xl" style={{ letterSpacing: "-0.03em", color: "#0f172a" }}>
            Metabolic<span style={{ color: "#0891b2" }}>Dx</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Sign in to access case data</p>
        </div>

        <form onSubmit={submit}
          className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
          <Field label="Email" type="email" value={email} onChange={setEmail}
            autoComplete="username" disabled={busy} autoFocus />
          <Field label="Password" type="password" value={password} onChange={setPassword}
            autoComplete="current-password" disabled={busy} />

          {error && (
            <div role="alert"
              className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" disabled={busy || !email || !password}
            className="w-full py-2.5 rounded-xl font-bold text-sm bg-slate-900 text-white
                       hover:bg-slate-700 active:scale-[0.99] transition-all disabled:opacity-30">
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Accounts are issued by your administrator. Contact them if you need access.
          </p>
        </form>

        <p className="text-[11px] text-slate-300 text-center mt-4 leading-relaxed">
          PROTOTYPE · DECISION SUPPORT, NOT A DIAGNOSTIC DEVICE
        </p>
      </div>
    </div>
  );
}

export function SignOutButton({ email }) {
  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);
  if (!supabase) return null;
  return (
    <div className="flex items-center gap-2">
      {email && <span className="text-[10px] text-white/40 hidden sm:inline" title={email}>{email}</span>}
      <button onClick={signOut}
        className="text-[10px] font-semibold text-white/50 hover:text-white/90 border border-white/10
                   hover:border-white/30 rounded px-2 py-0.5 transition-colors">
        Sign out
      </button>
    </div>
  );
}

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // No credentials at build time → in-memory mode. There is no database to
    // protect, so requiring a login would only lock the user out of a demo.
    if (!supabase) { setChecking(false); return; }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-slate-400"
        style={{ background: "#f0f4f8" }}>
        Checking session…
      </div>
    );
  }
  if (supabase && !session) return <SignIn onSignedIn={setSession} />;
  return typeof children === "function" ? children(session) : children;
}
