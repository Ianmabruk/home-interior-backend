import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'
import { api } from '../../services/api'
import { Star, Heart, ShoppingBag, Truck, Shield, ArrowLeft, ChevronRight, Check } from 'lucide-react'
import PositionedImage from '../../components/common/PositionedImage'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] } }),
}

export const ProductDetailPage = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeColor, setActiveColor] = useState(null)
  const [viewImage, setViewImage] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [addedToCart, setAddedToCart] = useState(false)
  const { addToCart, toggleWishlist, wishlist } = useShop()

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data)
        const variants = res.data?.colorVariants || []
        if (variants.length) {
          const def = variants.find((v) => v.isDefault) || variants[0]
          setActiveColor(def.colorName)
          setViewImage(null)
        }
        if (res.data?.category) {
          api.get('/products', { params: { category: res.data.category, limit: 4, sort: '-createdAt' } })
            .then(r => setRelatedProducts((r.data.items || []).filter(p => p._id !== res.data._id).slice(0, 4)))
            .catch(() => setRelatedProducts([]))
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  const activeVariant = product?.colorVariants?.find((v) => v.colorName === activeColor)
  const galleryImages = activeVariant
    ? [activeVariant.imageUrl, ...(product?.images || []).map((i) => i.url).filter(Boolean)]
    : (product?.images || []).map((i) => i.url).filter(Boolean)
  const displayImage = viewImage || activeVariant?.imageUrl || product?.images?.[0]?.url || null

  const salePercent = product?.price > 0 && product?.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : null

  const price = activeVariant?.priceOverride ?? product?.discountPrice ?? product?.price
  const inStock =
    activeVariant?.stockQuantity !== undefined ? activeVariant.stockQuantity > 0 : product?.stock > 0

  const isWishlisted = wishlist?.some((w) => w._id === product?._id)

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg">
        <div className="mx-auto max-w-7xl grid gap-10 px-4 py-12 md:grid-cols-2 md:px-8">
          <div className="skeleton aspect-[4/5] w-full rounded-3xl" />
          <div className="space-y-5">
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-12 w-72" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-16 w-48" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-primary-bg">
        <div className="text-center">
          <p className="text-sm text-ink/50">Product not found.</p>
          <Link to="/shop" className="btn-primary mt-6 inline-flex items-center gap-2">
            <ArrowLeft size={14} strokeWidth={1.5} /> Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <motion.div className="min-h-screen bg-primary-bg" initial="hidden" animate="show" variants={fadeUp}>
      {/* Breadcrumb */}
      <div className="border-b border-champagne/20 bg-white/60">
        <div className="container-wide px-4 py-3 md:px-12 lg:px-20">
          <nav className="flex items-center gap-2 text-2xs text-ink/50">
            <Link to="/shop" className="hover:text-warm-gold transition">Shop</Link>
            <ChevronRight size={12} strokeWidth={1.5} />
            <span className="text-ink/30">{product.category}</span>
            <ChevronRight size={12} strokeWidth={1.5} />
            <span className="text-ink">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Section */}
      <section className="section-pad bg-primary-bg">
        <div className="container-wide px-4 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl grid gap-10 lg:gap-16 lg:grid-cols-2">
            {/* Image Gallery */}
            <motion.div variants={fadeUp} custom={0} className="space-y-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-linen shadow-card">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={displayImage || 'placeholder'}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full w-full"
                  >
                    <PositionedImage
                      src={displayImage}
                      alt={product.name}
                      settings={product.mediaSettings}
                      className="h-full w-full"
                      sizes="(min-width:1024px) 50vw, 100vw"
                      loading="eager"
                    />
                  </motion.div>
                </AnimatePresence>
                {salePercent && (
                  <span className="absolute left-4 top-4 rounded-full bg-warm-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white shadow-lg">
                    -{salePercent}% Off
                  </span>
                )}
                {!inStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-luxury/40 backdrop-blur-sm">
                    <span className="rounded-full bg-white px-6 py-2 text-sm font-semibold uppercase tracking-widest text-dark-luxury">Sold Out</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {galleryImages.map((url, i) => (
                    <button
                      key={url + i}
                      onClick={() => setViewImage((prev) => (prev === url ? null : url))}
                      className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                        (viewImage || displayImage) === url ? 'border-warm-gold shadow-md scale-105' : 'border-transparent hover:border-champagne/60'
                      }`}
                    >
                      <img src={url} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Details */}
            <motion.div variants={fadeUp} custom={1} className="flex flex-col">
              <p className="text-2xs font-semibold uppercase tracking-widest text-warm-gold">{product.category}</p>
              <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-ink md:text-5xl">{product.name}</h1>

              <div className="mt-6 flex items-baseline gap-4">
                <p className="font-display text-3xl font-medium text-ink">{formatPrice(price)}</p>
                {product.discountPrice && !activeVariant?.priceOverride && (
                  <p className="text-lg text-ink/40 line-through">{formatPrice(product.price)}</p>
                )}
              </div>

              <p className="mt-1 text-2xs font-semibold uppercase tracking-widest text-warm-gold">
                {salePercent ? `You save ${salePercent}%` : 'Best Price Guaranteed'}
              </p>

              {/* Stock Status */}
              <div className="mt-4 flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-red-400'}`} />
                <p className={`text-sm font-medium ${inStock ? 'text-emerald-700' : 'text-red-600'}`}>
                  {activeVariant?.stockQuantity !== undefined
                    ? `${activeVariant.stockQuantity} in stock`
                    : product.stock > 0
                      ? `In Stock (${product.stock} available)`
                      : 'Out of Stock'}
                </p>
              </div>

              {activeVariant?.sku && (
                <p className="mt-2 text-xs font-medium uppercase tracking-widest text-ink/45">SKU: {activeVariant.sku}</p>
              )}

              {/* Description */}
              {product.description && (
                <div className="mt-6">
                  <p className="text-sm leading-[1.8] text-ink/60">{product.description}</p>
                </div>
              )}

              {/* Color Variants */}
              {product.colorVariants?.length > 0 && (
                <div className="mt-8">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-ink/50 mb-3">
                    Color: <span className="text-ink font-medium">{activeColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.colorVariants.map((variant) => (
                      <button
                        key={variant.colorName}
                        onClick={() => { setActiveColor(variant.colorName); setViewImage(null) }}
                        title={variant.colorName}
                        className={`relative h-12 w-12 min-h-[48px] min-w-[48px] overflow-hidden rounded-full border-2 transition-all duration-300 ${
                          activeColor === variant.colorName
                            ? 'border-warm-gold shadow-lg scale-110'
                            : 'border-champagne/60 hover:border-champagne'
                        }`}
                      >
                        {variant.imageUrl ? (
                          <img src={variant.imageUrl} alt={variant.colorName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="block h-full w-full rounded-full" style={{ backgroundColor: variant.colorHex || '#ccc' }} />
                        )}
                        {activeColor === variant.colorName && (
                          <span className="absolute inset-0 flex items-center justify-center rounded-full">
                            <Check size={14} strokeWidth={2.5} className="text-white drop-shadow-md" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    addToCart(product, 1, activeVariant ? { colorName: activeVariant.colorName, colorHex: activeVariant.colorHex, imageUrl: activeVariant.imageUrl } : null)
                    setAddedToCart(true)
                    setTimeout(() => setAddedToCart(false), 2000)
                  }}
                  disabled={product.stock === 0}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addedToCart ? <Check size={16} strokeWidth={2} /> : <ShoppingBag size={16} strokeWidth={1.5} />}
                  {addedToCart ? 'Added!' : 'Add to Cart'}
                </button>
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`btn-outline flex items-center gap-2 ${isWishlisted ? 'border-warm-gold text-warm-gold' : ''}`}
                >
                  <Heart size={16} strokeWidth={1.5} fill={isWishlisted ? 'currentColor' : 'none'} />
                  {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                </button>
              </div>

              {/* Features */}
              <div className="mt-8 flex flex-wrap gap-6 border-t border-champagne/30 pt-6">
                <div className="flex items-center gap-2 text-sm text-ink/55">
                  <Truck size={18} strokeWidth={1.5} className="text-warm-gold" />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ink/55">
                  <Shield size={18} strokeWidth={1.5} className="text-warm-gold" />
                  <span>Quality Guaranteed</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="section-pad bg-linen">
          <div className="container-wide px-4 md:px-12 lg:px-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-10"
            >
              <p className="eyebrow mb-3 text-warm-gold">You May Also Like</p>
              <h2 className="font-display text-4xl font-medium text-ink md:text-5xl">Related Products</h2>
            </motion.div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link to={`/shop/${p._id}`} className="group block">
                    <div className="overflow-hidden rounded-2xl bg-white shadow-card group-hover:shadow-lift transition-all duration-500">
                      <div className="relative aspect-[3/4] overflow-hidden bg-linen">
                        <PositionedImage
                          src={p.images?.[0]?.url || p.colorVariants?.[0]?.imageUrl}
                          alt={p.name}
                          settings={p.mediaSettings}
                          className="h-full w-full transition duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-2xs font-medium uppercase tracking-widest text-warm-gold">{p.category}</p>
                        <h3 className="font-display text-lg font-medium text-ink mt-1 group-hover:text-warm-gold transition-colors">{p.name}</h3>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </motion.div>
  )
}
