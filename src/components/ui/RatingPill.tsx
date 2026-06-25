import { tierForRating } from '../../data/ratingScale'

export function RatingPill({ rating }: { rating?: number }) {
  const tier = tierForRating(rating)
  if (!tier || rating == null) return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${tier.className}`}
      title={tier.description}
    >
      {rating}/10
    </span>
  )
}
