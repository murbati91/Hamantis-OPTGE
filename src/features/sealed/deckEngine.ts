import type { Card, Deck, DeckAnalysis, TargetStatus } from '../../types'
import { DECK_COMPOSITION_TARGETS } from '../../data/counterScenarios'
import { is2kCounter, isBlocker, isRemoval } from '../../lib/cards'

export const DECK_TARGET_SIZE = 40

/** Analyze a deck's composition against the handbook 40-card targets. */
export function analyzeDeck(deck: Deck, index: Record<string, Card>): DeckAnalysis {
  const entries = Object.entries(deck.cards).filter(([, n]) => n > 0)

  let total = 0
  let counters = 0
  let blockers = 0
  let removal = 0
  let earlyBodies = 0
  let midThreats = 0
  let finishers = 0
  const curve: Record<number, number> = {}

  for (const [cardId, count] of entries) {
    const card = index[cardId]
    if (!card || card.type === 'Leader') continue
    total += count
    if (is2kCounter(card)) counters += count
    if (isBlocker(card)) blockers += count
    if (isRemoval(card)) removal += count
    const cost = card.cost ?? 0
    curve[cost] = (curve[cost] ?? 0) + count
    if (card.type === 'Character') {
      if (cost <= 3) earlyBodies += count
      else if (cost <= 6) midThreats += count
      else finishers += count
    }
  }

  const byLabel: Record<string, number> = {
    '2K counters': counters,
    Blockers: blockers,
    Removal: removal,
    'Early bodies': earlyBodies,
    'Mid threats': midThreats,
    Finishers: finishers,
  }

  const targets: TargetStatus[] = DECK_COMPOSITION_TARGETS.map((t) => {
    const count = byLabel[t.label] ?? 0
    const status: TargetStatus['status'] =
      count < t.min ? 'low' : count > t.max ? 'high' : 'ok'
    return { label: t.label, count, min: t.min, max: t.max, status }
  })

  const notes: string[] = []
  if (total < DECK_TARGET_SIZE) notes.push(`Add ${DECK_TARGET_SIZE - total} more cards to reach 40.`)
  if (total > DECK_TARGET_SIZE) notes.push(`Cut ${total - DECK_TARGET_SIZE} cards down to 40.`)
  if (!deck.leaderId) notes.push('Pick a leader to build around.')
  for (const t of targets) {
    if (t.status === 'low') notes.push(`${t.label}: ${t.count}/${t.min}–${t.max} — too few.`)
    if (t.status === 'high') notes.push(`${t.label}: ${t.count}/${t.min}–${t.max} — consider trimming.`)
  }
  if (finishers >= 6) notes.push('Too many finishers — cut the highest-cost cards first.')

  return {
    total,
    counters,
    blockers,
    removal,
    earlyBodies,
    midThreats,
    finishers,
    curve,
    targets,
    notes,
  }
}

/** Count total non-leader cards in a deck. */
export function deckSize(deck: Deck): number {
  return Object.values(deck.cards).reduce((s, n) => s + n, 0)
}
