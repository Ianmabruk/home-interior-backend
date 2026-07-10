import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, X, Plus, Minus, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'
import { useCurrency } from '../../context/CurrencyContext'

export const CartPage = () => {
  const navigate = useNavigate()
  const { cart, removeFromCart, setCartQuantity, cartTotal } = useShop()
  const { isAuthenticated } = useAuth()
  const { formatPrice } = useCurrency()

  return (
    <div className="section-pad bg-linen pt-12">
      <div className="container-wide px-6 md:px-12 lg:px-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="eyebrow mb-3">Checkout</p>
          <h1 className="font-display text-5xl font-medium text-ink md:text-6xl">Shopping Cart</h1>
        </motion.div>

        {!cart.length ? (
          <div className="mt-16 rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
            <ShoppingBag size={48} className="mx-auto text-ink/20 mb-4" />
            <p className="font-display text-3xl text-ink/40">Your cart is empty</p>
            <p className="mt-2 text-sm text-ink/55">Add pieces from the shop to start your order.</p>
            {!isAuthenticated ? <p className="mt-2 text-xs uppercase tracking-widest text-orange">Guests can browse freely and sign in later to sync their cart.</p> : null}
            <Link to="/shop" className="mt-6 inline-block rounded-full bg-orange px-8 py-3 text-xs font-medium uppercase tracking-widest text-ink transition hover:bg-orange/90">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_380px]">
            <div className="space-y-5">
              <AnimatePresence>
                {cart.map((item, i) => (
                  <motion.div
                    key={`${item._id}-${item.selectedVariant?.colorName || 'default'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex gap-5 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl">
                      <img src={item.selectedVariant?.imageUrl || item.images?.[0]?.url} alt={item.name} className="h-full w-full object-cover" />
                      {item.stock === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-ink/60">
                          <span className="text-xs font-medium uppercase tracking-widest text-white">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-2xs font-medium uppercase tracking-widest text-orange">{item.category}</p>
                          <h3 className="mt-1 font-display text-2xl font-medium text-ink">
                            <Link to={`/shop/${item._id}`} className="hover:text-orange transition-colors">
                              {item.name}
                            </Link>
                          </h3>
                          {item.selectedVariant && (
                            <div className="mt-1 flex items-center gap-2">
                              <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: item.selectedVariant.colorHex || '#ccc' }} />
                              <span className="text-xs text-ink/60">{item.selectedVariant.colorName}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item._id, item.selectedVariant)}
                          className="text-ink/30 transition hover:text-orange"
                          aria-label="Remove"
                        >
                          <X size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                      <p className="mt-2 text-base font-medium text-ink">{formatPrice(item.selectedVariant?.priceOverride || item.discountPrice || item.price)}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex items-center rounded-full border border-ink/20">
                          <button
                            onClick={() => setCartQuantity(item._id, item.quantity - 1, item.selectedVariant)}
                            disabled={item.stock === 0 || item.quantity <= 1}
                            className="flex h-9 w-9 items-center justify-center text-ink/50 transition hover:text-ink disabled:opacity-30"
                          >
                            <Minus size={14} strokeWidth={1.5} />
                          </button>
                          <span className="min-w-10 text-center text-sm font-medium text-ink">{item.quantity}</span>
                          <button
                            onClick={() => setCartQuantity(item._id, item.quantity + 1, item.selectedVariant)}
                            disabled={item.stock === 0}
                            className="flex h-9 w-9 items-center justify-center text-ink/50 transition hover:text-ink disabled:opacity-30"
                          >
                            <Plus size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                        <span className="text-sm text-ink/40">{item.stock} available</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="h-fit rounded-2xl border border-ink/10 bg-white p-7 shadow-lg">
              <h3 className="font-display text-2xl font-medium text-ink">Order Summary</h3>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink/55">Subtotal</span>
                  <span className="font-medium text-ink">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink/55">Shipping</span>
                  <span className="font-medium text-ink">Free</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink/55">Tax</span>
                  <span className="font-medium text-ink">Calculated at checkout</span>
                </div>
                <div className="border-t border-ink/10 pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold text-ink">
                    <span>Total</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="mt-8 w-full rounded-full bg-ink px-6 py-3.5 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-ink/80 flex items-center justify-center gap-2"
              >
                <ArrowRight size={14} strokeWidth={1.5} />
                Proceed to Checkout
              </button>
              <Link to="/shop" className="mt-4 block text-center text-sm text-ink/55 underline-offset-4 hover:text-ink hover:underline">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}