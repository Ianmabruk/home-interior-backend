import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Loader2, Smartphone, CreditCard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'
import { useCurrency } from '../../context/CurrencyContext'
import { api } from '../../services/api'

export const CheckoutPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cart, cartTotal, clearCart } = useShop()
  const { formatPrice } = useCurrency()

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvv: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="section-pad container-wide px-6 md:px-12 lg:px-20 text-center">
        <h1 className="font-display text-5xl font-normal text-[var(--primary)]">Checkout</h1>
        <p className="mt-4 text-sm text-[var(--primary)]/55">Please sign in to complete your order.</p>
        <Link to="/login" className="btn-luxury-primary mt-6 inline-block">Sign In</Link>
      </div>
    )
  }

  if (!cart.length && !done) {
    return (
      <div className="section-pad container-wide px-6 md:px-12 lg:px-20 text-center">
        <h1 className="font-display text-5xl font-normal text-[var(--primary)]">Checkout</h1>
        <p className="mt-4 text-sm text-[var(--primary)]/55">Your cart is empty.</p>
        <button onClick={() => navigate('/shop')} className="btn-luxury-primary mt-6">Continue Shopping</button>
      </div>
    )
  }

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const updateCard = (key, value) => setCardForm((c) => ({ ...c, [key]: value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const shippingAddress = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
      }

      await api.post('/orders', {
        items: cart.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
          variant: item.selectedVariant?.colorName ? {
            colorName: item.selectedVariant.colorName,
            colorHex: item.selectedVariant.colorHex,
          } : undefined,
        })),
        shippingAddress,
      })

      clearCart()
      setDone(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Checkout failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16)
    const groups = digits.match(/.{1,4}/g) || []
    return groups.join(' ')
  }

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`
    }
    return digits
  }

  const formatCvv = (value) => {
    return value.replace(/\D/g, '').slice(0, 3)
  }

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 15)
    return digits
  }

  if (done) {
    return (
      <div className="section-pad container-wide px-6 md:px-12 lg:px-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg rounded-3xl border border-[var(--border)] bg-white p-10 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
            <Check size={28} />
          </div>
          <h1 className="font-display text-4xl font-normal text-[var(--primary)]">Payment Complete</h1>
          <p className="mt-3 text-sm text-[var(--primary)]/60">Thank you for your order. A confirmation has been sent to your inbox.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => navigate('/account')} className="btn-luxury-primary">View Orders</button>
            <button onClick={() => navigate('/shop')} className="btn-luxury-secondary">Continue Shopping</button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="section-pad bg-[var(--secondary)]/50 pb-8">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="rounded-full border border-[var(--border)] bg-white p-2 text-[var(--primary)] transition hover:bg-[var(--secondary)]">
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">Secure Checkout</p>
              <h1 className="font-display text-4xl font-normal text-[var(--primary)] md:text-5xl">Checkout</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="section-pad bg-[var(--bg)] pt-4">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[0_2px_16px_rgba(42,36,31,0.04)]">
                <h2 className="font-display text-2xl font-normal text-[var(--primary)] mb-4">Contact Information</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Full Name</label>
                    <input
                      value={form.fullName}
                      onChange={(e) => update('fullName', e.target.value)}
                      className="input-luxury"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      className="input-luxury"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Phone Number</label>
                    <input
                      value={form.phone}
                      onChange={(e) => update('phone', formatPhone(e.target.value))}
                      className="input-luxury"
                      placeholder="+254 7XX XXX XXX"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[0_2px_16px_rgba(42,36,31,0.04)]">
                <h2 className="font-display text-2xl font-normal text-[var(--primary)] mb-4">Shipping Address</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Address</label>
                    <input
                      value={form.address}
                      onChange={(e) => update('address', e.target.value)}
                      className="input-luxury"
                      placeholder="Street address, apartment, suite, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">City</label>
                    <input
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      className="input-luxury"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">State / Region</label>
                    <input
                      value={form.state}
                      onChange={(e) => update('state', e.target.value)}
                      className="input-luxury"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Postal Code</label>
                    <input
                      value={form.postalCode}
                      onChange={(e) => update('postalCode', e.target.value)}
                      className="input-luxury"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Country</label>
                    <input
                      value={form.country}
                      onChange={(e) => update('country', e.target.value)}
                      className="input-luxury"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[0_2px_16px_rgba(42,36,31,0.04)]">
                <h2 className="font-display text-2xl font-normal text-[var(--primary)] mb-4">Payment Method</h2>

                <div className="flex gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-3 text-sm font-medium transition-all ${
                      paymentMethod === 'card'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--primary)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <CreditCard size={20} strokeWidth={1.5} />
                    <span>Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-3 text-sm font-medium transition-all ${
                      paymentMethod === 'mobile'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--primary)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <Smartphone size={20} strokeWidth={1.5} />
                    <span>Mobile</span>
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-4" id="card-payment">
                    <div>
                      <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Card Number</label>
                      <input
                        type="text"
                        value={cardForm.number}
                        onChange={(e) => updateCard('number', formatCardNumber(e.target.value))}
                        className="input-luxury font-mono text-lg"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        autoComplete="cc-number"
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Expiry Date</label>
                        <input
                          type="text"
                          value={cardForm.expiry}
                          onChange={(e) => updateCard('expiry', formatExpiry(e.target.value))}
                          className="input-luxury"
                          placeholder="MM/YY"
                          maxLength={5}
                          autoComplete="cc-exp"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">CVV</label>
                        <input
                          type="text"
                          value={cardForm.cvv}
                          onChange={(e) => updateCard('cvv', formatCvv(e.target.value))}
                          className="input-luxury"
                          placeholder="123"
                          maxLength={3}
                          autoComplete="cc-csc"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'mobile' && (
                  <div className="space-y-4" id="mobile-payment">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/30 p-4">
                      <p className="text-sm text-[var(--primary)]/60">Enter your mobile money number (M-Pesa, Airtel Money, etc.)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update('phone', formatPhone(e.target.value))}
                        className="input-luxury"
                        placeholder="+254 7XX XXX XXX"
                        required
                      />
                    </div>
                    <p className="text-xs text-[var(--primary)]/40">You will receive a prompt on your phone to complete the payment.</p>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="h-fit rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
                <h3 className="font-display text-2xl font-normal text-[var(--primary)]">Order Summary</h3>
                <div className="mt-6 space-y-4">
                  {cart.map((item) => (
                    <div key={item._id} className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--primary)] truncate">{item.name}</p>
                        <p className="text-[var(--primary)]/50">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-[var(--primary)] font-medium">{formatPrice((item.discountPrice || item.price) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-3 border-t border-[var(--border)] pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--primary)]/55">Subtotal</span>
                    <span className="font-medium text-[var(--primary)]">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--primary)]/55">Shipping</span>
                    <span className="font-medium text-[var(--primary)]">Free</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-semibold text-[var(--primary)] pt-3 border-t border-[var(--border)]">
                    <span>Total</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                </div>

                {error && <p className="mt-4 text-xs text-[var(--error)]">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-8 w-full rounded-full bg-[var(--primary)] px-6 py-3.5 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-[var(--primary)]/90 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Processing...' : 'Complete Payment'}
                </button>
                <p className="mt-3 text-center text-xs text-[var(--primary)]/40">Payment integration coming soon. This is a demo checkout.</p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}