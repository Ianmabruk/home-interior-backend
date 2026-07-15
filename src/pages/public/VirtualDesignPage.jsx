import { Maximize2, X, Play, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState, useRef } from 'react'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import { getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'
import LazyVideo from '../../components/common/LazyVideo'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
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
    <div className="min-h-screen bg-primary-bg">
      {/* Hero Section */}
      <section className="relative h-[75vh] min-h-[550px] overflow-hidden bg-dark-luxury">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2000&q=80"
            alt="Luxury interior"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-luxury/95 via-dark-luxury/60 to-dark-luxury/30" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(198,155,109,0.15),transparent_60%)]" />
        <div className="relative z-10 flex h-full items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-center px-6"
          >
            <p className="eyebrow mb-4 text-champagne/80">Immersive Experience</p>
            <h1 className="font-display text-5xl font-medium text-white md:text-7xl lg:text-8xl leading-[0.95]">
              Virtual Interiors
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-white/60 leading-relaxed">
              Step inside our luxury projects with cinematic walkthroughs and detailed presentations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sticky Filter Bar */}
      <div className="sticky top-[88px] z-30 border-b border-champagne/20 bg-white/70 backdrop-blur-xl shadow-sm md:top-[108px]">
        <div className="container-wide px-6 py-4 md:px-12 lg:px-20">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 max-w-sm w-full">
              <Sparkles size={16} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-full border border-champagne/40 bg-linen pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-ink/35 focus:border-warm-gold focus:ring-2 focus:ring-warm-gold/20 transition"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('')}
                  className={`px-4 py-1.5 text-2xs font-semibold uppercase tracking-widest rounded-full transition ${
                    !categoryFilter ? 'bg-dark-luxury text-white shadow-md' : 'bg-linen text-ink/60 hover:bg-champagne/30 border border-champagne/40'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                    className={`px-4 py-1.5 text-2xs font-semibold uppercase tracking-widest rounded-full transition ${
                      categoryFilter === cat ? 'bg-dark-luxury text-white shadow-md' : 'bg-linen text-ink/60 hover:bg-champagne/30 border border-champagne/40'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
            <span className="text-2xs text-ink/40 font-medium">{filtered.length} projects</span>
          </div>
        </div>
      </div>

      {/* Video Cards Grid */}
      <section className="section-pad bg-primary-bg pt-12">
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
              <Play size={48} strokeWidth={1} className="mx-auto text-champagne mb-4" />
              <p className="font-display text-3xl text-ink/30">
                {items.length === 0 ? 'No projects yet.' : 'No results found.'}
              </p>
              {(query || categoryFilter) && (
                <button onClick={() => { setQuery(''); setCategoryFilter('') }} className="btn-outline border-warm-gold text-warm-gold mt-6 hover:bg-warm-gold hover:text-white hover:border-warm-gold">
                  Clear Filters
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
                <div className="relative overflow-hidden rounded-3xl bg-linen shadow-card hover:shadow-lift transition-all duration-500 aspect-[4/3]">
                  <LazyVideo
                    src={getOptimizedVideoUrl(item.videoUrl, { width: 640 })}
                    poster={getVideoPosterUrl(item.videoUrl, { width: 640 })}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-dark-luxury/0 transition-all duration-500 group-hover:bg-dark-luxury/30" />
                  {item.beforeAfterImages?.length > 0 && (
                    <span className="absolute left-3 top-3 bg-warm-gold px-3 py-1 text-2xs font-semibold uppercase tracking-widest text-white rounded-full shadow-lg">
                      Before/After
                    </span>
                  )}
                  <button
                    onClick={() => setFullscreen(item)}
                    className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center bg-white/90 text-ink rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-white shadow-lg hover:scale-110"
                    aria-label="Full screen"
                  >
                    <Maximize2 size={18} strokeWidth={1.5} />
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                      <Play size={20} strokeWidth={1.5} className="ml-1 text-ink" />
                    </div>
                  </div>
                </div>
                <div className="pt-5">
                  <h3 className="font-display text-2xl font-medium text-ink group-hover:text-warm-gold transition-colors">{item.title}</h3>
                  {item.description && (
                    <p className="mt-2 text-sm leading-relaxed text-ink/50 line-clamp-2">{item.description}</p>
                  )}
                  {item.category && (
                    <p className="mt-2 text-2xs font-semibold uppercase tracking-widest text-warm-gold">{item.category}</p>
                  )}
                  {item.services?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.services.map((s, idx) => (
                        <span key={idx} className="border border-champagne/50 px-3 py-1 text-2xs font-medium uppercase tracking-widest text-ink/55 rounded-full hover:border-warm-gold transition">
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

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-dark-luxury">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(198,155,109,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(232,211,190,0.06),transparent_60%)]" />
        <div className="relative section-pad">
          <div className="container-narrow px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="eyebrow mb-4 text-champagne/50">Start Your Journey</p>
              <h2 className="font-display text-4xl font-medium text-white md:text-5xl lg:text-6xl leading-[1.05]">
                Ready to Transform<br />Your Space?
              </h2>
              <p className="mt-6 max-w-lg mx-auto text-base text-white/50 leading-relaxed">
                Book a virtual consultation and let our experts bring your dream interior to life.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link to="/" className="btn-primary group">
                  Schedule Consultation <Sparkles size={14} strokeWidth={1.5} className="transition-transform group-hover:rotate-12" />
                </Link>
                <Link to="/portfolio" className="btn-outline border-white/25 text-white hover:bg-white hover:text-ink hover:border-white">
                  View Portfolio
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Fullscreen Video Modal */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark-luxury/98 p-4 md:p-8 backdrop-blur-sm"
            onClick={() => setFullscreen(null)}
          >
            <button
              onClick={() => setFullscreen(null)}
              className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center border border-white/20 text-white/70 transition hover:border-white hover:text-white rounded-full"
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
              <div className="mt-6 bg-white/95 backdrop-blur-sm p-6 rounded-3xl">
                <h2 className="font-display text-3xl font-medium text-ink">{fullscreen.title}</h2>
                {fullscreen.description && (
                  <p className="mt-3 text-sm text-ink/60 leading-relaxed">{fullscreen.description}</p>
                )}

                {fullscreen.beforeAfterImages?.length > 0 && (
                  <div className="mt-8">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-warm-gold mb-4">Before & After Gallery</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {fullscreen.beforeAfterImages.map((img, idx) => (
                        <div key={idx} className="relative overflow-hidden rounded-2xl">
                          <img src={img.url} alt={img.label || `View ${idx + 1}`} className="w-full object-cover aspect-[4/3] hover:scale-105 transition duration-500" />
                          {img.label && (
                            <p className="absolute bottom-3 left-3 bg-dark-luxury/80 text-white text-2xs px-3 py-1.5 rounded-full">{img.label}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {fullscreen.services?.length > 0 && (
                  <div className="mt-8">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-warm-gold mb-4">Services Included</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {fullscreen.services.map((s, idx) => (
                        <div key={idx} className="border border-champagne/40 p-4 rounded-2xl hover:border-warm-gold transition">
                          <p className="font-medium text-ink">{s.title}</p>
                          <p className="text-sm text-ink/50 mt-1">{s.description}</p>
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
