import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@services/api'
import { PageMeta } from '@hooks/usePageMeta'
import { getOptimizedUrl, buildSrcSet } from '@utils/cloudinaryHelpers'

const SkeletonTestimonials = () => (
  <main>
    <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
      <div className="container-wide">
        <div className="mb-16 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Testimonials</p>
          <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
            Testimonials
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </section>
  </main>
)

const renderStars = (rating, size = 14) => (
  <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={size}
        strokeWidth={1.5}
        className={i < rating ? 'text-accentOrange fill-accentOrange' : 'text-[var(--border)]'}
      />
    ))}
  </div>
)

export const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const fetchTestimonials = useCallback(async () => {
    setError(null)
    try {
      const res = await api.get('/testimonials')
      setTestimonials(res.data || [])
    } catch (err) {
      console.warn('[TESTIMONIALS] Failed to load:', err?.message)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const retry = useCallback(() => {
    setLoading(true)
    fetchTestimonials()
  }, [fetchTestimonials])

  useEffect(() => {
    fetchTestimonials()
  }, [fetchTestimonials])

  useEffect(() => {
    const handleOnline = () => {
      if (error) fetchTestimonials()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [error, fetchTestimonials])

  const activeTestimonials = useMemo(() => {
    return testimonials.filter((t) => t.isActive !== false)
  }, [testimonials])

  const lightboxImages = useMemo(() => {
    return activeTestimonials
      .filter((t) => t.photoUrl)
      .map((t) => t.photoUrl)
  }, [activeTestimonials])

  const openLightbox = (index) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)
  }

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length)
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') { setLightboxIndex((prev) => (prev + 1) % lightboxImages.length) }
      if (e.key === 'ArrowLeft') { setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen, lightboxImages.length])

  if (loading) {
    return <SkeletonTestimonials />
  }

  if (error && testimonials.length === 0) {
    return (
      <main>
        <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-[var(--bg)]" />
          <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 text-center">
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-tight">Testimonials</h1>
            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto">Unable to load testimonials. Please check your connection.</p>
            <button onClick={retry} className="mt-6 btn-luxury-primary">Retry</button>
          </div>
        </section>
      </main>
    )
  }

  const isImageOnly = (t) => t.photoUrl && !t.content && !t.testimonial && !t.rating

  return (
    <main>
      <PageMeta
        title="Testimonials — HOK Interior Designs"
        description="Read what our clients say about HOK Interior Designs."
      />
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-[var(--bg)]" />
        <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-tight"
          >
            Testimonials
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
          >
            Hear from our clients about their experience working with HOK Interiors.
          </motion.p>
        </div>
      </section>

      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <div className="container-wide">
          {activeTestimonials.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/40 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/20">
                <Quote size={32} />
              </div>
              <p className="font-display text-xl text-[var(--primary)]/30">
                No testimonials yet
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {activeTestimonials.map((t, i) => {
                const imageOnly = isImageOnly(t)
                return (
                  <motion.div
                    key={t._id || t.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-white rounded-2xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)] flex flex-col ${
                      imageOnly ? 'overflow-hidden' : ''
                    }`}
                  >
                    {imageOnly ? (
                      <div
                        className="relative cursor-zoom-in group mb-4"
                        onClick={() => openLightbox(i)}
                      >
                        <img
                          src={getOptimizedUrl(t.photoUrl, { width: 800, crop: 'fill' })}
                          srcSet={buildSrcSet(t.photoUrl) || undefined}
                          sizes="(max-width: 768px) 80vw, (max-width: 1024px) 40vw, 33vw"
                          alt={t.clientName || 'Testimonial'}
                          className="w-full h-auto object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="text-white text-xs font-medium">Click to view full image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {t.photoUrl ? (
                            <img src={getOptimizedUrl(t.photoUrl, { width: 200, crop: 'fill' })} alt={t.clientName} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <span className="text-[var(--accent)] text-lg font-semibold">
                              {(t.clientName || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-medium text-[var(--primary)]">{t.clientName || 'Anonymous'}</h3>
                          {t.company && (
                            <p className="text-sm text-[var(--primary)]/60">{t.company}{t.position ? ` — ${t.position}` : ''}</p>
                          )}
                          {!t.company && t.position && (
                            <p className="text-sm text-[var(--primary)]/60">{t.position}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {!imageOnly && (
                      <div className="mb-4">
                        {renderStars(t.rating)}
                      </div>
                    )}
                    {!imageOnly && (
                      <p className="text-[var(--primary)]/70 leading-relaxed flex-1">
                        &ldquo;{t.content || t.testimonial}&rdquo;
                      </p>
                    )}
                    {!imageOnly && t.project && (
                      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                        Project: {t.project}
                      </p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* INTERNAL LINKS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-[var(--primary)]/60 mb-4">Prefer to explore first?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/portfolio" className="btn-luxury-secondary">View Portfolio</Link>
              <Link to="/services" className="btn-luxury-secondary">Our Services</Link>
              <Link to="/contact" className="btn-luxury-secondary">Contact Us</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial Image Lightbox */}
      <AnimatePresence>
        {lightboxOpen && lightboxImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--primary)]/95 backdrop-blur-sm flex items-center justify-center"
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label="Testimonial image"
          >
            <button
              onClick={(e) => { e.stopPropagation(); closeLightbox() }}
              className="absolute top-6 left-6 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X size={28} strokeWidth={1.5} />
            </button>

            {lightboxImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prevImage() }}
                className="absolute left-6 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft size={28} strokeWidth={1.5} />
              </button>
            )}

            <div
              className="relative max-h-[90vh] max-w-[90vw] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
               <motion.img
                 key={lightboxIndex}
                 src={getOptimizedUrl(lightboxImages[lightboxIndex], { width: 2560, crop: 'limit' })}
                 srcSet={buildSrcSet(lightboxImages[lightboxIndex]) || undefined}
                 sizes="90vw"
                 alt="Testimonial"
                 className="max-h-[90vh] max-w-[90vw] object-contain"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 transition={{ duration: 0.3 }}
               />
            </div>

            {lightboxImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); nextImage() }}
                className="absolute right-6 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Next"
              >
                <ChevronRight size={28} strokeWidth={1.5} />
              </button>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {lightboxImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(index) }}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === lightboxIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default TestimonialsPage
