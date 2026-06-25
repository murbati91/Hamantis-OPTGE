/** Solo-training + gamification models (daily quests, streaks). */

export interface TrainingState {
  /** ISO date (YYYY-MM-DD) of the last training activity. */
  lastTrainedDate: string | null
  /** Current consecutive-day streak. */
  streak: number
  bestStreak: number
  /** Quest ids completed today (reset when the date rolls over). */
  questsCompletedToday: string[]
  questDate: string | null
  /** Per-metric counts accumulated TODAY (reset when the date rolls over). */
  dailyCounts: Partial<Record<keyof TrainingState['totals'], number>>
  /** Lifetime counters used for badge unlocks. */
  totals: {
    quizzesAnswered: number
    attackMathSolved: number
    mulligansDecided: number
    sealedPlansLocked: number
  }
}

export interface DailyQuest {
  id: string
  label: string
  xp: number
  /** Which total counter this quest watches, and how many to complete. */
  metric: keyof TrainingState['totals']
  goal: number
}

export const DEFAULT_TRAINING_STATE: TrainingState = {
  lastTrainedDate: null,
  streak: 0,
  bestStreak: 0,
  questsCompletedToday: [],
  questDate: null,
  dailyCounts: {},
  totals: {
    quizzesAnswered: 0,
    attackMathSolved: 0,
    mulligansDecided: 0,
    sealedPlansLocked: 0,
  },
}

export const DAILY_QUESTS: DailyQuest[] = [
  { id: 'daily-quiz', label: 'Answer 3 quiz drills', xp: 20, metric: 'quizzesAnswered', goal: 3 },
  { id: 'daily-attack', label: 'Solve 3 attack-math problems', xp: 20, metric: 'attackMathSolved', goal: 3 },
  { id: 'daily-mulligan', label: 'Decide 3 mulligans', xp: 15, metric: 'mulligansDecided', goal: 3 },
  { id: 'daily-sealed', label: 'Lock in 1 sealed plan', xp: 15, metric: 'sealedPlansLocked', goal: 1 },
]
