import { Maximize2, X, Play, Sparkles, Video, Image, Layers, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState, useRef } from 'react'
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
  { number: '01', title: 'Discovery Call', desc: 'We discuss your vision, style preferences, and functional needs.' },
  { number: '02', title: 'Concept Development', desc: 'Our designers create mood boards and initial layouts.' },
  { number: '03', title: 'Design Refinement', desc: 'We refine the design with your feedback and material selections.' },
  { number: '04', title: 'Final Presentation', desc: 'Complete 3D renders, detailed specs, and shopping lists delivered.' },
]

const consultationPackages = [
  {
    name: 'Essentials',
    price: '$299',
    description: 'Perfect for single rooms',
    features: ['1-hour video consultation', 'Mood board & color palette', 'Layout suggestions', 'Product recommendations', 'Follow-up email summary'],
  },
  {
    name: 'Complete',
    price: '$599',
    description: 'Full home transformation',
    features: ['2-hour video consultation', 'Detailed mood boards per room', 'Space plans & furniture layouts', 'Curated shopping list', '2 revisions included'],
    popular: true,
  },
  {
    name: 'Premium',
    price: '$1,299',
    description: 'Luxury full-service design',
    features: ['3+ hour consultation', 'Photorealistic 3D renders', 'Custom furniture sourcing', 'Contractor coordination', 'Unlimited revisions', 'Project management'],
  },
]

export const VirtualDesignPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [fullscreen, setFullscreen] = useState(null)
  const [activeTab, setActiveTab] = useState('projects')

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
      {/* Hero Section - Different from Shop */}
      <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1581539250439-c9668d8c4a5e?auto=format&fit=crop&w=2000&q=80"
            alt="Virtual interior design studio"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/95 via-charcoal/70 to-charcoal/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,138,90,0.18),transparent_50%)]" />
        </div>
        <div className="relative z-10 flex h-full items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-center px-6"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-4">Immersive Experience</p>
            <h1 className="font-['Playfair_Display'] text-5xl font-medium text-white md:text-7xl lg:text-8xl leading-[0.95]">
              Virtual Interiors
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-white/60 leading-relaxed">
              Step inside our luxury projects with cinematic walkthroughs and detailed presentations.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/virtual-interior-design" className="group inline-flex items-center justify-center gap-3 rounded-full bg-forest px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:bg-forestDark hover:shadow-[0_10px_40px_rgba(31,77,58,0.2)] hover:-translate-y-0.5">
                <Sparkles size={14} strokeWidth={1.5} />
                Book Virtual Consultation
              </Link>
              <Link to="#process" className="inline-flex items-center justify-center gap-3 rounded-full border border-white/25 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:bg-white hover:text-charcoal hover:border-white">
                View Design Process
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white/50 border-y border-border py-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { label: 'Projects Completed', value: '247+' },
              { label: 'Virtual Consultations', value: '1,200+' },
              { label: 'Client Satisfaction', value: '98%' },
              { label: 'Countries Served', value: '15+' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="text-center"
              >
                <p className="font-['Playfair_Display'] text-4xl md:text-5xl font-semibold text-charcoal">{stat.value}</p>
                <p className="mt-2 text-sm text-stone">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="bg-primary-bg px-6 md:px-12 lg:px-20 py-24 md:py-36">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 md:mb-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-4">Our Process</p>
            <h2 className="font-['Playfair_Display'] text-4xl font-medium leading-tight text-charcoal md:text-5xl lg:text-6xl">
              Designing Virtually,<br />Delivering Reality
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-4">
            {processSteps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative p-6 md:p-8 bg-white rounded-3xl border border-border shadow-soft hover:shadow-lift transition-all duration-500"
              >
                <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary/60 text-forest transition-all duration-500 group-hover:bg-forest group-hover:text-white group-hover:scale-110">
                  <span className="text-2xl font-semibold">{step.number}</span>
                </div>
                <h3 className="font-['Playfair_Display'] text-xl md:text-2xl font-medium text-charcoal leading-tight mb-2">{step.title}</h3>
                <p className="text-sm text-stone leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Gallery */}
      <section className="bg-white px-6 md:px-12 lg:px-20 py-24 md:py-36">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 md:mb-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-4">Portfolio</p>
            <h2 className="font-['Playfair_Display'] text-4xl font-medium leading-tight text-charcoal md:text-5xl lg:text-6xl">
              Featured Projects
            </h2>
          </motion.div>

          {/* Sticky Filter Bar */}
          <div className="sticky top-[88px] z-30 border-b border-champagne/20 bg-white/70 backdrop-blur-xl shadow-sm md:top-[108px]">
            <div className="container-wide px-6 py-4 md:px-12 lg:px-20">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 max-w-sm w-full">
                  <Sparkles size={16} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/35" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full rounded-full border border-champagne/40 bg-cream pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-charcoal/35 focus:border-bronze focus:ring-2 focus:ring-bronze/20 transition"
                  />
                </div>
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCategoryFilter('')}
                      className={`px-4 py-1.5 text-2xs font-semibold uppercase tracking-widest rounded-full transition ${
                        !categoryFilter ? 'bg-forest text-white shadow-md' : 'bg-cream text-charcoal/60 hover:bg-champagne/30 border border-champagne/40'
                      }`}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                        className={`px-4 py-1.5 text-2xs font-semibold uppercase tracking-widest rounded-full transition ${
                          categoryFilter === cat ? 'bg-forest text-white shadow-md' : 'bg-cream text-charcoal/60 hover:bg-champagne/30 border border-champagne/40'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
                <span className="text-2xs text-charcoal/40 font-medium">{filtered.length} projects</span>
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
                  <Video size={48} strokeWidth={1} className="mx-auto text-champagne mb-4" />
                  <p className="font-['Playfair_Display'] text-3xl text-charcoal/30">
                    {items.length === 0 ? 'No projects yet.' : 'No results found.'}
                  </p>
                  {(query || categoryFilter) && (
                    <button onClick={() => { setQuery(''); setCategoryFilter('') }} className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 text-2xs font-semibold uppercase tracking-widest border border-bronze text-bronze hover:bg-bronze hover:text-white hover:border-bronze rounded-full transition">
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
                    <div className="relative overflow-hidden rounded-3xl bg-cream shadow-card hover:shadow-lift transition-all duration-500 aspect-[4/3]">
                      <LazyVideo
                        src={getOptimizedVideoUrl(item.videoUrl, { width: 640 })}
                        poster={getVideoPosterUrl(item.videoUrl, { width: 640 })}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-charcoal/0 transition-all duration-500 group-hover:bg-charcoal/30" />
                      {item.beforeAfterImages?.length > 0 && (
                        <span className="absolute left-3 top-3 bg-bronze px-3 py-1 text-2xs font-semibold uppercase tracking-widest text-white rounded-full shadow-lg">
                          Before/After
                        </span>
                      )}
                      <button
                        onClick={() => setFullscreen(item)}
                        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center bg-white/90 text-charcoal rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-white shadow-lg hover:scale-110"
                        aria-label="Full screen"
                      >
                        <Maximize2 size={18} strokeWidth={1.5} />
                      </button>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                          <Play size={20} strokeWidth={1.5} className="ml-1 text-charcoal" />
                        </div>
                      </div>
                    </div>
                    <div className="pt-5">
                      <h3 className="font-['Playfair_Display'] text-2xl font-medium text-charcoal group-hover:text-bronze transition-colors">{item.title}</h3>
                      {item.description && (
                        <p className="mt-2 text-sm leading-relaxed text-stone line-clamp-2">{item.description}</p>
                      )}
                      {item.category && (
                        <p className="mt-2 text-2xs font-semibold uppercase tracking-widest text-bronze">{item.category}</p>
                      )}
                      {item.services?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.services.map((s, idx) => (
                            <span key={idx} className="border border-champagne/50 px-3 py-1 text-2xs font-medium uppercase tracking-widest text-charcoal/55 rounded-full hover:border-bronze transition">
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

      {/* Consultation Packages */}
      <section className="relative overflow-hidden bg-charcoal">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,138,90,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(232,211,190,0.06),transparent_60%)]" />
        <div className="relative section-pad">
          <div className="container-narrow px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne/50 mb-4">Start Your Journey</p>
              <h2 className="font-['Playfair_Display'] text-4xl font-medium text-white md:text-5xl lg:text-6xl leading-[1.05]">
                Ready to Transform<br />Your Space?
              </h2>
              <p className="mt-6 max-w-lg mx-auto text-base text-white/50 leading-relaxed">
                Book a virtual consultation and let our experts bring your dream interior to life.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link to="/virtual-interior-design" className="inline-flex items-center gap-3 rounded-full bg-bronze px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:bg-bronzeDark hover:shadow-[0_10px_40px_rgba(184,138,90,0.2)] hover:-translate-y-0.5">
                  <Sparkles size={14} strokeWidth={1.5} />
                  Book Virtual Consultation
                </Link>
                <Link to="/portfolio" className="inline-flex items-center justify-center gap-3 rounded-full border border-white/25 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:bg-white hover:text-charcoal hover:border-white">
                  View Portfolio
                </Link>
              </div>
            </motion.div>

            {/* Consultation Packages */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-24"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne/50 mb-12 text-center">Consultation Packages</p>
              <div className="grid gap-8 md:grid-cols-3">
                {consultationPackages.map((pkg, i) => (
                  <motion.div
                    key={pkg.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className={`relative group p-8 rounded-3xl bg-white/5 border ${pkg.popular ? 'border-bronze/30' : 'border-white/10'} ${pkg.popular ? 'shadow-[0_0_0_1px_rgba(184,138,90,0.2)]' : ''}`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-bronze text-white text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-2">{pkg.name}</p>
                    <div className="mb-4">
                      <span className="font-['Playfair_Display'] text-4xl font-medium text-white">{pkg.price}</span>
                      <span className="text-white/40 ml-2">/ project</span>
                    </div>
                    <p className="text-sm text-white/50 mb-6">{pkg.description}</p>
                    <ul className="space-y-3 mb-8">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-white/70">
                          <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-bronze/20 flex items-center justify-center">
                            <Zap size={10} strokeWidth={2} className="text-bronze" />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button className={`w-full rounded-full py-3 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-300 ${pkg.popular ? 'bg-bronze text-white hover:bg-bronzeDark hover:shadow-[0_10px_40px_rgba(184,138,90,0.2)]' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}>
                      Select Package
                    </button>
                  </motion.div>
                ))}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/98 p-4 md:p-8 backdrop-blur-sm"
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
                <h2 className="font-['Playfair_Display'] text-3xl font-medium text-charcoal">{fullscreen.title}</h2>
                {fullscreen.description && (
                  <p className="mt-3 text-sm text-charcoal/60 leading-relaxed">{fullscreen.description}</p>
                )}

                {fullscreen.beforeAfterImages?.length > 0 && (
                  <div className="mt-8">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-bronze mb-4">Before & After Gallery</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {fullscreen.beforeAfterImages.map((img, idx) => (
                        <div key={idx} className="relative overflow-hidden rounded-2xl">
                          <img src={img.url} alt={img.label || `View ${idx + 1}`} className="w-full object-cover aspect-[4/3] hover:scale-105 transition duration-500" />
                          {img.label && (
                            <p className="absolute bottom-3 left-3 bg-charcoal/80 text-white text-2xs px-3 py-1.5 rounded-full">{img.label}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {fullscreen.services?.length > 0 && (
                  <div className="mt-8">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-bronze mb-4">Services Included</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {fullscreen.services.map((s, idx) => (
                        <div key={idx} className="border border-champagne/40 p-4 rounded-2xl hover:border-bronze transition">
                          <p className="font-medium text-charcoal">{s.title}</p>
                          <p className="text-sm text-charcoal/50 mt-1">{s.description}</p>
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