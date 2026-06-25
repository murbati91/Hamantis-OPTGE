/** Real-life match + tournament tracking models. */

export type MatchResult = 'win' | 'loss' | 'draw'
export type DeckArchetype = 'aggro' | 'midrange' | 'control' | 'combo' | 'other'

export interface Match {
  id: string
  date: number
  opponentName: string
  /** Opponent leader (free text or card id). */
  opponentLeader: string
  opponentArchetype: DeckArchetype
  /** Your leader used. */
  myLeader: string
  result: MatchResult
  /** Who went first. */
  onThePlay?: boolean
  notes?: string
  mistakes?: string
  keyCards?: string
  sideboardChanges?: string
  /** Optional link to a tournament + round. */
  tournamentId?: string
  round?: number
}

export interface TournamentRound {
  round: number
  opponentName: string
  result: MatchResult | null
  notes?: string
}

export interface Tournament {
  id: string
  name: string
  date: number
  myLeader: string
  format: string // "Sealed" | "Constructed" | etc.
  rounds: TournamentRound[]
  createdAt: number
  /** Set true once the completion XP bonus has been granted (so it's awarded exactly once). */
  completionAwarded?: boolean
}

export interface MatchupStat {
  key: string // archetype or leader
  wins: number
  losses: number
  draws: number
}
