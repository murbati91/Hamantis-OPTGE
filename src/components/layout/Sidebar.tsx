import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './nav'
import { Logo } from '../ui/Logo'

/** Desktop / tablet sidebar (hidden on mobile, where bottom tabs are used). */
export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-800 bg-ink-900 lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Logo className="h-9 w-9 shrink-0" />
        <div>
          <div className="font-bold leading-tight text-mantis-100">One Piece TCG</div>
          <div className="text-xs text-slate-500">GCC · Collection & Training</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-mantis-800/60 text-mantis-100'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`
            }
          >
            <span className="text-lg" aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-slate-600">
        Local-first · Private by default
      </div>
    </aside>
  )
}
