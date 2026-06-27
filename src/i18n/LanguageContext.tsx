import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'en' | 'ar'

const STORAGE_KEY = 'op-tcg-lang'

interface LanguageContextValue {
  lang: Lang
  dir: 'ltr' | 'rtl'
  setLang: (l: Lang) => void
  toggle: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'ar') return stored
  // Fall back to the browser preference once, then persist the user's choice.
  return navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang)

  // Keep <html lang> in sync for accessibility & correct font shaping.
  // NOTE: document `dir` is applied per-page (see PlayGuide) rather than
  // globally, so English pages keep their LTR layout until they're localized.
  useEffect(() => {
    document.documentElement.lang = lang
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* private mode / storage disabled — non-fatal */
    }
  }, [lang])

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const toggle = useCallback(() => setLangState((l) => (l === 'en' ? 'ar' : 'en')), [])

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', setLang, toggle }),
    [lang, setLang, toggle],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within <LanguageProvider>')
  return ctx
}

/** Pick the value for the current language from an {en, ar} pair. */
export function t<T>(lang: Lang, pair: { en: T; ar: T }): T {
  return pair[lang]
}
