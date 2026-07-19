import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api } from '../../services/api'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

export const ServicesPage = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  const loadServices = async () => {
    try {
      const res = await api.get('/content/services')
      setServices(Array.isArray(res.data) ? res.data : res.data?.items || [])
    } catch (err) {
      console.warn('[SERVICES] Failed to load:', err?.message)
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial data load is a standard pattern
    loadServices() 
  }, [])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'services-changed') loadServices()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/80 to-[var(--primary)]/60" />
          <div className="relative z-10 flex h-full items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]/80 mb-4">Services</p>
              <h1 className="font-display text-5xl font-normal leading-tight text-white md:text-7xl lg:text-8xl">Loading...</h1>
            </motion.div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Page Header */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={getOptimizedUrl('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2000&q=80', { width: 2000, crop: 'limit' })}
            alt="Luxury interior design services"
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/65 via-[var(--primary)]/75 to-transparent" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.15),transparent_50%)]" />
        <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--bg)]/80 mb-4">Our Services</p>
            <h1 className="font-display text-5xl font-normal leading-tight text-white md:text-7xl lg:text-8xl">
              What We Do
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/60 leading-relaxed">
              Comprehensive interior design services tailored to elevate your space with timeless elegance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-pad bg-[var(--bg)] pt-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          {loading && (
            <div className="grid gap-8 grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="group">
                  <div className="skeleton aspect-square w-full rounded-3xl mb-8" />
                  <div className="skeleton h-6 w-full mb-2" />
                  <div className="skeleton h-4 w-3/4" />
                </div>
              ))}
            </div>
          )}

          {!loading && services.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-24 text-center"
            >
              <p className="font-display text-3xl text-[var(--primary)]/30">No services configured</p>
            </motion.div>
          )}

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            className="grid gap-8 md:gap-10 lg:gap-12 grid-cols-2 lg:grid-cols-3"
          >
            {services.filter(s => s.isActive).map((item) => {
              const IconComponent = {
                LayoutGrid: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
                Brush: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 4 9 9 0 1 1-9-9Z"/><line x1="21" y1="9" x2="15.5" y2="14.5"/><line x1="15" y1="15" x2="14" y2="16"/></svg>,
                MonitorSmartphone: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8V5a2 2 0 0 0-2-2H4"/><path d="M17 9h.01"/><rect width="6" height="10" x="16" y="12" rx="2"/><path d="M6 12h.01"/><rect width="6" height="12" x="4" y="8" rx="2"/></svg>,
                Armchair: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>,
                Search: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
                Sparkles: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2.2"/><path d="M16.38 4.74l1.06 1.06"/><path d="M18 12h2.2"/><path d="M21 16.38l-1.06 1.06"/><path d="M12 21v-2.2"/><path d="M7.64 19.34l1.06-1.06"/><path d="M3 12h-2.2"/><path d="M4.74 4.74l-1.06 1.06"/></svg>,
              }[item.icon] || (() => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/></svg>)
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
            })}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-16 md:mt-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Ready to Start?</p>
            <h2 className="font-display text-3xl md:text-4xl font-normal text-[var(--primary)] mb-6">
              Let&apos;s Create Something Beautiful
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed mb-10">
              From concept to completion, we guide you through every step of the design journey.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-consultation'))}
                className="btn-luxury-primary group px-8 py-4 text-[11px] rounded-xl"
              >
                Book Consultation
                <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <Link
                to="/portfolio"
                className="group btn-luxury-secondary px-8 py-4 text-[11px] rounded-xl"
              >
                View Portfolio
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}