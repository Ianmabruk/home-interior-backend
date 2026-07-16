import { Square, PictureInPicture, Armchair, Sparkles, SlidersHorizontal, X, ChevronDown, Menu, Search, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { ProductCard } from '../../components/shop/ProductCard'
import { api } from '../../services/api'
import { SHOP_CATEGORIES, CURRENCIES } from '../../utils/constants'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import { useCurrency } from '../../context/CurrencyContext'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const categoryIcons = {
  Mirrors: Square,
  Frames: PictureInPicture,
  'Throw Pillows': Armchair,
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export const ShopPage = () => {
  const { currency, changeCurrency, formatPrice } = useCurrency()
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [query, setQuery] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const loadProducts = useCallback(() => {
    api.get('/products', { params: { sort: '-createdAt', limit: 100 } })
      .then((res) => setAllProducts(res.data.items || []))
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'products-changed') loadProducts()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadProducts])

  const products = useMemo(() => {
    let next = [...allProducts]
    if (query) {
      const q = query.toLowerCase()
      next = next.filter((item) => [item.name, item.description, item.category, item.sku].join(' ').toLowerCase().includes(q))
    }
    if (category) next = next.filter((item) => item.category === category)

    if (minPrice) next = next.filter((item) => formatPrice(item.discountPrice || item.price) >= Number(minPrice))
    if (maxPrice) next = next.filter((item) => formatPrice(item.discountPrice || item.price) <= Number(maxPrice))

    switch (sortBy) {
      case 'price-low':
        next.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price))
        break
      case 'price-high':
        next.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price))
        break
      case 'name':
        next.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    return next
  }, [allProducts, category, query, minPrice, maxPrice, sortBy, formatPrice])

  const hasFilters = category || query || minPrice || maxPrice
  const clearFilters = useCallback(() => { setCategory(''); setQuery(''); setMinPrice(''); setMaxPrice('') }, [])

  const heroImage = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2000&q=80'

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Page Header with Luxury Interior Background */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={getOptimizedUrl(heroImage, { width: 2000, crop: 'limit' })}
            alt="Luxury interior with beige sofa, brown furniture, warm lighting"
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/65 via-[var(--primary)]/75 to-transparent" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.15),transparent_50%)]" />
        <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--bg)]/80 mb-4">Curated Collection</p>
            <h1 className="font-display text-5xl font-normal leading-tight text-white md:text-7xl lg:text-8xl">
              Shop
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/60 leading-relaxed">
              Handpicked luxury pieces to elevate your interior spaces with timeless elegance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sticky Premium Header - Filters only, no permanent search */}
      <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl shadow-sm md:top-[72px]">
        <div className="container-wide px-4 py-3 md:px-12 md:py-4">
          {/* Mobile Row */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-2.5 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70"
            >
              <Filter size={14} strokeWidth={1.5} />
              {hasFilters ? 'Filters' : 'Menu'}
            </button>
          </div>

          {/* Desktop Controls - Filter/Category/Sort/Currency only */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-3 ml-auto">
              <div className="relative">
                <button
                  onClick={() => setCurrencyOpen((p) => !p)}
                  className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 hover:border-[var(--accent)] transition"
                >
                  {currency} <ChevronDown size={12} strokeWidth={2} className={`transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {currencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute right-0 mt-2 w-40 border border-[var(--border)] bg-white rounded-2xl shadow-[0_20px_40px_rgba(42,36,31,0.15)] z-10 overflow-hidden"
                    >
                      {CURRENCIES.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => { changeCurrency(c.code); setCurrencyOpen(false) }}
                          className={`w-full px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest transition ${
                            currency === c.code ? 'bg-[var(--bg)] text-[var(--accent)]' : 'text-[var(--primary)] hover:bg-[var(--bg)]/50'
                          }`}
                        >
                          {c.code} ({c.symbol})
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>

              <button
                onClick={() => setFiltersOpen((p) => !p)}
                className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/60 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <SlidersHorizontal size={13} strokeWidth={1.5} />
                Filters
              </button>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/40 transition hover:text-[var(--accent)]"
                >
                  <X size={12} strokeWidth={1.5} /> Clear
                </button>
              )}

              <span className="text-2xs text-[var(--primary)]/40 font-medium">{products.length} items</span>
            </div>
          </div>

          {/* Desktop Category Bar */}
          <div className="hidden md:block overflow-x-auto mt-4">
            <div className="flex items-center gap-2 min-w-max">
              <button
                onClick={() => setCategory('')}
                className={`px-5 py-2 text-2xs font-semibold uppercase tracking-widest transition rounded-full ${
                  !category ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--primary)]/50 hover:text-[var(--primary)] bg-[var(--bg)] border border-[var(--border)]'
                }`}
              >
                All
              </button>
              {SHOP_CATEGORIES.map((cat) => {
                const Icon = categoryIcons[cat] || Sparkles
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat === category ? '' : cat)}
                    className={`flex items-center gap-1.5 px-5 py-2 text-2xs font-semibold uppercase tracking-widest transition rounded-full ${
                      category === cat ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--primary)]/50 hover:text-[var(--primary)] bg-[var(--bg)] border border-[var(--border)]'
                    }`}
                  >
                    <Icon size={12} strokeWidth={1.5} />
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Expandable Filters */}
      <div className="hidden md:block border-b border-[var(--border)] bg-[var(--bg)]/50">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col lg:flex-row gap-6 py-6 overflow-hidden"
              >
                <div className="flex-1 max-w-xs">
                  <label className="block text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-2">Min Price ({CURRENCIES.find(c => c.code === currency)?.symbol || currency})</label>
                  <input
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    type="number"
                    className="w-full rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                  />
                </div>
                <div className="flex-1 max-w-xs">
                  <label className="block text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-2">Max Price ({CURRENCIES.find(c => c.code === currency)?.symbol || currency})</label>
                  <input
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Any"
                    type="number"
                    className="w-full rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Filters Bottom Sheet */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[var(--primary)]/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
                <p className="font-display text-xl text-[var(--primary)]">Filters & Categories</p>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[var(--primary)]/50 hover:text-[var(--primary)] transition">
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              <div className="p-5 space-y-6">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-3">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setCategory(''); setMobileMenuOpen(false) }}
                      className={`px-4 py-2 text-2xs font-semibold uppercase tracking-widest transition rounded-full ${
                        !category ? 'bg-[var(--primary)] text-white' : 'text-[var(--primary)]/50 hover:text-[var(--primary)] bg-[var(--bg)] border border-[var(--border)]'
                      }`}
                    >
                      All
                    </button>
                    {SHOP_CATEGORIES.map((cat) => {
                      const Icon = categoryIcons[cat] || Sparkles
                      return (
                        <button
                          key={cat}
                          onClick={() => { setCategory(cat === category ? '' : cat); setMobileMenuOpen(false) }}
                          className={`flex items-center gap-1.5 px-4 py-2 text-2xs font-semibold uppercase tracking-widest transition rounded-full ${
                            category === cat ? 'bg-[var(--primary)] text-white' : 'text-[var(--primary)]/50 hover:text-[var(--primary)] bg-[var(--bg)] border border-[var(--border)]'
                          }`}
                        >
                          <Icon size={12} strokeWidth={1.5} />
                          {cat}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-3">Currency</p>
                  <div className="flex flex-wrap gap-2">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => { changeCurrency(c.code); setCurrencyOpen(false) }}
                        className={`px-4 py-2 text-2xs font-semibold uppercase tracking-widest transition rounded-full ${
                          currency === c.code ? 'bg-[var(--primary)] text-white' : 'text-[var(--primary)]/50 hover:text-[var(--primary)] bg-[var(--bg)] border border-[var(--border)]'
                        }`}
                      >
                        {c.code} ({c.symbol})
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-3">Sort By</p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>

                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-3">Price Range</p>
                  <div className="flex gap-3">
                    <input
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      type="number"
                      className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] transition"
                    />
                    <input
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      type="number"
                      className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] transition"
                    />
                  </div>
                </div>

                {hasFilters && (
                  <button
                    onClick={() => { clearFilters(); setMobileMenuOpen(false) }}
                    className="w-full rounded-full border border-[var(--border)] bg-white py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 hover:text-[var(--accent)] hover:border-[var(--accent)] transition"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Grid */}
      <section className="section-pad bg-[var(--bg)] pt-8 md:pt-12">
        <div className="container-wide px-4 md:px-12 lg:px-20">
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i}>
                  <div className="skeleton aspect-[3/4] w-full rounded-3xl" />
                  <div className="mt-4 space-y-2">
                    <div className="skeleton h-3 w-20" />
                    <div className="skeleton h-5 w-40" />
                    <div className="skeleton h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && products.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-24 text-center">
              <Sparkles size={48} strokeWidth={1} className="mx-auto text-[var(--secondary)] mb-4" />
              <p className="font-display text-3xl text-[var(--primary)]/30">
                {allProducts.length === 0 ? 'No products yet.' : 'No products found'}
              </p>
              <p className="mt-2 text-sm text-[var(--primary)]/35">Try adjusting your filters</p>
              {hasFilters && (
                <button onClick={clearFilters} className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 text-2xs font-semibold uppercase tracking-widest border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] rounded-full transition">
                  <X size={12} strokeWidth={1.5} /> Clear Filters
                </button>
              )}
            </motion.div>
          )}

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, i) => (
              <motion.div key={product._id} variants={fadeUp} custom={i}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}