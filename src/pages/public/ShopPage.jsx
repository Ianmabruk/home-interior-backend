import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '@services/api'
import { getOptimizedUrl, buildSrcSet } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { clearApiCache } from '@services/api'
import { PageMeta } from '@hooks/usePageMeta'
import { useCurrency } from '@context/CurrencyContext'
import { useIsMobile } from '@hooks/useIsMobile'

const SITE_URL = 'https://hokinteriors.com'

const SkeletonShop = () => (
  <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Shop</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          Shop Collection
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="group flex flex-col">
            <div className="rounded-2xl overflow-hidden bg-[var(--secondary)]/30 skeleton aspect-[4/3] mb-4" />
            <div className="skeleton h-5 w-3/4 mb-2" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  </section>
)

const ALLOWED_CATEGORIES = ['Wall Artwork', 'Mirrors', 'Throw Pillows']

export const ShopPage = memo(({ category }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState(category || 'all')
  const { formatPrice } = useCurrency()
  const reduceMotion = useIsMobile()

  const loadProducts = useCallback(async (signal) => {
    setError(null)
    try {
      const params = filter !== 'all' ? { category: filter } : {}
      const res = await api.get('/products', { params, signal })
      setProducts(res.data || [])
    } catch (err) {
      if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
        console.warn('[SHOP] Failed to load:', err?.message)
        setError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [filter])

  const retry = useCallback(() => {
    setLoading(true)
    const controller = new AbortController()
    loadProducts(controller.signal)
  }, [loadProducts])

  useEffect(() => {
    const controller = new AbortController()
    loadProducts(controller.signal)
    return () => controller.abort()
  }, [loadProducts])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'products-changed') {
        clearApiCache('/products')
        loadProducts()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadProducts])

  useEffect(() => {
    const handleOnline = () => {
      if (error) retry()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [error, retry])

  const categories = useMemo(() => {
    const present = new Set(products.map((p) => p.category).filter(Boolean))
    return ['all', ...ALLOWED_CATEGORIES.filter((c) => present.has(c))]
  }, [products])

  const displayProducts = useMemo(() => {
    if (filter === 'all') return products.filter((p) => ALLOWED_CATEGORIES.includes(p.category))
    return products.filter((p) => p.category === filter)
  }, [products, filter])

  useEffect(() => {
    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'HOK Interiors Shop Collection',
      description: 'Timeless furniture and decor pieces curated for luxury living.',
      url: `${SITE_URL}/shop`,
      itemListElement: displayProducts.slice(0, 12).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/shop/${product._id || product.id}`,
        name: product.name,
        image: product.images?.[0] || '',
        offers: {
          '@type': 'Offer',
          price: product.discountPrice || product.price || 0,
          priceCurrency: 'KES',
          availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
      })),
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(productSchema)
    script.setAttribute('data-structured-data', 'shop-products')
    document.head.appendChild(script)

    const existing = document.querySelector('script[data-structured-data="shop-products"]')
    if (existing && existing !== script) existing.remove()

    return () => {
      const el = document.querySelector('script[data-structured-data="shop-products"]')
      if (el) el.remove()
    }
  }, [displayProducts])

  if (loading) {
    return <main><SkeletonShop /></main>
  }

  if (error && products.length === 0) {
    return (
      <main>
        <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide text-center">
            <p className="text-[var(--primary)]/60 mb-4">Unable to load products. Please check your connection.</p>
            <button onClick={retry} className="btn-luxury-primary">Retry</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main>
      <PageMeta
        title="Shop Collection — HOK Interior Designs"
        description="Discover timeless furniture and decor pieces curated for luxury living."
      />
      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-12 md:py-16">
        <div className="container-wide">
          <div className="flex flex-wrap items-center gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium uppercase tracking-wide transition-all duration-300 ${
                  filter === cat
                    ? 'bg-[var(--primary)] text-white shadow-[0_4px_16px_rgba(42,36,31,0.2)]'
                    : 'bg-white border border-[var(--border)] text-[var(--primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                }`}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {displayProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--primary)]/30">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
              <h3 className="font-display text-2xl md:text-3xl text-[var(--primary)] mb-2">No products found</h3>
              <p className="text-[var(--primary)]/60 max-w-md">Try selecting a different category to browse our collection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
              {displayProducts.map((product, index) => (
                <motion.article
                  key={product._id || product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500 hover:-translate-y-2"
                >
                  <Link to={`/shop/${product._id || product.id}`} className="block w-full">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[var(--secondary)]/30">
                      {product.images?.[0] ? (
                        <img
                          src={getOptimizedUrl(typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url, { width: 600, crop: 'limit' })}
                          srcSet={buildSrcSet(typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url) || undefined}
                          sizes={buildSrcSet(typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url) ? '(max-width: 1280px) 50vw, (max-width: 1024px) 33vw, 25vw' : undefined}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                          fetchPriority={index === 0 ? 'high' : undefined}
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
                    <div className="p-6">
                      <p className="text-2xs font-medium uppercase tracking-widest text-[var(--accent)] mb-1">{product.category}</p>
                      <h3 className="font-display text-lg font-medium text-[var(--primary)] leading-tight mb-2 group-hover:text-[var(--accent)] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-lg font-semibold text-[var(--primary)] mb-4">
                        {formatPrice(product.discountPrice || product.price || 0)}
                      </p>
                      <button className="w-full rounded-full border border-[var(--border)] bg-white px-6 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)] transition-all duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-[0_4px_16px_rgba(232,154,67,0.15)]">
                        View Product
                      </button>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* INTERNAL LINKS */}
      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-12">
        <div className="container-wide text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/portfolio" className="btn-luxury-secondary">View Portfolio</Link>
            <Link to="/contact" className="btn-luxury-primary">Design Consultation</Link>
          </div>
        </div>
      </section>
    </main>
  )
})

ShopPage.displayName = 'ShopPage'

export default ShopPage
