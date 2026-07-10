import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'
import { api } from '../../services/api'

export const ProductDetailPage = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeColor, setActiveColor] = useState(null)
  const { addToCart, toggleWishlist } = useShop()

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data)
        // Default to first color variant if available
        if (res.data?.colorVariants?.length) {
          setActiveColor(res.data.colorVariants[0].colorName)
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 md:px-8">
        <div className="h-[520px] animate-pulse rounded-2xl bg-beige" />
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-beige" />
          <div className="h-12 w-64 animate-pulse rounded bg-beige" />
          <div className="h-20 animate-pulse rounded bg-beige" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <p className="text-sm text-ink/50">Product not found.</p>
      </div>
    )
  }

  // Determine displayed image: active color variant image OR first product image
  const activeVariant = product.colorVariants?.find((v) => v.colorName === activeColor)
  const displayImage =
    activeVariant?.imageUrl ||
    product.images?.[0]?.url ||
    null

  const salePercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : null

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 md:px-8">
      {/* Image */}
      <div className="relative aspect-[1/1] overflow-hidden rounded-3xl bg-linen md:h-[520px] md:aspect-auto">
        <AnimatePresence mode="wait">
          <motion.img
            key={displayImage || 'placeholder'}
            src={displayImage}
            alt={product.name}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="h-full w-full object-contain"
          />
        </AnimatePresence>
        {salePercent && (
          <span className="absolute left-4 top-4 rounded-full bg-orange px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink">
            Sale {salePercent}%
          </span>
        )}
      </div>

      {/* Details */}
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-orange">{product.category}</p>
        <h1 className="mt-2 font-display text-5xl leading-tight">{product.name}</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink/70">{product.description}</p>

        <div className="mt-5 flex items-baseline gap-3">
          <p className="text-2xl font-semibold">
            ${activeVariant?.priceOverride ?? product.discountPrice ?? product.price}
          </p>
          {product.discountPrice && !activeVariant?.priceOverride && (
            <p className="text-sm text-ink/40 line-through">${product.price}</p>
          )}
        </div>

        <p className={`mt-2 text-xs font-semibold ${(activeVariant?.stockQuantity ?? product.stock) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {activeVariant?.stockQuantity !== undefined
            ? `Variant Stock: ${activeVariant.stockQuantity} available`
            : product.stock > 0
              ? `In Stock (${product.stock} available)`
              : 'Out of Stock'}
        </p>

        {/* Color Variants */}
        {product.colorVariants?.length > 0 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-ink/60">
              Color:{' '}
              <span className="font-semibold text-ink">{activeColor}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.colorVariants.map((variant) => (
                <button
                  key={variant.colorName}
                  onClick={() => setActiveColor(variant.colorName)}
                  title={variant.colorName}
                  className={`relative h-10 w-10 min-h-[40px] min-w-[40px] overflow-hidden rounded-full border-2 transition-all ${
                    activeColor === variant.colorName
                      ? 'border-orange shadow-md scale-110'
                      : 'border-black/15 hover:border-black/40'
                  }`}
                >
                  {variant.imageUrl ? (
                    <img
                      src={variant.imageUrl}
                      alt={variant.colorName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      className="block h-full w-full rounded-full"
                      style={{ backgroundColor: variant.colorHex || '#ccc' }}
                    />
                  )}
                  {activeColor === variant.colorName && (
                    <span className="absolute inset-0 rounded-full ring-2 ring-orange ring-offset-1" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Multiple images gallery */}
        {product.images?.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveColor(null)}
                className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-black/10"
              >
                <img src={img.url} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => addToCart(product, 1, activeVariant ? { colorName: activeVariant.colorName, colorHex: activeVariant.colorHex, imageUrl: activeVariant.imageUrl } : null)}
            disabled={product.stock === 0}
            className="rounded-full bg-ink px-8 py-3 text-xs uppercase tracking-[0.18em] text-white transition hover:bg-ink/85 disabled:opacity-50"
          >
            Add to Cart
          </button>
          <button
            onClick={() => toggleWishlist(product)}
            className="rounded-full border border-ink px-8 py-3 text-xs uppercase tracking-[0.18em] transition hover:bg-ink hover:text-white"
          >
            Wishlist
          </button>
        </div>
      </div>
    </div>
  )
}
