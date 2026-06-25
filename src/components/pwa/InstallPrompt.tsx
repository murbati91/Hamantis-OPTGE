import { useEffect, useState } from 'react'
import { usePWAInstall } from '../../lib/usePWAInstall'
import { Logo } from '../ui/Logo'

const DISMISS_KEY = 'hamantis.installPrompt.dismissed'

/**
 * Install guidance UI:
 *  - Android / Chrome / desktop: "Install App" button (native prompt).
 *  - iOS / Safari: Share -> Add to Home Screen instructions.
 * Hidden once installed or dismissed.
 */
export function InstallPrompt() {
  const { platform, installed, canPrompt, promptInstall } = usePWAInstall()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === '1',
  )
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    if (installed) setDismissed(true)
  }, [installed])

  if (installed || dismissed) return null

  // On iOS we always show guidance (no beforeinstallprompt). Elsewhere only when prompt is available.
  const isIos = platform === 'ios'
  if (!isIos && !canPrompt) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border border-mantis-700/60 bg-ink-850/95 p-4 shadow-2xl backdrop-blur sm:bottom-4">
      <div className="flex items-start gap-3">
        <Logo className="h-9 w-9 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-mantis-100">Install One Piece TCG GCC</p>
          {isIos ? (
            <p className="mt-1 text-sm text-slate-300">
              Add to your Home Screen for full-screen, offline use.
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-300">
              Install the app for offline access and a full-screen experience.
            </p>
          )}

          {isIos && showIosHelp && (
            <ol className="mt-3 space-y-1 text-sm text-slate-300">
              <li>1. Tap the <span className="font-semibold">Share</span> button <span aria-hidden>􀈂</span> in Safari.</li>
              <li>2. Scroll and tap <span className="font-semibold">Add to Home Screen</span>.</li>
              <li>3. Tap <span className="font-semibold">Add</span>.</li>
            </ol>
          )}

          <div className="mt-3 flex gap-2">
            {isIos ? (
              <button
                onClick={() => setShowIosHelp((v) => !v)}
                className="rounded-lg bg-mantis-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-mantis-500"
              >
                {showIosHelp ? 'Hide steps' : 'How to install'}
              </button>
            ) : (
              <button
                onClick={() => void promptInstall()}
                className="rounded-lg bg-mantis-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-mantis-500"
              >
                Install App
              </button>
            )}
            <button
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
