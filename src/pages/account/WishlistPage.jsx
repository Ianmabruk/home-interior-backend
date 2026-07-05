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
    <div className="section-pad bg-linen pt-12">
      <div className="container-wide px-6 md:px-12 lg:px-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="eyebrow mb-3">Your Collection</p>
          <h1 className="font-display text-5xl font-medium text-ink md:text-6xl">Wishlist</h1>
        </motion.div>

        {!wishlist.length ? (
          <div className="mt-16 rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
            <Heart size={48} className="mx-auto text-ink/20 mb-4" />
            <p className="font-display text-3xl text-ink/40">Your wishlist is empty</p>
            <p className="mt-2 text-sm text-ink/55">Save products to revisit your favorites.</p>
            {!isAuthenticated ? <p className="mt-2 text-xs uppercase tracking-widest text-orange">Browse freely. Sign in later to preserve items.</p> : null}
            <Link to="/shop" className="mt-6 inline-block rounded-full bg-orange px-8 py-3 text-xs font-medium uppercase tracking-widest text-ink transition hover:bg-orange/90">
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
                className="group overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={item.images?.[0]?.url} alt={item.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <button
                    onClick={() => toggleWishlist(item)}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-white/90 text-ink rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-white"
                    aria-label="Remove from wishlist"
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="space-y-3 p-5">
                  <p className="text-2xs font-medium uppercase tracking-widest text-orange">{item.category}</p>
                  <h2 className="font-display text-2xl text-ink">
                    <Link to={`/shop/${item._id}`} className="hover:text-orange transition-colors">
                      {item.name}
                    </Link>
                  </h2>
                  <p className="text-base font-medium text-ink">{formatPrice(item.discountPrice || item.price)}</p>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => addToCart(item, 1)}
                      disabled={item.stock === 0}
                      className="flex-1 rounded-full bg-ink px-4 py-2.5 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-ink/80 disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={14} strokeWidth={1.5} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlist(item)}
                      className="rounded-full border border-ink/20 px-4 py-2.5 text-xs font-medium uppercase tracking-widest text-ink transition hover:border-ink/40 hover:text-orange"
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