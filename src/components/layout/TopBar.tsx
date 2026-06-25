import { useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { NAV_ITEMS } from './nav'
import { OfflineBadge } from '../pwa/OfflineBadge'
import { Logo } from '../ui/Logo'
import { useProgress, levelForXp } from '../../store/useProgress'
import { CLERK_APPEARANCE } from '../auth/AuthLanding'

export function TopBar() {
  const { pathname } = useLocation()
  const { xp, title } = useProgress()
  const level = levelForXp(xp)
  const current =
    NAV_ITEMS.find((i) => (i.to === '/' ? pathname === '/' : pathname.startsWith(i.to)))
      ?.label ?? 'One Piece TCG'

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-ink-950/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
      <div className="flex items-center gap-2">
        <Logo className="h-7 w-7 shrink-0 lg:hidden" />
        <h1 className="text-lg font-bold text-mantis-100">{current}</h1>
        <OfflineBadge />
      </div>
      <div className="flex items-center gap-2 text-right">
        <div className="hidden text-xs text-slate-400 sm:block">{title}</div>
        <div className="rounded-full bg-mantis-800/60 px-2.5 py-1 text-xs font-bold text-mantis-200">
          Lv {level}
        </div>
        <UserButton afterSignOutUrl="/" appearance={CLERK_APPEARANCE} />
      </div>
    </header>
  )
}
