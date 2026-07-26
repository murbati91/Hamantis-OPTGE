import { AccountMenu } from './AccountMenu'
import { useLanguage } from '../../i18n/LanguageContext'

/**
 * Floating account avatar for phones — the desktop TopBar avatar is hidden
 * below `lg:` (see TopBar.tsx), so this is the only way to reach the account
 * menu on mobile. Pinned above the fixed BottomTabs bar (whose height +
 * safe-area is `5rem` per AppShell's own
 * `pb-[calc(5rem+env(safe-area-inset-bottom))]`, mirrored here) — bottom-right
 * in LTR (English), bottom-left in RTL (Arabic), so it never sits on the same
 * side as a primary CTA like "Build deck" that a RTL reader's thumb rests near.
 */
export function MobileAccountButton() {
  const { dir } = useLanguage()
  return (
    <div
      className={`fixed z-40 lg:hidden ${dir === 'rtl' ? 'left-4' : 'right-4'}`}
      style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom) + 0.5rem)' }}
    >
      <div className="rounded-full ring-2 ring-mantis-600/70 shadow-lg shadow-black/40">
        <AccountMenu />
      </div>
    </div>
  )
}
