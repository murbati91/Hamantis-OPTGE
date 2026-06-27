/**
 * Original, watermark-free Play Guide diagrams drawn purely from theme tokens —
 * a stylised playmat and a setup-flow strip. No external/Bandai imagery.
 */

export interface ZoneLabel {
  n: number
  label: string
}

/** Numbered zone box used across the playmat. */
function Zone({
  n,
  label,
  className = '',
  accent = false,
  children,
}: {
  n: number
  label: string
  className?: string
  accent?: boolean
  children?: React.ReactNode
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-lg border bg-ink-950/60 p-2 text-center ${
        accent ? 'border-mantis-500/70' : 'border-slate-700'
      } ${className}`}
    >
      <span
        className={`absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] font-bold text-white ${
          accent ? 'bg-mantis-600' : 'bg-slate-600'
        }`}
      >
        {n}
      </span>
      {children}
      <span className="text-[0.62rem] font-semibold leading-tight text-slate-300">{label}</span>
    </div>
  )
}

/** Stylised single-player half of the playmat, numbered to match the zone list. */
export function PlaymatDiagram({ zones }: { zones: ZoneLabel[] }) {
  const L = (n: number) => zones.find((z) => z.n === n)?.label ?? ''
  return (
    <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-ink-900 to-ink-950 p-3">
      {/* Character Area — five slots */}
      <Zone n={1} label={L(1)} className="mb-2">
        <div className="mb-1 flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-5 rounded-sm border border-slate-700 bg-ink-850" />
          ))}
        </div>
      </Zone>

      {/* Life · Leader · Stage */}
      <div className="mb-2 grid grid-cols-[1fr_1.2fr_1fr] gap-2">
        <Zone n={8} label={L(8)}>
          <div className="relative mb-1 h-8 w-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute h-7 w-6 rounded-sm border border-straw-500/60 bg-ink-850"
                style={{ left: i * 2, top: i * 2 }}
              />
            ))}
          </div>
        </Zone>
        <Zone n={2} label={L(2)} accent>
          <div className="mb-1 h-9 w-7 rounded-sm border-2 border-mantis-500 bg-mantis-900/40" />
        </Zone>
        <Zone n={3} label={L(3)}>
          <div className="mb-1 h-8 w-6 rounded-sm border border-slate-600 bg-ink-850" />
        </Zone>
      </div>

      {/* Cost area — DON pips */}
      <Zone n={6} label={L(6)} className="mb-2">
        <div className="mb-1 flex flex-wrap justify-center gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-3 w-3 rounded-full border border-op-blue/70 bg-op-blue/30" />
          ))}
        </div>
      </Zone>

      {/* Deck · Trash · DON deck */}
      <div className="grid grid-cols-3 gap-2">
        <Zone n={4} label={L(4)}>
          <div className="mb-1 h-8 w-6 rounded-sm border border-slate-600 bg-slate-800" />
        </Zone>
        <Zone n={5} label={L(5)}>
          <div className="mb-1 h-8 w-6 rounded-sm border border-dashed border-slate-600 bg-ink-850" />
        </Zone>
        <Zone n={7} label={L(7)}>
          <div className="mb-1 h-8 w-6 rounded-sm border border-op-blue/60 bg-op-blue/20" />
        </Zone>
      </div>
    </div>
  )
}

export interface FlowStep {
  icon: string
  label: string
}

/** Horizontal numbered setup-flow strip. */
export function SetupFlow({ steps }: { steps: FlowStep[] }) {
  return (
    <ol className="flex items-stretch gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-ink-900/60 p-3">
      {steps.map((s, i) => (
        <li key={i} className="flex flex-1 items-center gap-1">
          <div className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 rounded-lg bg-ink-850 px-2 py-3 text-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mantis-600 text-xs font-bold text-white">
              {i + 1}
            </span>
            <span className="text-xl leading-none" aria-hidden="true">{s.icon}</span>
            <span className="text-[0.62rem] font-semibold leading-tight text-slate-300">
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <span className="shrink-0 text-slate-600" aria-hidden="true">→</span>
          )}
        </li>
      ))}
    </ol>
  )
}
