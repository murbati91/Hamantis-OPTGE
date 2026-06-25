import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProgress, BADGES, xpIntoLevel } from '../store/useProgress'
import {
  QUIZ_BANK,
  MULLIGAN_BANK,
  WINCON_BANK,
  type QuizScenario,
  type MulliganScenario,
  type WinConScenario,
} from '../data/trainingScenarios'
import { DAILY_QUESTS } from '../types'
import {
  makeAttackProblem,
  cardAdvantageNote,
  type AttackProblem,
} from '../features/training/attackMath'

type Tab = 'Quizzes' | 'Attack Math' | 'Mulligan' | 'Win Cons'
const TABS: Tab[] = ['Quizzes', 'Attack Math', 'Mulligan', 'Win Cons']

export function TrainingArena() {
  const { xp, level, title, badges, training, addXp, awardBadge, recordTraining } =
    useProgress()
  const [tab, setTab] = useState<Tab>('Quizzes')

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-2xl border border-mantis-800/50 bg-gradient-to-br from-mantis-900/50 to-ink-900 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-mantis-300">{title}</div>
            <div className="text-2xl font-bold text-mantis-100">Level {level}</div>
            <div className="mt-1 text-xs text-slate-400">
              {xp} XP · {xpIntoLevel(xp)}/100 to next
            </div>
          </div>
          <div className="text-4xl">🎯</div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink-950">
          <div
            className="h-full rounded-full bg-mantis-500 transition-all"
            style={{ width: `${xpIntoLevel(xp)}%` }}
          />
        </div>
      </section>

      {/* Streak + Daily Quests */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Streak
          </h2>
          <div className="flex items-end gap-4">
            <div>
              <div className="text-3xl font-bold text-mantis-100">
                🔥 {training.streak}
              </div>
              <div className="text-xs text-slate-500">day streak</div>
            </div>
            <div className="pb-1">
              <div className="text-lg font-semibold text-slate-200">
                {training.bestStreak}
              </div>
              <div className="text-xs text-slate-500">best</div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Daily Quests
          </h2>
          <div className="space-y-3">
            {DAILY_QUESTS.map((q) => {
              const done = training.questsCompletedToday.includes(q.id)
              const progress = Math.min(
                training.dailyCounts[q.metric] ?? 0,
                q.goal,
              )
              const pct = Math.round((progress / q.goal) * 100)
              return (
                <div key={q.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={done ? 'text-mantis-300' : 'text-slate-300'}>
                      {done ? '✓ ' : ''}
                      {q.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {progress}/{q.goal} · +{q.xp}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-950">
                    <div
                      className={`h-full rounded-full transition-all ${
                        done ? 'bg-mantis-400' : 'bg-mantis-700'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t
                ? 'bg-mantis-600 text-white'
                : 'border border-slate-700 bg-ink-850 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Quizzes' && (
        <section className="space-y-3">
          {QUIZ_BANK.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onCorrect={() => {
                recordTraining('quizzesAnswered', 10)
                if (quiz.badge) awardBadge(quiz.badge)
              }}
            />
          ))}
        </section>
      )}

      {tab === 'Attack Math' && (
        <section className="space-y-3">
          <p className="text-sm text-slate-400">
            How many counter cards (1000 / 2000) do you spend to survive? Mind the
            5000 / 6000 / 7000 / 8000 breakpoints — and the card advantage you trade.
          </p>
          {Array.from({ length: 8 }, (_, i) => makeAttackProblem(i)).map((p, i) => (
            <AttackCard
              key={i}
              problem={p}
              onCorrect={() => {
                recordTraining('attackMathSolved', 10)
                awardBadge('2k-master')
              }}
            />
          ))}
        </section>
      )}

      {tab === 'Mulligan' && (
        <section className="space-y-3">
          <p className="text-sm text-slate-400">Keep or mulligan this opening hand?</p>
          {MULLIGAN_BANK.map((m) => (
            <MulliganCard
              key={m.id}
              scenario={m}
              onDecide={(correct) => recordTraining('mulligansDecided', correct ? 12 : 8)}
            />
          ))}
        </section>
      )}

      {tab === 'Win Cons' && (
        <section className="space-y-3">
          <p className="text-sm text-slate-400">Identify the correct line to close the game.</p>
          {WINCON_BANK.map((w) => (
            <WinConCard key={w.id} scenario={w} onCorrect={() => addXp(10)} />
          ))}
        </section>
      )}

      {/* Sealed practice link */}
      <section className="rounded-2xl border border-slate-800 bg-ink-850/50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-mantis-100">Sealed practice 📦</h3>
            <p className="mt-1 text-sm text-slate-400">
              Tune your 2K-counter count with the What-If simulator.
            </p>
          </div>
          <Link
            to="/sealed"
            className="shrink-0 rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500"
          >
            Open
          </Link>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Badges ({badges.length}/{BADGES.length})
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map((b) => {
            const earned = badges.includes(b.id)
            return (
              <div
                key={b.id}
                className={`rounded-xl border p-3 ${
                  earned
                    ? 'border-mantis-600/60 bg-mantis-900/30'
                    : 'border-slate-800 bg-ink-850/40 opacity-60'
                }`}
              >
                <div className="text-2xl">{earned ? b.icon : '🔒'}</div>
                <div className="mt-1 text-sm font-semibold text-slate-100">{b.name}</div>
                <div className="text-xs text-slate-500">{b.description}</div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

/** Shared multiple-choice option button styling. */
function optionClass(answered: boolean, isAnswer: boolean, isPicked: boolean): string {
  if (answered && isAnswer) return 'border-mantis-500 bg-mantis-800/50 text-mantis-100'
  if (answered && isPicked) return 'border-rose-600 bg-rose-900/40 text-rose-200'
  if (answered) return 'border-slate-800 bg-ink-850 text-slate-500'
  return 'border-slate-700 bg-ink-850 text-slate-200 hover:bg-slate-800'
}

function Explain({ correct, text }: { correct: boolean; text: string }) {
  return (
    <p
      className={`mt-3 rounded-lg p-3 text-sm ${
        correct ? 'bg-mantis-900/40 text-mantis-200' : 'bg-amber-900/30 text-amber-200'
      }`}
    >
      {correct ? '✓ ' : 'ⓘ '}
      {text}
    </p>
  )
}

function QuizCard({ quiz, onCorrect }: { quiz: QuizScenario; onCorrect: () => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const answered = picked !== null
  const correct = picked === quiz.answer

  const choose = (i: number) => {
    if (answered) return
    setPicked(i)
    if (i === quiz.answer) onCorrect()
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
      <p className="font-medium text-slate-100">{quiz.question}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {quiz.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => choose(i)}
            disabled={answered}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${optionClass(
              answered,
              i === quiz.answer,
              i === picked,
            )}`}
          >
            {opt}
          </button>
        ))}
      </div>
      {answered && (
        <Explain correct={correct} text={`${correct ? '+10 XP — ' : ''}${quiz.explain}`} />
      )}
    </div>
  )
}

/** Build 4 distinct, non-negative answer options that include the correct count. */
function buildCountOptions(correct: number): number[] {
  const set = new Set<number>([correct])
  const deltas = [1, 2, 3, -1, -2, 4]
  for (const d of deltas) {
    if (set.size >= 4) break
    const v = correct + d
    if (v >= 0) set.add(v)
  }
  let fill = 0
  while (set.size < 4) {
    if (fill >= 0) set.add(fill)
    fill++
  }
  return [...set].sort((a, b) => a - b)
}

function AttackCard({
  problem,
  onCorrect,
}: {
  problem: AttackProblem
  onCorrect: () => void
}) {
  const options = useMemo(() => buildCountOptions(problem.minCards), [problem.minCards])
  const [picked, setPicked] = useState<number | null>(null)
  const answered = picked !== null
  const correct = picked === problem.minCards

  const choose = (val: number) => {
    if (answered) return
    setPicked(val)
    if (val === problem.minCards) onCorrect()
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
      <p className="font-medium text-slate-100">
        Attacker{' '}
        <span className="font-bold text-mantis-200">{problem.attacker}</span> attacks your{' '}
        <span className="font-bold text-mantis-200">{problem.defender}</span> character.
        How many counter cards (1000 / 2000) to survive?
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((val) => (
          <button
            key={val}
            onClick={() => choose(val)}
            disabled={answered}
            className={`rounded-lg border px-3 py-2 text-center text-sm transition ${optionClass(
              answered,
              val === problem.minCards,
              val === picked,
            )}`}
          >
            {val === 0 ? 'None' : `${val} card${val > 1 ? 's' : ''}`}
          </button>
        ))}
      </div>
      {answered && (
        <Explain
          correct={correct}
          text={`${correct ? '+10 XP — ' : ''}${cardAdvantageNote(problem)}`}
        />
      )}
    </div>
  )
}

function MulliganCard({
  scenario,
  onDecide,
}: {
  scenario: MulliganScenario
  onDecide: (correct: boolean) => void
}) {
  const [decided, setDecided] = useState<boolean | null>(null)
  const answered = decided !== null
  const correct = decided === scenario.keep

  const decide = (keep: boolean) => {
    if (answered) return
    setDecided(keep)
    onDecide(keep === scenario.keep)
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
      <p className="text-sm text-slate-400">{scenario.context}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {scenario.hand.map((card, i) => (
          <span
            key={i}
            className="rounded-lg border border-slate-700 bg-ink-900 px-2 py-1 text-xs text-slate-200"
          >
            {card}
          </span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => decide(true)}
          disabled={answered}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${optionClass(
            answered,
            scenario.keep === true,
            decided === true,
          )}`}
        >
          Keep
        </button>
        <button
          onClick={() => decide(false)}
          disabled={answered}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${optionClass(
            answered,
            scenario.keep === false,
            decided === false,
          )}`}
        >
          Mulligan
        </button>
      </div>
      {answered && (
        <Explain
          correct={correct}
          text={`${correct ? '+12 XP — ' : ''}${scenario.explain}`}
        />
      )}
    </div>
  )
}

function WinConCard({
  scenario,
  onCorrect,
}: {
  scenario: WinConScenario
  onCorrect: () => void
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const answered = picked !== null
  const correct = picked === scenario.answer

  const choose = (i: number) => {
    if (answered) return
    setPicked(i)
    if (i === scenario.answer) onCorrect()
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
      <p className="font-medium text-slate-100">{scenario.board}</p>
      <div className="mt-3 grid gap-2">
        {scenario.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => choose(i)}
            disabled={answered}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${optionClass(
              answered,
              i === scenario.answer,
              i === picked,
            )}`}
          >
            {opt}
          </button>
        ))}
      </div>
      {answered && (
        <Explain correct={correct} text={`${correct ? '+10 XP — ' : ''}${scenario.explain}`} />
      )}
    </div>
  )
}
