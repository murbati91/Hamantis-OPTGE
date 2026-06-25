import { useEffect, useRef, useState } from 'react'
import { GLOSSARY_MAP } from '../../data/glossary'

interface Props {
  /** Glossary term id to explain (e.g. "2k-counter"). */
  termId?: string
  /** Or pass explicit text instead of a glossary id. */
  label?: string
  text?: string
  className?: string
}

/**
 * A small "?" info button. Tap (mobile) or click to toggle a popover with a
 * plain-language definition — pulled from the glossary when `termId` is given.
 * Closes on outside click / Escape.
 */
export function InfoTip({ termId, label, text, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center')
  const ref = useRef<HTMLSpanElement>(null)

  const term = termId ? GLOSSARY_MAP[termId] : undefined
  const title = label ?? term?.term ?? 'Info'
  const body = text ?? term?.short ?? ''

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!body) return null

  return (
    <span ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={`What is ${title}?`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          // Pick a side so the popover never runs off the screen edge.
          const rect = ref.current?.getBoundingClientRect()
          if (rect) {
            const vw = window.innerWidth
            setAlign(rect.left > vw * 0.6 ? 'right' : rect.left < vw * 0.4 ? 'left' : 'center')
          }
          setOpen((v) => !v)
        }}
        className="relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[0.6rem] font-bold leading-none text-slate-400 before:absolute before:-inset-3 before:content-[''] hover:border-mantis-500 hover:text-mantis-300"
      >
        ?
      </button>
      {open && (
        <span
          className={`absolute top-6 z-50 w-56 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-700 bg-ink-900 p-3 text-left text-xs font-normal normal-case text-slate-200 shadow-2xl ${
            align === 'right'
              ? 'right-0'
              : align === 'left'
                ? 'left-0'
                : 'left-1/2 -translate-x-1/2'
          }`}
        >
          <span className="mb-1 block font-semibold text-mantis-200">{title}</span>
          <span className="block leading-relaxed text-slate-300">{body}</span>
        </span>
      )}
    </span>
  )
}
