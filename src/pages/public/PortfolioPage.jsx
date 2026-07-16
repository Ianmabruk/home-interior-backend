import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { X, ArrowRight, Grid3X3, Search, ChevronRight } from 'lucide-react'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import PositionedImage from '../../components/common/PositionedImage'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const PAGE_SIZE = 12

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] } }),
}

export const PortfolioPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const sidebarRef = useRef(null)

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
    if (category) next = next.filter((i) => i.category === category)
    return next
  }, [items, category])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  }

  const closeMenus = useCallback(() => {
    setMobileSidebarOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Page Header */}
      <div className="relative section-pad bg-[var(--primary)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.12),transparent_50%)]" aria-hidden="true" />
        <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]/70 mb-4">Our Work</p>
            <h1 className="font-display text-5xl font-normal leading-tight text-white md:text-7xl lg:text-8xl">
              Portfolio
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/50 leading-relaxed">
               A curated selection of premium interiors crafted by HOK INTERIOR DESIGNS. Each project tells a unique story of luxury and refinement.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Portfolio Layout */}
      <section className="section-pad bg-[var(--bg)] pt-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          {loading && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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

          {!loading && paginated.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-24 text-center"
            >
              <Grid3X3 size={48} strokeWidth={1} className="mx-auto text-[var(--secondary)] mb-4" />
              <p className="font-display text-3xl text-[var(--primary)]/30">No projects found</p>
              <p className="mt-2 text-sm text-[var(--primary)]/35">Try adjusting your filters</p>
              <button
                onClick={() => { setCategory(''); setPage(1) }}
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 text-2xs font-semibold uppercase tracking-widest border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] rounded-full transition"
              >
                Clear Filters
              </button>
            </motion.div>
          )}

          <div className="flex gap-8 lg:gap-12">
            {/* Collapsible Sidebar */}
            <aside
              ref={sidebarRef}
              className={`flex-shrink-0 transition-all duration-500 ease-[0.22,1,0.36,1] ${sidebarOpen ? 'w-72 lg:w-80' : 'w-16'} hidden lg:block`}
              aria-label="Portfolio categories"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-3xl p-4 md:p-6 shadow-[0_10px_40px_rgba(42,36,31,0.06)] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <motion.h2
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -10 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="font-display text-xl text-[var(--primary)] whitespace-nowrap overflow-hidden"
                  >
                    Categories
                  </motion.h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSidebarOpen(p => !p)}
                    className="flex-shrink-0 p-2 rounded-xl text-[var(--primary)]/50 hover:bg-[var(--secondary)]/50 hover:text-[var(--primary)] transition-colors"
                    aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    aria-expanded={sidebarOpen}
                  >
                    <ChevronRight
                      size={18}
                      strokeWidth={1.5}
                      className={`transition-transform duration-300 ${sidebarOpen ? 'rotate-0' : '-rotate-90'}`}
                    />
                  </motion.button>
                </div>

                <nav className="space-y-1" role="navigation" aria-label="Portfolio categories">
                  <button
                    onClick={() => { setCategory(''); setPage(1); setMobileSidebarOpen(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-left ${
                      !category
                        ? 'bg-[var(--primary)] text-white shadow-md'
                        : 'text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]'
                    }`}
                    aria-current={!category ? 'page' : undefined}
                  >
                    <Grid3X3 size={18} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
                    <span className={`font-medium text-sm uppercase tracking-wide transition-opacity ${!sidebarOpen ? 'opacity-0 invisible' : ''}`}>
                      All Projects
                    </span>
                    {!category && sidebarOpen && (
                      <motion.span
                        layoutId="active-indicator"
                        className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-semibold"
                      >
                        {items.length}
                      </motion.span>
                    )}
                  </button>

                  {categories.map((cat) => (
                    <motion.button
                      key={cat}
                      onClick={() => { setCategory(cat === category ? '' : cat); setPage(1); setMobileSidebarOpen(false) }}
                      whileHover={{ x: sidebarOpen ? 4 : 0 }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-left ${
                        category === cat
                          ? 'bg-[var(--primary)] text-white shadow-md'
                          : 'text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]'
                      }`}
                      aria-current={category === cat ? 'page' : undefined}
                    >
                      <Search size={18} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
                      <span className={`font-medium text-sm uppercase tracking-wide transition-opacity ${!sidebarOpen ? 'opacity-0 invisible' : ''}`}>
                        {cat}
                      </span>
                      {category === cat && sidebarOpen && (
                        <motion.span
                          layoutId="active-indicator"
                          className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-semibold"
                        >
                          {items.filter(i => i.category === cat).length}
                        </motion.span>
                      )}
                    </motion.button>
                  ))}
                </nav>

                {sidebarOpen && (
                  <div className="mt-8 pt-6 border-t border-[var(--border)]/40">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-4">All Projects</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {items.map((item) => (
                        <button
                          key={item._id}
                          onClick={() => { setSelected(item); setMobileSidebarOpen(false) }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors hover:bg-[var(--secondary)]/30"
                        >
                          <div className="flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden bg-[var(--secondary)]">
                            <PositionedImage
                              src={item.imageUrl}
                              alt={item.title}
                              settings={item.mediaSettings}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <span className="text-sm font-medium text-[var(--primary)] truncate flex-1">
                            {item.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
              {mobileSidebarOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-[var(--primary)]/30 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-hidden="true"
                  />
                  <motion.div
                    initial={{ opacity: 0, x: -300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-[var(--border)]/60 shadow-xl lg:hidden overflow-y-auto"
                  >
                    <div className="p-4 md:p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-display text-xl text-[var(--primary)]">Categories</h2>
                        <button
                          onClick={() => setMobileSidebarOpen(false)}
                          className="p-2 rounded-xl text-[var(--primary)]/50 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)] transition-colors"
                        >
                          <X size={20} strokeWidth={1.5} />
                        </button>
                      </div>
                      <nav className="space-y-1" role="navigation" aria-label="Mobile portfolio categories">
                        <button
                          onClick={() => { setCategory(''); setPage(1); setMobileSidebarOpen(false) }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-left ${
                            !category
                              ? 'bg-[var(--primary)] text-white shadow-md'
                              : 'text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]'
                          }`}
                        >
                          <Grid3X3 size={18} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
                          <span className="font-medium text-sm uppercase tracking-wide">All Projects</span>
                          {!category && <span className="ml-auto bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{items.length}</span>}
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => { setCategory(cat === category ? '' : cat); setPage(1); setMobileSidebarOpen(false) }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-left ${
                              category === cat
                                ? 'bg-[var(--primary)] text-white shadow-md'
                                : 'text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]'
                            }`}
                          >
                            <Search size={18} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
                            <span className="font-medium text-sm uppercase tracking-wide">{cat}</span>
                            {category === cat && <span className="ml-auto bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-semibold px-2 py-0.5 rounded-full">{items.filter(i => i.category === cat).length}</span>}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Mobile Sidebar Toggle Button */}
            <button
              className="lg:hidden fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-xl transition-all hover:shadow-2xl"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open portfolio filters"
            >
              <Grid3X3 size={22} strokeWidth={1.5} />
            </button>

            {/* Portfolio Content Area */}
            <main className="flex-1 min-w-0">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-50px' }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {paginated.map((item, index) => (
                  <motion.figure
                    key={item._id}
                    onClick={() => setSelected(item)}
                    variants={itemVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: index * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="group mb-6 break-inside-avoid overflow-hidden rounded-3xl bg-white shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500 cursor-pointer"
                    style={{ aspectRatio: '3/4' }}
                  >
                    <div className="relative overflow-hidden">
                      <PositionedImage
                        src={item.imageUrl}
                        alt={item.title}
                        settings={item.mediaSettings}
                        className="w-full transition duration-700 group-hover:scale-105"
                        loading="lazy"
                        sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/85 via-[var(--primary)]/40 to-transparent opacity-100" />
                    </div>

                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                      {item.category && (
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2"
                        >
                          {item.category}
                        </motion.p>
                      )}
                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="font-display text-2xl md:text-3xl font-normal text-white leading-tight"
                      >
                        {item.title}
                      </motion.h3>
                      {item.description && (
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="mt-3 text-sm leading-relaxed text-white/70 line-clamp-2 hidden md:block"
                        >
                          {item.description}
                        </motion.p>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0"
                      >
                        View Project <ArrowRight size={12} strokeWidth={1.5} />
                      </motion.div>
                    </div>
                  </motion.figure>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-16 flex items-center justify-center gap-2"
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-full text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) pageNum = i + 1
                    else if (page <= 3) pageNum = i + 1
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                    else pageNum = page - 2 + i

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-300 ${
                          page === pageNum
                            ? 'bg-[var(--primary)] text-white shadow-md'
                            : 'text-[var(--primary)]/60 hover:bg-[var(--secondary)]/50 hover:text-[var(--accent)]'
                        }`}
                        aria-label={`Page ${pageNum}`}
                        aria-current={page === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-full text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Modal Detail View */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[var(--primary)]/90 backdrop-blur-sm z-50"
              onClick={() => setSelected(null)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-4 md:inset-10 lg:inset-20 z-50 bg-white rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-title"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur text-[var(--primary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-all duration-300"
                aria-label="Close project"
              >
                <X size={20} strokeWidth={2} />
              </button>
              <div className="relative h-full flex">
                <div className="relative w-full md:w-1/2 overflow-hidden">
                  <PositionedImage
                    src={selected.imageUrl}
                    alt={selected.title}
                    settings={selected.mediaSettings}
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    {selected.category && (
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">{selected.category}</p>
                    )}
                    <h2 id="project-title" className="font-display text-3xl md:text-4xl font-normal leading-tight">{selected.title}</h2>
                  </div>
                </div>
                <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
                  {selected.description && (
                    <p className="text-base leading-relaxed text-[var(--primary)]/70 mb-8">{selected.description}</p>
                  )}
                  {selected.materials && (
                    <div className="mb-6">
                      <h3 className="font-display text-xl font-normal text-[var(--primary)] mb-3">Materials Used</h3>
                      <p className="text-sm leading-relaxed text-[var(--primary)]/60">{selected.materials}</p>
                    </div>
                  )}
                  {selected.inspiration && (
                    <div className="mb-6">
                      <h3 className="font-display text-xl font-normal text-[var(--primary)] mb-3">Design Inspiration</h3>
                      <p className="text-sm leading-relaxed text-[var(--primary)]/60">{selected.inspiration}</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    {selected.location && (
                      <div className="flex items-center gap-3 text-sm text-[var(--primary)]/60">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{selected.location}</span>
                      </div>
                    )}
                    {selected.year && (
                      <div className="flex items-center gap-3 text-sm text-[var(--primary)]/60">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Completed: {selected.year}</span>
                      </div>
                    )}
                    {selected.client && (
                      <div className="flex items-center gap-3 text-sm text-[var(--primary)]/60">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>Client: {selected.client}</span>
                      </div>
                    )}
                    {selected.duration && (
                      <div className="flex items-center gap-3 text-sm text-[var(--primary)]/60">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Duration: {selected.duration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}