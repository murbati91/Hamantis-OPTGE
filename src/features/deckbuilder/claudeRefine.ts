import type { Card } from '../../types'

/**
 * Optional "Refine with Claude" upgrade for the AI deck builder. The browser
 * NEVER calls Anthropic directly — this calls the app's own same-origin
 * `/api/deck/refine` backend route (see server/deck-refine.mjs), which is the
 * only place that ever holds the API key. Returns a concise textual critique
 * (suggested swaps + a game plan) for the deck the local engine produced.
 * The local builder works fully without this — refinement is a pure bonus.
 */
export async function refineWithClaude(opts: {
  leaderName: string
  archetype: string
  deckCards: { card: Card; count: number }[]
}): Promise<string> {
  let res: Response
  try {
    res = await fetch('/api/deck/refine', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        leaderName: opts.leaderName,
        archetype: opts.archetype,
        deckCards: opts.deckCards.map((d) => ({
          id: d.card.id,
          name: d.card.name,
          type: d.card.type,
          cost: d.card.cost,
          power: d.card.power,
          count: d.count,
        })),
      }),
    })
  } catch {
    // Network/DNS failure, backend down, offline, etc. — never surface "Failed to fetch".
    throw new Error('AI refinement is currently unavailable. Your deck was still built using local deck logic.')
  }

  if (!res.ok) {
    // 503 = backend reachable but no key configured; anything else = upstream/provider failure.
    throw new Error('AI refinement is currently unavailable. Your deck was still built using local deck logic.')
  }

  const data = await res.json().catch(() => null)
  if (!data || typeof data.text !== 'string') {
    throw new Error('AI refinement is currently unavailable. Your deck was still built using local deck logic.')
  }
  return data.text
}
