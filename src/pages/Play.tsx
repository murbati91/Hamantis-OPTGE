import { useEffect, useRef, useState } from 'react'
import { useCollection } from '../store/useCollection'
import { useProgress } from '../store/useProgress'
import { CardImage } from '../components/ui/CardImage'
import { initGame, apply, def, effPower, opp } from '../features/play/engine'
import { nextBotAction, botDefend } from '../features/play/bot'
import type { Difficulty, GameState, Side } from '../features/play/types'

const DIFFS: { id: Difficulty; label: string; blurb: string }[] = [
  { id: 'easy', label: 'Easy', blurb: 'Casual — great for learning' },
  { id: 'normal', label: 'Normal', blurb: 'Solid fundamentals' },
  { id: 'hard', label: 'Hard', blurb: 'Smart trades & defence' },
  { id: 'god', label: 'God', blurb: 'Near-perfect combat math' },
]

const DIFF_KEY = 'hamantis.play.difficulty'

function loadDifficulty(): Difficulty {
  try {
    const v = localStorage.getItem(DIFF_KEY)
    if (v === 'easy' || v === 'normal' || v === 'hard' || v === 'god') return v
  } catch {
    /* ignore */
  }
  return 'normal'
}

/** Whether the user has asked the OS to minimise motion. */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const awarded = useRef(false)

  const pickDifficulty = (d: Difficulty) => {
    setDifficulty(d)
    try {
      localStorage.setItem(DIFF_KEY, d)
    } catch {
      /* ignore */
    }
  }

  const newGame = () => {
    const youDeck = decks.find((d) => d.id === deckId) ?? null
    recordPlay() // tracks games-played-today (no cap — unlimited bot practice)
    awarded.current = false
    setAttacker(null)
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

  // Clean up the reveal timer on unmount.
  useEffect(() => () => {
    if (revealTimer.current) clearTimeout(revealTimer.current)
  }, [])

  // ---- driver: advance the bot's turn / its defense automatically ----
  useEffect(() => {
    // Always clear any in-flight timer FIRST, before any early return, so a reset /
    // win / unmount can never leave an orphaned setTimeout to clobber fresh state.
    if (timer.current) clearTimeout(timer.current)
    if (!game || game.winner !== null) return

    if (game.pending) {
      const defender = opp(game.pending.attackerSide)
      if (defender === 1) {
        // bot is defending an attack you declared — guarded functional update so a
        // stale closure can't resurrect a game you've since reset.
        timer.current = setTimeout(() => {
          setGame((s) => {
            if (!s || s.winner !== null || !s.pending) return s
            let g = s
            for (const a of botDefend(g, difficulty)) g = apply(g, a)
            return g
          })
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
  }, [game, difficulty])

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
        <h1 className="text-xl font-bold text-mantis-100">Practice Duel vs Bot</h1>
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
      </div>
    )
  }

  const you = game.players[0]
  const yourTurn = game.active === 0 && game.winner === null && !game.pending
  const defending = game.pending && opp(game.pending.attackerSide) === 0

  // ---- human actions ----
  const act = (a: Parameters<typeof apply>[1]) => setGame((s) => (s ? apply(s, a) : s))

  const onYourCardClick = (ref: 'leader' | string, rested: boolean, sick: boolean) => {
    if (game.active !== 0 || game.pending) return
    if (game.phase === 'main') {
      if (you.donAvailable > 0) act({ t: 'attachDon', target: ref })
    } else if (game.phase === 'attack') {
      if (!rested && !sick) setAttacker(ref)
    }
  }
  const onEnemyTargetClick = (ref: 'leader' | string) => {
    if (!yourTurn || game.phase !== 'attack' || !attacker) return
    act({ t: 'declareAttack', attacker, target: ref })
    setAttacker(null)
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
        </div>
        <button onClick={() => setGame(null)} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
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
                className={`relative w-16 shrink-0 overflow-hidden rounded-lg ring-1 transition ${playable ? 'ring-mantis-500 hover:-translate-y-1' : 'opacity-70 ring-slate-800'}`}
                title={d.name}
              >
                <Mini card={resolveCard(id)} />
                <span className="absolute left-0.5 top-0.5 rounded bg-black/70 px-1 text-[0.6rem] font-bold text-white">◆{d.cost}</span>
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

      {/* Defense modal */}
      {defending && game.pending && (
        <DefenseModal g={game} onAct={act} />
      )}

      {/* Result screen */}
      {game.winner !== null && (
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
              onClick={() => setGame(null)}
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
    </div>
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

function Mini({ card }: { card: ReturnType<ReturnType<typeof useCollection>['resolveCard']> }) {
  if (!card) return <div className="aspect-[5/7] w-full bg-ink-850" />
  return <CardImage card={card} className="!rounded-none" />
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
          className={`relative w-16 shrink-0 overflow-hidden rounded-lg ring-2 ${selected === 'leader' ? 'ring-straw-400' : enemy && targetable ? 'ring-rose-500 animate-pulse' : 'ring-mantis-700/60'} ${p.leaderRested || ownInactive(p.leaderRested, false) ? 'opacity-50' : ''}`}
          title="Leader"
        >
          <Mini card={leaderCard} />
          <Power v={effPower(g, side, 'leader')} />
        </button>
        {/* characters */}
        {p.board.map((c) => {
          const targetableChar = enemy && targetable && c.rested
          return (
            <button
              key={c.uid}
              onClick={() => (enemy ? c.rested && onTarget?.(c.uid) : onCard?.(c.uid, c.rested, c.playedThisTurn))}
              className={`relative w-14 shrink-0 overflow-hidden rounded-lg ring-1 ${selected === c.uid ? 'ring-2 ring-straw-400' : targetableChar ? 'ring-2 ring-rose-500 animate-pulse' : 'ring-slate-700'} ${c.rested || ownInactive(c.rested, c.playedThisTurn) ? 'opacity-50' : ''}`}
              title={def(g, c.cardId).name}
            >
              <Mini card={resolve(c.cardId)} />
              <Power v={def(g, c.cardId).power + c.attachedDon * 1000} />
            </button>
          )
        })}
        {p.board.length === 0 && <span className="py-6 text-[0.65rem] text-slate-600">no characters</span>}
      </div>
    </div>
  )
}

function Power({ v }: { v: number }) {
  return <span className="absolute bottom-0.5 right-0.5 rounded bg-mantis-700/90 px-1 text-[0.6rem] font-bold text-white">{v}</span>
}

function DefenseModal({ g, onAct }: { g: GameState; onAct: (a: Parameters<typeof apply>[1]) => void }) {
  const pd = g.pending!
  const me: Side = 0
  const p = g.players[me]
  const onLeader = pd.target === 'leader'
  // Resolution runs against the blocker once one is chosen, so the power readout must too.
  const tgt = pd.blockerUid ?? pd.target
  const targetPow = effPower(g, me, tgt) + pd.counterAdded
  const blockers = p.board.filter((c) => !c.rested && def(g, c.cardId).isBlocker)
  const counters = p.hand.filter((id) => def(g, id).counter > 0)
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-rose-700/60 bg-ink-900 p-4">
        <h3 className="text-sm font-bold text-rose-200">Bot attacks {onLeader ? 'your Leader' : 'your character'}!</h3>
        <p className="mt-1 text-xs text-slate-300">
          Attack power <b className="text-rose-300">{pd.baseAttackPower}</b> vs your{' '}
          <b className="text-mantis-200">{targetPow}</b>. {pd.baseAttackPower >= targetPow ? 'It would hit.' : 'You survive.'}
        </p>
        {blockers.length > 0 && pd.blockerUid === null && (
          <div className="mt-3">
            <div className="text-xs text-slate-400">Block (redirect to a Blocker):</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {blockers.map((c) => (
                <button key={c.uid} onClick={() => onAct({ t: 'block', blockerUid: c.uid })} className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">
                  🧱 {def(g, c.cardId).name}
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
                <button key={id + i} onClick={() => onAct({ t: 'counter', cardId: id })} className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">
                  +{def(g, id).counter} {def(g, id).name}
                </button>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => onAct({ t: 'resolveDefense' })} className="mt-4 w-full rounded-lg bg-mantis-600 px-4 py-2 text-sm font-semibold text-white hover:bg-mantis-500">
          Resolve
        </button>
      </div>
    </div>
  )
}
