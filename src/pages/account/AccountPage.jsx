import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Heart, Package, CreditCard, Settings, LogOut, Loader2, ChevronRight, ShoppingBag } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'
import { useCurrency } from '../../context/CurrencyContext'
import { PageMeta } from '../../hooks/usePageMeta'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'payment confirmed': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  'ready for delivery': 'bg-purple-100 text-purple-700 border-purple-200',
  'out for delivery': 'bg-orange-100 text-orange-700 border-orange-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const StatusBadge = ({ status }) => {
  const normalized = (status || 'pending').toLowerCase()
  const classes = STATUS_COLORS[normalized] || 'bg-gray-100 text-gray-700 border-gray-200'
  const label = normalized || 'pending'
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${classes}`}>
      {label}
    </span>
  )
}

export const AccountPage = () => {
  const { user, logout, loading: authLoading } = useAuth()
  const { cart, wishlist, fetchCart, fetchWishlist } = useShop()
  const { formatPrice } = useCurrency()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('overview')
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    const tab = location.pathname.replace('/account/', '') || 'overview'
    if (['overview', 'orders', 'wishlist', 'settings'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [location.pathname])

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/me')
      setOrders(res.data?.data || res.data || [])
    } catch (err) {
      console.warn('[ACCOUNT] Failed to load orders:', err?.message)
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchCart()
      fetchWishlist()
      loadOrders()
    }
  }, [user, fetchCart, fetchWishlist, loadOrders])

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] py-12 md:py-20">
      <PageMeta
        title="My Account — HOK Interior Designs"
        description="Manage your account, orders, wishlist, and settings."
      />
      <div className="container-wide px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 md:mb-16"
        >
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-[var(--primary)]">
            My Account
          </h1>
          <p className="mt-2 text-[var(--primary)]/60">Welcome back, {user?.fullName?.split(' ')[0] || 'Guest'}</p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 shadow-[0_10px_40px_rgba(42,36,31,0.06)] sticky top-24"
            >
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]/40">
                <div className="h-16 w-16 rounded-full bg-[var(--secondary)]/30 flex items-center justify-center text-[var(--accent)]">
                  <User size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-display text-lg font-medium text-[var(--primary)]">{user?.fullName || 'Guest'}</p>
                  <p className="text-sm text-[var(--primary)]/50">{user?.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {[
                  { id: 'overview', label: 'Overview', icon: User },
                  { id: 'orders', label: 'My Orders', icon: Package },
                  { id: 'wishlist', label: 'Wishlist', icon: Heart, count: wishlist?.length || 0 },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={`/account/${item.id}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                        : 'text-[var(--primary)]/70 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]'
                    }`}
                  >
                    <item.icon size={20} strokeWidth={1.5} />
                    <span className="font-medium">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="ml-auto h-5 min-w-5 rounded-full bg-[var(--accent)] text-white text-xs font-semibold flex items-center justify-center">
                        {item.count > 99 ? '99+' : item.count}
                      </span>
                    )}
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--error)] hover:bg-[var(--error)]/10 transition-all duration-200"
                >
                  <LogOut size={20} strokeWidth={1.5} />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </motion.div>
          </aside>

          <div className="lg:col-span-3 space-y-8">
            {activeTab === 'overview' && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
              >
                <h2 className="font-display text-2xl font-medium text-[var(--primary)] mb-6">Account Overview</h2>
                <div className="grid gap-6 md:grid-cols-3">
                  <Link
                    to="/account/orders"
                    className="p-6 rounded-2xl border border-[var(--border)]/40 hover:border-[var(--accent)]/40 hover:shadow-[0_10px_30px_rgba(42,36,31,0.08)] transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-12 w-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                        <Package size={24} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="font-display text-xl font-medium text-[var(--primary)]">Orders</p>
                        <p className="text-sm text-[var(--primary)]/50">View your order history</p>
                      </div>
                    </div>
                    <p className="text-3xl font-semibold text-[var(--primary)]">{orders.length}</p>
                  </Link>
                  <Link
                    to="/wishlist"
                    className="p-6 rounded-2xl border border-[var(--border)]/40 hover:border-[var(--accent)]/40 hover:shadow-[0_10px_30px_rgba(42,36,31,0.08)] transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-12 w-12 rounded-xl bg-[var(--error)]/10 flex items-center justify-center text-[var(--error)]">
                        <Heart size={24} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="font-display text-xl font-medium text-[var(--primary)]">Wishlist</p>
                        <p className="text-sm text-[var(--primary)]/50">Saved items</p>
                      </div>
                    </div>
                    <p className="text-3xl font-semibold text-[var(--primary)]">{wishlist?.length || 0}</p>
                  </Link>
                  <Link
                    to="/cart"
                    className="p-6 rounded-2xl border border-[var(--border)]/40 hover:border-[var(--accent)]/40 hover:shadow-[0_10px_30px_rgba(42,36,31,0.08)] transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-12 w-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                        <CreditCard size={24} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="font-display text-xl font-medium text-[var(--primary)]">Cart</p>
                        <p className="text-sm text-[var(--primary)]/50">{cart?.length || 0} items</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </motion.section>
            )}

            {activeTab === 'orders' && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
              >
                <h2 className="font-display text-2xl font-medium text-[var(--primary)] mb-6">My Orders</h2>
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)]" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="h-16 w-16 mx-auto text-[var(--primary)]/30 mb-4" />
                    <h3 className="font-display text-xl text-[var(--primary)] mb-2">No orders yet</h3>
                    <p className="text-[var(--primary)]/60 mb-6">When you place an order, it will appear here.</p>
                    <Link to="/shop" className="btn-luxury-primary inline-flex items-center gap-2">
                      <ShoppingBag size={14} strokeWidth={1.5} />
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Link
                        key={order._id}
                        to={`/account/orders/${order._id}`}
                        className="flex items-center gap-6 p-4 rounded-2xl border border-[var(--border)]/40 hover:border-[var(--accent)]/40 hover:shadow-[0_10px_30px_rgba(42,36,31,0.08)] transition-all duration-300"
                      >
                        <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-[var(--secondary)]/30 flex items-center justify-center overflow-hidden">
                          {order.items?.[0]?.image && (
                            <img src={order.items[0].image} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-[var(--primary)]">Order #{order.trackingNumber || order._id?.slice(-8).toUpperCase()}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p className="text-sm text-[var(--primary)]/50">{order.items?.length || 0} items · {formatPrice(order.total || 0)}</p>
                          <p className="text-xs text-[var(--primary)]/40">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-[var(--primary)]/40" strokeWidth={1.5} />
                      </Link>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {activeTab === 'wishlist' && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
              >
                <h2 className="font-display text-2xl font-medium text-[var(--primary)] mb-6">Wishlist</h2>
                {wishlist?.length === 0 ? (
                  <div className="text-center py-16">
                    <Heart className="h-16 w-16 mx-auto text-[var(--primary)]/30 mb-4" />
                    <h3 className="font-display text-xl text-[var(--primary)] mb-2">Your wishlist is empty</h3>
                    <p className="text-[var(--primary)]/60 mb-6">Save items you love for later.</p>
                    <Link to="/shop" className="btn-luxury-primary inline-flex items-center gap-2">
                      <ShoppingBag size={14} strokeWidth={1.5} />
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {wishlist.map((product, index) => (
                      <motion.div
                        key={product._id || product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="group relative bg-white rounded-3xl border border-[var(--border)]/40 overflow-hidden hover:shadow-[0_20px_40px_rgba(42,36,31,0.1)] transition-all duration-500"
                      >
                        <Link to={`/shop/${product._id || product.id}`} className="block">
                          <div className="aspect-[4/3] relative overflow-hidden bg-[var(--secondary)]/30">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[var(--primary)]/30">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                  <circle cx="9" cy="9" r="2" />
                                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="p-6">
                            <p className="text-2xs font-medium uppercase tracking-widest text-[var(--accent)] mb-2">{product.category}</p>
                            <h3 className="font-display text-lg font-medium text-[var(--primary)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{product.name}</h3>
                            <p className="mt-2 text-xl font-semibold text-[var(--primary)]">{formatPrice(product.discountPrice || product.price || 0)}</p>
                          </div>
                        </Link>
                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 rounded-full bg-white/90 backdrop-blur-sm text-[var(--primary)]/60 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:text-white hover:bg-[var(--accent)] transition-all shadow-md">
                            <ShoppingBag size={18} strokeWidth={1.5} />
                          </button>
                          <button className="p-2 rounded-full bg-white/90 backdrop-blur-sm text-[var(--primary)]/60 hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all shadow-md">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {activeTab === 'settings' && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
              >
                <h2 className="font-display text-2xl font-medium text-[var(--primary)] mb-6">Settings</h2>
                <div className="max-w-2xl space-y-8">
                  <div className="p-6 rounded-2xl border border-[var(--border)]/40 bg-[var(--bg)]/30">
                    <h3 className="font-display text-lg font-medium text-[var(--primary)] mb-4">Profile Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-[var(--primary)] mb-1">Full Name</label>
                        <input type="text" value={user?.fullName || ''} className="input-luxury" disabled />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--primary)] mb-1">Email</label>
                        <input type="email" value={user?.email || ''} className="input-luxury" disabled />
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-[var(--primary)]/50">Contact support to update your profile information.</p>
                  </div>
                  <div className="p-6 rounded-2xl border border-[var(--border)]/40 bg-[var(--bg)]/30">
                    <h3 className="font-display text-lg font-medium text-[var(--primary)] mb-4">Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-[var(--primary)]">Order Updates</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]" defaultChecked />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-[var(--primary)]">Promotional Emails</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]" />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-[var(--primary)]">New Arrivals</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]" defaultChecked />
                      </label>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default AccountPage