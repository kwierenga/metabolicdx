import { createClient } from '@supabase/supabase-js'

// The single Supabase client for the whole app.
//
// There must be exactly one: supabase-js holds the signed-in session on the
// client instance and attaches its JWT to every request. A second client would
// carry only the anon key, and once row-level security is enabled every query
// it made would be rejected. (There used to be a second one in lib/storage.js.)
//
// VITE_ vars are substituted at BUILD time, so they must be present in the
// Vercel environment before the build runs — not just at runtime.
const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const supabase = url && key ? createClient(url, key) : null

// "memory" means no credentials were present at build time: the app still runs
// but nothing is persisted. Surfaced in the header so it can't pass unnoticed.
export const STORAGE_MODE = supabase ? 'supabase' : 'memory'
