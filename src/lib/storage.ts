import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  AppSettings,
  Card,
  CollectionEntry,
  Deck,
  Match,
  Tournament,
} from '../types'
import { DEFAULT_SETTINGS } from '../types'

/**
 * Local-first storage adapter. Collection / decks / matches / tournaments live
 * in IndexedDB on-device; settings + progress live in localStorage for
 * synchronous boot. No network, no login.
 *
 * The `StorageAdapter` interface is backend-agnostic so a Supabase-backed
 * adapter (see supabaseAdapter.ts) can be dropped in later without UI changes.
 */

const DB_NAME = 'hamantis-op'
const DB_VERSION = 2
const SETTINGS_KEY = 'hamantis.settings.v1'

interface HamantisDB extends DBSchema {
  collection: { key: string; value: CollectionEntry }
  cards: { key: string; value: Card }
  decks: { key: string; value: Deck }
  matches: { key: string; value: Match }
  tournaments: { key: string; value: Tournament }
}

let dbPromise: Promise<IDBPDatabase<HamantisDB>> | null = null

function getDB(): Promise<IDBPDatabase<HamantisDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HamantisDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('collection'))
          db.createObjectStore('collection', { keyPath: 'cardId' })
        if (!db.objectStoreNames.contains('cards'))
          db.createObjectStore('cards', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('decks'))
          db.createObjectStore('decks', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('matches'))
          db.createObjectStore('matches', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('tournaments'))
          db.createObjectStore('tournaments', { keyPath: 'id' })
      },
      // If another tab holds an older connection open, close ours so it can
      // upgrade — prevents a permanent hang where the open never resolves.
      blocking() {
        getDB()
          .then((db) => db.close())
          .catch(() => {})
        dbPromise = null
      },
    })
  }
  return dbPromise
}

export interface StorageAdapter {
  getSettings(): AppSettings
  saveSettings(settings: AppSettings): void

  getCollection(): Promise<CollectionEntry[]>
  upsertEntry(entry: CollectionEntry): Promise<void>
  deleteEntry(cardId: string): Promise<void>

  getCustomCards(): Promise<Card[]>
  upsertCard(card: Card): Promise<void>
  /** Write many cards in one transaction (used by the apitcg set importer). */
  bulkUpsertCards(cards: Card[]): Promise<void>
  deleteCard(id: string): Promise<void>

  getDecks(): Promise<Deck[]>
  upsertDeck(deck: Deck): Promise<void>
  deleteDeck(id: string): Promise<void>

  getMatches(): Promise<Match[]>
  upsertMatch(match: Match): Promise<void>
  deleteMatch(id: string): Promise<void>

  getTournaments(): Promise<Tournament[]>
  upsertTournament(t: Tournament): Promise<void>
  deleteTournament(id: string): Promise<void>
}

export const localStorageAdapter: StorageAdapter = {
  getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (!raw) return DEFAULT_SETTINGS
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) }
    } catch {
      return DEFAULT_SETTINGS
    }
  },
  saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  },

  async getCollection() {
    return (await getDB()).getAll('collection')
  },
  async upsertEntry(entry) {
    await (await getDB()).put('collection', entry)
  },
  async deleteEntry(cardId) {
    await (await getDB()).delete('collection', cardId)
  },

  async getCustomCards() {
    return (await getDB()).getAll('cards')
  },
  async upsertCard(card) {
    await (await getDB()).put('cards', card)
  },
  async bulkUpsertCards(cards) {
    const db = await getDB()
    const tx = db.transaction('cards', 'readwrite')
    await Promise.all([...cards.map((c) => tx.store.put(c)), tx.done])
  },
  async deleteCard(id) {
    await (await getDB()).delete('cards', id)
  },

  async getDecks() {
    return (await getDB()).getAll('decks')
  },
  async upsertDeck(deck) {
    await (await getDB()).put('decks', deck)
  },
  async deleteDeck(id) {
    await (await getDB()).delete('decks', id)
  },

  async getMatches() {
    return (await getDB()).getAll('matches')
  },
  async upsertMatch(match) {
    await (await getDB()).put('matches', match)
  },
  async deleteMatch(id) {
    await (await getDB()).delete('matches', id)
  },

  async getTournaments() {
    return (await getDB()).getAll('tournaments')
  },
  async upsertTournament(t) {
    await (await getDB()).put('tournaments', t)
  },
  async deleteTournament(id) {
    await (await getDB()).delete('tournaments', id)
  },
}

export const storage = localStorageAdapter
