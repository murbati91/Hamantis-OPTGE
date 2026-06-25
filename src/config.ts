/**
 * Build-time defaults injected via Vite env vars (prod deploy only). These let
 * the hosted app pre-wire cloud sync so you don't paste the Supabase URL/key on
 * every device. Empty when not provided (local dev / generic builds) — the app
 * stays local-first and you can still enter your own backend in Settings.
 *
 * The anon/publishable key is public-safe by design (RLS protects the data).
 */
export const DEFAULT_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
export const DEFAULT_SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

/** True when this build shipped with a pre-configured sync backend. */
export const HAS_DEFAULT_SUPABASE = !!(DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY)
