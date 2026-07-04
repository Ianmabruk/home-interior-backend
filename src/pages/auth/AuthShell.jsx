import { Link } from 'react-router-dom'
import { Outlet } from 'react-router-dom'

export const AuthShell = () => {
  return (
    <div className="grid min-h-screen bg-cream md:grid-cols-2">
      {/* Left image panel */}
      <div className="relative hidden overflow-hidden md:block">
        <img
          src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80"
          alt="Luxury interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-ink/10" />
        <div className="absolute bottom-12 left-12 max-w-sm">
          <Link to="/">
            <p className="font-display text-4xl font-semibold text-white">HOK</p>
            <p className="text-2xs font-medium uppercase tracking-widest text-orange">Interior Designs</p>
          </Link>
          <p className="mt-6 font-display text-3xl font-medium leading-snug text-white/85">
            Luxury spaces begin here.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center px-6 py-16 md:px-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-10 md:hidden">
            <Link to="/">
              <p className="font-display text-3xl font-semibold text-ink">HOK</p>
              <p className="text-2xs font-medium uppercase tracking-widest text-orange">Interior Designs</p>
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
