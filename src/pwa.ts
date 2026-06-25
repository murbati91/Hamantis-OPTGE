import { registerSW } from 'virtual:pwa-register'

/** Registers the service worker (auto-update). Safe no-op in dev. */
export function setupPWA() {
  if (typeof window === 'undefined') return
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      // Periodically check for updates so the offline shell stays fresh.
      if (registration) {
        setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000)
      }
    },
    onRegisterError(err) {
      // eslint-disable-next-line no-console
      console.error('Service worker registration failed:', err)
    },
  })
}
