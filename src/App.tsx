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

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ClerkProvider
          publishableKey={PUBLISHABLE_KEY}
          afterSignOutUrl="/"
          appearance={CLERK_APPEARANCE}
        >
          {/* Sign-up / sign-in is REQUIRED — nothing renders until the user is authed. */}
          <SignedOut>
            <AuthLanding />
          </SignedOut>
          <SignedIn>
            <ProgressProvider>
              <CollectionProvider>
                <RouterProvider router={router} />
              </CollectionProvider>
            </ProgressProvider>
          </SignedIn>
        </ClerkProvider>
      </LanguageProvider>
    </ErrorBoundary>
  )
}
