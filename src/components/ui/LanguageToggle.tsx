import { useLanguage } from '../../i18n/LanguageContext'

/**
 * Compact EN ⇄ عربي switch for the top bar. Shows the language you'll switch
 * TO, so the label is the target language in its own script.
 */
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, toggle } = useLanguage()
  const target = lang === 'en' ? 'العربية' : 'English'

  return (
    <button
      type="button"
      onClick={toggle}
      className={`rounded-full border border-slate-700 bg-ink-850 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:border-mantis-600 hover:text-mantis-200 ${className}`}
      aria-label={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
      title={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
    >
      {target}
    </button>
  )
}
