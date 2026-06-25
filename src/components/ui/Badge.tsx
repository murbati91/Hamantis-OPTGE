import type { ReactNode } from 'react'
import type { CardColor } from '../../types'
import { COLOR_HEX } from '../../lib/cards'

export function Badge({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-slate-700/60 px-2 py-0.5 text-xs font-medium text-slate-200 ${className}`}
    >
      {children}
    </span>
  )
}

export function ColorDot({ color }: { color: CardColor }) {
  return (
    <span
      className="inline-block h-3 w-3 rounded-full ring-1 ring-black/30"
      style={{ background: COLOR_HEX[color] }}
      title={color}
    />
  )
}
