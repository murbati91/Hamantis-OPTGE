import type { Card } from './card'

/** A simulated sealed pool: a leader choice set + the card pool opened. */
export interface SealedPool {
  id: string
  createdAt: number
  /** Leader options the player opened (pick one to build around). */
  leaders: string[] // card ids
  /** Non-leader cards opened (may contain duplicates as separate ids#copy). */
  cards: PoolCard[]
  /** Pack count used to generate this pool. */
  packs: number
}

/** A single opened copy in a pool (cardId + a per-copy instance id). */
export interface PoolCard {
  instanceId: string
  cardId: string
}

/** A built deck (sealed or constructed). */
export interface Deck {
  id: string
  name: string
  leaderId: string | null
  /** cardId -> count in the deck. */
  cards: Record<string, number>
  /** Optional link to the pool it was built from. */
  poolId?: string
  createdAt: number
  updatedAt: number
}

/** Live analysis of a deck against the handbook composition targets. */
export interface DeckAnalysis {
  total: number // non-leader cards (target 40)
  counters: number
  blockers: number
  removal: number
  earlyBodies: number // cost <= 3 characters
  midThreats: number // cost 4-6
  finishers: number // cost >= 7
  /** Average non-leader cost. */
  curve: Record<number, number>
  /** Per-target status with delta vs range. */
  targets: TargetStatus[]
  notes: string[]
}

export interface TargetStatus {
  label: string
  count: number
  min: number
  max: number
  status: 'low' | 'ok' | 'high'
}

export type ResolvedPoolCard = PoolCard & { card: Card }
