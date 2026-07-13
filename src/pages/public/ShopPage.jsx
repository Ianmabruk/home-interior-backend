import { BedDouble, BriefcaseBusiness, Building2, Lamp, Sparkles, Sofa, TreePalm, UtensilsCrossed, SlidersHorizontal, X, ChevronDown, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { ProductCard } from '../../components/shop/ProductCard'
import { api } from '../../services/api'
import { SHOP_CATEGORIES, CURRENCIES } from '../../utils/constants'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'

const categoryIcons = {
  'Living Room': Sofa,
  Kitchen: UtensilsCrossed,
  Bedroom: BedDouble,
  Dining: UtensilsCrossed,
  Outdoor: TreePalm,
  Commercial: Building2,
  Decor: Sparkles,
  Lighting: Lamp,
  Office: BriefcaseBusiness,
  'Custom Designs': Sparkles,
}

export const ShopPage = () => {
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

  const [currency, setCurrency] = useState('USD')
  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency)
    localStorage.setItem('hok_currency', newCurrency)
  }

  const loadProducts = () => {
    api.get('/products', { params: { sort: '-createdAt', limit: 100 } })
      .then((res) => setAllProducts(res.data.items || []))
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProducts() }, [])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'products-changed') loadProducts()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [])

  const products = useMemo(() => {
    let next = [...allProducts]
    if (query) {
      const q = query.toLowerCase()
      next = next.filter((item) => [item.name, item.description, item.category, item.sku].join(' ').toLowerCase().includes(q))
    }
    if (category) next = next.filter((item) => item.category === category)

    const rate = currency === 'KES' ? 129 : currency === 'EUR' ? 0.92 : 1
    if (minPrice) next = next.filter((item) => (item.discountPrice || item.price) * rate >= Number(minPrice))
    if (maxPrice) next = next.filter((item) => (item.discountPrice || item.price) * rate <= Number(maxPrice))

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
  }, [allProducts, category, query, minPrice, maxPrice, sortBy, currency])

  const hasFilters = category || query || minPrice || maxPrice
  const clearFilters = () => { setCategory(''); setQuery(''); setMinPrice(''); setMaxPrice('') }

  return (
    <div>
      {/* Compact sticky header — single bar on mobile */}
      <div className="sticky top-0 z-30 border-b border-sand bg-white md:top-[88px]">
        <div className="px-4 py-3 md:px-12 md:py-4">
          {/* Mobile: search + menu button in one row */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-full border border-sand bg-gray-50 pl-9 pr-3 py-2 text-sm outline-none placeholder:text-ink/35 focus:border-orange focus:ring-2 focus:ring-orange/30 transition"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="flex items-center gap-1 rounded-full border border-sand bg-white px-3 py-2 text-2xs font-medium uppercase tracking-widest text-ink/70"
            >
              <Menu size={14} strokeWidth={1.5} />
              {hasFilters ? 'Filters' : 'Menu'}
            </button>
          </div>

          {/* Desktop: full search + controls */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-full border border-sand bg-white pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-ink/35 focus:border-orange focus:ring-2 focus:ring-orange/30 transition"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="relative">
                <button
                  onClick={() => setCurrencyOpen((p) => !p)}
                  className="flex items-center gap-2 rounded-full border border-sand bg-white px-4 py-2 text-2xs font-medium uppercase tracking-widest text-ink/70 hover:border-orange hover:text-ink transition"
                >
                  {currency} <ChevronDown size={12} strokeWidth={2} className={`transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {currencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute right-0 mt-2 w-36 border border-sand bg-white rounded-xl shadow-lg z-10"
                    >
                      {CURRENCIES.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => { changeCurrency(c.code); setCurrencyOpen(false) }}
                          className={`w-full px-4 py-2 text-left text-xs font-medium uppercase tracking-widest transition ${
                            currency === c.code ? 'text-orange' : 'text-ink hover:bg-linen'
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
                className="rounded-full border border-sand bg-white px-4 py-2 text-2xs font-medium uppercase tracking-widest text-ink/70 focus:outline-none focus:ring-2 focus:ring-orange/30"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>

              <button
                onClick={() => setFiltersOpen((p) => !p)}
                className="flex items-center gap-2 rounded-full border border-sand bg-white px-4 py-2 text-2xs font-medium uppercase tracking-widest text-ink/50 transition hover:border-orange hover:text-orange"
              >
                <SlidersHorizontal size={13} strokeWidth={1.5} />
                Filters
              </button>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-widest text-ink/40 transition hover:text-orange"
                >
                  <X size={12} strokeWidth={1.5} /> Clear
                </button>
              )}

              <span className="text-2xs text-ink/50">{products.length} items</span>
            </div>
          </div>

          {/* Desktop category bar */}
          <div className="hidden md:block overflow-x-auto mt-4">
            <div className="flex items-center gap-2 min-w-max">
              <button
                onClick={() => setCategory('')}
                className={`px-5 py-2 text-2xs font-medium uppercase tracking-widest transition rounded-full ${
                  !category ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink bg-cream border border-sand'
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
                    className={`flex items-center gap-1.5 px-5 py-2 text-2xs font-medium uppercase tracking-widest transition rounded-full ${
                      category === cat ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink bg-cream border border-sand'
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

      {/* Mobile filters modal */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between border-b border-sand p-4">
                <p className="font-display text-lg text-ink">Filters & Categories</p>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-ink/50 hover:text-ink">
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Categories */}
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-ink/50 mb-3">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setCategory(''); setMobileMenuOpen(false) }}
                      className={`px-4 py-2 text-2xs font-medium uppercase tracking-widest transition rounded-full ${
                        !category ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink bg-cream border border-sand'
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
                          className={`flex items-center gap-1.5 px-4 py-2 text-2xs font-medium uppercase tracking-widest transition rounded-full ${
                            category === cat ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink bg-cream border border-sand'
                          }`}
                        >
                          <Icon size={12} strokeWidth={1.5} />
                          {cat}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-ink/50 mb-3">Currency</p>
                  <div className="flex flex-wrap gap-2">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => { changeCurrency(c.code); setCurrencyOpen(false) }}
                        className={`px-4 py-2 text-2xs font-medium uppercase tracking-widest transition rounded-full ${
                          currency === c.code ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink bg-cream border border-sand'
                        }`}
                      >
                        {c.code} ({c.symbol})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-ink/50 mb-3">Sort By</p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full rounded-full border border-sand bg-white px-4 py-3 text-sm outline-none focus:border-orange focus:ring-2 focus:ring-orange/30 transition"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>

                {/* Price filters */}
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-ink/50 mb-3">Price Range</p>
                  <div className="flex gap-3">
                    <input
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      type="number"
                      className="flex-1 rounded-full border border-sand bg-white px-4 py-3 text-sm outline-none placeholder:text-ink/35 focus:border-orange focus:ring-2 focus:ring-orange/30 transition"
                    />
                    <input
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      type="number"
                      className="flex-1 rounded-full border border-sand bg-white px-4 py-3 text-sm outline-none placeholder:text-ink/35 focus:border-orange focus:ring-2 focus:ring-orange/30 transition"
                    />
                  </div>
                </div>

                {hasFilters && (
                  <button
                    onClick={() => { clearFilters(); setMobileMenuOpen(false) }}
                    className="w-full rounded-full border border-sand bg-white py-3 text-2xs font-medium uppercase tracking-widest text-ink/50 hover:text-orange transition"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop filters expandable section */}
      <div className="hidden md:block border-b border-sand bg-white">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col lg:flex-row gap-4 py-4 overflow-hidden"
              >
                <div className="flex-1">
                  <label className="label">Min Price ({currency})</label>
                  <input
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    type="number"
                    className="w-full rounded-full border border-sand bg-white px-4 py-2 text-sm outline-none placeholder:text-ink/35 focus:border-orange focus:ring-2 focus:ring-orange/30 transition"
                  />
                </div>
                <div className="flex-1">
                  <label className="label">Max Price ({currency})</label>
                  <input
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Any"
                    type="number"
                    className="w-full rounded-full border border-sand bg-white px-4 py-2 text-sm outline-none placeholder:text-ink/35 focus:border-orange focus:ring-2 focus:ring-orange/30 transition"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Product grid */}
      <div className="section-pad bg-cream pt-6 md:pt-12">
        <div className="container-wide px-4 md:px-12 lg:px-20">
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i}>
                  <div className="skeleton aspect-[3/4] w-full rounded-2xl" />
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
            <div className="py-24 text-center">
              <p className="font-display text-3xl text-ink/30">No products found</p>
              <p className="mt-2 text-sm text-ink/35">Try adjusting your filters</p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-6 btn-outline">Clear Filters</button>
              )}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.4) }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
