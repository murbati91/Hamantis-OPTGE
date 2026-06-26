import type { Card } from '../../types'

/**
 * Clean, watermark-FREE card face rendered purely from card data.
 *
 * The simulator must never show real card art because every available scan
 * (Limitless + Bandai) is stamped "SAMPLE". So instead of an <img>, this paints
 * a tasteful OP-style mini card from the card's stats: power, cost (◆), name,
 * type, life (❤ for Leaders) and small badges for counter (+N) and Blocker (🛡).
 *
 * It scales from ~14px-wide board chips up to the larger head-to-head clash
 * cards via the `size` prop; the parent controls the actual width via className.
 */

/** Local color-identity → hex map (we can't import from lib/cards.ts). */
const COLOR_HEX: Record<string, string> = {
  Red: '#dc2626',
  Green: '#16a34a',
  Blue: '#2563eb',
  Purple: '#7c3aed',
  Black: '#374151',
  Yellow: '#eab308',
}

export type CardFaceSize = 'xs' | 'sm' | 'md' | 'lg'

interface SizeTokens {
  pad: string
  power: string
  badge: string
  name: string
  meta: string
  emblem: string
}

const SIZES: Record<CardFaceSize, SizeTokens> = {
  xs: { pad: 'p-1', power: 'text-sm', badge: 'text-[0.5rem] px-1', name: 'text-[0.5rem]', meta: 'text-[0.5rem] px-1', emblem: 'text-2xl' },
  sm: { pad: 'p-1.5', power: 'text-base', badge: 'text-[0.55rem] px-1', name: 'text-[0.6rem]', meta: 'text-[0.55rem] px-1', emblem: 'text-3xl' },
  md: { pad: 'p-2', power: 'text-2xl', badge: 'text-[0.65rem] px-1.5', name: 'text-xs', meta: 'text-[0.65rem] px-1.5', emblem: 'text-5xl' },
  lg: { pad: 'p-3', power: 'text-4xl', badge: 'text-sm px-2', name: 'text-sm', meta: 'text-xs px-2', emblem: 'text-7xl' },
}

interface CardFaceProps {
  /** Resolved card; supplies defaults for every field below. */
  card?: Card
  /** Explicit overrides (win over `card`). `power` is handy for live/boosted power. */
  name?: string
  type?: string
  color?: string
  cost?: number | null
  power?: number | null
  counter?: number | null
  life?: number | null
  isBlocker?: boolean
  size?: CardFaceSize
  className?: string
}

function deriveBlocker(c?: Card): boolean {
  if (!c) return false
  if (c.isBlocker === true) return true
  return /\[?blocker\]?/i.test(c.effect ?? '')
}

export function CardFace(props: CardFaceProps) {
  const c = props.card
  const name = props.name ?? c?.name ?? '—'
  const type = props.type ?? c?.type ?? 'Character'
  const colorName = props.color ?? c?.color?.[0] ?? 'Black'
  const secondName = c?.color?.[1] ?? colorName
  const cost = props.cost !== undefined ? props.cost : c?.cost ?? null
  const power = props.power !== undefined ? props.power : c?.power ?? null
  const counter = props.counter !== undefined ? props.counter : c?.counter ?? null
  const life = props.life !== undefined ? props.life : c?.life ?? null
  const isBlocker = props.isBlocker ?? deriveBlocker(c)
  const isLeader = type === 'Leader'
  const size = props.size ?? 'sm'
  const sz = SIZES[size]

  const base = COLOR_HEX[colorName] ?? COLOR_HEX.Black
  const base2 = COLOR_HEX[secondName] ?? base

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'OP'

  return (
    <div
      className={`relative flex aspect-[5/7] w-full flex-col overflow-hidden rounded-lg border ${sz.pad} ${props.className ?? ''}`}
      style={{ borderColor: base, background: 'linear-gradient(160deg, #1c2230 0%, #11151f 60%, #0c0f17 100%)' }}
      role="img"
      aria-label={`${name}${isLeader ? ' Leader' : ''} card`}
    >
      {/* color-identity glow in the top corner */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: `radial-gradient(130% 80% at 0% 0%, ${base}, transparent 62%)` }}
      />
      {/* faint twin-color rail down the spine */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
        style={{ background: `linear-gradient(${base}, ${base2})` }}
      />

      {/* top row — power (big) + cost / life badge */}
      <div className="relative z-10 flex items-start justify-between gap-1">
        <span className={`font-black leading-none text-white drop-shadow ${sz.power}`}>
          {power != null ? power : ''}
        </span>
        <span
          className={`shrink-0 rounded font-bold text-white shadow-sm ${sz.badge}`}
          style={{ background: base }}
        >
          {isLeader ? (life != null ? `❤${life}` : 'L') : cost != null ? `◆${cost}` : ''}
        </span>
      </div>

      {/* center monogram watermark */}
      <div className="relative z-0 flex flex-1 items-center justify-center overflow-hidden">
        <span className={`select-none font-black tracking-tighter text-white/10 ${sz.emblem}`}>{initials}</span>
      </div>

      {/* bottom — name + type + badges */}
      <div className="relative z-10 space-y-0.5">
        <div className={`line-clamp-2 font-bold leading-tight text-white drop-shadow ${sz.name}`}>{name}</div>
        <div className="flex flex-wrap items-center gap-1">
          <span
            className={`rounded-sm font-semibold uppercase tracking-wide text-white/70 ${sz.meta}`}
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            {isLeader ? 'Leader' : 'Char'}
          </span>
          {counter ? (
            <span className={`rounded-sm bg-straw-500/20 font-bold text-straw-200 ${sz.meta}`} title="Counter value">
              +{counter}
            </span>
          ) : null}
          {isBlocker ? (
            <span className={`rounded-sm bg-mantis-600/40 font-bold text-mantis-50 ${sz.meta}`} title="Blocker">
              🛡
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
