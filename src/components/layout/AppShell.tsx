import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomTabs } from './BottomTabs'
import { InstallPrompt } from '../pwa/InstallPrompt'
import { useCollection } from '../../store/useCollection'

export function AppShell() {
  const { ready } = useCollection()
  return (
    <div className="flex min-h-[100dvh] bg-ink-950 text-slate-200">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 lg:pb-8">
          <div className="mx-auto w-full max-w-5xl">
            {ready ? (
              <Outlet />
            ) : (
              <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
                <span className="animate-pulse">Loading your collection…</span>
              </div>
            )}
            <footer className="mt-10 border-t border-slate-800/60 pt-4 text-center text-[0.7rem] leading-relaxed text-slate-500">
              Unofficial fan-made tool · not affiliated with or endorsed by Bandai, Eiichiro Oda,
              or Shueisha. One Piece and all card images are property of their respective owners.
            </footer>
          </div>
        </main>
      </div>
      <BottomTabs />
      <InstallPrompt />
    </div>
  )
}
