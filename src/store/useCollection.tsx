import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppSettings,
  Card,
  CollectionEntry,
  Deck,
  Match,
  Tournament,
} from '../types'
import { storage } from '../lib/storage'
import { buildCardIndex, buildFullIndex } from '../lib/cards'

interface CollectionContextValue {
  ready: boolean
  settings: AppSettings
  setSettings: (patch: Partial<AppSettings>) => void

  /** card id -> definition (demo + custom) for the browsable wallet. */
  cardIndex: Record<string, Card>
  /** full resolver incl. synthetic training set (for sealed/deck tools). */
  fullIndex: Record<string, Card>
  resolveCard: (id: string) => Card | undefined
  customCards: Card[]

  /** card id -> owned entry. */
  entries: Record<string, CollectionEntry>

  upsertEntry: (entry: CollectionEntry) => Promise<void>
  removeEntry: (cardId: string) => Promise<void>
  upsertCard: (card: Card) => Promise<void>
  /** Bulk-write imported cards (apitcg) in one transaction. */
  importCards: (cards: Card[]) => Promise<void>
  /** Merge cloud-sync data into local storage + state. */
  applySync: (data: {
    entries: CollectionEntry[]
    customCards: Card[]
    decks: Deck[]
    matches: Match[]
    tournaments: Tournament[]
  }) => Promise<void>
  removeCard: (id: string) => Promise<void>

  // Decks
  decks: Deck[]
  upsertDeck: (deck: Deck) => Promise<void>
  removeDeck: (id: string) => Promise<void>

  // Matches
  matches: Match[]
  upsertMatch: (m: Match) => Promise<void>
  removeMatch: (id: string) => Promise<void>

  // Tournaments
  tournaments: Tournament[]
  upsertTournament: (t: Tournament) => Promise<void>
  updateTournament: (id: string, fn: (t: Tournament) => Tournament) => Promise<void>
  removeTournament: (id: string) => Promise<void>
}

const CollectionContext = createContext<CollectionContextValue | null>(null)

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [settings, setSettingsState] = useState<AppSettings>(() =>
    storage.getSettings(),
  )
  const [customCards, setCustomCards] = useState<Card[]>([])
  const [entries, setEntries] = useState<Record<string, CollectionEntry>>({})
  const [decks, setDecks] = useState<Deck[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [cards, coll, dk, mt, tn] = await Promise.all([
        storage.getCustomCards(),
        storage.getCollection(),
        storage.getDecks(),
        storage.getMatches(),
        storage.getTournaments(),
      ])
      if (cancelled) return
      setCustomCards(cards)
      setEntries(Object.fromEntries(coll.map((e) => [e.cardId, e])))
      setDecks(dk)
      setMatches(mt)
      setTournaments(tn)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch }
      storage.saveSettings(next)
      return next
    })
  }, [])

  const upsertEntry = useCallback(async (entry: CollectionEntry) => {
    await storage.upsertEntry(entry)
    setEntries((prev) => ({ ...prev, [entry.cardId]: entry }))
  }, [])

  const removeEntry = useCallback(async (cardId: string) => {
    await storage.deleteEntry(cardId)
    setEntries((prev) => {
      const next = { ...prev }
      delete next[cardId]
      return next
    })
  }, [])

  const upsertCard = useCallback(async (card: Card) => {
    await storage.upsertCard(card)
    setCustomCards((prev) => {
      const without = prev.filter((c) => c.id !== card.id)
      return [...without, card]
    })
  }, [])

  const importCards = useCallback(async (cards: Card[]) => {
    if (!cards.length) return
    await storage.bulkUpsertCards(cards)
    setCustomCards((prev) => {
      const byId = new Map(prev.map((c) => [c.id, c]))
      for (const c of cards) byId.set(c.id, c)
      return [...byId.values()]
    })
  }, [])

  const removeCard = useCallback(async (id: string) => {
    await storage.deleteCard(id)
    setCustomCards((prev) => prev.filter((c) => c.id !== id))
  }, [])

  /** Merge data pulled from cloud sync into local storage + state (by id/cardId). */
  const applySync = useCallback(
    async (data: {
      entries: CollectionEntry[]
      customCards: Card[]
      decks: Deck[]
      matches: Match[]
      tournaments: Tournament[]
    }) => {
      await Promise.all([
        ...data.entries.map((e) => storage.upsertEntry(e)),
        storage.bulkUpsertCards(data.customCards),
        ...data.decks.map((d) => storage.upsertDeck(d)),
        ...data.matches.map((m) => storage.upsertMatch(m)),
        ...data.tournaments.map((t) => storage.upsertTournament(t)),
      ])
      const mergeById = <T extends { id: string }>(prev: T[], next: T[]): T[] => {
        const byId = new Map(prev.map((x) => [x.id, x]))
        for (const x of next) byId.set(x.id, x)
        return [...byId.values()]
      }
      setEntries((prev) => {
        const out = { ...prev }
        for (const e of data.entries) out[e.cardId] = e
        return out
      })
      setCustomCards((prev) => mergeById(prev, data.customCards))
      setDecks((prev) => mergeById(prev, data.decks))
      setMatches((prev) => mergeById(prev, data.matches))
      setTournaments((prev) => mergeById(prev, data.tournaments))
    },
    [],
  )

  const upsertDeck = useCallback(async (deck: Deck) => {
    await storage.upsertDeck(deck)
    setDecks((prev) => [...prev.filter((d) => d.id !== deck.id), deck])
  }, [])
  const removeDeck = useCallback(async (id: string) => {
    await storage.deleteDeck(id)
    setDecks((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const upsertMatch = useCallback(async (m: Match) => {
    await storage.upsertMatch(m)
    setMatches((prev) => [...prev.filter((x) => x.id !== m.id), m])
  }, [])
  const removeMatch = useCallback(async (id: string) => {
    await storage.deleteMatch(id)
    setMatches((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const upsertTournament = useCallback(async (t: Tournament) => {
    await storage.upsertTournament(t)
    setTournaments((prev) => [...prev.filter((x) => x.id !== t.id), t])
  }, [])
  /** Functional update — reads the latest tournament so concurrent edits compose. */
  const updateTournament = useCallback(
    async (id: string, fn: (t: Tournament) => Tournament) => {
      let next: Tournament | undefined
      setTournaments((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t
          next = fn(t)
          return next
        }),
      )
      if (next) await storage.upsertTournament(next)
    },
    [],
  )
  const removeTournament = useCallback(async (id: string) => {
    await storage.deleteTournament(id)
    setTournaments((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const cardIndex = useMemo(() => buildCardIndex(customCards), [customCards])
  const fullIndex = useMemo(() => buildFullIndex(customCards), [customCards])
  const resolveCard = useCallback((id: string) => fullIndex[id], [fullIndex])

  const value: CollectionContextValue = {
    ready,
    settings,
    setSettings,
    cardIndex,
    fullIndex,
    resolveCard,
    customCards,
    entries,
    upsertEntry,
    removeEntry,
    upsertCard,
    importCards,
    applySync,
    removeCard,
    decks,
    upsertDeck,
    removeDeck,
    matches,
    upsertMatch,
    removeMatch,
    tournaments,
    upsertTournament,
    updateTournament,
    removeTournament,
  }

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCollection(): CollectionContextValue {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollection must be used within CollectionProvider')
  return ctx
}
