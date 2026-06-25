// Sealed card rating scale — verbatim from the Praying Mantis OP16 handbook.

export interface RatingTier {
  min: number
  max: number
  label: string
  description: string
  /** Tailwind classes for the rating pill. */
  className: string
}

export const RATING_TIERS: RatingTier[] = [
  {
    min: 10,
    max: 10,
    label: 'Bomb / Removal',
    description: '10/10 — auto-include bomb or premium removal.',
    className: 'bg-emerald-500 text-emerald-950',
  },
  {
    min: 9,
    max: 9.9,
    label: 'Blocker / 2K Counter',
    description: '9/10 — blocker or playable 2K counter. Near auto-include.',
    className: 'bg-mantis-400 text-emerald-950',
  },
  {
    min: 8,
    max: 8.9,
    label: 'Efficient Threat / Value',
    description: '8/10 — efficient threat or strong value card.',
    className: 'bg-lime-400 text-lime-950',
  },
  {
    min: 6,
    max: 7.9,
    label: 'Conditional',
    description: '6–7/10 — conditional card. Plays if the pool supports it.',
    className: 'bg-amber-400 text-amber-950',
  },
  {
    min: 1,
    max: 5.9,
    label: 'Cut / Filler',
    description: '1–5/10 — cut or filler. Last cards into a 40-card deck.',
    className: 'bg-rose-500 text-rose-950',
  },
]

export function tierForRating(rating: number | undefined): RatingTier | null {
  if (rating == null) return null
  return RATING_TIERS.find((t) => rating >= t.min && rating <= t.max) ?? null
}
