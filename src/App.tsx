import { RouterProvider } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react'
import { router } from './router'
import { CollectionProvider } from './store/useCollection'
import { ProgressProvider } from './store/useProgress'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthLanding, CLERK_APPEARANCE } from './components/auth/AuthLanding'
import { Logo } from './components/ui/Logo'
import { LanguageProvider } from './i18n/LanguageContext'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

/**
 * Local-dev auth bypass. A `pk_live_` (production) Clerk key is locked by Clerk to
 * the production domain, so it can NEVER authenticate on localhost — the sign-in
 * gate would hang on a blank screen (Clerk never reaches `isLoaded`). When running
 * `vite dev` with such a key we keep ClerkProvider mounted (so `useUser` /
 * `<UserButton>` stay safe) but skip the sign-in wall and render the app directly.
 *
 * This can only be true under `vite dev` — a production build sets
 * `import.meta.env.DEV` to false, so prod is never affected. To exercise the real
 * Clerk flow locally, drop a development `pk_test_…` key in `.env.local`.
 */
const DEV_AUTH_BYPASS =
  import.meta.env.DEV && !!PUBLISHABLE_KEY && PUBLISHABLE_KEY.startsWith('pk_live_')

/** Thin banner shown only in the dev auth-bypass path. */
function DevAuthBanner() {
  return (
    <div className="bg-amber-500/15 px-3 py-1 text-center text-[0.7rem] font-medium text-amber-300">
      Dev mode · auth bypassed (production Clerk key can’t sign in on localhost) ·
      add a <code className="text-amber-200">pk_test_</code> key in{' '}
      <code className="text-amber-200">.env.local</code> for the real flow
    </div>
  )
}

/** Shown when the Clerk key isn't configured yet (dev safety — never on prod). */
function AuthConfigMissing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-950 p-6 text-center">
      <Logo className="h-12 w-12" />
      <h1 className="text-lg font-bold text-mantis-100">Authentication not configured</h1>
      <p className="max-w-sm text-sm text-slate-400">
        Set <code className="rounded bg-ink-850 px-1 text-mantis-200">VITE_CLERK_PUBLISHABLE_KEY</code>{' '}
        in <code className="rounded bg-ink-850 px-1 text-mantis-200">.env</code> (Clerk → Configure →
        API Keys) and rebuild.
      </p>
    </div>
  )
}

export default function App() {
  if (!PUBLISHABLE_KEY) return <AuthConfigMissing />

  const appTree = (
    <ProgressProvider>
      <CollectionProvider>
        <RouterProvider router={router} />
      </CollectionProvider>
    </ProgressProvider>
  )

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ClerkProvider
          publishableKey={PUBLISHABLE_KEY}
          afterSignOutUrl="/"
          appearance={CLERK_APPEARANCE}
        >
          {DEV_AUTH_BYPASS ? (
            // Local dev only — render the app without the sign-in gate (see note above).
            <>
              <DevAuthBanner />
              {appTree}
            </>
          ) : (
            <>
              {/* Sign-up / sign-in is REQUIRED — nothing renders until the user is authed. */}
              <SignedOut>
                <AuthLanding />
              </SignedOut>
              <SignedIn>{appTree}</SignedIn>
            </>
          )}
        </ClerkProvider>
      </LanguageProvider>
    </ErrorBoundary>
  )
}
