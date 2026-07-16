import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'
import { useCurrency } from '../../context/CurrencyContext'

export const WishlistPage = () => {
  const { wishlist, toggleWishlist, addToCart } = useShop()
  const { isAuthenticated } = useAuth()
  const { formatPrice } = useCurrency()

  return (
    <div className="section-pad bg-[var(--bg)] pt-12">
      <div className="container-wide px-6 md:px-12 lg:px-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-3">Your Collection</p>
          <h1 className="font-display text-5xl font-medium text-[var(--primary)] md:text-6xl">Wishlist</h1>
        </motion.div>

        {!wishlist.length ? (
          <div className="mt-16 rounded-2xl border-2 border-dashed border-[var(--border)] bg-white p-12 text-center">
            <Heart size={48} className="mx-auto text-[var(--primary)]/20 mb-4" />
            <p className="font-display text-3xl text-[var(--primary)]/40">Your wishlist is empty</p>
            <p className="mt-2 text-sm text-[var(--primary)]/55">Save products to revisit your favorites.</p>
            {!isAuthenticated ? <p className="mt-2 text-xs uppercase tracking-widest text-[var(--accent)]">Browse freely. Sign in later to preserve items.</p> : null}
            <Link to="/shop" className="mt-6 inline-block rounded-full bg-[var(--accent)] px-8 py-3 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-[var(--accent)] hover:shadow-lg">
              Browse Shop
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((item, i) => (
              <motion.article
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-shadow"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={item.images?.[0]?.url} alt={item.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <button
                    onClick={() => toggleWishlist(item)}
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center bg-white/90 text-[var(--primary)] rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-white"
                    aria-label="Remove from wishlist"
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="space-y-3 p-5">
                  <p className="text-2xs font-medium uppercase tracking-widest text-[var(--accent)]">{item.category}</p>
                  <h2 className="font-display text-2xl text-[var(--primary)]">
                    <Link to={`/shop/${item._id}`} className="hover:text-[var(--accent)] transition-colors">
                      {item.name}
                    </Link>
                  </h2>
                  <p className="text-base font-medium text-[var(--primary)]">{formatPrice(item.discountPrice || item.price)}</p>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => addToCart(item, 1)}
                      disabled={item.stock === 0}
                      className="flex-1 rounded-full bg-[var(--primary)] px-4 py-2.5 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-[var(--primary)]/90 disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={14} strokeWidth={1.5} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlist(item)}
                      className="rounded-full border border-[var(--border)] px-4 py-2.5 text-xs font-medium uppercase tracking-widest text-[var(--primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}