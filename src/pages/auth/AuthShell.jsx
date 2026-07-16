import { Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Outlet } from 'react-router-dom'

const AuthLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-linen border-t-bronze" />
  </div>
)

export const AuthShell = () => {
  return (
    <div className="grid min-h-screen bg-warm-ivory md:grid-cols-2">
      {/* Left image panel */}
      <div className="relative hidden overflow-hidden md:block">
        <img
          src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80"
          alt="Luxury interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-text/70 via-luxury-text/20 to-luxury-text/10" />
        <div className="absolute bottom-12 left-12 max-w-sm">
          <Link to="/">
            <p className="font-display text-4xl font-normal tracking-luxury text-white">HOK INTERIORS</p>
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
              <p className="font-display text-3xl font-normal tracking-luxury text-luxury-text">HOK INTERIORS</p>
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