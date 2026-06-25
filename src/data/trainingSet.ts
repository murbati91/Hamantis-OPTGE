import type { Card } from '../types'
import { ALL_CARDS } from './allCards'
import { OP16_DEMO_CARDS } from './op16-demo'

/**
 * The card universe powering the wallet, sealed simulator, deck builder, and
 * practice duel is now the COMPLETE real card pool — every set baked offline
 * from Limitless (see src/data/allCards.ts + scripts/scrape-limitless.mjs).
 *
 * The Praying Mantis handbook hand-rated a handful of OP16 cards
 * (OP16_DEMO_CARDS). We overlay that curated sealed guidance — sealedRating,
 * sealedRole, whatIf — onto the matching real card by id, keeping the real
 * name/stats/effect/art. Deterministic (no Math.random here).
 */

// Handbook guidance keyed by card id.
const HANDBOOK_GUIDANCE: Record<
  string,
  Pick<Card, 'sealedRating' | 'sealedRole' | 'whatIf'>
> = Object.fromEntries(
  OP16_DEMO_CARDS.map((c) => [
    c.id,
    { sealedRating: c.sealedRating, sealedRole: c.sealedRole, whatIf: c.whatIf },
  ]),
)

/** Every real card (all sets) with handbook sealed guidance merged in where available. */
export const TRAINING_SET: Card[] = ALL_CARDS.map((card) => {
  const guidance = HANDBOOK_GUIDANCE[card.id]
  if (!guidance) return card
  return {
    ...card,
    ...(guidance.sealedRating != null ? { sealedRating: guidance.sealedRating } : {}),
    ...(guidance.sealedRole ? { sealedRole: guidance.sealedRole } : {}),
    ...(guidance.whatIf ? { whatIf: guidance.whatIf } : {}),
  }
})

/** OP16-only view (kept for the sealed handbook page / OP16-specific guidance). */
export const OP16_CARDS: Card[] = TRAINING_SET.filter((c) => c.setCode === 'OP16')

/** Leaders / non-leaders across ALL sets (used by the sealed simulator + duel). */
export const TRAINING_LEADERS = TRAINING_SET.filter(
  (c) => c.type === 'Leader' && (c.power ?? 0) > 0,
)
export const TRAINING_NONLEADERS = TRAINING_SET.filter((c) => c.type !== 'Leader')
