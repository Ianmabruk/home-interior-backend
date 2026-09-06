import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Package, ChevronRight, Copy, Search, Mail, Phone, AlertCircle } from 'lucide-react'
import { api } from '../../services/api'
import { PageMeta } from '../../hooks/usePageMeta'
import { useCurrency } from '../../context/CurrencyContext'

const MPESA_NUMBER = '0723 05 74 87'

export const OrderConfirmationPage = () => {
  const { id } = useParams()
  const { formatPrice } = useCurrency()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentConfirming, setPaymentConfirming] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [paymentError, setPaymentError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const loadOrder = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get(`/orders/${id}`, { signal: controller.signal })
        setOrder(res.data?.data || res.data)
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        const status = err?.response?.status
        if (status === 401 || status === 403) {
          setError('Please log in to view this order, or use the tracking page with your tracking number.')
        } else if (status === 404) {
          setError('Order not found')
        } else {
          setError(err?.message || 'Failed to load order')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    if (id) loadOrder()
    return () => controller.abort()
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] mx-auto mb-4" />
          <p className="text-[var(--primary)]/60">Loading order details...</p>
        </div>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Package size={48} className="mx-auto text-[var(--primary)]/30 mb-4" />
          <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-3">Order Not Found</h1>
          <p className="text-[var(--primary)]/60 mb-6">We couldn't find this order. It may have been removed or the link is invalid.</p>
          <Link to="/account/orders" className="btn-luxury-primary inline-flex items-center gap-2">
            View All Orders
            <ChevronRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </main>
    )
  }

  const items = Array.isArray(order.items) ? order.items : []
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || item.discountPrice || 0) * (item.quantity || 1), 0)
  const shipping = 0
  const tax = subtotal * 0.16
  const total = Number(order.total || subtotal + shipping + tax)

  const handleCopyTracking = async () => {
    if (order.trackingNumber) {
      await navigator.clipboard.writeText(order.trackingNumber)
    }
  }

  const handleConfirmPayment = async () => {
    setPaymentConfirming(true)
    setPaymentError(null)
    try {
      await api.patch(`/orders/${id}/payment`, {
        paymentStatus: 'submitted',
        paymentReference: `CONFIRMED-${Date.now()}`,
      })
      setPaymentConfirmed(true)
    } catch (err) {
      setPaymentError(err?.message || 'Failed to submit payment confirmation')
    } finally {
      setPaymentConfirming(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] py-12 md:py-16">
      <PageMeta
        title={`Order Confirmed ${order.trackingNumber ? `— ${order.trackingNumber}` : ''} — HOK Interior Designs`}
        description="Thank you for your order."
      />
      <div className="container-wide px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-10">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)] mb-4">
              <CheckCircle size={48} strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-medium text-[var(--primary)] mb-2">Order Confirmed!</h1>
            <p className="text-[var(--primary)]/60">Thank you for your purchase. Your order has been received.</p>
            {order.trackingNumber && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[var(--border)]/40">
                <span className="text-xs font-medium text-[var(--primary)]/60">Tracking Number:</span>
                <span className="text-sm font-semibold text-[var(--primary)]">{order.trackingNumber}</span>
                <button
                  onClick={handleCopyTracking}
                  className="p-1 rounded hover:bg-[var(--secondary)]/20 transition-colors"
                  aria-label="Copy tracking number"
                >
                  <Copy size={12} strokeWidth={1.5} />
                </button>
              </div>
            )}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-sm">
                <Mail size={14} strokeWidth={1.5} />
                <span>Please check your email for order confirmation and payment details.</span>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[var(--border)]/40">
                <Phone size={14} strokeWidth={1.5} className="text-[var(--primary)]/50" />
                <span className="text-xs font-medium text-[var(--primary)]/60">M-Pesa:</span>
                <span className="text-sm font-semibold text-[var(--primary)]">{MPESA_NUMBER}</span>
                <button
                  onClick={() => navigator.clipboard.writeText('0723057487')}
                  className="p-1 rounded hover:bg-[var(--secondary)]/20 transition-colors"
                  aria-label="Copy payment number"
                >
                  <Copy size={12} strokeWidth={1.5} />
                </button>
              </div>
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[var(--border)]/40">
              <span className="text-xs font-medium text-[var(--primary)]/60">Order ID:</span>
              <span className="text-sm font-semibold text-[var(--primary)]">
                #{String(order._id || order.id || '').slice(-8).toUpperCase()}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(String(order._id || order.id || ''))}
                className="p-1 rounded hover:bg-[var(--secondary)]/20 transition-colors"
                aria-label="Copy order ID"
              >
                <Copy size={12} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)] mb-6">
            <h2 className="font-display text-xl font-medium text-[var(--primary)] mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
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
                  <p className="text-sm font-medium text-[var(--primary)]">{formatPrice(Number(item.price || item.discountPrice || item.total || 0) * (item.quantity || 1))}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--border)]/40 pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--primary)]/55">Subtotal</span>
                <span className="font-medium text-[var(--primary)]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--primary)]/55">Shipping</span>
                <span className="font-medium text-[var(--primary)] text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--primary)]/55">Estimated Tax (16%)</span>
                <span className="font-medium text-[var(--primary)]">{formatPrice(tax)}</span>
              </div>
              <div className="border-t border-[var(--border)]/40 pt-4">
                <div className="flex justify-between text-lg font-semibold text-[var(--primary)]">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)] mb-6">
            <h2 className="font-display text-xl font-medium text-[var(--primary)] mb-4">Make Payment</h2>
            <p className="text-sm text-[var(--primary)]/70 mb-4">Complete your payment via M-Pesa to confirm your order.</p>
            <div className="bg-[var(--bg)]/60 rounded-2xl border border-[var(--border)]/40 p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">M-Pesa Send Money</p>
                  <p className="text-xl font-semibold text-[var(--primary)]">{MPESA_NUMBER}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText('0723057487')}
                  className="p-2 rounded-lg text-[var(--primary)]/50 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
                  aria-label="Copy payment number"
                >
                  <Copy size={18} strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-white rounded-xl border border-[var(--border)]/40 px-4 py-3">
                <span className="text-sm text-[var(--primary)]/60">Amount to Pay</span>
                <span className="text-lg font-semibold text-[var(--primary)]">{formatPrice(total)}</span>
              </div>
            </div>

            {paymentConfirmed ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--success)]/10 text-[var(--success)]">
                <CheckCircle size={20} strokeWidth={2} />
                <span className="text-sm">Payment confirmation submitted. We will verify your payment shortly.</span>
              </div>
            ) : (
              <div>
                {paymentError && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--error)]/10 text-[var(--error)] mb-4">
                    <AlertCircle size={20} strokeWidth={2} />
                    <span className="text-sm">{paymentError}</span>
                  </div>
                )}
                <button
                  onClick={handleConfirmPayment}
                  disabled={paymentConfirming}
                  className="w-full btn-luxury-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentConfirming ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} strokeWidth={1.5} />
                      I Have Made Payment — Confirm Payment
                    </>
                  )}
                </button>
                <p className="mt-2 text-xs text-[var(--primary)]/50 text-center">
                  Click this button after sending money via M-Pesa
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)] mb-6">
            <h2 className="font-display text-xl font-medium text-[var(--primary)] mb-4">Shipping Information</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Name</p>
                <p className="text-sm text-[var(--primary)] mt-1">{order.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Email</p>
                <p className="text-sm text-[var(--primary)] mt-1">{order.email || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Phone</p>
                <p className="text-sm text-[var(--primary)] mt-1">{order.phone || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Address</p>
                <p className="text-sm text-[var(--primary)] mt-1">
                  {typeof order.shippingAddress === 'string' ? order.shippingAddress : (order.shippingAddress?.address || order.shippingAddress?.fullAddress || JSON.stringify(order.shippingAddress || {}))}
                </p>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Payment</p>
                <p className="text-sm text-[var(--primary)] mt-1 capitalize">{order.paymentMethod || 'N/A'}</p>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Status</p>
                <p className="text-sm text-[var(--primary)] mt-1 capitalize">{order.status || 'Pending'}</p>
              </div>
            </div>
          </div>

          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)] mb-6">
              <h2 className="font-display text-xl font-medium text-[var(--primary)] mb-4">Status History</h2>
              <div className="space-y-3">
                {order.statusHistory.map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between gap-4 pb-3 border-b border-[var(--border)]/40 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-[var(--primary)] capitalize">{entry.status}</p>
                      {entry.customerNote && <p className="text-xs text-[var(--primary)]/60 mt-0.5">{entry.customerNote}</p>}
                    </div>
                    <p className="text-2xs text-[var(--primary)]/40 whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {order.trackingNumber && (
              <Link
                to={`/track-order?tracking=${order.trackingNumber}`}
                className="btn-luxury-primary inline-flex items-center gap-2"
              >
                <Search size={14} strokeWidth={1.5} />
                Track Your Order
              </Link>
            )}
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] bg-white text-xs font-semibold uppercase tracking-widest text-[var(--primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
            >
              <Package size={14} strokeWidth={1.5} />
              View All Orders
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] bg-white text-xs font-semibold uppercase tracking-widest text-[var(--primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
            >
              Continue Shopping
              <ChevronRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

export default OrderConfirmationPage
