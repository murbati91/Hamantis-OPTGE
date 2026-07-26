# Local Audit Changelog

Audit + stabilization pass on the existing One Piece TCG GCC PWA. Scope was an
**incremental polish/audit**, not a rebuild — the app was already feature-complete
and building clean, so working code (Training, Play, Play Guide, navigation) was
deliberately left untouched.

## 2026-06-28 — Audit pass

### Baseline (before any change)
- `npx tsc -b --noEmit` → exit 0 (no type errors)
- `npm run build` → exit 0 (257 modules, SW + manifest generated, 20 precache entries)

### Audit results
Every requested task area was verified already-implemented and correct:

- **Mobile navigation** (`components/layout/`): `BottomTabs` (4 primary tabs + a
  "More" sheet, 5-col grid, no overflow, Escape-to-close, `env(safe-area-inset-bottom)`
  padding), desktop `Sidebar`, active highlighting via `NavLink`. All 11 routes in
  `router.tsx` resolve (`/training`, `/play`, `/deck-builder`, `/wallet`, `/matches`,
  `/tournament`, `/ai-deck`, `/settings`, `/sealed`, `/play-guide`, `/`). No duplicate
  nav systems.
- **`/training`** (`pages/TrainingArena.tsx` + `store/useProgress.tsx`): level card,
  XP bar (`30·(L−1)·L` curve + welcome bonus), streak/best, daily quests with
  progress, Quizzes / Attack-Math / Mulligan / Win-Cons drills, badges grid, sealed
  CTA. Progress persisted in `localStorage` (`hamantis.progress.v1`).
- **`/play-guide`** (`pages/PlayGuide.tsx`): bilingual EN/AR + RTL, local
  `/play-guide-assets`, custom `CardFace` + diagrams (no Bandai art). All referenced
  thumbnails present.
- **`/play`** (`pages/Play.tsx` + `features/play/`): DON ramp, play/attach/attack/
  block/counter, life damage, 4 difficulties, clash overlay correctly gated, all
  timers cleared on unmount, `prefers-reduced-motion` honored.
- **Assets/offline**: `CardImage` falls back through clean sources to a generated
  placeholder (never a broken or "SAMPLE"-stamped image). PWA caches images
  `StaleWhileRevalidate`; `index.html` meta/OG/icons all valid and present.

### Files changed
- `src/components/auth/AuthLanding.tsx` — Clerk header logo switched from the
  absolute production URL (`https://onepiecetcggcc.com/icons/strawhat-logo.png`) to
  the local same-origin asset (`/icons/strawhat-logo.png`), and `logoLinkUrl` to `/`.
  The file is already precached by the service worker, so this removes a needless
  cross-origin fetch and makes the auth header render in dev/offline.
- `src/App.tsx` — added a **local-dev auth bypass** (`DEV_AUTH_BYPASS`). The repo's
  `.env` carries a `pk_live_` (production) Clerk key, which Clerk locks to the
  production domain — so on localhost the sign-in gate never reaches `isLoaded` and
  the whole app renders **blank**. When (and only when) `import.meta.env.DEV` is true
  AND the key is `pk_live_`, ClerkProvider still mounts (keeping `useUser` /
  `<UserButton>` safe) but the `<SignedIn>/<SignedOut>` wall is skipped and the app
  renders directly behind a small "auth bypassed" dev banner. A production build sets
  `DEV` to false, so prod always uses the real sign-in flow — unaffected.

### Bugs fixed
- **Blank screen on `npm run dev`** (root cause): production Clerk key can't auth on
  localhost → app rendered nothing. Fixed via the dev-only bypass above. Verified in
  a real browser: `/training` renders the full nav + all four drill tabs.
- Auth-landing logo no longer depends on the live production host.

### Local dev notes
- `npm run dev` picks the next free port if 5173 is taken (it was using **5174** in
  testing). Watch the terminal for the actual `Local:` URL, or pin it with
  `npx vite --port 5180 --strictPort`.
- To exercise the **real** Clerk sign-in flow locally, put a development
  `VITE_CLERK_PUBLISHABLE_KEY=pk_test_…` (Clerk dashboard → Development instance) in
  `.env.local`; the bypass then turns itself off automatically.

### Security flag (NOT auto-fixed — needs your action)
- `.env` contains a live Clerk secret in plaintext:
  `CLERK_SECRET_KEY=sk_live_…`. It is not `VITE_`-prefixed so it is not bundled into
  the client, but a live secret should not sit in the repo working tree. **Rotate it**
  in the Clerk dashboard and keep it only in server-side/CI secrets.

### Features improved
- None changed by design — existing features were already complete and were
  preserved verbatim.

### Build result (after change)
- `npx tsc -b --noEmit` → exit 0
- `npm run build` → exit 0

### Remaining known issues (not addressed — intentional)
- **Large JS chunk (~1.5 MB / 264 KB gzip):** all card data is baked into the main
  bundle for offline-first behavior. Code-splitting it risks the offline guarantee,
  so it is left as-is. If revisited, split via `manualChunks` AND ensure the data
  chunk stays in the SW precache so offline is not broken.
- `public/play-guide-assets/thumbnail/thumbnail_tutorial-video.webp` exists but is
  not referenced by the Play Guide — harmless, left in place.

### Test URLs (dev server: `npm run dev`)
- http://localhost:5173/training
- http://localhost:5173/play-guide
- http://localhost:5173/play
- http://localhost:5173/wallet
- http://localhost:5173/settings
