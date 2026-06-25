import { useEffect, useMemo, useState } from 'react'
import type { Card } from '../../types'
import { COLOR_HEX, cardImageCandidates } from '../../lib/cards'

interface Props {
  card: Card
  className?: string
  /** Respect the user's "allow remote images" setting. */
  allowRemote?: boolean
}

/**
 * Renders a card image when available, otherwise a clean generated placeholder
 * (color band + cost + name). Tries clean (un-watermarked) image sources in
 * order, advancing on load error, and falls back to the placeholder if all fail
 * — so the UI never shows a broken image or a "Sample"-stamped one.
 */
export function CardImage({ card, className = '', allowRemote = true }: Props) {
  const [idx, setIdx] = useState(0)
  const candidates = useMemo(() => cardImageCandidates(card), [card.id])
  // Reset the fallback index when the card changes (CardImage is reused across
  // cards in CardDetail without remounting).
  useEffect(() => setIdx(0), [card.id])
  const src = candidates[idx]
  const showImage = allowRemote && !!src

  if (showImage) {
    return (
      <img
        src={src}
        alt={card.name}
        loading="lazy"
        onError={() => setIdx((i) => i + 1)}
        className={`aspect-[5/7] w-full rounded-lg object-cover ${className}`}
      />
    )
  }

  const primary = card.color[0] ?? 'Black'
  const bg = COLOR_HEX[primary]
  const secondary = card.color[1] ? COLOR_HEX[card.color[1]] : bg

  return (
    <div
      className={`relative flex aspect-[5/7] w-full flex-col justify-between overflow-hidden rounded-lg p-2 text-white ${className}`}
      style={{ background: `linear-gradient(140deg, ${bg}, ${secondary})` }}
      role="img"
      aria-label={`${card.name} placeholder`}
    >
      <div className="flex items-center justify-between text-xs font-semibold drop-shadow">
        <span>{card.cost != null ? `◆${card.cost}` : card.type === 'Leader' ? 'L' : ''}</span>
        <span>{card.power != null ? card.power : ''}</span>
      </div>
      <div className="text-center">
        <div className="text-3xl opacity-25">🃏</div>
      </div>
      <div className="space-y-0.5 text-center">
        <div className="line-clamp-2 text-[0.7rem] font-bold leading-tight drop-shadow">
          {card.name}
        </div>
        <div className="text-[0.6rem] opacity-80">{card.id}</div>
      </div>
    </div>
  )
}
