import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Images,
  ShoppingBag,
  Brush,
  Info,
  MessageSquare,
  Newspaper,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portfolio', icon: Images },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'virtual', label: 'Virtual Interior Design', icon: Brush },
  { id: 'about', label: 'About', icon: Info },
  { id: 'consultations', label: 'Consultations', icon: MessageSquare },
  { id: 'newsletter', label: 'Newsletter', icon: Newspaper },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export const Sidebar = ({ activeTab, onTabChange, sidebarOpen, mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout?.()
  }

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--primary)]/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={onCloseMobile}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 280 : 72,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed inset-y-0 left-0 z-40 flex flex-col bg-[var(--primary)] text-white border-r border-white/5 shadow-2xl"
      >
        <div className="flex items-center gap-3 h-20 px-5 border-b border-white/10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--accent)]/20"
          >
            <Sparkles size={20} className="text-white" />
          </motion.div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">Admin Panel</p>
                <p className="text-base font-semibold whitespace-nowrap font-display text-white">HOK Studio</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
                className={`relative w-full flex items-center ${sidebarOpen ? 'gap-3 px-4' : 'justify-center px-2'} py-2.5 text-sm font-medium transition-all duration-200 hover:bg-white/10 hover:text-white ${isActive ? 'text-[var(--primary)] bg-white rounded-xl shadow-sm font-semibold' : 'text-white/75'}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 bg-white rounded-xl shadow-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className={`relative z-10 ${isActive ? 'text-[var(--primary)]' : ''}`}>
                  <Icon size={18} className="flex-shrink-0" />
                </span>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.2 }}
                      className={`relative z-10 font-medium whitespace-nowrap ${isActive ? 'text-[var(--primary)]' : 'text-white/75'}`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          {sidebarOpen ? (
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
                onClick={handleLogout}
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
              onClick={handleLogout}
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