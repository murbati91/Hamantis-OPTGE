import { SignIn } from '@clerk/clerk-react'
import { Logo } from '../ui/Logo'

/**
 * Clerk appearance tuned to the OP red/gold + ink theme so the hosted sign-in /
 * sign-up flow matches the app instead of Clerk's default light card.
 */
export const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: '#dc2626', // mantis red
    colorBackground: '#0d1117', // ink-900-ish
    colorInputBackground: '#161b22',
    colorText: '#e2e8f0',
    colorTextSecondary: '#94a3b8',
    colorInputText: '#f1f5f9',
    colorNeutral: '#94a3b8',
    borderRadius: '0.75rem',
  },
  elements: {
    card: 'bg-ink-900 border border-slate-800 shadow-2xl',
    headerTitle: 'text-mantis-100',
    socialButtonsBlockButton: 'border border-slate-700',
    footerActionLink: 'text-mantis-300 hover:text-mantis-200',
  },
} as const

/**
 * Full-screen auth gate. Sign-up is REQUIRED before the app renders. The Clerk
 * <SignIn> component handles both sign-in and (via its footer link) sign-up;
 * hash routing keeps it self-contained without extra app routes.
 */
export function AuthLanding() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink-950 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo className="h-14 w-14" />
        <h1 className="text-xl font-bold text-mantis-100">One Piece TCG GCC</h1>
        <p className="max-w-xs text-sm text-slate-400">
          Sign in or create a free account to access your collection, the deck builder, and the
          practice arena.
        </p>
      </div>

      <SignIn routing="hash" appearance={CLERK_APPEARANCE} />

      <p className="max-w-sm text-center text-[0.65rem] leading-relaxed text-slate-600">
        Unofficial fan-made tool — not affiliated with or endorsed by Bandai, Eiichiro Oda, or
        Shueisha. One Piece and all card images are property of their respective owners.
      </p>
    </div>
  )
}
