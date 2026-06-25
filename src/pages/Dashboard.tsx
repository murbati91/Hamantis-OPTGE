import { Link } from 'react-router-dom'
import { useCollection } from '../store/useCollection'
import { useProgress, xpIntoLevel } from '../store/useProgress'
import { StatCard } from '../components/ui/StatCard'
import { RatingPill } from '../components/ui/RatingPill'
import { is2kCounter, isBlocker, isRemoval } from '../lib/cards'
import { Logo } from '../components/ui/Logo'
import type { CardColor } from '../types'

export function Dashboard() {
  const { entries, cardIndex, settings, decks, matches } = useCollection()
  const { xp, level, title, badges } = useProgress()

  const wins = matches.filter((m) => m.result === 'win').length
  const losses = matches.filter((m) => m.result === 'loss').length
  const winRate =
    wins + losses > 0 ? `${Math.round((wins / (wins + losses)) * 100)}%` : '—'

  const owned = Object.values(entries)
  const totalCopies = owned.reduce((sum, e) => sum + e.quantity, 0)
  const uniqueOwned = owned.length

  const ownedCards = owned
    .map((e) => cardIndex[e.cardId])
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  const counters = ownedCards.filter(is2kCounter).length
  const blockers = ownedCards.filter(isBlocker).length
  const removal = ownedCards.filter(isRemoval).length

  // Color spread
  const colorCounts = new Map<CardColor, number>()
  for (const c of ownedCards) {
    for (const col of c.color) colorCounts.set(col, (colorCounts.get(col) ?? 0) + 1)
  }

  const topRated = Object.values(cardIndex)
    .filter((c) => c.sealedRating != null)
    .sort((a, b) => (b.sealedRating ?? 0) - (a.sealedRating ?? 0))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Progress hero */}
      <section className="rounded-2xl border border-mantis-800/50 bg-gradient-to-br from-mantis-900/60 to-ink-900 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-mantis-300">{title}</div>
            <div className="text-2xl font-bold text-mantis-100">Level {level}</div>
          </div>
          <Logo className="h-12 w-12" />
        </div>
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-950">
            <div
              className="h-full rounded-full bg-mantis-400 transition-all"
              style={{ width: `${xpIntoLevel(xp)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>{xp} XP total</span>
            <span>{xpIntoLevel(xp)}/100 to next level</span>
          </div>
        </div>
      </section>

      {/* New-player glossary hint */}
      <Link
        to="/glossary"
        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-ink-850/50 px-4 py-3 hover:border-mantis-700/60"
      >
        <span className="min-w-0 text-sm text-slate-300">
          📖 New to the terms? <span className="text-mantis-300">Open the Glossary</span> — 2K counter, blocker, removal & more explained.
        </span>
        <span className="shrink-0 text-slate-500">›</span>
      </Link>

      {/* Collection stats */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Collection
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Unique cards" value={uniqueOwned} icon="🗂️" />
          <StatCard label="Total copies" value={totalCopies} icon="📚" />
          <StatCard label="2K counters" value={counters} icon="🛡️" />
          <StatCard label="Blockers" value={blockers} icon="🧱" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Removal" value={removal} icon="💥" />
          <StatCard label="Badges" value={`${badges.length}/6`} icon="🏅" />
          <StatCard
            label="Mode"
            value={settings.privateMode ? 'Private' : 'Open'}
            icon="🔒"
          />
          <StatCard
            label="Colors"
            value={colorCounts.size}
            hint={[...colorCounts.keys()].join(' ')}
            icon="🎨"
          />
        </div>
      </section>

      {/* Activity */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Activity
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Link to="/deck-builder">
            <StatCard label="Decks" value={decks.length} icon="🛠️" />
          </Link>
          <Link to="/matches">
            <StatCard label="Matches" value={matches.length} icon="⚔️" />
          </Link>
          <Link to="/matches">
            <StatCard label="Win rate" value={winRate} hint={`${wins}W · ${losses}L`} icon="📊" />
          </Link>
        </div>
      </section>

      {uniqueOwned === 0 && (
        <section className="rounded-2xl border border-dashed border-slate-700 bg-ink-850/40 p-6 text-center">
          <p className="text-slate-300">Your wallet is empty.</p>
          <p className="mt-1 text-sm text-slate-400">
            Browse the OP16 reference set or add your own cards to start tracking your collection.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              to="/wallet"
              className="rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500"
            >
              Open Wallet
            </Link>
            <Link
              to="/add"
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Add Card
            </Link>
          </div>
        </section>
      )}

      {/* Watchlist */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
OP16 Top Rated (reference)
          </h2>
          <Link to="/sealed" className="text-xs text-mantis-400 hover:underline">
            Sealed tools →
          </Link>
        </div>
        <div className="space-y-2">
          {topRated.map((c) => (
            <Link
              key={c.id}
              to={`/card/${c.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-ink-850/50 px-4 py-3 hover:border-mantis-700/60"
            >
              <div>
                <div className="font-medium text-slate-100">{c.name}</div>
                <div className="text-xs text-slate-500">
                  {c.id} · {c.sealedRole}
                </div>
              </div>
              <RatingPill rating={c.sealedRating} />
            </Link>
          ))}
        </div>
      </section>

      {/* Training quick link */}
      <section className="rounded-2xl border border-slate-800 bg-ink-850/50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-mantis-100">Train your edge 🎯</h3>
            <p className="mt-1 text-sm text-slate-400">
              Drill 2K-counter math and sealed decisions to earn XP and badges.
            </p>
          </div>
          <Link
            to="/training"
            className="shrink-0 rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500"
          >
            Train
          </Link>
        </div>
      </section>
    </div>
  )
}
