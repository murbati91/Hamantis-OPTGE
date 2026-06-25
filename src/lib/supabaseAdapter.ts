import type { StorageAdapter } from './storage'

/**
 * Phase 5 — OPTIONAL Supabase sync adapter (scaffold).
 *
 * The app is local-first and private by default; this adapter is NOT wired in.
 * It documents the migration path: implement each StorageAdapter method against
 * Supabase tables and swap `export const storage` in `storage.ts` to the result
 * of `createSupabaseAdapter(...)` behind a user setting.
 *
 * Intentionally does NOT import `@supabase/supabase-js` at module load so the
 * local build stays dependency-free until you opt in. To enable:
 *   1) `pnpm add @supabase/supabase-js`
 *   2) fill in the methods below using the client
 *   3) gate it behind `settings.privateMode === false` + env credentials
 *
 * Suggested schema (per authenticated user, RLS on `user_id = auth.uid()`):
 *   collection(card_id pk, user_id, quantity, condition, language, note, image_url, added_at, updated_at)
 *   cards(id pk, user_id, payload jsonb)
 *   decks(id pk, user_id, payload jsonb)
 *   matches(id pk, user_id, payload jsonb)
 *   tournaments(id pk, user_id, payload jsonb)
 */

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export function createSupabaseAdapter(_config: SupabaseConfig): StorageAdapter {
  const notReady = () => {
    throw new Error(
      'Supabase adapter is a Phase 5 scaffold — install @supabase/supabase-js and implement the methods before enabling cloud sync.',
    )
  }
  // Local settings still come from localStorage; only cloud collections differ.
  return {
    getSettings: notReady,
    saveSettings: notReady,
    getCollection: notReady,
    upsertEntry: notReady,
    deleteEntry: notReady,
    getCustomCards: notReady,
    upsertCard: notReady,
    bulkUpsertCards: notReady,
    deleteCard: notReady,
    getDecks: notReady,
    upsertDeck: notReady,
    deleteDeck: notReady,
    getMatches: notReady,
    upsertMatch: notReady,
    deleteMatch: notReady,
    getTournaments: notReady,
    upsertTournament: notReady,
    deleteTournament: notReady,
  }
}
