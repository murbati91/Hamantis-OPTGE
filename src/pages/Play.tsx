import { useCallback, useEffect, useRef, useState } from 'react'
import { useCollection } from '../store/useCollection'
import { useProgress } from '../store/useProgress'
import { CardFace } from '../components/ui/CardFace'
import { HeadToHead, type ClashView } from '../features/play/HeadToHead'
import { Tutorial } from '../features/play/Tutorial'
import { initGame, apply, def, effPower, opp } from '../features/play/engine'
import { nextBotAction, botDefend } from '../features/play/bot'
import type { Card } from '../types'
import type { Difficulty, GameState, Side } from '../features/play/types'

const DIFFS: { id: Difficulty; label: string; blurb: string }[] = [
  { id: 'easy', label: 'Easy', blurb: 'Casual — great for learning' },
  { id: 'normal', label: 'Normal', blurb: 'Solid fundamentals' },
  { id: 'hard', label: 'Hard', blurb: 'Smart trades & defence' },
  { id: 'god', label: 'God', blurb: 'Near-perfect combat math' },
]

const DIFF_KEY = 'hamantis.play.difficulty'
const TUT_KEY = 'hamantis.play.tutorialSeen'
/** Head-to-head clash animation length (ms). Must outlast the keyframes. */
const CLASH_MS = 1150

function loadDifficulty(): Difficulty {
  try {
    const v = localStorage.getItem(DIFF_KEY)
    if (v === 'easy' || v === 'normal' || v === 'hard' || v === 'god') return v
  } catch {
    /* ignore */
  }
  return 'normal'
}

function loadTutorialSeen(): boolean {
  try {
    return localStorage.getItem(TUT_KEY) === '1'
  } catch {
    return false
  }
}

/** Whether the user has asked the OS to minimise motion. */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** cardId of a board character by uid (or '' if it's gone). */
function charCardId(g: GameState, side: Side, uid: string): string {
  return g.players[side].board.find((c) => c.uid === uid)?.cardId ?? ''
}

/**
 * Build the cosmetic clash view for a pending attack — READ ONLY. The outcome is
 * derived by running the engine's resolveDefense on a throwaway copy (apply()
 * already clones and never mutates its input), so labels stay in lock-step with
 * the real resolution without duplicating any combat logic.
 */
function buildClashView(g: GameState, resolveCard: (id: string) => Card | undefined): ClashView | null {
  const pd = g.pending
  if (!pd) return null
  const atkSide = pd.attackerSide
  const defSide = opp(atkSide)

  const atkLeader = pd.attacker === 'leader'
  const attackerCard = atkLeader
    ? resolveCard(g.players[atkSide].leaderId)
    : resolveCard(charCardId(g, atkSide, pd.attacker))
  const attackerPow = pd.baseAttackPower

  const targetRef = pd.blockerUid ?? pd.target
  const defLeader = targetRef === 'leader'
  const defenderCard = defLeader
    ? resolveCard(g.players[defSide].leaderId)
    : resolveCard(charCardId(g, defSide, targetRef))
  const defenderPow = effPower(g, defSide, targetRef) + pd.counterAdded

  const after = apply(g, { t: 'resolveDefense' })

  let result: string
  let tone: ClashView['tone']
  if (after.winner !== null && g.winner === null) {
    result = after.winner === 0 ? 'You win! 🏴‍☠️' : 'Defeat…'
    tone = after.winner === 0 ? 'good' : 'bad'
  } else if (defLeader) {
    const lostLife = after.players[defSide].life < g.players[defSide].life
    if (lostLife) {
      result = '−1 Life'
      tone = defSide === 0 ? 'bad' : 'good'
    } else {
      result = 'Survived'
      tone = defSide === 0 ? 'good' : 'neutral'
    }
  } else {
    const stillThere = after.players[defSide].board.some((c) => c.uid === targetRef)
    if (!stillThere) {
      result = 'K.O.!'
      tone = defSide === 0 ? 'bad' : 'good'
    } else {
      result = pd.blockerUid ? 'Blocked!' : 'Survived'
      tone = defSide === 0 ? 'good' : 'neutral'
    }
  }

  return {
    attacker: { card: attackerCard, power: attackerPow, isLeader: atkLeader, label: atkSide === 0 ? 'You' : 'Bot' },
    defender: { card: defenderCard, power: defenderPow, isLeader: defLeader, label: defSide === 0 ? 'You' : 'Bot' },
    result,
    tone,
  }
}

export function Play() {
  const { resolveCard, decks } = useCollection()
  // Bot practice is UNLIMITED — recordPlay only tracks a games-played stat now.
  const { playsToday, recordPlay, addXp } = useProgress()
  const [deckId, setDeckId] = useState<string>('')
  const [difficulty, setDifficulty] = useState<Difficulty>(loadDifficulty)
  const [game, setGame] = useState<GameState | null>(null)
  const [attacker, setAttacker] = useState<'leader' | string | null>(null)
  const [revealing, setRevealing] = useState(false)
  // Cosmetic head-to-head overlay. While non-null the bot driver is gated so the
  // real resolveDefense happens only when the animation finishes.
  const [clash, setClash] = useState<ClashView | null>(null)
  const [showTutorial, setShowTutorial] = useState<boolean>(() => !loadTutorialSeen())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const awarded = useRef(false)

  const pickDifficulty = (d: Difficulty) => {
    setDifficulty(d)
    try {
      localStorage.setItem(DIFF_KEY, d)
    } catch {
      /* ignore */
    }
  }

  const closeTutorial = () => {
    setShowTutorial(false)
    try {
      localStorage.setItem(TUT_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  /** Cancel any in-flight clash and hide the overlay (used on reset / unmount). */
  const resetClash = useCallback(() => {
    if (clashTimer.current) {
      clearTimeout(clashTimer.current)
      clashTimer.current = null
    }
    setClash(null)
  }, [])

  /**
   * Show the head-to-head overlay for the current pending attack, then commit the
   * real resolveDefense once it finishes. Functional setGame guards against the
   * game being reset mid-animation. Never blocks input permanently: the timer is
   * always cleaned up and the resolve is a no-op if the pending is gone.
   */
  const beginClash = useCallback(
    (g: GameState) => {
      const view = buildClashView(g, resolveCard)
      if (!view) {
        setGame((s) => (s && s.winner === null && s.pending ? apply(s, { t: 'resolveDefense' }) : s))
        return
      }
      setClash(view)
      if (clashTimer.current) clearTimeout(clashTimer.current)
      clashTimer.current = setTimeout(() => {
        clashTimer.current = null
        setClash(null)
        setGame((s) => (s && s.winner === null && s.pending ? apply(s, { t: 'resolveDefense' }) : s))
      }, CLASH_MS)
    },
    [resolveCard],
  )

  const newGame = () => {
    const youDeck = decks.find((d) => d.id === deckId) ?? null
    recordPlay() // tracks games-played-today (no cap — unlimited bot practice)
    awarded.current = false
    setAttacker(null)
    resetClash()
    setGame(initGame({ youDeck }, resolveCard))
    // Sealed-box flip intro (skipped when the user prefers reduced motion).
    if (revealTimer.current) clearTimeout(revealTimer.current)
    if (prefersReducedMotion()) {
      setRevealing(false)
    } else {
      setRevealing(true)
      revealTimer.current = setTimeout(() => setRevealing(false), 1100)
    }
  }

  const backToStart = () => {
    resetClash()
    setAttacker(null)
    setGame(null)
  }

  // Clean up all timers on unmount.
  useEffect(
    () => () => {
      if (revealTimer.current) clearTimeout(revealTimer.current)
      if (clashTimer.current) clearTimeout(clashTimer.current)
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  // ---- driver: advance the bot's turn / its defense automatically ----
  useEffect(() => {
    // Always clear any in-flight timer FIRST, before any early return, so a reset /
    // win / unmount can never leave an orphaned setTimeout to clobber fresh state.
    if (timer.current) clearTimeout(timer.current)
    if (!game || game.winner !== null) return
    // A head-to-head clash is animating — pause the driver; it resumes when the
    // clash clears (resolveDefense fires, game changes, this effect re-runs).
    if (clash) return

    if (game.pending) {
      const defender = opp(game.pending.attackerSide)
      if (defender === 1) {
        // bot is defending an attack you declared.
        timer.current = setTimeout(() => {
          const g0 = game
          if (!g0 || g0.winner !== null || !g0.pending) return
          const acts = botDefend(g0, difficulty)
          if (prefersReducedMotion()) {
            // No animation — resolve in one shot (original behavior).
            let g = g0
            for (const a of acts) g = apply(g, a)
            setGame(g)
            return
          }
          // Apply the bot's block/counter choices first so the board reflects
          // them, then visualize the clash and resolve when it ends.
          let staged = g0
          for (const a of acts) {
            if (a.t === 'resolveDefense') break
            staged = apply(staged, a)
          }
          setGame(staged)
          beginClash(staged)
        }, 500)
      }
      // else: human defends via the modal — no timer, but cleanup below still runs.
    } else if (game.active === 1) {
      const a = nextBotAction(game, difficulty)
      if (a) timer.current = setTimeout(() => setGame((s) => (s ? apply(s, a) : s)), 650)
    }
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [game, difficulty, clash, beginClash])

  // Award XP once when a duel finishes (counts toward Training progress).
  useEffect(() => {
    if (game && game.winner !== null && !awarded.current) {
      awarded.current = true
      addXp(game.winner === 0 ? 25 : 10)
    }
  }, [game, addXp])

  if (!game) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-xl font-bold text-mantis-100">Practice Duel vs Bot</h1>
          <HelpButton onClick={() => setShowTutorial(true)} />
        </div>
        <p className="text-sm text-slate-400">
          Play a simplified One Piece TCG game against the AI — DON ramp, characters, attacks,
          blocks &amp; counters. Card-specific effects come later.
        </p>
        {decks.length > 0 && (
          <select
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
            aria-label="Choose your deck"
            className="w-full rounded-lg border border-slate-700 bg-ink-850 px-3 py-2 text-sm text-slate-100"
          >
            <option value="" className="bg-ink-900">Random sealed deck</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id} className="bg-ink-900">
                {d.name || 'Untitled deck'}
              </option>
            ))}
          </select>
        )}

        {/* Difficulty selector */}
        <div className="space-y-1.5 text-left">
          <div className="text-xs font-medium text-slate-400">Bot difficulty</div>
          <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Bot difficulty">
            {DIFFS.map((d) => {
              const active = difficulty === d.id
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => pickDifficulty(d.id)}
                  aria-pressed={active}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                    active
                      ? 'border-straw-400 bg-mantis-600 text-white shadow-sm shadow-mantis-900/40'
                      : 'border-slate-700 bg-ink-850 text-slate-300 hover:border-mantis-700 hover:text-mantis-100'
                  }`}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
          <p className="text-[0.7rem] text-slate-500">
            {DIFFS.find((d) => d.id === difficulty)?.blurb}
          </p>
        </div>

        {playsToday > 0 && (
          <div className="text-xs font-medium text-slate-400">
            Games today: <span className="text-mantis-200">{playsToday}</span> · unlimited
          </div>
        )}

        <button
          onClick={newGame}
          className="w-full rounded-lg bg-mantis-600 px-5 py-3 text-base font-semibold text-white hover:bg-mantis-500"
        >
          Start duel
        </button>

        {showTutorial && <Tutorial onClose={closeTutorial} />}
      </div>
    )
  }

  const you = game.players[0]
  const yourTurn = game.active === 0 && game.winner === null && !game.pending && !clash
  const defending = game.pending && opp(game.pending.attackerSide) === 0

  // ---- human actions ----
  const act = (a: Parameters<typeof apply>[1]) => setGame((s) => (s ? apply(s, a) : s))

  const onYourCardClick = (ref: 'leader' | string, rested: boolean, sick: boolean) => {
    if (clash || game.active !== 0 || game.pending) return
    if (game.phase === 'main') {
      if (you.donAvailable > 0) act({ t: 'attachDon', target: ref })
    } else if (game.phase === 'attack') {
      if (!rested && !sick) setAttacker(ref)
    }
  }
  const onEnemyTargetClick = (ref: 'leader' | string) => {
    if (clash || !yourTurn || game.phase !== 'attack' || !attacker) return
    act({ t: 'declareAttack', attacker, target: ref })
    setAttacker(null)
  }

  // Human commits a defense — visualize the clash, then resolve (instant under
  // reduced motion).
  const onResolveDefense = () => {
    if (prefersReducedMotion()) {
      act({ t: 'resolveDefense' })
      return
    }
    if (game.pending) beginClash(game)
  }

  const activeDiff = DIFFS.find((d) => d.id === difficulty)

  return (
    <div className="relative space-y-3">
      {revealing && <SealedReveal />}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-mantis-100">Practice Duel</h1>
          <span className="rounded-full border border-straw-400/50 bg-straw-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-straw-300">
            {activeDiff?.label}
          </span>
          <HelpButton onClick={() => setShowTutorial(true)} />
        </div>
        <button onClick={backToStart} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
          New game
        </button>
      </div>

      {/* Bot side */}
      <PlayerStrip g={game} side={1} label="Bot" resolve={resolveCard} onTarget={onEnemyTargetClick} targetable={yourTurn && game.phase === 'attack' && !!attacker} />

      {/* status bar */}
      <div
        className={`rounded-xl border px-3 py-2.5 text-center text-sm font-medium ${
          game.winner !== null
            ? 'border-straw-500/50 bg-straw-500/10 text-straw-200'
            : game.active === 0
              ? 'border-mantis-700/60 bg-mantis-900/30 text-mantis-100'
              : 'border-slate-800 bg-ink-900/60 text-slate-400'
        }`}
        aria-live="polite"
      >
        {game.winner !== null
          ? game.winner === 0 ? '🏴‍☠️ You win!' : 'Bot wins — try again.'
          : game.active === 0
            ? game.phase === 'main'
              ? `Your main phase · DON ${you.donAvailable}/${you.donTotal} · tap cards to attach DON or play from hand`
              : attacker
                ? '🎯 Pick a target: the bot Leader or a rested bot character'
                : 'Your attack phase · tap an un-rested character or your Leader'
            : '🤖 Bot is thinking…'}
      </div>

      {/* Your side */}
      <PlayerStrip g={game} side={0} label="You" resolve={resolveCard} onCard={onYourCardClick} selected={attacker} />

      {/* Your hand */}
      <div>
        <div className="mb-1 text-xs text-slate-400">Your hand ({you.hand.length})</div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {you.hand.map((id, i) => {
            const d = def(game, id)
            const playable = yourTurn && game.phase === 'main' && d.type === 'Character' && d.cost <= you.donAvailable
            return (
              <button
                key={id + i}
                onClick={() => playable && act({ t: 'play', cardId: id })}
                disabled={!playable}
                className={`w-16 shrink-0 rounded-lg ring-1 transition ${playable ? 'ring-mantis-500 hover:-translate-y-1' : 'opacity-70 ring-slate-800'}`}
                title={d.name}
              >
                <CardFace card={resolveCard(id)} size="sm" />
              </button>
            )
          })}
        </div>
      </div>

      {/* controls */}
      {yourTurn && (
        <div className="flex gap-2">
          {game.phase === 'main' && (
            <button onClick={() => act({ t: 'toAttack' })} className="flex-1 rounded-lg bg-mantis-600 px-4 py-3 text-sm font-semibold text-white hover:bg-mantis-500">
              Go to attacks →
            </button>
          )}
          <button onClick={() => { setAttacker(null); act({ t: 'endTurn' }) }} className="flex-1 rounded-lg border border-slate-600 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800">
            End turn
          </button>
        </div>
      )}

      {/* Defense modal — hidden while the clash animation is on screen */}
      {defending && game.pending && !clash && (
        <DefenseModal g={game} resolve={resolveCard} onAct={act} onResolve={onResolveDefense} />
      )}

      {/* Head-to-head clash overlay (cosmetic; caller skips it under reduced motion) */}
      {clash && <HeadToHead view={clash} />}

      {/* Result screen */}
      {game.winner !== null && !clash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xs rounded-2xl border border-slate-700 bg-ink-900 p-6 text-center">
            <div className="text-4xl">{game.winner === 0 ? '🏴‍☠️' : '💀'}</div>
            <h3 className={`mt-2 text-xl font-bold ${game.winner === 0 ? 'text-straw-300' : 'text-rose-300'}`}>
              {game.winner === 0 ? 'You win!' : 'You lose'}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {game.winner === 0 ? '+25 XP earned' : '+10 XP for the attempt'}
            </p>
            <button
              onClick={newGame}
              className="mt-5 w-full rounded-lg bg-mantis-600 px-4 py-3 text-sm font-semibold text-white hover:bg-mantis-500"
            >
              Play again
            </button>
            <button
              onClick={backToStart}
              className="mt-2 w-full rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Back to start
            </button>
          </div>
        </div>
      )}

      {/* log */}
      <details className="rounded-xl border border-slate-800 bg-ink-900/40 px-3 py-2 text-xs text-slate-400">
        <summary className="cursor-pointer">Game log</summary>
        <div className="mt-2 space-y-0.5">
          {[...game.log].reverse().slice(0, 12).map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </details>

      {showTutorial && <Tutorial onClose={closeTutorial} />}
    </div>
  )
}

/** Small persistent "?" help button that (re)opens the first-time guide. */
function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="How to play"
      title="How to play"
      className="grid h-6 w-6 place-items-center rounded-full border border-straw-400/60 bg-straw-500/10 text-xs font-bold text-straw-300 hover:bg-straw-500/20"
    >
      ?
    </button>
  )
}

/**
 * Sealed-box flip intro shown for ~1.1s when a duel starts. A red/gold "Sealed"
 * card-back does a 3D rotateY flip and fades out to reveal the live board.
 * Purely decorative: pointer-events are disabled so it never blocks input, and
 * the caller skips rendering it entirely when prefers-reduced-motion is set.
 */
function SealedReveal() {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-hidden rounded-2xl">
      <style>{`
        @keyframes hamantis-seal-flip {
          0%   { transform: perspective(1200px) rotateY(0deg) scale(1);     opacity: 1; }
          12%  { transform: perspective(1200px) rotateY(0deg) scale(1.03);  opacity: 1; }
          55%  { transform: perspective(1200px) rotateY(-88deg) scale(1.06);opacity: 1; }
          70%  { transform: perspective(1200px) rotateY(-118deg) scale(1.05);opacity: .92; }
          100% { transform: perspective(1200px) rotateY(-180deg) scale(1.12);opacity: 0; }
        }
        @keyframes hamantis-seal-fade {
          0%, 60% { opacity: 1; }
          100%    { opacity: 0; }
        }
        @keyframes hamantis-seal-sheen {
          0%   { transform: translateX(-120%) skewX(-18deg); }
          60%  { transform: translateX(160%)  skewX(-18deg); }
          100% { transform: translateX(160%)  skewX(-18deg); }
        }
      `}</style>
      <div
        className="absolute inset-0 bg-ink-900/85 backdrop-blur-sm"
        style={{ animation: 'hamantis-seal-fade 1.1s ease-in forwards' }}
      />
      <div
        className="relative flex h-44 w-32 flex-col items-center justify-between overflow-hidden rounded-2xl border-2 border-straw-400/70 bg-gradient-to-br from-mantis-600 via-mantis-700 to-ink-900 p-3 shadow-2xl shadow-black/60"
        style={{ animation: 'hamantis-seal-flip 1.1s cubic-bezier(.5,.05,.3,1) forwards', transformStyle: 'preserve-3d' }}
      >
        {/* sheen sweep */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/25 blur-md"
          style={{ animation: 'hamantis-seal-sheen 1.1s ease-out forwards' }}
        />
        <div className="self-stretch text-center text-[0.6rem] font-bold uppercase tracking-[0.25em] text-straw-300/90">
          Sealed
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-straw-300/80 bg-ink-900/40 text-xl font-black tracking-tight text-straw-200 shadow-inner">
          OP
        </div>
        <div className="self-stretch text-center text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-mantis-100/80">
          Practice Pack
        </div>
      </div>
    </div>
  )
}

function PlayerStrip({
  g, side, label, resolve, onCard, onTarget, selected, targetable,
}: {
  g: GameState
  side: Side
  label: string
  resolve: ReturnType<typeof useCollection>['resolveCard']
  onCard?: (ref: 'leader' | string, rested: boolean, sick: boolean) => void
  onTarget?: (ref: 'leader' | string) => void
  selected?: 'leader' | string | null
  targetable?: boolean
}) {
  const p = g.players[side]
  const leaderCard = resolve(p.leaderId)
  const enemy = side === 1
  // Dim your own cards that can't be acted on RIGHT NOW (out of DON in main, or
  // rested / summoning-sick in attack) so a tap that would no-op reads as inert.
  const yourTurnHere = !enemy && g.active === side && g.winner === null && !g.pending
  const ownInactive = (rested: boolean, sick: boolean) => {
    if (!yourTurnHere) return false
    if (g.phase === 'main') return p.donAvailable <= 0
    if (g.phase === 'attack') return rested || sick
    return false
  }
  return (
    <div className="rounded-2xl border border-slate-800 bg-ink-850/40 p-2">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-mantis-200">{label}</span>
        <span className="text-slate-400">
          ❤️ {p.life} · DON {p.donAvailable}/{p.donTotal} · hand {p.hand.length}
        </span>
      </div>
      <div className="flex items-end gap-2 overflow-x-auto pb-1">
        {/* leader */}
        <button
          onClick={() => (enemy ? onTarget?.('leader') : onCard?.('leader', p.leaderRested, false))}
          className={`w-16 shrink-0 rounded-lg ring-2 ${selected === 'leader' ? 'ring-straw-400' : enemy && targetable ? 'ring-rose-500 animate-pulse' : 'ring-mantis-700/60'} ${p.leaderRested || ownInactive(p.leaderRested, false) ? 'opacity-50' : ''}`}
          title="Leader"
        >
          <CardFace card={leaderCard} power={effPower(g, side, 'leader')} size="sm" />
        </button>
        {/* characters */}
        {p.board.map((c) => {
          const targetableChar = enemy && targetable && c.rested
          return (
            <button
              key={c.uid}
              onClick={() => (enemy ? c.rested && onTarget?.(c.uid) : onCard?.(c.uid, c.rested, c.playedThisTurn))}
              className={`w-14 shrink-0 rounded-lg ring-1 ${selected === c.uid ? 'ring-2 ring-straw-400' : targetableChar ? 'ring-2 ring-rose-500 animate-pulse' : 'ring-slate-700'} ${c.rested || ownInactive(c.rested, c.playedThisTurn) ? 'opacity-50' : ''}`}
              title={def(g, c.cardId).name}
            >
              <CardFace card={resolve(c.cardId)} power={def(g, c.cardId).power + c.attachedDon * 1000} size="xs" />
            </button>
          )
        })}
        {p.board.length === 0 && <span className="py-6 text-[0.65rem] text-slate-600">no characters</span>}
      </div>
    </div>
  )
}

function DefenseModal({
  g,
  resolve,
  onAct,
  onResolve,
}: {
  g: GameState
  resolve: ReturnType<typeof useCollection>['resolveCard']
  onAct: (a: Parameters<typeof apply>[1]) => void
  onResolve: () => void
}) {
  const pd = g.pending!
  const me: Side = 0
  const p = g.players[me]
  const onLeader = pd.target === 'leader'
  // Resolution runs against the blocker once one is chosen, so the power readout must too.
  const tgt = pd.blockerUid ?? pd.target
  const targetPow = effPower(g, me, tgt) + pd.counterAdded
  const blockers = p.board.filter((c) => !c.rested && def(g, c.cardId).isBlocker)
  const counters = p.hand.filter((id) => def(g, id).counter > 0)

  // Card-face previews of the incoming attacker vs your defending card.
  const atkSide = pd.attackerSide
  const attackerCard =
    pd.attacker === 'leader' ? resolve(g.players[atkSide].leaderId) : resolve(charCardId(g, atkSide, pd.attacker))
  const targetCard = tgt === 'leader' ? resolve(g.players[me].leaderId) : resolve(charCardId(g, me, tgt))

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-rose-700/60 bg-ink-900 p-4">
        <h3 className="text-sm font-bold text-rose-200">Bot attacks {onLeader ? 'your Leader' : 'your character'}!</h3>

        {/* attacker vs defender preview */}
        <div className="mt-3 flex items-center justify-center gap-3">
          <div className="w-16">
            <CardFace card={attackerCard} power={pd.baseAttackPower} size="sm" />
          </div>
          <span className="text-lg" aria-hidden="true">⚔️</span>
          <div className="w-16">
            <CardFace card={targetCard} power={targetPow} size="sm" />
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-slate-300">
          Attack power <b className="text-rose-300">{pd.baseAttackPower}</b> vs your{' '}
          <b className="text-mantis-200">{targetPow}</b>. {pd.baseAttackPower >= targetPow ? 'It would hit.' : 'You survive.'}
        </p>
        {blockers.length > 0 && pd.blockerUid === null && (
          <div className="mt-3">
            <div className="text-xs text-slate-400">Block (redirect to a Blocker):</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {blockers.map((c) => (
                <button
                  key={c.uid}
                  onClick={() => onAct({ t: 'block', blockerUid: c.uid })}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                >
                  <span className="w-7 shrink-0">
                    <CardFace card={resolve(c.cardId)} size="xs" />
                  </span>
                  🛡 {def(g, c.cardId).name}
                </button>
              ))}
            </div>
          </div>
        )}
        {counters.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-slate-400">Counter from hand (+power):</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {counters.map((id, i) => (
                <button
                  key={id + i}
                  onClick={() => onAct({ t: 'counter', cardId: id })}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                >
                  <span className="w-7 shrink-0">
                    <CardFace card={resolve(id)} size="xs" />
                  </span>
                  +{def(g, id).counter} {def(g, id).name}
                </button>
              ))}
            </div>
          </div>
        )}
        <button onClick={onResolve} className="mt-4 w-full rounded-lg bg-mantis-600 px-4 py-2 text-sm font-semibold text-white hover:bg-mantis-500">
          Resolve
        </button>
      </div>
    </div>
  )
}
