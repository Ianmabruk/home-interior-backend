import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'
import { useCurrency } from '../../context/CurrencyContext'
import { api } from '../../services/api'
import { Star, Heart, ShoppingBag, Truck, Shield, ArrowLeft, ChevronRight, Check, Package, Ruler, Palette, Sparkles, AlertCircle, RefreshCw } from 'lucide-react'
import PositionedImage from '../../components/common/PositionedImage'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] } }),
}

const SPECIFICATION_FIELDS = [
  { key: 'materials', label: 'Materials', icon: Package },
  { key: 'dimensions', label: 'Dimensions', icon: Ruler },
  { key: 'colors', label: 'Available Colors', icon: Palette },
  { key: 'styles', label: 'Available Styles', icon: Sparkles },
]

export const ProductDetailPage = () => {
  const { id } = useParams()
  const { formatPrice } = useCurrency()
  const { addToCart, toggleWishlist, wishlist } = useShop()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeColor, setActiveColor] = useState(null)
  const [viewImage, setViewImage] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [addedToCart, setAddedToCart] = useState(false)

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setError('Product ID is required')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/products/${id}`)
      const productData = res.data
      
      // Validate product data structure
      if (!productData || !productData._id) {
        throw new Error('Invalid product data received')
      }

      setProduct(productData)

      // Set default color variant
      const variants = productData?.colorVariants || []
      if (variants.length) {
        const def = variants.find((v) => v.isDefault) || variants[0]
        setActiveColor(def.colorName)
        setViewImage(null)
      }

      // Fetch related products
      if (productData?.category) {
        try {
          const r = await api.get('/products', { 
            params: { category: productData.category, limit: 4, sort: '-createdAt' } 
          })
          setRelatedProducts(
            (r.data?.items || [])
              .filter((p) => p._id !== productData._id)
              .slice(0, 4)
          )
        } catch {
          setRelatedProducts([])
        }
      }
    } catch (err) {
      console.error('[ProductDetailPage] Error fetching product:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to load product')
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  const retry = () => {
    fetchProduct()
  }

  const goBack = () => navigate(-1)

  const activeVariant = product?.colorVariants?.find((v) => v.colorName === activeColor)
  const galleryImages = useMemo(() => {
    if (activeVariant?.imageUrl) {
      return [activeVariant.imageUrl, ...(product?.images || []).map((i) => i.url).filter(Boolean)]
    }
    return (product?.images || []).map((i) => i.url).filter(Boolean)
  }, [activeVariant, product])

  const displayImage = viewImage || activeVariant?.imageUrl || product?.images?.[0]?.url || null

  const salePercent = product?.price > 0 && product?.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : null

  const price = activeVariant?.priceOverride ?? product?.discountPrice ?? product?.price
  const inStock =
    activeVariant?.stockQuantity !== undefined ? activeVariant.stockQuantity > 0 : (product?.stock ?? 0) > 0

  const isWishlisted = wishlist?.some((w) => w._id === product?._id)

  // Render loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="mx-auto max-w-7xl grid gap-10 px-4 py-12 md:grid-cols-2 md:px-8">
          <div className="skeleton aspect-[4/5] w-full rounded-3xl" />
          <div className="space-y-5">
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-12 w-72" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-16 w-48" />
            <div className="skeleton h-12 w-64" />
          </div>
        </div>
      </div>
    )
  }

  // Render error state with retry
  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[var(--bg)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <AlertCircle size={28} strokeWidth={1.5} className="text-[var(--accent)]" />
          </div>
          <h2 className="font-display text-2xl font-medium text-[var(--primary)] mb-3">
            {error ? 'Unable to Load Product' : 'Product Not Found'}
          </h2>
          <p className="text-sm text-[var(--primary)]/50 mb-6">
            {error || 'This product doesn\'t exist or has been removed.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={retry}
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bg)] transition-all duration-300 hover:bg-[var(--accent)] hover:shadow-[0_8px_30px_rgba(232,154,67,0.15)] hover:-translate-y-0.5"
            >
              <RefreshCw size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:rotate-12" />
              Try Again
            </button>
            <Link
              to="/shop"
              onClick={goBack}
              className="group inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--primary)] transition-all duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              Back to Shop
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-[var(--bg)]"
      initial="hidden"
      animate="show"
      variants={fadeUp}
    >
      {/* Breadcrumb */}
      <div className="border-b border-[var(--border)] bg-[var(--bg)]/60">
        <div className="container-wide px-4 py-3 md:px-12 lg:px-20">
          <nav className="flex items-center gap-2 text-2xs text-[var(--primary)]/50" aria-label="Breadcrumb">
            <Link to="/shop" className="hover:text-[var(--accent)] transition-colors">Shop</Link>
            <ChevronRight size={12} strokeWidth={1.5} />
            <Link to={`/shop?category=${product.category}`} className="hover:text-[var(--accent)] transition-colors">
              {product.category}
            </Link>
            <ChevronRight size={12} strokeWidth={1.5} />
            <span className="text-[var(--primary)] truncate max-w-[200px] block">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Section */}
      <section className="section-pad bg-[var(--bg)]">
        <div className="container-wide px-4 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl grid gap-10 lg:gap-16 lg:grid-cols-2">
            {/* Image Gallery */}
            <motion.div variants={fadeUp} custom={0} className="space-y-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-[var(--secondary)] shadow-[0_2px_16px_rgba(42,36,31,0.04)]">
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
                  <span className="absolute left-4 top-4 rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white shadow-lg">
                    -{salePercent}% Off
                  </span>
                )}
                {!inStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--primary)]/40 backdrop-blur-sm">
                    <span className="rounded-full bg-[var(--bg)] px-6 py-2 text-sm font-semibold uppercase tracking-widest text-[var(--primary)]">Sold Out</span>
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
                        (viewImage || displayImage) === url
                          ? 'border-[var(--accent)] shadow-md scale-105'
                          : 'border-transparent hover:border-[var(--accent)]/60'
                      }`}
                      aria-label={`View image ${i + 1}`}
                    >
                      <img src={url} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Details */}
            <motion.div variants={fadeUp} custom={1} className="flex flex-col">
              <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--accent)]">{product.category}</p>
              <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-[var(--primary)] md:text-5xl">
                {product.name}
              </h1>

              <div className="mt-6 flex items-baseline gap-4">
                <p className="font-display text-3xl font-medium text-[var(--primary)]">
                  {formatPrice(price)}
                </p>
                {product.discountPrice && !activeVariant?.priceOverride && (
                  <p className="text-lg text-[var(--primary)]/35 line-through">{formatPrice(product.price)}</p>
                )}
              </div>

              <p className="mt-1 text-2xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {salePercent ? `You save ${salePercent}%` : 'Best Price Guaranteed'}
              </p>

              {/* Stock Status */}
              <div className="mt-4 flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${inStock ? 'bg-[var(--success)]' : 'bg-[var(--error)]'}`} />
                <p className={`text-sm font-medium ${inStock ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                  {activeVariant?.stockQuantity !== undefined
                    ? `${activeVariant.stockQuantity} in stock`
                    : product?.stock > 0
                    ? `In Stock (${product.stock} available)`
                    : 'Out of Stock'}
                </p>
              </div>

              {activeVariant?.sku && (
                <p className="mt-2 text-xs font-medium uppercase tracking-widest text-[var(--primary)]/45">SKU: {activeVariant.sku}</p>
              )}

              {/* Description */}
              {product.description && (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-3">Description</h3>
                  <p className="text-sm leading-[1.8] text-[var(--primary)]/60">{product.description}</p>
                </div>
              )}

              {/* Specifications */}
              {SPECIFICATION_FIELDS.some(field => product?.[field.key]) && (
                <div className="mt-8">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-4">Specifications</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SPECIFICATION_FIELDS
                      .filter(field => product?.[field.key])
                      .map((field, idx) => {
                        const Icon = field.icon
                        const value = product[field.key]
                        const displayValue = Array.isArray(value) ? value.join(', ') : value
                        return (
                          <motion.div
                            key={field.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            className="flex items-start gap-3 rounded-xl bg-white p-4 border border-[var(--border)] shadow-sm"
                          >
                            <div className="flex-shrink-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                              <Icon size={18} strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--accent)]">{field.label}</p>
                              <p className="text-sm text-[var(--primary)] mt-0.5">{displayValue}</p>
                            </div>
                          </motion.div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Color Variants */}
              {product.colorVariants?.length > 0 && (
                <div className="mt-8">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-3">
                    Color: <span className="text-[var(--primary)] font-medium">{activeColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.colorVariants.map((variant) => (
                      <button
                        key={variant.colorName}
                        onClick={() => { setActiveColor(variant.colorName); setViewImage(null) }}
                        title={variant.colorName}
                        className={`relative h-12 w-12 min-h-[48px] min-w-[48px] overflow-hidden rounded-full border-2 transition-all duration-300 ${
                          activeColor === variant.colorName
                            ? 'border-[var(--accent)] shadow-lg scale-110'
                            : 'border-[var(--border)] hover:border-[var(--accent)]/60'
                        }`}
                      >
                        {variant.imageUrl ? (
                          <img src={variant.imageUrl} alt={variant.colorName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="block h-full w-full rounded-full" style={{ backgroundColor: variant.colorHex || '#ccc' }} />
                        )}
                        {activeColor === variant.colorName && (
                          <span className="absolute inset-0 flex items-center justify-center rounded-full">
                            <Check size={14} strokeWidth={2.5} className="text-[var(--bg)] drop-shadow-md" />
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
                    addToCart(product, 1, activeVariant ? { 
                      colorName: activeVariant.colorName, 
                      colorHex: activeVariant.colorHex, 
                      imageUrl: activeVariant.imageUrl 
                    } : null)
                    setAddedToCart(true)
                    setTimeout(() => setAddedToCart(false), 2000)
                  }}
                  disabled={!inStock || product.stock === 0}
                  className="btn-luxury-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addedToCart ? <Check size={16} strokeWidth={2} /> : <ShoppingBag size={16} strokeWidth={1.5} />}
                  {addedToCart ? 'Added!' : 'Add to Cart'}
                </button>
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`btn-luxury-secondary flex items-center gap-2 ${isWishlisted ? 'border-[var(--accent)] text-[var(--accent)]' : ''}`}
                >
                  <Heart size={16} strokeWidth={1.5} fill={isWishlisted ? 'currentColor' : 'none'} />
                  {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                </button>
              </div>

              {/* Features */}
              <div className="mt-8 flex flex-wrap gap-6 border-t border-[var(--border)] pt-6">
                <div className="flex items-center gap-2 text-sm text-[var(--primary)]/55">
                  <Truck size={18} strokeWidth={1.5} className="text-[var(--accent)]" />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--primary)]/55">
                  <Shield size={18} strokeWidth={1.5} className="text-[var(--accent)]" />
                  <span>Quality Guaranteed</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="section-pad bg-[var(--secondary)]/30">
          <div className="container-wide px-4 md:px-12 lg:px-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-10"
            >
              <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-3">You May Also Like</p>
              <h2 className="font-display text-4xl font-medium text-[var(--primary)] md:text-5xl">Related Products</h2>
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
                    <div className="overflow-hidden rounded-2xl bg-[var(--card)] shadow-[0_2px_16px_rgba(42,36,31,0.04)] group-hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500">
                      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--secondary)]">
                        <PositionedImage
                          src={p.images?.[0]?.url || p.colorVariants?.[0]?.imageUrl}
                          alt={p.name}
                          settings={p.mediaSettings}
                          className="h-full w-full transition duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-2xs font-medium uppercase tracking-widest text-[var(--accent)]">{p.category}</p>
                        <h3 className="font-display text-lg font-medium text-[var(--primary)] mt-1 group-hover:text-[var(--accent)] transition-colors">
                          {p.name}
                        </h3>
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