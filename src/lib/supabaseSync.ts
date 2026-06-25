import type { SupabaseClient } from '@supabase/supabase-js'
import type { Card, CollectionEntry, Deck, Match, Tournament } from '../types'

/**
 * OPT-IN Supabase cloud sync. The app is local-first; this only runs when the
 * user has entered a project URL + anon key in Settings and signed in. Data is
 * pushed/pulled per authenticated user (RLS keyed on auth.uid()).
 *
 * supabase-js is loaded lazily (dynamic import) so the local-only bundle stays
 * lean and the app never depends on the network unless you turn sync on.
 *
 * Backend tables live in the `public` schema — see docs/SUPABASE_SYNC.md for
 * the SQL (tables + RLS) to run once in the project's SQL editor.
 */

export type SyncData = {
  entries: CollectionEntry[]
  /** Only the user's hand-made cards — imported reference cards are re-importable. */
  customCards: Card[]
  decks: Deck[]
  matches: Match[]
  tournaments: Tournament[]
}

let cached: { url: string; key: string; client: SupabaseClient } | null = null

/** Lazily create (and memoise) a client scoped to the `hamantis` schema. */
export async function getClient(url: string, anonKey: string): Promise<SupabaseClient> {
  if (cached && cached.url === url && cached.key === anonKey) return cached.client
  const { createClient } = await import('@supabase/supabase-js')
  // Tables live in the default `public` schema so the Data API exposes them
  // with no extra config (this project is dedicated to the app).
  const client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  cached = { url, key: anonKey, client }
  return client
}

export interface SyncConfig {
  url: string
  anonKey: string
}

function assertConfig(cfg: Partial<SyncConfig>): asserts cfg is SyncConfig {
  if (!cfg.url || !cfg.anonKey) {
    throw new Error('Cloud sync is not configured — add your Supabase URL and anon key in Settings.')
  }
}

// ---- Auth (passwordless email code) ----

export async function sendLoginCode(cfg: Partial<SyncConfig>, email: string): Promise<void> {
  assertConfig(cfg)
  const client = await getClient(cfg.url, cfg.anonKey)
  const { error } = await client.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true },
  })
  if (error) throw new Error(error.message)
}

export async function verifyLoginCode(
  cfg: Partial<SyncConfig>,
  email: string,
  code: string,
): Promise<string> {
  assertConfig(cfg)
  const client = await getClient(cfg.url, cfg.anonKey)
  const { data, error } = await client.auth.verifyOtp({
    email: email.trim(),
    token: code.trim(),
    type: 'email',
  })
  if (error) throw new Error(error.message)
  const userEmail = data.user?.email
  if (!userEmail) throw new Error('Sign-in did not return a user.')
  return userEmail
}

export async function currentUserEmail(cfg: Partial<SyncConfig>): Promise<string | null> {
  if (!cfg.url || !cfg.anonKey) return null
  const client = await getClient(cfg.url, cfg.anonKey)
  const { data } = await client.auth.getSession()
  return data.session?.user?.email ?? null
}

export async function signOut(cfg: Partial<SyncConfig>): Promise<void> {
  if (!cfg.url || !cfg.anonKey) return
  const client = await getClient(cfg.url, cfg.anonKey)
  await client.auth.signOut()
}

// ---- Push / Pull ----

async function requireUserId(client: SupabaseClient): Promise<string> {
  const { data } = await client.auth.getSession()
  const id = data.session?.user?.id
  if (!id) throw new Error('Not signed in. Sign in with your email first.')
  return id
}

/** Push all local data to the cloud (upsert; last write wins on each row). */
export async function pushAll(cfg: Partial<SyncConfig>, data: SyncData): Promise<void> {
  assertConfig(cfg)
  const client = await getClient(cfg.url, cfg.anonKey)
  const userId = await requireUserId(client)

  const collectionRows = data.entries.map((e) => ({
    user_id: userId,
    card_id: e.cardId,
    quantity: e.quantity,
    condition: e.condition,
    language: e.language,
    note: e.note ?? null,
    image_url: e.imageUrl ?? null,
    added_at: e.addedAt,
    updated_at: e.updatedAt,
  }))
  const payloadRows = (items: { id: string }[]) =>
    items.map((it) => ({ user_id: userId, id: it.id, payload: it }))

  const ops: { table: string; rows: unknown[]; conflict: string }[] = [
    { table: 'collection', rows: collectionRows, conflict: 'user_id,card_id' },
    { table: 'cards', rows: payloadRows(data.customCards), conflict: 'user_id,id' },
    { table: 'decks', rows: payloadRows(data.decks), conflict: 'user_id,id' },
    { table: 'matches', rows: payloadRows(data.matches), conflict: 'user_id,id' },
    { table: 'tournaments', rows: payloadRows(data.tournaments), conflict: 'user_id,id' },
  ]
  for (const op of ops) {
    if (!op.rows.length) continue
    const { error } = await client.from(op.table).upsert(op.rows, { onConflict: op.conflict })
    if (error) throw new Error(`Push failed on ${op.table}: ${error.message}`)
  }
}

/** Pull all cloud data for the signed-in user. */
export async function pullAll(cfg: Partial<SyncConfig>): Promise<SyncData> {
  assertConfig(cfg)
  const client = await getClient(cfg.url, cfg.anonKey)
  await requireUserId(client)

  const grab = async <T>(table: string): Promise<T[]> => {
    const { data, error } = await client.from(table).select('*')
    if (error) throw new Error(`Pull failed on ${table}: ${error.message}`)
    return (data ?? []) as T[]
  }

  const [collection, cards, decks, matches, tournaments] = await Promise.all([
    grab<{
      card_id: string
      quantity: number
      condition: CollectionEntry['condition']
      language: CollectionEntry['language']
      note: string | null
      image_url: string | null
      added_at: number
      updated_at: number
    }>('collection'),
    grab<{ payload: Card }>('cards'),
    grab<{ payload: Deck }>('decks'),
    grab<{ payload: Match }>('matches'),
    grab<{ payload: Tournament }>('tournaments'),
  ])

  return {
    entries: collection.map((r) => ({
      cardId: r.card_id,
      quantity: r.quantity,
      condition: r.condition,
      language: r.language,
      note: r.note ?? undefined,
      imageUrl: r.image_url ?? undefined,
      addedAt: r.added_at,
      updatedAt: r.updated_at,
    })),
    customCards: cards.map((r) => r.payload),
    decks: decks.map((r) => r.payload),
    matches: matches.map((r) => r.payload),
    tournaments: tournaments.map((r) => r.payload),
  }
}
