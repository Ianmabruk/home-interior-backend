import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Package, CheckCircle2 } from 'lucide-react'
import { api } from '@services/api'
import { PageMeta } from '@hooks/usePageMeta'
import { Link } from 'react-router-dom'
import { useCurrency } from '@context/CurrencyContext'

const STATUS_FLOW = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'payment confirmed', label: 'Payment Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'ready for delivery', label: 'Ready for Delivery' },
  { key: 'out for delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
]

function getStatusIndex(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'delivered') return 5
  if (s === 'cancelled' || s === 'canceled') return -1
  if (s === 'refunded') return -1
  if (s === 'out for delivery') return 4
  if (s === 'ready for delivery' || s === 'completed') return 3
  if (s === 'processing') return 2
  if (s === 'payment confirmed') return 1
  if (s === 'pending' || s === 'order placed' || s === 'payment pending') return 0
  return 0
}

function formatStatusDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export const TrackOrderPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [contact, setContact] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { formatPrice } = useCurrency()

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await api.post('/orders/track', { trackingNumber: trackingNumber.trim().toUpperCase(), contact: contact.trim() })
      setResult(res.data?.data || res.data)
    } catch (err) {
      const status = err?.response?.status
      if (status === 404) {
        setError('We couldn\'t find an order with that tracking number and contact details. Please double-check and try again.')
      } else if (status === 429) {
        setError('Too many attempts. Please wait a moment and try again.')
      } else {
        setError('Something went wrong while looking up your order. Please try again in a moment.')
      }
    } finally {
      setLoading(false)
    }
  }, [trackingNumber, contact, loading])

  if (result) {
    const items = Array.isArray(result.items) ? result.items : []
    const statusHistory = Array.isArray(result.statusHistory) ? result.statusHistory : []

    return (
      <main className="min-h-screen bg-[var(--bg)] py-12 md:py-16">
        <PageMeta title={`Track Order ${result.trackingNumber} — HOK Interiors`} description="Track your order status." />
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] mb-4">
                <Package size={32} strokeWidth={1.5} />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-medium text-[var(--primary)] mb-2">Order {result.trackingNumber}</h1>
              <p className="text-[var(--primary)]/60">Current Status: <span className="font-semibold capitalize">{result.status || 'Pending'}</span></p>
            </div>

            <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)] mb-6">
              <h2 className="font-display text-xl font-medium text-[var(--primary)] mb-6">Order Timeline</h2>
              {statusHistory.length > 0 ? (
                <div className="relative">
                  {statusHistory.map((entry, idx) => {
                    const entryIndex = getStatusIndex(entry.status)
                    const isCompleted = entryIndex >= 0 && entryIndex <= getStatusIndex(result.status)
                    return (
                      <div key={entry.id || idx} className="flex gap-4 mb-6 last:mb-0">
                        <div className="flex flex-col items-center">
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isCompleted ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)] bg-white'}`}>
                            {isCompleted && <CheckCircle2 size={12} className="text-white" strokeWidth={2.5} />}
                          </div>
                          {idx < statusHistory.length - 1 && (
                            <div className={`w-0.5 h-10 ${isCompleted ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isCompleted ? 'text-[var(--primary)]' : 'text-[var(--primary)]/40'}`}>{entry.status || 'Unknown'}</p>
                          {entry.customerNote && <p className="text-xs text-[var(--primary)]/60 mt-0.5">{entry.customerNote}</p>}
                          {entry.estimatedDelivery && <p className="text-xs text-[var(--accent)] mt-0.5">Est. Delivery: {entry.estimatedDelivery}</p>}
                          <p className="text-2xs text-[var(--primary)]/40 mt-0.5">{formatStatusDate(entry.createdAt)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="relative">
                  {STATUS_FLOW.map((step, idx) => {
                    const isCompleted = idx <= getStatusIndex(result.status) && getStatusIndex(result.status) >= 0
                    return (
                      <div key={step.key + idx} className="flex gap-4 mb-6 last:mb-0">
                        <div className="flex flex-col items-center">
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isCompleted ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)] bg-white'}`}>
                            {isCompleted && <CheckCircle2 size={12} className="text-white" strokeWidth={2.5} />}
                          </div>
                          {idx < STATUS_FLOW.length - 1 && (
                            <div className={`w-0.5 h-10 ${isCompleted ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isCompleted ? 'text-[var(--primary)]' : 'text-[var(--primary)]/40'}`}>{step.label}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)] mb-6">
              <h2 className="font-display text-xl font-medium text-[var(--primary)] mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--secondary)]/30">
                      {item.image && <img src={item.image} alt={item.name || 'Product'} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--primary)] truncate">{item.name || 'Product'}</p>
                      <p className="text-2xs text-[var(--primary)]/50">Qty: {item.quantity || 1}</p>
                    </div>
                    <p className="text-sm font-medium text-[var(--primary)]">{formatPrice(Number(item.price || 0) * (item.quantity || 1))}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--border)]/40 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--primary)]/55">Total</span>
                  <span className="font-medium text-[var(--primary)]">{formatPrice(Number(result.total || 0))}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)] mb-6">
              <h2 className="font-display text-xl font-medium text-[var(--primary)] mb-4">Shipping Information</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Name</p>
                  <p className="text-sm text-[var(--primary)] mt-1">{result.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Email</p>
                  <p className="text-sm text-[var(--primary)] mt-1">{result.email || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Phone</p>
                  <p className="text-sm text-[var(--primary)] mt-1">{result.phone || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Address</p>
                  <p className="text-sm text-[var(--primary)] mt-1">
                    {typeof result.shippingAddress === 'string' ? result.shippingAddress : (result.shippingAddress?.address || result.shippingAddress?.fullAddress || JSON.stringify(result.shippingAddress || {}))}
                  </p>
                </div>
                </div>
              </div>

              {(result.customerNote || result.estimatedDelivery) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.estimatedDelivery && (
                    <div>
                      <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Estimated Delivery</p>
                      <p className="text-sm text-[var(--primary)] mt-1">{result.estimatedDelivery}</p>
                    </div>
                  )}
                  {result.customerNote && (
                    <div className={result.estimatedDelivery ? '' : 'md:col-span-2'}>
                      <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Latest Update</p>
                      <p className="text-sm text-[var(--primary)] mt-1">{result.customerNote}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => { setResult(null); setTrackingNumber(''); setContact('') }} className="btn-luxury-primary inline-flex items-center gap-2">
                <Search size={14} strokeWidth={1.5} />
                Track Another Order
              </button>
              <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] bg-white text-xs font-semibold uppercase tracking-widest text-[var(--primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] py-12 md:py-16">
      <PageMeta title="Track Order — HOK Interiors" description="Track your order by entering your tracking number and contact details." />
      <div className="container-wide px-6 md:px-12 lg:px-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] mb-4">
              <Package size={32} strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-medium text-[var(--primary)] mb-2">Track Your Order</h1>
            <p className="text-[var(--primary)]/60">Enter your tracking number and email or phone number to view your order status.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
            <div className="space-y-4">
              <div>
                <label htmlFor="tracking" className="block text-sm font-medium text-[var(--primary)] mb-1.5">Tracking Number</label>
                <input
                  id="tracking"
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="HOK-2026-8F42K9"
                  className="w-full rounded-xl border border-[var(--border)]/60 bg-white px-4 py-3 text-sm text-[var(--primary)] placeholder:text-[var(--primary)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition"
                />
              </div>
              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-[var(--primary)] mb-1.5">Email or Phone Number</label>
                <input
                  id="contact"
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="you@example.com or +254 7XX XXX XXX"
                  className="w-full rounded-xl border border-[var(--border)]/60 bg-white px-4 py-3 text-sm text-[var(--primary)] placeholder:text-[var(--primary)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-medium uppercase tracking-widest text-white transition hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Search size={16} strokeWidth={1.5} />
                  Track Order
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </main>
  )
}

export default TrackOrderPage
