import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { PRIMARY_NAV, SECONDARY_NAV } from './nav'

/** Mobile bottom-tab navigation with a "More" sheet. Hidden on large screens. */
export function BottomTabs() {
  const [moreOpen, setMoreOpen] = useState(false)
  const { pathname } = useLocation()
  const onSecondary = SECONDARY_NAV.some((i) =>
    i.to === '/' ? pathname === '/' : pathname.startsWith(i.to),
  )

  // Close the "More" sheet on Escape.
  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [moreOpen])

  const tabClass = (active: boolean) =>
    `flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium transition ${
      active ? 'text-mantis-300' : 'text-slate-400'
    }`

  return (
    <>
      {/* "More" sheet */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-slate-800 bg-ink-900 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-2 lg:hidden">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-700" />
            <div className="grid grid-cols-2 gap-2 p-3">
              {SECONDARY_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                      isActive
                        ? 'bg-mantis-800/60 text-mantis-100'
                        : 'bg-ink-850 text-slate-300'
                    }`
                  }
                >
                  <span className="text-lg" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-ink-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5">
          {PRIMARY_NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) => tabClass(isActive)}
              >
                <span className="text-xl leading-none" aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={tabClass(moreOpen || onSecondary)}
              aria-expanded={moreOpen}
              aria-label="More navigation"
            >
              <span className="text-xl leading-none" aria-hidden="true">⋯</span>
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}
