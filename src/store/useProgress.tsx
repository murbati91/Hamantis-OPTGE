import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DAILY_QUESTS,
  DEFAULT_TRAINING_STATE,
  type TrainingState,
} from '../types'

/** XP / gamification + training (streaks, daily quests) store. */

export interface ProgressState {
  xp: number
  /** Badge ids the user has earned. */
  badges: string[]
  training: TrainingState
  /** Practice-duel daily cap tracking. Count resets when the date changes. */
  play: { date: string; count: number }
  /** One-time welcome bonus granted (so a new player never starts at a dead 0). */
  onboarded?: boolean
}

const KEY = 'hamantis.progress.v1'

/** One-time XP granted on first launch so the level bar shows life immediately. */
export const WELCOME_XP = 40

/** Practice duels allowed per calendar day (local, MVP — bypassable, see SIMULATOR-SPEC v1.1). */
export const DAILY_PLAY_LIMIT = 5

const DEFAULT: ProgressState = {
  xp: 0,
  badges: [],
  training: DEFAULT_TRAINING_STATE,
  play: { date: '', count: 0 },
  onboarded: false,
}

/** Local date as YYYY-MM-DD. */
function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isYesterday(prev: string | null, today: string): boolean {
  if (!prev) return false
  const p = new Date(prev + 'T00:00:00')
  const t = new Date(today + 'T00:00:00')
  return (t.getTime() - p.getTime()) / 86400000 === 1
}

export interface BadgeDef {
  id: string
  name: string
  description: string
  icon: string
}

export const BADGES: BadgeDef[] = [
  { id: '2k-master', name: '2K Counter Master', description: 'Master the 2K counter math.', icon: '🛡️' },
  { id: 'sealed-specialist', name: 'Sealed Specialist', description: 'Build winning sealed pools.', icon: '📦' },
  { id: 'bomb-finder', name: 'Bomb Finder', description: 'Spot the 10/10 bombs.', icon: '💣' },
  { id: 'curve-builder', name: 'Curve Builder', description: 'Hit your composition targets.', icon: '📈' },
  { id: 'no-tilt', name: 'No Tilt Warrior', description: 'Stay calm through losses.', icon: '🧘' },
  { id: 'tournament-grinder', name: 'Tournament Grinder', description: 'Grind real-life events.', icon: '🏆' },
]

/** One Piece-themed rank ladder. Logical progression, not a flat label. */
export function titleForLevel(level: number): string {
  if (level >= 30) return 'Pirate King'
  if (level >= 25) return 'Yonko'
  if (level >= 20) return 'Yonko Commander'
  if (level >= 16) return 'Warlord'
  if (level >= 12) return 'Supernova'
  if (level >= 8) return 'Grand Line Pirate'
  if (level >= 5) return 'Paradise Rookie'
  if (level >= 3) return 'East Blue Pirate'
  return 'East Blue Rookie'
}

/**
 * Progressive level curve. Cumulative XP required to REACH a level follows
 * 30·(L−1)·L, so early levels come fast (L2 = 60, L3 = 180, L4 = 360) and each
 * tier costs progressively more — standard, satisfying RPG pacing rather than a
 * flat 100/level slog that leaves casual players stuck at Lv 1.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return 30 * (level - 1) * level
}

export function levelForXp(xp: number): number {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  return level
}

/** Level + progress within it, for the XP bar. */
export function levelProgress(xp: number): {
  level: number
  into: number
  span: number
  pct: number
} {
  const level = levelForXp(xp)
  const base = xpForLevel(level)
  const span = xpForLevel(level + 1) - base
  const into = xp - base
  return { level, into, span, pct: span > 0 ? Math.round((into / span) * 100) : 0 }
}

/** XP earned into the current level (legacy helper kept for callers). */
export function xpIntoLevel(xp: number): number {
  return levelProgress(xp).into
}

interface ProgressContextValue extends ProgressState {
  level: number
  title: string
  addXp: (amount: number) => void
  awardBadge: (id: string) => void
  /**
   * Record a training action: increments a lifetime metric, updates the daily
   * streak, awards XP, and auto-completes any daily quest whose goal is met.
   */
  recordTraining: (metric: keyof TrainingState['totals'], xp: number) => void
  /** Duels started today (0 if the stored date is not today). */
  playsToday: number
  /** Duels still allowed today (DAILY_PLAY_LIMIT − playsToday, floored at 0). */
  playsRemaining: number
  /** Increment today's duel count (call when a duel is STARTED). */
  recordPlay: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    const parsed = JSON.parse(raw) as Partial<ProgressState>
    return {
      ...DEFAULT,
      ...parsed,
      play: { ...DEFAULT.play, ...(parsed.play ?? {}) },
      training: {
        ...DEFAULT_TRAINING_STATE,
        ...(parsed.training ?? {}),
        totals: { ...DEFAULT_TRAINING_STATE.totals, ...(parsed.training?.totals ?? {}) },
        dailyCounts: { ...(parsed.training?.dailyCounts ?? {}) },
      },
    }
  } catch {
    return DEFAULT
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(load)

  const persist = useCallback((next: ProgressState) => {
    localStorage.setItem(KEY, JSON.stringify(next))
    return next
  }, [])

  // One-time welcome bonus: a fresh player lands as Lv 1 with a partially-filled
  // bar (40/60) instead of a dead 0/100 — so progression feels alive from login.
  useEffect(() => {
    setState((s) =>
      s.onboarded ? s : persist({ ...s, onboarded: true, xp: s.xp + WELCOME_XP }),
    )
  }, [persist])

  const addXp = useCallback(
    (amount: number) => setState((s) => persist({ ...s, xp: s.xp + amount })),
    [persist],
  )

  const awardBadge = useCallback(
    (id: string) =>
      setState((s) =>
        s.badges.includes(id) ? s : persist({ ...s, badges: [...s.badges, id] }),
      ),
    [persist],
  )

  const recordTraining = useCallback(
    (metric: keyof TrainingState['totals'], xp: number) =>
      setState((s) => {
        const today = todayStr()
        const t = s.training
        const rolled = t.questDate !== today

        // Roll the daily quest list + counts over if the date changed.
        const completed = rolled ? [] : [...t.questsCompletedToday]
        const daily = rolled ? {} : { ...t.dailyCounts }
        daily[metric] = (daily[metric] ?? 0) + 1

        // Streak: +1 if last trained yesterday, reset to 1 if a gap, keep if same day.
        let streak = t.streak
        if (t.lastTrainedDate !== today) {
          streak = isYesterday(t.lastTrainedDate, today) ? t.streak + 1 : 1
        }

        const totals = { ...t.totals, [metric]: (t.totals[metric] ?? 0) + 1 }

        // Auto-complete quests whose TODAY progress now meets the goal (award XP once).
        let bonusXp = 0
        for (const q of DAILY_QUESTS) {
          if (!completed.includes(q.id) && (daily[q.metric] ?? 0) >= q.goal) {
            completed.push(q.id)
            bonusXp += q.xp
          }
        }

        return persist({
          ...s,
          xp: s.xp + xp + bonusXp,
          training: {
            ...t,
            totals,
            streak,
            bestStreak: Math.max(t.bestStreak, streak),
            lastTrainedDate: today,
            questDate: today,
            dailyCounts: daily,
            questsCompletedToday: completed,
          },
        })
      }),
    [persist],
  )

  const recordPlay = useCallback(
    () =>
      setState((s) => {
        const today = todayStr()
        const cur = s.play.date === today ? s.play.count : 0
        return persist({ ...s, play: { date: today, count: cur + 1 } })
      }),
    [persist],
  )

  const value = useMemo<ProgressContextValue>(() => {
    const level = levelForXp(state.xp)
    const playsToday = state.play.date === todayStr() ? state.play.count : 0
    return {
      ...state,
      level,
      title: titleForLevel(level),
      addXp,
      awardBadge,
      recordTraining,
      playsToday,
      playsRemaining: Math.max(0, DAILY_PLAY_LIMIT - playsToday),
      recordPlay,
    }
  }, [state, addXp, awardBadge, recordTraining, recordPlay])

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
