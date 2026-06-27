import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Wallet } from './pages/Wallet'
import { CardDetail } from './pages/CardDetail'
import { AddEditCard } from './pages/AddEditCard'
import { SealedSimulator } from './pages/SealedSimulator'
import { TrainingArena } from './pages/TrainingArena'
import { Settings } from './pages/Settings'
import { DeckBuilder } from './pages/DeckBuilder'
import { MatchTracker } from './pages/MatchTracker'
import { Tournament } from './pages/Tournament'
import { Glossary } from './pages/Glossary'
import { Play } from './pages/Play'
import { PlayGuide } from './pages/PlayGuide'
import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="text-4xl">🧭</div>
      <h1 className="mt-3 text-xl font-bold text-mantis-100">Page not found</h1>
      <p className="mt-2 text-sm text-slate-400">That page doesn’t exist or has moved.</p>
      <Link
        to="/"
        className="mt-5 inline-block rounded-lg bg-mantis-600 px-4 py-2 text-sm font-medium text-white hover:bg-mantis-500"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'wallet', element: <Wallet /> },
      { path: 'card/:id', element: <CardDetail /> },
      { path: 'add', element: <AddEditCard /> },
      { path: 'edit/:id', element: <AddEditCard /> },
      { path: 'sealed', element: <SealedSimulator /> },
      { path: 'training', element: <TrainingArena /> },
      { path: 'deck-builder', element: <DeckBuilder /> },
      { path: 'matches', element: <MatchTracker /> },
      { path: 'tournament', element: <Tournament /> },
      { path: 'play', element: <Play /> },
      { path: 'glossary', element: <Glossary /> },
      { path: 'play-guide', element: <PlayGuide /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
