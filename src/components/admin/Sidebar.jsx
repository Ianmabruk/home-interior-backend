import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Images,
  ShoppingBag,
  Brush,
  Info,
  MessageSquare,
  Settings as SettingsIcon,
  LogOut,
  Star,
} from 'lucide-react'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portfolio', icon: Images },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'virtual', label: 'Virtual Designs', icon: Brush },
  { id: 'about', label: 'About', icon: Info },
  { id: 'testimonials', label: 'Testimonials', icon: Star },
  { id: 'consultations', label: 'Consultations', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export const Sidebar = ({ activeTab, onTabChange, mobileOpen, onCloseMobile, isCollapsed, user, onLogout }) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const sidebarOpen = !isCollapsed

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1B1714]/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? (mobileOpen ? 300 : 0) : (isCollapsed ? 88 : 300),
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#1B1714] text-white border-r border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl bg-opacity-90 ${
          isMobile ? 'transform transition-transform duration-300' : ''
        } ${mobileOpen && isMobile ? 'translate-x-0' : isMobile ? '-translate-x-full' : ''}`}
      >

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
          {tabs.map((item, idx) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                onClick={() => {
                  onTabChange(item.id)
                  onCloseMobile()
                }}
                className={`relative w-full flex items-center ${
                  sidebarOpen && !isCollapsed && !isMobile ? 'gap-3 px-4' : 'justify-center px-2'
                } py-3 text-sm font-medium transition-all duration-200 rounded-xl ${
                  isActive
                    ? 'text-[var(--accent)] bg-white/10 rounded-xl shadow-sm font-semibold'
                    : 'text-white/75 hover:bg-white/5 hover:text-white'
                }`}
                title={(!sidebarOpen || isCollapsed || isMobile) && !isActive ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 bg-white/10 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className={`relative z-10 flex-shrink-0 ${isActive ? 'text-[var(--accent)]' : ''}`}>
                  <Icon size={18} className="flex-shrink-0" />
                </span>
                <AnimatePresence>
                  {(sidebarOpen && !isCollapsed && !isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.2 }}
                      className={`relative z-10 font-medium whitespace-nowrap ${isActive ? 'text-[var(--accent)]' : 'text-white/75'}`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          {sidebarOpen && !isCollapsed && !isMobile ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="rounded-2xl p-3 flex items-center gap-3 bg-white/5 border border-white/10"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent)] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-lg shadow-[var(--accent)]/20">
                {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.fullName || 'Admin'}</p>
                <p className="text-[10px] text-white/50 truncate">{user?.email}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition"
                title="Logout"
              >
                <LogOut size={18} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="flex w-full items-center justify-center p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition"
              title="Logout"
            >
              <LogOut size={18} />
            </motion.button>
          )}
        </div>
      </motion.aside>
    </>
  )
}