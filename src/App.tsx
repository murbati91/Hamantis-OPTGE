import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { CollectionProvider } from './store/useCollection'
import { ProgressProvider } from './store/useProgress'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <ProgressProvider>
        <CollectionProvider>
          <RouterProvider router={router} />
        </CollectionProvider>
      </ProgressProvider>
    </ErrorBoundary>
  )
}
