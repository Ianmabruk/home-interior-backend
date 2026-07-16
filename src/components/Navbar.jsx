import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User, LogIn, UserPlus, LayoutDashboard, Package, Heart, LogOut, Menu, X, ChevronDown, ShoppingBag, Sparkles, Images, Info, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
  { to: '/virtual-interior-design', label: 'Virtual Interior Design', icon: Sparkles },
  { to: '/portfolio', label: 'Portfolio', icon: Images },
  { to: '/about', label: 'About Us', icon: Info },
]

const LOGGED_IN_ACCOUNT_ITEMS = [
  { to: '/account', label: 'My Account', icon: LayoutDashboard },
  { to: '/account?tab=orders', label: 'Orders', icon: Package },
  { to: '/account?tab=saved', label: 'Saved', icon: Heart },
  { to: '/logout', label: 'Logout', icon: LogOut },
]

const LOGGED_OUT_ACCOUNT_ITEMS = [
  { to: '/login', label: 'Login', icon: LogIn },
  { to: '/register', label: 'Register', icon: UserPlus },
]

export const Navbar = () => {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    <div>
      <motion.header
        initial="initial"
        animate="animate"
        exit="exit"
        variants={navVariants}
        className={`fixed left-1/2 -translate-x-1/2 top-4 z-50 w-[92%] max-w-[1440px] transition-all duration-500 ${scrolled ? 'nav-glass' : 'bg-transparent'}`}
        style={{ borderRadius: scrolled ? '16px' : '20px', boxShadow: scrolled ? '0 8px 32px rgba(27,23,20,0.12)' : 'none' }}
        role="banner"
      >
        <div className="container-wide flex items-center justify-between px-6 md:px-12 lg:px-20 h-20 md:h-22">
          {/* Logo - Left */}
          <Link
            to="/"
            className="flex-shrink-0 leading-tight group"
            aria-label="HOK INTERIORS - Home"
          >
            <p className="font-display text-xl md:text-2xl font-normal tracking-luxury text-luxury-text transition-colors duration-300 group-hover:text-orange-accent">
              HOK INTERIORS
            </p>
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2" role="navigation" aria-label="Main navigation">
            <motion.div
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden"
              animate="show"
              className="flex items-center gap-1"
            >
              {NAV_ITEMS.map((item) => (
                <motion.Link
                  key={item.to}
                  to={item.to}
                  variants={itemVariants}
                  className={`relative flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-medium uppercase tracking-widest transition-all duration-300 nav-link-underline ${location.pathname === item.to ? 'text-orange-accent' : 'text-luxury-text/70 hover:text-luxury-text'}`}
                  aria-current={location.pathname === item.to ? 'page' : undefined}
                >
                  <item.icon size={14} strokeWidth={1.5} aria-hidden="true" className={`transition-colors duration-300 ${location.pathname === item.to ? 'text-orange-accent' : ''}`} />
                  <span>{item.label}</span>
                </motion.Link>
              ))}
            </motion.div>

            {/* Vertical Divider */}
            <div className="w-px h-8 bg-linen/40 mx-2 hidden lg:block" aria-hidden="true" />

            {/* Account Button - Desktop */}
            <div className="relative" role="menu" aria-label="User menu">
              <motion.button
                onClick={() => setUserMenuOpen((p) => !p)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-medium uppercase tracking-widest text-luxury-text/70 transition-all duration-300 hover:bg-linen/50 hover:text-luxury-text"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <User size={14} strokeWidth={1.5} aria-hidden="true" className="transition-colors duration-300" />
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
                      className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-glass border border-linen overflow-hidden z-50 dropdown-enter"
                      role="menu"
                    >
                      {user ? (
                        <>
                          <Link
                            to="/account"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-luxury-text hover:bg-linen/40 transition-colors"
                            role="menuitem"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-orange-accent" aria-hidden="true">
                              <rect x="2" y="3" width="20" height="14" rx="2" />
                              <path d="M8 21h8M12 17v4" />
                            </svg>
                            My Account
                          </Link>
                          <Link
                            to="/account?tab=orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-luxury-text hover:bg-linen/40 transition-colors"
                            role="menuitem"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-orange-accent" aria-hidden="true">
                              <path d="M21 13.81V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5.19" />
                              <path d="M21 8V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8.82" />
                              <path d="M3 3v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.27" />
                            </svg>
                            Orders
                          </Link>
                          <Link
                            to="/account?tab=saved"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-luxury-text hover:bg-linen/40 transition-colors"
                            role="menuitem"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-orange-accent" aria-hidden="true">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 0" />
                              <path d="M12 21.35l7.06-7.06a5.5 5.5 0 0 0 0-7.78" />
                            </svg>
                            Saved
                          </Link>
                          <hr className="my-2 border-linen/40" />
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-error hover:bg-error/5 transition-colors"
                            role="menuitem"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-error" aria-hidden="true">
                              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                              <polyline points="16 17 21 12 16 7" />
                              <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/login"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-luxury-text hover:bg-linen/40 transition-colors"
                            role="menuitem"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-orange-accent" aria-hidden="true">
                              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                              <polyline points="10 17 15 12 10 5" />
                            </svg>
                            Login
                          </Link>
                          <Link
                            to="/register"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-luxury-text hover:bg-linen/40 transition-colors"
                            role="menuitem"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-orange-accent" aria-hidden="true">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="8.5" cy="7" r="4" />
                              <line x1="20" y1="8" x2="20" y2="14" />
                              <line x1="23" y1="11" x2="17" y2="11" />
                            </svg>
                            Register
                          </Link>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Search Icon - Desktop Only */}
          <div className="hidden md:flex items-center">
            <motion.button
              onClick={() => setSearchOpen((p) => !p)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full text-luxury-text/60 transition-colors hover:bg-linen/50 hover:text-luxury-text"
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <Search size={18} strokeWidth={1.5} />
            </motion.button>
          </div>

          {/* Mobile Menu Button - Right */}
          <motion.button
            className="md:hidden p-2 rounded-full text-luxury-text transition-colors hover:bg-linen/50"
            onClick={() => setMobileOpen((p) => !p)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            whileTap={{ scale: 0.9 }}
          >
            {mobileOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-luxury-text/30 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 md:w-96 bg-warm-ivory shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-linen">
                <div>
                  <p className="font-display text-xl font-normal tracking-luxury text-luxury-text">HOK INTERIORS</p>
                </div>
                <motion.button
                  onClick={() => setMobileOpen(false)}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-luxury-text hover:text-orange-accent transition-colors"
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
                      className={`text-lg font-display font-medium transition-colors ${location.pathname === item.to ? 'text-orange-accent' : 'text-luxury-text hover:text-orange-accent'}`}
                    >
                      {item.label}
                    </motion.Link>
                  ))}
                </motion.div>
                <div className="mt-4 pt-4 border-t border-linen space-y-3">
                  {user ? (
                    LOGGED_IN_ACCOUNT_ITEMS.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => { setMobileOpen(false); setUserMenuOpen(false); }}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-luxury-text hover:text-orange-accent transition-colors rounded-xl hover:bg-linen/40"
                        >
                          <Icon size={18} strokeWidth={1.5} className="text-orange-accent" />
                          {item.label}
                        </Link>
                      )
                    })
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-luxury-text hover:text-orange-accent transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-orange-accent">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                          <polyline points="10 17 15 12 10 5" />
                        </svg>
                        Login
                      </Link>
                      <Link to="/register" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-luxury-text hover:text-orange-accent transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-orange-accent">
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
              className="fixed inset-0 bg-luxury-text/30 backdrop-blur-sm z-40"
              onClick={() => setSearchOpen(false)}
              aria-hidden="true"
            />
            {mobileOpen ? null : (
              <motion.div
                initial={{ y: '-100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 right-0 top-[80px] z-50 bg-warm-ivory border-b border-linen/40 md:top-[88px] md:border-b md:shadow-xl"
              >
                <form onSubmit={handleSearch} className="container-wide px-4 py-4 md:px-12 md:py-6">
                  <div className="relative max-w-2xl mx-auto">
                    <Search size={20} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-text/35" />
                    <input
                      type="search"
                      placeholder="Search products, projects..."
                      className="w-full pl-12 pr-16 py-4 text-base rounded-full border border-linen/40 bg-warm-ivory placeholder:text-luxury-text/35 focus:border-orange-accent focus:ring-2 focus:ring-orange-accent/20 outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-luxury-text/60 hover:text-orange-accent transition-colors"
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
              className="md:hidden fixed left-0 right-0 top-[80px] z-50 bg-warm-ivory border-b border-linen/40 shadow-xl px-4 pb-6"
            >
              <form onSubmit={handleSearch} className="px-4 py-4">
                <div className="relative">
                  <Search size={20} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-text/35" />
                  <input
                    type="search"
                    placeholder="Search products, projects..."
                    className="w-full pl-12 pr-16 py-4 text-base rounded-full border border-linen/40 bg-warm-ivory placeholder:text-luxury-text/35 focus:border-orange-accent focus:ring-2 focus:ring-orange-accent/20 outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-luxury-text/60 hover:text-orange-accent transition-colors"
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
          className="fixed left-0 right-0 top-[80px] z-45 bg-warm-ivory border-b border-linen/40 shadow-xl px-4 pb-6 md:hidden"
        >
          <form onSubmit={handleSearch} className="px-4 py-4">
            <div className="relative">
              <Search size={20} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-text/35" />
              <input
                type="search"
                placeholder="Search products, projects..."
                className="w-full pl-12 pr-16 py-4 text-base rounded-full border border-linen/40 bg-warm-ivory placeholder:text-luxury-text/35 focus:border-orange-accent focus:ring-2 focus:ring-orange-accent/20 outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-luxury-text/60 hover:text-orange-accent transition-colors"
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