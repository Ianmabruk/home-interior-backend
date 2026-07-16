import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ShoppingBag,
  Sparkles,
  Info,
  User,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
  { to: '/virtual-interior-design', label: 'Virtual Interior Design', icon: Sparkles },
  { to: '/about', label: 'About Us', icon: Info },
]

const LOGGED_OUT_ITEMS = [
  { to: '/account', label: 'My Account', icon: LayoutDashboard },
  { to: '/register', label: 'Sign Up', icon: UserPlus },
  { to: '/login', label: 'Login', icon: LogIn },
]

export const Navbar = () => {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenus = useCallback(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [])

  useEffect(() => {
    closeMenus()
  }, [location, closeMenus])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
  }

  return (
    <header
      ref={navRef}
      className={`relative w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-[#E6D8C9]/40 shadow-[0_8px_32px_rgba(27,23,20,0.08)]'
          : 'bg-white/70 backdrop-blur-lg border-b border-[#E6D8C9]/30'
      }`}
      role="banner"
      style={{ willChange: 'transform, box-shadow, background' }}
    >
      <div className="container-wide mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-[88px] md:h-[96px] gap-4 md:gap-8">
          {/* LEFT SECTION - Logo */}
          <Link
            to="/"
            className="flex-shrink-0 leading-tight group"
            aria-label="HOK INTERIOR DESIGNS - Home"
          >
            <div className="flex flex-col items-start">
              <motion.p
                whileHover={{ scale: 1.02, x: 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="font-display text-[44px] md:text-[52px] font-medium tracking-[0.25em] leading-tight text-[#2A241F] transition-colors duration-300 group-hover:text-[#E89A43]"
              >
                HOK
              </motion.p>
              <motion.p
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="font-sans text-[10px] md:text-[11px] font-medium uppercase tracking-[0.35em] leading-none text-[#E89A43] -mt-1"
              >
                INTERIOR DESIGNS
              </motion.p>
            </div>
          </Link>

          {/* CENTER SECTION - Navigation Links */}
          <nav className="hidden md:flex items-center justify-center flex-1" role="navigation" aria-label="Main navigation">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.05 }}
              className="flex items-center gap-2 md:gap-4 lg:gap-6"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to
                return (
                  <motion.Link
                    key={item.to}
                    to={item.to}
                    variants={{
                      hidden: { opacity: 0, y: -10 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 md:px-5 md:py-3 text-[10px] md:text-[11px] font-medium uppercase tracking-[0.15em] transition-all duration-300 nav-link-underline ${
                      isActive ? 'text-[#E89A43]' : 'text-[#2A241F]/70 hover:text-[#2A241F]'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon
                      size={14}
                      md={16}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className={`transition-colors duration-300 ${isActive ? 'text-[#E89A43]' : 'text-current'}`}
                    />
                    <span>{item.label}</span>
                  </motion.Link>
                )
              })}

              {/* Vertical Divider */}
              <div className="w-px h-8 md:h-10 bg-[#E6D8C9]/40 mx-2 md:mx-4 hidden lg:block" aria-hidden="true" />

              {/* RIGHT SECTION - User Dropdown */}
              <div className="relative" role="menu" aria-label="User menu" ref={userMenuRef}>
                <motion.button
                  onClick={() => setUserMenuOpen((p) => !p)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 rounded-full px-4 py-2.5 md:px-5 md:py-3 text-[10px] md:text-[11px] font-medium uppercase tracking-[0.15em] text-[#2A241F]/70 transition-all duration-300 hover:bg-[#E6D8C9]/50 hover:text-[#2A241F]"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <User size={16} md={18} strokeWidth={1.5} aria-hidden="true" className="transition-colors duration-300" />
                  <span className="hidden sm:inline">Account</span>
                  <motion.svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ rotate: userMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="transition-transform duration-200"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </motion.svg>
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                        aria-hidden="true"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 mt-3 w-56 md:w-60 bg-white rounded-2xl shadow-[0_20px_40px_rgba(42,36,31,0.15)] border border-[#E6D8C9]/60 overflow-hidden z-50 backdrop-blur-xl bg-white/95"
                        role="menu"
                      >
                        {user ? (
                          <>
                            <Link
                              to="/account"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors"
                              role="menuitem"
                            >
                              <LayoutDashboard size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                              My Account
                            </Link>
                            <hr className="my-2 border-[#E6D8C9]/40" />
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-medium text-[#C62828] hover:bg-[#C62828]/5 transition-colors"
                              role="menuitem"
                            >
                              <LogOut size={16} strokeWidth={1.5} className="text-[#C62828]" aria-hidden="true" />
                              Logout
                            </button>
                          </>
                        ) : (
                          <>
                            {LOGGED_OUT_ITEMS.map((item) => {
                              const Icon = item.icon
                              return (
                                <Link
                                  key={item.to}
                                  to={item.to}
                                  onClick={() => setUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors"
                                  role="menuitem"
                                >
                                  <Icon size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                                  {item.label}
                                </Link>
                              )
                            })}
                          </>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </nav>

          {/* Mobile Menu Button - Right */}
          <motion.button
            className="md:hidden p-2 rounded-full text-[#2A241F] transition-colors hover:bg-[#E6D8C9]/50"
            onClick={() => setMobileOpen((p) => !p)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            whileTap={{ scale: 0.9 }}
          >
            {mobileOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#2A241F]/30 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 right-0 top-[96px] z-50 bg-white border-b border-[#E6D8C9]/40 shadow-xl md:hidden overflow-hidden"
            >
              <div className="container-wide px-4 md:px-8 lg:px-12 py-6 space-y-6">
                {/* Nav Links */}
                <nav className="space-y-4" role="navigation" aria-label="Mobile navigation">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.to
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                          isActive ? 'bg-[#E89A43]/10 text-[#E89A43]' : 'text-[#2A241F] hover:bg-[#E6D8C9]/40 hover:text-[#E89A43]'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon size={20} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
                        <span className="font-medium text-base">{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>

                {/* Divider */}
                <div className="h-px bg-[#E6D8C9]/40" aria-hidden="true" />

                {/* User Actions */}
                <div className="space-y-2">
                  {user ? (
                    <Link
                      to="/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 hover:text-[#E89A43] transition-colors"
                    >
                      <LayoutDashboard size={20} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                      My Account
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 hover:text-[#E89A43] transition-colors"
                      >
                        <LogIn size={20} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 hover:text-[#E89A43] transition-colors"
                      >
                        <UserPlus size={20} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                        Sign Up
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-[#C62828] hover:bg-[#C62828]/5 transition-colors"
                  >
                    <LogOut size={20} strokeWidth={1.5} className="text-[#C62828]" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar