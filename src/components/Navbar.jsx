import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User, LogIn, UserPlus, LayoutDashboard, ShoppingBag, Sparkles, Info, Menu, X, ChevronDown, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
  { to: '/virtual-interior-design', label: 'Virtual Interior Design', icon: Sparkles },
  { to: '/about', label: 'About Us', icon: Info },
]

const LOGGED_OUT_ACCOUNT_ITEMS = [
  { to: '/login', label: 'Login', icon: LogIn },
  { to: '/register', label: 'Register', icon: UserPlus },
  { to: '/account', label: 'My Account', icon: LayoutDashboard },
]

export const Navbar = () => {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const location = useLocation()
  const ticking = useRef(false)
  const navRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          const direction = currentScrollY > lastScrollY ? 'down' : 'up'

          if (currentScrollY > 100) {
            setScrolled(true)
          } else {
            setScrolled(false)
          }

          if (direction === 'down' && currentScrollY > 150) {
            setNavVisible(false)
          } else if (direction === 'up') {
            setNavVisible(true)
          }

          setLastScrollY(currentScrollY)
          ticking.current = false
        })
        ticking.current = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastScrollY])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
    setSearchOpen(false)
  }, [location])

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const query = e.currentTarget.querySelector('input').value
    if (query.trim()) {
      setSearchOpen(false)
      window.location.href = `/shop?search=${encodeURIComponent(query.trim())}`
    }
  }

  const navVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  const itemVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  }

  return (
    <div ref={navRef}>
      <AnimatePresence mode="wait">
        {navVisible && (
          <motion.header
            initial="initial"
            animate="animate"
            exit="exit"
            variants={navVariants}
            className="fixed left-1/2 top-5 z-50 w-[92%] max-w-[1440px] -translate-x-1/2 transition-all duration-300 ease-out"
            style={{
              borderRadius: scrolled ? '16px' : '20px',
              boxShadow: scrolled ? '0 20px 60px rgba(42,36,31,0.12)' : '0 4px 24px rgba(42,36,31,0.06)',
              background: scrolled ? 'rgba(250, 248, 244, 0.95)' : 'rgba(250, 248, 244, 0.9)',
              backdropFilter: scrolled ? 'blur(24px)' : 'blur(16px)',
              border: scrolled ? '1px solid rgba(230, 216, 201, 0.4)' : '1px solid rgba(230, 216, 201, 0.3)',
              transform: `translateX(-50%) translateY(${navVisible ? 0 : -120}px)`,
            }}
            role="banner"
          >
            <div className="container-wide flex items-center justify-between px-4 md:px-8 lg:px-12 h-[90px]">
              {/* Logo - Left */}
              <Link
                to="/"
                className="flex-shrink-0 leading-tight group"
                aria-label="HOK INTERIOR DESIGNS - Home"
              >
                <div className="flex flex-col items-start">
                  <p className="font-display text-[52px] font-medium tracking-[0.25em] leading-tight text-[#2A241F] transition-colors duration-300 group-hover:text-[#E89A43]">
                    HOK
                  </p>
                  <p className="font-sans text-[11px] font-medium uppercase tracking-[0.35em] leading-none text-[#E89A43] -mt-1">
                    INTERIOR DESIGNS
                  </p>
                </div>
              </Link>

              {/* Desktop Navigation - Center */}
              <nav className="hidden md:flex items-center gap-8 lg:gap-8" role="navigation" aria-label="Main navigation">
                <motion.div
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                  initial="hidden"
                  animate="show"
                  className="flex items-center gap-8 lg:gap-8"
                >
                  {NAV_ITEMS.map((item) => (
                    <motion.Link
                      key={item.to}
                      to={item.to}
                      variants={itemVariants}
                      className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-medium uppercase tracking-widest transition-all duration-300 nav-link-underline ${location.pathname === item.to ? 'text-[#E89A43]' : 'text-[#2A241F]/70 hover:text-[#2A241F]'}`}
                      aria-current={location.pathname === item.to ? 'page' : undefined}
                    >
                      <item.icon size={14} strokeWidth={1.5} aria-hidden="true" className={`transition-colors duration-300 ${location.pathname === item.to ? 'text-[#E89A43]' : ''}`} />
                      <span>{item.label}</span>
                    </motion.Link>
                  ))}

                  {/* Vertical Divider */}
                  <div className="w-px h-8 bg-[#E6D8C9]/40 mx-2 hidden lg:block" aria-hidden="true" />

                  {/* Account Button - Desktop */}
                  <div className="relative" role="menu" aria-label="User menu">
                    <motion.button
                      onClick={() => setUserMenuOpen((p) => !p)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-[#2A241F]/70 transition-all duration-300 hover:bg-[#E6D8C9]/50 hover:text-[#2A241F]"
                      aria-expanded={userMenuOpen}
                      aria-haspopup="true"
                      aria-label="User menu"
                    >
                      <User size={16} strokeWidth={1.5} aria-hidden="true" className="transition-colors duration-300" />
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
                            className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_20px_40px_rgba(42,36,31,0.15)] border border-[#E6D8C9]/60 overflow-hidden z-50 backdrop-blur-xl bg-white/90"
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
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[#E89A43]" aria-hidden="true">
                                    <rect x="2" y="3" width="20" height="14" rx="2" />
                                    <path d="M8 21h8M12 17v4" />
                                  </svg>
                                  My Account
                                </Link>
                                <hr className="my-2 border-[#E6D8C9]/40" />
                                <button
                                  onClick={handleLogout}
                                  className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-[#C62828] hover:bg-[#C62828]/5 transition-colors"
                                  role="menuitem"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[#C62828]" aria-hidden="true">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                  </svg>
                                  Logout
                                </button>
                              </>
                            ) : (
                              <>
                                {LOGGED_OUT_ACCOUNT_ITEMS.map((item) => {
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

              {/* Search Icon - Desktop Only */}
              <div className="hidden md:flex items-center">
                <motion.button
                  onClick={() => setSearchOpen((p) => !p)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full text-[#2A241F]/60 transition-colors hover:bg-[#E6D8C9]/50 hover:text-[#2A241F]"
                  aria-label="Search"
                  aria-expanded={searchOpen}
                >
                  <Search size={18} strokeWidth={1.5} />
                </motion.button>
              </div>

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
          </motion.header>
        )}
      </AnimatePresence>

      {/* Mobile Slide-out Menu */}
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
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 md:w-96 bg-[#FAF8F4] shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6D8C9]">
                <div>
                  <p className="font-display text-xl font-normal tracking-[0.25em] text-[#2A241F]">HOK</p>
                  <p className="font-sans text-[11px] font-medium uppercase tracking-[0.35em] text-[#E89A43] -mt-1">INTERIOR DESIGNS</p>
                </div>
                <motion.button
                  onClick={() => setMobileOpen(false)}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-[#2A241F] hover:text-[#E89A43] transition-colors"
                  aria-label="Close menu"
                >
                  <X size={24} strokeWidth={1.5} />
                </motion.button>
              </div>
              <nav className="flex flex-col px-6 py-8 gap-6">
                <motion.div
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
                  initial="hidden"
                  animate="show"
                >
                  {NAV_ITEMS.map((item) => (
                    <motion.Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      variants={itemVariants}
                      className={`text-lg font-display font-medium transition-colors ${location.pathname === item.to ? 'text-[#E89A43]' : 'text-[#2A241F] hover:text-[#E89A43]'}`}
                    >
                      {item.label}
                    </motion.Link>
                  ))}
                </motion.div>
                <div className="mt-4 pt-4 border-t border-[#E6D8C9] space-y-3">
                  {user ? (
                    <Link
                      to="/account"
                      onClick={() => { setMobileOpen(false); setUserMenuOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:text-[#E89A43] transition-colors rounded-xl hover:bg-[#E6D8C9]/40"
                    >
                      <LayoutDashboard size={18} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                      My Account
                    </Link>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:text-[#E89A43] transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[#E89A43]">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                          <polyline points="10 17 15 12 10 5" />
                        </svg>
                        Login
                      </Link>
                      <Link to="/register" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:text-[#E89A43] transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[#E89A43]">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                          <line x1="20" y1="8" x2="20" y2="14" />
                          <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#2A241F]/30 backdrop-blur-sm z-40"
              onClick={() => setSearchOpen(false)}
              aria-hidden="true"
            />
            {mobileOpen ? null : (
              <motion.div
                initial={{ y: '-100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 right-0 top-[80px] z-50 bg-[#FAF8F4] border-b border-[#E6D8C9]/40 md:top-[88px] md:border-b md:shadow-xl"
              >
                <form onSubmit={handleSearch} className="container-wide px-4 py-4 md:px-12 md:py-6">
                  <div className="relative max-w-2xl mx-auto">
                    <Search size={20} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2A241F]/35" />
                    <input
                      type="search"
                      placeholder="Search products, projects..."
                      className="w-full pl-12 pr-16 py-4 text-base rounded-full border border-[#E6D8C9]/40 bg-[#FAF8F4] placeholder:text-[#2A241F]/35 focus:border-[#E89A43] focus:ring-2 focus:ring-[#E89A43]/20 outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-[#2A241F]/60 hover:text-[#E89A43] transition-colors"
                      aria-label="Submit search"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden fixed left-0 right-0 top-[80px] z-50 bg-[#FAF8F4] border-b border-[#E6D8C9]/40 shadow-xl px-4 pb-6"
            >
              <form onSubmit={handleSearch} className="px-4 py-4">
                <div className="relative">
                  <Search size={20} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2A241F]/35" />
                  <input
                    type="search"
                    placeholder="Search products, projects..."
                    className="w-full pl-12 pr-16 py-4 text-base rounded-full border border-[#E6D8C9]/40 bg-[#FAF8F4] placeholder:text-[#2A241F]/35 focus:border-[#E89A43] focus:ring-2 focus:ring-[#E89A43]/20 outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-[#2A241F]/60 hover:text-[#E89A43] transition-colors"
                    aria-label="Submit search"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Search in Menu */}
      {mobileOpen && searchOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed left-0 right-0 top-[80px] z-45 bg-[#FAF8F4] border-b border-[#E6D8C9]/40 shadow-xl px-4 pb-6 md:hidden"
        >
          <form onSubmit={handleSearch} className="px-4 py-4">
            <div className="relative">
              <Search size={20} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2A241F]/35" />
              <input
                type="search"
                placeholder="Search products, projects..."
                className="w-full pl-12 pr-16 py-4 text-base rounded-full border border-[#E6D8C9]/40 bg-[#FAF8F4] placeholder:text-[#2A241F]/35 focus:border-[#E89A43] focus:ring-2 focus:ring-[#E89A43]/20 outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-[#2A241F]/60 hover:text-[#E89A43] transition-colors"
                aria-label="Submit search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  )
}

export default Navbar