import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Card } from '../../types'

/**
 * Rich hover/focus popup for a card during gameplay.
 *
 * Wrap any card chip/button on the board or in hand with this. On mouse-enter (or
 * keyboard focus) it shows a fixed-position panel with the card's full printed
 * text — name, set id, stats and the complete effect — with One Piece keyword
 * tags like [On Play] / [Blocker] / [Once Per Turn] highlighted as chips, exactly
 * like the reference card view.
 *
 * Why a portal: the board and hand live inside `overflow-x-auto` strips, so an
 * absolutely-positioned popup would be clipped. Rendering into <body> with
 * `position: fixed` lets it float above everything. The wrapper only listens for
 * pointer/focus events and never intercepts clicks, so the underlying card button
 * keeps working (attack / attach DON / play from hand).
 */

const COLOR_HEX: Record<string, string> = {
  Red: '#dc2626',
  Green: '#16a34a',
  Blue: '#2563eb',
  Purple: '#7c3aed',
  Black: '#4b5563',
  Yellow: '#eab308',
}

const TYPE_LABEL: Record<string, string> = {
  Leader: 'Leader',
  Character: 'Character',
  Event: 'Event',
  Stage: 'Stage',
  'DON!!': 'DON!!',
}

const POPUP_W = 288 // keep in sync with the w-72 panel below

/** Split effect text so bracketed keywords ([On Play], [Blocker], …) become chips. */
function renderEffect(text: string): ReactNode[] {
  return text
    .split(/(\[[^\]]+\])/g)
    .filter((s) => s.length > 0)
    .map((part, i) =>
      part.startsWith('[') && part.endsWith(']') ? (
        <span
          key={i}
          className="mx-0.5 inline-block rounded bg-mantis-600/30 px-1 py-px font-semibold text-mantis-100"
        >
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    )
}

interface Coords {
  left: number
  /** when `above`, this is the bottom edge to anchor to; else the top edge. */
  y: number
  above: boolean
}

interface Props {
  card?: Card
  children: ReactNode
  className?: string
}

export function CardTooltip({ card, children, className = '' }: Props) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [coords, setCoords] = useState<Coords | null>(null)
  const titleId = useId()

  const place = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const left = Math.min(Math.max(8, r.left + r.width / 2 - POPUP_W / 2), Math.max(8, vw - POPUP_W - 8))
    // Prefer above when the card sits in the lower half of the screen.
    const above = r.top > vh * 0.5
    setCoords({ left, y: above ? r.top - 8 : r.bottom + 8, above })
  }, [])

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const open = useCallback(() => {
    cancelClose()
    if (card) place()
  }, [card, place, cancelClose])

  // Small grace delay so the popup doesn't vanish the instant the pointer leaves —
  // you can move onto the panel to read or copy the text.
  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(() => setCoords(null), 160)
  }, [cancelClose])

  // While open: close on Escape, and on any scroll (the fixed coords would go stale).
  useEffect(() => {
    if (!coords) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCoords(null)
    const onScroll = () => setCoords(null)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [coords])

  // Clean up the pending close timer on unmount.
  useEffect(() => () => cancelClose(), [cancelClose])

  // After the panel mounts, clamp it vertically so a tall effect never spills off
  // the top/bottom edge — flip side if needed.
  useLayoutEffect(() => {
    if (!coords || !panelRef.current) return
    const h = panelRef.current.offsetHeight
    const vh = window.innerHeight
    if (coords.above && coords.y - h < 8 && coords.y < vh / 2) {
      // not enough room above and we're actually near the top — flip below
      setCoords((c) => (c ? { ...c, above: false, y: c.y + 16 } : c))
    }
  }, [coords])

  if (!card) return <span className={className}>{children}</span>

  const colors = card.color ?? []
  const stats: { label: string; value: string }[] = []
  if (card.cost != null) stats.push({ label: 'Cost', value: `◆${card.cost}` })
  if (card.power != null) stats.push({ label: 'Power', value: String(card.power) })
  if (card.counter != null && card.counter > 0) stats.push({ label: 'Counter', value: `+${card.counter}` })
  if (card.life != null) stats.push({ label: 'Life', value: `❤${card.life}` })
  if (card.attribute) stats.push({ label: 'Attr', value: card.attribute })

  return (
    <span
      ref={wrapRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
      onFocus={open}
      onBlur={scheduleClose}
    >
      {children}
      {coords &&
        createPortal(
          <div
            ref={panelRef}
            role="tooltip"
            aria-labelledby={titleId}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="fixed z-[60] w-72 max-w-[calc(100vw-1rem)] rounded-xl border border-mantis-700/50 bg-ink-900/98 p-3 text-left shadow-2xl shadow-black/80 ring-1 ring-black/40 backdrop-blur-sm"
            style={
              coords.above
                ? { left: coords.left, bottom: window.innerHeight - coords.y }
                : { left: coords.left, top: coords.y }
            }
          >
            {/* header: name + set id */}
            <div className="flex items-baseline justify-between gap-2">
              <span id={titleId} className="text-sm font-bold leading-tight text-white">
                {card.name}
              </span>
              <span className="shrink-0 text-[0.6rem] font-medium uppercase tracking-wide text-slate-500">
                {card.id}
              </span>
            </div>

            {/* type · rarity · colors */}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-slate-200">
                {TYPE_LABEL[card.type] ?? card.type}
              </span>
              {card.rarity && (
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[0.6rem] font-semibold text-slate-300">
                  {card.rarity}
                </span>
              )}
              {colors.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.6rem] font-semibold text-white"
                  style={{ background: `${COLOR_HEX[c] ?? '#4b5563'}` }}
                >
                  {c}
                </span>
              ))}
            </div>

            {/* stat row */}
            {stats.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stats.map((s) => (
                  <span
                    key={s.label}
                    className="rounded-md border border-slate-700 bg-ink-850/70 px-1.5 py-0.5 text-[0.65rem] text-slate-200"
                  >
                    <span className="text-slate-500">{s.label} </span>
                    <span className="font-bold text-white">{s.value}</span>
                  </span>
                ))}
              </div>
            )}

            {/* traits */}
            {card.traits?.length > 0 && (
              <div className="mt-1.5 text-[0.62rem] font-medium uppercase tracking-wide text-mantis-300/80">
                {card.traits.join(' · ')}
              </div>
            )}

            {/* full effect text with keyword chips */}
            {card.effect ? (
              <p className="mt-2 rounded-lg border border-slate-800 bg-ink-850/60 p-2 text-[0.72rem] leading-relaxed text-slate-200">
                {renderEffect(card.effect)}
              </p>
            ) : (
              <p className="mt-2 text-[0.7rem] italic text-slate-500">No card text.</p>
            )}

            {/* trigger text, if any */}
            {card.triggerText && (
              <p className="mt-1.5 rounded-lg border border-straw-500/30 bg-straw-500/10 p-2 text-[0.7rem] leading-relaxed text-straw-100">
                <span className="font-semibold text-straw-300">Trigger </span>
                {card.triggerText}
              </p>
            )}
          </div>,
          document.body,
        )}
    </span>
  )
}
