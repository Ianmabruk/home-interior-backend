import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, ShoppingBag, Briefcase, Heart, ShoppingCart, Menu, X, Grid3X3 } from 'lucide-react'
import { SHOP_CATEGORIES } from '../../utils/constants'
import { AnimatePresence, motion } from 'framer-motion'

const navItems = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
  { to: '/virtual-interior-design', label: 'Virtual Interior', icon: Briefcase },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '#more', label: 'More', icon: Menu },
]

const categoryIcons = {
  'Living Room': ShoppingBag,
  Kitchen: () => <span className="text-sm">🍳</span>,
  Bedroom: () => <span className="text-sm">🛏</span>,
  Dining: () => <span className="text-sm">🍽</span>,
  Outdoor: () => <span className="text-sm">🌿</span>,
  Commercial: () => <span className="text-sm">🏢</span>,
  Decor: Grid3X3,
  Lighting: () => <span className="text-sm">💡</span>,
  Office: () => <span className="text-sm">💼</span>,
  'Custom Designs': () => <span className="text-sm">✨</span>,
}

export const MobileNav = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  const isActive = (to, exact) => {
    if (exact && location.pathname === to) return true
    if (!exact && to !== '/' && location.pathname.startsWith(to)) return true
    return false
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-white/10 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-3 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.to, item.exact)
            return item.to === '#more' ? (
              <button
                key="more"
                onClick={() => setDrawerOpen(true)}
                className={`flex flex-col items-center gap-1 px-3 py-2 text-2xs font-medium uppercase tracking-widest transition ${
                  active ? 'text-orange' : 'text-white/50 hover:text-orange'
                }`}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span>More</span>
              </button>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 px-3 py-2 text-2xs font-medium uppercase tracking-widest transition ${
                  active ? 'text-orange' : 'text-white/50 hover:text-orange'
                }`}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Drawer Menu */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-ink/60"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 top-0 z-50 w-80 max-w-[85%] bg-black shadow-2xl"
            >
              <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
                <p className="text-sm font-semibold uppercase tracking-widest text-orange">Categories</p>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:text-orange"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              <div className="p-5">
                <div className="space-y-2">
                  {SHOP_CATEGORIES.map((cat) => {
                    const IconComp = categoryIcons[cat] || Grid3X3
                    return (
                      <Link
                        key={cat}
                        to={`/shop?category=${encodeURIComponent(cat)}`}
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-orange rounded-lg"
                      >
                        <span className="text-orange">
                          <IconComp size={16} />
                        </span>
                        {cat}
                      </Link>
                    )
                  })}
                </div>

                <div className="mt-6 sm:mt-8 space-y-2 border-t border-white/10 pt-5">
                  <Link
                    to="/portfolio"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-orange rounded-lg"
                  >
                    <span className="text-orange">📁</span>
                    Portfolio
                  </Link>
                  <Link
                    to="/virtual-interior-design"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-orange rounded-lg"
                  >
                    <span className="text-orange">✨</span>
                    Virtual Interior
                  </Link>
                  <Link
                    to="/projects"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-orange rounded-lg"
                  >
                    <span className="text-orange">🎬</span>
                    Projects
                  </Link>
                  <Link
                    to="/about"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-orange rounded-lg"
                  >
                    <span className="text-orange">ℹ</span>
                    About Us
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-orange rounded-lg"
                  >
                    <span className="text-orange">💬</span>
                    Chat Support
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}