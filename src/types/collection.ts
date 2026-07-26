import type { CardCondition, CardLanguage } from './card'

/**
 * A user-owned copy / entry in the private collection.
 * Keyed by cardId; quantity tracks how many copies are owned.
 */
export interface CollectionEntry {
  cardId: string
  quantity: number
  condition: CardCondition
  language: CardLanguage
  /** Optional user note, e.g. graded, signed, trade-bait. */
  note?: string
  /** User-supplied image override (URL or data URL) for this owned copy. */
  imageUrl?: string
  /** epoch ms */
  addedAt: number
  updatedAt: number
}

/** App-level settings, stored locally. */
export interface AppSettings {
  /** Private/local-first mode — no sync, data stays on device. */
  privateMode: boolean
  /** Allow loading remote card images (off => placeholders only). */
  allowRemoteImages: boolean
  theme: 'dark' | 'light'
  /** Whether demo OP16 cards are shown in the wallet. */
  showDemoCards: boolean
  /**
   * apitcg.com API key for importing real card sets. Stored ONLY on this device
   * (localStorage) — never bundled. Optional; the app works fully without it.
   */
  apitcgKey?: string

  /** Optional Supabase cloud-sync config (device-local). Empty = local-only. */
  supabaseUrl?: string
  supabaseAnonKey?: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  privateMode: true,
  allowRemoteImages: true,
  theme: 'dark',
  showDemoCards: true,
}
