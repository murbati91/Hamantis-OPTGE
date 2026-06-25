import type { PoolCard, SealedPool } from '../../types'
import { TRAINING_LEADERS, TRAINING_NONLEADERS } from '../../data/trainingSet'
import type { Card, Rarity } from '../../types'

/**
 * Simulate opening sealed packs. An OP booster ≈ 12 cards. We approximate the
 * rarity slots per pack and draw from the synthetic training set so the player
 * gets a realistic, buildable pool to practice with.
 */

const PACK_SIZE = 12
const DEFAULT_PACKS = 6 // standard prerelease sealed

// Per-pack rarity slots (approximate): mostly commons, a couple UC, ~1 R, chance of SR/SEC.
function packRaritySlots(r: () => number): Rarity[] {
  const slots: Rarity[] = []
  for (let i = 0; i < 7; i++) slots.push('C')
  for (let i = 0; i < 3; i++) slots.push('UC')
  slots.push('R')
  // last slot: SR (with small SEC chance)
  slots.push(r() > 0.92 ? 'SEC' : 'SR')
  return slots
}

function drawByRarity(pool: Card[], rarity: Rarity, r: () => number): Card {
  const matches = pool.filter((c) => c.rarity === rarity)
  const list = matches.length ? matches : pool
  return list[Math.floor(r() * list.length)]
}

/** Seeded Fisher–Yates shuffle (uniform, unlike `.sort(() => r() - 0.5)`). */
function shuffle<T>(arr: T[], r: () => number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface GeneratePoolOpts {
  packs?: number
  seed?: number
}

export function generateSealedPool(opts: GeneratePoolOpts = {}): SealedPool {
  const packs = opts.packs ?? DEFAULT_PACKS
  // App-runtime randomness is fine; allow an explicit seed for reproducible tests.
  const seed = opts.seed ?? Math.floor(Math.random() * 0xffffffff)
  const r = makeRng(seed)

  const cards: PoolCard[] = []
  let counter = 0
  for (let p = 0; p < packs; p++) {
    for (const rarity of packRaritySlots(r)) {
      const card = drawByRarity(TRAINING_NONLEADERS, rarity, r)
      cards.push({ instanceId: `c${counter++}`, cardId: card.id })
    }
  }

  // Offer 2–3 leader options from the pool's colors.
  const leaderCount = 2 + (r() > 0.5 ? 1 : 0)
  const shuffledLeaders = shuffle(TRAINING_LEADERS, r)
  const leaders = shuffledLeaders.slice(0, leaderCount).map((l) => l.id)

  return {
    id: `pool-${seed.toString(36)}`,
    createdAt: Date.now(),
    leaders,
    cards,
    packs,
  }
}

export { PACK_SIZE, DEFAULT_PACKS }
