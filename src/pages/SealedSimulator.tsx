import { useMemo, useState } from 'react'
import {
  recommendCounters,
  type BuildStyle,
  type CounterInputs,
} from '../features/sealed/counterEngine'
import {
  COUNTER_SCENARIOS,
  COUNTER_GOLDEN_RULE,
  DECK_COMPOSITION_TARGETS,
} from '../data/counterScenarios'
import { RATING_TIERS } from '../data/ratingScale'
import { useProgress } from '../store/useProgress'
import { InfoTip } from '../components/ui/InfoTip'

export function SealedSimulator() {
  const { addXp, awardBadge } = useProgress()
  const [input, setInput] = useState<CounterInputs>({
    opened2k: 15,
    strongRemoval: 3,
    finishers: 4,
    goodBodies: true,
    buildStyle: 'midrange',
  })
  const [awarded, setAwarded] = useState(false)

  const rec = useMemo(() => recommendCounters(input), [input])

  const set = <K extends keyof CounterInputs>(k: K, v: CounterInputs[K]) =>
    setInput((s) => ({ ...s, [k]: v }))

  const runRecommendation = () => {
    if (!awarded) {
      addXp(15)
      awardBadge('2k-master')
      setAwarded(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* What-If engine */}
      <section className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
        <h2 className="text-base font-bold text-mantis-100">2K Counter "What If" Simulator</h2>
        <p className="mt-1 text-sm text-slate-400">
          Enter your sealed pool details — get a recommended 2K-counter count.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NumberField
            label="2K counters opened"
            termId="2k-counter"
            value={input.opened2k}
            onChange={(v) => set('opened2k', v)}
            min={0}
            max={30}
          />
          <NumberField
            label="Strong removal in pool"
            termId="removal"
            value={input.strongRemoval}
            onChange={(v) => set('strongRemoval', v)}
            min={0}
            max={20}
          />
          <NumberField
            label="Finishers / top-end"
            termId="finisher"
            value={input.finishers}
            onChange={(v) => set('finishers', v)}
            min={0}
            max={20}
          />
          <div>
            <span className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-400">
              Build style <InfoTip termId="midrange" label="Build style" text="Aggro = fast/attack-first (fewer counters, 8–10). Midrange = balanced (10–12). Control = win-late/defensive (11–13)." />
            </span>
            <div className="flex gap-2">
              {(['aggro', 'midrange', 'control'] as BuildStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => set('buildStyle', s)}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium capitalize ${
                    input.buildStyle === s
                      ? 'bg-mantis-600 text-white'
                      : 'border border-slate-700 bg-ink-850 text-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={input.goodBodies}
            onChange={(e) => set('goodBodies', e.target.checked)}
            className="h-4 w-4 accent-mantis-500"
          />
          Good 2K bodies / effects (not defense-only)
          <InfoTip label="Good 2K bodies" text="A 2K counter that is ALSO a useful character to play (a real body/effect), not a card that only ever defends. Good bodies let you run a few more counters." />
        </label>

        {/* Result */}
        <div className="mt-4 rounded-xl border border-mantis-700/50 bg-mantis-900/30 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-mantis-300">Recommended 2K counters</span>
            <span className="text-3xl font-bold text-mantis-100">{rec.recommended}</span>
          </div>
          <div className="mt-1 text-sm text-slate-400">
            Target range {rec.range[0]}–{rec.range[1]}
            {rec.toCut > 0 && (
              <span className="ml-2 text-amber-300">· cut {rec.toCut} from your pool</span>
            )}
          </div>
          <ul className="mt-3 space-y-1.5">
            {rec.reasons.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="text-mantis-400">›</span>
                {r}
              </li>
            ))}
          </ul>
          <button
            onClick={runRecommendation}
            className="mt-4 rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500"
          >
            {awarded ? '✓ +15 XP earned' : 'Lock in plan (+15 XP)'}
          </button>
        </div>

        <p className="mt-3 rounded-lg border-l-4 border-amber-500 bg-amber-900/20 p-3 text-sm text-amber-200">
          ⚠️ {COUNTER_GOLDEN_RULE}
        </p>
      </section>

      {/* Scenario reference */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Handbook scenario table
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-mantis-900/60 text-mantis-100">
              <tr>
                <th className="p-2 text-left">Scenario</th>
                <th className="p-2 text-left">Run</th>
                <th className="hidden p-2 text-left sm:table-cell">Adjustment</th>
              </tr>
            </thead>
            <tbody>
              {COUNTER_SCENARIOS.map((s) => (
                <tr key={s.id} className="border-t border-slate-800 odd:bg-ink-900/40">
                  <td className="p-2 font-medium text-slate-200">{s.scenario}</td>
                  <td className="p-2 text-mantis-300">
                    {s.range[0]}–{s.range[1]}
                  </td>
                  <td className="hidden p-2 text-slate-400 sm:table-cell">{s.adjustment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Composition targets */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          40-card deck composition targets
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DECK_COMPOSITION_TARGETS.map((t) => (
            <div key={t.label} className="rounded-xl border border-slate-800 bg-ink-850/50 p-3">
              <div className="text-lg font-bold text-mantis-100">
                {t.min}–{t.max}
              </div>
              <div className="text-sm font-medium text-slate-200">{t.label}</div>
              <div className="mt-0.5 text-xs text-slate-500">{t.hint}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Rating scale legend */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Sealed rating scale
        </h2>
        <div className="space-y-2">
          {RATING_TIERS.map((t) => (
            <div key={t.label} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-ink-850/50 p-3">
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${t.className}`}>
                {t.min === t.max ? `${t.min}` : `${t.min}–${t.max}`}
              </span>
              <div>
                <div className="text-sm font-medium text-slate-200">{t.label}</div>
                <div className="text-xs text-slate-500">{t.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  termId,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  termId?: string
}) {
  return (
    <div>
      <span className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-400">
        {label}
        {termId && <InfoTip termId={termId} />}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-9 w-9 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
          className="w-16 rounded-lg border border-slate-700 bg-ink-850 px-2 py-2 text-center text-slate-100 focus:border-mantis-600 focus:outline-none"
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-9 w-9 rounded-lg bg-mantis-600 text-white hover:bg-mantis-500"
        >
          +
        </button>
      </div>
    </div>
  )
}
