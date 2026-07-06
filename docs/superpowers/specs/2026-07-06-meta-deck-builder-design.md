# Meta-Backed AI Deck Builder — Design

## Goal

When a player picks a Leader in the AI Deck Builder (`/ai-deck`) and that Leader has a real, known-good competitive decklist, build the deck from that actual tournament-winning list instead of the local scoring heuristics in `aiBuilder.ts` — and tell the user *why* it's good (event, placement, date), not just that an algorithm assembled it.

Local heuristic building (existing `buildDeck()` logic) remains the fallback for any Leader with no cached meta data. Nothing about the existing heuristic path changes; this feature only adds a preferring check in front of it.

## Non-goals (v1)

- No live scraping on the browser's/user's request path. Never call Limitless TCG synchronously from a user action.
- No per-user "own collection" substitution logic — the AI Deck Builder already builds from `fullIndex` (the complete card database, not a wallet), so a real decklist's cards are always resolvable already. Ownership substitution is out of scope.
- No multiple-archetype-per-Leader selection (e.g. picking between an aggro build and a control build of the same Leader). One best decklist per Leader for v1.
- No UI for browsing the raw meta dataset directly (e.g. a "tier list" page). This only changes what `buildDeck()` returns.

## Data source & refresh

Reuses the existing pattern in this repo (`scripts/scrape-limitless.mjs` already bakes card data offline from Limitless TCG):

- New script: `scripts/scrape-limitless-meta.mjs`. Pulls top-placing tournament decklists per Leader from Limitless TCG's public decklist pages.
- Output: a committed static file, `src/data/metaDecks.ts`, keyed by Leader card id.
- Refresh cadence: piggybacks on the existing weekly `sync-cards.yml` GitHub Action (Mon 04:00 UTC) that already does scrape → commit → build → deploy. No new secrets, no new infra, no new schedule to maintain.
- The exact Limitless URL/selector pattern for decklists will be confirmed as a spike at the start of implementation (not blocking this design — the scraping *target* is known, the exact markup isn't yet).

## Data shape

```ts
export interface MetaDeck {
  leaderId: string
  archetypeLabel: string       // e.g. "Red/Green Zoro Aggro"
  decklist: Record<string, number>  // cardId -> count, sums to 50
  event: string                // tournament name
  placement: string            // e.g. "1st of 128"
  date: string                 // ISO date, e.g. "2026-05-18"
  sourceUrl: string
}

export const META_DECKS: Record<string /* leaderId */, MetaDeck>
```

One entry per Leader, selected at scrape-time by best placement, then most recent.

## Builder integration (`aiBuilder.ts`)

`buildDeck()` resolves the Leader exactly as it does today (either `leaderId` picked directly, or inferred from `strategy` text via `pickLeader()`). Immediately after the Leader is resolved, before running the heuristic candidate-scoring loop:

1. Look up `META_DECKS[leader.id]`.
2. If found: adopt `decklist` verbatim as the deck. Skip the heuristic scoring/tiered-fill loop entirely for this build.
3. If not found: fall through to the existing heuristic path unchanged.

Either way, the result still runs through the *existing* `analyzeAiDeck()` and `validateDeckLegality()` — so role/curve analysis (now shown in the redesigned `DeckAnalysisPanel`) and legality checks apply uniformly regardless of which path produced the deck. `BuildResult` gains one new optional field:

```ts
interface BuildResult {
  // ...existing fields unchanged...
  metaSource?: { event: string; placement: string; date: string; sourceUrl: string }
}
```

`archetype` is set to the meta deck's `archetypeLabel` when a meta deck is used (instead of the locally-computed `archetypeName()`).

## Reasoning / "why it's the best"

When a meta deck is used, `reasoning[]` leads with a citation instead of the current heuristic-summary lines, e.g.:

```
Built from a real tournament-winning decklist: 1st of 128 at [Event Name] (2026-05-18).
This is a proven list, not a heuristic guess — see the source for full context.
Max 4 copies per card enforced; curve and role distribution shown below.
```

The `sourceUrl` is surfaced as a link in the AI Deck Builder result UI (`AIDeckBuilder.tsx`), next to the archetype heading.

When falling back to heuristics (no meta match), `reasoning[]` stays exactly as it is today — no false claims of meta backing.

## Error handling

- **Scrape failures / site markup changes**: the script logs and skips affected entries; the last-known-good `metaDecks.ts` stays committed and the site never breaks from a bad scrape run.
- **A scraped decklist that fails `validateDeckLegality`** (parsing error, doesn't sum to 50, illegal copy count, etc.) is dropped *at scrape time* and never lands in the committed `metaDecks.ts`. Bad data never reaches a user's build.
- **No meta entry for the resolved Leader**: silent, transparent fallback to the heuristic engine. No error or degraded-mode message shown to the user — this is the expected common case for less-played Leaders.

## Testing

- Unit test: meta-adoption path — mock a `MetaDeck` entry, confirm `buildDeck()` returns it verbatim, that it passes `validateDeckLegality`, and that `reasoning[]`/`metaSource` are populated correctly.
- Unit test: fallback path — no matching entry, confirm the existing heuristic engine still runs unchanged (regression guard for the current behavior).
- CI-time check: every entry in the committed `metaDecks.ts` must pass `validateDeckLegality` — run as part of `scripts/scrape-limitless-meta.mjs` itself (fails the scrape/commit step, not a separate test file) so bad data can never be committed in the first place.

## Out of scope follow-ups (not this pass)

- Multiple archetype variants per Leader with aggression-based selection.
- Surfacing a browsable meta tier-list page.
- Blending meta card-frequency into the heuristic scorer for Leaders that have partial/weak meta data (e.g. only a top-8 finish, not a win).
