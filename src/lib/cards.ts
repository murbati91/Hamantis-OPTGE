import type { Card, CardColor } from '../types'
import { TRAINING_SET } from '../data/trainingSet'

/** Color identity -> hex (for placeholders, badges). */
export const COLOR_HEX: Record<CardColor, string> = {
  Red: '#dc2626',
  Green: '#16a34a',
  Blue: '#2563eb',
  Purple: '#7c3aed',
  Black: '#374151',
  Yellow: '#eab308',
}

const LIMITLESS_CDN = 'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece'

/** Build a clean Limitless scan URL for a card in the given language. */
function limitlessImage(card: Card, lang: 'EN' | 'JP'): string {
  return `${LIMITLESS_CDN}/${card.setCode}/${card.id}_${lang}.webp`
}

/**
 * Ordered list of image URLs to try for a card. We NEVER emit a watermarked
 * source: Bandai's official card-list images (onepiece-cardgame.com) carry a
 * "Sample" stamp, and Limitless Japanese pre-release scans (`_JP.webp`) of the
 * newest sets (e.g. OP16) are also "SAMPLE"-stamped. We therefore only ever
 * offer a clean custom URL (if it's neither of those) plus the clean Limitless
 * ENGLISH scan by code. When the EN scan 404s, CardImage falls back to a
 * generated placeholder — the desired "no sample art ever" behavior.
 */
export function cardImageCandidates(card: Card): string[] {
  const out: string[] = []
  const own = card.imageUrl
  const isBandai = !!own && /onepiece-cardgame\.com/i.test(own)
  const isLimitlessJp = !!own && /_JP\.webp(\?.*)?$/i.test(own)
  // A user-supplied / already-clean URL wins — but never the watermarked ones.
  if (own && !isBandai && !isLimitlessJp) out.push(own)
  // Clean Limitless ENGLISH scan by code (never the JP sample scan).
  if (/^[A-Z0-9]+-\d+/i.test(card.id)) {
    out.push(limitlessImage(card, 'EN'))
  }
  return [...new Set(out)]
}

/** Whether a card carries a 2000 counter (used by the 2K-counter filter). */
export function is2kCounter(card: Card): boolean {
  return card.is2kCounter === true || card.counter === 2000
}

export function isBlocker(card: Card): boolean {
  return card.isBlocker === true || /\[?blocker\]?/i.test(card.effect)
}

export function isRemoval(card: Card): boolean {
  return (
    card.isRemoval === true ||
    /\b(k\.?o\.?|trash|return .* to|-\d{3,} power)\b/i.test(card.effect)
  )
}

/** 1000+ power counter value in hand (the broader "counter" role, vs. the strict 2K filter above). */
export function isCounter(card: Card): boolean {
  return (card.counter ?? 0) >= 1000 || is2kCounter(card)
}

export function isRush(card: Card): boolean {
  return /\[rush\]/i.test(card.effect ?? '')
}

/** Card draw / hand or board information advantage (not deck-searching — see isSearcher). */
export function isDraw(card: Card): boolean {
  return /\bdraw\b|\blook at (the )?top\b|\breveal\b/i.test(card.effect ?? '')
}

/** Deck-thinning / tutor effects — finding a specific piece rather than just drawing. */
export function isSearcher(card: Card): boolean {
  return /\bsearch your (deck|trash)\b|\badd it to your hand\b|\blook at (up to )?\d+ cards? (of|from) your deck\b/i.test(
    card.effect ?? '',
  )
}

/** DON!! ramp/acceleration — adding or reusing DON!! beyond the printed rate-of-1-per-turn. */
export function isDonRamp(card: Card): boolean {
  return /\bdon!!.*(add|rest|return)\b|\badd .*don!!\b|\bdon!! card/i.test(card.effect ?? '')
}

/** High-impact closers: big attackers or on-attack effects meant to end the game. */
export function isFinisher(card: Card): boolean {
  if (card.type !== 'Character') return false
  const cost = card.cost ?? 0
  const power = card.power ?? 0
  if (cost >= 7 && power >= 8000) return true
  if (power >= 9000) return true
  return /\bk\.?o\.?\b.*\bwhen attacking\b|\bwhen attacking\b.*\bk\.?o\.?\b/i.test(card.effect ?? '')
}

/**
 * Browsable wallet index = the COMPLETE real card universe (all sets) + user
 * custom cards. (Custom cards override a real card on id clash, e.g. a
 * user-edited copy.)
 */
export function buildCardIndex(customCards: Card[]): Record<string, Card> {
  const index: Record<string, Card> = {}
  for (const c of TRAINING_SET) index[c.id] = c
  for (const c of customCards) index[c.id] = c
  return index
}

/** Full resolver index = training set (incl. demo) + custom. Used by sealed/deck tools. */
export function buildFullIndex(customCards: Card[]): Record<string, Card> {
  const index: Record<string, Card> = {}
  for (const c of TRAINING_SET) index[c.id] = c
  for (const c of customCards) index[c.id] = c
  return index
}

export function allCards(customCards: Card[]): Card[] {
  return Object.values(buildCardIndex(customCards))
}
