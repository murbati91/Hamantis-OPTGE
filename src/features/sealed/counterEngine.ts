import { COUNTER_SCENARIOS } from '../../data/counterScenarios'

export type BuildStyle = 'aggro' | 'midrange' | 'control'

export interface CounterInputs {
  /** How many 2K counters the sealed pool produced. */
  opened2k: number
  /** Count of strong removal in the pool. */
  strongRemoval: number
  /** Count of finishers / top-end in the pool. */
  finishers: number
  /** Whether the playable 2K bodies are good (vs defense-only). */
  goodBodies: boolean
  buildStyle: BuildStyle
}

export interface CounterRecommendation {
  /** Final recommended number of 2K counters to run. */
  recommended: number
  range: [number, number]
  /** Human-readable reasoning lines. */
  reasons: string[]
  /** How many to cut from the opened pool (if any). */
  toCut: number
}

const STYLE_RANGE: Record<BuildStyle, [number, number]> = {
  aggro: [8, 10],
  midrange: [10, 12],
  control: [11, 13],
}

/**
 * Encodes the handbook's "What If" 2K-counter rules into a single
 * recommendation. Start from the build-style baseline, then apply pool
 * modifiers (removal strength, finisher glut, body quality), and clamp to the
 * sane 8–13 envelope.
 */
export function recommendCounters(input: CounterInputs): CounterRecommendation {
  const reasons: string[] = []
  let [low, high] = STYLE_RANGE[input.buildStyle]
  reasons.push(
    `${cap(input.buildStyle)} build baseline: run ${low}–${high} 2K counters.`,
  )

  // Removal strength.
  if (input.strongRemoval >= 5) {
    // Trim counters — removal already protects you. The global 8–13 clamp
    // below provides the floor, so just step both ends down by one.
    low -= 1
    high -= 1
    reasons.push(
      '5+ strong removal — removal already protects you; trimming counters keeps pressure up.',
    )
  } else if (input.strongRemoval <= 2) {
    low += 1
    high += 1
    reasons.push(
      'Weak removal — you need more hand defense because you cannot answer threats cleanly.',
    )
  }

  // Body quality.
  if (input.goodBodies) {
    high += 1
    reasons.push('Good 2K bodies/effects — playable 2Ks are premium, lean higher.')
  } else {
    low = Math.max(8, low - 1)
    reasons.push('Bad 2K bodies/effects — defense-only cards weaken board development.')
  }

  // Finisher glut.
  if (input.finishers >= 5) {
    reasons.push('Too many finishers — cut high-cost cards before counters.')
  }

  // Clamp to the global envelope (8–13).
  low = clamp(low, 8, 13)
  high = clamp(high, low, 13)

  // Recommended point inside range, biased by opened pool size.
  let recommended = Math.round((low + high) / 2)
  if (input.opened2k >= 15) {
    recommended = Math.min(high, 11)
    reasons.push(
      'Opened 15 — auto-lock the best 9, add 10th/11th, add 12th only if a body/defense need. Cut the rest first.',
    )
  } else if (input.opened2k < low) {
    recommended = input.opened2k
    reasons.push(
      `Only ${input.opened2k} counters in pool — run them all; you are below target.`,
    )
  }
  recommended = clamp(recommended, low, high)

  const toCut = Math.max(0, input.opened2k - recommended)

  return { recommended, range: [low, high], reasons, toCut }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export { COUNTER_SCENARIOS }
