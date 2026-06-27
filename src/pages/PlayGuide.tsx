import { Link } from 'react-router-dom'
import { CardFace } from '../components/ui/CardFace'
import { PlaymatDiagram, SetupFlow } from '../components/PlayGuideDiagrams'
import { useLanguage } from '../i18n/LanguageContext'
import { PLAY_GUIDE as G } from '../i18n/playGuide'

// NOTE: must NOT be '/play-guide' — that would shadow the SPA route of the same
// name on nginx (the physical dir wins → 403 on direct load). Keep it distinct.
const IMG = '/play-guide-assets'

// Clean, watermark-FREE example cards painted by CardFace from stats (every real
// scan is "SAMPLE"-stamped — see CardFace). Keyed by the card_<key>.webp token.
type Sample = Parameters<typeof CardFace>[0]
const SAMPLES: Record<string, Sample> = {
  leader: { name: 'Monkey D. Luffy', type: 'Leader', color: 'Red', power: 5000, life: 5 },
  don: { name: 'DON!!', type: 'DON!!', color: 'Black' },
  chara: { name: 'Jinbe', type: 'Character', color: 'Red', cost: 5, power: 6000, counter: 1000 },
  event: { name: 'Guard Point', type: 'Event', color: 'Red', cost: 1 },
  stage: { name: 'Thousand Sunny', type: 'Stage', color: 'Red', cost: 2 },
}
const sampleKey = (img: string) => img.replace('card_', '').replace('.webp', '')

/** Accent border colors for the turn-flow phase cards. */
const ACCENT: Record<string, string> = {
  red: 'border-mantis-600',
  green: 'border-op-green',
  blue: 'border-op-blue',
  purple: 'border-op-purple',
  straw: 'border-straw-500',
}

const ACCENT_TEXT: Record<string, string> = {
  red: 'text-mantis-300',
  green: 'text-op-green',
  blue: 'text-op-blue',
  purple: 'text-op-purple',
  straw: 'text-straw-400',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 border-b-2 border-mantis-700/70 pb-2 text-2xl font-extrabold uppercase tracking-wide text-mantis-200">
      {children}
    </h2>
  )
}

export function PlayGuide() {
  const { lang, dir } = useLanguage()
  const tr = <T,>(p: { en: T; ar: T }) => p[lang]
  const startWord = tr(G.stepLabel)

  return (
    <div dir={dir} className="space-y-8">
      {/* Intro */}
      <header>
        <p className="text-sm leading-relaxed text-slate-400">{tr(G.intro)}</p>
      </header>

      {/* What you need */}
      <section className="rounded-2xl border border-slate-800 bg-ink-900/60 p-5">
        <SectionTitle>{tr(G.need.title)}</SectionTitle>
        <p className="mb-5 text-base text-slate-200">{tr(G.need.lead)}</p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex items-end gap-3">
            <div className="w-28 shrink-0">
              <CardFace {...SAMPLES.leader} size="md" />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="rounded-xl border border-slate-700 bg-ink-850 px-3 py-4 text-center">
                <div className="text-2xl font-extrabold text-mantis-300">50</div>
                <div className="text-xs text-slate-400">card deck</div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-ink-850 px-3 py-4 text-center">
                <div className="text-2xl font-extrabold text-op-blue">10</div>
                <div className="text-xs text-slate-400">DON!! cards</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-100">{tr(G.need.deckHeading)}</h3>
            <div className="grid grid-cols-3 gap-2">
              <CardFace {...SAMPLES.chara} size="sm" />
              <CardFace {...SAMPLES.event} size="sm" />
              <CardFace {...SAMPLES.stage} size="sm" />
            </div>
            <p className="text-sm text-slate-400">{tr(G.need.deckNote)}</p>
          </div>
        </div>
      </section>

      {/* Card types */}
      <section className="rounded-2xl border border-slate-800 bg-ink-900/60 p-5">
        <SectionTitle>{tr(G.cardsTitle)}</SectionTitle>
        <div className="space-y-4">
          {G.cardTypes.map((c) => (
            <div
              key={c.img}
              className="grid items-start gap-4 rounded-xl bg-ink-850 p-4 sm:grid-cols-[160px_1fr]"
            >
              <div className="mx-auto w-32 sm:mx-0 sm:w-full">
                <CardFace {...SAMPLES[sampleKey(c.img)]} size="md" />
              </div>
              <div>
                <h3 className="mb-1.5 text-lg font-bold text-mantis-300">{tr(c.title)}</h3>
                <p className="text-sm leading-relaxed text-slate-300">{tr(c.body)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Playmat */}
      <section className="rounded-2xl border border-slate-800 bg-ink-900/60 p-5">
        <SectionTitle>{tr(G.seat.title)}</SectionTitle>
        <div className="mb-5">
          <PlaymatDiagram zones={G.seat.zones.map((z) => ({ n: z.n, label: tr(z.term) }))} />
        </div>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {G.seat.zones.map((z) => (
            <div key={z.n} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mantis-700 text-xs font-bold text-white">
                {z.n}
              </span>
              <div>
                <dt className="text-sm font-bold text-mantis-200">{tr(z.term)}</dt>
                <dd className="text-sm text-slate-400">{tr(z.desc)}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* How to start */}
      <section className="rounded-2xl border border-slate-800 bg-ink-900/60 p-5">
        <SectionTitle>{tr(G.start.title)}</SectionTitle>
        <div className="mb-5">
          <SetupFlow steps={G.start.flow.map((f) => ({ icon: f.icon, label: tr(f.label) }))} />
        </div>
        <ol className="space-y-3">
          {G.start.steps.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-xl bg-ink-850 p-3">
              <span className="shrink-0 text-xs font-bold text-straw-400">
                {startWord} {i + 1}
              </span>
              <p className="text-sm text-slate-300">{tr(s.body)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Victory */}
      <section className="rounded-2xl border border-slate-800 bg-ink-900/60 p-5">
        <SectionTitle>{tr(G.victory.title)}</SectionTitle>
        <p className="mb-4 text-base text-slate-200">{tr(G.victory.lead)}</p>
        <ul className="space-y-2">
          {G.victory.conds.map((c, i) => (
            <li key={i} className="flex gap-3 rounded-xl border-s-4 border-mantis-600 bg-ink-850 p-3">
              <span className="text-mantis-400" aria-hidden="true">★</span>
              <p className="text-sm text-slate-300">{tr(c)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Turn flow */}
      <section className="rounded-2xl border border-slate-800 bg-ink-900/60 p-5">
        <SectionTitle>{tr(G.phase.title)}</SectionTitle>
        <p className="mb-5 text-base text-slate-200">{tr(G.phase.lead)}</p>
        <div className="space-y-3">
          {G.phase.phases.map((p, i) => (
            <div
              key={p.key}
              className={`rounded-xl border-s-4 bg-ink-850 p-4 ${ACCENT[p.accent]}`}
            >
              <h3 className={`mb-1 font-bold ${ACCENT_TEXT[p.accent]}`}>
                {i + 1}. {tr(p.title)}
              </h3>
              <p className="text-sm text-slate-300">{tr(p.body)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Resources */}
      <section className="rounded-2xl border border-slate-800 bg-ink-900/60 p-5">
        <SectionTitle>{tr(G.guide.title)}</SectionTitle>
        <p className="mb-5 text-base text-slate-300">{tr(G.guide.lead)}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {G.guide.links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="group flex flex-col items-center gap-3 rounded-xl bg-ink-850 p-4 text-center transition hover:-translate-y-1 hover:bg-slate-800/60"
            >
              <img
                src={`${IMG}/thumbnail/${l.img}`}
                alt={tr(l.alt)}
                loading="lazy"
                className="w-full rounded-lg border border-slate-800"
              />
              <span className="inline-block rounded-lg bg-mantis-600 px-3 py-1.5 text-xs font-bold text-white transition group-hover:bg-mantis-500">
                {tr(l.cta)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
