import { useEffect, useState } from 'react'
import { useCollection } from '../store/useCollection'
import { useProgress } from '../store/useProgress'
import { StatCard } from '../components/ui/StatCard'
import type { MatchResult, Tournament as TournamentType, TournamentRound } from '../types'

function todayInputValue(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

function record(rounds: TournamentRound[]) {
  let wins = 0
  let losses = 0
  let draws = 0
  for (const r of rounds) {
    if (r.result === 'win') wins++
    else if (r.result === 'loss') losses++
    else if (r.result === 'draw') draws++
  }
  const decided = wins + losses
  const winrate = decided > 0 ? Math.round((wins / decided) * 100) : 0
  const complete = rounds.length > 0 && rounds.every((r) => r.result !== null)
  return { wins, losses, draws, decided, winrate, complete }
}

const RESULTS: { value: MatchResult; label: string; active: string }[] = [
  { value: 'win', label: 'Win', active: 'bg-emerald-600 text-white' },
  { value: 'loss', label: 'Loss', active: 'bg-rose-600 text-white' },
  { value: 'draw', label: 'Draw', active: 'bg-slate-500 text-white' },
]

const inputCls =
  'w-full rounded-lg border border-slate-700 bg-ink-850 px-3 py-2 text-sm text-slate-100 focus:border-mantis-600 focus:outline-none'
const labelCls = 'text-sm font-semibold uppercase tracking-wide text-slate-400'
const primaryBtn =
  'rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500'

export function Tournament() {
  const { tournaments, upsertTournament, updateTournament, removeTournament } = useCollection()
  const { addXp, awardBadge } = useProgress()

  const [activeId, setActiveId] = useState<string | null>(null)

  // New-tournament form state
  const [name, setName] = useState('')
  const [date, setDate] = useState(todayInputValue())
  const [myLeader, setMyLeader] = useState('')
  const [format, setFormat] = useState('Sealed')
  const [numRounds, setNumRounds] = useState(4)

  const sorted = [...tournaments].sort((a, b) => b.date - a.date)
  const active = sorted.find((t) => t.id === activeId) ?? null

  async function createTournament() {
    if (!name.trim()) return
    const safeRounds = Number.isFinite(numRounds) ? Math.min(20, Math.max(1, numRounds)) : 4
    const rounds: TournamentRound[] = Array.from({ length: safeRounds }, (_, i) => ({
      round: i + 1,
      opponentName: '',
      result: null,
    }))
    const t: TournamentType = {
      id: crypto.randomUUID(),
      name: name.trim(),
      date: new Date(date).getTime(),
      myLeader: myLeader.trim(),
      format: format.trim() || 'Sealed',
      rounds,
      createdAt: Date.now(),
    }
    await upsertTournament(t)
    awardBadge('tournament-grinder')
    setActiveId(t.id)
    setName('')
    setMyLeader('')
  }

  async function updateRound(index: number, patch: Partial<TournamentRound>) {
    if (!active) return
    let awardXp = false
    // Functional update reads the LATEST tournament, so a blur (opponent name)
    // and a click (result) fired back-to-back compose instead of overwriting.
    await updateTournament(active.id, (t) => {
      const rounds = t.rounds.map((r, i) => (i === index ? { ...r, ...patch } : r))
      const complete = record(rounds).complete
      if (complete && !t.completionAwarded) {
        awardXp = true
        return { ...t, rounds, completionAwarded: true }
      }
      return { ...t, rounds }
    })
    if (awardXp) addXp(30)
  }

  async function deleteTournament(id: string) {
    await removeTournament(id)
    if (activeId === id) setActiveId(null)
  }

  const stats = active ? record(active.rounds) : null

  return (
    <div className="space-y-6">
      {/* New tournament */}
      <section className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
        <h2 className={labelCls}>New tournament</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Name</span>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Locals — OP16 Sealed"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Date</span>
            <input
              type="date"
              className={inputCls}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">My leader</span>
            <input
              className={inputCls}
              value={myLeader}
              onChange={(e) => setMyLeader(e.target.value)}
              placeholder="Portgas.D.Ace"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Format</span>
            <input
              className={inputCls}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              placeholder="Sealed"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Rounds</span>
            <input
              type="number"
              min={1}
              max={20}
              className={inputCls}
              value={Number.isFinite(numRounds) ? numRounds : ''}
              onChange={(e) => {
                const n = Number(e.target.value)
                setNumRounds(e.target.value === '' ? NaN : Math.min(20, Math.max(1, n)))
              }}
            />
          </label>
        </div>
        <div className="mt-4">
          <button className={primaryBtn} onClick={() => void createTournament()} disabled={!name.trim()}>
            Create tournament
          </button>
        </div>
      </section>

      {/* Tournament list */}
      <section>
        <h2 className={labelCls}>Your tournaments</h2>
        {sorted.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-700 bg-ink-850/30 p-6 text-center text-sm text-slate-500">
            No tournaments yet. Create one above to start tracking rounds.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {sorted.map((t) => {
              const r = record(t.rounds)
              const isActive = t.id === activeId
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 rounded-2xl border p-3 ${
                    isActive
                      ? 'border-mantis-600 bg-mantis-900/20'
                      : 'border-slate-800 bg-ink-850/50'
                  }`}
                >
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setActiveId(t.id)}
                  >
                    <div className="truncate text-sm font-medium text-mantis-100">{t.name}</div>
                    <div className="truncate text-xs text-slate-500">
                      {new Date(t.date).toLocaleDateString()} · {t.format}
                      {t.myLeader ? ` · ${t.myLeader}` : ''} · {r.wins}-{r.losses}-{r.draws}
                      {r.complete ? ' · ✓ complete' : ''}
                    </div>
                  </button>
                  <button
                    className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-rose-600 hover:text-rose-400"
                    onClick={() => void deleteTournament(t.id)}
                  >
                    Delete
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Active tournament */}
      {active && stats && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className={labelCls}>{active.name}</h2>
            <span className="text-xs text-slate-500">{active.format}</span>
          </div>

          {stats.complete && (
            <div className="rounded-2xl border border-mantis-600 bg-mantis-900/30 p-4 text-sm text-mantis-100">
              🏆 Tournament complete — final record {stats.wins}-{stats.losses}-{stats.draws} (
              {stats.winrate}% win rate).
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Wins" value={stats.wins} icon="✅" />
            <StatCard label="Losses" value={stats.losses} icon="❌" />
            <StatCard label="Draws" value={stats.draws} icon="➖" />
            <StatCard label="Win rate" value={`${stats.winrate}%`} hint={`${stats.decided}/${active.rounds.length} played`} icon="📊" />
          </div>

          <div className="space-y-3">
            {active.rounds.map((r, i) => (
              <RoundRow
                key={r.round}
                round={r}
                onResult={(result) => void updateRound(i, { result })}
                onFlush={(patch) => void updateRound(i, patch)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/**
 * One editable round. Text fields are backed by local state and only persisted
 * on blur, so fast typing never round-trips through async storage mid-keystroke
 * (which would drop characters and jump the caret). Result buttons persist
 * immediately.
 */
function RoundRow({
  round,
  onResult,
  onFlush,
}: {
  round: TournamentRound
  onResult: (result: MatchResult | null) => void
  onFlush: (patch: Partial<TournamentRound>) => void
}) {
  const [opponentName, setOpponentName] = useState(round.opponentName)
  const [notes, setNotes] = useState(round.notes ?? '')

  // Re-sync when the underlying round changes from elsewhere (e.g. reload).
  useEffect(() => setOpponentName(round.opponentName), [round.opponentName])
  useEffect(() => setNotes(round.notes ?? ''), [round.notes])

  return (
    <div className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-mantis-100">Round {round.round}</span>
        <div className="flex gap-1.5">
          {RESULTS.map((opt) => {
            const isOn = round.result === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => onResult(isOn ? null : opt.value)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  isOn
                    ? opt.active
                    : 'border border-slate-700 bg-ink-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={inputCls}
          value={opponentName}
          onChange={(e) => setOpponentName(e.target.value)}
          onBlur={() => {
            if (opponentName !== round.opponentName) onFlush({ opponentName })
          }}
          placeholder="Opponent name"
        />
        <input
          className={inputCls}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== (round.notes ?? '')) onFlush({ notes })
          }}
          placeholder="Notes (matchup, key plays…)"
        />
      </div>
    </div>
  )
}
