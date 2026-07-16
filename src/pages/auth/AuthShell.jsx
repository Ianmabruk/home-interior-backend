import { Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Outlet } from 'react-router-dom'

const AuthLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
  </div>
)

export const AuthShell = () => {
  return (
    <div className="grid min-h-screen bg-[var(--bg)] md:grid-cols-2">
      {/* Left image panel */}
      <div className="relative hidden overflow-hidden md:block">
        <img
          src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80"
          alt="Luxury interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/70 via-[var(--primary)]/20 to-[var(--primary)]/10" />
        <div className="absolute bottom-12 left-12 max-w-sm">
          <Link to="/">
            <div className="flex flex-col items-start">
              <p className="font-display text-4xl font-medium tracking-[0.25em] text-white">HOK</p>
              <p className="font-sans text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--accent)] -mt-1">INTERIOR DESIGNS</p>
            </div>
          </Link>
          <p className="mt-6 font-display text-3xl font-normal leading-snug text-white/85">
            Timeless interiors, designed for a life well lived.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center px-6 py-16 md:px-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-10 md:hidden">
            <Link to="/">
              <div className="flex flex-col items-center">
                <p className="font-display text-3xl font-medium tracking-[0.25em] text-[var(--primary)]">HOK</p>
                <p className="font-sans text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--accent)] -mt-1">INTERIOR DESIGNS</p>
              </div>
            </Link>
          </div>
          <Suspense fallback={<AuthLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  )
}