import { User, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/virtual-interior-design', label: 'Virtual Interior Design' },
  { to: '/about', label: 'About' },
]

export const Navbar = () => {
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  useEffect(() => {
    setProfileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!profileOpen) return
    const handler = (e) => {
      if (!e.target.closest('[data-profile-menu]')) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-bgPrimary/98 shadow-soft backdrop-blur-sm' : 'bg-bgPrimary/95 backdrop-blur-sm'
      }`}
    >
      <div className="container-wide flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 leading-tight">
          <p className="font-display text-2xl font-semibold tracking-wide text-textPrimaryDark md:text-3xl">HOK</p>
          <p className="text-2xs font-medium uppercase tracking-widest text-accent">Interior Designs</p>
        </Link>

        {/* Desktop Nav — center */}
        <nav className="hidden items-center gap-8 md:flex lg:gap-10">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative text-2xs font-medium uppercase tracking-widest transition-colors duration-200 after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-textPrimaryDark after:transition-all after:duration-300 hover:scale-105 transform-gpu ${
                  isActive
                    ? 'text-textPrimaryDark after:w-full'
                    : 'text-textPrimaryDark/50 hover:text-textPrimaryDark after:w-0 hover:after:w-full'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions — right */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="h-5 w-px bg-border" />
          <Link to="/shop" className="btn-accent text-2xs">
            Shop With Us
          </Link>
          <div className="relative ml-1" data-profile-menu>
            <button
              className="flex items-center gap-1 p-2.5 text-textPrimaryDark/55 transition-colors hover:text-textPrimaryDark"
              onClick={() => setProfileOpen((p) => !p)}
              aria-label="Account"
              aria-expanded={profileOpen}
            >
              <User size={17} strokeWidth={1.5} />
              <ChevronDown
                size={11}
                strokeWidth={2}
                className={`transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1 w-52 border border-border bg-white py-1 shadow-lift"
                >
                  {!user ? (
                    <>
                      <Link to="/login" className="block px-5 py-3 text-xs font-medium uppercase tracking-wider text-textPrimaryDark/65 transition hover:bg-linen hover:text-textPrimaryDark">
                        Login
                      </Link>
                      <Link to="/register" className="block px-5 py-3 text-xs font-medium uppercase tracking-wider text-textPrimaryDark/65 transition hover:bg-linen hover:text-textPrimaryDark">
                        Sign Up
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={logout}
                      className="w-full border-t border-border px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-textPrimaryDark/65 transition hover:bg-linen hover:text-textPrimaryDark"
                    >
                      Sign Out
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: Shop With Us + account icon */}
        <div className="flex items-center gap-2 md:hidden">
          <Link to="/shop" className="btn-accent text-2xs py-2 px-4">
            Shop With Us
          </Link>
          <div className="relative" data-profile-menu>
            <button
              className="p-2 text-textPrimaryDark"
              onClick={() => setProfileOpen((p) => !p)}
              aria-label="Account"
            >
              <User size={20} strokeWidth={1.5} />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1 w-52 border border-border bg-white py-1 shadow-lift"
                >
                  {!user ? (
                    <>
                      <Link to="/login" className="block px-5 py-3 text-xs font-medium text-textPrimaryDark/65 transition hover:bg-linen">Login</Link>
                      <Link to="/register" className="block px-5 py-3 text-xs font-medium text-textPrimaryDark/65 transition hover:bg-linen">Sign Up</Link>
                    </>
                  ) : (
                    <button onClick={logout} className="w-full border-t border-border px-5 py-3 text-left text-xs font-medium text-textPrimaryDark/65 transition hover:bg-linen">Sign Out</button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
