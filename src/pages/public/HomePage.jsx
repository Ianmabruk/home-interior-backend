import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Maximize2, Play, CalendarCheck, ShoppingBag } from 'lucide-react'
import { Hero } from '../../components/Hero'
import { AboutPreview } from '../../components/AboutPreview'
import { ConsultationModal } from '../../components/ConsultationModal'
import { api } from '../../services/api'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'

export const HomePage = () => {
  const [showModal, setShowModal] = useState(false)
  const [portfolio, setPortfolio] = useState([])
  const [services, setServices] = useState([])
  const [virtualDesigns, setVirtualDesigns] = useState([])
  const [products, setProducts] = useState([])
  const [featuredPortfolio, setFeaturedPortfolio] = useState([])
  const [featuredVirtualDesigns, setFeaturedVirtualDesigns] = useState([])
  const [about, setAbout] = useState(null)
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      // Use the combined homepage endpoint for all data
      const [homepageRes, productsRes] = await Promise.all([
        api.get('/content/homepage'),
        api.get('/products?limit=8&featured=true'),
      ])
      
      const homepageData = homepageRes.data || {}
      setPortfolio(homepageData.portfolio || [])
      setServices(homepageData.services || [])
      setVirtualDesigns(homepageData.virtualInteriorDesign || homepageData.virtualDesigns || [])
      setFeaturedPortfolio(homepageData.featuredPortfolio || [])
      setFeaturedVirtualDesigns(homepageData.featuredVirtualDesigns || [])
      setAbout(homepageData.about || null)
      setTestimonials(homepageData.testimonials || [])
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.items || [])
    } catch (err) {
      console.warn('[HOME] Failed to load data:', err?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'portfolio-changed' || payload?.type === 'services-changed' || payload?.type === 'virtual-changed' || payload?.type === 'products-changed') {
        loadData()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [])

  if (loading) {
    return (
      <main>
        <Hero onBookConsultation={() => setShowModal(true)} />
        <section className="bg-[var(--secondary)]/30 px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide">
            <div className="mb-16 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Portfolio</p>
              <h2 className="font-display text-4xl font-normal leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
                Featured Projects
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="group relative bg-white border border-[var(--border)]/40 overflow-hidden rounded-3xl">
                  <div className="aspect-[3/4] skeleton" />
                  <div className="p-5 border-t border-[var(--border)]/40">
                    <div className="skeleton h-3 w-20 mb-3" />
                    <div className="skeleton h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-soft-cream px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide">
            <div className="mb-16 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-4">Services</p>
              <h2 className="font-display text-4xl font-medium leading-tight text-espresso md:text-5xl lg:text-6xl">
                What We Do
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="group flex flex-col items-center text-center">
                  <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-champagne-beige/60 text-espresso skeleton" />
                  <h3 className="font-display text-xl md:text-2xl font-medium text-espresso leading-tight skeleton" />
                  <p className="mt-2 text-sm text-espresso/60 leading-relaxed skeleton" />
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--secondary)]/20 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide">
            <div className="mb-16 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Shop</p>
              <h2 className="font-display text-4xl font-medium leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
                Curated Collection
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="group">
                  <div className="skeleton aspect-square w-full rounded-3xl mb-4" />
                  <div className="skeleton h-3 w-24 mb-2" />
                  <div className="skeleton h-5 w-16" />
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide">
            <div className="mb-16 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Virtual Designs</p>
              <h2 className="font-display text-4xl font-normal leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
                Virtual Designs
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="group">
                  <div className="skeleton aspect-[4/3] w-full rounded-3xl" />
                  <div className="mt-4 space-y-2">
                    <div className="skeleton h-3 w-24" />
                    <div className="skeleton h-6 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <AboutPreview />
        <ConsultationModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </main>
    )
  }

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <main>
      <Hero onBookConsultation={() => setShowModal(true)} />

      {/* Portfolio Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-[var(--secondary)]/30 px-6 md:px-12 lg:px-20 py-20 md:py-32"
      >
        <div className="container-wide">
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

          {portfolio.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex min-h-[40vh] items-center justify-center"
            >
              <p className="font-display text-xl text-[var(--primary)]/30">No projects yet</p>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-50px' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12"
            >
              {portfolio.slice(0, 8).map((item) => (
                <motion.article
                  key={item.id}
                  variants={itemVariants}
                  className="group relative bg-white border border-[var(--border)]/40 rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)]"
                >
                  <Link to={`/portfolio/${item.id}`} className="block" aria-label={`View ${item.title} project`}>
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={getOptimizedUrl(item.imageUrl, { width: 800, crop: 'limit' })}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-[1.2s] ease-out group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </Link>

                  <div className="p-5 md:p-6 border-t border-[var(--border)]/40 bg-white">
                    <div className="flex items-center justify-between gap-4">
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => { e.preventDefault(); window.location.href = `/portfolio/${item.id}` }}
                        className="btn-luxury-primary group flex items-center gap-2 text-[10px] px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0"
                      >
                        View Project
                        <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-16 text-center"
          >
            <Link
              to="/portfolio"
              className="group inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)] transition-colors duration-300 hover:text-[var(--accent)]"
            >
              View All Projects
              <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Services Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-soft-cream px-6 md:px-12 lg:px-20 py-20 md:py-32"
      >
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="mb-16 md:mb-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-4">Services</p>
            <h2 className="font-display text-4xl font-medium leading-tight text-espresso md:text-5xl lg:text-6xl">
              What We Do
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-espresso/60 leading-relaxed">
              Comprehensive interior design services tailored to elevate your space with timeless elegance.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12"
          >
            {services.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="col-span-full flex min-h-[40vh] items-center justify-center"
              >
                <p className="font-display text-xl text-[var(--primary)]/30">No services configured</p>
              </motion.div>
            ) : (
              services.slice(0, 6).map((item) => {
                const IconMap = {
                  LayoutGrid: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
                  Brush: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 4 9 9 0 1 1-9-9Z"/><line x1="21" y1="9" x2="15.5" y2="14.5"/><line x1="15" y1="15" x2="14" y2="16"/></svg>,
                  MonitorSmartphone: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8V5a2 2 0 0 0-2-2H4"/><path d="M17 9h.01"/><rect width="6" height="10" x="16" y="12" rx="2"/><path d="M6 12h.01"/><rect width="6" height="12" x="4" y="8" rx="2"/></svg>,
                  Armchair: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>,
                  Search: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
                  Sparkles: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2.2"/><path d="M16.38 4.74l1.06 1.06"/><path d="M18 12h2.2"/><path d="M21 16.38l-1.06 1.06"/><path d="M12 21v-2.2"/><path d="M7.64 19.34l1.06-1.06"/><path d="M3 12h-2.2"/><path d="M4.74 4.74l-1.06 1.06"/></svg>,
                }
                const IconComponent = IconMap[item.icon] || IconMap.LayoutGrid
                return (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileHover={{ y: -8, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
                    className="group flex flex-col items-center text-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-champagne-beige/60 text-espresso transition-all duration-500 group-hover:bg-espresso group-hover:text-cream group-hover:scale-105"
                    >
                      <IconComponent />
                    </motion.div>
                    <h3 className="font-display text-xl md:text-2xl font-medium text-espresso leading-tight">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-espresso/60 leading-relaxed">{item.description}</p>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* Shop Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--secondary)]/20 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32"
      >
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="mb-16 md:mb-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Shop</p>
            <h2 className="font-display text-4xl font-medium leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
              Curated Collection
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
              Handpicked furniture and decor pieces to complement your interior vision.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12"
          >
            {products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="col-span-full flex min-h-[40vh] items-center justify-center"
              >
                <p className="font-display text-xl text-[var(--primary)]/30">No products available</p>
              </motion.div>
            ) : (
              products.slice(0, 8).map((item) => (
                <motion.article
                  key={item.id}
                  variants={itemVariants}
                  className="group"
                >
                  <Link to={`/shop/${item.id}`} className="block" aria-label={`View ${item.name}`}>
                    <div className="relative aspect-square overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 shadow-[0_10px_40px_rgba(42,36,31,0.06)] hover:shadow-[0_25px_80px_rgba(42,36,31,0.12)] transition-all duration-500 hover:-translate-y-1">
                      {item.images?.[0]?.url && (
                        <>
                          <img
                            src={getOptimizedUrl(item.images[0].url, { width: 640 })}
                            alt={item.name}
                            className="h-full w-full object-cover bg-[var(--bg)] transition duration-700 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </>
                      )}
                    </div>
                  </Link>

                  <div className="p-5 md:p-6 border-t border-[var(--border)]/40 bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <motion.h3
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="font-display text-xl md:text-2xl font-normal text-[var(--primary)] leading-tight mb-3 group-hover:text-[var(--accent)] transition-colors"
                        >
                          {item.name}
                        </motion.h3>
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="text-sm leading-relaxed text-[var(--primary)]/60 line-clamp-1"
                        >
                          ${Number(item.discountPrice || item.price || 0).toFixed(2)}
                        </motion.p>
                      </div>
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-luxury-primary group flex items-center gap-2 text-[10px] px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0"
                      >
                        View Product
                        <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              ))
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-16 text-center"
          >
            <Link
              to="/shop"
              className="group inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)] transition-colors duration-300 hover:text-[var(--accent)]"
            >
              View All Products
              <ShoppingBag size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
              <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Virtual Designs Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 px-6 md:px-12 lg:px-20 py-20 md:py-32"
      >
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="mb-16 md:mb-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Virtual Designs</p>
            <h2 className="font-display text-4xl font-normal leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
              Virtual Designs
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
              Immersive 3D renderings and virtual walkthroughs to visualize your space before it's built.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {virtualDesigns.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="col-span-full flex min-h-[40vh] items-center justify-center"
              >
                <p className="font-display text-xl text-[var(--primary)]/30">No virtual designs yet</p>
              </motion.div>
            ) : (
              virtualDesigns.slice(0, 8).map((item, index) => (
                <motion.article
                  key={item.id}
                  variants={itemVariants}
                  custom={index}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 shadow-[0_10px_40px_rgba(42,36,31,0.06)] hover:shadow-[0_25px_80px_rgba(42,36,31,0.12)] transition-all duration-500 hover:-translate-y-1">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {item.mediaType === 'image' && item.mediaUrl && (
                        <>
                          <img
                            src={getOptimizedUrl(item.mediaUrl, { width: 640 })}
                            alt={item.title}
                            className="h-full w-full object-contain bg-[var(--bg)] transition duration-700 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); window.location.href = `/virtual-design/project/${item.id}` }}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            aria-label="View project"
                          >
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                              <Maximize2 size={20} strokeWidth={1.5} className="text-[var(--primary)]" />
                            </div>
                          </button>
                        </>
                      )}
                      {item.mediaType === 'video' && item.mediaUrl && (
                        <>
                          <video
                            src={item.mediaUrl}
                            poster={getOptimizedUrl(item.mediaUrl, { width: 640 })}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <button
                            onClick={(e) => { e.stopPropagation(); window.location.href = `/virtual-design/project/${item.id}` }}
                            className="absolute right-3 bottom-3 flex h-11 w-11 items-center justify-center bg-white/90 text-[var(--primary)] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow-lg hover:scale-110"
                            aria-label="View project"
                          >
                            <Play size={20} strokeWidth={1.5} className="ml-1" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="p-5 md:p-6 border-t border-[var(--border)]/40 bg-white">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <motion.h3
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="font-display text-xl md:text-2xl font-normal text-[var(--primary)] leading-tight mb-3 group-hover:text-[var(--accent)] transition-colors"
                          >
                            {item.title}
                          </motion.h3>
                          {item.description && (
                            <motion.p
                              initial={{ opacity: 0, y: 10 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 }}
                              className="text-sm leading-relaxed text-[var(--primary)]/60 line-clamp-2"
                            >
                              {item.description}
                            </motion.p>
                          )}
                        </div>
                        <motion.button
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => { e.stopPropagation(); window.location.href = `/virtual-design/project/${item.id}` }}
                          className="btn-luxury-primary group flex items-center gap-2 text-[10px] px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0"
                        >
                          View Project
                          <Maximize2 size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-16 text-center"
          >
            <Link
              to="/virtual-design"
              className="group inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)] transition-colors duration-300 hover:text-[var(--accent)]"
            >
              View All Virtual Designs
              <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      <AboutPreview />
      <ConsultationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </main>
  )
}