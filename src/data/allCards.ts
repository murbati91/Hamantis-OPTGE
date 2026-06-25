import type { Card } from '../types'

/**
 * The COMPLETE One Piece card universe, baked offline from the Limitless
 * database (see scripts/scrape-limitless.mjs). Every set lives as its own
 * JSON under ./sets and is glob-imported here, so adding/refreshing a set is
 * drop-in — no edit to this file needed.
 *
 * Images point at the clean Limitless ENGLISH scans; cards without an EN scan
 * yet (newest sets) fall back to a generated placeholder in the UI — never a
 * "SAMPLE"-stamped image.
 */
const modules = import.meta.glob('./sets/*.json', { eager: true }) as Record<
  string,
  { default: Card[] }
>

function load(): Card[] {
  const byId = new Map<string, Card>()
  for (const mod of Object.values(modules)) {
    for (const card of mod.default ?? []) {
      if (card && card.id && !byId.has(card.id)) byId.set(card.id, card)
    }
  }
  return [...byId.values()].sort((a, b) =>
    a.setCode === b.setCode
      ? (a.number ?? '').localeCompare(b.number ?? '')
      : a.setCode.localeCompare(b.setCode),
  )
}

export const ALL_CARDS: Card[] = load()

/** Distinct set codes present, sorted (e.g. ['EB01', …, 'OP16', 'ST01', …]). */
export const ALL_SETS: string[] = [...new Set(ALL_CARDS.map((c) => c.setCode))].sort()
