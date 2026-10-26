import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag, ChevronLeft, ChevronRight, Minus, Plus, AlertTriangle, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from '@components/common/DynamicMotion'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import OptimizedImage from '@components/common/OptimizedImage'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { useShop } from '@context/ShopContext'
import { useCurrency } from '@context/CurrencyContext'
import { useZoom } from '@hooks/useZoom'

export const ProductDetailPage = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const { addToCart, addToWishlist, wishlist, cart } = useShop()
  const { formatPrice } = useCurrency()
  const navigate = useNavigate()

  const maxQuantity = useMemo(() => {
    if (!product) return 99
    if (selectedVariant) {
      return Math.max(1, selectedVariant.stock ?? product.stock ?? 99)
    }
    return Math.max(1, product.stock ?? 99)
  }, [product, selectedVariant])

  const { style: zoomStyle, scale, handleWheel, handleMouseDown, handleTouchStart, handleTouchMove, handleTouchEnd, reset } = useZoom()

  const loadProduct = useCallback(async () => {
    if (!id) return
    try {
      const res = await api.get(`/products/${id}`)
      setProduct(res.data || null)
      if (res.data?.variants?.[0]) {
        setSelectedVariant(res.data.variants[0])
      }
    } catch (err) {
      setError(err?.message || 'Product not found')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    setQuantity((q) => Math.min(q, maxQuantity))
  }, [maxQuantity])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'products-changed') loadProduct()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadProduct])

  const images = useMemo(() => {
    if (!product) return []
    const imgs = product.images || []
    if (product.featuredImage && !imgs.includes(product.featuredImage)) {
      return [product.featuredImage, ...imgs]
    }
    return imgs
  }, [product])

  const currentImage = useMemo(() => {
    const variantImg = selectedVariant?.image
    if (variantImg) return variantImg
    const img = images[currentImageIndex]
    return typeof img === 'string' ? img : img?.url || ''
  }, [selectedVariant, images, currentImageIndex])

  const currentPrice = useMemo(() => {
    if (!product) return 0
    if (selectedVariant?.price) return selectedVariant.price
    return product.discountPrice || product.price || 0
  }, [product, selectedVariant])

  const handleAddToCart = async () => {
    if (!product) return
    setAddingToCart(true)
    try {
      await addToCart(product, selectedVariant, quantity)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!product) return
    setAddingToCart(true)
    try {
      await addToCart(product, selectedVariant, quantity)
      navigate('/checkout')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleAddToCartClick = async () => {
    if (!product) return
    setAddingToCart(true)
    try {
      await addToCart(product, selectedVariant, quantity)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNowClick = async () => {
    if (!product) return
    setAddingToCart(true)
    try {
      await addToCart(product, selectedVariant, quantity)
      navigate('/checkout')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleAddToWishlist = async () => {
    if (!product) return
    await addToWishlist(product._id)
  }

  const handleQuantityChange = (event) => {
    const rawValue = event.target.value
    if (rawValue === '') {
      setQuantity(1)
      return
    }

    const parsedValue = Number.parseInt(rawValue, 10)
    if (Number.isNaN(parsedValue)) {
      setQuantity(1)
      return
    }

    setQuantity(Math.min(maxQuantity, Math.max(1, parsedValue)))
  }

  const isInWishlist = product?._id && wishlist.some((item) => item._id === product._id)
  const isInCart = product?._id && cart.some((item) => item._id === product._id && (!selectedVariant || item.selectedVariant?._id === selectedVariant._id))

  if (loading) {
    return (
      <main>
        <section className="px-6 md:px-12 lg:px-20 py-16">
          <div className="container-wide">
            <div className="grid gap-12 lg:grid-cols-2">
              <div className="aspect-[4/3] skeleton rounded-3xl" />
              <div className="space-y-6">
                <div className="skeleton h-3 w-24 mb-4" />
                <div className="skeleton h-8 w-3/4 mb-6" />
                <div className="skeleton h-6 w-24 mb-6" />
                <div className="skeleton h-4 w-full mb-6" />
                <div className="skeleton h-12 w-full max-w-xs" />
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main>
        <section className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--error)]/10 text-[var(--error)]">
              <AlertTriangle size={32} strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-3">Product Not Found</h1>
            <p className="text-sm text-[var(--primary)]/55 mb-6">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Link to="/shop" className="btn-luxury-primary inline-flex items-center gap-2">
              <ArrowLeft size={14} strokeWidth={1.5} />
              Back to Shop
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const categoryLabels = {
    mirror: 'Mirrors',
    artwork: 'Wall Artwork',
    'throw-pillows': 'Throw Pillows',
  }

  return (
    <main className="pb-20 md:pb-0">
      <PageMeta
        title={`${product.name} — HOK Interior Designs`}
        description={product.description || `Discover ${product.name} at HOK Interior Designs.`}
        image={images[0] ? getOptimizedUrl(images[0], { width: 1200 }) : undefined}
      />
      <section className="px-6 md:px-12 lg:px-20 py-8 md:py-12">
        <div className="container-wide">
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-[var(--primary)]/50">
              <li><Link to="/" className="hover:text-[var(--accent)] transition-colors">Home</Link></li>
              <li className="text-[var(--primary)]/30">/</li>
              <li><Link to="/shop" className="hover:text-[var(--accent)] transition-colors">Shop</Link></li>
              <li className="text-[var(--primary)]/30">/</li>
              <li><Link to={`/shop/${product.category}`} className="hover:text-[var(--accent)] transition-colors">{categoryLabels[product.category] || product.category}</Link></li>
              <li className="text-[var(--primary)]/30">/</li>
              <li className="text-[var(--primary)] truncate max-w-[200px]" aria-current="page">{product.name}</li>
            </ol>
          </nav>

          {/* Prominent Exit Page control — easy to understand, not just a small X */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--secondary)]/30 px-5 py-3 text-sm font-semibold text-[var(--primary)]/75 transition-all duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/5"
            >
              <ArrowLeft size={16} strokeWidth={1.5} className="rotate-180" />
              Exit Page
            </Link>
            <Link
              to="/shop"
              className="md:hidden inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] underline"
              aria-label="Back to shop listing"
            >
              <ArrowLeft size={12} strokeWidth={2} className="rotate-180" />
              Back to Shop
            </Link>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="rounded-3xl overflow-hidden bg-white min-h-[400px] flex items-center justify-center">
              {images.length > 0 ? (
                <img
                  src={getOptimizedUrl(currentImage, { width: 1400 })}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-auto max-h-[70vh] object-contain object-position-center"
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[var(--primary)]/30">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
              )}
            </div>

              {images.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => { setCurrentImageIndex(index); reset() }}
                      className={`flex-shrink-0 h-20 w-24 md:h-24 md:w-28 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        index === currentImageIndex ? 'border-[var(--accent)] shadow-[0_0_0_2px_rgba(232,154,67,0.3)]' : 'border-transparent hover:border-[var(--accent)]/40'
                      }`}>
                      <OptimizedImage
                        src={img}
                        alt={`${product.name} - Thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                        width={150}
                        height={112}
                        priority={false}
                      />
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => { setLightboxOpen(true); reset() }}
                className="absolute bottom-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm text-[var(--primary)] shadow-lg hover:bg-white transition-colors"
                aria-label="Open fullscreen gallery"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </button>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-8">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">{categoryLabels[product.category] || product.category}</p>
                  <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium text-[var(--primary)] leading-tight">{product.name}</h1>
                  {product.sku && <p className="mt-2 text-sm text-[var(--primary)]/50">SKU: {product.sku}</p>}
                </div>

                <div className="border-t border-b border-[var(--border)]/40 py-6">
                  <p className="text-3xl md:text-4xl font-semibold text-[var(--primary)]">{formatPrice(currentPrice)}</p>
                  {currentPrice < (product.price || 0) && product.price && (
                    <p className="mt-1 text-lg text-[var(--primary)]/40 line-through">{formatPrice(product.price)}</p>
                  )}
                </div>

                {product.description && (
                  <div className="prose prose-lg max-w-none text-[var(--primary)]/70">
                    <p className="leading-relaxed">{product.description}</p>
                  </div>
                )}

                {product.variants && product.variants.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Select Variant</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.variants.map((variant) => {
                        const isSelected =
                          selectedVariant?._id === variant._id ||
                          selectedVariant?.id === variant.id ||
                          (!selectedVariant && product.variants[0]?.id === variant.id)
                        const label = variant.color || variant.name || 'Default'
                        return (
                          <button
                            key={variant._id || variant.id}
                            onClick={() => { setSelectedVariant(variant); reset() }}
                            aria-pressed={isSelected}
                            aria-label={label}
                            className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border transition-all duration-300 ${
                              isSelected
                                ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_0_2px_rgba(232,154,67,0.2)]'
                                : 'border-[var(--border)] bg-white hover:border-[var(--accent)]/60'
                            }`}
                          >
                            {variant.image ? (
                              <img
                                src={getOptimizedUrl(variant.image, { width: 400 })}
                                alt={label}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full" style={{ backgroundColor: variant.colorHex || '#cbd5e1' }} />
                            )}
                            {isSelected && (
                              <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-sm">
                                <CheckCircle size={14} strokeWidth={2} />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Quantity</h3>
                  <div className="flex items-center rounded-full border border-[var(--border)]/40 bg-white overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="flex h-12 w-12 items-center justify-center text-[var(--primary)]/50 transition hover:text-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={18} strokeWidth={1.5} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={maxQuantity}
                      value={quantity}
                      onChange={handleQuantityChange}
                      onBlur={(event) => {
                        const nextValue = Number.parseInt(event.target.value, 10)
                        if (Number.isNaN(nextValue)) {
                          setQuantity(1)
                          return
                        }
                        setQuantity(Math.min(maxQuantity, Math.max(1, nextValue)))
                      }}
                      aria-label="Quantity"
                      className="min-w-[60px] w-[72px] border-0 bg-transparent px-2 text-center text-lg font-medium text-[var(--primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                      disabled={quantity >= maxQuantity}
                      className="flex h-12 w-12 items-center justify-center text-[var(--primary)]/50 transition hover:text-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <Plus size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={handleBuyNow}
                    disabled={addingToCart}
                    className="px-6 py-4 rounded-full bg-[var(--primary)] text-white text-xs font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {addingToCart ? 'Adding...' : 'Buy Now'}
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="flex-1 btn-luxury-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {addingToCart ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Adding...
                      </>
                    ) : isInCart ? (
                      <>
                        <CheckCircle size={18} strokeWidth={2} />
                        In Cart
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={18} strokeWidth={1.5} />
                        Add to Cart
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleAddToWishlist}
                    className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-300 ${isInWishlist ? 'bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/20' : 'bg-white border border-[var(--border)] text-[var(--primary)]/60 hover:border-[var(--accent)] hover:text-[var(--accent)]'}`}
                    aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart size={16} strokeWidth={isInWishlist ? 0 : 1.5} className={isInWishlist ? 'fill-current' : ''} />
                    {isInWishlist ? 'Saved' : 'Save'}
                  </button>
                </div>

                {product.features && product.features.length > 0 && (
                  <div className="pt-6 border-t border-[var(--border)]/40">
                    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Features</h3>
                    <ul className="space-y-3">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-[var(--primary)]/70">
                          <svg className="flex-shrink-0 mt-1 h-5 w-5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.dimensions && (
                  <div className="pt-6 border-t border-[var(--border)]/40">
                    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Dimensions</h3>
                    <p className="text-[var(--primary)]/70">{product.dimensions}</p>
                  </div>
                )}

                {product.materials && (
                  <div className="pt-6 border-t border-[var(--border)]/40">
                    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Materials</h3>
                    <p className="text-[var(--primary)]/70">{product.materials}</p>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fullscreen Lightbox */}
        <AnimatePresence>
          {lightboxOpen && images.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[var(--primary)]/95 backdrop-blur-sm flex items-center justify-center"
              onClick={() => setLightboxOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Fullscreen gallery"
            >
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Close gallery"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((i) => (i - 1 + images.length) % images.length); reset() }}
                className="absolute left-6 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors hidden md:block"
                aria-label="Previous image"
              >
                <ChevronLeft size={28} strokeWidth={1.5} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((i) => (i + 1) % images.length); reset() }}
                className="absolute right-6 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors hidden md:block"
                aria-label="Next image"
              >
                <ChevronRight size={28} strokeWidth={1.5} />
              </button>

              <div
                style={zoomStyle}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={(e) => { try { if (scale > 1) e.preventDefault() } catch { /* noop */ }; handleTouchMove(e) }}
                onTouchEnd={handleTouchEnd}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                className="relative max-h-[90vh] max-w-[90vw]"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={getOptimizedUrl(images[currentImageIndex], { width: 2560, crop: 'limit' })}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    className="max-h-[90vh] max-w-[90vw] object-contain"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </AnimatePresence>
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); reset() }}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile sticky purchase bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[var(--border)]/40 pb-[env(safe-area-inset-bottom)]">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={handleAddToCartClick}
              disabled={addingToCart}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--primary)] transition-all duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
            >
              {addingToCart ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : isInCart ? (
                <>
                  <CheckCircle size={16} strokeWidth={2} />
                  In Cart
                </>
              ) : (
                <>
                  <ShoppingBag size={16} strokeWidth={1.5} />
                  Add to Cart
                </>
              )}
            </button>
            <button
              onClick={handleBuyNowClick}
              disabled={addingToCart}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-[var(--primary)]/90 disabled:opacity-50"
            >
              {addingToCart ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        </div>

        {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <section className="px-6 md:px-12 lg:px-20 py-16 md:py-24 bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5">
          <div className="container-wide">
            <div className="mb-16 md:mb-24 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">You May Also Like</p>
              <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
                Related Products
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
              {product.relatedProducts.slice(0, 4).map((related, index) => (
                <motion.div
                  key={related._id || related.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="group"
                >
                  <Link to={`/shop/${related._id || related.id}`} className="block">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[var(--secondary)]/30">
                      {related.images?.[0] ? (
                        <OptimizedImage
                          src={typeof related.images[0] === 'string' ? related.images[0] : related.images[0]?.url}
                          alt={related.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          width={600}
                          height={450}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[var(--primary)]/30">
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-2xs font-medium uppercase tracking-widest text-[var(--accent)] mb-1">{categoryLabels[related.category] || related.category}</p>
                      <h3 className="font-display text-lg font-medium text-[var(--primary)] leading-tight group-hover:text-[var(--accent)] transition-colors mb-2">
                        {related.name}
                      </h3>
                      <p className="text-lg font-semibold text-[var(--primary)]">{formatPrice(related.discountPrice || related.price || 0)}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default ProductDetailPage