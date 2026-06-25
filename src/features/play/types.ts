/** Practice-simulator game model (v1 — core combat loop, no card effects). */

export type Side = 0 | 1 // 0 = human, 1 = bot
export type Phase = 'main' | 'attack' | 'gameover'

/** Bot combat skill level. Purely tunes decision quality (no card effects). */
export type Difficulty = 'easy' | 'normal' | 'hard' | 'god'

/** Flattened card stats the engine needs (resolved once at init). */
export interface CardDef {
  id: string
  name: string
  type: string
  cost: number
  power: number
  counter: number
  isBlocker: boolean
}

export interface CharInstance {
  uid: string
  cardId: string
  rested: boolean
  attachedDon: number
  /** Played this turn — can't attack yet (no Rush in v1). */
  playedThisTurn: boolean
}

export interface PlayerState {
  leaderId: string
  leaderRested: boolean
  leaderAttachedDon: number
  leaderPlayedThisTurn: boolean // leaders never have sickness, kept for symmetry (always false)
  /** Life cards remaining. 0 + another hit = loss. */
  life: number
  hand: string[] // cardIds
  deck: string[] // cardIds, draw from index 0
  board: CharInstance[]
  trash: string[]
  donTotal: number // DON in play (max 10)
  donAvailable: number // un-rested DON spendable this turn
}

/** A declared-but-unresolved attack awaiting the defender's block/counter. */
export interface PendingDefense {
  attackerSide: Side
  attacker: 'leader' | string // uid
  target: 'leader' | string // uid (a rested enemy character) or enemy leader
  baseAttackPower: number
  blockerUid: string | null
  counterAdded: number
  counterCardsUsed: string[]
}

export interface GameState {
  defs: Record<string, CardDef>
  players: [PlayerState, PlayerState]
  active: Side
  turn: number
  firstPlayer: Side
  phase: Phase
  winner: Side | null
  pending: PendingDefense | null
  nextUid: number
  log: string[]
}

export type Action =
  | { t: 'play'; cardId: string }
  | { t: 'attachDon'; target: 'leader' | string }
  | { t: 'toAttack' }
  | { t: 'declareAttack'; attacker: 'leader' | string; target: 'leader' | string }
  | { t: 'endTurn' }
  | { t: 'block'; blockerUid: string }
  | { t: 'counter'; cardId: string }
  | { t: 'resolveDefense' }
