import type { Card, CardColor, Deck, TargetStatus } from '../../types'
import { CONSTRUCTED_50_TARGETS } from '../../data/counterScenarios'
import { isBlocker, isCounter, isRemoval, isDraw, isRush, isSearcher, isDonRamp, isFinisher } from '../../lib/cards'

/**
 * Local "AI" deck-building agent — deterministic heuristics, no network needed.
 * Builds a legal 50-card constructed deck around a Leader: matches the Leader's
 * color, respects the 4-copy rule, hits an aggression-appropriate cost curve,
 * and scores cards on a weighted model (color legality, Leader/archetype
 * synergy, curve fit, counter value, removal/defense, searchability, finisher
 * value, redundancy/consistency, off-plan penalty).
 * (Users can then optionally refine the result with Claude via the backend
 * refine route — see claudeRefine.ts.)
 */

const COLORS: CardColor[] = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow']
export const DECK_SIZE = 50
const MAX_COPIES = 4

export type Aggression = 'aggro' | 'midrange' | 'control'

export interface BuildRequest {
  pool: Card[]
  /** Pick-a-leader mode. */
  leaderId?: string
  /** Describe-a-strategy mode (free text). */
  strategy?: string
}

/** Role-distribution + composition-target readout for a built deck (mirrors the sealed DeckAnalysis shape). */
export interface DeckRoleAnalysis {
  roles: Record<string, number>
  targets: TargetStatus[]
  /** Weak-deck warnings / improvement suggestions, empty if the deck looks solid. */
  notes: string[]
}

export interface BuildResult {
  leader: Card
  archetype: string
  aggression: Aggression
  /** cardId -> count (sums to 50). */
  deck: Record<string, number>
  curve: Record<number, number>
  analysis: DeckRoleAnalysis
  reasoning: string[]
}

/** Cost-curve targets per play style (sums to 50). */
const CURVES: Record<Aggression, Record<number, number>> = {
  aggro: { 1: 4, 2: 12, 3: 12, 4: 10, 5: 6, 6: 4, 7: 2 },
  midrange: { 1: 2, 2: 8, 3: 10, 4: 10, 5: 8, 6: 6, 7: 6 },
  control: { 2: 6, 3: 8, 4: 8, 5: 8, 6: 10, 7: 10 },
}

/** Scoring weights — tuned so synergy/redundancy dominate over raw stat-line efficiency. */
const WEIGHTS = {
  leaderSynergyPerTrait: 1.4, // high weight: shared trait with the Leader's archetype
  archetypeNameMatch: 1.0, // bonus when the card's own effect mentions the Leader's name directly
  counter1k: 0.6,
  counter2k: 1.2,
  blocker: 1.0,
  removal: 1.4,
  searcher: 0.8, // medium weight: consistency/searchability
  finisher: 1.1, // medium weight: closing power
  draw: 0.5,
  donRamp: 0.5,
  offPlanPenalty: -1.2, // penalty: shares the Leader's color but no archetype/trait/role overlap at all
} as const

const has = (re: RegExp, c: Card) => re.test(c.effect ?? '')

/** Estimate a 0–10+ quality score for a non-leader card relative to a Leader. */
function scoreCard(card: Card, leader: Card, aggr: Aggression): number {
  let s = card.sealedRating ?? 0
  if (!s) {
    // Derive a baseline from efficiency when no handbook rating exists (the
    // vast majority of the pool — only a curated OP16 subset has a manual rating).
    const cost = card.cost ?? 1
    const power = card.power ?? 0
    s = Math.min(8, power / 1000 / Math.max(1, cost) + (card.type === 'Event' ? 5 : 4))
  }

  // Leader/archetype synergy (high weight) — shared traits are the archetype glue.
  const lt = new Set(leader.traits ?? [])
  const shared = (card.traits ?? []).filter((t) => lt.has(t)).length
  s += shared * WEIGHTS.leaderSynergyPerTrait
  const leaderName = (leader.name ?? '').split(/[.\s]+/)[0]
  const mentionsLeader = leaderName.length > 2 && has(new RegExp(`\\b${leaderName}\\b`, 'i'), card)
  if (mentionsLeader) s += WEIGHTS.archetypeNameMatch
  if (shared === 0 && !mentionsLeader) {
    // Off-plan penalty: legal color, but nothing ties it to this Leader's plan.
    s += WEIGHTS.offPlanPenalty
  }

  // Role/utility signals (medium weight each, per the deck-builder scoring model).
  if (isCounter(card)) s += card.counter === 2000 ? WEIGHTS.counter2k : WEIGHTS.counter1k
  if (isBlocker(card)) s += WEIGHTS.blocker
  if (isRemoval(card)) s += WEIGHTS.removal
  if (isSearcher(card)) s += WEIGHTS.searcher
  if (isFinisher(card)) s += WEIGHTS.finisher
  if (isDraw(card)) s += WEIGHTS.draw
  if (isDonRamp(card)) s += WEIGHTS.donRamp

  // Play-style shaping (curve fit).
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
  // Repeat passes — not just one — until the deck hits DECK_SIZE or every
  // candidate is maxed out, otherwise a small candidate pool (narrow color
  // splits, early sets) could silently leave the deck short of 50 cards.
  while (total < DECK_SIZE) {
    let addedThisPass = false
    for (const { c } of candidates) {
      if (total >= DECK_SIZE) break
      const cur = deck[c.id] ?? 0
      if (cur >= MAX_COPIES) continue
      deck[c.id] = cur + 1
      total += 1
      addedThisPass = true
    }
    if (!addedThisPass) break // candidate pool exhausted at MAX_COPIES each
  }

  // Final curve readout.
  const curve: Record<number, number> = {}
  for (const [id, n] of Object.entries(deck)) {
    const c = byId.get(id)!
    const b = bucketOf(c.cost ?? 0)
    curve[b] = (curve[b] ?? 0) + n
  }

  const analysis = analyzeAiDeck(deck, byId, total)
  const legality = validateDeckLegality(deck, leader, byId)

  const reasoning = [
    `Built a ${total}-card ${archetypeName(leader, aggr)} deck around ${leader.name}.`,
    `Color-locked to ${colors.join('/')} (every card matches the Leader's color).`,
    `Curve tuned for ${aggr} play: ${Object.entries(curve)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([k, v]) => `${k}${Number(k) >= 7 ? '+' : ''}:${v}`)
      .join('  ')}.`,
    `Defensive layer: ${analysis.roles['Counters (1K+)'] ?? 0} counter cards, ${analysis.roles.Removal ?? 0} removal, ${analysis.roles.Events ?? 0} events.`,
    `Max 4 copies per card enforced; cards ranked by efficiency + ${leader.traits?.[0] ?? 'archetype'} synergy.`,
    ...(total < DECK_SIZE
      ? [`⚠ Only ${candidates.length} legal cards match this Leader's colors — deck is ${total}/${DECK_SIZE}, short by ${DECK_SIZE - total}.`]
      : []),
    ...(legality.errors.length ? legality.errors.map((e) => `⚠ ${e}`) : []),
  ]

  return { leader, archetype: archetypeName(leader, aggr), aggression: aggr, deck, curve, analysis, reasoning }
}

/** Role distribution + weak-deck detection for a built 50-card deck. */
function analyzeAiDeck(
  deck: Record<string, number>,
  byId: Map<string, Card>,
  total: number,
): DeckRoleAnalysis {
  let counters = 0
  let blockers = 0
  let removal = 0
  let searchers = 0
  let finishers = 0
  let events = 0
  let earlyBodies = 0
  let midThreats = 0

  for (const [id, n] of Object.entries(deck)) {
    const c = byId.get(id)
    if (!c) continue
    if (isCounter(c)) counters += n
    if (isBlocker(c)) blockers += n
    if (isRemoval(c)) removal += n
    if (isSearcher(c)) searchers += n
    if (isFinisher(c)) finishers += n
    if (c.type === 'Event') events += n
    if (c.type === 'Character') {
      const cost = c.cost ?? 0
      if (cost <= 3) earlyBodies += n
      else if (cost <= 6) midThreats += n
    }
  }

  const roles: Record<string, number> = {
    'Counters (1K+)': counters,
    Blockers: blockers,
    Removal: removal,
    'Early bodies': earlyBodies,
    'Mid threats': midThreats,
    Finishers: finishers,
    Searchers: searchers,
    Events: events,
  }

  const targets: TargetStatus[] = CONSTRUCTED_50_TARGETS.map((t) => {
    const count = roles[t.label] ?? 0
    const status: TargetStatus['status'] = count < t.min ? 'low' : count > t.max ? 'high' : 'ok'
    return { label: t.label, count, min: t.min, max: t.max, status, hint: t.hint }
  })

  // Per-target low/high call-outs now render inline in DeckAnalysisPanel's rows,
  // so notes[] is reserved for aggregate insights that don't fit any one target.
  const notes: string[] = []
  if (total !== DECK_SIZE) notes.push(`Deck has ${total}/${DECK_SIZE} cards.`)
  if (counters + blockers + removal < 12) {
    notes.push('Low overall defense (counters + blockers + removal) — this deck may fold to aggression.')
  }

  return { roles, targets, notes }
}

/** Final legality check — asserts the constructed-deck rules actually hold. */
export function validateDeckLegality(
  deck: Record<string, number>,
  leader: Card,
  byId: Map<string, Card>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const total = Object.values(deck).reduce((n, c) => n + c, 0)
  if (total !== DECK_SIZE) errors.push(`Deck must have exactly ${DECK_SIZE} cards (has ${total}).`)
  for (const [id, n] of Object.entries(deck)) {
    const c = byId.get(id)
    if (!c) {
      errors.push(`Unknown card id in deck: ${id}.`)
      continue
    }
    if (n > MAX_COPIES) errors.push(`${c.name} has ${n} copies — max ${MAX_COPIES} allowed.`)
    if (c.type === 'Leader' || c.type === 'DON!!') errors.push(`${c.name} (${c.type}) cannot be in the main deck.`)
    if (!c.color.some((col) => leader.color.includes(col))) {
      errors.push(`${c.name} does not match ${leader.name}'s color identity.`)
    }
  }
  return { valid: errors.length === 0, errors }
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
