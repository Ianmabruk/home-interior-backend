import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { X, ArrowRight, GitCompare, Search, Grid3X3 } from 'lucide-react'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import PositionedImage from '../../components/common/PositionedImage'

const PAGE_SIZE = 12

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] } }),
}

export const PortfolioPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [beforeAfterView, setBeforeAfterView] = useState(false)

  const loadPortfolio = () => {
    api.get('/content/portfolio')
      .then((res) => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPortfolio() }, [])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'portfolio-changed') loadPortfolio()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [])

  useEffect(() => {
    if (selected) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean))
    return Array.from(set).sort()
  }, [items])

  const filtered = useMemo(() => {
    let next = [...items]
    if (query) {
      const q = query.toLowerCase()
      next = next.filter((i) => i.title?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q))
    }
    if (category) next = next.filter((i) => i.category === category)
    return next
  }, [items, query, category])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleBeforeAfter = useCallback(() => setBeforeAfterView((v) => !v), [])

  return (
    <div className="min-h-screen bg-primary-bg">
      {/* Page Header */}
      <div className="relative section-pad bg-dark-luxury overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(198,155,109,0.12),transparent_50%)]" />
        <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <p className="eyebrow mb-4 text-champagne/70">Our Work</p>
            <h1 className="font-display text-5xl font-medium leading-tight text-white md:text-7xl lg:text-8xl">
              Portfolio
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/50 leading-relaxed">
              A curated selection of premium interiors crafted by HOK Interior Designs. Each project tells a unique story of luxury and refinement.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Sticky Filter Bar with Glassmorphism */}
      <div className="sticky top-[88px] z-30 border-b border-champagne/20 bg-white/70 backdrop-blur-xl shadow-sm md:top-[108px]">
        <div className="container-wide px-6 py-4 md:px-12 lg:px-20">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                placeholder="Search portfolio..."
                className="w-full rounded-full border border-champagne/40 bg-white/80 pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-ink/35 focus:border-warm-gold focus:ring-2 focus:ring-warm-gold/20 transition"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setCategory(''); setPage(1) }}
                className={`px-4 py-2 text-2xs font-medium uppercase tracking-widest transition rounded-full ${
                  !category ? 'bg-dark-luxury text-white shadow-md' : 'bg-white text-ink/60 hover:bg-linen border border-champagne/40'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setPage(1) }}
                  className={`px-4 py-2 text-2xs font-medium uppercase tracking-widest transition rounded-full ${
                    category === cat ? 'bg-dark-luxury text-white shadow-md' : 'bg-white text-ink/60 hover:bg-linen border border-champagne/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <span className="hidden lg:block text-2xs text-ink/40 ml-auto">{filtered.length} projects</span>
          </div>
        </div>
      </div>

      {/* Masonry Grid */}
      <section className="section-pad bg-primary-bg pt-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          {loading && (
            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`skeleton mb-5 break-inside-avoid rounded-2xl ${i % 3 === 0 ? 'h-96' : i % 2 === 0 ? 'h-72' : 'h-80'}`} />
              ))}
            </div>
          )}

          {!loading && paginated.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-24 text-center">
              <Grid3X3 size={48} strokeWidth={1} className="mx-auto text-champagne mb-4" />
              <p className="font-display text-3xl text-ink/30">No projects found</p>
              <p className="mt-2 text-sm text-ink/35">Try adjusting your search or filters</p>
              <button onClick={() => { setQuery(''); setCategory(''); setPage(1) }} className="btn-outline border-warm-gold text-warm-gold mt-6 hover:bg-warm-gold hover:text-white hover:border-warm-gold">
                Clear Filters
              </button>
            </motion.div>
          )}

          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {paginated.map((item, index) => (
              <motion.figure
                key={item._id}
                onClick={() => { setSelected(item); setBeforeAfterView(false) }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: index * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="group mb-5 break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-card hover:shadow-lift transition-all duration-500 cursor-pointer"
              >
                <div className="relative overflow-hidden">
                  <PositionedImage
                    src={item.imageUrl}
                    alt={item.title}
                    settings={item.mediaSettings}
                    className="w-full transition duration-700 group-hover:scale-105"
                    loading="lazy"
                    sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-luxury/70 via-dark-luxury/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  {item.beforeAfterImages?.length > 0 && (
                    <span className="absolute left-3 top-3 bg-warm-gold px-3 py-1 text-2xs font-semibold uppercase tracking-widest text-white rounded-full shadow-lg">
                      Before/After
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-end p-5 opacity-0 transition-opacity duration-400 group-hover:opacity-100">
                    <div>
                      <p className="font-display text-2xl font-medium text-white">{item.title}</p>
                      {item.category && <p className="text-2xs font-medium uppercase tracking-widest text-champagne/80 mt-1">{item.category}</p>}
                    </div>
                  </div>
                </div>
              </motion.figure>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-full border border-champagne/40 px-5 py-2.5 text-2xs font-medium uppercase tracking-widest text-ink/50 transition hover:border-warm-gold hover:text-warm-gold disabled:opacity-30"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-10 w-10 rounded-full text-2xs font-medium transition ${
                    p === page ? 'bg-dark-luxury text-white shadow-lg' : 'border border-champagne/40 text-ink/50 hover:border-warm-gold hover:text-warm-gold'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-full border border-champagne/40 px-5 py-2.5 text-2xs font-medium uppercase tracking-widest text-ink/50 transition hover:border-warm-gold hover:text-warm-gold disabled:opacity-30"
              >
                Next
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Luxury Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark-luxury/98 p-4 md:p-8 backdrop-blur-sm"
            onClick={() => { setSelected(null); setBeforeAfterView(false) }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-h-[90vh] max-w-6xl w-full overflow-hidden bg-white rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setSelected(null); setBeforeAfterView(false) }}
                className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center bg-white/90 text-ink transition hover:bg-white rounded-full shadow-lg"
                aria-label="Close"
              >
                <X size={18} strokeWidth={1.5} />
              </button>

              {selected.beforeAfterImages?.length > 0 && (
                <button
                  onClick={toggleBeforeAfter}
                  className="absolute left-4 top-4 z-20 flex items-center gap-2 bg-warm-gold text-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest rounded-full shadow-lg hover:bg-warm-gold/90 transition"
                >
                  <GitCompare size={14} strokeWidth={1.5} />
                  {beforeAfterView ? 'View Image' : 'Compare Before/After'}
                </button>
              )}

              <div className="max-h-[75vh] overflow-y-auto">
                {beforeAfterView && selected.beforeAfterImages?.length > 0 ? (
                  <div className="grid gap-6 p-6 md:grid-cols-2">
                    <div className="overflow-hidden rounded-2xl">
                      <p className="text-2xs font-semibold uppercase tracking-widest text-warm-gold mb-3 px-1">Before</p>
                      <img src={selected.beforeAfterImages[0]?.url} alt="Before" className="w-full object-contain rounded-xl bg-linen" />
                    </div>
                    <div className="overflow-hidden rounded-2xl">
                      <p className="text-2xs font-semibold uppercase tracking-widest text-warm-gold mb-3 px-1">After</p>
                      <img src={selected.imageUrl} alt="After" className="w-full object-contain rounded-xl bg-linen" />
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <PositionedImage
                      src={selected.imageUrl}
                      alt={selected.title}
                      settings={selected.mediaSettings}
                      className="max-h-[65vh] w-full"
                      loading="eager"
                    />
                  </div>
                )}

                {selected.beforeAfterImages?.length > 2 && !beforeAfterView && (
                  <div className="px-6 pb-4">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-warm-gold mb-3">Project Gallery</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {selected.beforeAfterImages.map((img, idx) => (
                        <div key={idx} className="overflow-hidden rounded-xl">
                          <img src={img.url} alt={img.label || `View ${idx + 1}`} className="w-full object-cover aspect-[4/3] hover:scale-105 transition duration-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-6 border-t border-champagne/30 bg-linen/50">
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-medium text-ink">{selected.title}</h2>
                  {selected.category && <p className="text-2xs font-semibold uppercase tracking-widest text-warm-gold mt-1">{selected.category}</p>}
                </div>
                <button onClick={() => { setSelected(null); setBeforeAfterView(false) }} className="btn-ghost text-ink/40 hover:text-warm-gold">
                  Close <ArrowRight size={13} strokeWidth={1.5} className="rotate-180" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
