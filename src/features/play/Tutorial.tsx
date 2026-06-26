import { useState } from 'react'

/**
 * First-time guide for the Practice Duel. Shown once automatically (persisted via
 * the 'hamantis.play.tutorialSeen' localStorage flag, handled by the caller) and
 * re-openable any time from the "?" help button. Red/gold themed, skippable,
 * with Next / Got it navigation. Transitions are disabled under reduced-motion.
 */

interface Step {
  icon: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    icon: '⚡',
    title: 'Ramp DON & play characters',
    body: 'In your main phase, tap your own cards to attach DON (+1000 power), or tap a character in your hand whose ◆cost you can afford to play it to the board.',
  },
  {
    icon: '🎯',
    title: 'Go to attacks',
    body: 'Press “Go to attacks”, then tap an un-rested character or your Leader, and tap an enemy target — the bot Leader or one of its rested characters.',
  },
  {
    icon: '🛡',
    title: 'Defend the bot’s turn',
    body: 'When the bot attacks you, Block with a Blocker on your board or play a Counter from your hand to add power — then press Resolve to settle the clash.',
  },
  {
    icon: '🏴‍☠️',
    title: 'Win the duel',
    body: 'Reduce the opponent’s life to 0, then land one more hit on their Leader to take the game. Lose your own life the same way — so trade wisely!',
  },
]

export function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const last = step === STEPS.length - 1
  const s = STEPS[step]

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="How to play the Practice Duel">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-straw-400/40 bg-ink-900 shadow-2xl shadow-black/60 motion-safe:transition-all">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-mantis-700/40 to-ink-900 px-4 py-3">
          <h2 className="text-sm font-bold text-mantis-100">How to play</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Skip
          </button>
        </div>

        {/* body */}
        <div className="px-5 py-5 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-straw-300/60 bg-mantis-900/40 text-3xl">
            {s.icon}
          </div>
          <h3 className="mt-3 text-base font-bold text-straw-200">{s.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{s.body}</p>
        </div>

        {/* dots */}
        <div className="flex justify-center gap-1.5 pb-1">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full motion-safe:transition-all ${i === step ? 'w-5 bg-straw-400' : 'w-1.5 bg-slate-700'}`}
            />
          ))}
        </div>

        {/* footer */}
        <div className="flex gap-2 px-5 pb-5 pt-3">
          {step > 0 && (
            <button
              onClick={() => setStep((n) => Math.max(0, n - 1))}
              className="flex-1 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (last ? onClose() : setStep((n) => Math.min(STEPS.length - 1, n + 1)))}
            className="flex-1 rounded-lg bg-mantis-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-mantis-500"
          >
            {last ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
