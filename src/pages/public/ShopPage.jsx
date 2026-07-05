import { BedDouble, BriefcaseBusiness, Building2, Lamp, Sparkles, Sofa, TreePalm, UtensilsCrossed, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
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
    const rate = CURRENCIES.find(c => c.code === currency)?.symbol === 'KSh' ? 129 : 
                 CURRENCIES.find(c => c.code === currency)?.symbol === '€' ? 0.92 : 1
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
      <div className="section-pad bg-linen pb-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="eyebrow mb-4">Curated Collection</p>
            <h1 className="font-display text-6xl font-medium leading-tight text-ink md:text-7xl">Shop</h1>
          </motion.div>
        </div>
      </div>

      <div className="border-b border-sand bg-white">
        <div className="container-wide overflow-x-auto px-6 md:px-12 lg:px-20">
          <div className="flex items-center gap-2 py-4 min-w-max">
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

      <div className="sticky top-[88px] z-30 border-b border-sand bg-cream/95 backdrop-blur-sm md:top-[108px]">
        <div className="container-wide px-6 py-4 md:px-12 lg:px-20">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="relative flex-1 max-w-md w-full">
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

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col lg:flex-row gap-4 pt-4 overflow-hidden"
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

      <div className="section-pad bg-cream pt-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          {loading && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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