import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, ShoppingBag, Briefcase, Menu, X, FolderKanban, Info, Grid3X3 } from 'lucide-react'
import { SHOP_CATEGORIES } from '../../utils/constants'
import { AnimatePresence, motion } from 'framer-motion'

const navItems = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/virtual-interior-design', label: 'Virtual', icon: Briefcase },
  { to: '/about', label: 'About', icon: Info },
  { to: '#more', label: 'Menu', icon: Menu },
]

const categoryIcons = {
  'Living Room': { icon: ShoppingBag, emoji: false },
  Kitchen: { icon: '🍳', emoji: true },
  Bedroom: { icon: '🛏', emoji: true },
  Dining: { icon: '🍽', emoji: true },
  Outdoor: { icon: '🌿', emoji: true },
  Commercial: { icon: '🏢', emoji: true },
  Decor: { icon: Grid3X3, emoji: false },
  Lighting: { icon: '💡', emoji: true },
  Office: { icon: '💼', emoji: true },
  'Custom Designs': { icon: '✨', emoji: true },
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
      {/* Mobile Bottom Navigation - Premium Frosted Glass */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/10 backdrop-blur-2xl border-t border-white/20 md:hidden safe-area-pb">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.to, item.exact)
            return item.to === '#more' ? (
              <button
                key="more"
                onClick={() => setDrawerOpen(true)}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-orange/30"
                aria-label="Open menu"
              >
                <Icon size={22} strokeWidth={1.5} className="text-white/80" />
              </button>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 hover:bg-white/10"
                aria-label={item.label}
              >
                <Icon
                  size={22}
                  strokeWidth={1.5}
                  className={active ? 'text-orange' : 'text-white/70'}
                />
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
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 top-0 z-50 w-80 max-w-[85%] bg-black/95 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
                <p className="text-sm font-semibold uppercase tracking-widest text-orange">Menu</p>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              <div className="p-5">
                <div className="space-y-2">
                  {SHOP_CATEGORIES.map((cat) => {
                    const icon = categoryIcons[cat]
                    return (
                      <Link
                        key={cat}
                        to={`/shop?category=${encodeURIComponent(cat)}`}
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-orange rounded-xl"
                      >
                        <span className="text-orange w-5 h-5 flex items-center justify-center">
                          {icon?.emoji ? <span className="text-sm">{icon.icon}</span> : (icon && <icon.icon size={18} />)}
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
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-orange rounded-xl"
                  >
                    <span className="text-orange">📁</span>
                    Portfolio
                  </Link>
                  <Link
                    to="/projects"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-orange rounded-xl"
                  >
                    <span className="text-orange">🎬</span>
                    Projects
                  </Link>
                  <Link
                    to="/virtual-interior-design"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-orange rounded-xl"
                  >
                    <span className="text-orange">✨</span>
                    Virtual Interior
                  </Link>
                  <Link
                    to="/about"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-orange rounded-xl"
                  >
                    <span className="text-orange">ℹ</span>
                    About Us
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