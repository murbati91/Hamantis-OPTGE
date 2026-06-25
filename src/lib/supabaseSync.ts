import type { SupabaseClient } from '@supabase/supabase-js'
import type { Card, CollectionEntry, Deck, Match, Tournament } from '../types'

/**
 * OPT-IN Supabase cloud sync, authenticated via CLERK (Supabase third-party
 * auth). The app is Clerk-gated, so the user is always signed in; the Supabase
 * client forwards the Clerk session token on every request (`accessToken`), and
 * RLS keys each row on the Clerk subject claim (`auth.jwt()->>'sub'`). See
 * docs/SUPABASE_SYNC.md for the SQL (tables + RLS).
 *
 * supabase-js is loaded lazily (dynamic import) so the bundle stays lean.
 */

declare global {
  interface Window {
    Clerk?: {
      session?: { getToken: (opts?: { template?: string }) => Promise<string | null> }
      user?: { id: string } | null
    }
  }
}

export type SyncData = {
  entries: CollectionEntry[]
  /** Only the user's hand-made cards — imported reference cards are re-importable. */
  customCards: Card[]
  decks: Deck[]
  matches: Match[]
  tournaments: Tournament[]
}

let cached: { url: string; key: string; client: SupabaseClient } | null = null

/** Lazily create (and memoise) a Supabase client that authenticates as the Clerk user. */
export async function getClient(url: string, anonKey: string): Promise<SupabaseClient> {
  if (cached && cached.url === url && cached.key === anonKey) return cached.client
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(url, anonKey, {
    // Every request is authenticated as the signed-in Clerk user. Supabase
    // validates the token via the Clerk third-party auth integration, so RLS
    // sees the Clerk user id in auth.jwt()->>'sub'.
    accessToken: async () => {
      try {
        return (await window.Clerk?.session?.getToken()) ?? null
      } catch {
        return null
      }
    },
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

/** The signed-in Clerk user's id — the RLS subject that owns the synced rows. */
function clerkUserId(): string {
  const id = typeof window !== 'undefined' ? window.Clerk?.user?.id : null
  if (!id) throw new Error('Not signed in. Sign in to sync.')
  return id
}

// ---- Push / Pull ----

/** Push all local data to the cloud (upsert; last write wins on each row). */
export async function pushAll(cfg: Partial<SyncConfig>, data: SyncData): Promise<void> {
  assertConfig(cfg)
  const client = await getClient(cfg.url, cfg.anonKey)
  const userId = clerkUserId()

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
  clerkUserId() // ensure signed in (RLS scopes the rows to this user)

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
