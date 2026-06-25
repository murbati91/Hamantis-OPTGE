import { useMemo, useState } from 'react'
import {
  GLOSSARY,
  GLOSSARY_CATEGORIES,
  type GlossaryCategory,
} from '../data/glossary'

export function Glossary() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<GlossaryCategory | 'All'>('All')

  const terms = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return GLOSSARY.filter((t) => {
      if (cat !== 'All' && t.category !== cat) return false
      if (!needle) return true
      return (
        t.term.toLowerCase().includes(needle) ||
        t.short.toLowerCase().includes(needle) ||
        (t.long?.toLowerCase().includes(needle) ?? false)
      )
    })
  }, [q, cat])

  const grouped = useMemo(() => {
    const map = new Map<GlossaryCategory, typeof GLOSSARY>()
    for (const t of terms) {
      const list = map.get(t.category) ?? []
      list.push(t)
      map.set(t.category, list)
    }
    return map
  }, [terms])

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Plain-language definitions of the One Piece Card Game terms used across the
        app. New to OP? Start here.
      </p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search terms… (e.g. 2K counter, blocker, mulligan)"
        className="w-full rounded-xl border border-slate-700 bg-ink-850 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-mantis-600 focus:outline-none"
      />

      <div className="flex flex-wrap gap-2">
        {(['All', ...GLOSSARY_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              cat === c
                ? 'bg-mantis-600 text-white'
                : 'border border-slate-700 bg-ink-850 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {terms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
          No terms match “{q}”.
        </div>
      ) : (
        GLOSSARY_CATEGORIES.filter((c) => grouped.has(c)).map((c) => (
          <section key={c}>
            <h2 className="mb-2 mt-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              {c}
            </h2>
            <div className="space-y-2">
              {grouped.get(c)!.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4"
                >
                  <div className="font-semibold text-mantis-100">{t.term}</div>
                  <div className="mt-1 text-sm text-slate-300">{t.short}</div>
                  {t.long && (
                    <div className="mt-2 text-sm text-slate-400">{t.long}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
