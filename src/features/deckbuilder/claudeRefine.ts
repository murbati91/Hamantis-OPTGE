import type { Card } from '../../types'

/**
 * Optional "Refine with Claude" upgrade for the AI deck builder. Runs entirely
 * client-side with the user's own Anthropic key (stored on-device). Returns a
 * concise textual critique — suggested swaps + a game plan — for the deck the
 * local engine produced. The local builder works fully without this.
 */
export async function refineWithClaude(opts: {
  apiKey: string
  leaderName: string
  archetype: string
  deckCards: { card: Card; count: number }[]
}): Promise<string> {
  const deckList = opts.deckCards
    .map(
      (d) =>
        `${d.count}x ${d.card.name} (${d.card.id}, ${d.card.type}, cost ${d.card.cost ?? '-'}, power ${d.card.power ?? '-'})`,
    )
    .join('\n')

  const prompt = `You are a One Piece Card Game deckbuilding expert. Review this ${opts.archetype} deck.

Leader: ${opts.leaderName}
Deck (50 cards):
${deckList}

Give concise, specific feedback in under 180 words:
1. 3-5 concrete swap suggestions (cut X for Y, with a one-line reason).
2. A 2-sentence game plan.
Do not restate the whole list.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 160)}`)
  }
  const data = await res.json()
  const text = data?.content?.[0]?.text
  if (typeof text !== 'string') throw new Error('Unexpected Claude response shape.')
  return text
}
