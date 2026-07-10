import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
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
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="section-pad container-narrow px-6 text-center">
        <h1 className="font-display text-5xl">Checkout</h1>
        <p className="mt-4 text-sm text-ink/55">Please sign in to complete your order.</p>
        <Link to="/login" className="mt-6 inline-block btn-primary">Sign In</Link>
      </div>
    )
  }

  if (!cart.length && !done) {
    return (
      <div className="section-pad container-narrow px-6 text-center">
        <h1 className="font-display text-5xl">Checkout</h1>
        <p className="mt-4 text-sm text-ink/55">Your cart is empty.</p>
        <button onClick={() => navigate('/shop')} className="mt-6 btn-primary">Continue Shopping</button>
      </div>
    )
  }

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const shippingAddress = {
        line1: form.address,
        line2: '',
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
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

  if (done) {
    return (
      <div className="section-pad container-narrow px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-lg rounded-3xl border border-sand bg-white p-10 shadow-card">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check size={28} />
          </div>
          <h1 className="font-display text-4xl text-ink">Payment Complete</h1>
          <p className="mt-3 text-sm text-ink/60">Thank you for your order. A confirmation has been sent to your inbox.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => navigate('/account')} className="btn-primary">View Orders</button>
            <button onClick={() => navigate('/shop')} className="btn-outline">Continue Shopping</button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="section-pad bg-linen pb-8">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="rounded-full border border-sand bg-white p-2 text-ink transition hover:bg-linen">
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="eyebrow">Secure Checkout</p>
              <h1 className="font-display text-4xl font-medium text-ink md:text-5xl">Checkout</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="section-pad bg-cream pt-4">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-sand/60 bg-white p-6 shadow-card">
                <h2 className="font-display text-2xl text-ink mb-4">Contact</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label">Full Name</label>
                    <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" required />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" required />
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-sand/60 bg-white p-6 shadow-card">
                <h2 className="font-display text-2xl text-ink mb-4">Shipping Address</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label">Address</label>
                    <input value={form.address} onChange={(e) => update('address', e.target.value)} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" placeholder="Street address" required />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input value={form.city} onChange={(e) => update('city', e.target.value)} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" required />
                  </div>
                  <div>
                    <label className="label">State / Region</label>
                    <input value={form.state} onChange={(e) => update('state', e.target.value)} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="label">Postal Code</label>
                    <input value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" required />
                  </div>
                  <div>
                    <label className="label">Country</label>
                    <input value={form.country} onChange={(e) => update('country', e.target.value)} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" required />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-fit rounded-3xl border border-sand/60 bg-white p-7 shadow-card">
              <h3 className="font-display text-2xl font-medium text-ink">Order Summary</h3>
              <div className="mt-6 space-y-4">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink truncate">{item.name}</p>
                      <p className="text-ink/50">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-ink font-medium">{formatPrice((item.discountPrice || item.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3 border-t border-sand pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink/55">Subtotal</span>
                  <span className="font-medium text-ink">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink/55">Shipping</span>
                  <span className="font-medium text-ink">Free</span>
                </div>
                <div className="flex items-center justify-between text-lg font-semibold text-ink pt-3 border-t border-sand">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>

              {error && <p className="mt-4 text-xs text-red-600">{error}</p>}

              <button type="submit" disabled={submitting} className="mt-8 w-full rounded-full bg-ink px-6 py-3.5 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-ink/80 flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? 'Processing...' : 'Complete Payment'}
              </button>
              <p className="mt-3 text-center text-xs text-ink/40">Payment integration coming soon. This is a demo checkout.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
