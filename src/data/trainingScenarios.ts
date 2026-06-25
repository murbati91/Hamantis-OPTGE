/** Static scenario banks for Solo Training Mode. */

export interface QuizScenario {
  id: string
  category: 'counters' | 'sealed' | 'sequencing' | 'evaluation'
  question: string
  options: string[]
  answer: number
  explain: string
  badge?: string
}

export const QUIZ_BANK: QuizScenario[] = [
  {
    id: 'q-counters-15',
    category: 'counters',
    question: 'You opened 15 playable 2K counters in a midrange pool. How many should you run?',
    options: ['All 15', '10–12', '6–8', '16+'],
    answer: 1,
    explain: 'Midrange default is 10–12. Lock the best 9, add 10th/11th, add a 12th only for a playable body or extra defense.',
    badge: '2k-master',
  },
  {
    id: 'q-weak-removal',
    category: 'counters',
    question: 'Your pool has weak removal. Which way do your 2K counters move?',
    options: ['Down to 8–10', 'Stay at 10–12', 'Up to 11–13', 'Remove them all'],
    answer: 2,
    explain: 'Weak removal means you need more hand defense — push counters to 11–13.',
  },
  {
    id: 'q-bomb',
    category: 'evaluation',
    question: 'A 10/10 sealed card is best described as…',
    options: ['Filler', 'Conditional', 'A bomb / removal — auto-include', 'A blocker only'],
    answer: 2,
    explain: '10/10 = auto-include bomb or premium removal. It goes in every time.',
    badge: 'bomb-finder',
  },
  {
    id: 'q-aggro',
    category: 'counters',
    question: 'You commit to an aggro build. Your 2K-counter count should be…',
    options: ['11–13', '10–12', '8–10', '14+'],
    answer: 2,
    explain: 'Aggro wants attackers; too many counters slows your clock. Run 8–10.',
  },
  {
    id: 'q-control',
    category: 'counters',
    question: 'A control build with a strong late game runs how many 2K counters?',
    options: ['8–10', '10–12', '11–13', 'None'],
    answer: 2,
    explain: 'Control wants to survive to its payoff — 11–13, but only if the late game rewards survival.',
  },
  {
    id: 'q-finishers',
    category: 'sealed',
    question: 'Your deck has too many high-cost finishers. What do you cut first?',
    options: ['2K counters', 'Early bodies', 'The highest-cost cards', 'Removal'],
    answer: 2,
    explain: 'Too many finishers clogs your hand — trim the highest-cost cards to smooth the curve.',
  },
  {
    id: 'q-early',
    category: 'sealed',
    question: 'How many early bodies (cost ≤ 3) should a 40-card sealed deck target?',
    options: ['2–4', '8–10', '14–16', '0'],
    answer: 1,
    explain: 'Target 8–10 early bodies so you can curve out turns 1–3.',
    badge: 'curve-builder',
  },
  {
    id: 'q-blocker',
    category: 'evaluation',
    question: 'A 9/10 sealed card is typically…',
    options: ['Filler', 'A blocker or playable 2K counter', 'A stage', 'Unplayable'],
    answer: 1,
    explain: '9/10 = blocker or playable 2K counter — near auto-include defensive value.',
  },
]

export interface MulliganScenario {
  id: string
  /** Short hand description. */
  hand: string[]
  /** Context line: your leader / plan. */
  context: string
  /** True = keep, false = mulligan. */
  keep: boolean
  explain: string
}

export const MULLIGAN_BANK: MulliganScenario[] = [
  {
    id: 'm1',
    context: 'Aggro Red leader, on the play.',
    hand: ['2-cost 3000', '2-cost 4000', '3-cost 5000', '4-cost 6000', 'Event: +2000 counter'],
    keep: true,
    explain: 'Smooth curve from 2→4 with a counter. Textbook keep for aggro on the play.',
  },
  {
    id: 'm2',
    context: 'Midrange Blue leader, on the draw.',
    hand: ['7-cost 7000', '8-cost 8000', '6-cost 6000', '5-cost 6000', '7-cost 7000'],
    keep: false,
    explain: 'All top-end, no early plays — you will fall behind on board. Mulligan for a curve.',
  },
  {
    id: 'm3',
    context: 'Control build, on the draw.',
    hand: ['1-cost 2000 blocker', '3-cost removal', '4-cost 5000', '2K counter', '5-cost blocker'],
    keep: true,
    explain: 'Early defense + removal + a counter — exactly what control wants to survive.',
  },
  {
    id: 'm4',
    context: 'Any build, on the play.',
    hand: ['2K counter', '2K counter', '2K counter', '2K counter', '2K counter'],
    keep: false,
    explain: 'Five counters and zero board plays — you cannot develop. Mulligan.',
  },
]

export interface WinConScenario {
  id: string
  board: string
  options: string[]
  answer: number
  explain: string
}

export const WINCON_BANK: WinConScenario[] = [
  {
    id: 'w1',
    board: 'Opponent at 1 life, no blockers. You have an unblockable 6000 attacker and a 7000 attacker.',
    options: [
      'Attack life with the 7000 first',
      'Attack with the unblockable 6000',
      'Pass and develop board',
      'Attack their leader twice trading',
    ],
    answer: 1,
    explain: 'They are at 1 with no blockers — the unblockable attacker is your cleanest lethal line.',
  },
  {
    id: 'w2',
    board: 'You are ahead on board but stuck at 2 cards in hand. Opponent is rebuilding.',
    options: [
      'Dump everything attacking life',
      'Keep counters up and pressure the leader',
      'Pass entirely',
      'Block their next attack pre-emptively',
    ],
    answer: 1,
    explain: 'Convert your board lead into life pressure while holding counters — close before they stabilize.',
  },
]
