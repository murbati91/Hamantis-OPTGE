export interface NavItem {
  to: string
  label: string
  icon: string
  /** Show directly in the mobile bottom tab bar. */
  primary?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '🏠', primary: true },
  { to: '/wallet', label: 'Wallet', icon: '🗂️', primary: true },
  { to: '/play', label: 'Play vs Bot', icon: '🎮', primary: true },
  { to: '/training', label: 'Training', icon: '🎯' },
  { to: '/sealed', label: 'Sealed', icon: '📦' },
  { to: '/deck-builder', label: 'Deck Builder', icon: '🛠️' },
  { to: '/ai-deck', label: 'AI Deck', icon: '🤖' },
  { to: '/matches', label: 'Matches', icon: '⚔️' },
  { to: '/tournament', label: 'Tournament', icon: '🏆' },
  // Glossary is reachable from the Play Guide, so it's kept out of the main nav.
  { to: '/play-guide', label: 'Play Guide', icon: '📘', primary: true },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

/** Four primary tabs shown directly in the mobile bottom bar (+ a "More" button). */
export const PRIMARY_NAV = NAV_ITEMS.filter((i) => i.primary)
/** Everything else lives behind the mobile "More" sheet. */
export const SECONDARY_NAV = NAV_ITEMS.filter((i) => !i.primary)
