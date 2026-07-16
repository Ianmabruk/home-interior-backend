import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ShoppingBag,
  User,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Package,
  CreditCard,
  Heart,
  CalendarCheck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useShop } from '../context/ShopContext'

const NAV_ITEMS = [
  { to: '/shop', label: 'Shop' },
  { to: '/virtual-interior-design', label: 'Virtual Interior Design' },
  { to: '/about', label: 'About Us' },
]

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { cart, removeFromCart, setCartQuantity } = useShop()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navRef = useRef(null)
  const userMenuRef = useRef(null)
  const cartRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setCartOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
  }

  const cartItems = cart || []
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const handleRemoveFromCart = (item) => {
    // The removeFromCart function is available from useShop context
    // We'll need to import it
  }

  return (
    <header
      ref={navRef}
      className={`relative w-full z-50 transition-all duration-300 sticky top-0 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-[#E6D8C9]/40 shadow-[0_8px_32px_rgba(27,23,20,0.08)]'
          : 'bg-white/70 backdrop-blur-lg border-b border-[#E6D8C9]/30'
      }`}
      role="banner"
      style={{ willChange: 'transform, box-shadow, background' }}
    >
      <div className="container-wide mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-[88px] md:h-[96px] gap-4 md:gap-8 relative">
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
                const isActive = location.pathname === item.to
                return (
                  <motion.Link
                    key={item.to}
                    to={item.to}
                    variants={{
                      hidden: { opacity: 0, y: -10 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    className={`relative flex items-center rounded-full px-4 py-2.5 md:px-5 md:py-3 text-[10px] md:text-[11px] font-medium uppercase tracking-[0.15em] transition-all duration-300 nav-link-underline ${
                      isActive ? 'text-[#E89A43]' : 'text-[#2A241F]/70 hover:text-[#2A241F]'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>{item.label}</span>
                  </motion.Link>
                )
              })}

              {/* Vertical Divider */}
              <div className="w-px h-8 md:h-10 bg-[#E6D8C9]/40 mx-2 md:mx-4 hidden lg:block" aria-hidden="true" />

              {/* RIGHT SECTION - Account Icon + Cart */}
              <div className="flex items-center gap-3">
                {/* Cart Icon */}
                <div className="relative" ref={cartRef}>
                  <motion.button
                    onClick={() => setCartOpen((p) => !p)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative p-2 rounded-full text-[#2A241F]/70 transition-colors hover:bg-[#E6D8C9]/50 hover:text-[#2A241F]"
                    aria-label={`Shopping cart${totalItems > 0 ? ` with ${totalItems} items` : ''}`}
                    aria-expanded={cartOpen}
                    aria-haspopup="true"
                  >
                    <ShoppingBag size={20} md={22} strokeWidth={1.5} aria-hidden="true" />
                    {totalItems > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute -top-1 -right-1 min-w-[18px] h-5 rounded-full bg-[#E89A43] text-white text-[10px] font-semibold flex items-center justify-center px-1.5"
                        aria-label={`${totalItems} items in cart`}
                      >
                        {totalItems > 99 ? '99+' : totalItems}
                      </motion.span>
                    )}
                  </motion.button>

                  {/* Cart Dropdown */}
                  <AnimatePresence>
                    {cartOpen && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40"
                          onClick={() => setCartOpen(false)}
                          aria-hidden="true"
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.98 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-[0_20px_40px_rgba(42,36,31,0.15)] border border-[#E6D8C9]/60 overflow-hidden z-50 backdrop-blur-xl bg-white/95"
                          role="menu"
                        >
                          <div className="p-4 border-b border-[#E6D8C9]/40 flex items-center justify-between">
                            <h3 className="font-display text-lg font-normal text-[#2A241F]">Shopping Cart</h3>
                            <span className="text-sm text-[#2A241F]/50">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                          </div>

                          {cartItems.length === 0 ? (
                            <div className="p-8 text-center">
                              <ShoppingBag size={32} strokeWidth={1} className="mx-auto text-[#E6D8C9] mb-3" />
                              <p className="font-display text-lg text-[#2A241F]/30">Your cart is empty</p>
                              <p className="mt-1 text-sm text-[#2A241F]/40">Add pieces from the shop to start your order</p>
                              <Link
                                to="/shop"
                                onClick={() => setCartOpen(false)}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-2xs font-semibold uppercase tracking-widest border border-[#E89A43] text-[#E89A43] hover:bg-[#E89A43] hover:text-white hover:border-[#E89A43] rounded-full transition"
                              >
                                Shop Now
                              </Link>
                            </div>
                          ) : (
                            <>
                              <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                                {cartItems.map((item) => (
                                  <div
                                    key={`${item._id}-${item.selectedVariant?.colorName || 'default'}`}
                                    className="flex gap-3 rounded-xl border border-[#E6D8C9]/40 bg-white/50 p-3 transition-colors hover:border-[#E89A43]/40"
                                  >
                                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                                      <img
                                        src={item.selectedVariant?.imageUrl || item.image || item.images?.[0]?.url}
                                        alt={item.name}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-2xs font-medium uppercase tracking-widest text-[#E89A43]">{item.category}</p>
                                      <h4 className="mt-0.5 font-display text-base font-medium text-[#2A241F] truncate">
                                        <Link to={`/shop/${item._id}`} className="hover:text-[#E89A43] transition-colors" onClick={() => setCartOpen(false)}>
                                          {item.name}
                                        </Link>
                                      </h4>
                                      {item.selectedVariant && (
                                        <div className="mt-0.5 flex items-center gap-1.5">
                                          <span className="h-3 w-3 rounded-full border border-[#2A241F]/10" style={{ backgroundColor: item.selectedVariant.colorHex || '#ccc' }} />
                                          <span className="text-xs text-[#2A241F]/60">{item.selectedVariant.colorName}</span>
                                        </div>
                                      )}
                                      <p className="mt-1 text-sm font-medium text-[#2A241F]">${Number(item.selectedVariant?.priceOverride || item.discountPrice || item.price || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                      <button
                                        onClick={() => removeFromCart(item._id, item.selectedVariant)}
                                        className="p-1.5 rounded-lg text-[#2A241F]/40 hover:text-[#E89A43] hover:bg-[#E6D8C9]/30 transition-colors"
                                        aria-label="Remove from cart"
                                      >
                                        <X size={14} strokeWidth={1.5} />
                                      </button>
                                      <div className="flex items-center rounded-full border border-[#E6D8C9]/60 bg-white">
                                        <button
                                          onClick={() => setCartQuantity(item._id, item.quantity - 1, item.selectedVariant)}
                                          disabled={item.quantity <= 1}
                                          className="flex h-8 w-8 items-center justify-center text-[#2A241F]/50 transition hover:text-[#2A241F] disabled:opacity-30 disabled:cursor-not-allowed"
                                          aria-label="Decrease quantity"
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        </button>
                                        <span className="min-w-8 text-center text-sm font-medium text-[#2A241F]">{item.quantity}</span>
                                        <button
                                          onClick={() => setCartQuantity(item._id, item.quantity + 1, item.selectedVariant)}
                                          className="flex h-8 w-8 items-center justify-center text-[#2A241F]/50 transition hover:text-[#2A241F]"
                                          aria-label="Increase quantity"
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t border-[#E6D8C9]/40 p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-[#2A241F]/55">Subtotal</span>
                                  <span className="font-medium text-[#2A241F]">${cartItems.reduce((sum, item) => sum + Number(item.selectedVariant?.priceOverride || item.discountPrice || item.price || 0) * item.quantity, 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-[#2A241F]/55">Shipping</span>
                                  <span className="font-medium text-[#2A241F]">Free</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-[#2A241F]/55">Tax</span>
                                  <span className="font-medium text-[#2A241F]">Calculated at checkout</span>
                                </div>
                                <div className="border-t border-[#E6D8C9]/40 pt-3">
                                  <div className="flex justify-between text-lg font-semibold text-[#2A241F]">
                                    <span>Total</span>
                                    <span>${cartItems.reduce((sum, item) => sum + Number(item.selectedVariant?.priceOverride || item.discountPrice || item.price || 0) * item.quantity, 0).toFixed(2)}</span>
                                  </div>
                                </div>
                                <Link
                                  to="/cart"
                                  onClick={() => setCartOpen(false)}
                                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#2A241F] px-6 py-3 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-[#2A241F]/90 hover:shadow-lg"
                                >
                                  <Package size={14} strokeWidth={1.5} />
                                  View Cart
                                </Link>
                                <Link
                                  to="/checkout"
                                  onClick={() => setCartOpen(false)}
                                  className="w-full flex items-center justify-center gap-2 rounded-full border border-[#E6D8C9] bg-white px-6 py-3 text-xs font-medium uppercase tracking-widest text-[#2A241F]/70 transition hover:border-[#E89A43] hover:text-[#E89A43]"
                                >
                                  <CreditCard size={14} strokeWidth={1.5} />
                                  Checkout
                                </Link>
                              </div>
                            </>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Account Dropdown */}
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
                          className="absolute right-0 mt-3 w-56 md:w-64 bg-white rounded-2xl shadow-[0_20px_40px_rgba(42,36,31,0.15)] border border-[#E6D8C9]/60 overflow-hidden z-50 backdrop-blur-xl bg-white/95"
                          role="menu"
                        >
                          {isAuthenticated && user ? (
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
                              <Link
                                to="/account"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors border-t border-[#E6D8C9]/40"
                                role="menuitem"
                              >
                                <Package size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                                My Orders
                              </Link>
                              <Link
                                to="/wishlist"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors border-t border-[#E6D8C9]/40"
                                role="menuitem"
                              >
                                <Heart size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                                Wishlist
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
                              <Link
                                to="/register"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors"
                                role="menuitem"
                              >
                                <UserPlus size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                                Sign Up
                              </Link>
                              <Link
                                to="/login"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors border-t border-[#E6D8C9]/40"
                                role="menuitem"
                              >
                                <LogIn size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                                Login
                              </Link>
                            </>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
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
                {/* Hero Buttons - Primary Actions */}
                <div className="space-y-3 pt-2">
                  <Link
                    to="/portfolio"
                    onClick={() => setMobileOpen(false)}
                    className="btn-luxury-primary w-full justify-center"
                  >
                    View Portfolio
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); setTimeout(() => window.dispatchEvent(new CustomEvent('open-consultation')), 100) }}
                    className="btn-luxury-secondary w-full justify-center group"
                  >
                    Book Consultation
                    <CalendarCheck size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" />
                  </button>
                </div>

                {/* Divider */}
                <div className="h-px bg-[#E6D8C9]/40" aria-hidden="true" />

                {/* Nav Links */}
                <nav className="space-y-4" role="navigation" aria-label="Mobile navigation">
                  {NAV_ITEMS.map((item) => {
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
                        <span className="font-medium text-base">{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>

                {/* Divider */}
                <div className="h-px bg-[#E6D8C9]/40" aria-hidden="true" />

                {/* Cart Summary */}
                <Link
                  to="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 hover:text-[#E89A43] transition-colors"
                >
                  <ShoppingBag size={20} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                  <span>Cart</span>
                  {totalItems > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E89A43] text-white text-[10px] font-semibold">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>

                {/* User Actions */}
                <div className="space-y-2 pt-2 border-t border-[#E6D8C9]/40">
                  {isAuthenticated && user ? (
                    <>
                      <Link
                        to="/account"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 hover:text-[#E89A43] transition-colors"
                      >
                        <LayoutDashboard size={20} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                        My Account
                      </Link>
                      <Link
                        to="/account"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 hover:text-[#E89A43] transition-colors"
                      >
                        <Package size={20} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                        My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 hover:text-[#E89A43] transition-colors"
                      >
                        <Heart size={20} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                        Wishlist
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-[#C62828] hover:bg-[#C62828]/5 transition-colors"
                      >
                        <LogOut size={20} strokeWidth={1.5} className="text-[#C62828]" aria-hidden="true" />
                        Logout
                      </button>
                    </>
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