import { useState, useEffect, useRef, memo, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import {
  ShoppingBag,
  ShoppingCart,
  User,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Package,
  CreditCard,
  Lock,
  Receipt,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@context/AuthContext'
import { useShop } from '@context/ShopContext'
import { prefetchMap } from '@app/prefetchMap'
import { FULLSCREEN_MENU_ITEMS } from '@constants/navItems'
import { useIsMobile } from '@hooks/useIsMobile'

const handlePrefetch = (to) => {
  const prefetchFn = prefetchMap[to]
  if (prefetchFn) {
    prefetchFn().catch(() => {})
  }
}

/* -------------------------------------------------------------------------- */
/* Stable module-level menu components.                                        */
/* Defined outside the Navbar component so their identity is stable across    */
/* re-renders (e.g. on mouse-move). Defining them inside Navbar previously    */
/* remounted the AnimatePresence subtree on every render, which caused the    */
/* cart / user dropdown to flicker and immediately close.                      */
/* -------------------------------------------------------------------------- */

const CartMenu = memo(({ isOpen, onClose, isAuthenticated, cartItems, totalItems, cartSubtotal, onRemove, onChangeQty }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9990]"
          onClick={onClose}
          aria-hidden="true"
        />
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed right-4 md:right-8 top-[104px] md:top-[112px] w-80 md:w-96 bg-[var(--card)]/80 rounded-2xl shadow-[0_20px_60px_rgba(42,36,31,0.18)] border border-[var(--border)]/60 overflow-hidden z-[9991] backdrop-blur-xl"
          role="menu"
          aria-label="Shopping cart"
        >
          <div className="p-4 border-b border-[#E6D8C9]/40 flex items-center justify-between">
            <h3 className="font-display text-lg font-normal text-[#2A241F]">Shopping Cart</h3>
            <span className="text-sm text-[#2A241F]/50">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
          </div>

          {!isAuthenticated ? (
            <div className="p-6 text-center">
              <Lock size={28} strokeWidth={1.5} className="mx-auto text-[#E89A43] mb-3" aria-hidden="true" />
              <p className="font-display text-lg text-[#2A241F]">Your cart is private</p>
              <p className="mt-1 text-sm text-[#2A241F]/50">Sign up or log in to view your shopping cart.</p>
              <div className="mt-5 flex flex-col gap-2">
                <Link
                  to="/signup"
                  onClick={onClose}
                  className="w-full flex items-center justify-center rounded-full bg-[#2A241F] px-6 py-3 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-[#2A241F]/90"
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  onClick={onClose}
                  className="w-full flex items-center justify-center rounded-full border border-[#E89A43] px-6 py-3 text-xs font-medium uppercase tracking-widest text-[#E89A43] transition hover:bg-[#E89A43] hover:text-white"
                >
                  Login
                </Link>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBag size={32} strokeWidth={1} className="mx-auto text-[#E6D8C9] mb-3" />
              <p className="font-display text-lg text-[#2A241F]/30">Your cart is empty</p>
              <p className="mt-1 text-sm text-[#2A241F]/40">Add pieces from the shop to start your order</p>
              <Link
                to="/shop"
                onClick={onClose}
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
                    key={`${item._id}-${item.selectedVariant?.color || 'default'}`}
                    className="flex gap-3 rounded-xl border border-[#E6D8C9]/40 bg-white/50 p-3 transition-colors hover:border-[#E89A43]/40"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={item.selectedVariant?.image || item.image || item.images?.[0]?.url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width={64}
                        height={64}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xs font-medium uppercase tracking-widest text-[#E89A43]">{item.category}</p>
                      <h4 className="mt-0.5 font-display text-base font-medium text-[#2A241F] truncate">
                        <Link to={`/shop/${item._id}`} className="hover:text-[#E89A43] transition-colors" onClick={onClose}>
                          {item.name}
                        </Link>
                      </h4>
                      {item.selectedVariant && (
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded-full border border-[#2A241F]/10" style={{ backgroundColor: item.selectedVariant.colorHex || '#ccc' }} />
                          <span className="text-xs text-[#2A241F]/60">{item.selectedVariant.color}</span>
                        </div>
                      )}
                      <p className="mt-1 text-sm font-medium text-[#2A241F]">${Number(item.selectedVariant?.price || item.discountPrice || item.price || 0).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        onClick={() => onRemove(item._id, item.selectedVariant)}
                        className="p-1.5 rounded-lg text-[#2A241F]/40 hover:text-[#E89A43] hover:bg-[#E6D8C9]/30 transition-colors"
                        aria-label="Remove from cart"
                      >
                        <X size={14} strokeWidth={1.5} />
                      </button>
                      <div className="flex items-center rounded-full border border-[#E6D8C9]/60 bg-white">
                        <button
                          onClick={() => onChangeQty(item._id, item.quantity - 1, item.selectedVariant)}
                          disabled={item.quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center text-[#2A241F]/50 transition hover:text-[#2A241F] disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        </button>
                        <span className="min-w-8 text-center text-sm font-medium text-[#2A241F]">{item.quantity}</span>
                        <button
                          onClick={() => onChangeQty(item._id, item.quantity + 1, item.selectedVariant)}
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
                  <span className="font-medium text-[#2A241F]">${cartSubtotal.toFixed(2)}</span>
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
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                </div>
                <Link
                  to="/cart"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#2A241F] px-6 py-3 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-[#2A241F]/90 hover:shadow-lg"
                >
                  <Package size={14} strokeWidth={1.5} />
                  View Cart
                </Link>
                <Link
                  to="/checkout"
                  onClick={onClose}
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
))
CartMenu.displayName = 'CartMenu'

const UserMenu = memo(({ isOpen, onClose, isAuthenticated, isAdmin, onLogout }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9990]"
          onClick={onClose}
          aria-hidden="true"
        />
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed right-4 md:right-8 top-[104px] md:top-[112px] w-56 md:w-64 bg-[var(--card)]/80 rounded-2xl shadow-[0_20px_60px_rgba(42,36,31,0.18)] border border-[var(--border)]/60 overflow-hidden z-[9991] backdrop-blur-xl"
          role="menu"
          aria-label="Account menu"
        >
          {isAuthenticated && isAdmin ? (
            <>
              <Link
                to="/admin"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors"
                role="menuitem"
              >
                <LayoutDashboard size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                Admin Dashboard
              </Link>
              <hr className="my-2 border-[#E6D8C9]/40" />
              <button
                onClick={onLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-medium text-[#C62828] hover:bg-[#C62828]/5 transition-colors"
                role="menuitem"
              >
                <LogOut size={16} strokeWidth={1.5} className="text-[#C62828]" aria-hidden="true" />
                Logout
              </button>
            </>
          ) : isAuthenticated ? (
            <>
              <Link
                to="/orders"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors"
                role="menuitem"
              >
                <Receipt size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                Orders
              </Link>
              <hr className="my-2 border-[#E6D8C9]/40" />
              <button
                onClick={onLogout}
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
                to="/signup"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors"
                role="menuitem"
              >
                <User size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                Sign Up
              </Link>
              <Link
                to="/login"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors"
                role="menuitem"
              >
                <LogOut size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                Login
              </Link>
            </>
          )}
        </motion.div>
      </>
    )}
  </AnimatePresence>
))
UserMenu.displayName = 'UserMenu'

export const Navbar = memo(() => {
  const { logout, isAuthenticated, isAdmin } = useAuth()
  const { cart, removeFromCart, setCartQuantity } = useShop()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const location = useLocation()
  const navRef = useRef(null)
  const reduceMotion = useIsMobile()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (e) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return
    let animationFrame = null
    const handleMouseMove = (event) => {
      if (animationFrame) return
      animationFrame = requestAnimationFrame(() => {
        const { innerWidth, innerHeight } = window
        const x = (event.clientX / innerWidth - 0.5) * 2
        const y = (event.clientY / innerHeight - 0.5) * 2
        setMousePos({ x, y })
        animationFrame = null
      })
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [prefersReducedMotion])

  // Escape closes any open overlay (cart, user menu, mobile menu)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setCartOpen(false)
        setUserMenuOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [mobileOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
    setCartOpen(false)
  }

  const cartItems = useMemo(() => (Array.isArray(cart) ? cart : []), [cart])
  const totalItems = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems])
  const cartSubtotal = useMemo(() => {
    if (!cartItems.length) return 0
    return cartItems.reduce((sum, item) => sum + Number(item.selectedVariant?.price || item.discountPrice || item.price || 0) * item.quantity, 0)
  }, [cartItems])

  const menuVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.06, delayChildren: reduceMotion ? 0 : 0.1 },
    },
    exit: { opacity: 0, transition: { staggerChildren: reduceMotion ? 0 : 0.04, staggerDirection: -1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <>
       <header
         ref={navRef}
         className={`relative w-full z-[9999] transition-all duration-300 sticky top-0 ${
           scrolled
             ? 'bg-[var(--card)]/80 backdrop-blur-xl border-b border-[var(--border)]/60 shadow-[0_8px_32px_rgba(42,36,31,0.08)]'
             : 'bg-[var(--card)]/70 backdrop-blur-lg border-b border-[var(--border)]/40'
         }`}
         role="banner"
       >
          {/* DESKTOP HEADER - MINIMAL LUXURY */}
          <div className="container-wide mx-auto px-4 md:px-8 lg:px-12">
            <div className="hidden md:flex items-center justify-between h-[104px] md:h-[112px] gap-4 md:gap-8 relative">
              <Link
                to="/"
                className="flex-shrink-0 leading-tight group -ml-2 md:-ml-4 flex items-center"
                aria-label="HOK Interiors - Home"
              >
                <div
                  className="relative flex items-center"
                  style={{
                    transform: prefersReducedMotion
                      ? undefined
                      : `perspective(800px) rotateX(${mousePos.y * 6}deg) rotateY(${mousePos.x * -6}deg)`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                   <img
                     src="/favicon.svg"
                     className="h-28 w-28 md:h-32 md:w-32 object-contain drop-shadow-[0_4px_30px_rgba(0,0,0,0.15)]"
                     alt=""
                     aria-hidden="true"
                   />
                </div>
              </Link>

             <nav className="flex items-center justify-end flex-1 relative" role="navigation" aria-label="Main navigation">
               <div
                 className="flex items-center gap-3 animate-fade-in"
                 style={{ animationDelay: '0.05s' }}
               >
                  <div className="relative">
                    <button
                      onClick={() => setCartOpen((p) => !p)}
                      className="relative p-3 rounded-full text-[#2A241F]/70 bg-[var(--card)]/60 backdrop-blur-xl border border-[var(--border)]/50 transition-all duration-300 hover:bg-[#E6D8C9]/50 hover:text-[#2A241F] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                      aria-label={`Shopping cart${totalItems > 0 ? ` with ${totalItems} items` : ''}`}
                      aria-expanded={cartOpen}
                      aria-haspopup="true"
                    >
                      <ShoppingCart size={20} md={22} strokeWidth={1.5} aria-hidden="true" />
                      {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-5 rounded-full bg-[#E89A43] text-white text-[10px] font-semibold flex items-center justify-center px-1.5 animate-badge-in">
                          {totalItems > 99 ? '99+' : totalItems}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="relative" role="menu" aria-label="User menu">
                    <button
                      onClick={() => setUserMenuOpen((p) => !p)}
                      className="relative p-3 rounded-full text-[#2A241F]/70 bg-[var(--card)]/60 backdrop-blur-xl border border-[var(--border)]/50 transition-all duration-300 hover:bg-[#E6D8C9]/50 hover:text-[#2A241F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                      aria-expanded={userMenuOpen}
                      aria-haspopup="true"
                      aria-label="User menu"
                    >
                     <User size={18} md={20} strokeWidth={1.5} aria-hidden="true" className="transition-colors duration-300" />
                     <svg
                       width="12"
                       height="12"
                       viewBox="0 0 24 24"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth={1.5}
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                       aria-hidden="true"
                     >
                       <path d="M6 9l6 6 6-6" />
                     </svg>
                   </button>
                 </div>
               </div>
             </nav>
           </div>

           {/* MOBILE HEADER - LOGO CENTERED, CART + HAMBURGER ON SIDES */}
           <div className="flex md:hidden items-center justify-between h-16 px-4 relative">
              <Link
                to="/"
                className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center leading-none group z-10"
                aria-label="HOK Interiors - Home"
              >
                <div className="relative flex items-center">
                   <img
                     src="/favicon.svg"
                     className="h-24 w-24 object-contain drop-shadow-[0_4px_30px_rgba(0,0,0,0.15)]"
                     alt=""
                     aria-hidden="true"
                   />
                </div>
              </Link>

             <button
               onClick={() => setCartOpen((p) => !p)}
               className="relative p-2 rounded-full text-[#2A241F]/70 transition-all duration-300 hover:bg-[#E6D8C9]/50 active:scale-95 z-[9999]"
               aria-label={`Shopping cart${totalItems > 0 ? ` with ${totalItems} items` : ''}`}
               aria-expanded={cartOpen}
               aria-haspopup="true"
             >
               <ShoppingCart size={22} strokeWidth={1.5} aria-hidden="true" />
               {totalItems > 0 && (
                 <span className="absolute -top-1 -right-1 min-w-[18px] h-5 rounded-full bg-[#E89A43] text-white text-[10px] font-semibold flex items-center justify-center px-1.5">
                   {totalItems > 99 ? '99+' : totalItems}
                 </span>
               )}
             </button>

             <button
               className="flex h-14 w-14 items-center justify-center rounded-full text-[#8B5E3C] bg-white/95 backdrop-blur-sm shadow-xl transition-all duration-300 hover:bg-[#E6D8C9]/60 active:scale-95 z-[9999]"
               onClick={() => setMobileOpen((p) => !p)}
               aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
               aria-expanded={mobileOpen}
             >
               {mobileOpen ? <X size={26} strokeWidth={2.5} /> : <Menu size={26} strokeWidth={2.5} />}
             </button>
           </div>
         </div>
       </header>

       {createPortal(
         <CartMenu
           isOpen={cartOpen}
           onClose={() => setCartOpen(false)}
           isAuthenticated={isAuthenticated}
           cartItems={cartItems}
           totalItems={totalItems}
           cartSubtotal={cartSubtotal}
           onRemove={removeFromCart}
           onChangeQty={setCartQuantity}
         />,
         document.body,
       )}
       {createPortal(
         <UserMenu
           isOpen={userMenuOpen}
           onClose={() => setUserMenuOpen(false)}
           isAuthenticated={isAuthenticated}
           isAdmin={isAdmin}
           onLogout={handleLogout}
         />,
         document.body,
       )}

       {/* FULLSCREEN MOBILE MENU - rendered outside header to avoid stacking context issues */}
       <AnimatePresence>
         {mobileOpen && (
           <>
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.35 }}
               className="fixed inset-0 z-[9998] md:hidden bg-[#2A241F]/50 backdrop-blur-md"
               onClick={() => setMobileOpen(false)}
               aria-hidden="true"
             />
             <motion.div
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
               className="fixed inset-0 z-[9999] md:hidden w-full h-full bg-[#FAF8F4] shadow-2xl"
             >
               <div className="flex h-full flex-col">
                 <div className="flex items-center justify-between px-6 h-[72px] border-b border-[#E6D8C9]/40">
                   <span className="text-[11px] font-semibold tracking-[0.2em] text-[#8B5E3C]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                     Menu
                   </span>
                   <button
                     className="p-2 rounded-full text-[#2A241F] transition-all duration-300 hover:bg-[#E6D8C9]/50 active:scale-90"
                     onClick={() => setMobileOpen(false)}
                     aria-label="Close menu"
                   >
                     <X size={24} strokeWidth={1.5} />
                   </button>
                 </div>

                 <motion.nav
                   variants={menuVariants}
                   initial="hidden"
                   animate="visible"
                   exit="exit"
                   className="flex-1 overflow-y-auto px-6 py-8"
                   role="navigation"
                   aria-label="Mobile navigation"
                 >
                   <div className="space-y-1">
                     {FULLSCREEN_MENU_ITEMS.map((item) => {
                       const isActive = location.pathname === item.to
                       const Icon = item.icon
                       return (
                         <motion.div key={item.to} variants={itemVariants}>
                           <Link
                             to={item.to}
                             onClick={() => setMobileOpen(false)}
                             onMouseEnter={() => handlePrefetch(item.to)}
                             className={`flex items-center gap-5 rounded-2xl px-5 py-4.5 transition-all duration-300 ${
                               isActive
                                 ? 'bg-[#E89A43]/10 text-[#E89A43]'
                                 : 'text-[#2A241F] hover:bg-[#E6D8C9]/40'
                             }`}
                             aria-current={isActive ? 'page' : undefined}
                           >
                             <span className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300 ${
                               isActive ? 'bg-[#E89A43]/15 text-[#E89A43]' : 'bg-[#E6D8C9]/40 text-[#2A241F]/70'
                              }`}>
                               {Icon ? <Icon size={20} strokeWidth={1.5} aria-hidden="true" /> : <span className="inline-block h-5 w-5 rounded-full bg-white/10" />}
                             </span>
                             <span className="font-display text-lg md:text-xl font-normal tracking-wide">
                               {item.label}
                             </span>
                           </Link>
                         </motion.div>
                       )
                     })}
                   </div>

                     <div className="mt-10 space-y-4">
                       {isAuthenticated && isAdmin ? (
                         <>
                           <motion.div variants={itemVariants}>
                             <Link
                               to="/admin"
                               onClick={() => setMobileOpen(false)}
                               className="flex items-center gap-5 rounded-2xl px-5 py-4.5 text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-all duration-300"
                             >
                               <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E6D8C9]/40 text-[#2A241F]/70">
                                 <LayoutDashboard size={20} strokeWidth={1.5} aria-hidden="true" />
                               </span>
                               <span className="font-display text-lg md:text-xl font-normal tracking-wide">Admin Dashboard</span>
                             </Link>
                           </motion.div>
                           <motion.button
                            variants={itemVariants}
                            onClick={() => { handleLogout(); setMobileOpen(false) }}
                            className="flex items-center gap-5 rounded-2xl px-5 py-4.5 text-[#C62828] hover:bg-[#C62828]/5 transition-all duration-300 w-full"
                          >
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E6D8C9]/40 text-[#C62828]">
                              <LogOut size={20} strokeWidth={1.5} aria-hidden="true" />
                            </span>
                            <span className="font-display text-lg md:text-xl font-normal tracking-wide">Logout</span>
                          </motion.button>
                         </>
                       ) : isAuthenticated ? (
                          <motion.div variants={itemVariants} className="space-y-3">
                            <Link
                              to="/orders"
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center justify-center gap-2 rounded-full border border-[#E6D8C9]/60 bg-white/80 px-6 py-3.5 text-sm font-medium text-[#2A241F] hover:border-[#E89A43] hover:text-[#E89A43] transition-all duration-300"
                            >
                              <Receipt size={16} strokeWidth={1.5} aria-hidden="true" />
                              Orders
                            </Link>
                            <motion.button
                              variants={itemVariants}
                              onClick={() => { handleLogout(); setMobileOpen(false) }}
                              className="flex items-center gap-5 rounded-2xl px-5 py-4.5 text-[#C62828] hover:bg-[#C62828]/5 transition-all duration-300 w-full"
                            >
                              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E6D8C9]/40 text-[#C62828]">
                                <LogOut size={20} strokeWidth={1.5} aria-hidden="true" />
                              </span>
                              <span className="font-display text-lg md:text-xl font-normal tracking-wide">Logout</span>
                            </motion.button>
                          </motion.div>
                        ) : (
                          <motion.div variants={itemVariants} className="space-y-3">
                            <Link
                              to="/signup"
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center justify-center gap-2 rounded-full border border-[#E6D8C9]/60 bg-white/80 px-6 py-3.5 text-sm font-medium text-[#2A241F] hover:border-[#E89A43] hover:text-[#E89A43] transition-all duration-300"
                            >
                              <User size={16} strokeWidth={1.5} aria-hidden="true" />
                              Sign Up
                            </Link>
                            <Link
                              to="/login"
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center justify-center gap-2 rounded-full border border-[#E6D8C9]/60 bg-white/80 px-6 py-3.5 text-sm font-medium text-[#2A241F] hover:border-[#E89A43] hover:text-[#E89A43] transition-all duration-300"
                            >
                              <LogOut size={16} strokeWidth={1.5} aria-hidden="true" />
                              Login
                            </Link>
                          </motion.div>
                        )}
                     </div>
                 </motion.nav>
               </div>
             </motion.div>
           </>
         )}
       </AnimatePresence>
    </>
  )
})

export default Navbar
