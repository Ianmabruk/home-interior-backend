import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  Mail,
  CheckCircle2,
  X,
  Shield,
  User,
  Settings2,
  Menu,
  LayoutDashboard,
  Images,
  ShoppingBag,
  Brush,
  Info,
  MessageSquare,
  Newspaper,
  Sparkles,
  LogOut,
  TrendingUp,
  Package,
  DollarSign,
  Users,
  Clock,
} from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Sidebar } from '../../components/admin/Sidebar'
import { DashboardOverview } from '../../components/admin/DashboardOverview'
import { PortfolioDashboard } from '../../components/admin/PortfolioDashboard'
import { ShopDashboard } from '../../components/admin/ShopDashboard'
import { VirtualInteriorDashboard } from '../../components/admin/VirtualInteriorDashboard'
import { AboutDashboard } from '../../components/admin/AboutDashboard'
import { ConsultationDashboard } from '../../components/admin/ConsultationDashboard'
import { NewsletterDashboard } from '../../components/admin/NewsletterDashboard'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portfolio', icon: Images },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'virtual', label: 'Virtual Interior Design', icon: Brush },
  { id: 'about', label: 'About', icon: Info },
  { id: 'consultations', label: 'Consultations', icon: MessageSquare },
  { id: 'newsletter', label: 'Newsletter', icon: Newspaper },
  { id: 'settings', label: 'Settings', icon: Settings2 },
]

export const AdminPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [overview, setOverview] = useState(null)
  const [messages, setMessages] = useState([])
  const [unreadOrders, setUnreadOrders] = useState(0)
  const [showNotif, setShowNotif] = useState(false)
  const [status, setStatus] = useState('')
  const [settingsForm, setSettingsForm] = useState({
    siteName: '',
    supportEmail: '',
    currency: 'USD',
    maintenanceMode: false,
    shippingPolicy: '',
    returnPolicy: '',
    socialLinks: '',
  })

  const fetchAll = useCallback(() => {
    Promise.all([
      api.get('/admin/overview').catch(() => ({ data: null })),
      api.get('/messages').catch(() => ({ data: [] })),
      api.get('/admin/settings').catch(() => ({ data: null })),
    ])
      .then(([overviewRes, messagesRes, settingsRes]) => {
        if (overviewRes.data) setOverview(overviewRes.data)
        setMessages(messagesRes.data || [])
        if (settingsRes.data) {
          setSettingsForm({
            siteName: settingsRes.data.siteName || '',
            supportEmail: settingsRes.data.supportEmail || '',
            currency: settingsRes.data.currency || 'USD',
            maintenanceMode: Boolean(settingsRes.data.maintenanceMode),
            shippingPolicy: settingsRes.data.shippingPolicy || '',
            returnPolicy: settingsRes.data.returnPolicy || '',
            socialLinks: settingsRes.data.socialLinks || '',
          })
        }
      })
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    const handler = () => { fetchAll() }
    window.addEventListener('admin:data-changed', handler)
    return () => window.removeEventListener('admin:data-changed', handler)
  }, [fetchAll])

  const submitSettings = async (e) => {
    e.preventDefault()
    try {
      await api.put('/admin/settings', settingsForm)
      fetchAll()
      setStatus('Settings saved successfully.')
      setTimeout(() => setStatus(''), 3000)
    } catch {
      setStatus('Settings save failed. Please try again.')
    }
  }

  const markNotificationsRead = () => setUnreadOrders(0)

  const currentTab = tabs.find((t) => t.id === activeTab)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sidebarOpen={sidebarOpen}
        mobileOpen={mobileSidebar}
        onCloseMobile={() => setMobileSidebar(false)}
      />

      <div className="flex flex-1 flex-col lg:pl-[280px]">
        <header className="sticky top-4 z-30 mx-4 lg:mx-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl shadow-[0_8px_32px_rgba(42,36,31,0.06)]"
          >
            <div className="flex items-center gap-4 px-5 h-16">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen((s) => !s)}
                className="hidden lg:flex p-2 rounded-xl hover:bg-[var(--secondary)]/60 transition-colors text-[var(--primary)]"
              >
                {sidebarOpen ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileSidebar(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-[var(--secondary)]/60 transition-colors text-[var(--primary)]"
              >
                <Menu size={18} />
              </motion.button>

              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]/40" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-full border border-[var(--border)] bg-white focus:ring-2 focus:ring-[var(--accent)]/20 outline-none text-[var(--primary)] placeholder:text-[var(--primary)]/40 transition-all"
                />
              </div>

              <div className="flex items-center gap-1">
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowNotif((s) => !s)
                      if (!showNotif) markNotificationsRead()
                    }}
                    className="relative p-2.5 rounded-full hover:bg-[var(--secondary)]/60 transition-colors text-[var(--primary)]/60"
                    title="Order notifications"
                  >
                    <Bell size={18} />
                    {unreadOrders > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[var(--error)] text-white text-[10px] flex items-center justify-center font-medium shadow-lg"
                      >
                        {unreadOrders > 99 ? '99+' : unreadOrders}
                      </motion.span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {showNotif && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-[0_10px_40px_rgba(42,36,31,0.1)] border border-[var(--border)]/60 p-4 z-50"
                      >
                        <h4 className="text-sm font-semibold text-[var(--primary)] mb-2">Notifications</h4>
                        <p className="text-xs text-[var(--primary)]/50">
                          {unreadOrders > 0
                            ? `You have ${unreadOrders} unread orders`
                            : 'No new notifications'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative p-2.5 rounded-full hover:bg-[var(--secondary)]/60 transition-colors text-[var(--primary)]/60"
                >
                  <Mail size={18} />
                  {messages.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[var(--error)] text-white text-[10px] flex items-center justify-center font-medium shadow-lg"
                    >
                      {messages.length}
                    </motion.span>
                  )}
                </motion.button>

                <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]/50 ml-1">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent)] flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-[var(--accent)]/20"
                  >
                    {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
                  </motion.div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-[var(--primary)] leading-tight">
                      {user?.fullName || 'Admin'}
                    </p>
                    <p className="text-[10px] text-[var(--primary)]/50 capitalize">
                      {user?.role || 'admin'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </header>

        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="font-display text-3xl md:text-4xl capitalize text-[var(--primary)]">
              {currentTab?.label || activeTab}
            </h1>
            <p className="text-sm text-[var(--primary)]/50 mt-1">
              Manage your {activeTab.replace('-', ' ')}
            </p>
          </motion.div>

          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="toast toast-success flex items-center gap-2 mb-5 bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20 rounded-xl px-4 py-3 text-sm shadow-lg border"
              >
                <CheckCircle2 size={16} />
                <span className="flex-1">{status}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setStatus('')}
                  className="opacity-60 hover:opacity-100"
                >
                  <X size={14} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardOverview overview={overview} onNavigate={setActiveTab} />
              )}
              {activeTab === 'portfolio' && <PortfolioDashboard />}
              {activeTab === 'shop' && <ShopDashboard />}
              {activeTab === 'virtual' && <VirtualInteriorDashboard />}
              {activeTab === 'about' && <AboutDashboard />}
              {activeTab === 'consultations' && <ConsultationDashboard />}
              {activeTab === 'newsletter' && <NewsletterDashboard />}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-2xl">
                  <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={submitSettings}
                    className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] space-y-5"
                  >
                    <div>
                      <h2 className="font-display text-2xl text-[var(--primary)]">Website Settings</h2>
                      <p className="text-xs text-[var(--primary)]/50 mt-1">Configure your website preferences</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/60">Site Name</label>
                      <input
                        value={settingsForm.siteName}
                        onChange={(e) => setSettingsForm((s) => ({ ...s, siteName: e.target.value }))}
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                        placeholder="HOK Interior Designs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/60">Support Email</label>
                      <input
                        value={settingsForm.supportEmail}
                        onChange={(e) => setSettingsForm((s) => ({ ...s, supportEmail: e.target.value }))}
                        type="email"
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                        placeholder="info@hqkinteriors.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/60">Default Currency</label>
                      <select
                        value={settingsForm.currency}
                        onChange={(e) => setSettingsForm((s) => ({ ...s, currency: e.target.value }))}
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="KES">KES - Kenyan Shilling</option>
                        <option value="EUR">EUR - Euro</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--primary)]">Maintenance Mode</p>
                        <p className="text-[10px] text-[var(--primary)]/50 mt-0.5">Temporarily disable public storefront</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        role="switch"
                        aria-checked={settingsForm.maintenanceMode}
                        onClick={() => setSettingsForm((s) => ({ ...s, maintenanceMode: !s.maintenanceMode }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settingsForm.maintenanceMode ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                        }`}
                      >
                        <motion.span
                          animate={{ x: settingsForm.maintenanceMode ? 20 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md"
                        />
                      </motion.button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/60">Shipping Policy</label>
                      <textarea
                        value={settingsForm.shippingPolicy}
                        onChange={(e) => setSettingsForm((s) => ({ ...s, shippingPolicy: e.target.value }))}
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                        rows={3}
                        placeholder="Enter shipping policy..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/60">Return Policy</label>
                      <textarea
                        value={settingsForm.returnPolicy}
                        onChange={(e) => setSettingsForm((s) => ({ ...s, returnPolicy: e.target.value }))}
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                        rows={3}
                        placeholder="Enter return policy..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/60">Social Links (JSON format)</label>
                      <textarea
                        value={settingsForm.socialLinks}
                        onChange={(e) => setSettingsForm((s) => ({ ...s, socialLinks: e.target.value }))}
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition font-mono text-xs resize-none"
                        placeholder='{"instagram": "url", "facebook": "url"}'
                        rows={2}
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="bg-[var(--accent)] text-white w-full py-3 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--accent)] hover:shadow-lg"
                    >
                      Save Settings
                    </motion.button>
                  </motion.form>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}