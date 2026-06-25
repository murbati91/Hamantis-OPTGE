import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCollection } from '../store/useCollection'
import { InfoTip } from '../components/ui/InfoTip'
import type { Card, CardColor, CardType, Rarity } from '../types'

const COLORS: CardColor[] = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow']
const TYPES: CardType[] = ['Leader', 'Character', 'Event', 'Stage', 'DON!!']
const RARITIES: Rarity[] = ['L', 'C', 'UC', 'R', 'SR', 'SEC', 'P', 'AA', 'MR']

/** Plain-language label for each rarity code so the dropdown isn't cryptic. */
const RARITY_LABELS: Record<Rarity, string> = {
  L: 'L — Leader',
  C: 'C — Common',
  UC: 'UC — Uncommon',
  R: 'R — Rare',
  SR: 'SR — Super Rare',
  SEC: 'SEC — Secret Rare',
  P: 'P — Promo',
  AA: 'AA — Alternate Art',
  MR: 'MR — Manga Rare',
}

export function AddEditCard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cardIndex, upsertCard } = useCollection()
  const existing = id ? cardIndex[id] : undefined

  const [form, setForm] = useState<Card>(
    existing ?? {
      id: '',
      setCode: 'OP16',
      number: '',
      name: '',
      type: 'Character',
      color: ['Red'],
      rarity: 'C',
      cost: null,
      power: null,
      counter: null,
      life: null,
      traits: [],
      effect: '',
    },
  )
  const [traitsText, setTraitsText] = useState(existing?.traits.join(', ') ?? '')
  const [error, setError] = useState('')

  const set = <K extends keyof Card>(key: K, value: Card[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const numOrNull = (v: string): number | null => (v === '' ? null : Number(v))

  const toggleColor = (c: CardColor) =>
    setForm((f) => ({
      ...f,
      color: f.color.includes(c) ? f.color.filter((x) => x !== c) : [...f.color, c],
    }))

  const save = async () => {
    const cardId = form.id.trim() || `${form.setCode}-${form.number}`.trim()
    if (!form.name.trim()) return setError('Name is required.')
    if (!cardId || cardId === '-') return setError('Set code / number (or id) is required.')
    if (form.color.length === 0) return setError('Pick at least one color.')

    const card: Card = {
      ...form,
      id: cardId,
      traits: traitsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      isDemo: false, // user-saved cards are real, even if overriding a demo id
    }
    await upsertCard(card)
    navigate(`/card/${cardId}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-lg font-bold text-mantis-100">
        {existing ? `Edit ${existing.name}` : 'Add a card'}
      </h2>

      {error && (
        <div className="rounded-lg border border-rose-700/60 bg-rose-900/30 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Set code">
          <input
            value={form.setCode}
            onChange={(e) => set('setCode', e.target.value)}
            className={input}
            placeholder="OP16"
          />
        </Field>
        <Field label="Number">
          <input
            value={form.number}
            onChange={(e) => set('number', e.target.value)}
            className={input}
            placeholder="001"
          />
        </Field>
      </div>

      <Field label="Name">
        <input value={form.name} onChange={(e) => set('name', e.target.value)} className={input} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select value={form.type} onChange={(e) => set('type', e.target.value as CardType)} className={input}>
            {TYPES.map((t) => (
              <option key={t} className="bg-ink-900">{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Rarity" term="rarity">
          <select value={form.rarity} onChange={(e) => set('rarity', e.target.value as Rarity)} className={input}>
            {RARITIES.map((r) => (
              <option key={r} value={r} className="bg-ink-900">
                {RARITY_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Colors">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleColor(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                form.color.includes(c)
                  ? 'bg-mantis-600 text-white'
                  : 'border border-slate-700 bg-ink-850 text-slate-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Cost" term="cost">
          <input type="number" value={form.cost ?? ''} onChange={(e) => set('cost', numOrNull(e.target.value))} className={input} />
        </Field>
        <Field label="Power" term="power">
          <input type="number" value={form.power ?? ''} onChange={(e) => set('power', numOrNull(e.target.value))} className={input} />
        </Field>
        <Field label="Counter" term="counter">
          <input type="number" value={form.counter ?? ''} onChange={(e) => set('counter', numOrNull(e.target.value))} className={input} />
        </Field>
        <Field label="Life" term="life">
          <input type="number" value={form.life ?? ''} onChange={(e) => set('life', numOrNull(e.target.value))} className={input} />
        </Field>
      </div>

      <Field label="Traits (comma-separated)" term="trait">
        <input value={traitsText} onChange={(e) => setTraitsText(e.target.value)} className={input} placeholder="Whitebeard Pirates, Captain" />
      </Field>

      <Field label="Effect text">
        <textarea value={form.effect} onChange={(e) => set('effect', e.target.value)} rows={3} className={input} />
      </Field>

      <Field label="Sealed rating (1–10, optional)" term="sealed-rating">
        <input
          type="number"
          step="0.5"
          min="0"
          max="10"
          value={form.sealedRating ?? ''}
          onChange={(e) => set('sealedRating', e.target.value === '' ? undefined : Number(e.target.value))}
          className={input}
        />
      </Field>

      <Field label="Image URL (optional)">
        <input
          value={form.imageUrl ?? ''}
          onChange={(e) => set('imageUrl', e.target.value || undefined)}
          className={input}
          placeholder="https://… or leave blank for placeholder"
        />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-700 bg-ink-850 px-3 py-2 text-sm text-slate-300">
          📁 Upload image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => set('imageUrl', String(reader.result))
              reader.readAsDataURL(file)
            }}
          />
        </label>
        <div className="flex gap-2 sm:ml-auto">
          <button onClick={() => navigate(-1)} className="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 sm:flex-none">
            Cancel
          </button>
          <button onClick={() => void save()} className="flex-1 rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500 sm:flex-none">
            Save card
          </button>
        </div>
      </div>
    </div>
  )
}

const input =
  'w-full rounded-lg border border-slate-700 bg-ink-850 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-mantis-600 focus:outline-none'

function Field({
  label,
  term,
  children,
}: {
  label: string
  /** Optional glossary term id — renders a “?” explainer next to the label. */
  term?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
        {label}
        {term && <InfoTip termId={term} />}
      </span>
      {children}
    </label>
  )
}
