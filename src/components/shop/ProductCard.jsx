import { memo } from 'react'
import { Heart, ShoppingBag, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useShop } from '../../context/ShopContext'
import { useCurrency } from '../../context/CurrencyContext'
import PositionedImage from '../common/PositionedImage'

export const ProductCard = memo(({ product, onQuickView }) => {
  const { addToCart, toggleWishlist, wishlist } = useShop()
  const { formatPrice } = useCurrency()
  // FIX #1: resolve the storefront default variant exactly like the detail
  // page (isDefault flag, then first variant) so the shop card and the product
  // page agree on which color shows first (White, not an arbitrary variant).
  const variants = product.colorVariants || []
  const defaultVariant = variants.length ? (variants.find((v) => v.isDefault) || variants[0]) : null
  const primaryImage =
    defaultVariant?.imageUrl ||
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1586023943478-ae8b06f48d80?auto=format&fit=crop&w=800&q=80'
  const salePercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : null
  const isWishlisted = wishlist?.some((w) => w._id === product._id)
  const price = (defaultVariant?.priceOverride ?? product.discountPrice) || product.price

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden bg-white shadow-lg hover:shadow-xl"
    >
      <div className="relative aspect-[1/1] overflow-hidden bg-linen">
        <PositionedImage
          src={primaryImage}
          alt={product.name}
          settings={product.mediaSettings}
          className="h-full w-full transition duration-700 group-hover:scale-102"
          loading="lazy"
          sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
        />

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {salePercent && (
            <span className="bg-orange px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider text-white rounded-full">
              −{salePercent}%
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-ink px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider text-white rounded-full">
              Sold Out
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-2 translate-x-10 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <button
            onClick={() => toggleWishlist(product)}
            className={`flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center bg-white rounded-full shadow-md transition hover:bg-linen ${isWishlisted ? 'text-orange' : 'text-ink/50'}`}
            aria-label="Add to wishlist"
          >
            <Heart size={15} strokeWidth={1.5} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => addToCart(product, 1, defaultVariant ? { colorName: defaultVariant.colorName, colorHex: defaultVariant.colorHex, imageUrl: defaultVariant.imageUrl } : null)}
            disabled={product.stock === 0}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center bg-white rounded-full shadow-md text-ink/50 transition hover:bg-linen disabled:opacity-40"
            aria-label="Add to cart"
          >
            <ShoppingBag size={15} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => onQuickView?.(product)}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center bg-white rounded-full shadow-md text-ink/50 transition hover:bg-linen"
            aria-label="Quick view"
          >
            <Eye size={15} strokeWidth={1.5} />
          </button>
        </div>

        <div className="absolute inset-0 bg-ink/0 transition-all duration-500 group-hover:bg-ink/20" />

        <Link
          to={`/shop/${product._id}`}
          className="absolute inset-0 flex items-center justify-center bg-ink/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <span className="rounded-full bg-white px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-ink">
            View Product
          </span>
        </Link>
      </div>

      <div className="p-5">
        <p className="text-2xs font-medium uppercase tracking-widest text-orange">{product.category}</p>
        <h3 className="mt-2 font-display text-xl font-medium leading-snug text-ink">
          <Link to={`/shop/${product._id}`} className="hover:text-orange transition-colors">
            {product.name}
          </Link>
        </h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-medium text-ink">{formatPrice(price)}</span>
          {product.discountPrice && (
            <span className="text-sm text-ink/35 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </motion.article>
  )
})