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
      className={`relative rounded-3xl border border-border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg ${isVirtualDesign ? 'overflow-hidden' : ''}`}
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest/10 text-forest">
              <Package size={20} strokeWidth={1.5} />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-charcoal truncate">
              Order #{order._id?.slice ? order._id.slice(-6).toUpperCase() : order._id}
            </p>
            <p className="text-xs text-stone/60 truncate">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <StatusBadge status={order.status} />
          <p className="font-semibold text-charcoal text-sm whitespace-nowrap">
            ${Number(order.total || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-xl p-3 text-xs transition-colors ${isVirtualDesign ? 'bg-white/80 backdrop-blur-sm' : 'bg-stone-50'}`}
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
                  <p className="font-medium text-charcoal truncate">{item.name || item.productName || 'Product'}</p>
                  {item.variant?.colorName && (
                    <p className="text-stone/60">{item.variant.colorName}</p>
                  )}
                  <p className="text-stone/60">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-charcoal whitespace-nowrap">
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
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
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
          className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full text-charcoal/40 transition-colors hover:text-charcoal hover:bg-stone-100"
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bronze/10 text-bronze">
            <Lock size={24} strokeWidth={1.5} />
          </div>
          <h2 className="font-['Playfair_Display'] text-2xl font-medium text-charcoal">Change Password</h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={form.current}
              onChange={(e) => setForm(f => ({ ...f, current: e.target.value }))}
              className="input w-full"
              placeholder="Current password"
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={form.new}
              onChange={(e) => setForm(f => ({ ...f, new: e.target.value }))}
              className="input w-full"
              placeholder="New password (min 8 chars)"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))}
              className="input w-full"
              placeholder="Confirm new password"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-forest text-white flex-1 py-3 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-forestDark hover:shadow-lg disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Updating...
                </span>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
const LoggedInAccountPage = ({ user, orders, ordersLoading, onLogout, onChangePassword }) => {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (changePasswordOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [changePasswordOpen])

  const pendingOrders = orders.filter(o => ['pending', 'processing', 'confirmed', 'design_review', 'in_design'].includes(o.status))
  const activeOrders = orders.filter(o => ['shipped', 'design_approved'].includes(o.status))
  const completedOrders = orders.filter(o => ['delivered'].includes(o.status))
  const cancelledOrders = orders.filter(o => ['cancelled'].includes(o.status))

  const handleChangePassword = async (current, newPass) => {
    setChangingPassword(true)
    setPasswordError('')
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: newPass })
      setChangePasswordOpen(false)
    } catch (err) {
      throw err
    }
  }

  if (ordersLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="animate-pulse space-y-8">
          <div className="h-14 w-64 rounded bg-stone-100" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="h-64 rounded-2xl bg-stone-100" />
            <div className="md:col-span-2 h-64 rounded-2xl bg-stone-100" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="mb-10">
        <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl font-medium text-charcoal">My Account</h1>
        <p className="mt-2 text-base text-stone/60">Welcome back, <span className="font-medium text-charcoal">{user?.fullName || 'User'}</span></p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Profile & Security */}
        <aside className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl border border-border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-bronze to-amber text-white">
                <User size={24} strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-['Playfair_Display'] text-xl font-medium text-charcoal">{user?.fullName || 'User'}</p>
                <p className="text-sm text-stone/60">{user?.email}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-stone/60">
                <Mail size={16} className="text-bronze" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone/60">
                <Shield size={16} className="text-forest" />
                <span>{user?.role || 'Customer'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone/60">
                <Home size={16} className="text-stone/50" />
                <span>Member since {formatDate(user?.createdAt)}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <button
                onClick={() => setChangePasswordOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-charcoal transition-all hover:bg-stone-50 hover:border-bronze"
              >
                <Lock size={16} strokeWidth={1.5} className="text-bronze" />
                Change Password
              </button>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-border bg-white p-5 shadow-sm"
          >
            <h3 className="font-['Playfair_Display'] text-lg font-medium text-charcoal mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone/60">Total Orders</span>
                <span className="font-semibold text-charcoal">{orders.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone/60">Pending</span>
                <span className="font-semibold text-amber-700">{pendingOrders.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone/60">Active</span>
                <span className="font-semibold text-blue-700">{activeOrders.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone/60">Completed</span>
                <span className="font-semibold text-green-700">{completedOrders.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone/60">Cancelled</span>
                <span className="font-semibold text-red-700">{cancelledOrders.length}</span>
              </div>
            </div>
          </motion.div>
        </aside>

        {/* Orders */}
        <section className="lg:col-span-3 space-y-6">
          {ordersLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl border border-border bg-white p-5">
                  <div className="animate-pulse space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-stone-100" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-32 bg-stone-100 rounded" />
                        <div className="h-3 w-24 bg-stone-100 rounded" />
                      </div>
                      <div className="h-8 w-24 bg-stone-100 rounded-full ml-auto" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 rounded-3xl border border-dashed border-border bg-stone-50"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bronze/10 text-bronze">
                <Package size={28} strokeWidth={1.5} />
              </div>
              <h2 className="font-['Playfair_Display'] text-2xl font-medium text-charcoal">No Orders Yet</h2>
              <p className="mt-2 text-stone/60">When you place an order, it will appear here.</p>
              <Link to="/shop" className="btn-primary inline-flex mt-6">
                <Sparkles size={14} strokeWidth={1.5} />
                Start Shopping
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Pending Orders */}
              {pendingOrders.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-['Playfair_Display'] text-2xl font-medium text-charcoal flex items-center gap-2">
                      <Clock className="text-amber-600" size={24} strokeWidth={1.5} />
                      Pending Orders
                    </h2>
                    <span className="text-sm text-amber-700 font-medium px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                      {pendingOrders.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {pendingOrders.map((order) => (
                      <OrderCard key={order._id} order={order} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Active Orders */}
              {activeOrders.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-['Playfair_Display'] text-2xl font-medium text-charcoal flex items-center gap-2">
                      <Truck className="text-blue-600" size={24} strokeWidth={1.5} />
                      Active Orders
                    </h2>
                    <span className="text-sm text-blue-700 font-medium px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                      {activeOrders.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {activeOrders.map((order) => (
                      <OrderCard key={order._id} order={order} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Completed Orders */}
              {completedOrders.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-['Playfair_Display'] text-2xl font-medium text-charcoal flex items-center gap-2">
                      <CheckCircle className="text-green-600" size={24} strokeWidth={1.5} />
                      Completed Orders
                    </h2>
                    <span className="text-sm text-green-700 font-medium px-3 py-1 rounded-full bg-green-50 border border-green-200">
                      {completedOrders.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {completedOrders.map((order) => (
                      <OrderCard key={order._id} order={order} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Cancelled Orders */}
              {cancelledOrders.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-['Playfair_Display'] text-2xl font-medium text-charcoal flex items-center gap-2">
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
        </section>
      </div>

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  )
}

export const AccountPage = () => {
  const { user, refreshUser, loading: authLoading, logout } = useAuth()
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await api.get('/orders/me')
        setOrders(res.data || [])
      } catch (err) {
        console.warn('[account] failed to load orders:', err?.response?.status, err?.message)
        setOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }
    if (user) loadOrders()
  }, [user])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleChangePassword = async (current, newPass) => {
    setChangingPassword(true)
    setPasswordError('')
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: newPass })
      setChangePasswordOpen(false)
    } catch (err) {
      throw err
    } finally {
      setChangingPassword(false)
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="animate-pulse space-y-8">
          <div className="h-14 w-64 rounded bg-stone-100" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="h-64 rounded-2xl bg-stone-100" />
            <div className="md:col-span-2 h-64 rounded-2xl bg-stone-100" />
          </div>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  return <LoggedInAccountPage user={user} orders={orders} ordersLoading={ordersLoading} onLogout={handleLogout} onChangePassword={handleChangePassword} />
}