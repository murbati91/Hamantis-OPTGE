import type { Lang } from '../../i18n/LanguageContext'

export interface NavItem {
  to: string
  label: Record<Lang, string>
  icon: string
  /** Show directly in the mobile bottom tab bar. */
  primary?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: { en: 'Dashboard', ar: 'الرئيسية' }, icon: '🏠', primary: true },
  { to: '/wallet', label: { en: 'Wallet', ar: 'المحفظة' }, icon: '🗂️', primary: true },
  { to: '/play', label: { en: 'Play vs Bot', ar: 'العب ضد البوت' }, icon: '🎮', primary: true },
  { to: '/training', label: { en: 'Training', ar: 'التدريب' }, icon: '🎯' },
  { to: '/sealed', label: { en: 'Sealed', ar: 'المغلق' }, icon: '📦' },
  { to: '/deck-builder', label: { en: 'Deck Builder', ar: 'بناء الأوراق' }, icon: '🛠️' },
  { to: '/ai-deck', label: { en: 'AI Deck', ar: 'أوراق الذكاء الاصطناعي' }, icon: '🤖' },
  { to: '/matches', label: { en: 'Matches', ar: 'المباريات' }, icon: '⚔️' },
  { to: '/tournament', label: { en: 'Tournament', ar: 'البطولة' }, icon: '🏆' },
  // Glossary is reachable from the Play Guide, so it's kept out of the main nav.
  { to: '/play-guide', label: { en: 'Play Guide', ar: 'دليل اللعب' }, icon: '📘', primary: true },
  { to: '/settings', label: { en: 'Settings', ar: 'الإعدادات' }, icon: '⚙️' },
]

/** Four primary tabs shown directly in the mobile bottom bar (+ a "More" button). */
export const PRIMARY_NAV = NAV_ITEMS.filter((i) => i.primary)
/** Everything else lives behind the mobile "More" sheet. */
export const SECONDARY_NAV = NAV_ITEMS.filter((i) => !i.primary)
