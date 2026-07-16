import { Maximize2, X, Play, Sparkles, Video, ArrowRight, Clock, Users, Layers, PenTool } from 'lucide-react'
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

const processSteps = [
  {
    number: '01',
    title: 'Discovery',
    description: 'We begin with an in-depth consultation to understand your vision, lifestyle, and design preferences.',
    icon: Users,
  },
  {
    number: '02',
    title: 'Concept Development',
    description: 'Our designers create mood boards, spatial layouts, and 3D visualizations tailored to your space.',
    icon: PenTool,
  },
  {
    number: '03',
    title: 'Design Refinement',
    description: 'We collaborate with you to refine every detail — materials, finishes, furniture, and lighting.',
    icon: Layers,
  },
  {
    number: '04',
    title: 'Execution',
    description: 'From procurement to installation, we manage the entire process ensuring flawless delivery.',
    icon: Clock,
  },
]

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
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1581539250439-c9668d8c4a5e?auto=format&fit=crop&w=2000&q=80"
            alt="Virtual interior design studio"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/95 via-[var(--primary)]/70 to-[var(--primary)]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.18),transparent_50%)]" />
        </div>
        <div className="relative z-10 flex h-full items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-center px-6"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Immersive Experience</p>
            <h1 className="font-display text-5xl font-normal text-white md:text-7xl lg:text-8xl leading-[0.95]">
              Virtual Interiors
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="section-pad bg-[var(--bg)]">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 md:mb-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Our Process</p>
            <h2 className="font-display text-4xl font-normal leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
              From Vision to Reality
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
              A seamless four-step journey that transforms your space with precision and elegance.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {processSteps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                custom={i}
                className="relative group"
              >
                <div className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-10 shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500 border border-[var(--border)]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5 border border-[var(--accent)]/20 group-hover:border-[var(--accent)] group-hover:bg-gradient-to-br group-hover:from-[var(--accent)]/20 group-hover:to-[var(--accent)]/10 transition-all duration-500">
                      <step.icon size={24} strokeWidth={1.5} className="text-[var(--accent)]" />
                    </div>
                    
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] text-center mb-2">{step.number}</p>
                    <h3 className="font-display text-xl font-normal text-[var(--primary)] text-center mb-3">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-[var(--primary)]/60 text-center">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Consultation Steps */}
      <section className="section-pad bg-[var(--secondary)]/50">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 md:mb-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Consultation</p>
            <h2 className="font-display text-4xl font-normal leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
              Book Your Virtual Design Session
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Initial Consultation',
                description: '30-minute video call to discuss your project scope, style preferences, and budget.',
                duration: '30 min',
                price: 'Complimentary',
                features: ['Space assessment', 'Style discovery', 'Project roadmap'],
              },
              {
                title: 'Design Concept Package',
                description: 'Complete room design with 3D renderings, mood boards, and product specifications.',
                duration: '2-3 weeks',
                price: 'From $1,500',
                features: ['3D visualizations', 'Material board', 'Shopping list'],
              },
              {
                title: 'Full Project Management',
                description: 'End-to-end service from concept to installation with dedicated project manager.',
                duration: '8-12 weeks',
                price: 'Custom Quote',
                features: ['Procurement', 'Installation', 'Styling'],
              },
            ].map((pkg, i) => (
              <motion.div
                key={pkg.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500 border border-[var(--border)]"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)]" />
                <h3 className="font-display text-xl font-normal text-[var(--primary)] mb-2">{pkg.title}</h3>
                <p className="text-sm text-[var(--primary)]/60 mb-6 leading-relaxed">{pkg.description}</p>
                
                <div className="flex items-center gap-4 mb-6 p-4 bg-[var(--bg)] rounded-2xl">
                  <div className="flex items-center gap-2 text-sm text-[var(--primary)]/60">
                    <Clock size={16} strokeWidth={1.5} className="text-[var(--accent)]" />
                    <span>{pkg.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--primary)]">
                    <Sparkles size={16} strokeWidth={1.5} className="text-[var(--accent)]" />
                    <span>{pkg.price}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-[var(--primary)]/70">
                      <div className="w-5 h-5 flex items-center justify-center rounded-full bg-[var(--accent)]/10">
                        <Sparkles size={10} strokeWidth={2} className="text-[var(--accent)]" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/contact"
                  className="btn-luxury-primary w-full justify-center group"
                >
                  Get Started <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-To-Action Section */}
      <section className="relative overflow-hidden bg-[var(--primary)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(230,211,203,0.08),transparent_60%)]" />
        <div className="relative section-pad">
          <div className="container-narrow px-6 text-center">
            <motion.div variants={staggerContainer}>
              <motion.p variants={fadeUp} custom={0} className="text-[11px] font-semibold uppercase tracking-widest text-[var(--secondary)]/50 mb-4">Ready to Begin?</motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="font-display text-5xl font-normal text-white md:text-6xl lg:text-7xl leading-[1.05]">
                Let&apos;s Create<br />Something Beautiful
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-6 max-w-md mx-auto text-base text-white/50 leading-relaxed">
                Transform your space with our expert interior design services. Schedule a consultation today.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link to="/contact" className="btn-luxury-primary group">
                  Book Consultation <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/shop" className="btn-luxury-secondary group">
                  Shop Collection
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Projects Gallery */}
      <section className="section-pad bg-[var(--bg)] pt-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 md:mb-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Portfolio</p>
            <h2 className="font-display text-4xl font-normal leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
              Featured Projects
            </h2>
          </motion.div>

          {/* Search & Filter */}
          <div className="mb-12">
            <div className="relative max-w-xl mx-auto">
              <Sparkles size={16} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--primary)]/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-full border border-[var(--border)] bg-[var(--bg)] pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                <button
                  onClick={() => setCategoryFilter('')}
                  className={`px-4 py-1.5 text-2xs font-semibold uppercase tracking-widest rounded-full transition ${
                    !categoryFilter ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--bg)] text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 border border-[var(--border)]'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                    className={`px-4 py-1.5 text-2xs font-semibold uppercase tracking-widest rounded-full transition ${
                      categoryFilter === cat ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--bg)] text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 border border-[var(--border)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Video Cards Grid */}
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
                <Video size={48} strokeWidth={1} className="mx-auto text-[var(--secondary)] mb-4" />
                <p className="font-display text-3xl text-[var(--primary)]/30">
                  {items.length === 0 ? 'No projects yet.' : 'No results found.'}
                </p>
                {(query || categoryFilter) && (
                  <button onClick={() => { setQuery(''); setCategoryFilter('') }} className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 text-2xs font-semibold uppercase tracking-widest border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] rounded-full transition">
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
                  <div className="relative overflow-hidden rounded-3xl bg-[var(--card)] shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500 aspect-[4/3]">
                    <LazyVideo
                      src={getOptimizedVideoUrl(item.videoUrl, { width: 640 })}
                      poster={getVideoPosterUrl(item.videoUrl, { width: 640 })}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[var(--primary)]/0 transition-all duration-500 group-hover:bg-[var(--primary)]/30" />
                    {item.beforeAfterImages?.length > 0 && (
                      <span className="absolute left-3 top-3 bg-[var(--accent)] px-3 py-1 text-2xs font-semibold uppercase tracking-widest text-white rounded-full shadow-lg">
                        Before/After
                      </span>
                    )}
                    <button
                      onClick={() => setFullscreen(item)}
                      className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center bg-white/90 text-[var(--primary)] rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-white shadow-lg hover:scale-110"
                      aria-label="Full screen"
                    >
                      <Maximize2 size={18} strokeWidth={1.5} />
                    </button>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                        <Play size={20} strokeWidth={1.5} className="ml-1 text-[var(--primary)]" />
                      </div>
                    </div>
                  </div>
                  <div className="pt-5">
                    <h3 className="font-display text-2xl font-normal text-[var(--primary)] group-hover:text-[var(--accent)] transition-colors">{item.title}</h3>
                    {item.description && (
                      <p className="mt-2 text-sm leading-relaxed text-[var(--primary)]/55 line-clamp-2">{item.description}</p>
                    )}
                    {item.category && (
                      <p className="mt-2 text-2xs font-semibold uppercase tracking-widest text-[var(--accent)]">{item.category}</p>
                    )}
                    {item.services?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.services.map((s, idx) => (
                          <span key={idx} className="border border-[var(--border)] px-3 py-1 text-2xs font-medium uppercase tracking-widest text-[var(--primary)]/55 rounded-full hover:border-[var(--accent)] transition">
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
        </div>
      </section>

      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--primary)]/98 p-4 md:p-8 backdrop-blur-sm"
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
              <div className="mt-6 bg-[var(--bg)]/95 backdrop-blur-sm p-6 rounded-3xl">
                <h2 className="font-display text-3xl font-normal text-[var(--primary)]">{fullscreen.title}</h2>
                {fullscreen.description && (
                  <p className="mt-3 text-sm text-[var(--primary)]/60 leading-relaxed">{fullscreen.description}</p>
                )}

                {fullscreen.beforeAfterImages?.length > 0 && (
                  <div className="mt-8">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Before & After Gallery</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {fullscreen.beforeAfterImages.map((img, idx) => (
                        <div key={idx} className="relative overflow-hidden rounded-2xl">
                          <img src={img.url} alt={img.label || `View ${idx + 1}`} className="w-full object-cover aspect-[4/3] hover:scale-105 transition duration-500" />
                          {img.label && (
                            <p className="absolute bottom-3 left-3 bg-[var(--primary)]/80 text-white text-2xs px-3 py-1.5 rounded-full">{img.label}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {fullscreen.services?.length > 0 && (
                  <div className="mt-8">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Services Included</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {fullscreen.services.map((s, idx) => (
                        <div key={idx} className="border border-[var(--border)] p-4 rounded-2xl hover:border-[var(--accent)] transition">
                          <p className="font-medium text-[var(--primary)]">{s.title}</p>
                          <p className="text-sm text-[var(--primary)]/50 mt-1">{s.description}</p>
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