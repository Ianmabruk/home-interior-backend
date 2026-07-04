import { AnimatePresence, motion } from 'framer-motion'
import { Maximize2, X, Filter } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'

export const VirtualDesignPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [fullscreen, setFullscreen] = useState(null)

  const loadVirtualDesign = () => {
    api.get('/content/virtual-design')
      .then((res) => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadVirtualDesign() }, [])

  // Listen for admin changes
  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'virtual-changed') loadVirtualDesign()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [])

  useEffect(() => {
    if (fullscreen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [fullscreen])

  // Extract categories for filtering
  const categories = useMemo(() => {
    const cats = new Set()
    items.forEach(item => item.category && cats.add(item.category))
    return Array.from(cats)
  }, [items])

  const filtered = useMemo(() => {
    let next = items
    if (query) {
      const q = query.toLowerCase()
      next = next.filter((i) => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || (i.tags || []).some(t => t.toLowerCase().includes(q)))
    }
    if (categoryFilter) {
      next = next.filter((i) => i.category === categoryFilter)
    }
    return next
  }, [items, query, categoryFilter])

  return (
    <div>
      {/* Header */}
      <div className="section-pad bg-cream pb-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="eyebrow mb-4">Immersive Design</p>
            <h1 className="font-display text-6xl font-medium leading-tight text-ink md:text-7xl">
              Project Showcase
            </h1>
            <p className="mt-4 max-w-xl text-base text-ink/50">
              Explore our luxury interior design projects with cinematic walkthroughs, before & after galleries, and detailed presentations.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="sticky top-[88px] z-30 border-b border-sand bg-cream/95 backdrop-blur-sm md:top-[108px]">
        <div className="container-wide px-6 py-3 md:px-12 lg:px-20">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-full border border-sand bg-white pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-ink/35 focus:border-orange focus:ring-2 focus:ring-orange/20 transition"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {categories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto">
                <Filter size={14} className="text-ink/40" />
                <button
                  onClick={() => setCategoryFilter('')}
                  className={`px-4 py-1.5 text-2xs font-medium uppercase tracking-widest rounded-full transition ${
                    !categoryFilter ? 'bg-orange text-white' : 'bg-linen text-ink/60 hover:bg-sand'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                    className={`px-4 py-1.5 text-2xs font-medium uppercase tracking-widest rounded-full transition ${
                      categoryFilter === cat ? 'bg-orange text-white' : 'bg-linen text-ink/60 hover:bg-sand'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid - Project Showcases */}
      <div className="section-pad bg-cream pt-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          {loading && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="skeleton aspect-[4/3] w-full rounded-2xl" />
                  <div className="mt-4 space-y-2">
                    <div className="skeleton h-5 w-48" />
                    <div className="skeleton h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-24 text-center">
              <p className="font-display text-3xl text-ink/30">
                {items.length === 0 ? 'No projects yet.' : 'No results found.'}
              </p>
            </div>
          )}

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, i) => (
              <motion.article
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.6 }}
                className="group"
              >
                <div className="relative overflow-hidden bg-linen aspect-[4/3] rounded-2xl shadow-card">
                  <video
                    src={item.videoUrl}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    autoPlay loop muted playsInline preload="metadata"
                  />
                  <div className="absolute inset-0 bg-ink/0 transition-all duration-500 group-hover:bg-ink/20" />
                  {item.beforeAfterImages?.length > 0 && (
                    <span className="absolute left-3 top-3 bg-orange/90 px-3 py-1 text-2xs font-medium uppercase tracking-widest text-white rounded-full">
                      Before/After
                    </span>
                  )}
                  <button
                    onClick={() => setFullscreen(item)}
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center bg-white/90 text-ink rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-white"
                    aria-label="Full screen"
                  >
                    <Maximize2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="pt-5">
                  <h3 className="font-display text-2xl font-medium text-ink">{item.title}</h3>
                  {item.description && (
                    <p className="mt-2 text-sm leading-relaxed text-ink/50 line-clamp-2">{item.description}</p>
                  )}
                  {item.services?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.services.map((s, idx) => (
                        <span key={idx} className="border border-sand px-3 py-1 text-2xs font-medium uppercase tracking-widest text-ink/50 rounded-full">
                          {s.title}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="text-2xs text-ink/40">#{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => setFullscreen(item)}
                      className="btn-outline py-2.5 px-6 text-2xs flex-1"
                    >
                      Watch Video
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink"
          >
            <button
              onClick={() => setFullscreen(null)}
              className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center border border-white/20 text-white/70 transition hover:border-white hover:text-white rounded-full"
              aria-label="Close"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
            <div className="relative max-w-7xl w-full mx-4">
              <video
                src={fullscreen.videoUrl}
                controls autoPlay loop playsInline
                className="max-h-[70vh] w-full object-contain rounded-lg"
              />
              <div className="mt-6 bg-white/95 backdrop-blur-sm p-6 rounded-2xl">
                <h2 className="font-display text-3xl font-medium text-ink">{fullscreen.title}</h2>
                {fullscreen.description && (
                  <p className="mt-2 text-sm text-ink/60">{fullscreen.description}</p>
                )}
                
                {/* Before/After Gallery */}
                {fullscreen.beforeAfterImages?.length > 0 && (
                  <div className="mt-6">
                    <p className="text-2xs font-medium uppercase tracking-widest text-orange mb-4">Before & After Gallery</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {fullscreen.beforeAfterImages.map((img, idx) => (
                        <div key={idx} className="relative overflow-hidden rounded-lg">
                          <img src={img.url} alt={img.label || `View ${idx + 1}`} className="w-full object-cover aspect-[4/3]" />
                          {img.label && (
                            <p className="absolute bottom-2 left-2 bg-ink/70 text-white text-2xs px-2 py-1 rounded">{img.label}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {fullscreen.services?.length > 0 && (
                  <div className="mt-6">
                    <p className="text-2xs font-medium uppercase tracking-widest text-orange mb-3">Services Included</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {fullscreen.services.map((s, idx) => (
                        <div key={idx} className="border border-sand p-3 rounded-lg">
                          <p className="font-medium text-ink">{s.title}</p>
                          <p className="text-sm text-ink/50">{s.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}