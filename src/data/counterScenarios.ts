// 2K-counter "What If" scenarios — verbatim from the handbook's simulator table.

export interface CounterScenario {
  id: string
  scenario: string
  /** Recommended 2K-counter range, e.g. [10, 12]. */
  range: [number, number]
  adjustment: string
}

export const COUNTER_SCENARIOS: CounterScenario[] = [
  {
    id: 'opened-15',
    scenario: 'Opened 15 total 2Ks',
    range: [10, 12],
    adjustment:
      'Auto-lock best 9. Add 10th/11th. Add 12th if a playable body or you need defense. Cut 13–15 first.',
  },
  {
    id: 'weak-removal',
    scenario: 'Weak removal',
    range: [11, 13],
    adjustment:
      'You need more hand defense because you cannot answer threats cleanly.',
  },
  {
    id: 'strong-removal',
    scenario: '5+ strong removal',
    range: [9, 11],
    adjustment:
      'Removal already protects you, so excessive counters can reduce pressure.',
  },
  {
    id: 'aggro',
    scenario: 'Aggro / tempo build',
    range: [8, 10],
    adjustment:
      'You need attackers. Too many counters slows your clock.',
  },
  {
    id: 'midrange',
    scenario: 'Midrange build',
    range: [10, 12],
    adjustment:
      'Best default: defend early, win with bigger midgame cards.',
  },
  {
    id: 'control',
    scenario: 'Control / defensive build',
    range: [11, 13],
    adjustment:
      'Only if your late game is strong enough to reward survival.',
  },
  {
    id: 'bad-2k-bodies',
    scenario: 'Bad 2K bodies / effects',
    range: [8, 10],
    adjustment: 'Defense-only cards weaken board development.',
  },
  {
    id: 'good-2k-bodies',
    scenario: 'Good 2K bodies / effects',
    range: [11, 13],
    adjustment:
      'Playable 2Ks are premium because they work in hand and on board.',
  },
]

export const COUNTER_GOLDEN_RULE =
  'Do not play all 15 2K counters blindly. Keep threats, removal, and blockers.'

// 40-card sealed deck composition targets (handbook).
export interface CompositionTarget {
  label: string
  min: number
  max: number
  hint: string
}

export const DECK_COMPOSITION_TARGETS: CompositionTarget[] = [
  { label: '2K counters', min: 10, max: 12, hint: 'Hand defense backbone.' },
  { label: 'Blockers', min: 5, max: 7, hint: 'Protect life, slow aggro.' },
  { label: 'Removal', min: 4, max: 6, hint: 'Answer their threats.' },
  { label: 'Early bodies', min: 8, max: 10, hint: 'Curve out turns 1–3.' },
  { label: 'Mid threats', min: 5, max: 7, hint: 'Take over the midgame.' },
  { label: 'Finishers', min: 3, max: 5, hint: 'Close the game.' },
]
