import type { Venue } from '../../data/venues'

export function VenueCard({ venue }: { venue: Venue }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-ink-850/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-mantis-100">{venue.name}</div>
          <div className="truncate text-xs text-slate-500">{venue.area}</div>
        </div>
        <a
          href={venue.mapUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-mantis-600 hover:text-mantis-200"
        >
          Open in Maps
        </a>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{venue.description}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {venue.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-ink-950 px-2 py-0.5 text-[0.65rem] font-medium text-slate-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
