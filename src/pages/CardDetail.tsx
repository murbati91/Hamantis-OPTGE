import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCollection } from '../store/useCollection'
import { CardFace } from '../components/ui/CardFace'
import { RatingPill } from '../components/ui/RatingPill'
import { Badge, ColorDot } from '../components/ui/Badge'
import { tierForRating } from '../data/ratingScale'
import { is2kCounter, isBlocker, isRemoval } from '../lib/cards'
import { InfoTip } from '../components/ui/InfoTip'
import type { CardCondition, CardLanguage, Rarity } from '../types'

/** Rarity code → full name + glossary id, so the bare letter isn't cryptic. */
const RARITY_INFO: Record<Rarity, { name: string; term: string }> = {
  L: { name: 'Leader', term: 'rarity-l' },
  C: { name: 'Common', term: 'rarity-c' },
  UC: { name: 'Uncommon', term: 'rarity-uc' },
  R: { name: 'Rare', term: 'rarity-r' },
  SR: { name: 'Super Rare', term: 'rarity-sr' },
  SEC: { name: 'Secret Rare', term: 'rarity-sec' },
  P: { name: 'Promo', term: 'rarity-p' },
  AA: { name: 'Alternate Art', term: 'rarity-aa' },
  MR: { name: 'Manga Rare', term: 'rarity-mr' },
}

export function CardDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { cardIndex, entries, upsertEntry, removeEntry } = useCollection()
  const card = cardIndex[id]

  if (!card) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
        Card not found.{' '}
        <Link to="/wallet" className="text-mantis-400 hover:underline">
          Back to wallet
        </Link>
      </div>
    )
  }

  const entry = entries[id]
  const qty = entry?.quantity ?? 0
  const tier = tierForRating(card.sealedRating)

  const setQty = async (n: number) => {
    const next = Math.max(0, n)
    if (next === 0) {
      await removeEntry(id)
      return
    }
    const now = Date.now()
    await upsertEntry({
      cardId: id,
      quantity: next,
      condition: entry?.condition ?? 'NM',
      language: entry?.language ?? 'EN',
      note: entry?.note,
      imageUrl: entry?.imageUrl,
      addedAt: entry?.addedAt ?? now,
      updatedAt: now,
    })
  }

  const patchEntry = async (patch: Partial<{ condition: CardCondition; language: CardLanguage }>) => {
    const now = Date.now()
    await upsertEntry({
      cardId: id,
      quantity: Math.max(1, qty),
      condition: entry?.condition ?? 'NM',
      language: entry?.language ?? 'EN',
      note: entry?.note,
      imageUrl: entry?.imageUrl,
      addedAt: entry?.addedAt ?? now,
      updatedAt: now,
      ...patch,
    })
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-slate-200">
        ← Back
      </button>

      <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
        <div
          className={`mx-auto w-44 overflow-hidden rounded-xl shadow-[0_14px_40px_-14px_rgba(220,38,38,0.55)] sm:w-full ${
            qty > 0 ? 'ring-2 ring-straw-400/70' : 'ring-1 ring-slate-800'
          }`}
        >
          <CardFace card={card} size="lg" />
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-mantis-100">{card.name}</h2>
              <RatingPill rating={card.sealedRating} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-1 text-sm text-slate-500">
              <span>{card.id} · {card.type} · </span>
              <span className="inline-flex items-center gap-1">
                {card.rarity} — {RARITY_INFO[card.rarity].name}
                <InfoTip termId={RARITY_INFO[card.rarity].term} />
              </span>
              {card.isDemo && <span className="ml-1 text-amber-400">(reference card)</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {card.color.map((c) => (
              <Badge key={c}>
                <ColorDot color={c} /> {c}
              </Badge>
            ))}
            {is2kCounter(card) && <Badge className="text-mantis-200">🛡️ 2K counter</Badge>}
            {isBlocker(card) && <Badge>🧱 Blocker</Badge>}
            {isRemoval(card) && <Badge>💥 Removal</Badge>}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            <Stat label="Cost" value={card.cost ?? '—'} termId="cost" />
            <Stat label="Power" value={card.power ?? '—'} termId="power" />
            <Stat label="Counter" value={card.counter ?? '—'} termId="counter" />
            <Stat label="Life" value={card.life ?? '—'} termId="life" />
            <Stat label="Attr" value={card.attribute ?? '—'} termId="attribute" />
          </div>

          {card.traits.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {card.traits.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          )}

          {card.effect && (
            <p className="rounded-xl border border-slate-800 bg-ink-850/50 p-3 text-sm text-slate-300">
              {card.effect}
            </p>
          )}
        </div>
      </div>

      {/* Sealed guidance */}
      {(card.sealedRole || card.whatIf || tier) && (
        <section className="rounded-2xl border border-mantis-800/40 bg-mantis-900/20 p-4">
          <h3 className="flex items-center gap-1 text-sm font-semibold text-mantis-200">
            Sealed guidance
            <InfoTip termId="sealed-rating" />
          </h3>
          {tier && <p className="mt-1 text-sm text-slate-300">{tier.description}</p>}
          {card.sealedRole && (
            <p className="mt-2 text-sm text-slate-300">
              <span className="text-slate-500">Role: </span>
              {card.sealedRole}
            </p>
          )}
          {card.whatIf && (
            <p className="mt-2 text-sm text-slate-300">
              <span className="text-slate-500">What if: </span>
              {card.whatIf}
            </p>
          )}
        </section>
      )}

      {/* Ownership controls */}
      <section className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
        <h3 className="text-sm font-semibold text-slate-200">Your copy</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => void setQty(qty - 1)}
              className="h-9 w-9 rounded-lg border border-slate-700 text-lg text-slate-200 hover:bg-slate-800"
            >
              −
            </button>
            <span className="w-10 text-center text-lg font-bold text-mantis-100">{qty}</span>
            <button
              onClick={() => void setQty(qty + 1)}
              className="h-9 w-9 rounded-lg bg-mantis-600 text-lg text-white hover:bg-mantis-500"
            >
              +
            </button>
          </div>

          <label className="text-xs text-slate-400">
            Condition
            <select
              value={entry?.condition ?? 'NM'}
              onChange={(e) => void patchEntry({ condition: e.target.value as CardCondition })}
              disabled={qty === 0}
              className="ml-2 min-h-[40px] rounded-lg border border-slate-700 bg-ink-850 px-2 py-2 text-slate-100 disabled:opacity-40"
            >
              {(['NM', 'LP', 'MP', 'HP', 'DMG', 'Sealed'] as CardCondition[]).map((c) => (
                <option key={c} className="bg-ink-900">
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-slate-400">
            Language
            <select
              value={entry?.language ?? 'EN'}
              onChange={(e) => void patchEntry({ language: e.target.value as CardLanguage })}
              disabled={qty === 0}
              className="ml-2 min-h-[40px] rounded-lg border border-slate-700 bg-ink-850 px-2 py-2 text-slate-100 disabled:opacity-40"
            >
              {(['EN', 'JP', 'CN', 'KR', 'Other'] as CardLanguage[]).map((l) => (
                <option key={l} className="bg-ink-900">
                  {l}
                </option>
              ))}
            </select>
          </label>

          <Link
            to={`/edit/${card.id}`}
            className="rounded-lg border border-slate-600 px-3 py-2 text-center text-sm text-slate-200 hover:bg-slate-800 sm:ml-auto"
          >
            Edit card
          </Link>
        </div>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  termId,
}: {
  label: string
  value: string | number
  termId?: string
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-ink-900/60 p-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[0.65rem] uppercase text-slate-500">
        {label}
        {termId && <InfoTip termId={termId} />}
      </div>
      <div className="text-sm font-semibold text-slate-100">{value}</div>
    </div>
  )
}
