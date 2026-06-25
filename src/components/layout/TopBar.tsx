import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { NAV_ITEMS } from './nav'
import { OfflineBadge } from '../pwa/OfflineBadge'
import { Logo } from '../ui/Logo'
import { useCollection } from '../../store/useCollection'
import { useProgress } from '../../store/useProgress'
import { levelForXp } from '../../store/useProgress'
import { currentUserEmail, signOut } from '../../lib/supabaseSync'
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from '../../config'

function AccountButton() {
  const { pathname } = useLocation()
  const { settings } = useCollection()
  const cfg = {
    url: settings.supabaseUrl || DEFAULT_SUPABASE_URL,
    anonKey: settings.supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY,
  }
  const configured = !!(cfg.url && cfg.anonKey)
  const [user, setUser] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!configured) return
    let active = true
    currentUserEmail(cfg)
      .then((u) => active && setUser(u))
      .catch(() => active && setUser(null))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, settings.supabaseUrl, settings.supabaseAnonKey, pathname])

  if (!configured) return null
  if (!user) {
    return (
      <Link
        to="/settings"
        className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 hover:border-mantis-600 hover:text-mantis-200"
      >
        Sign in
      </Link>
    )
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-mantis-700 text-xs font-bold uppercase text-white"
        aria-label="Account menu"
        aria-expanded={open}
        title={user}
      >
        {user[0]}
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-48 rounded-xl border border-slate-700 bg-ink-900 p-2 text-left shadow-2xl">
          <div className="truncate px-2 py-1 text-xs text-slate-400">{user}</div>
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-2 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            Cloud sync
          </Link>
          <button
            onClick={() => {
              void signOut(cfg).then(() => {
                setUser(null)
                setOpen(false)
              })
            }}
            className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-rose-300 hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

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
        <AccountButton />
      </div>
    </header>
  )
}
