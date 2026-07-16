import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'
import {
  Package,
  Truck,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Mail,
  Lock,
  Shield,
  CreditCard,
  Home,
  Sparkles,
  ArrowRight,
  Loader2,
  Check,
  X,
  Eye,
  Edit,
  Menu,
  X as XIcon,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Heart,
  Bookmark,
  Calendar,
  Settings,
} from 'lucide-react'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

const getStatusConfig = (status) => {
  const configs = {
    pending: { label: 'Pending', icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    processing: { label: 'Processing', icon: RotateCcw, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    shipped: { label: 'Shipped', icon: Truck, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-700 bg-green-50 border-green-200' },
    cancelled: { label: 'Cancelled', icon: XIcon, color: 'text-red-700 bg-red-50 border-red-200' },
    confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    design_review: { label: 'Design Review', icon: Sparkles, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    in_design: { label: 'In Design', icon: Sparkles, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    design_approved: { label: 'Design Approved', icon: CheckCircle, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  }
  return configs[status] || { label: status, icon: Package, color: 'text-stone-600 bg-stone-100 border-stone-200' }
}

const StatusBadge = ({ status, className = '' }) => {
  const config = getStatusConfig(status)
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${config.color} ${className}`}>
      <Icon size={10} strokeWidth={2} />
      {config.label}
    </span>
  )
}

const OrderCard = ({ order }) => {
  const isVirtualDesign = order.type === 'virtual_design' || order.items?.some(item => item.type === 'virtual_design')
  const virtualItem = order.items?.find(item => item.type === 'virtual_design' || item.imageUrl)
  const bgImage = virtualItem?.imageUrl || virtualItem?.image || order.backgroundImage

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative rounded-3xl border border-linen bg-white p-5 shadow-soft transition-all duration-300 hover:shadow-lg ${isVirtualDesign ? 'overflow-hidden' : ''}`}
    >
      {isVirtualDesign && bgImage && (
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <img
            src={getOptimizedUrl(bgImage, { width: 800, crop: 'limit' })}
            alt=""
            className="h-full w-full object-cover opacity-10"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-white" />
        </div>
      )}

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {isVirtualDesign ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-bronze/20 to-amber/10 text-bronze">
              <Sparkles size={20} strokeWidth={1.5} />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-luxury-text/10 text-luxury-text">
              <Package size={20} strokeWidth={1.5} />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-luxury-text truncate">
              Order #{order._id?.slice ? order._id.slice(-6).toUpperCase() : order._id}
            </p>
            <p className="text-xs text-stone/60 truncate">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <StatusBadge status={order.status} />
          <p className="font-semibold text-luxury-text text-sm whitespace-nowrap">
            ${Number(order.total || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-linen">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-xl p-3 text-xs transition-colors ${isVirtualDesign ? 'bg-white/80 backdrop-blur-sm' : 'bg-warm-ivory/50'}`}
              >
                {item.imageUrl && (
                  <img
                    src={getOptimizedUrl(item.imageUrl, { width: 80, crop: 'limit' })}
                    alt={item.name}
                    className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-luxury-text truncate">{item.name || item.productName || 'Product'}</p>
                  {item.variant?.colorName && (
                    <p className="text-stone/60">{item.variant.colorName}</p>
                  )}
                  <p className="text-stone/60">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-luxury-text whitespace-nowrap">
                  ${Number(item.price || item.discountPrice || item.priceOverride || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.article>
  )
}

const ChangePasswordModal = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState({ current: '', new: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.new !== form.confirm) {
      setError('New passwords do not match')
      return
    }
    if (form.new.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await onSubmit(form.current, form.new)
      setForm({ current: '', new: '', confirm: '' })
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-luxury-text/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.15)]"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full text-luxury-text/40 transition-colors hover:text-luxury-text hover:bg-linen/50"
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bronze/10 text-bronze">
            <Lock size={24} strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-2xl font-normal text-luxury-text">Change Password</h2>
          <p className="mt-2 text-sm text-stone/60">Enter your current and new password below</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-luxury-text mb-1">Current Password</label>
              <input
                type="password"
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
                className="input-luxury"
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-luxury-text mb-1">New Password</label>
              <input
                type="password"
                value={form.new}
                onChange={(e) => setForm({ ...form, new: e.target.value })}
                className="input-luxury"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-luxury-text mb-1">Confirm New Password</label>
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="input-luxury"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-linen/40 bg-white py-3 text-sm font-medium uppercase tracking-widest text-luxury-text/50 hover:text-bronze hover:border-bronze transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-bronze py-3 text-sm font-medium uppercase tracking-widest text-white transition hover:bg-bronzeDark disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

const tabConfig = [
  { id: 'orders', label: 'Orders', icon: Package, count: 'ordersCount' },
  { id: 'saved', label: 'Saved', icon: Heart, count: 'savedCount' },
  { id: 'profile', label: 'Profile', icon: User, count: null },
  { id: 'settings', label: 'Settings', icon: Settings, count: null },
]

export const AccountPage = () => {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [savedItems, setSavedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders')
      setOrders(res.data || [])
    } catch {
      setOrders([])
    }
  }

  const fetchSaved = async () => {
    try {
      const res = await api.get('/users/saved')
      setSavedItems(res.data || [])
    } catch {
      setSavedItems([])
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
      fetchSaved()
    }
    setLoading(false)
  }, [isAuthenticated])

  const handleChangePassword = async (current, newPass) => {
    await api.post('/users/change-password', { currentPassword: current, newPassword: newPass })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-borderSubtle border-t-bronze" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-warm-ivory px-6">
        <div className="text-center max-w-md">
          <h1 className="font-display text-5xl font-normal text-luxury-text">Sign In Required</h1>
          <p className="mt-4 text-stone">Please sign in to access your account.</p>
          <Link to="/login" className="btn-luxury-primary mt-6 inline-block">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  const cancelledOrders = orders.filter((o) => o.status === 'cancelled')
  const activeOrders = orders.filter((o) => o.status !== 'cancelled')

  return (
    <div className="min-h-screen bg-warm-ivory">
      <section className="section-pad bg-warm-ivory">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          {/* Tab Navigation */}
          <div className="mb-12">
            <div className="flex flex-wrap gap-2 border-b border-linen/40 pb-2">
              {tabConfig.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium uppercase tracking-widest transition rounded-full ${
                    activeTab === tab.id
                      ? 'bg-luxury-text text-warm-ivory shadow-md'
                      : 'text-luxury-text/60 hover:bg-linen/60 hover:text-luxury-text'
                  }`}
                >
                  <tab.icon size={16} strokeWidth={1.5} />
                  {tab.label}
                  {tab.count && user[tab.count] > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bronze/20 text-bronze text-[10px] font-semibold">
                      {user[tab.count]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton h-24 w-full rounded-2xl" />
                  ))}
                </div>
              ) : activeOrders.length === 0 ? (
                <div className="text-center py-16">
                  <Package size={48} strokeWidth={1} className="mx-auto text-linen mb-4" />
                  <p className="font-display text-2xl text-luxury-text/30">No orders yet</p>
                  <p className="mt-2 text-sm text-stone/50">Start shopping to see your orders here</p>
                  <Link to="/shop" className="btn-luxury-primary mt-6 inline-block">Start Shopping</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <OrderCard key={order._id} order={order} />
                  ))}
                </div>
              )}

              {cancelledOrders.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-12 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-normal text-luxury-text flex items-center gap-2">
                      <XIcon className="text-red-600" size={24} strokeWidth={1.5} />
                      Cancelled Orders
                    </h2>
                    <span className="text-sm text-red-700 font-medium px-3 py-1 rounded-full bg-red-50 border border-red-200">
                      {cancelledOrders.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {cancelledOrders.map((order) => (
                      <OrderCard key={order._id} order={order} />
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* Saved Tab */}
          {activeTab === 'saved' && (
            <div className="space-y-6">
              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-80 bg-linen/30 animate-pulse rounded-3xl" />
                  ))}
                </div>
              ) : savedItems.length === 0 ? (
                <div className="text-center py-16">
                  <Heart size={48} strokeWidth={1} className="mx-auto text-linen mb-4" />
                  <p className="font-display text-2xl text-luxury-text/30">No saved items</p>
                  <p className="mt-2 text-sm text-stone/50">Items you save will appear here</p>
                  <Link to="/shop" className="btn-luxury-primary mt-6 inline-block">Start Shopping</Link>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {savedItems.map((item) => (
                    <div key={item._id} className="group relative overflow-hidden bg-white border border-linen shadow-sm hover:shadow-lg transition-all duration-500 rounded-3xl">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1586023943478-ae8b06f48d80?w=400&h=400&fit=crop'}
                        alt={item.name}
                        className="h-56 w-full object-cover transition duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-bronze">{item.category}</p>
                        <h3 className="mt-2 font-display text-xl font-normal text-luxury-text">{item.name}</h3>
                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="font-medium text-luxury-text">${Number(item.discountPrice || item.price || 0).toFixed(2)}</span>
                          {item.discountPrice && <span className="text-sm text-stone/35 line-through">${Number(item.price).toFixed(2)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl space-y-8">
              <div className="bg-white border border-linen rounded-3xl p-8">
                <h2 className="font-display text-2xl font-normal text-luxury-text mb-6">Profile Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b border-linen">
                    <span className="text-stone/60">Full Name</span>
                    <span className="font-medium text-luxury-text">{user.fullName || 'Not set'}</span>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-linen">
                    <span className="text-stone/60">Email</span>
                    <span className="font-medium text-luxury-text">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-linen">
                    <span className="text-stone/60">Phone</span>
                    <span className="font-medium text-luxury-text">{user.phone || 'Not set'}</span>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <span className="text-stone/60">Member Since</span>
                    <span className="font-medium text-luxury-text">{user.createdAt ? formatDate(user.createdAt) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-linen rounded-3xl p-8">
                <h2 className="font-display text-2xl font-normal text-luxury-text mb-6">Change Password</h2>
                <button
                  onClick={() => setChangePasswordOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-linen/40 bg-white px-6 py-3 text-sm font-medium uppercase tracking-widest text-luxury-text/70 hover:border-bronze hover:text-bronze transition"
                >
                  <Lock size={16} strokeWidth={1.5} />
                  Update Password
                </button>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white border border-linen rounded-3xl p-8">
                <h2 className="font-display text-2xl font-normal text-luxury-text mb-6">Notifications</h2>
                <div className="space-y-4">
                  {[
                    { id: 'email-orders', label: 'Order Updates', desc: 'Receive email notifications about your orders' },
                    { id: 'email-promo', label: 'Promotions', desc: 'Receive special offers and promotions' },
                    { id: 'email-newsletter', label: 'Newsletter', desc: 'Receive design inspiration and updates' },
                  ].map((item) => (
                    <label key={item.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-luxury-text">{item.label}</p>
                        <p className="text-sm text-stone/50">{item.desc}</p>
                      </div>
                      <input type="checkbox" className="h-5 w-5 rounded border-linen/40 text-bronze focus:ring-2 focus:ring-bronze/20" defaultChecked />
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-linen rounded-3xl p-8">
                <h2 className="font-display text-2xl font-normal text-luxury-text mb-6">Danger Zone</h2>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 rounded-full bg-error/10 px-6 py-3 text-sm font-medium text-error transition hover:bg-error/20"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  )
}

export default AccountPage