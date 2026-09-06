import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, CheckCircle, ChevronRight, MapPin, ShoppingBag, Truck, Search, Mail, Copy } from 'lucide-react'
import { api } from '../../services/api'
import { useShop } from '../../context/ShopContext'
import { useCurrency } from '../../context/CurrencyContext'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'
import { PageMeta } from '../../hooks/usePageMeta'

const PAYMENT_NUMBER = '0723 05 74 87'

function validateKenyanPhone(phone) {
  const cleaned = String(phone || '').replace(/\s+/g, '')
  if (!cleaned) return false
  return /^\+?254(7|1)\d{8}$/.test(cleaned) || /^0(7|1)\d{8}$/.test(cleaned)
}

export const CheckoutPage = () => {
  const { cart, clearCart } = useShop()
  const { formatPrice } = useCurrency()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [trackingNumber, setTrackingNumber] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Kenya',
  })
  const [phoneError, setPhoneError] = useState('')

  useEffect(() => {
    if (cart?.length === 0) {
      navigate('/cart')
    }
  }, [cart, navigate])

  if (!cart?.length) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--primary)]/30">
            <Truck size={48} strokeWidth={1} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-3">Cart is Empty</h1>
          <p className="text-[var(--primary)]/60 mb-6">Add items to your cart before proceeding to checkout.</p>
          <Link to="/shop" className="btn-luxury-primary inline-flex items-center gap-2">
            <ShoppingBag size={14} strokeWidth={1.5} />
            Continue Shopping
          </Link>
        </div>
      </main>
    )
  }

  const subtotal = Array.isArray(cart) ? cart.reduce((sum, item) => sum + Number(item.selectedVariant?.price || item.discountPrice || item.price || 0) * item.quantity, 0) : 0
  const shipping = 0
  const tax = subtotal * 0.16
  const total = subtotal + shipping + tax

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setPhoneError('')

    if (!validateKenyanPhone(formData.phone)) {
      setPhoneError('Please enter a valid Kenyan mobile number (e.g. +254 7XX XXX XXX or 07XX XXX XXX)')
      setLoading(false)
      return
    }

    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item._id,
          variantId: item.selectedVariant?._id,
          quantity: item.quantity,
          price: item.selectedVariant?.price || item.discountPrice || item.price,
        })),
        name: formData.fullName.trim(),
        email: formData.email,
        phone: formData.phone,
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          country: formData.country,
        },
        shippingMethod: 'standard',
        paymentMethod: 'mpesa',
        paymentDetails: {
          mpesaNumber: '0723 05 74 87',
          reference: `ORDER-${Date.now()}`,
        },
        total,
      }
      const res = await api.post('/orders', orderData)
      await clearCart()
      const newOrderId = res.data?.data?._id || res.data?.data?.id || res.data?._id || res.data?.id
      const newTrackingNumber = res.data?.data?.trackingNumber || res.data?.trackingNumber || null
      setOrderId(newOrderId)
      setTrackingNumber(newTrackingNumber)
      setSuccess(true)
      dispatchAdminDataChanged('orders-changed')
      try { localStorage.setItem('hok_order_placed', '1') } catch {
        // ignore localStorage errors
      }
      if (newTrackingNumber) {
        setTimeout(() => navigate(`/track-order?tracking=${newTrackingNumber}`), 2000)
      } else if (newOrderId) {
        setTimeout(() => navigate(`/order-confirmation/${newOrderId}`), 2000)
      } else {
        setTimeout(() => navigate('/shop'), 2000)
      }
    } catch (err) {
      setError(err?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] py-12 md:py-16">
      <PageMeta
        title="Checkout — HOK Interior Designs"
        description="Complete your order."
      />
      <div className="container-wide px-6 md:px-12 lg:px-20">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-3 p-4 rounded-xl bg-[var(--error)]/10 text-[var(--error)]"
          >
            <AlertCircle size={20} strokeWidth={2} />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-[var(--success)]/20 p-12 md:p-16 shadow-[0_10px_40px_rgba(42,36,31,0.06)] text-center"
          >
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
              <CheckCircle size={48} strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-medium text-[var(--primary)] mb-4">Order Received</h1>
            <p className="text-[var(--primary)]/60 mb-2 max-w-md mx-auto">Thank you for your order! Please complete payment to confirm your order.</p>
            {trackingNumber && (
              <p className="text-sm text-[var(--primary)]/50 mb-6">
                Order Number: <span className="font-semibold text-[var(--primary)]">{trackingNumber}</span>
              </p>
            )}

            <div className="max-w-md mx-auto bg-[var(--bg)]/60 rounded-2xl border border-[var(--border)]/40 p-6 mb-8 text-left">
              <h3 className="font-display text-xl font-medium text-[var(--primary)] mb-4 text-center">Make Payment via M-Pesa</h3>
              <p className="text-sm text-[var(--primary)]/70 mb-4 text-center">Send money to the number below to confirm your order.</p>
              <div className="flex items-center justify-between bg-white rounded-xl border border-[var(--border)]/40 px-4 py-3 mb-4">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">M-Pesa Send Money</p>
                  <p className="text-lg font-semibold text-[var(--primary)]">{PAYMENT_NUMBER}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText('0723057487')}
                  className="p-2 rounded-lg text-[var(--primary)]/50 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
                  aria-label="Copy payment number"
                >
                  <Copy size={16} strokeWidth={1.5} />
                </button>
              </div>
              <div className="bg-[var(--accent)]/10 rounded-xl p-4">
                <p className="text-sm text-[var(--primary)]/80 text-center">
                  <strong>Amount:</strong> {formatPrice(total)}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/shop" className="btn-luxury-primary inline-flex items-center gap-2">
                Continue Shopping
                <ChevronRight size={14} strokeWidth={1.5} />
              </Link>
              {trackingNumber ? (
                <Link to={`/track-order?tracking=${trackingNumber}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] bg-white text-xs font-semibold uppercase tracking-widest text-[var(--primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">
                  <Search size={14} strokeWidth={1.5} />
                  Track Your Order
                </Link>
              ) : (
                <Link to={`/order-confirmation/${orderId}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] bg-white text-xs font-semibold uppercase tracking-widest text-[var(--primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">
                  View Order
                  <ChevronRight size={14} strokeWidth={1.5} />
                </Link>
              )}
            </div>

            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-sm">
              <Mail size={14} strokeWidth={1.5} />
              <span>Please check your email for order confirmation and payment details.</span>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <motion.form
                id="checkout-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                <section className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
                  <h2 className="font-display text-xl font-medium text-[var(--primary)] mb-6 flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-[var(--accent)]" />
                    Contact & Delivery
                  </h2>
                  <div className="grid gap-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-[var(--primary)] mb-1">Full Name</label>
                      <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required className="input-luxury" placeholder="Your full name" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-[var(--primary)] mb-1">Email</label>
                      <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="input-luxury" placeholder="you@example.com" />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-[var(--primary)] mb-1">Phone</label>
                      <input type="tel" id="phone" name="phone" value={formData.phone} onChange={(e) => { handleChange(e); setPhoneError('') }} required className={`input-luxury ${phoneError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/40' : ''}`} placeholder="+254 723 057 487" />
                      {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
                    </div>
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-[var(--primary)] mb-1">Delivery Address</label>
                      <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required className="input-luxury" placeholder="Street, apartment, suite, etc." />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-[var(--primary)] mb-1">City</label>
                        <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} required className="input-luxury" placeholder="City" />
                      </div>
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-[var(--primary)] mb-1">Country</label>
                        <select id="country" name="country" value={formData.country} onChange={handleChange} required className="input-luxury">
                          <option value="Kenya">Kenya</option>
                          <option value="Uganda">Uganda</option>
                          <option value="Tanzania">Tanzania</option>
                          <option value="Rwanda">Rwanda</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>
              </motion.form>
            </div>

            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-24"
              >
                <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
                  <h3 className="font-display text-xl font-medium text-[var(--primary)] mb-6">Order Summary</h3>
                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                    {cart.map((item) => (
                      <div key={`${item._id}-${item.selectedVariant?.color || 'default'}`} className="flex gap-3">
                        <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--secondary)]/30">
                          <img
                            src={item.selectedVariant?.image || item.image || item.images?.[0]?.url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-2xs font-medium uppercase tracking-widest text-[var(--accent)]">{item.category}</p>
                          <h4 className="font-display text-sm font-medium text-[var(--primary)] truncate">{item.name}</h4>
                          {item.selectedVariant && (
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="h-2.5 w-2.5 rounded-full border border-[var(--primary)]/10" style={{ backgroundColor: item.selectedVariant.colorHex || '#ccc' }} />
                              <span className="text-xs text-[var(--primary)]/60">{item.selectedVariant.color}</span>
                            </div>
                          )}
                          <p className="mt-1 text-sm font-medium text-[var(--primary)]">{formatPrice(Number(item.selectedVariant?.price || item.discountPrice || item.price || 0))} × {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[var(--border)]/40 pt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--primary)]/55">Subtotal ({cart?.length || 0} items)</span>
                      <span className="font-medium text-[var(--primary)]">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--primary)]/55">Shipping</span>
                      <span className="font-medium text-[var(--primary)] text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--primary)]/55">Tax (16%)</span>
                      <span className="font-medium text-[var(--primary)]">{formatPrice(tax)}</span>
                    </div>
                    <div className="border-t border-[var(--border)]/40 pt-4">
                      <div className="flex justify-between text-lg font-semibold text-[var(--primary)]">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={loading}
                    className="w-full btn-luxury-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        Place Order
                        <ChevronRight size={14} strokeWidth={1.5} />
                      </>
                    )}
                  </button>
                  <p className="mt-4 text-center text-xs text-[var(--primary)]/50">By placing your order, you agree to our Terms of Service and Privacy Policy.</p>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default CheckoutPage
