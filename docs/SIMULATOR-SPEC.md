# Practice Simulator (vs Bot) — build spec

Goal: a solo, playable One Piece TCG **practice duel** at `/play` — you vs a bot, using a
deck from the Deck Builder. Core combat loop only; per-card effects deferred (v2).

## Scope (v1)
Model: Leader life, DON!! ramp, play characters by cost, attach DON (+1000), attack →
block → counter, life-card damage, win check. **Ignore** card-specific text/keywords for now
EXCEPT the derived flags the app already has: `isBlocker`, `counter` value (2K-counter),
`power`, `cost`. Events/Stages: playable but no effect (or excluded from sim decks in v1).

## Architecture (keep engine UI-free + tested)
- `src/features/play/types.ts` — `GameState`, `PlayerState`, `Phase`, `Action`.
- `src/features/play/engine.ts` — pure reducer: `init(deckYou, deckBot)`, `legalActions(s)`,
  `apply(s, action)`, `isOver(s)`. No React, no randomness beyond a seeded shuffle (reuse
  `poolGenerator`'s mulberry32). Deterministic + unit-testable.
- `src/features/play/bot.ts` — `botAction(s): Action`. v1 heuristic policy (below).
- `src/pages/Play.tsx` — board UI; `/play` route + nav entry. Reuses `CardImage`,
  `resolveCard`, decks from `useCollection`.

## Turn structure (simplified)
1. **Refresh** — unrest your cards; return attached DON to active.
2. **Draw** — draw 1 (first player skips turn-1 draw). Deck-out = loss.
3. **DON** — gain 2 active DON (1 on turn 1), cap 10.
4. **Main** — repeatable: play a Character (pay cost from active DON → rest that many DON);
   attach active DON to a character/leader (+1000 power this turn). Skip activated effects.
5. **Attack** — each un-rested Character (and the Leader) may attack once: target the
   opponent Leader or a **rested** opponent Character. Attacker power vs target power.
   - Defender may **Block** (rest an un-rested Blocker → it becomes the target), and/or
     **Counter** (discard cards from hand adding their `counter` value to target power).
   - If attacker power ≥ target power: Character target is KO'd; Leader target loses 1 life
     card (drawn to hand as the "trigger"-lite). Leader at 0 life + another hit = **loss**.
6. **End** — pass to opponent.

## Bot policy (v1 heuristic)
- DON: always ramp.
- Main: play the highest-cost affordable Character first, repeat while DON remains; attach
  spare DON to its biggest attacker.
- Attack: attack the Leader with everything unless a Character trade is clearly favorable
  (attacker power ≥ a rested enemy Character it can KO without dying).
- Defense: Block/Counter only to prevent **lethal** (when at 1 life and the hit would end
  the game), spending the fewest counters needed. Difficulty tiers later (greedy ↔ careful).

## UI (Play.tsx)
- Top: bot leader + life pips + bot board (rested state shown).
- Middle: battlefield / attack target picker.
- Bottom: your board, your hand (scrollable), DON count (active/rested), phase + **End turn**.
- Tap a card to play; tap attacker → target; counter/block prompt as a small modal.
- "New game" + deck picker (default: a generated sealed deck if no saved deck).
- Mobile-first; reuse the red/gold theme + `CardImage`.

## Verify
- Engine unit tests: a scripted game reaches a deterministic win; illegal actions rejected;
  life/DON/rest invariants hold.
- Build green; `/play` reachable; a full game vs bot is completable on mobile + desktop.

## v1.1 — daily play limit (3 games/day)
- Cap **3 started duels per calendar day**. Show "Games today: X/3" on the Play start screen;
  disable **Start duel** at 0 with a friendly message + time until reset (local midnight).
- **MVP storage (local):** a localStorage key `play.daily.v1 = { date: 'YYYY-MM-DD', count }`
  via `useProgress` (or a tiny hook); increment on **Start duel**; reset when the date changes.
  Honest caveat: device-local = bypassable by clearing storage (fine for v1).
- **Server-enforced (when signed in):** a Supabase table `play_log(user_id, day date, count)`
  with RLS + a check/trigger capping count ≤ 3; the app reads remaining from there when a
  session exists, falling back to local when signed out. Do this once auth is the norm.
- Optional: count a completed game toward Training daily-quests/XP.

## Later (v2+)
Card effects engine ([On Play]/[Activate]/[Trigger]/[Rush]), then swap bot ↔ real player via
Supabase Realtime for the **Arena** (same engine, networked).
