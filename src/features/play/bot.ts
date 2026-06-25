import { def, effPower, opp } from './engine'
import type { Action, Difficulty, GameState, Side } from './types'

/* ------------------------------------------------------------------ *
 * Difficulty-aware bot AI.
 *
 * The engine has NO card effects, so difficulty is purely about the
 * QUALITY of combat decisions: which characters to play, how to spend
 * DON, what to attack, and when to block / counter.
 *
 *   easy   — casual, beatable by a brand-new player
 *   normal — the original heuristic (preserved exactly)
 *   hard   — smart resource use, favourable trades, protective defence
 *   god    — near-optimal combat math, finds lethal, never misplays
 *
 * Determinism: the engine is the source of truth and stays pure. Any
 * "randomness" the bot needs (only Easy) is derived from game state via
 * `jitter()` so replays stay stable.
 * ------------------------------------------------------------------ */

type Ref = 'leader' | string

interface Attacker {
  ref: Ref
  power: number
}

/** Stable pseudo-random in [0,1) derived from game state + a salt. */
function jitter(s: GameState, salt: string): number {
  let h = (2166136261 ^ s.turn) >>> 0
  for (const v of [
    s.players[0].board.length,
    s.players[1].board.length,
    s.players[1].hand.length,
    s.players[0].hand.length,
  ]) {
    h = Math.imul(h ^ v, 16777619) >>> 0
  }
  for (let i = 0; i < salt.length; i++) h = Math.imul(h ^ salt.charCodeAt(i), 16777619) >>> 0
  return (h >>> 0) / 4294967296
}

/** Un-rested, non-sick attackers this side controls (characters + leader). */
function activeAttackers(s: GameState, me: Side): Attacker[] {
  const p = s.players[me]
  const list: Attacker[] = []
  for (const c of p.board) {
    if (c.rested || c.playedThisTurn) continue
    list.push({ ref: c.uid, power: def(s, c.cardId).power + c.attachedDon * 1000 })
  }
  if (!p.leaderRested) list.push({ ref: 'leader', power: effPower(s, me, 'leader') })
  return list
}

/** Enemy characters that are currently attackable (rested), with stats. */
function restedEnemies(s: GameState, me: Side): { uid: string; power: number; blocker: boolean }[] {
  return s.players[opp(me)].board
    .filter((c) => c.rested)
    .map((c) => ({
      uid: c.uid,
      power: def(s, c.cardId).power + c.attachedDon * 1000,
      blocker: def(s, c.cardId).isBlocker,
    }))
}

/* ---------------- shared (normal) helpers ---------------- */

/** Highest-power board character that can still attack this turn (else null). */
function biggestAttacker(s: GameState, me: Side): string | null {
  let best: { uid: string; power: number } | null = null
  for (const c of s.players[me].board) {
    if (c.rested || c.playedThisTurn) continue
    const pw = def(s, c.cardId).power + c.attachedDon * 1000
    if (!best || pw > best.power) best = { uid: c.uid, power: pw }
  }
  return best?.uid ?? null
}

function nextAttacker(s: GameState, me: Side): Ref | null {
  const c = s.players[me].board.find((x) => !x.rested && !x.playedThisTurn)
  if (c) return c.uid
  if (!s.players[me].leaderRested) return 'leader'
  return null
}

function chooseTarget(s: GameState, me: Side, attacker: Ref): Ref {
  const atk = effPower(s, me, attacker)
  const enemy = s.players[opp(me)]
  let kill: { uid: string; power: number } | null = null
  for (const c of enemy.board) {
    if (!c.rested) continue // only rested characters are attackable
    const pw = def(s, c.cardId).power + c.attachedDon * 1000
    if (atk >= pw && (!kill || pw > kill.power)) kill = { uid: c.uid, power: pw }
  }
  return kill ? kill.uid : 'leader'
}

/* ---------------- hard / god planning ---------------- */

/** Could this side close the game out THIS turn (enough leader-beating hits)? */
function lethalAvailable(s: GameState, me: Side): boolean {
  const enemy = opp(me)
  const life = s.players[enemy].life
  const leaderPow = effPower(s, enemy, 'leader')
  const hits = activeAttackers(s, me).filter((a) => a.power >= leaderPow).length
  return hits >= life + 1
}

/** Pick the single best DON target this main phase (hard/god). */
function donTarget(s: GameState, me: Side, difficulty: Difficulty): Ref | null {
  const attackers = activeAttackers(s, me)
  if (!attackers.length) return null
  const budget = s.players[me].donAvailable * 1000
  const enemy = opp(me)
  const leaderPow = effPower(s, enemy, 'leader')

  // 1) Enable a KO of the highest-value reachable enemy threat (cheapest crossing).
  const threats = restedEnemies(s, me).sort((a, b) => b.power - a.power)
  for (const t of threats) {
    const reach = attackers
      .filter((a) => a.power < t.power && t.power - a.power <= budget)
      .sort((a, b) => t.power - a.power - (t.power - b.power))
    if (reach.length) return reach[0].ref
  }

  // 2) GOD: spread DON to push the cheapest under-leader attacker over the line
  //    (maximises the number of lethal-capable attackers across the turn).
  if (difficulty === 'god') {
    const under = attackers
      .filter((a) => a.power < leaderPow && leaderPow - a.power <= budget)
      .sort((a, b) => leaderPow - a.power - (leaderPow - b.power))
    if (under.length) return under[0].ref
  }

  // 3) Otherwise concentrate on the biggest attacker (punch through counters).
  return attackers.reduce((x, y) => (y.power > x.power ? y : x)).ref
}

/** Single best attack to declare next (hard/god). */
function planAttack(s: GameState, me: Side, difficulty: Difficulty): { attacker: Ref; target: Ref } | null {
  const attackers = activeAttackers(s, me)
  if (!attackers.length) return null
  const enemy = opp(me)
  const leaderPow = effPower(s, enemy, 'leader')

  // GOD: when a lethal line exists, commit to the Leader, biggest punch first.
  if (difficulty === 'god' && lethalAvailable(s, me)) {
    const over = attackers.filter((a) => a.power >= leaderPow).sort((a, b) => b.power - a.power)
    const a = over[0] ?? [...attackers].sort((x, y) => y.power - x.power)[0]
    return { attacker: a.ref, target: 'leader' }
  }

  // Favourable trades: KO a worthwhile threat with the SMALLEST sufficient
  // attacker, so big attackers stay free to push the Leader.
  const koFloor = difficulty === 'god' ? 3000 : 4000
  const worthKO = restedEnemies(s, me)
    .filter((t) => t.blocker || t.power >= koFloor)
    .sort((a, b) => b.power - a.power)
  for (const t of worthKO) {
    const killer = attackers.filter((a) => a.power >= t.power).sort((a, b) => a.power - b.power)[0]
    if (killer) return { attacker: killer.ref, target: t.uid }
  }

  // Otherwise push Leader damage with the biggest attacker.
  const big = [...attackers].sort((a, b) => b.power - a.power)[0]
  return { attacker: big.ref, target: 'leader' }
}

/* ================================================================== *
 *  MAIN ENTRY: one bot action for its own turn.
 * ================================================================== */
export function nextBotAction(s: GameState, difficulty: Difficulty = 'normal'): Action | null {
  const me = s.active
  const p = s.players[me]

  if (s.phase === 'main') {
    // 1) Play a character from hand.
    const playable = p.hand
      .map((id) => ({ id, d: def(s, id) }))
      .filter((x) => x.d.type === 'Character' && x.d.cost <= p.donAvailable)
    if (playable.length) {
      const pick =
        difficulty === 'easy'
          ? playable[Math.floor(jitter(s, 'play') * playable.length)] // random affordable (not the best)
          : playable.reduce((a, b) => (b.d.cost > a.d.cost ? b : a)) // highest-cost affordable
      return { t: 'play', cardId: pick.id }
    }

    // 2) Spend DON.
    if (p.donAvailable > 0) {
      if (difficulty === 'easy') {
        // Attach randomly, or not at all.
        if (jitter(s, 'don') < 0.4) {
          const all = activeAttackers(s, me)
          if (all.length) return { t: 'attachDon', target: all[Math.floor(jitter(s, 'rdon') * all.length)].ref }
        }
        return { t: 'toAttack' }
      }
      if (difficulty === 'normal') {
        const target = biggestAttacker(s, me) ?? (!p.leaderRested ? 'leader' : null)
        if (target) return { t: 'attachDon', target }
      } else {
        const target = donTarget(s, me, difficulty)
        if (target) return { t: 'attachDon', target }
      }
    }
    return { t: 'toAttack' }
  }

  if (s.phase === 'attack') {
    if (difficulty === 'easy') {
      // Attack the Leader blindly, ignoring good trades.
      const a = nextAttacker(s, me)
      if (!a) return { t: 'endTurn' }
      return { t: 'declareAttack', attacker: a, target: 'leader' }
    }
    if (difficulty === 'normal') {
      const a = nextAttacker(s, me)
      if (!a) return { t: 'endTurn' }
      return { t: 'declareAttack', attacker: a, target: chooseTarget(s, me, a) }
    }
    // hard | god
    const plan = planAttack(s, me, difficulty)
    if (!plan) return { t: 'endTurn' }
    return { t: 'declareAttack', attacker: plan.attacker, target: plan.target }
  }
  return null
}

/* ================================================================== *
 *  DEFENCE: the bot's response to a pending attack.
 * ================================================================== */
export function botDefend(s: GameState, difficulty: Difficulty = 'normal'): Action[] {
  const pd = s.pending
  if (!pd) return [{ t: 'resolveDefense' }]
  const me = opp(pd.attackerSide)

  if (difficulty === 'normal') return normalDefend(s, me)
  if (difficulty === 'easy') return easyDefend(s, me)
  return smartDefend(s, me, difficulty)
}

/** Original v1 defence: only ever stops a lethal Leader hit. */
function normalDefend(s: GameState, me: Side): Action[] {
  const pd = s.pending!
  const bp = s.players[me]
  const lethal = pd.target === 'leader' && bp.life === 0
  if (!lethal) return [{ t: 'resolveDefense' }]

  const blocker = bp.board.find((c) => !c.rested && def(s, c.cardId).isBlocker)
  if (blocker) return [{ t: 'block', blockerUid: blocker.uid }, { t: 'resolveDefense' }]

  const acts: Action[] = []
  let leaderPow = effPower(s, me, 'leader')
  for (const id of [...bp.hand]) {
    if (leaderPow > pd.baseAttackPower) break
    const d = def(s, id)
    if (d.counter > 0) {
      acts.push({ t: 'counter', cardId: id })
      leaderPow += d.counter
    }
  }
  acts.push({ t: 'resolveDefense' })
  return acts
}

/** Casual defence: basically takes every hit; MAY block an exactly-lethal one ~50%. */
function easyDefend(s: GameState, me: Side): Action[] {
  const pd = s.pending!
  const bp = s.players[me]
  const lethal = pd.target === 'leader' && bp.life === 0
  if (!lethal) return [{ t: 'resolveDefense' }]
  const blocker = bp.board.find((c) => !c.rested && def(s, c.cardId).isBlocker)
  if (blocker && jitter(s, 'edef') < 0.5) {
    return [{ t: 'block', blockerUid: blocker.uid }, { t: 'resolveDefense' }]
  }
  return [{ t: 'resolveDefense' }]
}

/**
 * Smart defence (hard/god): protect the Leader and save high-value characters,
 * spending the fewest counters and preferring a "free" surviving block.
 */
function smartDefend(s: GameState, me: Side, difficulty: Difficulty): Action[] {
  const pd = s.pending!
  const bp = s.players[me]
  const onLeader = pd.target === 'leader'
  const targetPow = onLeader ? effPower(s, me, 'leader') : effPower(s, me, pd.target)

  // If the attack already fails, never spend anything.
  if (pd.baseAttackPower < targetPow) return [{ t: 'resolveDefense' }]

  const lethal = onLeader && bp.life === 0

  // Decide whether this hit is worth defending.
  let worth = lethal
  if (!worth && onLeader) worth = difficulty === 'god' ? true : bp.life <= 2
  if (!worth && !onLeader) worth = targetPow >= (difficulty === 'god' ? 3000 : 5000)
  if (!worth) return [{ t: 'resolveDefense' }]

  // 1) A blocker that SURVIVES the hit redirects the attack for free (no card loss).
  const survivingBlocker = bp.board
    .filter((c) => !c.rested && def(s, c.cardId).isBlocker)
    .map((c) => ({ uid: c.uid, pow: def(s, c.cardId).power + c.attachedDon * 1000 }))
    .filter((b) => b.pow > pd.baseAttackPower)
    .sort((a, b) => a.pow - b.pow)[0]
  if (survivingBlocker) {
    return [{ t: 'block', blockerUid: survivingBlocker.uid }, { t: 'resolveDefense' }]
  }

  // 2) Counter just enough to survive — only if it actually prevents the hit.
  const need = pd.baseAttackPower - targetPow + 1 // power we must add to survive
  const counters = bp.hand
    .map((id) => ({ id, c: def(s, id).counter }))
    .filter((x) => x.c > 0)
  const total = counters.reduce((sum, x) => sum + x.c, 0)
  if (total >= need) {
    const chosen: string[] = []
    // Prefer a single card that alone suffices (fewest cards, least waste)…
    const asc = [...counters].sort((a, b) => a.c - b.c)
    const single = asc.find((x) => x.c >= need)
    if (single) {
      chosen.push(single.id)
    } else {
      // …otherwise stack largest-first to use the fewest cards.
      let sum = 0
      for (const x of [...counters].sort((a, b) => b.c - a.c)) {
        if (sum >= need) break
        chosen.push(x.id)
        sum += x.c
      }
    }
    return [...chosen.map((id) => ({ t: 'counter', cardId: id }) as Action), { t: 'resolveDefense' }]
  }

  // 3) Can't survive: trade a blocker only to stop outright lethal.
  if (lethal) {
    const anyBlocker = bp.board.find((c) => !c.rested && def(s, c.cardId).isBlocker)
    if (anyBlocker) return [{ t: 'block', blockerUid: anyBlocker.uid }, { t: 'resolveDefense' }]
  }
  return [{ t: 'resolveDefense' }]
}
