import { useMemo, useState } from 'react'
import { useCollection } from '../store/useCollection'
import { CardFace } from '../components/ui/CardFace'
import { buildDeck, buildResultToDeck, type BuildResult } from '../features/deckbuilder/aiBuilder'
import { refineWithClaude } from '../features/deckbuilder/claudeRefine'
import type { Card, CardColor } from '../types'

type Mode = 'leader' | 'strategy'
const COLORS: CardColor[] = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow']

export function AIDeckBuilder() {
  const { fullIndex, settings, setSettings, upsertDeck } = useCollection()
  const [keyDraft, setKeyDraft] = useState('')
  const pool = useMemo(() => Object.values(fullIndex), [fullIndex])
  const leaders = useMemo(
    () => pool.filter((c) => c.type === 'Leader').sort((a, b) => a.id.localeCompare(b.id)),
    [pool],
  )

  const [mode, setMode] = useState<Mode>('leader')
  const [leaderColor, setLeaderColor] = useState<CardColor | ''>('')
  const [leaderId, setLeaderId] = useState<string>('')
  const [strategy, setStrategy] = useState('')
  const [result, setResult] = useState<BuildResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [refine, setRefine] = useState<string | null>(null)
  const [refining, setRefining] = useState(false)
  const [refineErr, setRefineErr] = useState<string | null>(null)

  const shownLeaders = leaderColor ? leaders.filter((l) => l.color.includes(leaderColor)) : leaders

  const build = () => {
    setError(null); setSaved(false); setRefine(null); setRefineErr(null)
    try {
      const res = buildDeck(
        mode === 'leader' ? { pool, leaderId } : { pool, strategy },
      )
      setResult(res)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Could not build a deck.')
    }
  }

  const save = async () => {
    if (!result) return
    await upsertDeck(buildResultToDeck(result, Date.now(), crypto.randomUUID()))
    setSaved(true)
  }

  const askClaude = async () => {
    if (!result || !settings.anthropicKey) return
    setRefining(true); setRefineErr(null); setRefine(null)
    try {
      const deckCards = Object.entries(result.deck)
        .map(([id, count]) => ({ card: fullIndex[id], count }))
        .filter((d): d is { card: Card; count: number } => Boolean(d.card))
      const text = await refineWithClaude({
        apiKey: settings.anthropicKey,
        leaderName: result.leader.name,
        archetype: result.archetype,
        deckCards,
      })
      setRefine(text)
    } catch (e) {
      setRefineErr(e instanceof Error ? e.message : 'Claude request failed.')
    } finally {
      setRefining(false)
    }
  }

  const canBuild = mode === 'leader' ? Boolean(leaderId) : strategy.trim().length > 0

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        An AI agent that builds a legal 50-card constructed deck for you — color-locked to your
        Leader, curve-tuned, 4-copy rule enforced. Pick a Leader or just describe a strategy.
      </p>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['leader', 'strategy'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null); setError(null) }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === m ? 'bg-mantis-600 text-white' : 'border border-slate-700 bg-ink-850 text-slate-300'
            }`}
          >
            {m === 'leader' ? '👑 Pick a Leader' : '✍️ Describe a strategy'}
          </button>
        ))}
      </div>

      {/* Inputs */}
      {mode === 'leader' ? (
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-ink-900/60 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLeaderColor('')}
              className={`rounded-lg px-2.5 py-1.5 text-xs ${leaderColor === '' ? 'bg-mantis-600 text-white' : 'border border-slate-700 bg-ink-850 text-slate-300'}`}
            >All</button>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setLeaderColor(c)}
                className={`rounded-lg px-2.5 py-1.5 text-xs ${leaderColor === c ? 'bg-mantis-600 text-white' : 'border border-slate-700 bg-ink-850 text-slate-300'}`}
              >{c}</button>
            ))}
          </div>
          <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
            {shownLeaders.map((l) => (
              <button
                key={l.id}
                onClick={() => setLeaderId(l.id)}
                className={`rounded-lg p-1 transition ${leaderId === l.id ? 'ring-2 ring-mantis-500' : 'opacity-80 hover:opacity-100'}`}
                title={`${l.name} (${l.id})`}
              >
                <CardFace card={l} size="sm" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2 rounded-2xl border border-slate-800 bg-ink-900/60 p-4">
          <textarea
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            rows={3}
            placeholder="e.g. aggressive Red Straw Hat rush, or Blue control with lots of removal…"
            className="w-full rounded-xl border border-slate-700 bg-ink-850 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-mantis-600 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {['aggressive', 'control', ...COLORS.map((c) => c.toLowerCase())].map((chip) => (
              <button
                key={chip}
                onClick={() => setStrategy((s) => (s ? `${s} ${chip}` : chip))}
                className="rounded-full border border-slate-700 bg-ink-850 px-2.5 py-1 text-xs text-slate-300 hover:border-mantis-600"
              >+ {chip}</button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={build}
        disabled={!canBuild}
        className="w-full rounded-xl bg-mantis-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-mantis-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ⚙️ Build deck
      </button>

      {error && (
        <div className="rounded-xl border border-mantis-700 bg-mantis-900/30 p-3 text-sm text-mantis-200">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-ink-900/60 p-4">
          <div className="flex items-start gap-4">
            <div className="w-24 shrink-0">
              <CardFace card={result.leader} size="md" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-mantis-200">{result.archetype}</h2>
              <ul className="mt-1 space-y-0.5 text-xs text-slate-400">
                {result.reasoning.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={save} className="rounded-lg bg-straw-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-straw-500">
              💾 {saved ? 'Saved!' : 'Save deck'}
            </button>
            {settings.anthropicKey ? (
              <button onClick={askClaude} disabled={refining} className="rounded-lg border border-mantis-600 px-3 py-1.5 text-xs font-bold text-mantis-200 hover:bg-mantis-900/40 disabled:opacity-50">
                {refining ? '🤖 Claude is thinking…' : '🤖 Refine with Claude'}
              </button>
            ) : (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="password"
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  placeholder="Anthropic API key (optional) — stored on this device"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-ink-850 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-mantis-600 focus:outline-none"
                />
                <button
                  onClick={() => keyDraft.trim() && setSettings({ anthropicKey: keyDraft.trim() })}
                  className="shrink-0 rounded-lg border border-mantis-600 px-2.5 py-1.5 text-xs font-bold text-mantis-200 hover:bg-mantis-900/40"
                >Save key</button>
              </div>
            )}
          </div>

          {refineErr && <div className="rounded-lg bg-mantis-900/30 p-2 text-xs text-mantis-200">{refineErr}</div>}
          {refine && (
            <div className="whitespace-pre-wrap rounded-lg border border-mantis-800/50 bg-ink-850 p-3 text-xs leading-relaxed text-slate-200">
              {refine}
            </div>
          )}

          {/* Deck list grouped by cost */}
          <DeckList deck={result.deck} index={fullIndex} />
        </div>
      )}
    </div>
  )
}

function DeckList({ deck, index }: { deck: Record<string, number>; index: Record<string, Card> }) {
  const groups = useMemo(() => {
    const cards = Object.entries(deck)
      .map(([id, count]) => ({ card: index[id], count }))
      .filter((d): d is { card: Card; count: number } => Boolean(d.card))
    cards.sort((a, b) => (a.card.cost ?? 0) - (b.card.cost ?? 0) || a.card.id.localeCompare(b.card.id))
    return cards
  }, [deck, index])
  const total = groups.reduce((n, g) => n + g.count, 0)

  return (
    <div>
      <div className="mb-2 text-xs font-semibold text-slate-400">{total} cards</div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
        {groups.map(({ card, count }) => (
          <div key={card.id} className="relative">
            <CardFace card={card} size="sm" />
            <span className="absolute right-1 top-1 rounded-full bg-mantis-600 px-1.5 py-0.5 text-[0.6rem] font-bold text-white">
              ×{count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
