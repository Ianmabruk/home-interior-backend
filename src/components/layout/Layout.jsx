import { Suspense, lazy } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from '../Footer'
import { Navbar } from '../Navbar'
import { ErrorBoundary } from '../common/ErrorBoundary'

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-borderSubtle border-t-accent" />
  </div>
)

const ErrorFallback = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
    <p className="font-display text-2xl text-espresso">Something went wrong</p>
    <p className="mt-2 text-sm text-stone">Failed to load this page.</p>
    <button
      onClick={() => window.location.reload()}
      className="mt-6 rounded-full bg-forest px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-forestDark"
    >
      Reload Page
    </button>
  </div>
)

export const Layout = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-cream text-espresso flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col pt-16 md:pt-18">
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </Suspense>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  )
}
