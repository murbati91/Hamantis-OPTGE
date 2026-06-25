# Real card data & the apps/APIs you need

The app ships with a **real, baked-in OP16 "The Time of Battle" card set** scraped from a
public database (see `src/data/op16-real.ts`). That covers OP16 with no setup. This note
explains what to add if you want **automated, refreshable, multi-set** real data and images.

## TL;DR — what's "necessary"

| Need | App / service | Cost | Account required? |
|------|---------------|------|-------------------|
| **OP16 cards now** | *(none — baked in)* | free | no |
| Auto-import / future sets (OP17+) | **apitcg.com** API | free tier | yes — free signup → `x-api-key` |
| Card images | **Limitless TCG CDN** (already used) or apitcg image URLs | free | no |
| Optional cloud sync of *your* collection | **Supabase** (scaffold already in `src/lib/supabaseAdapter.ts`) | free tier | yes |
| Optional market prices | apitcg / TCGplayer | varies | yes |

The app is **local-first and private** — none of these are required to use it. They only
add convenience (auto-updates) or cross-device sync.

## 1. apitcg.com — the recommended structured card API

- **Why:** clean JSON for every set (id, name, rarity, type, color, cost, power, counter,
  attribute, family/traits, ability/effect, trigger, set, image URLs). Best for keeping the
  database current as new sets release.
- **Auth:** free account at <https://apitcg.com/platform> → an API key sent as the
  `x-api-key` header. Without a key the endpoint returns
  `{"error":"API key is required"}`.
- **Endpoint:** `GET https://www.apitcg.com/api/one-piece/cards?property=set&value=OP16`
  (filterable by id, code, rarity, type, name, cost, power, counter, color, family,
  ability, trigger).
- **Built in:** **Settings → Import card sets**. Paste your key (stored only on this
  device via `apitcgKey` in settings — never bundled), enter a set code (e.g. `OP12`),
  and it walks `code=OPxx-001…` and writes the cards into IndexedDB. The browser calls
  apitcg directly — confirmed CORS `*` + `x-api-key`, so no proxy/backend is required.
- **Caveat:** apitcg has no "all cards in a set" filter, so the importer iterates card
  numbers and stops after a run of empties. Its dataset lags newest releases (OP14–OP16
  not present yet — OP16 is baked in from Limitless).

## 2. Limitless TCG — the no-key source used for the baked OP16 set

- Public web database: <https://onepiece.limitlesstcg.com/cards/en/OP16>.
- Card detail pages carry full English stats + effect text; the image CDN is
  `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/OP16/OP16-001_JP.webp`.
- No API key, but **no official API** either — it's scraped HTML, so it can break if the
  site changes. Good for a one-time bake (what we did), not for live calls.

## 3. Images & copyright

Card artwork is © Bandai. For a **private, personal** collection tool this is the same
posture every community deck-builder takes (hotlinking the public CDN). Remote images can
be turned **off** in **Settings** for full offline/privacy — the app then uses colored
placeholders. Do not redistribute the art commercially.

## 4. Cloud sync (optional)

`src/lib/supabaseAdapter.ts` already scaffolds an opt-in Supabase path. If you ever want
your *owned collection* synced across devices, that's the hook — off by default to keep the
app local-first.
