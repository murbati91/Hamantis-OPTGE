import type { Card, Deck } from '../../types'
import { isBlocker as deriveBlocker } from '../../lib/cards'
import { TRAINING_LEADERS, TRAINING_NONLEADERS } from '../../data/trainingSet'
import type { Action, CardDef, GameState, PlayerState, Side } from './types'

const DON_CAP = 10
const HAND_START = 5
const DECK_SIZE = 40

export const opp = (s: Side): Side => (s === 0 ? 1 : 0)
const clone = (s: GameState): GameState => JSON.parse(JSON.stringify(s))

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function toDef(c: Card): CardDef {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    cost: c.cost ?? 0,
    power: c.power ?? 0,
    counter: c.counter ?? 0,
    isBlocker: deriveBlocker(c),
  }
}

/** A leader id + 40 character ids, drawn from the real training universe. */
function sealedDeck(rng: () => number): { leaderId: string; cards: string[] } {
  const leaders = TRAINING_LEADERS
  const leader = leaders[Math.floor(rng() * leaders.length)]
  const chars = TRAINING_NONLEADERS.filter((c) => c.type === 'Character' && (c.power ?? 0) > 0)
  const cards: string[] = []
  for (let i = 0; i < DECK_SIZE; i++) cards.push(chars[Math.floor(rng() * chars.length)].id)
  return { leaderId: leader.id, cards }
}

/** Build a playable list from a saved Deck (Characters only), padded if thin. */
function deckFromSaved(deck: Deck, lookup: (id: string) => Card | undefined, rng: () => number) {
  const cards: string[] = []
  for (const [cardId, qty] of Object.entries(deck.cards)) {
    const c = lookup(cardId)
    if (c && c.type === 'Character' && (c.power ?? 0) > 0) {
      for (let n = 0; n < qty; n++) cards.push(cardId)
    }
  }
  const filler = sealedDeck(rng)
  while (cards.length < DECK_SIZE) cards.push(filler.cards[cards.length % filler.cards.length])
  const leaderId = deck.leaderId ?? filler.leaderId
  return { leaderId, cards: cards.slice(0, DECK_SIZE) }
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function makePlayer(
  built: { leaderId: string; cards: string[] },
  lookup: (id: string) => Card | undefined,
  rng: () => number,
): PlayerState {
  const shuffled = shuffle(built.cards, rng)
  const leader = lookup(built.leaderId)
  return {
    leaderId: built.leaderId,
    leaderRested: false,
    leaderAttachedDon: 0,
    leaderPlayedThisTurn: false,
    life: leader?.life ?? 5,
    hand: shuffled.slice(0, HAND_START),
    deck: shuffled.slice(HAND_START),
    board: [],
    trash: [],
    donTotal: 0,
    donAvailable: 0,
  }
}

export interface InitOpts {
  /** Saved deck for the human; falls back to a generated sealed deck. */
  youDeck?: Deck | null
  seed?: number
}

/** Resolve every card id used so the engine can read stats without a lookup later. */
function buildDefs(ids: string[], lookup: (id: string) => Card | undefined): Record<string, CardDef> {
  const defs: Record<string, CardDef> = {}
  for (const id of ids) {
    const c = lookup(id)
    if (c) defs[id] = toDef(c)
  }
  return defs
}

export function initGame(opts: InitOpts, lookup: (id: string) => Card | undefined): GameState {
  const seed = opts.seed ?? Math.floor(Math.random() * 0xffffffff)
  const rng = mulberry32(seed)
  const you = opts.youDeck ? deckFromSaved(opts.youDeck, lookup, rng) : sealedDeck(rng)
  const bot = sealedDeck(rng)

  const allIds = [you.leaderId, bot.leaderId, ...you.cards, ...bot.cards]
  const defs = buildDefs(allIds, lookup)

  const state: GameState = {
    defs,
    players: [makePlayer(you, lookup, rng), makePlayer(bot, lookup, rng)],
    active: 0,
    turn: 1,
    firstPlayer: 0, // you go first (friendlier for practice)
    phase: 'main',
    winner: null,
    pending: null,
    nextUid: 1,
    log: ['Game start — you go first.'],
  }
  startTurn(state, 0)
  return state
}

// ---- helpers (read-only) ----

export function def(s: GameState, id: string): CardDef {
  return s.defs[id] ?? { id, name: id, type: 'Character', cost: 0, power: 0, counter: 0, isBlocker: false }
}

/** Effective power of an attacker/defender reference (leader or a board uid). */
export function effPower(s: GameState, side: Side, ref: 'leader' | string): number {
  const p = s.players[side]
  if (ref === 'leader') return def(s, p.leaderId).power + p.leaderAttachedDon * 1000
  const ch = p.board.find((c) => c.uid === ref)
  if (!ch) return 0
  return def(s, ch.cardId).power + ch.attachedDon * 1000
}

export function isOver(s: GameState): boolean {
  return s.winner !== null
}

// ---- turn flow (mutates draft) ----

function startTurn(s: GameState, side: Side) {
  const p = s.players[side]
  p.leaderRested = false
  p.leaderAttachedDon = 0
  for (const c of p.board) {
    c.rested = false
    c.attachedDon = 0
    c.playedThisTurn = false
  }
  const veryFirst = s.turn === 1 && side === s.firstPlayer
  if (!veryFirst) {
    if (p.deck.length === 0) {
      s.winner = opp(side) // deck-out
      s.phase = 'gameover'
      s.log.push('Deck-out — ' + (side === 0 ? 'you lose' : 'you win') + '.')
      return
    }
    p.hand.push(p.deck.shift() as string)
  }
  const gain = veryFirst ? 1 : 2
  p.donTotal = Math.min(DON_CAP, p.donTotal + gain)
  p.donAvailable = p.donTotal
  s.phase = 'main'
}

function log(s: GameState, side: Side, msg: string) {
  s.log.push((side === 0 ? 'You' : 'Bot') + ' ' + msg)
  if (s.log.length > 40) s.log.shift()
}

// ---- the reducer ----

export function apply(state: GameState, action: Action): GameState {
  if (state.winner !== null) return state
  const s = clone(state)

  // Defense resolution takes priority when an attack is pending.
  if (s.pending) {
    const def_side = opp(s.pending.attackerSide)
    const dp = s.players[def_side]
    if (action.t === 'block') {
      const ch = dp.board.find((c) => c.uid === action.blockerUid)
      if (ch && !ch.rested && def(s, ch.cardId).isBlocker && s.pending.blockerUid === null) {
        ch.rested = true
        s.pending.blockerUid = ch.uid
        log(s, def_side, 'blocks with ' + def(s, ch.cardId).name + '.')
      }
      return s
    }
    if (action.t === 'counter') {
      const idx = dp.hand.indexOf(action.cardId)
      const cdef = def(s, action.cardId)
      if (idx >= 0 && cdef.counter > 0) {
        dp.hand.splice(idx, 1)
        dp.trash.push(action.cardId)
        s.pending.counterAdded += cdef.counter
        s.pending.counterCardsUsed.push(action.cardId)
      }
      return s
    }
    if (action.t === 'resolveDefense') {
      resolveDefense(s)
      return s
    }
    return s // ignore other actions mid-defense
  }

  const me = s.active
  const p = s.players[me]

  switch (action.t) {
    case 'play': {
      if (s.phase !== 'main') return s
      const d = def(s, action.cardId)
      const idx = p.hand.indexOf(action.cardId)
      if (idx < 0 || d.type !== 'Character' || p.donAvailable < d.cost) return s
      p.hand.splice(idx, 1)
      p.donAvailable -= d.cost
      p.board.push({ uid: `u${s.nextUid++}`, cardId: action.cardId, rested: false, attachedDon: 0, playedThisTurn: true })
      log(s, me, 'plays ' + d.name + '.')
      return s
    }
    case 'attachDon': {
      if (s.phase !== 'main' || p.donAvailable < 1) return s
      if (action.target === 'leader') p.leaderAttachedDon++
      else {
        const ch = p.board.find((c) => c.uid === action.target)
        if (!ch) return s
        ch.attachedDon++
      }
      p.donAvailable--
      return s
    }
    case 'toAttack': {
      if (s.phase === 'main') s.phase = 'attack'
      return s
    }
    case 'declareAttack': {
      if (s.phase === 'main') s.phase = 'attack'
      if (s.phase !== 'attack') return s
      // validate attacker
      if (action.attacker === 'leader') {
        if (p.leaderRested) return s
        p.leaderRested = true
      } else {
        const ch = p.board.find((c) => c.uid === action.attacker)
        if (!ch || ch.rested || ch.playedThisTurn) return s
        ch.rested = true
      }
      // validate target
      const od = s.players[opp(me)]
      if (action.target !== 'leader') {
        const tch = od.board.find((c) => c.uid === action.target)
        if (!tch || !tch.rested) return s // only rested characters are attackable
      }
      s.pending = {
        attackerSide: me,
        attacker: action.attacker,
        target: action.target,
        baseAttackPower: effPower(s, me, action.attacker),
        blockerUid: null,
        counterAdded: 0,
        counterCardsUsed: [],
      }
      log(s, me, 'attacks ' + (action.target === 'leader' ? 'the Leader' : 'a character') + '.')
      return s
    }
    case 'endTurn': {
      s.active = opp(me)
      s.turn++
      startTurn(s, s.active)
      return s
    }
    default:
      return s
  }
}

function resolveDefense(s: GameState) {
  const pd = s.pending
  if (!pd) return
  const atkSide = pd.attackerSide
  const defSide = opp(atkSide)
  const dp = s.players[defSide]
  const target = pd.blockerUid ?? pd.target
  let targetPower: number
  if (target === 'leader') targetPower = effPower(s, defSide, 'leader') + pd.counterAdded
  else targetPower = effPower(s, defSide, target) + pd.counterAdded

  const hit = pd.baseAttackPower >= targetPower
  if (hit) {
    if (target === 'leader') {
      if (dp.life > 0) {
        dp.life--
        if (dp.deck.length) dp.hand.push(dp.deck.shift() as string) // life-card-to-hand (trigger-lite)
        log(s, atkSide, 'deals 1 damage. ' + (defSide === 0 ? 'You have' : 'Bot has') + ' ' + dp.life + ' life left.')
      } else {
        s.winner = atkSide
        s.phase = 'gameover'
        s.log.push(atkSide === 0 ? 'You win! 🏴‍☠️' : 'Bot wins.')
      }
    } else {
      const i = dp.board.findIndex((c) => c.uid === target)
      if (i >= 0) {
        const ko = dp.board.splice(i, 1)[0]
        dp.trash.push(ko.cardId)
        log(s, atkSide, 'K.O.s ' + def(s, ko.cardId).name + '.')
      }
    }
  } else {
    log(s, defSide, 'survives the attack.')
  }
  s.pending = null
}
