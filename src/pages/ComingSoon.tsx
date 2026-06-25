interface Props {
  title: string
  icon: string
  phase: string
  features: string[]
}

/** Generic placeholder for any not-yet-built page. */
export function ComingSoon({ title, icon, phase, features }: Props) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-6 text-center">
      <div className="text-5xl">{icon}</div>
      <h2 className="text-xl font-bold text-mantis-100">{title}</h2>
      <span className="inline-block rounded-full bg-mantis-800/60 px-3 py-1 text-xs font-medium text-mantis-200">
        {phase}
      </span>
      <p className="text-sm text-slate-400">Planned for this page:</p>
      <ul className="mx-auto inline-block space-y-1 text-left text-sm text-slate-300">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-mantis-400">›</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}
