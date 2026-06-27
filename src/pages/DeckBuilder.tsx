import { useMemo, useState } from 'react'
import { useCollection } from '../store/useCollection'
import { useProgress } from '../store/useProgress'
import { generateSealedPool } from '../features/sealed/poolGenerator'
import { analyzeDeck, DECK_TARGET_SIZE, deckSize } from '../features/sealed/deckEngine'
import { CardFace } from '../components/ui/CardFace'
import { CardTooltip } from '../components/ui/CardTooltip'
import { RatingPill } from '../components/ui/RatingPill'
import { ColorDot } from '../components/ui/Badge'
import type { Card, Deck, PoolCard, SealedPool, TargetStatus } from '../types'

type SortMode = 'rating' | 'cost'

function emptyDeck(): Deck {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name: '',
    leaderId: null,
    cards: {},
    createdAt: now,
    updatedAt: now,
  }
}

interface PoolGroup {
  cardId: string
  card: Card
  available: number
}

export function DeckBuilder() {
  const { resolveCard, fullIndex, decks, upsertDeck, removeDeck } =
    useCollection()
  const { recordTraining, awardBadge } = useProgress()

  const [packs, setPacks] = useState(6)
  const [pool, setPool] = useState<SealedPool | null>(null)
  const [deck, setDeck] = useState<Deck>(emptyDeck)
  const [sort, setSort] = useState<SortMode>('rating')
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  // Group opened pool copies by cardId -> available count.
  const groups = useMemo<PoolGroup[]>(() => {
    if (!pool) return []
    const counts = new Map<string, number>()
    for (const pc of pool.cards) counts.set(pc.cardId, (counts.get(pc.cardId) ?? 0) + 1)
    const list: PoolGroup[] = []
    for (const [cardId, available] of counts) {
      const card = resolveCard(cardId)
      if (card) list.push({ cardId, card, available })
    }
    list.sort((a, b) => {
      if (sort === 'cost') return (a.card.cost ?? 0) - (b.card.cost ?? 0)
      return (b.card.sealedRating ?? 0) - (a.card.sealedRating ?? 0)
    })
    return list
  }, [pool, resolveCard, sort])

  const analysis = useMemo(() => analyzeDeck(deck, fullIndex), [deck, fullIndex])
  const size = deckSize(deck)

  const leaderCards = useMemo(
    () => (pool ? pool.leaders.map((id) => resolveCard(id)).filter((c): c is Card => !!c) : []),
    [pool, resolveCard],
  )

  const generate = () => {
    setPool(generateSealedPool({ packs }))
    setDeck(emptyDeck())
    setSavedMsg(null)
  }

  const pickLeader = (id: string) =>
    setDeck((d) => ({ ...d, leaderId: d.leaderId === id ? null : id, updatedAt: Date.now() }))

  const availableOf = (cardId: string) =>
    groups.find((g) => g.cardId === cardId)?.available ?? 0

  const add = (cardId: string) =>
    setDeck((d) => {
      const cur = d.cards[cardId] ?? 0
      if (cur >= availableOf(cardId)) return d
      return { ...d, cards: { ...d.cards, [cardId]: cur + 1 }, updatedAt: Date.now() }
    })

  const remove = (cardId: string) =>
    setDeck((d) => {
      const cur = d.cards[cardId] ?? 0
      if (cur <= 0) return d
      const next = { ...d.cards }
      if (cur - 1 <= 0) delete next[cardId]
      else next[cardId] = cur - 1
      return { ...d, cards: next, updatedAt: Date.now() }
    })

  const save = async () => {
    const toSave: Deck = {
      ...deck,
      name: deck.name.trim() || 'Untitled sealed deck',
      poolId: pool?.id ?? deck.poolId,
      updatedAt: Date.now(),
    }
    await upsertDeck(toSave)
    setDeck(toSave)
    let msg = `Saved "${toSave.name}".`
    if (deckSize(toSave) === DECK_TARGET_SIZE) {
      recordTraining('sealedPlansLocked', 25)
      awardBadge('sealed-specialist')
      msg += ' +25 XP — 40-card deck locked! 📦'
      if (analysis.targets.every((t) => t.status === 'ok')) {
        awardBadge('curve-builder')
        msg += ' Curve Builder badge earned! 📈'
      }
    }
    setSavedMsg(msg)
  }

  const loadDeck = (d: Deck) => {
    setDeck({ ...d })
    // Rebuild a pool from the saved deck so the editor (leader, analysis, save,
    // card list) renders immediately — otherwise Load is a dead end with no pool.
    const cards: PoolCard[] = []
    let i = 0
    for (const [cardId, qty] of Object.entries(d.cards)) {
      for (let n = 0; n < qty; n++) cards.push({ instanceId: `load-${i++}`, cardId })
    }
    setPool({
      id: `loaded-${d.id}`,
      createdAt: Date.now(),
      leaders: d.leaderId ? [d.leaderId] : [],
      cards,
      packs: 0,
    })
    setSavedMsg(`Loaded "${d.name}". Edit or re-save below.`)
  }

  return (
    <div className="space-y-6">
      {/* Pool generation */}
      <section className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
        <h2 className="text-base font-bold text-mantis-100">Sealed Deck Builder</h2>
        <p className="mt-1 text-sm text-slate-400">
          Open a sealed pool and build a 40-card pre-release deck.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div>
            <span className="mb-1 block text-xs font-medium text-slate-400">Packs</span>
            <div className="flex gap-2">
              {[4, 6, 8].map((p) => (
                <button
                  key={p}
                  onClick={() => setPacks(p)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    packs === p
                      ? 'bg-mantis-600 text-white'
                      : 'border border-slate-700 bg-ink-850 text-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={generate}
            className="mt-5 rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500"
          >
            {pool ? 'Re-open pool' : 'Generate sealed pool'}
          </button>
        </div>
      </section>

      {pool && (
        <>
          {/* Leader pick */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Choose your leader
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {leaderCards.map((l) => {
                const active = deck.leaderId === l.id
                return (
                  <button
                    key={l.id}
                    onClick={() => pickLeader(l.id)}
                    className={`rounded-xl border p-2 text-left transition ${
                      active
                        ? 'border-mantis-500 bg-mantis-900/40'
                        : 'border-slate-800 bg-ink-850/50 hover:border-mantis-700/60'
                    }`}
                  >
                    <CardTooltip card={l} className="w-full">
                      <CardFace card={l} size="md" />
                    </CardTooltip>
                    <div className="mt-2 line-clamp-1 text-sm font-medium text-slate-100">
                      {l.name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      {l.color.map((c) => (
                        <ColorDot key={c} color={c} />
                      ))}
                      <span className="ml-1">{active ? 'Selected' : 'Tap to pick'}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Analysis */}
          <section className="rounded-2xl border border-mantis-800/40 bg-mantis-900/20 p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-mantis-200">
                Deck analysis
              </h2>
              <span
                className={`text-lg font-bold ${
                  size === DECK_TARGET_SIZE ? 'text-mantis-200' : 'text-amber-300'
                }`}
              >
                {size}/{DECK_TARGET_SIZE}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {analysis.targets.map((t) => (
                <TargetChip key={t.label} t={t} />
              ))}
            </div>

            {/* Mana curve */}
            <ManaCurve curve={analysis.curve} />

            {analysis.notes.length > 0 && (
              <ul className="mt-3 space-y-1">
                {analysis.notes.map((n, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-mantis-400">›</span>
                    {n}
                  </li>
                ))}
              </ul>
            )}

            {/* Save */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                value={deck.name}
                onChange={(e) => setDeck((d) => ({ ...d, name: e.target.value }))}
                placeholder="Deck name"
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-ink-850 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-mantis-600 focus:outline-none"
              />
              <button
                onClick={() => void save()}
                className="rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500"
              >
                Save deck
              </button>
            </div>
            {savedMsg && <p className="mt-2 text-sm text-mantis-300">{savedMsg}</p>}
          </section>

          {/* Pool grid */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Your pool ({groups.length} unique)
              </h2>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="rounded-lg border border-slate-700 bg-ink-850 px-2.5 py-1.5 text-xs text-slate-200 focus:border-mantis-600 focus:outline-none"
              >
                <option value="rating" className="bg-ink-900">Sort: Rating</option>
                <option value="cost" className="bg-ink-900">Sort: Cost</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {groups.map((g) => {
                const inDeck = deck.cards[g.cardId] ?? 0
                return (
                  <div
                    key={g.cardId}
                    className="rounded-xl border border-slate-800 bg-ink-850/50 p-2"
                  >
                    <CardTooltip card={g.card} className="relative w-full">
                      <CardFace card={g.card} size="sm" />
                      <span className="absolute right-1 top-1">
                        <RatingPill rating={g.card.sealedRating} />
                      </span>
                      {inDeck > 0 && (
                        <span className="absolute left-1 top-1 rounded-full bg-mantis-600 px-2 py-0.5 text-xs font-bold text-white">
                          ×{inDeck}
                        </span>
                      )}
                    </CardTooltip>
                    <div className="mt-2 line-clamp-1 text-sm font-medium text-slate-100">
                      {g.card.name}
                    </div>
                    <div className="flex items-center justify-between text-[0.65rem] text-slate-500">
                      <span className="flex items-center gap-1">
                        {g.card.color.map((c) => (
                          <ColorDot key={c} color={c} />
                        ))}
                        <span className="ml-0.5">◆{g.card.cost ?? '—'}</span>
                      </span>
                      <span>
                        {inDeck}/{g.available}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        onClick={() => remove(g.cardId)}
                        disabled={inDeck <= 0}
                        className="h-8 flex-1 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-30"
                      >
                        −
                      </button>
                      <button
                        onClick={() => add(g.cardId)}
                        disabled={inDeck >= g.available}
                        className="h-8 flex-1 rounded-lg bg-mantis-600 text-white hover:bg-mantis-500 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {/* Saved decks */}
      {decks.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Saved decks ({decks.length})
          </h2>
          <div className="space-y-2">
            {decks.map((d) => {
              const leader = d.leaderId ? resolveCard(d.leaderId) : null
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-ink-850/50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="line-clamp-1 font-medium text-slate-100">{d.name}</div>
                    <div className="text-xs text-slate-500">
                      {leader ? leader.name : 'No leader'} · {deckSize(d)} cards
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => loadDeck(d)}
                      className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => void removeDeck(d.id)}
                      className="rounded-lg border border-rose-700/60 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-900/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function TargetChip({ t }: { t: TargetStatus }) {
  const cls =
    t.status === 'ok'
      ? 'border-mantis-600/50 bg-mantis-900/30 text-mantis-200'
      : t.status === 'low'
        ? 'border-amber-600/50 bg-amber-900/20 text-amber-200'
        : 'border-rose-600/50 bg-rose-900/20 text-rose-200'
  return (
    <div className={`rounded-xl border p-2 ${cls}`}>
      <div className="text-sm font-bold">
        {t.count}
        <span className="text-xs font-normal opacity-70">
          {' '}
          / {t.min}–{t.max}
        </span>
      </div>
      <div className="text-xs">{t.label}</div>
    </div>
  )
}

function ManaCurve({ curve }: { curve: Record<number, number> }) {
  const costs = Array.from({ length: 11 }, (_, i) => i) // 0..10
  const max = Math.max(1, ...costs.map((c) => curve[c] ?? 0))
  const hasAny = costs.some((c) => (curve[c] ?? 0) > 0)
  if (!hasAny) return null
  return (
    <div className="mt-4">
      <div className="mb-1 text-xs font-medium text-slate-400">Mana curve</div>
      <div className="flex items-end gap-1">
        {costs.map((c) => {
          const n = curve[c] ?? 0
          return (
            <div key={c} className="flex flex-1 flex-col items-center gap-1">
              <div className="text-[0.6rem] text-slate-400">{n || ''}</div>
              <div
                className="w-full rounded-t bg-mantis-500/80"
                style={{ height: `${Math.round((n / max) * 56)}px`, minHeight: n > 0 ? 4 : 0 }}
              />
              <div className="text-[0.6rem] text-slate-500">{c}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
