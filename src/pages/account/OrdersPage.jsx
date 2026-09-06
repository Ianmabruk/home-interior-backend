import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, Eye, Loader2, AlertTriangle, ClipboardList, Home, ShoppingBag } from 'lucide-react'
import { api, clearApiCache } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { useAuth } from '@context/AuthContext'
import { useCurrency } from '@context/CurrencyContext'

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

const STATUS_LABELS = {
  'payment confirmed': 'Payment Confirmed',
  'ready for delivery': 'Ready for Delivery',
  'out for delivery': 'Out for Delivery',
}

export const OrdersPage = () => {
  const { user, loading: authLoading } = useAuth()
  const { formatPrice } = useCurrency()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const controllerRef = useRef(null)

  const loadOrders = useCallback(async () => {
    if (!user?.id && !user?.email) {
      setLoading(false)
      setOrders([])
      return
    }
    if (controllerRef.current) {
      controllerRef.current.abort()
    }
    const controller = new AbortController()
    controllerRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/orders/me', { signal: controller.signal })
      if (controller.signal.aborted) return
      const data = res.data?.data || res.data || []
      const sorted = Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : []
      setOrders(sorted)
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err?.message || 'Failed to load orders')
      setOrders([])
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadOrders()
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [loadOrders])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'orders-changed') {
        clearApiCache('/orders/me')
        loadOrders()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadOrders])

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)]" />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-3">Sign in to view orders</h1>
          <p className="text-[var(--primary)]/60 mb-6">Please log in to see your order history.</p>
          <Link to="/login" className="btn-luxury-primary inline-flex items-center gap-2">
            Log In
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] py-12 md:py-16">
      <PageMeta title="My Orders — HOK Interior Designs" description="Track and manage your orders." />
      <div className="container-wide px-6 md:px-12 lg:px-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-[var(--primary)]">My Orders</h1>
          <p className="mt-2 text-[var(--primary)]/60">Track, return, or buy things again.</p>
        </motion.div>

        <div className="flex flex-wrap gap-3 mb-8">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
            <Home size={14} strokeWidth={1.5} />
            Back to Home
          </Link>
          <Link to="/shop" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
            <ShoppingBag size={14} strokeWidth={1.5} />
            Shop
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/60 border border-[var(--border)]/60 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--error)]/10 text-[var(--error)]">
            <AlertTriangle size={20} strokeWidth={2} />
            <span className="text-sm">{error}</span>
            <button onClick={loadOrders} className="ml-auto text-xs font-semibold uppercase tracking-widest">Retry</button>
          </div>
        ) : orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <ClipboardList size={48} className="mx-auto text-[var(--primary)]/30 mb-4" />
            <h3 className="font-display text-xl text-[var(--primary)] mb-2">No orders yet</h3>
            <p className="text-[var(--primary)]/60 mb-6">When you place an order, it will show up here.</p>
            <Link to="/shop" className="btn-luxury-primary inline-flex items-center gap-2">
              <Package size={14} strokeWidth={1.5} />
              Continue Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const items = Array.isArray(order.items) ? order.items : []
              const statusKey = (order.status || 'pending').toLowerCase()
              const statusColor = STATUS_COLORS[statusKey] || 'bg-gray-100 text-gray-700 border-gray-200'

              return (
                  <motion.div
                    key={order._id || order.id || index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] border border-[var(--border)]/40"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display text-lg font-medium text-[var(--primary)] truncate">
                          Order #{String(order._id || order.id || '').slice(-8).toUpperCase()}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-medium border ${statusColor}`}>
                          {STATUS_LABELS[statusKey] || order.status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--primary)]/60">{items.length} item{items.length !== 1 ? 's' : ''} · {formatPrice(Number(order.total || 0))}</p>
                      <p className="text-2xs text-[var(--primary)]/40 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Link
                      to={`/account/orders/${order._id || order.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      <Eye size={12} />
                      View
                    </Link>
                  </div>

                  {items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]/40 space-y-3">
                      {items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--secondary)]/30">
                            {item.image && (
                              <img src={item.image} alt={item.name || 'Product'} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--primary)] truncate">{item.name || item.productName || 'Product'}</p>
                            <p className="text-2xs text-[var(--primary)]/50">Qty: {item.quantity || 1}</p>
                            {item.selectedVariant && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="h-2.5 w-2.5 rounded-full border border-[var(--primary)]/10" style={{ backgroundColor: item.selectedVariant.colorHex || '#ccc' }} />
                                <span className="text-2xs text-[var(--primary)]/60">{item.selectedVariant.color || item.selectedVariant.colorName || ''}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium text-[var(--primary)]">{formatPrice(Number(item.price || item.discountPrice || item.total || 0))}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

export default OrdersPage
