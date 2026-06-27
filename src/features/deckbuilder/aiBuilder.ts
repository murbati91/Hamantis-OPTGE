import type { Card, CardColor, Deck } from '../../types'

/**
 * Local "AI" deck-building agent — deterministic heuristics, no network needed.
 * Builds a legal 50-card constructed deck around a Leader: matches the Leader's
 * color, respects the 4-copy rule, hits an aggression-appropriate cost curve,
 * and scores cards by efficiency + counters + synergy with the Leader's traits.
 * (Users with an Anthropic key can then refine the result with Claude.)
 */

const COLORS: CardColor[] = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow']
const DECK_SIZE = 50
const MAX_COPIES = 4

export type Aggression = 'aggro' | 'midrange' | 'control'

export interface BuildRequest {
  pool: Card[]
  /** Pick-a-leader mode. */
  leaderId?: string
  /** Describe-a-strategy mode (free text). */
  strategy?: string
}

export interface BuildResult {
  leader: Card
  archetype: string
  aggression: Aggression
  /** cardId -> count (sums to 50). */
  deck: Record<string, number>
  curve: Record<number, number>
  reasoning: string[]
}

/** Cost-curve targets per play style (sums to 50). */
const CURVES: Record<Aggression, Record<number, number>> = {
  aggro: { 1: 4, 2: 12, 3: 12, 4: 10, 5: 6, 6: 4, 7: 2 },
  midrange: { 1: 2, 2: 8, 3: 10, 4: 10, 5: 8, 6: 6, 7: 6 },
  control: { 2: 6, 3: 8, 4: 8, 5: 8, 6: 10, 7: 10 },
}

const has = (re: RegExp, c: Card) => re.test(c.effect ?? '')
const isBlocker = (c: Card) => c.isBlocker === true || has(/\[blocker\]/i, c)
const isCounter = (c: Card) => (c.counter ?? 0) >= 1000 || c.is2kCounter === true
const isRemoval = (c: Card) =>
  c.isRemoval === true || has(/\b(k\.?o\.?|trash|return .* to|-\d{3,}\s*power)\b/i, c)
const isDraw = (c: Card) => has(/draw|look at|reveal/i, c)
const isRush = (c: Card) => has(/\[rush\]/i, c)

/** Estimate a 0–10 quality score for a non-leader card relative to a Leader. */
function scoreCard(card: Card, leader: Card, aggr: Aggression): number {
  let s = card.sealedRating ?? 0
  if (!s) {
    // Derive a baseline from efficiency when no handbook rating exists.
    const cost = card.cost ?? 1
    const power = card.power ?? 0
    s = Math.min(8, power / 1000 / Math.max(1, cost) + (card.type === 'Event' ? 5 : 4))
  }
  // Universal value signals.
  if (isCounter(card)) s += card.counter === 2000 ? 1.2 : 0.6
  if (isBlocker(card)) s += 1.0
  if (isRemoval(card)) s += 1.4
  if (isDraw(card)) s += 0.6
  // Trait synergy with the Leader (shared traits = archetype glue).
  const lt = new Set(leader.traits ?? [])
  const shared = (card.traits ?? []).filter((t) => lt.has(t)).length
  s += shared * 0.9
  // Play-style shaping.
  const cost = card.cost ?? 0
  if (aggr === 'aggro') {
    if (isRush(card)) s += 1.2
    if (cost <= 3) s += 0.6
    if (cost >= 6) s -= 0.8
  } else if (aggr === 'control') {
    if (isRemoval(card) || isBlocker(card)) s += 0.6
    if (cost >= 6) s += 0.5
  }
  return s
}

/** Parse a free-text strategy into a color preference + aggression. */
function parseStrategy(text: string): { colors: CardColor[]; aggr: Aggression } {
  const t = text.toLowerCase()
  const colors = COLORS.filter((c) => t.includes(c.toLowerCase()))
  let aggr: Aggression = 'midrange'
  if (/aggr|rush|fast|beatdown|aggro|tempo|swarm/.test(t)) aggr = 'aggro'
  else if (/control|stall|defensiv|late|grind|removal|mill/.test(t)) aggr = 'control'
  return { colors, aggr }
}

/** Choose the strongest Leader matching the requested colors/aggression. */
function pickLeader(pool: Card[], colors: CardColor[], aggr: Aggression): Card | undefined {
  const leaders = pool.filter((c) => c.type === 'Leader')
  const wanted = colors.length ? leaders.filter((l) => l.color.some((c) => colors.includes(c))) : leaders
  const list = wanted.length ? wanted : leaders
  return [...list].sort((a, b) => {
    // Prefer rated leaders; for aggro favour lower-life aggressive leaders.
    const ra = (a.sealedRating ?? 6) - (aggr === 'aggro' ? (a.life ?? 4) * 0.1 : 0)
    const rb = (b.sealedRating ?? 6) - (aggr === 'aggro' ? (b.life ?? 4) * 0.1 : 0)
    return rb - ra || a.id.localeCompare(b.id)
  })[0]
}

const detectAggression = (leader: Card): Aggression => {
  // Low-life leaders tend to be aggressive; high-life ones tend to grind.
  if ((leader.life ?? 4) <= 4) return 'aggro'
  if ((leader.life ?? 5) >= 5 && /draw|trash|rest|k\.?o/i.test(leader.effect ?? '')) return 'control'
  return 'midrange'
}

function archetypeName(leader: Card, aggr: Aggression): string {
  const color = leader.color.join('/')
  const trait = leader.traits?.[0]
  const style = aggr === 'aggro' ? 'Aggro' : aggr === 'control' ? 'Control' : 'Midrange'
  return trait ? `${color} ${trait} ${style}` : `${color} ${style}`
}

/** Build a 50-card deck. Throws if no valid Leader can be resolved. */
export function buildDeck(req: BuildRequest): BuildResult {
  const byId = new Map(req.pool.map((c) => [c.id, c]))
  let leader: Card | undefined
  let aggr: Aggression = 'midrange'

  if (req.leaderId) {
    leader = byId.get(req.leaderId)
    if (!leader || leader.type !== 'Leader') throw new Error('Pick a valid Leader card.')
    aggr = detectAggression(leader)
  } else {
    const { colors, aggr: a } = parseStrategy(req.strategy ?? '')
    aggr = a
    leader = pickLeader(req.pool, colors, a)
    if (!leader) throw new Error('No Leader found for that strategy.')
  }

  const colors = leader.color
  // Candidate pool: non-leader cards sharing a Leader color.
  const candidates = req.pool
    .filter(
      (c) =>
        c.id !== leader!.id &&
        c.type !== 'Leader' &&
        c.type !== 'DON!!' &&
        c.color.some((col) => colors.includes(col)),
    )
    .map((c) => ({ c, score: scoreCard(c, leader!, aggr) }))
    .sort((a, b) => b.score - a.score || a.c.id.localeCompare(b.c.id))

  // Tiered, curve-aware fill so the result reads like a real decklist rather
  // than a handful of 4-ofs: the top STAPLES cards run 4 copies (consistency),
  // everything after runs 2 (role-players) — all kept within the cost curve.
  const target = CURVES[aggr]
  const deck: Record<string, number> = {}
  const bucketFilled: Record<number, number> = {}
  let total = 0
  let staples = 0
  const STAPLES = 6

  const bucketOf = (cost: number) => (cost >= 7 ? 7 : cost <= 1 ? 1 : cost)

  for (const { c } of candidates) {
    if (total >= DECK_SIZE) break
    const b = bucketOf(c.cost ?? 0)
    const cap = target[b] ?? 0
    const filled = bucketFilled[b] ?? 0
    if (filled >= cap) continue // bucket already meets its curve target
    const want = staples < STAPLES ? MAX_COPIES : 2
    const room = Math.min(want, MAX_COPIES, cap - filled, DECK_SIZE - total)
    if (room <= 0) continue
    deck[c.id] = room
    bucketFilled[b] = filled + room
    total += room
    staples++
  }

  // Top up any shortfall (singletons of the best remaining cards, ≤4 copies).
  if (total < DECK_SIZE) {
    for (const { c } of candidates) {
      if (total >= DECK_SIZE) break
      const cur = deck[c.id] ?? 0
      if (cur >= MAX_COPIES) continue
      deck[c.id] = cur + 1
      total += 1
    }
  }

  // Final curve readout.
  const curve: Record<number, number> = {}
  let counters = 0
  let removal = 0
  let events = 0
  for (const [id, n] of Object.entries(deck)) {
    const c = byId.get(id)!
    const b = bucketOf(c.cost ?? 0)
    curve[b] = (curve[b] ?? 0) + n
    if (isCounter(c)) counters += n
    if (isRemoval(c)) removal += n
    if (c.type === 'Event') events += n
  }

  const reasoning = [
    `Built a ${total}-card ${archetypeName(leader, aggr)} deck around ${leader.name}.`,
    `Color-locked to ${colors.join('/')} (every card matches the Leader's color).`,
    `Curve tuned for ${aggr} play: ${Object.entries(curve)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([k, v]) => `${k}${Number(k) >= 7 ? '+' : ''}:${v}`)
      .join('  ')}.`,
    `Defensive layer: ${counters} counter cards, ${removal} removal, ${events} events.`,
    `Max 4 copies per card enforced; cards ranked by efficiency + ${leader.traits?.[0] ?? 'archetype'} synergy.`,
  ]

  return { leader, archetype: archetypeName(leader, aggr), aggression: aggr, deck, curve, reasoning }
}

/** Convert a build result into a saveable Deck. */
export function buildResultToDeck(result: BuildResult, now: number, id: string): Deck {
  return {
    id,
    name: result.archetype,
    leaderId: result.leader.id,
    cards: result.deck,
    createdAt: now,
    updatedAt: now,
  }
}
