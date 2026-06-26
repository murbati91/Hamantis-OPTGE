import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../store/useCollection'
import { CardFace } from '../components/ui/CardFace'
import { RatingPill } from '../components/ui/RatingPill'
import { is2kCounter, isBlocker, isRemoval } from '../lib/cards'
import { InfoTip } from '../components/ui/InfoTip'
import type { Card, CardColor, CardType, Rarity } from '../types'

type OwnedFilter = 'all' | 'owned' | 'missing'

const COLORS: CardColor[] = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow']
const TYPES: CardType[] = ['Leader', 'Character', 'Event', 'Stage', 'DON!!']
const RARITIES: Rarity[] = ['L', 'C', 'UC', 'R', 'SR', 'SEC', 'P', 'AA', 'MR']

export function Wallet() {
  const { cardIndex, entries, settings } = useCollection()

  const [q, setQ] = useState('')
  const [color, setColor] = useState<CardColor | ''>('')
  const [type, setType] = useState<CardType | ''>('')
  const [rarity, setRarity] = useState<Rarity | ''>('')
  const [owned, setOwned] = useState<OwnedFilter>('all')
  const [only2k, setOnly2k] = useState(false)
  const [onlyBlocker, setOnlyBlocker] = useState(false)
  const [onlyRemoval, setOnlyRemoval] = useState(false)
  const [minRating, setMinRating] = useState(0)

  // Defer the heavy filter/grid work so typing stays responsive (React 18).
  const deferredQ = useDeferredValue(q)

  const cards = useMemo(() => {
    let list = Object.values(cardIndex)
    if (!settings.showDemoCards) list = list.filter((c) => !c.isDemo)

    return list
      .filter((c) => {
        if (deferredQ) {
          const hay = `${c.name} ${c.id} ${c.traits.join(' ')} ${c.effect}`.toLowerCase()
          if (!hay.includes(deferredQ.toLowerCase())) return false
        }
        if (color && !c.color.includes(color)) return false
        if (type && c.type !== type) return false
        if (rarity && c.rarity !== rarity) return false
        if (owned === 'owned' && !entries[c.id]) return false
        if (owned === 'missing' && entries[c.id]) return false
        if (only2k && !is2kCounter(c)) return false
        if (onlyBlocker && !isBlocker(c)) return false
        if (onlyRemoval && !isRemoval(c)) return false
        if (minRating > 0 && (c.sealedRating ?? 0) < minRating) return false
        return true
      })
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [
    cardIndex,
    entries,
    settings.showDemoCards,
    deferredQ,
    color,
    type,
    rarity,
    owned,
    only2k,
    onlyBlocker,
    onlyRemoval,
    minRating,
  ])

  // Render in pages so a 1000+ card collection doesn't mount all at once.
  const PAGE = 60
  const [visible, setVisible] = useState(PAGE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  // Reset the window whenever the filtered set changes.
  useEffect(() => setVisible(PAGE), [cards])
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible((v) => Math.min(v + PAGE, cards.length))
      },
      { rootMargin: '600px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [cards.length])

  const resetFilters = () => {
    setQ('')
    setColor('')
    setType('')
    setRarity('')
    setOwned('all')
    setOnly2k(false)
    setOnlyBlocker(false)
    setOnlyRemoval(false)
    setMinRating(0)
  }

  return (
    <div className="space-y-4">
      {/* Search + add */}
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search cards"
          placeholder="Search name, set code, trait, effect…"
          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-ink-850 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-mantis-600 focus:outline-none"
        />
        <Link
          to="/add"
          className="shrink-0 rounded-xl bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500"
        >
          + Add
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-ink-850/40 p-3">
        <div className="flex flex-wrap gap-2">
          <Select value={color} onChange={(v) => setColor(v as CardColor | '')} label="Color" options={COLORS} />
          <Select value={type} onChange={(v) => setType(v as CardType | '')} label="Type" options={TYPES} />
          <Select value={rarity} onChange={(v) => setRarity(v as Rarity | '')} label="Rarity" options={RARITIES} />
          <Select
            value={owned}
            onChange={(v) => setOwned(v as OwnedFilter)}
            label="Owned"
            options={['all', 'owned', 'missing']}
            allowEmpty={false}
          />
          <label className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-ink-850 px-2.5 py-1.5 text-xs text-slate-300">
            Min rating
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="bg-transparent text-slate-100 focus:outline-none"
            >
              {[0, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n} className="bg-ink-900">
                  {n === 0 ? 'Any' : `${n}+`}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle active={only2k} onClick={() => setOnly2k((v) => !v)} label="🛡️ 2K counter" />
          <InfoTip termId="2k-counter" />
          <Toggle active={onlyBlocker} onClick={() => setOnlyBlocker((v) => !v)} label="🧱 Blocker" />
          <InfoTip termId="blocker" />
          <Toggle active={onlyRemoval} onClick={() => setOnlyRemoval((v) => !v)} label="💥 Removal" />
          <InfoTip termId="removal" />
          <button
            onClick={resetFilters}
            className="ml-auto rounded-lg px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-400">{cards.length} cards</div>

      {/* Grid */}
      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
          No cards match your filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {cards.slice(0, visible).map((c) => (
              <WalletCard
                key={c.id}
                card={c}
                quantity={entries[c.id]?.quantity ?? 0}
              />
            ))}
          </div>
          {visible < cards.length && (
            <div ref={sentinelRef} className="py-6 text-center text-xs text-slate-400">
              Loading more… ({visible} / {cards.length})
            </div>
          )}
        </>
      )}
    </div>
  )
}

const WalletCard = memo(function WalletCard({
  card,
  quantity,
}: {
  card: Card
  quantity: number
}) {
  const owned = quantity > 0
  return (
    <Link to={`/card/${card.id}`} title={card.name} className="group relative block">
      <div
        className={`relative overflow-hidden rounded-xl transition duration-200 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_12px_32px_-12px_rgba(220,38,38,0.55)] ${
          owned
            ? 'ring-2 ring-straw-400/70'
            : 'ring-1 ring-slate-800 group-hover:ring-mantis-500/70'
        }`}
      >
        {/* Owned cards stay full-colour; not-owned dim until hover — the
            collection visibly "lights up" as you complete it. */}
        <div
          className={`transition duration-300 group-hover:scale-[1.06] ${
            owned ? '' : 'opacity-65 grayscale-[0.3] group-hover:opacity-100 group-hover:grayscale-0'
          }`}
        >
          <CardFace card={card} size="sm" />
        </div>

        {owned && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-straw-500 px-2 py-0.5 text-[0.7rem] font-bold text-ink-950 shadow-md">
            ×{quantity}
          </span>
        )}
        {card.sealedRating != null && (
          <span className="absolute left-1.5 bottom-1.5 opacity-0 transition group-hover:opacity-100">
            <RatingPill rating={card.sealedRating} />
          </span>
        )}
      </div>
    </Link>
  )
})

function Select({
  value,
  onChange,
  label,
  options,
  allowEmpty = true,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  options: string[]
  allowEmpty?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="rounded-lg border border-slate-700 bg-ink-850 px-2.5 py-1.5 text-xs text-slate-200 focus:border-mantis-600 focus:outline-none"
    >
      {allowEmpty && <option value="" className="bg-ink-900">{label}: All</option>}
      {options.map((o) => (
        <option key={o} value={o} className="bg-ink-900">
          {allowEmpty ? o : `${label}: ${o}`}
        </option>
      ))}
    </select>
  )
}

function Toggle({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-mantis-600 text-white'
          : 'border border-slate-700 bg-ink-850 text-slate-300 hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  )
}
