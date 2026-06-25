import { useMemo, useState } from 'react'
import { useCollection } from '../store/useCollection'
import { useProgress } from '../store/useProgress'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import type { DeckArchetype, Match, MatchResult, MatchupStat } from '../types'

const ARCHETYPES: DeckArchetype[] = ['aggro', 'midrange', 'control', 'combo', 'other']

interface FormState {
  opponentName: string
  opponentLeader: string
  opponentArchetype: DeckArchetype
  myLeader: string
  result: MatchResult | null
  onThePlay: boolean
  notes: string
  mistakes: string
  keyCards: string
  sideboardChanges: string
}

const EMPTY_FORM: FormState = {
  opponentName: '',
  opponentLeader: '',
  opponentArchetype: 'midrange',
  myLeader: '',
  result: null,
  onThePlay: false,
  notes: '',
  mistakes: '',
  keyCards: '',
  sideboardChanges: '',
}

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-ink-850 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-mantis-600 focus:outline-none'

export function MatchTracker() {
  const { matches, upsertMatch, removeMatch } = useCollection()
  const { addXp, awardBadge } = useProgress()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const sorted = useMemo(
    () => [...matches].sort((a, b) => b.date - a.date),
    [matches],
  )

  const stats = useMemo(() => {
    let wins = 0
    let losses = 0
    let draws = 0
    for (const m of matches) {
      if (m.result === 'win') wins++
      else if (m.result === 'loss') losses++
      else draws++
    }
    const decided = wins + losses
    const winRate = decided > 0 ? Math.round((wins / decided) * 100) : null
    return { wins, losses, draws, winRate }
  }, [matches])

  const matchups = useMemo<MatchupStat[]>(() => {
    const map = new Map<string, MatchupStat>()
    for (const m of matches) {
      const key = m.opponentArchetype
      const stat = map.get(key) ?? { key, wins: 0, losses: 0, draws: 0 }
      if (m.result === 'win') stat.wins++
      else if (m.result === 'loss') stat.losses++
      else stat.draws++
      map.set(key, stat)
    }
    return ARCHETYPES.map((a) => map.get(a)).filter((s): s is MatchupStat => Boolean(s))
  }, [matches])

  const leaderMatchups = useMemo<MatchupStat[]>(() => {
    const map = new Map<string, MatchupStat>()
    for (const m of matches) {
      const key = m.opponentLeader.trim() || '(unknown leader)'
      const stat = map.get(key) ?? { key, wins: 0, losses: 0, draws: 0 }
      if (m.result === 'win') stat.wins++
      else if (m.result === 'loss') stat.losses++
      else stat.draws++
      map.set(key, stat)
    }
    return [...map.values()].sort(
      (a, b) => b.wins + b.losses + b.draws - (a.wins + a.losses + a.draws),
    )
  }, [matches])

  const save = async () => {
    if (!form.opponentName.trim()) {
      setError('Opponent name is required.')
      return
    }
    if (!form.result) {
      setError('Pick a result (win, loss, or draw).')
      return
    }
    setError(null)

    const match: Match = {
      id: crypto.randomUUID(),
      date: Date.now(),
      opponentName: form.opponentName.trim(),
      opponentLeader: form.opponentLeader.trim(),
      opponentArchetype: form.opponentArchetype,
      myLeader: form.myLeader.trim(),
      result: form.result,
      onThePlay: form.onThePlay,
      notes: form.notes.trim() || undefined,
      mistakes: form.mistakes.trim() || undefined,
      keyCards: form.keyCards.trim() || undefined,
      sideboardChanges: form.sideboardChanges.trim() || undefined,
    }

    await upsertMatch(match)
    addXp(5)
    if (match.result === 'loss' && match.mistakes) awardBadge('no-tilt')
    setForm(EMPTY_FORM)
  }

  return (
    <div className="space-y-6">
      {/* Stats header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Matches" value={matches.length} icon="⚔️" />
        <StatCard label="Wins" value={stats.wins} icon="✅" />
        <StatCard label="Losses" value={stats.losses} icon="❌" />
        <StatCard
          label="Win rate"
          value={stats.winRate === null ? '—' : `${stats.winRate}%`}
          hint={stats.draws > 0 ? `${stats.draws} draw${stats.draws > 1 ? 's' : ''}` : undefined}
          icon="📈"
        />
      </div>

      {/* Log a match */}
      <section className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Log a match
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Opponent name *</span>
            <input
              className={inputClass}
              value={form.opponentName}
              onChange={(e) => set('opponentName', e.target.value)}
              placeholder="e.g. Kenji"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Opponent leader</span>
            <input
              className={inputClass}
              value={form.opponentLeader}
              onChange={(e) => set('opponentLeader', e.target.value)}
              placeholder="e.g. Sakazuki"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Opponent archetype</span>
            <select
              className={inputClass}
              value={form.opponentArchetype}
              onChange={(e) => set('opponentArchetype', e.target.value as DeckArchetype)}
            >
              {ARCHETYPES.map((a) => (
                <option key={a} value={a} className="capitalize">
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Your leader</span>
            <input
              className={inputClass}
              value={form.myLeader}
              onChange={(e) => set('myLeader', e.target.value)}
              placeholder="e.g. Portgas.D.Ace"
            />
          </label>
        </div>

        <div className="mt-3">
          <span className="mb-1 block text-xs text-slate-400">Result *</span>
          <div className="flex gap-2">
            {(['win', 'loss', 'draw'] as MatchResult[]).map((r) => {
              const active = form.result === r
              const activeClass =
                r === 'win'
                  ? 'bg-mantis-600 text-white'
                  : r === 'loss'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-600 text-white'
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('result', r)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                    active
                      ? activeClass
                      : 'border border-slate-700 bg-ink-850 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {r}
                </button>
              )
            })}
          </div>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.onThePlay}
            onChange={(e) => set('onThePlay', e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-ink-850 text-mantis-600 focus:ring-mantis-600"
          />
          On the play
        </label>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Key cards</span>
            <input
              className={inputClass}
              value={form.keyCards}
              onChange={(e) => set('keyCards', e.target.value)}
              placeholder="Cards that mattered"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Notes</span>
            <textarea
              className={inputClass}
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="How the game went"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Mistakes</span>
            <textarea
              className={inputClass}
              rows={2}
              value={form.mistakes}
              onChange={(e) => set('mistakes', e.target.value)}
              placeholder="What you'd do differently"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Sideboard changes</span>
            <textarea
              className={inputClass}
              rows={2}
              value={form.sideboardChanges}
              onChange={(e) => set('sideboardChanges', e.target.value)}
              placeholder="What you'd swap"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <button
          type="button"
          onClick={save}
          className="mt-4 rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500"
        >
          Save match (+5 XP)
        </button>
      </section>

      {/* Matchup history */}
      {matchups.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Matchup history (by archetype)
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-ink-850/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase text-slate-500">
                  <th className="px-2 py-2 font-medium sm:px-4">Archetype</th>
                  <th className="px-2 py-2 font-medium sm:px-4">W-L-D</th>
                  <th className="px-2 py-2 font-medium sm:px-4">Win rate</th>
                </tr>
              </thead>
              <tbody>
                {matchups.map((m) => {
                  const decided = m.wins + m.losses
                  const wr = decided > 0 ? Math.round((m.wins / decided) * 100) : null
                  return (
                    <tr key={m.key} className="border-b border-slate-800/60 last:border-0">
                      <td className="px-2 py-2 capitalize text-slate-200 sm:px-4">{m.key}</td>
                      <td className="px-2 py-2 text-slate-300 sm:px-4">
                        {m.wins}-{m.losses}-{m.draws}
                      </td>
                      <td className="px-2 py-2 text-slate-300 sm:px-4">{wr === null ? '—' : `${wr}%`}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {leaderMatchups.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {leaderMatchups.map((m) => (
                <Badge key={m.key}>
                  {m.key}: {m.wins}-{m.losses}-{m.draws}
                </Badge>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Match log */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Match log
        </h2>

        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-ink-850/30 p-8 text-center text-sm text-slate-500">
            No matches logged yet. Record your first game above.
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((m) => {
              const isOpen = expanded[m.id] ?? false
              const hasDetails = Boolean(
                m.notes || m.mistakes || m.keyCards || m.sideboardChanges,
              )
              const chipClass =
                m.result === 'win'
                  ? 'bg-mantis-600/20 text-mantis-300'
                  : m.result === 'loss'
                    ? 'bg-rose-600/20 text-rose-300'
                    : 'bg-slate-600/30 text-slate-300'
              return (
                <div
                  key={m.id}
                  className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${chipClass}`}
                        >
                          {m.result}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(m.date).toLocaleDateString()}
                        </span>
                        {m.onThePlay !== undefined && (
                          <span className="text-xs text-slate-500">
                            {m.onThePlay ? 'on the play' : 'on the draw'}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-200">
                        vs {m.opponentName}
                        {m.opponentLeader ? ` (${m.opponentLeader}` : ''}
                        {m.opponentLeader ? `, ${m.opponentArchetype})` : ` (${m.opponentArchetype})`}
                      </p>
                      {m.myLeader && (
                        <p className="text-xs text-slate-500">Your leader: {m.myLeader}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {hasDetails && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((e) => ({ ...e, [m.id]: !isOpen }))
                          }
                          className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-600"
                        >
                          {isOpen ? 'Hide' : 'Details'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMatch(m.id)}
                        className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-rose-400 hover:border-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isOpen && hasDetails && (
                    <div className="mt-3 space-y-2 border-t border-slate-800 pt-3 text-sm">
                      {m.keyCards && (
                        <p className="text-slate-300">
                          <span className="text-slate-500">Key cards: </span>
                          {m.keyCards}
                        </p>
                      )}
                      {m.notes && (
                        <p className="text-slate-300">
                          <span className="text-slate-500">Notes: </span>
                          {m.notes}
                        </p>
                      )}
                      {m.mistakes && (
                        <p className="text-slate-300">
                          <span className="text-slate-500">Mistakes: </span>
                          {m.mistakes}
                        </p>
                      )}
                      {m.sideboardChanges && (
                        <p className="text-slate-300">
                          <span className="text-slate-500">Sideboard: </span>
                          {m.sideboardChanges}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
