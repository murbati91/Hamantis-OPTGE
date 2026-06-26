import type { Card } from '../../types'

/**
 * Clean, watermark-FREE card face rendered purely from card data.
 *
 * Every available card scan (Limitless + Bandai) is stamped "SAMPLE", so instead
 * of an <img> we paint a proper card from its stats: a color-themed frame, a
 * header (power + cost/life + rarity), a styled "art" panel with a type /
 * attribute glyph so it never reads as blank, a bold name banner, and
 * type/traits/counter/blocker (plus an effect snippet at large sizes).
 *
 * Scales from tiny board chips (`xs`) to the full card-detail view (`lg`); the
 * parent controls actual width via className.
 */

const COLOR_HEX: Record<string, string> = {
  Red: '#dc2626',
  Green: '#16a34a',
  Blue: '#2563eb',
  Purple: '#7c3aed',
  Black: '#374151',
  Yellow: '#eab308',
}

const TYPE_GLYPH: Record<string, string> = {
  Leader: '👑',
  Character: '⚔️',
  Event: '💥',
  Stage: '🏝️',
  'DON!!': '🔵',
}

const ATTR_GLYPH: Record<string, string> = {
  Slash: '🗡️',
  Strike: '👊',
  Ranged: '🏹',
  Special: '🌀',
  Wisdom: '📖',
}

export type CardFaceSize = 'xs' | 'sm' | 'md' | 'lg'

interface SizeTokens {
  pad: string
  power: string
  badge: string
  name: string
  meta: string
  glyph: string
  emblem: string
  traits: boolean
  effect: boolean
}

const SIZES: Record<CardFaceSize, SizeTokens> = {
  xs: { pad: 'p-1', power: 'text-xs', badge: 'text-[0.5rem] px-1', name: 'text-[0.5rem]', meta: 'text-[0.5rem]', glyph: 'text-lg', emblem: 'text-2xl', traits: false, effect: false },
  sm: { pad: 'p-1.5', power: 'text-lg', badge: 'text-[0.55rem] px-1', name: 'text-[0.62rem]', meta: 'text-[0.5rem] px-1', glyph: 'text-3xl', emblem: 'text-4xl', traits: false, effect: false },
  md: { pad: 'p-2', power: 'text-2xl', badge: 'text-[0.65rem] px-1.5', name: 'text-sm', meta: 'text-[0.6rem] px-1.5', glyph: 'text-5xl', emblem: 'text-6xl', traits: true, effect: false },
  lg: { pad: 'p-3', power: 'text-4xl', badge: 'text-sm px-2', name: 'text-lg', meta: 'text-xs px-2', glyph: 'text-7xl', emblem: 'text-8xl', traits: true, effect: true },
}

interface CardFaceProps {
  card?: Card
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
  return /\[blocker\]/i.test(c.effect ?? '')
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
  const attribute = c?.attribute
  const rarity = c?.rarity
  const traits = c?.traits ?? []
  const size = props.size ?? 'sm'
  const sz = SIZES[size]

  const base = COLOR_HEX[colorName] ?? COLOR_HEX.Black
  const base2 = COLOR_HEX[secondName] ?? base
  const glyph = (attribute && ATTR_GLYPH[attribute]) || TYPE_GLYPH[type] || '⚔️'

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
      className={`relative flex aspect-[5/7] w-full flex-col overflow-hidden rounded-lg border-2 ${props.className ?? ''}`}
      style={{ borderColor: base, background: '#0c0f17' }}
      role="img"
      aria-label={`${name}${isLeader ? ' Leader' : ''} card`}
    >
      {/* header bar — power + cost/life, tinted by color identity */}
      <div
        className={`relative z-10 flex items-center justify-between ${sz.pad}`}
        style={{ background: `linear-gradient(90deg, ${base}, ${base2})` }}
      >
        <span className={`font-black leading-none text-white drop-shadow ${sz.power}`}>
          {power != null ? power : ''}
        </span>
        <span className={`shrink-0 rounded bg-black/30 font-bold text-white ${sz.badge}`}>
          {isLeader ? (life != null ? `❤${life}` : 'L') : cost != null ? `◆${cost}` : ''}
        </span>
      </div>

      {/* "art" panel — themed gradient + big glyph over faint initials */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        style={{ background: `radial-gradient(120% 90% at 50% 0%, ${base}33, transparent 70%), #11151f` }}
      >
        <span className={`pointer-events-none absolute select-none font-black tracking-tighter text-white/5 ${sz.emblem}`}>
          {initials}
        </span>
        <span className={`relative drop-shadow ${sz.glyph}`} aria-hidden="true">{glyph}</span>
        {rarity && size !== 'xs' && (
          <span
            className={`absolute right-1 top-1 rounded font-bold text-white/90 ${sz.meta}`}
            style={{ background: 'rgba(0,0,0,0.45)' }}
          >
            {rarity}
          </span>
        )}
      </div>

      {/* name banner */}
      <div className="relative z-10 px-1 py-0.5" style={{ background: `${base}22` }}>
        <div className={`line-clamp-2 text-center font-bold leading-tight text-white drop-shadow ${sz.name}`}>
          {name}
        </div>
      </div>

      {/* footer — type / attribute, traits, counter / blocker */}
      <div className={`relative z-10 space-y-0.5 ${sz.pad} pt-1`}>
        <div className="flex flex-wrap items-center justify-center gap-1">
          <span className={`rounded-sm font-semibold uppercase tracking-wide text-white/70 ${sz.meta}`} style={{ background: 'rgba(255,255,255,0.08)' }}>
            {isLeader ? 'Leader' : type === 'Character' ? 'Char' : type}
          </span>
          {attribute && size !== 'xs' && (
            <span className={`rounded-sm font-medium text-white/60 ${sz.meta}`} style={{ background: 'rgba(255,255,255,0.06)' }}>
              {attribute}
            </span>
          )}
          {counter ? (
            <span className={`rounded-sm bg-straw-500/25 font-bold text-straw-200 ${sz.meta}`} title="Counter value">
              +{counter}
            </span>
          ) : null}
          {isBlocker ? (
            <span className={`rounded-sm bg-mantis-600/40 font-bold text-mantis-50 ${sz.meta}`} title="Blocker">
              🛡
            </span>
          ) : null}
        </div>
        {sz.traits && traits.length > 0 && (
          <div className={`line-clamp-1 text-center text-white/45 ${sz.meta}`}>{traits.join(' · ')}</div>
        )}
        {sz.effect && c?.effect && (
          <p className="mt-1 line-clamp-4 text-[0.7rem] leading-snug text-white/70">{c.effect}</p>
        )}
      </div>
    </div>
  )
}
