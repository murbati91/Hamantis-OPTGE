import { useState } from 'react'
import { useCollection } from '../store/useCollection'
import { usePWAInstall } from '../lib/usePWAInstall'
import { importApitcgSet, importAllApitcg, type ImportProgress } from '../lib/apitcg'
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, HAS_DEFAULT_SUPABASE } from '../config'
import { pushAll, pullAll } from '../lib/supabaseSync'
import { useUser } from '@clerk/clerk-react'

export function Settings() {
  const { settings, setSettings, entries, customCards } = useCollection()
  const { platform, installed, canPrompt, promptInstall } = usePWAInstall()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Privacy & data
        </h2>
        <div className="space-y-2">
          <ToggleRow
            label="Private mode"
            hint="Keep all collection data on this device. No login, no sync."
            checked={settings.privateMode}
            onChange={(v) => setSettings({ privateMode: v })}
          />
          <ToggleRow
            label="Allow remote card images"
            hint="When off, only generated placeholders are shown (best for full offline / privacy)."
            checked={settings.allowRemoteImages}
            onChange={(v) => setSettings({ allowRemoteImages: v })}
          />
          <ToggleRow
            label="Show all reference cards"
            hint="The full real card pool — every set OP01–OP16 plus EB / PRB / ST (2,400+ cards) for browsing & sealed practice. Turn off to see only cards you own."
            checked={settings.showDemoCards}
            onChange={(v) => setSettings({ showDemoCards: v })}
          />
        </div>
      </section>

      <ApitcgImport />

      <CloudSync />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          App install
        </h2>
        <div className="rounded-2xl border border-slate-800 bg-ink-850/50 p-4 text-sm text-slate-300">
          {installed ? (
            <p>✓ Installed and running as an app.</p>
          ) : platform === 'ios' ? (
            <div className="space-y-1">
              <p>To install on iPhone / iPad:</p>
              <ol className="ml-4 list-decimal text-slate-400">
                <li>Tap the Share button in Safari.</li>
                <li>Choose "Add to Home Screen".</li>
                <li>Tap "Add".</li>
              </ol>
            </div>
          ) : canPrompt ? (
            <button
              onClick={() => void promptInstall()}
              className="rounded-lg bg-mantis-600 px-4 py-2 font-medium text-white hover:bg-mantis-500"
            >
              Install App
            </button>
          ) : (
            <p className="text-slate-400">
              Install is available from your browser menu (look for "Install" / "Add to Home
              Screen").
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Storage
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800 bg-ink-850/50 p-3">
            <div className="text-2xl font-bold text-mantis-100">{Object.keys(entries).length}</div>
            <div className="text-xs text-slate-500">owned entries (IndexedDB)</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-ink-850/50 p-3">
            <div className="text-2xl font-bold text-mantis-100">{customCards.length}</div>
            <div className="text-xs text-slate-500">custom cards</div>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-slate-600">
        One Piece TCG GCC · local-first · fan-made, unofficial · v0.1
      </p>
    </div>
  )
}

function CloudSync() {
  const { settings, setSettings, applySync, entries, customCards, decks, matches, tournaments } =
    useCollection()
  const cfg = {
    url: settings.supabaseUrl || DEFAULT_SUPABASE_URL,
    anonKey: settings.supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY,
  }
  const configured = !!(cfg.url && cfg.anonKey)
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress

  const [phase, setPhase] = useState<'idle' | 'syncing'>('idle')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const busy = phase === 'syncing'

  const fail = (e: unknown) => {
    setErr(e instanceof Error ? e.message : 'Something went wrong.')
    setPhase('idle')
  }

  const push = async () => {
    setErr('')
    setMsg('')
    setPhase('syncing')
    try {
      await pushAll(cfg, {
        entries: Object.values(entries),
        customCards: customCards.filter((c) => !c.isDemo), // only your own cards
        decks,
        matches,
        tournaments,
      })
      setPhase('idle')
      setMsg('✓ Pushed your collection to the cloud.')
    } catch (e) {
      fail(e)
    }
  }

  const pull = async () => {
    setErr('')
    setMsg('')
    setPhase('syncing')
    try {
      const data = await pullAll(cfg)
      await applySync(data)
      setPhase('idle')
      setMsg(
        `✓ Pulled ${data.entries.length} owned cards, ${data.decks.length} decks, ${data.matches.length} matches, ${data.tournaments.length} tournaments.`,
      )
    } catch (e) {
      fail(e)
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Cloud sync (optional)
      </h2>
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
        <p className="text-xs text-slate-500">
          {HAS_DEFAULT_SUPABASE
            ? 'This app is pre-connected to a sync backend — just sign in with your email below to back up and sync your collection across devices. (Advanced: override with your own Supabase project.)'
            : 'Back up and sync your collection across devices with your own Supabase project. Off by default — the app stays local-first. Your URL + key live only on this device.'}
        </p>

        {!HAS_DEFAULT_SUPABASE && (
          <>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-400">Supabase project URL</span>
              <input
                value={settings.supabaseUrl ?? ''}
                onChange={(e) => setSettings({ supabaseUrl: e.target.value })}
                placeholder="https://xxxx.supabase.co"
                className={inputCls}
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-400">Supabase anon key</span>
              <input
                type="password"
                value={settings.supabaseAnonKey ?? ''}
                onChange={(e) => setSettings({ supabaseAnonKey: e.target.value })}
                placeholder="eyJhbGci…"
                className={inputCls}
                autoComplete="off"
              />
            </label>
          </>
        )}

        {!configured ? (
          <p className="text-xs text-slate-500">Cloud sync backend isn’t configured.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-mantis-300">
              Synced to your account{email ? ` (${email})` : ''}.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void push()}
                disabled={busy}
                className="flex-1 rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500 disabled:opacity-40 sm:flex-none"
              >
                {phase === 'syncing' ? 'Syncing…' : 'Push to cloud'}
              </button>
              <button
                onClick={() => void pull()}
                disabled={busy}
                className="flex-1 rounded-lg border border-mantis-600 px-4 py-2 text-sm font-medium text-mantis-200 hover:bg-mantis-900/40 disabled:opacity-40 sm:flex-none"
              >
                Pull from cloud
              </button>
            </div>
          </div>
        )}

        {msg && <p className="text-xs text-mantis-300">{msg}</p>}
        {err && <p className="text-xs text-rose-300">{err}</p>}
      </div>
    </section>
  )
}

function ApitcgImport() {
  const { settings, setSettings, importCards } = useCollection()
  const [setCode, setSetCode] = useState('OP12')
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [status, setStatus] = useState<'idle' | 'running' | 'all' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const key = settings.apitcgKey ?? ''
  const busy = status === 'running' || status === 'all'

  const run = async () => {
    setStatus('running')
    setMessage('')
    setProgress(null)
    try {
      const cards = await importApitcgSet(setCode, key, (p) => setProgress(p))
      if (!cards.length) {
        setStatus('error')
        setMessage(
          `No cards found for "${setCode.toUpperCase()}". apitcg may not have this set yet (it lags newer releases). All sets OP01–OP16 + EB/PRB/ST are already built in, so this is optional.`,
        )
        return
      }
      await importCards(cards)
      setStatus('done')
      setMessage(`Imported ${cards.length} cards from ${setCode.toUpperCase()}. They’re now in your Wallet.`)
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Import failed.')
    }
  }

  const runAll = async () => {
    setStatus('all')
    setMessage('')
    setProgress(null)
    try {
      const { cards, perSet } = await importAllApitcg(key, (p) => setProgress(p))
      if (!cards.length) {
        setStatus('error')
        setMessage('No cards found. Check your API key.')
        return
      }
      await importCards(cards)
      setStatus('done')
      const sets = perSet.map((s) => `${s.set} (${s.count})`).join(', ')
      setMessage(`Imported ${cards.length} cards across ${perSet.length} sets: ${sets}.`)
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Import failed.')
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Import card sets (apitcg)
      </h2>
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
        <p className="text-xs text-slate-500">
          Pull real card data straight from{' '}
          <a href="https://apitcg.com/platform" target="_blank" rel="noreferrer" className="text-mantis-400 hover:underline">
            apitcg.com
          </a>
          . Your key is stored only on this device. Uses ~25 paged requests for the whole
          catalogue (free tier = 1,000 requests/month). Optional — every set OP01–OP16 plus
          EB / PRB / ST is already built in; use this only to pull a fresh copy of a set.
        </p>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">apitcg API key</span>
          <input
            type="password"
            value={key}
            onChange={(e) => setSettings({ apitcgKey: e.target.value })}
            placeholder="paste your x-api-key"
            className={inputCls}
            autoComplete="off"
          />
        </label>

        <div className="flex items-end gap-2">
          <label className="block flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-400">Set code</span>
            <input
              value={setCode}
              onChange={(e) => setSetCode(e.target.value)}
              placeholder="OP12 / EB02 / ST15"
              className={inputCls}
            />
          </label>
          <button
            onClick={() => void run()}
            disabled={busy || !key.trim()}
            className="rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500 disabled:opacity-40"
          >
            {status === 'running' ? 'Importing…' : 'Import set'}
          </button>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
          <button
            onClick={() => void runAll()}
            disabled={busy || !key.trim()}
            className="rounded-lg border border-mantis-600 px-4 py-2 text-sm font-medium text-mantis-200 hover:bg-mantis-900/40 disabled:opacity-40"
          >
            {status === 'all' ? 'Importing all…' : 'Import ALL available sets'}
          </button>
          <span className="text-xs text-slate-500">
            Every OP / EB / ST set apitcg has, in ~25 paged requests.
          </span>
        </div>

        {busy && progress && (
          <p className="text-xs text-slate-400">
            Fetching page {progress.page}/{progress.totalPages} · {progress.found} cards so far…
          </p>
        )}
        {busy && !progress && <p className="text-xs text-slate-400">Starting…</p>}
        {status === 'done' && <p className="text-xs text-mantis-300">✓ {message}</p>}
        {status === 'error' && <p className="text-xs text-rose-300">{message}</p>}
      </div>
    </section>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-700 bg-ink-850 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-mantis-600 focus:outline-none'

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-ink-850/50 p-4">
      <div>
        <div className="text-sm font-medium text-slate-100">{label}</div>
        <div className="text-xs text-slate-500">{hint}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-mantis-500"
      />
    </label>
  )
}
