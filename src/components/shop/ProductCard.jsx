import { Heart, ShoppingBag, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'

export const ProductCard = ({ product, onQuickView }) => {
  const { addToCart, toggleWishlist, wishlist } = useShop()
  const primaryImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=900&q=80'
  const salePercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : null
  const isWishlisted = wishlist?.some((w) => w._id === product._id)
  const price = product.discountPrice || product.price

  return (
    <article className="group">
      {/* Image */}
      <div className="relative overflow-hidden bg-linen aspect-[3/4] rounded-2xl shadow-card">
        <img
          src={primaryImage}
          alt={product.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {salePercent && (
            <span className="bg-orange px-2.5 py-1 text-2xs font-medium uppercase tracking-wide text-white">
              −{salePercent}%
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-charcoal px-2.5 py-1 text-2xs font-medium uppercase tracking-wide text-white">
              Sold Out
            </span>
          )}
        </div>

        {/* Hover actions */}
        <div className="absolute right-3 top-3 flex flex-col gap-2 translate-x-10 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <button
            onClick={() => toggleWishlist(product)}
            className={`flex h-9 w-9 items-center justify-center bg-white rounded-full shadow-lg transition hover:bg-linen ${isWishlisted ? 'text-orange' : 'text-ink/50'}`}
            aria-label="Add to wishlist"
          >
            <Heart size={15} strokeWidth={1.5} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => addToCart(product, 1)}
            disabled={product.stock === 0}
            className="flex h-9 w-9 items-center justify-center bg-white rounded-full shadow-lg text-ink/50 transition hover:bg-linen disabled:opacity-40"
            aria-label="Add to cart"
          >
            <ShoppingBag size={15} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => onQuickView?.(product)}
            className="flex h-9 w-9 items-center justify-center bg-white rounded-full shadow-lg text-ink/50 transition hover:bg-linen"
            aria-label="Quick view"
          >
            <Eye size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Info */}
      <div className="pt-4">
        <p className="text-2xs font-medium uppercase tracking-widest text-ink/40">{product.category}</p>
        <h3 className="mt-1 font-display text-xl font-medium leading-snug text-ink">
          <Link to={`/shop/${product._id}`} className="hover:text-orange transition-colors">
            {product.name}
          </Link>
        </h3>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-sm font-medium text-ink">${price.toLocaleString()}</span>
          {product.discountPrice && (
            <span className="text-sm text-ink/35 line-through">${product.price.toLocaleString()}</span>
          )}
        </div>
      </div>
    </article>
  )
}