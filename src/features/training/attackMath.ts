/**
 * Attack-math trainer. Models the core OP combat question: given an attacker's
 * power and a defender's power, how much counter value is needed to survive, and
 * how many cards from hand that costs (card advantage lost by defending).
 *
 * Breakpoints emphasized: 5000 / 6000 / 7000 / 8000.
 */

export interface AttackProblem {
  attacker: number
  defender: number
  /** Counter value needed for defender power to meet/exceed attacker. */
  needed: number
  /** Minimum #cards to reach it using 1000/2000 counters (greedy 2000s first). */
  minCards: number
  /** Whether it is even survivable with at most 4 counter cards from hand. */
  survivable: boolean
}

const POWERS = [3000, 4000, 5000, 6000, 7000, 8000]
const ATTACKERS = [5000, 6000, 7000, 8000]

/** Greedy minimum counter cards (prefer 2000s, then 1000s). */
export function minCounterCards(needed: number): number {
  if (needed <= 0) return 0
  const twos = Math.floor(needed / 2000)
  const rem = needed - twos * 2000
  return twos + (rem > 0 ? 1 : 0) // a leftover <2000 still needs one 1000 (or a 2000)
}

export function solveAttack(attacker: number, defender: number): AttackProblem {
  const gap = attacker - defender
  const needed = gap > 0 ? Math.ceil(gap / 1000) * 1000 : 0
  const minCards = minCounterCards(needed)
  return {
    attacker,
    defender,
    needed,
    minCards,
    // Realistically you rarely commit >4 counters to one block.
    survivable: minCards <= 4,
  }
}

/** Deterministic-ish problem generator (index-seeded to vary without RNG state). */
export function makeAttackProblem(i: number): AttackProblem {
  const attacker = ATTACKERS[i % ATTACKERS.length]
  const defender = POWERS[(i * 3 + 1) % POWERS.length]
  return solveAttack(attacker, defender)
}

/**
 * Card-advantage framing: each counter card spent to survive is a card you lose
 * from hand. Returns a short coaching string.
 */
export function cardAdvantageNote(p: AttackProblem): string {
  if (p.needed === 0) return 'No counters needed — your character survives for free.'
  if (!p.survivable)
    return `Needs ${p.needed} counter value (~${p.minCards} cards) — usually not worth it; take the hit or let it die.`
  return `Survive by spending ${p.minCards} card${p.minCards > 1 ? 's' : ''} (${p.needed} counter value). That is ${p.minCards} card${p.minCards > 1 ? 's' : ''} of advantage traded for board.`
}
