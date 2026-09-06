import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { Package, Eye, X, Search, ChevronDown, Save, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'
import { useCurrency } from '../../context/CurrencyContext'

const ALLOWED_STATUSES = [
  'order placed',
  'pending',
  'payment confirmed',
  'processing',
  'completed',
  'ready for delivery',
  'out for delivery',
  'delivered',
  'cancelled',
]

const PAYMENT_STATUSES = ['pending', 'submitted', 'confirmed', 'rejected']

const STATUS_CONFIG = {
  'order placed': { label: 'Order Placed', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'payment confirmed': { label: 'Payment Confirmed', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200' },
  'ready for delivery': { label: 'Ready for Delivery', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  'out for delivery': { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Canceled', color: 'bg-red-100 text-red-700 border-red-200' },
}

const PAYMENT_CONFIG = {
  pending: { label: 'Payment Pending', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  submitted: { label: 'Payment Submitted', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Payment Confirmed', color: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Payment Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
}

const STATUS_COLORS = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.color])
)

const PAYMENT_COLORS = Object.fromEntries(
  Object.entries(PAYMENT_CONFIG).map(([k, v]) => [k, v.color])
)

function formatLabel(status) {
  return STATUS_CONFIG[String(status || '').toLowerCase()]?.label || status || 'Pending'
}

function formatShortDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatFullDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function parseItems(items) {
  if (!items) return []
  if (Array.isArray(items)) return items
  try {
    return JSON.parse(items)
  } catch {
    return []
  }
}

export const OrderDashboard = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewOrder, setViewOrder] = useState(null)
  const [trackingInput, setTrackingInput] = useState('')
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const PAGE_SIZE = 20
  const location = useLocation()
  const navigate = useNavigate()
  const { formatPrice } = useCurrency()

  const urlOrderId = useMemo(() => {
    try {
      return new URLSearchParams(location.search).get('orderId') || null
    } catch {
      return null
    }
  }, [location.search])

  useEffect(() => {
    if (!urlOrderId || orders.length === 0 || viewOrder) return
    const match = orders.find((o) => o._id === urlOrderId || o.id === urlOrderId)
    if (match) {
      setViewOrder(match)
      const searchParams = new URLSearchParams(location.search)
      searchParams.delete('orderId')
      navigate({ search: searchParams.toString() ? `?${searchParams.toString()}` : '' }, { replace: true })
    }
  }, [urlOrderId, orders, viewOrder, location.search, navigate])

  const fetchOrders = useCallback(async (page = 0) => {
    setLoading(true)
    try {
      const res = await api.get('/orders', {
        params: { sort: '-createdAt', limit: PAGE_SIZE, skip: page * PAGE_SIZE, pagination: 'true' },
        timeout: 120000,
      })
      setOrders(res.data?.data || res.data || [])
      setPagination(res.data?.pagination || null)
    } catch {
      // keep existing orders visible on failure
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders(currentPage)
  }, [currentPage, fetchOrders])

  useEffect(() => {
    const handler = () => {
      fetchOrders(currentPage)
    }
    window.addEventListener('admin-data-changed', handler)
    return () => window.removeEventListener('admin-data-changed', handler)
  }, [currentPage, fetchOrders])

  const updateStatus = async (orderId, newStatus, extra = {}) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus, ...extra })
      setOrders((prev) => prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, status: newStatus, ...extra } : o)))
      if (viewOrder && (viewOrder._id === orderId || viewOrder.id === orderId)) {
        setViewOrder((prev) => ({ ...prev, status: newStatus, ...extra }))
      }
      dispatchAdminDataChanged('orders-changed')
      toast.success('Order status updated.')
    } catch (err) {
      toast.error(err?.message || 'Failed to update status.')
    }
  }

  const updatePaymentStatus = async (orderId, newPaymentStatus, paymentReference = '') => {
    try {
      await api.patch(`/orders/${orderId}/payment`, { paymentStatus: newPaymentStatus, paymentReference })
      setOrders((prev) => prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, paymentStatus: newPaymentStatus, paymentReference } : o)))
      if (viewOrder && (viewOrder._id === orderId || viewOrder.id === orderId)) {
        setViewOrder((prev) => ({ ...prev, paymentStatus: newPaymentStatus, paymentReference }))
      }
      dispatchAdminDataChanged('orders-changed')
      toast.success('Payment status updated.')
    } catch (err) {
      toast.error(err?.message || 'Failed to update payment status.')
    }
  }

  const updateTrackingNumber = async (orderId, trackingNumber) => {
    try {
      await api.patch(`/orders/${orderId}/tracking`, { trackingNumber })
      setOrders((prev) => prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, trackingNumber } : o)))
      if (viewOrder && (viewOrder._id === orderId || viewOrder.id === orderId)) {
        setViewOrder((prev) => ({ ...prev, trackingNumber }))
      }
      dispatchAdminDataChanged('orders-changed')
      toast.success('Tracking number updated.')
    } catch (err) {
      toast.error(err?.message || 'Failed to update tracking number.')
    }
  }

  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        o.name?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o._id?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q) ||
        o.trackingNumber?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const openTracking = (trackingNumber) => {
    if (!trackingNumber) return
    window.open(`/track-order?tracking=${encodeURIComponent(trackingNumber)}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Orders</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">{filtered.length} orders</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition pl-9"
              placeholder="Search orders, tracking..."
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition cursor-pointer appearance-none pr-8"
            >
              <option value="">All Statuses</option>
              {ALLOWED_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatLabel(s)}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--primary)]/40 pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/60 border border-[var(--border)]/60 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 text-[var(--primary)]/40">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">No orders found</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((order, i) => {
            const statusKey = String(order.status || 'pending').toLowerCase()
            const statusColor = STATUS_COLORS[statusKey] || 'bg-gray-100 text-gray-700 border-gray-200'
            const items = parseItems(order.items)
            const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)

            return (
              <motion.div
                key={order._id || order.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-4 shadow-[0_10px_40px_rgba(42,36,31,0.06)] flex flex-col h-full"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/40 truncate">
                      #{order.trackingNumber || String(order._id || order.id || '').slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm font-medium text-[var(--primary)] truncate mt-0.5">
                      {order.name || 'Guest'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold border flex-shrink-0 ${statusColor}`}>
                      {formatLabel(order.status)}
                    </span>
                    {order.paymentStatus && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold border flex-shrink-0 ${PAYMENT_COLORS[String(order.paymentStatus).toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {PAYMENT_CONFIG[String(order.paymentStatus).toLowerCase()]?.label || order.paymentStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 mb-4 flex-1">
                  {order.trackingNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-2xs text-[var(--primary)]/40">Tracking</span>
                      <button
                        onClick={() => openTracking(order.trackingNumber)}
                        className="text-2xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                        title="Open tracking page"
                      >
                        {order.trackingNumber}
                        <ExternalLink size={10} strokeWidth={2} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-[var(--primary)]/40">Items</span>
                    <span className="text-2xs text-[var(--primary)]/70">{itemCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-[var(--primary)]/40">Date</span>
                    <span className="text-2xs text-[var(--primary)]/70">{formatShortDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-[var(--primary)]/40">Total</span>
                    <span className="text-sm font-semibold text-[var(--primary)]">{formatPrice(Number(order.total || 0))}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setViewOrder(order)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <Eye size={12} />
                  View
                </motion.button>
              </motion.div>
            )
          })}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-2xs text-[var(--primary)]/50">
            {pagination.total} orders • Page {currentPage + 1} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0 || loading}
              className="px-3 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)] disabled:opacity-50 text-2xs"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.pages - 1, p + 1))}
              disabled={currentPage >= pagination.pages - 1 || loading}
              className="px-3 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)] disabled:opacity-50 text-2xs"
            >
              Next
            </button>
          </div>
        </div>
      )}

    {viewOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setViewOrder(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-white/90 backdrop-blur-xl px-6 py-4">
              <h3 className="font-display text-xl font-medium text-[var(--primary)]">Order Details</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewOrder(null)}
                className="p-1.5 rounded-lg text-[var(--primary)]/40 hover:text-[var(--accent)] transition"
              >
                <X size={18} strokeWidth={1.5} />
              </motion.button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Customer</p>
                  <p className="mt-1 text-sm font-medium text-[var(--primary)]">{viewOrder.name || 'Guest'}</p>
                  <p className="text-sm text-[var(--primary)]/60">{viewOrder.email}</p>
                  {viewOrder.phone && <p className="text-sm text-[var(--primary)]/60">{viewOrder.phone}</p>}
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Order Number</p>
                  <p className="mt-1 text-sm font-mono text-[var(--primary)]">{viewOrder.trackingNumber || viewOrder._id || viewOrder.id}</p>
                  <p className="text-sm text-[var(--primary)]/60">{formatFullDate(viewOrder.createdAt)}</p>
                </div>
              </div>

              {viewOrder.trackingNumber && (
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-2">Tracking Number</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                       <span className="text-sm font-semibold text-[var(--accent)]">{viewOrder.trackingNumber}</span>
                     </div>
                   </div>
                 )}

                 <div className="border-t border-[var(--border)]/40 pt-4">
                   <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-2">Update Tracking Number</p>
                   <div className="flex gap-2">
                     <input
                       type="text"
                       value={trackingInput}
                       onChange={(e) => setTrackingInput(e.target.value)}
                       placeholder="Enter tracking number"
                       className="flex-1 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                     />
                     <motion.button
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => {
                         if (trackingInput.trim()) {
                           updateTrackingNumber(viewOrder._id || viewOrder.id, trackingInput.trim())
                           setTrackingInput('')
                         }
                       }}
                       disabled={!trackingInput.trim()}
                       className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-[var(--accent)]/90 disabled:opacity-50"
                     >
                       <Save size={14} strokeWidth={1.5} />
                       Save
                     </motion.button>
                   </div>
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-2">Customer Note</p>
                    <textarea
                      value={viewOrder.customerNote || ''}
                      onChange={(e) => setViewOrder((prev) => ({ ...prev, customerNote: e.target.value }))}
                      placeholder="Add a customer-safe update..."
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-2">Estimated Delivery</p>
                    <input
                      type="text"
                      value={viewOrder.estimatedDelivery || ''}
                      onChange={(e) => setViewOrder((prev) => ({ ...prev, estimatedDelivery: e.target.value }))}
                      placeholder="e.g. 16 August 2026 or Tomorrow 2-5 PM"
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-2">Update Status</p>
                    <select
                      value={viewOrder.status || 'pending'}
                      onChange={(e) => setViewOrder((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full sm:w-auto rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition cursor-pointer"
                    >
                      {ALLOWED_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {formatLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateStatus(viewOrder._id || viewOrder.id, viewOrder.status, {
                      customerNote: viewOrder.customerNote,
                      estimatedDelivery: viewOrder.estimatedDelivery,
                    })}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-[var(--accent)]/90"
                  >
                    <Save size={14} strokeWidth={1.5} />
                    Save Status
                  </motion.button>
                </div>

                <div className="border-t border-[var(--border)]/40 pt-4">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-2">Payment Verification</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-1">Payment Status</label>
                      <select
                        value={String(viewOrder.paymentStatus || 'pending').toLowerCase()}
                        onChange={(e) => setViewOrder((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition cursor-pointer"
                      >
                        {PAYMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {PAYMENT_CONFIG[s]?.label || s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-1">Payment Reference / M-Pesa Code</label>
                      <input
                        type="text"
                        value={viewOrder.paymentReference || ''}
                        onChange={(e) => setViewOrder((prev) => ({ ...prev, paymentReference: e.target.value }))}
                        placeholder="e.g. M-Pesa confirmation code"
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updatePaymentStatus(viewOrder._id || viewOrder.id, viewOrder.paymentStatus || 'pending', viewOrder.paymentReference || '')}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-[var(--primary)]/90"
                  >
                    <Save size={14} strokeWidth={1.5} />
                    Save Payment
                  </motion.button>
                </div>

              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-3">Items</p>
                <div className="space-y-2">
                  {parseItems(viewOrder.items).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--primary)] truncate">{item.name || item.productName || 'Product'}</p>
                        <p className="text-2xs text-[var(--primary)]/50">Qty: {item.quantity || 1}</p>
                        {item.selectedVariant && (
                          <p className="text-2xs text-[var(--primary)]/50">
                            {item.selectedVariant.color || item.selectedVariant.colorName || ''}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-[var(--primary)]">
                        {formatPrice(Number(item.price || item.discountPrice || item.total || 0))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-3">Shipping Address</p>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
                  {(() => {
                    let address = {}
                    try { address = typeof viewOrder.shippingAddress === 'string' ? JSON.parse(viewOrder.shippingAddress) : viewOrder.shippingAddress } catch { /* ignore */ }
                    return (
                      <div className="text-sm text-[var(--primary)]/70 space-y-1">
                        {address.fullName && <p>{address.fullName}</p>}
                        {address.address && <p>{address.address}</p>}
                        {address.city && <p>{address.city}, {address.state} {address.zipCode}</p>}
                        {address.country && <p>{address.country}</p>}
                        {!address.fullName && viewOrder.shippingAddress && (
                          <p>
                            {typeof viewOrder.shippingAddress === 'string'
                              ? viewOrder.shippingAddress
                              : JSON.stringify(viewOrder.shippingAddress)}
                          </p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>

              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-3">Payment</p>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
                  <p className="text-sm font-medium text-[var(--primary)] capitalize">{viewOrder.paymentMethod}</p>
                  {viewOrder.shippingMethod && (
                    <p className="text-2xs text-[var(--primary)]/50 mt-1 capitalize">Shipping: {viewOrder.shippingMethod}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
                <span className="text-sm font-medium text-[var(--primary)]">Total</span>
                <span className="font-display text-2xl font-medium text-[var(--primary)]">{formatPrice(Number(viewOrder.total || 0))}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
    </div>
  )
}

export default OrderDashboard
