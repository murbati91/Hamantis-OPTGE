# One Piece TCG GCC — Collection, Training & Practice Arena

A **private, local-first** One Piece Card Game collection wallet, sealed
simulator, gamified training arena, and **practice duel vs an AI bot** — a PWA
for the GCC One Piece community.

> **Inspired by Hamad K — aka _Hamantis_ ("Praying Mantis")** — whose OP sealed
> handbook and gamification ideas are the seed of this project. 🙏

Live: **[onepiecetcggcc.com](https://onepiecetcggcc.com)**

Installable as a **PWA** on iPhone, iPad, Android, and desktop. Works
**offline**. Collection data stays **on your device** by default — opt-in cloud
sync (Supabase, email sign-in) is available for multi-device.

> _Unofficial fan-made tool — not affiliated with or endorsed by Bandai,
> Eiichiro Oda, or Shueisha. One Piece and all card images are property of their
> respective owners._

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checks + builds to dist/ (incl. service worker)
npm run preview  # serve the production build locally
```

## Features

- **Collection Wallet** — browse the **complete real card universe** (every set:
  OP01–OP16, EB01–03, PRB01–02, ST01–30 — ~2,469 cards) with filters (set, color,
  rarity, type, owned/missing, 2K counter, blocker, removal, sealed rating) + search.
- **Practice Duel vs Bot** (`/play`) — a playable simplified OP duel: DON ramp,
  play characters, attach DON, attack / block / counter, life-card damage.
  - **Unlimited** practice — play as much as you like.
  - **4 difficulty modes**: Easy → Normal → Hard → **God** (near-perfect combat math).
  - **Sealed-box flip** reveal when a duel starts; mobile-first red/gold UI.
- **Deck Builder** — sealed pools, leader pick, 40-card builds with live
  composition analysis (targets, curve, auto-cut notes), save/load.
- **Sealed Simulator** — the 2K-counter **"What If"** engine from the handbook.
- **Solo Training** — quizzes, attack-math drills, mulligan practice,
  win-condition scenarios, daily quests + day streaks, XP / levels / badges.
- **Match & Tournament tracking** — log matches and run round-by-round events.

## Card data

The full card universe is **baked offline** from the public
[Limitless TCG](https://onepiece.limitlesstcg.com) database via
[`scripts/scrape-limitless.mjs`](scripts/scrape-limitless.mjs) into
`src/data/sets/*.json` (glob-loaded by `src/data/allCards.ts`). Card art uses the
**clean English Limitless scans**; cards without an English scan yet (newest sets)
fall back to a generated placeholder — **never a "SAMPLE"-watermarked image**.

Reference cards are marked **not owned** until you add a copy, so they're never
mistaken for your real collection.

To refresh / add sets:

```bash
node scripts/scrape-limitless.mjs --sets        # list every set code
node scripts/scrape-limitless.mjs OP17 EB04     # scrape specific sets
```

## Privacy & storage

- Collection + custom cards → **IndexedDB** (on-device).
- Settings + progress → **localStorage**.
- **Opt-in cloud sync** → Supabase (email one-time-code sign-in; session
  persisted so you stay logged in). Off until you configure it in **Settings**.
- Remote card images can be disabled in **Settings** for full offline / privacy.

## Tech

React 18 + Vite 5 + TypeScript (strict) · Tailwind CSS · React Router 6 ·
idb (IndexedDB) · vite-plugin-pwa · Supabase (optional sync).

## Reference documents (not modified by the app)

- `Hamandtis_Praying_Mantis_OP16_Complete_Visual_Handbook.html`
- `docs/Hamandtis_Praying_Mantis_OP16_Complete_Visual_Handbook.pdf`

## Credits

- **Concept & sealed gamification inspiration:** Hamad K — _Hamantis_ (Praying Mantis).
- **Card data & art:** [Limitless TCG](https://onepiece.limitlesstcg.com) (community database).
- Built for the GCC One Piece TCG community.
