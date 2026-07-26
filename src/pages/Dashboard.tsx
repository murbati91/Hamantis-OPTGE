import { Link } from 'react-router-dom'
import { useCollection } from '../store/useCollection'
import { useProgress, levelProgress } from '../store/useProgress'
import { StatCard } from '../components/ui/StatCard'
import { RatingPill } from '../components/ui/RatingPill'
import { CardImage } from '../components/ui/CardImage'
import { is2kCounter, isBlocker, isRemoval } from '../lib/cards'
import { Logo } from '../components/ui/Logo'
import { useLanguage, t } from '../i18n/LanguageContext'
import type { CardColor } from '../types'

export function Dashboard() {
  const { lang } = useLanguage()
  const { entries, cardIndex, settings, decks, matches } = useCollection()
  const { xp, level, title, badges } = useProgress()
  const prog = levelProgress(xp)

  const wins = matches.filter((m) => m.result === 'win').length
  const losses = matches.filter((m) => m.result === 'loss').length
  const winRate =
    wins + losses > 0 ? `${Math.round((wins / (wins + losses)) * 100)}%` : '—'

  const owned = Object.values(entries)
  const totalCopies = owned.reduce((sum, e) => sum + e.quantity, 0)
  const uniqueOwned = owned.length

  const ownedCards = owned
    .map((e) => cardIndex[e.cardId])
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  const counters = ownedCards.filter(is2kCounter).length
  const blockers = ownedCards.filter(isBlocker).length
  const removal = ownedCards.filter(isRemoval).length

  // Color spread
  const colorCounts = new Map<CardColor, number>()
  for (const c of ownedCards) {
    for (const col of c.color) colorCounts.set(col, (colorCounts.get(col) ?? 0) + 1)
  }

  const topRated = Object.values(cardIndex)
    .filter((c) => c.sealedRating != null)
    .sort((a, b) => (b.sealedRating ?? 0) - (a.sealedRating ?? 0))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Progress hero */}
      <section className="rounded-2xl border border-mantis-800/50 bg-gradient-to-br from-mantis-900/60 to-ink-900 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-mantis-300">{title}</div>
            <div className="text-2xl font-bold text-mantis-100">{t(lang, { en: 'Level', ar: 'المستوى' })} {level}</div>
          </div>
          <Logo className="h-12 w-12" />
        </div>
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-950">
            <div
              className="h-full rounded-full bg-mantis-400 transition-all"
              style={{ width: `${prog.pct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>{xp} {t(lang, { en: 'XP total', ar: 'إجمالي نقاط الخبرة' })}</span>
            <span>{prog.into}/{prog.span} {t(lang, { en: 'to Level', ar: 'للمستوى' })} {level + 1}</span>
          </div>
        </div>
      </section>

      {/* New-player glossary hint */}
      <Link
        to="/glossary"
        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-ink-850/50 px-4 py-3 hover:border-mantis-700/60"
      >
        <span className="min-w-0 text-sm text-slate-300">
          📖 {t(lang, { en: 'New to the terms?', ar: 'جديد على المصطلحات؟' })}{' '}
          <span className="text-mantis-300">{t(lang, { en: 'Open the Glossary', ar: 'افتح المسرد' })}</span>
          {' — '}
          {t(lang, {
            en: '2K counter, blocker, removal & more explained.',
            ar: 'شرح 2K counter وBlocker وRemoval والمزيد.',
          })}
        </span>
        <span className="shrink-0 text-slate-500">›</span>
      </Link>

      {/* External: Strawtable */}
      <a
        href="https://www.strawtable.net/op"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-ink-850/50 px-4 py-3 hover:border-mantis-700/60"
      >
        <span className="min-w-0 text-sm text-slate-300">
          🃏 {t(lang, { en: 'Hamantis', ar: 'Hamantis' })}{' '}
          <span className="text-mantis-300">{t(lang, { en: 'hamantis mantis club', ar: 'hamantis mantis club' })}</span>
          {' — '}
          {t(lang, {
            en: 'card database, deck lists & meta for One Piece TCG.',
            ar: 'قاعدة بيانات البطاقات وقوائم الديكات والميتا للعبة ون بيس.',
          })}
        </span>
        <span className="shrink-0 text-slate-500">↗</span>
      </a>

      {/* Collection stats */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          {t(lang, { en: 'Collection', ar: 'المجموعة' })}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={t(lang, { en: 'Unique cards', ar: 'أوراق فريدة' })} value={uniqueOwned} icon="🗂️" />
          <StatCard label={t(lang, { en: 'Total copies', ar: 'إجمالي النسخ' })} value={totalCopies} icon="📚" />
          <StatCard label={t(lang, { en: '2K counters', ar: 'عدادات 2K' })} value={counters} icon="🛡️" />
          <StatCard label={t(lang, { en: 'Blockers', ar: 'الحاجبون' })} value={blockers} icon="🧱" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={t(lang, { en: 'Removal', ar: 'الإزالة' })} value={removal} icon="💥" />
          <StatCard label={t(lang, { en: 'Badges', ar: 'الشارات' })} value={`${badges.length}/6`} icon="🏅" />
          <StatCard
            label={t(lang, { en: 'Mode', ar: 'الوضع' })}
            value={settings.privateMode ? t(lang, { en: 'Private', ar: 'خاص' }) : t(lang, { en: 'Open', ar: 'مفتوح' })}
            icon="🔒"
          />
          <StatCard
            label={t(lang, { en: 'Colors', ar: 'الألوان' })}
            value={colorCounts.size}
            hint={[...colorCounts.keys()].join(' ')}
            icon="🎨"
          />
        </div>
      </section>

      {/* Activity */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          {t(lang, { en: 'Activity', ar: 'النشاط' })}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Link to="/deck-builder">
            <StatCard label={t(lang, { en: 'Decks', ar: 'الأوراق المبنية' })} value={decks.length} icon="🛠️" />
          </Link>
          <Link to="/matches">
            <StatCard label={t(lang, { en: 'Matches', ar: 'المباريات' })} value={matches.length} icon="⚔️" />
          </Link>
          <Link to="/matches">
            <StatCard
              label={t(lang, { en: 'Win rate', ar: 'معدل الفوز' })}
              value={winRate}
              hint={`${wins}W · ${losses}L`}
              icon="📊"
            />
          </Link>
        </div>
      </section>

      {uniqueOwned === 0 && (
        <section className="rounded-2xl border border-dashed border-slate-700 bg-ink-850/40 p-6 text-center">
          <p className="text-slate-300">{t(lang, { en: 'Your wallet is empty.', ar: 'محفظتك فارغة.' })}</p>
          <p className="mt-1 text-sm text-slate-400">
            {t(lang, {
              en: 'Browse the OP16 reference set or add your own cards to start tracking your collection.',
              ar: 'تصفح مجموعة OP16 المرجعية أو أضف أوراقك الخاصة لبدء تتبع مجموعتك.',
            })}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              to="/wallet"
              className="rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500"
            >
              {t(lang, { en: 'Open Wallet', ar: 'افتح المحفظة' })}
            </Link>
            <Link
              to="/add"
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              {t(lang, { en: 'Add Card', ar: 'أضف ورقة' })}
            </Link>
          </div>
        </section>
      )}

      {/* Watchlist */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            {t(lang, { en: 'OP16 Top Rated (reference)', ar: 'الأعلى تقييمًا في OP16 (مرجعي)' })}
          </h2>
          <Link to="/sealed" className="text-xs text-mantis-400 hover:underline">
            {t(lang, { en: 'Sealed tools →', ar: 'أدوات المغلق ←' })}
          </Link>
        </div>
        <div className="space-y-2">
          {topRated.map((c) => (
            <Link
              key={c.id}
              to={`/card/${c.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-ink-850/50 px-4 py-3 hover:border-mantis-700/60"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-12 shrink-0">
                  <CardImage card={c} />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-100">{c.name}</div>
                  <div className="text-xs text-slate-500">
                    {c.id} · {c.sealedRole}
                  </div>
                </div>
              </div>
              <RatingPill rating={c.sealedRating} />
            </Link>
          ))}
        </div>
      </section>

      {/* Training quick link */}
      <section className="rounded-2xl border border-slate-800 bg-ink-850/50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-mantis-100">{t(lang, { en: 'Train your edge 🎯', ar: 'اصقل مهاراتك 🎯' })}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {t(lang, {
                en: 'Drill 2K-counter math and sealed decisions to earn XP and badges.',
                ar: 'تدرب على حسابات 2K counter وقرارات المغلق لكسب نقاط الخبرة والشارات.',
              })}
            </p>
          </div>
          <Link
            to="/training"
            className="shrink-0 rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500"
          >
            {t(lang, { en: 'Train', ar: 'تدرّب' })}
          </Link>
        </div>
      </section>
    </div>
  )
}
