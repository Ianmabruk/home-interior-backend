import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, User, LogIn, UserPlus, LayoutDashboard } from 'lucide-react'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { to: '/shop', label: 'Shop', icon: null },
  { to: '/virtual-interior-design', label: 'Virtual Interior Design', icon: null },
  { to: '/about', label: 'About', icon: null },
]

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [location])

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)]'
          : 'bg-white/80 backdrop-blur-xl'
      }`}
    >
      <div className="container-wide flex items-center justify-between px-6 md:px-12 lg:px-20">
        <Link to="/" className="flex-shrink-0 leading-tight group" aria-label="HOK Interior Designs - Home">
          <p className="font-['Playfair_Display'] text-2xl md:text-3xl font-semibold tracking-wide text-[#2A1D17] transition-colors duration-300 group-hover:text-forest">
            HOK
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-bronze transition-colors duration-300 group-hover:text-bronzeDark">
            Interior Designs
          </p>
        </Link>

        <nav className="hidden items-center gap-2 md:flex lg:gap-4" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`relative px-4 py-2.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-300 ${
                location.pathname === item.to
                  ? 'bg-forest text-white shadow-[0_4px_20px_rgba(31,77,58,0.2)]'
                  : 'text-[#2A1D17]/80 hover:bg-secondary/60 hover:text-forest'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <div className="relative" role="menu" aria-label="User menu">
            <button
              onClick={() => setUserMenuOpen((p) => !p)}
              className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2A1D17]/80 transition-all duration-300 hover:bg-secondary/60 hover:text-forest"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label="User menu"
            >
              <User size={14} strokeWidth={1.5} />
              <span className="hidden sm:inline">Account</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-border overflow-hidden z-50"
                  role="menu"
                >
                  <Link
                    to="/login"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-charcoal hover:bg-secondary/60 transition-colors"
                    role="menuitem"
                  >
                    <LogIn size={16} strokeWidth={1.5} className="text-bronze" />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-charcoal hover:bg-secondary/60 transition-colors"
                    role="menuitem"
                  >
                    <UserPlus size={16} strokeWidth={1.5} className="text-bronze" />
                    Register
                  </Link>
                  <Link
                    to="/account"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-charcoal hover:bg-secondary/60 transition-colors"
                    role="menuitem"
                  >
                    <LayoutDashboard size={16} strokeWidth={1.5} className="text-bronze" />
                    My Account
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>

        <button
          className="flex items-center justify-center p-2 text-charcoal md:hidden transition-colors duration-200 hover:text-bronze"
          onClick={() => setMobileOpen((p) => !p)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
        </button>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-forest/30 backdrop-blur-sm transition-all duration-300 md:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-80 bg-white shadow-2xl transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="font-['Playfair_Display'] text-xl font-semibold text-charcoal">HOK</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-bronze">Interior Designs</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-2 text-charcoal hover:text-bronze transition-colors" aria-label="Close menu">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>
        <nav className="flex flex-col px-6 py-8 gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`text-lg font-['Playfair_Display'] font-medium transition-colors ${
                location.pathname === item.to ? 'text-forest' : 'text-charcoal hover:text-bronze'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-charcoal hover:text-bronze transition-colors"
            >
              <LogIn size={16} strokeWidth={1.5} className="text-bronze" />
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-charcoal hover:text-bronze transition-colors"
            >
              <UserPlus size={16} strokeWidth={1.5} className="text-bronze" />
              Register
            </Link>
            <Link
              to="/account"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-charcoal hover:text-bronze transition-colors"
            >
              <LayoutDashboard size={16} strokeWidth={1.5} className="text-bronze" />
              My Account
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}