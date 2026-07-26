import type { TargetStatus } from '../../types'

interface Props {
  targets: TargetStatus[]
  notes: string[]
  curve: Record<number, number>
  size: number
  targetSize: number
}

const STATUS: Record<
  TargetStatus['status'],
  { icon: string; label: string; bar: string; text: string; border: string; bg: string }
> = {
  ok: { icon: '✓', label: 'On target', bar: 'bg-mantis-500', text: 'text-mantis-200', border: 'border-mantis-700/50', bg: 'bg-mantis-900/20' },
  low: { icon: '▲', label: 'Too few', bar: 'bg-amber-400', text: 'text-amber-200', border: 'border-amber-700/50', bg: 'bg-amber-900/20' },
  high: { icon: '▼', label: 'Too many', bar: 'bg-rose-400', text: 'text-rose-200', border: 'border-rose-700/50', bg: 'bg-rose-900/20' },
}

/**
 * Shared "how good is this deck" readout — used by both the sealed DeckBuilder
 * (40-card target) and the AI Deck Builder (50-card target). Shows overall
 * fill progress, a per-role breakdown with a min/max band + the reason each
 * role matters (from CompositionTarget.hint), and the mana curve.
 */
export function DeckAnalysisPanel({ targets, notes, curve, size, targetSize }: Props) {
  const complete = size === targetSize
  const over = size > targetSize
  const pct = Math.min(100, Math.round((size / targetSize) * 100))

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Deck size</h3>
          <span className={`text-lg font-bold ${complete ? 'text-mantis-300' : 'text-amber-300'}`}>
            {size}/{targetSize}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full ${complete ? 'bg-mantis-500' : 'bg-amber-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {complete
            ? 'Complete — ready to save.'
            : over
              ? `${size - targetSize} over — trim before saving.`
              : `${targetSize - size} more card${targetSize - size === 1 ? '' : 's'} needed.`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-[0.65rem] text-slate-500">
        {(['ok', 'low', 'high'] as const).map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className={STATUS[s].text} aria-hidden="true">
              {STATUS[s].icon}
            </span>
            {STATUS[s].label}
          </span>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {targets.map((t) => {
          const st = STATUS[t.status]
          const span = Math.max(1, t.max)
          const countPct = Math.min(100, Math.round((t.count / span) * 100))
          const minPct = Math.min(100, Math.round((t.min / span) * 100))
          return (
            <div key={t.label} className={`rounded-lg border px-2.5 py-2 ${st.border} ${st.bg}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`flex items-center gap-1 text-xs font-semibold ${st.text}`}>
                  <span aria-hidden="true">{st.icon}</span>
                  {t.label}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {t.count} <span className="font-normal text-slate-500">/ {t.min}–{t.max}</span>
                </span>
              </div>
              <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="absolute inset-y-0 right-0 bg-white/10" style={{ left: `${minPct}%` }} />
                <div className={`absolute inset-y-0 left-0 rounded-full ${st.bar}`} style={{ width: `${countPct}%` }} />
              </div>
              <p className="mt-1 text-[0.65rem] leading-snug text-slate-500">{t.hint}</p>
            </div>
          )
        })}
      </div>

      {notes.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-amber-800/40 bg-amber-900/10 p-2.5 text-xs text-amber-200">
          {notes.map((n, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden="true">⚠</span>
              {n}
            </li>
          ))}
        </ul>
      )}

      <ManaCurve curve={curve} />
    </div>
  )
}

function ManaCurve({ curve }: { curve: Record<number, number> }) {
  const costs = Array.from({ length: 11 }, (_, i) => i) // 0..10
  const max = Math.max(1, ...costs.map((c) => curve[c] ?? 0))
  const hasAny = costs.some((c) => (curve[c] ?? 0) > 0)
  if (!hasAny) return null
  const total = costs.reduce((n, c) => n + (curve[c] ?? 0), 0)
  const avgCost = total > 0 ? costs.reduce((s, c) => s + c * (curve[c] ?? 0), 0) / total : 0

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <div className="text-xs font-medium text-slate-400">Mana curve</div>
        <div className="text-[0.65rem] text-slate-500">avg cost {avgCost.toFixed(1)}</div>
      </div>
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
