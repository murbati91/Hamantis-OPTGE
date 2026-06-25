import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/**
 * Catches render-time exceptions so a single bad record or component throw
 * shows a recoverable fallback instead of a blank white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('App crashed:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center text-slate-200">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="max-w-sm text-sm text-slate-400">
            The app hit an unexpected error. Your collection is safe on this
            device — reloading usually fixes it.
          </p>
          <pre className="max-w-sm overflow-auto rounded-lg bg-ink-900 p-3 text-left text-xs text-rose-300">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
