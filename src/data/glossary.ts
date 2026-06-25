/**
 * Plain-language glossary of One Piece Card Game (OP) terms used across the app.
 * Keyed by a short `id` so InfoTip components can reference a single source of
 * truth. Definitions are written for a player who is new to the jargon.
 */

export interface GlossaryTerm {
  id: string
  term: string
  short: string // one-line tooltip
  long?: string // expanded explanation for the Glossary page
  category: GlossaryCategory
}

export type GlossaryCategory =
  | 'Card types'
  | 'Card stats'
  | 'Rarities'
  | 'Gameplay roles'
  | 'Sealed & deckbuilding'
  | 'Collecting'
  | 'Strategy'

export const GLOSSARY: GlossaryTerm[] = [
  // ---- Card types ----
  {
    id: 'leader',
    term: 'Leader',
    category: 'Card types',
    short: 'Your face-up commander. Sets your colors and starting Life.',
    long: 'Every deck has exactly one Leader. It starts in play, defines which colors you may include, and has a Life value (the hits you can take before you lose). Many Leaders also have a powerful ability.',
  },
  {
    id: 'character',
    term: 'Character',
    category: 'Card types',
    short: 'A creature you play to the board to attack and block.',
    long: 'Characters are the bodies you deploy to pressure the opponent and defend your Life. They have a cost, power, and often a counter value.',
  },
  {
    id: 'event',
    term: 'Event',
    category: 'Card types',
    short: 'A one-shot spell — play it, get the effect, discard it.',
    long: 'Events resolve their effect immediately and go to the trash. Many double as removal or as counters during the opponent’s attack.',
  },
  {
    id: 'stage',
    term: 'Stage',
    category: 'Card types',
    short: 'A permanent location card with an ongoing effect.',
    long: 'Stages stay in play and provide a repeatable or passive benefit until removed.',
  },
  {
    id: 'don',
    term: 'DON!!',
    category: 'Card types',
    short: 'Your resource. Attach to pay costs and to boost power (+1000 each).',
    long: 'DON!! cards are your energy. You gain them each turn; rest them to pay card costs, or attach them to a Leader/Character to add +1000 power per DON!! for the turn.',
  },

  // ---- Card stats ----
  {
    id: 'cost',
    term: 'Cost',
    category: 'Card stats',
    short: 'How many DON!! you rest to play the card.',
  },
  {
    id: 'power',
    term: 'Power',
    category: 'Card stats',
    short: 'Combat strength. Higher power wins clashes and forces counters.',
  },
  {
    id: 'counter',
    term: 'Counter value',
    category: 'Card stats',
    short: 'The +power a card adds from hand when you defend (e.g. +1000 / +2000).',
    long: 'During the opponent’s attack you can discard cards from hand to add their counter value to your defender’s power. A “2K counter” adds +2000.',
  },
  {
    id: 'life',
    term: 'Life',
    category: 'Card stats',
    short: 'Your Leader’s hit points. Reach 0 and a final hit loses the game.',
  },
  {
    id: 'trait',
    term: 'Trait',
    category: 'Card stats',
    short: 'A keyword tag (e.g. “Navy”, “Whitebeard Pirates”) cards synergize with.',
  },

  // ---- Rarities ----
  {
    id: 'rarity',
    term: 'Rarity',
    category: 'Rarities',
    short: 'How rare the printing is. It does NOT change the card’s gameplay.',
    long: 'Rarity is a print/collectible grade (the little letter on the card), not a power level. A Common can be a sealed bomb and a Secret Rare can be unplayable — judge cards by their text and stats, not their rarity. Rarities (roughly low → high pull rate): L, C, UC, R, SR, SEC. Special print types: P, AA, MR.',
  },
  {
    id: 'rarity-l',
    term: 'L — Leader',
    category: 'Rarities',
    short: 'Leader card. Every deck is built around exactly one.',
  },
  {
    id: 'rarity-c',
    term: 'C — Common',
    category: 'Rarities',
    short: 'The most plentiful rarity. Many sealed staples are Commons.',
  },
  {
    id: 'rarity-uc',
    term: 'UC — Uncommon',
    category: 'Rarities',
    short: 'A step up from Common; still easy to pull.',
  },
  {
    id: 'rarity-r',
    term: 'R — Rare',
    category: 'Rarities',
    short: 'Roughly one per pack. Often solid role-players.',
  },
  {
    id: 'rarity-sr',
    term: 'SR — Super Rare',
    category: 'Rarities',
    short: 'A scarcer, high-impact pull — often a deck’s payoff cards.',
  },
  {
    id: 'rarity-sec',
    term: 'SEC — Secret Rare',
    category: 'Rarities',
    short: 'The rarest standard pull, usually a premium/flashy version.',
  },
  {
    id: 'rarity-p',
    term: 'P — Promo',
    category: 'Rarities',
    short: 'A promotional print (events, packs, tins) — same card, special stamp/art.',
  },
  {
    id: 'rarity-aa',
    term: 'AA — Alternate Art',
    category: 'Rarities',
    short: 'A different artwork of an existing card. Same gameplay, collector value.',
  },
  {
    id: 'rarity-mr',
    term: 'MR — Manga Rare',
    category: 'Rarities',
    short: 'A special black-&-white manga-style alt art. Chase collectible.',
  },

  // ---- Gameplay roles ----
  {
    id: '2k-counter',
    term: '2K counter',
    category: 'Gameplay roles',
    short: 'A card worth +2000 power when defending from hand.',
    long: 'The backbone of hand defense. Holding 2K counters lets you save a character or your Life from an attack. The handbook target is usually 10–12 in a 40-card sealed deck — but not blindly (keep room for threats, removal, and blockers).',
  },
  {
    id: 'blocker',
    term: 'Blocker',
    category: 'Gameplay roles',
    short: 'A character that can redirect an attack onto itself.',
    long: 'When the opponent attacks, you may rest a Blocker to take the hit instead — protecting your Life or a more important character.',
  },
  {
    id: 'removal',
    term: 'Removal',
    category: 'Gameplay roles',
    short: 'A card that K.O.s, returns, or shrinks an opponent’s character.',
    long: 'Removal answers the opponent’s board — K.O.ing a character, bouncing it to hand/deck, or lowering its power so it dies or can be attacked cleanly.',
  },
  {
    id: 'finisher',
    term: 'Finisher',
    category: 'Gameplay roles',
    short: 'A high-impact, usually high-cost card that closes out the game.',
    long: 'Finishers are your top-end payoffs. Run only a few (≈3–5) — too many clog your hand early.',
  },
  {
    id: 'early-body',
    term: 'Early body',
    category: 'Gameplay roles',
    short: 'A cheap character (cost ≤ 3) to develop the board early.',
  },
  {
    id: 'mid-threat',
    term: 'Mid threat',
    category: 'Gameplay roles',
    short: 'A mid-cost character (cost 4–6) that takes over the midgame.',
  },

  // ---- Sealed & deckbuilding ----
  {
    id: 'sealed',
    term: 'Sealed',
    category: 'Sealed & deckbuilding',
    short: 'A format where you open packs and build a 40-card deck from only those cards.',
    long: 'In sealed (e.g. a prerelease), you open a fixed number of booster packs and must build a 40-card deck plus a Leader using only the cards you opened. Card evaluation and counter counts matter more than in constructed.',
  },
  {
    id: 'sealed-rating',
    term: 'Sealed rating',
    category: 'Sealed & deckbuilding',
    short: 'A 1–10 score of how good a card is in sealed.',
    long: '10 = bomb/removal (auto-include). 9 = blocker or playable 2K counter. 8 = efficient threat/value. 6–7 = conditional. 1–5 = cut/filler.',
  },
  {
    id: 'pool',
    term: 'Pool',
    category: 'Sealed & deckbuilding',
    short: 'All the cards you opened — the pool you build your deck from.',
  },
  {
    id: 'curve',
    term: 'Curve (mana curve)',
    category: 'Sealed & deckbuilding',
    short: 'The spread of card costs in your deck.',
    long: 'A smooth curve means you have plays on each turn. Too many high-cost cards = slow starts; too many cheap cards = no late punch.',
  },
  {
    id: 'composition-targets',
    term: 'Composition targets',
    category: 'Sealed & deckbuilding',
    short: 'Recommended counts per role for a 40-card deck.',
    long: 'Handbook targets: 10–12 2K counters, 5–7 blockers, 4–6 removal, 8–10 early bodies, 5–7 mid threats, 3–5 finishers.',
  },

  // ---- Collecting ----
  {
    id: 'attribute',
    term: 'Attribute',
    category: 'Collecting',
    short: 'The combat icon: Slash, Strike, Ranged, Special, or Wisdom.',
    long: 'A flavor/keyword icon some effects care about (e.g. “give an attribute” or “your [Strike] characters”). Mostly relevant to specific card interactions, not raw stats.',
  },
  {
    id: 'set-code',
    term: 'Set code',
    category: 'Collecting',
    short: 'The pack a card is from, e.g. “OP16”. With the number it forms the card ID.',
    long: 'Cards are identified as SET-NUMBER, e.g. OP16-001. OP## = a main booster set; ST## = a starter deck; EB## = an extra booster; P-### = a promo.',
  },
  {
    id: 'condition',
    term: 'Condition',
    category: 'Collecting',
    short: 'Physical grade of your copy: NM, LP, MP, HP, DMG (or Sealed).',
    long: 'NM = Near Mint (looks new). LP = Lightly Played (minor wear). MP = Moderately Played (visible wear). HP = Heavily Played (creases/whitening). DMG = Damaged. Sealed = unopened. Affects resale value, not gameplay.',
  },
  {
    id: 'language',
    term: 'Language',
    category: 'Collecting',
    short: 'The print language: EN (English), JP (Japanese), and others.',
    long: 'The same card exists in multiple languages. JP often releases first; EN is the Western tournament print. Both are usually legal together by card name.',
  },

  // ---- Strategy ----
  {
    id: 'aggro',
    term: 'Aggro',
    category: 'Strategy',
    short: 'A fast, attack-first build. Run fewer counters (8–10).',
  },
  {
    id: 'midrange',
    term: 'Midrange',
    category: 'Strategy',
    short: 'A balanced build. Default counters 10–12.',
  },
  {
    id: 'control',
    term: 'Control',
    category: 'Strategy',
    short: 'A defensive, win-late build. Run more counters (11–13).',
  },
  {
    id: 'mulligan',
    term: 'Mulligan',
    category: 'Strategy',
    short: 'Optionally redraw your opening hand once if it’s unkeepable.',
    long: 'At the start you may shuffle back your 5-card hand and draw 5 new ones — once. Keep hands with a workable curve; mulligan hands that are all top-end or all counters.',
  },
  {
    id: 'breakpoint',
    term: 'Power breakpoint',
    category: 'Strategy',
    short: 'Key power totals (5000/6000/7000/8000) that decide combats.',
    long: 'Attacks and blocks are won by reaching the next power breakpoint. Knowing how much counter value (how many cards) it takes to reach 5000/6000/7000/8000 is core combat math.',
  },
  {
    id: 'card-advantage',
    term: 'Card advantage',
    category: 'Strategy',
    short: 'Having more cards/resources than the opponent.',
    long: 'Every counter you spend to defend is a card you lose. Trading two cards to save one is card disadvantage — sometimes worth it for tempo, often not.',
  },
  {
    id: 'on-the-play',
    term: 'On the play / draw',
    category: 'Strategy',
    short: 'On the play = you go first (no first-turn draw). On the draw = second (you draw).',
  },
  {
    id: 'tempo',
    term: 'Tempo',
    category: 'Strategy',
    short: 'The board/initiative race — who is forcing whom to react.',
  },
]

export const GLOSSARY_MAP: Record<string, GlossaryTerm> = Object.fromEntries(
  GLOSSARY.map((t) => [t.id, t]),
)

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  'Card types',
  'Card stats',
  'Rarities',
  'Gameplay roles',
  'Sealed & deckbuilding',
  'Collecting',
  'Strategy',
]
