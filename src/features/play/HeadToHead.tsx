import type { Card } from '../../types'
import { CardFace } from '../../components/ui/CardFace'

/**
 * Cosmetic "head-to-head" clash overlay shown for ~1.1s when an attack resolves
 * (in BOTH directions). It is purely a visualization layer: the engine still
 * resolves via apply/resolveDefense exactly as before. The outcome shown here is
 * computed read-only by the caller (Play.tsx) from the pending attack, so this
 * component just paints what it's told and never mutates game state.
 *
 * The caller skips rendering this entirely when prefers-reduced-motion is set.
 */

export interface ClashSide {
  card: Card | undefined
  power: number
  isLeader: boolean
  /** "You" / "Bot". */
  label: string
}

export interface ClashView {
  attacker: ClashSide
  defender: ClashSide
  /** Result line, e.g. "Hit!" / "Blocked" / "K.O.!" / "Survived" / "−1 Life". */
  result: string
  tone: 'good' | 'bad' | 'neutral'
}

const TONE: Record<ClashView['tone'], string> = {
  good: 'text-straw-300 border-straw-400/60 bg-straw-500/10',
  bad: 'text-rose-300 border-rose-500/60 bg-rose-500/10',
  neutral: 'text-slate-200 border-slate-600/60 bg-slate-700/20',
}

export function HeadToHead({ view }: { view: ClashView }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/75 backdrop-blur-sm">
      <style>{`
        @keyframes hamantis-clash-in-left {
          0%   { transform: translateX(-65vw) rotate(-10deg) scale(.85); opacity: 0; }
          22%  { opacity: 1; }
          46%  { transform: translateX(-2.5rem) rotate(-3deg) scale(1.04); }
          52%  { transform: translateX(0) rotate(0deg) scale(1.08); }
          64%  { transform: translateX(-1.25rem) rotate(-2deg) scale(1); }
          100% { transform: translateX(-1rem) rotate(-2deg) scale(1); opacity: 1; }
        }
        @keyframes hamantis-clash-in-right {
          0%   { transform: translateX(65vw) rotate(10deg) scale(.85); opacity: 0; }
          22%  { opacity: 1; }
          46%  { transform: translateX(2.5rem) rotate(3deg) scale(1.04); }
          52%  { transform: translateX(0) rotate(0deg) scale(1.08); }
          64%  { transform: translateX(1.25rem) rotate(2deg) scale(1); }
          100% { transform: translateX(1rem) rotate(2deg) scale(1); opacity: 1; }
        }
        @keyframes hamantis-clash-flash {
          0%, 45% { opacity: 0; transform: scale(.2); }
          52%     { opacity: 1; transform: scale(1.3); }
          70%     { opacity: .5; transform: scale(1.6); }
          100%    { opacity: 0; transform: scale(2); }
        }
        @keyframes hamantis-clash-result {
          0%, 58% { opacity: 0; transform: translateY(6px) scale(.9); }
          74%     { opacity: 1; transform: translateY(0) scale(1.06); }
          100%    { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hamantis-clash-backdrop {
          0%, 82% { opacity: 1; }
          100%    { opacity: 0; }
        }
      `}</style>

      {/* backdrop fade-out near the end so the resolve feels seamless */}
      <div
        className="absolute inset-0 bg-ink-950/40"
        style={{ animation: 'hamantis-clash-backdrop 1.15s ease-in forwards' }}
      />

      <div className="relative flex flex-col items-center gap-4">
        <div className="flex items-center justify-center gap-2 sm:gap-5">
          {/* attacker */}
          <ClashCard side={view.attacker} from="left" />

          {/* impact flash + VS */}
          <div className="relative grid h-12 w-12 place-items-center">
            <div
              className="absolute h-16 w-16 rounded-full bg-straw-300/80 blur-md"
              style={{ animation: 'hamantis-clash-flash 1.15s ease-out forwards' }}
            />
            <span className="relative text-lg font-black uppercase tracking-tight text-white drop-shadow">VS</span>
          </div>

          {/* defender */}
          <ClashCard side={view.defender} from="right" />
        </div>

        {/* result line */}
        <div
          className={`rounded-full border px-4 py-1.5 text-sm font-bold uppercase tracking-wide shadow-lg ${TONE[view.tone]}`}
          style={{ animation: 'hamantis-clash-result 1.15s ease-out forwards' }}
        >
          {view.result}
        </div>
      </div>
    </div>
  )
}

function ClashCard({ side, from }: { side: ClashSide; from: 'left' | 'right' }) {
  const anim = from === 'left' ? 'hamantis-clash-in-left' : 'hamantis-clash-in-right'
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-24 sm:w-28" style={{ animation: `${anim} 1.15s cubic-bezier(.4,1.4,.5,1) forwards` }}>
        <CardFace card={side.card} power={side.power} size="md" />
      </div>
      <div className="flex items-center gap-1 text-[0.7rem] font-semibold text-slate-300">
        <span className="text-slate-400">{side.label}</span>
        <span className="rounded bg-mantis-700/80 px-1.5 py-0.5 font-bold text-white">{side.power}</span>
      </div>
    </div>
  )
}
