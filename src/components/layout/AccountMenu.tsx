import { UserButton } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { CLERK_APPEARANCE } from '../auth/AuthLanding'
import { useLanguage, t } from '../../i18n/LanguageContext'

/** Shared Clerk avatar + dropdown (My Wallet / Settings / Sign out), reused by
 * the desktop TopBar and the mobile floating account button so both stay in sync. */
export function AccountMenu() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  return (
    <UserButton appearance={CLERK_APPEARANCE}>
      <UserButton.MenuItems>
        <UserButton.Action
          label={t(lang, { en: 'My Wallet', ar: 'محفظتي' })}
          labelIcon={<span aria-hidden="true">🎒</span>}
          onClick={() => navigate('/wallet')}
        />
        <UserButton.Action
          label={t(lang, { en: 'Settings', ar: 'الإعدادات' })}
          labelIcon={<span aria-hidden="true">⚙️</span>}
          onClick={() => navigate('/settings')}
        />
      </UserButton.MenuItems>
    </UserButton>
  )
}
