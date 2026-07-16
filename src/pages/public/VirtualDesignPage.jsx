import { Maximize2, X, Play, Sparkles, Video, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import { getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'
import LazyVideo from '../../components/common/LazyVideo'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

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
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1581539250439-c9668d8c4a5e?auto=format&fit=crop&w=2000&q=80"
            alt="Virtual interior design studio"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-text/95 via-luxury-text/70 to-luxury-text/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(214,178,122,0.18),transparent_50%)]" />
        </div>
        <div className="relative z-10 flex h-full items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-center px-6"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-accent mb-4">Immersive Experience</p>
            <h1 className="font-display text-5xl font-normal text-warm-ivory md:text-7xl lg:text-8xl leading-[0.95]">
              Virtual Interiors
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Projects Gallery */}
      <section className="bg-cream px-6 md:px-12 lg:px-20 py-24 md:py-36">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 md:mb-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-accent mb-4">Portfolio</p>
            <h2 className="font-display text-4xl font-normal leading-tight text-luxury-text md:text-5xl lg:text-6xl">
              Featured Projects
            </h2>
          </motion.div>

          {/* Search & Filter */}
          <div className="mb-12">
            <div className="relative max-w-xl mx-auto">
              <Sparkles size={16} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-text/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-full border border-linen/40 bg-warm-ivory pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-luxury-text/35 focus:border-bronze focus:ring-2 focus:ring-bronze/20 transition"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                <button
                  onClick={() => setCategoryFilter('')}
                  className={`px-4 py-1.5 text-2xs font-semibold uppercase tracking-widest rounded-full transition ${
                    !categoryFilter ? 'bg-luxury-text text-warm-ivory shadow-md' : 'bg-warm-ivory text-luxury-text/60 hover:bg-linen/30 border border-linen/40'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                    className={`px-4 py-1.5 text-2xs font-semibold uppercase tracking-widest rounded-full transition ${
                      categoryFilter === cat ? 'bg-luxury-text text-warm-ivory shadow-md' : 'bg-warm-ivory text-luxury-text/60 hover:bg-linen/30 border border-linen/40'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Video Cards Grid */}
          <section className="section-pad bg-soft-cream/50 pt-12">
            <div className="container-wide px-6 md:px-12 lg:px-20">
              {loading && (
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i}>
                      <div className="skeleton aspect-[4/3] w-full rounded-3xl" />
                      <div className="mt-4 space-y-2">
                        <div className="skeleton h-5 w-48" />
                        <div className="skeleton h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-24 text-center">
                  <Video size={48} strokeWidth={1} className="mx-auto text-linen mb-4" />
                  <p className="font-display text-3xl text-luxury-text/30">
                    {items.length === 0 ? 'No projects yet.' : 'No results found.'}
                  </p>
                  {(query || categoryFilter) && (
                    <button onClick={() => { setQuery(''); setCategoryFilter('') }} className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 text-2xs font-semibold uppercase tracking-widest border border-bronze text-bronze hover:bg-bronze hover:text-warm-ivory hover:border-bronze rounded-full transition">
                      <X size={12} strokeWidth={1.5} /> Clear Filters
                    </button>
                  )}
                </motion.div>
              )}

              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item, i) => (
                  <motion.div
                    key={item._id}
                    variants={fadeUp}
                    custom={i}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-3xl bg-cream shadow-soft hover:shadow-lift transition-all duration-500 aspect-[4/3]">
                      <LazyVideo
                        src={getOptimizedVideoUrl(item.videoUrl, { width: 640 })}
                        poster={getVideoPosterUrl(item.videoUrl, { width: 640 })}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-luxury-text/0 transition-all duration-500 group-hover:bg-luxury-text/30" />
                      {item.beforeAfterImages?.length > 0 && (
                        <span className="absolute left-3 top-3 bg-bronze px-3 py-1 text-2xs font-semibold uppercase tracking-widest text-warm-ivory rounded-full shadow-lg">
                          Before/After
                        </span>
                      )}
                      <button
                        onClick={() => setFullscreen(item)}
                        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center bg-warm-ivory/90 text-luxury-text rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-warm-ivory shadow-lg hover:scale-110"
                        aria-label="Full screen"
                      >
                        <Maximize2 size={18} strokeWidth={1.5} />
                      </button>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warm-ivory/90 shadow-lg">
                          <Play size={20} strokeWidth={1.5} className="ml-1 text-luxury-text" />
                        </div>
                      </div>
                    </div>
                    <div className="pt-5">
                      <h3 className="font-display text-2xl font-normal text-luxury-text group-hover:text-bronze transition-colors">{item.title}</h3>
                      {item.description && (
                        <p className="mt-2 text-sm leading-relaxed text-stone line-clamp-2">{item.description}</p>
                      )}
                      {item.category && (
                        <p className="mt-2 text-2xs font-semibold uppercase tracking-widest text-orange-accent">{item.category}</p>
                      )}
                      {item.services?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.services.map((s, idx) => (
                            <span key={idx} className="border border-linen/50 px-3 py-1 text-2xs font-medium uppercase tracking-widest text-stone/55 rounded-full hover:border-bronze transition">
                              {s.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        </div>
      </section>

      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-luxury-text/98 p-4 md:p-8 backdrop-blur-sm"
            onClick={() => setFullscreen(null)}
          >
            <button
              onClick={() => setFullscreen(null)}
              className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center border border-warm-ivory/20 text-warm-ivory/70 transition hover:border-warm-ivory hover:text-warm-ivory rounded-full"
              aria-label="Close"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
            <div className="relative max-w-6xl w-full mx-auto">
              <video
                src={getOptimizedVideoUrl(fullscreen.videoUrl, { width: 1280 })}
                poster={getVideoPosterUrl(fullscreen.videoUrl, { width: 1280 })}
                controls autoPlay loop playsInline preload="metadata"
                className="max-h-[70vh] w-full object-contain rounded-2xl shadow-2xl"
              />
              <div className="mt-6 bg-warm-ivory/95 backdrop-blur-sm p-6 rounded-3xl">
                <h2 className="font-display text-3xl font-normal text-luxury-text">{fullscreen.title}</h2>
                {fullscreen.description && (
                  <p className="mt-3 text-sm text-luxury-text/60 leading-relaxed">{fullscreen.description}</p>
                )}

                {fullscreen.beforeAfterImages?.length > 0 && (
                  <div className="mt-8">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-orange-accent mb-4">Before & After Gallery</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {fullscreen.beforeAfterImages.map((img, idx) => (
                        <div key={idx} className="relative overflow-hidden rounded-2xl">
                          <img src={img.url} alt={img.label || `View ${idx + 1}`} className="w-full object-cover aspect-[4/3] hover:scale-105 transition duration-500" />
                          {img.label && (
                            <p className="absolute bottom-3 left-3 bg-luxury-text/80 text-warm-ivory text-2xs px-3 py-1.5 rounded-full">{img.label}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {fullscreen.services?.length > 0 && (
                  <div className="mt-8">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-orange-accent mb-4">Services Included</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {fullscreen.services.map((s, idx) => (
                        <div key={idx} className="border border-linen/40 p-4 rounded-2xl hover:border-bronze transition">
                          <p className="font-medium text-luxury-text">{s.title}</p>
                          <p className="text-sm text-luxury-text/50 mt-1">{s.description}</p>
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