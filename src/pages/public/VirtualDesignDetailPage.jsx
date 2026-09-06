import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight, X, Loader2, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@services/api'
import { getOptimizedUrl, buildSrcSet } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { useZoom } from '@hooks/useZoom'
import { toast } from 'react-hot-toast'
import { dispatchAdminDataChanged } from '@utils/adminEvents'

export const VirtualDesignDetailPage = () => {
  const { id } = useParams()
  const [design, setDesign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxSwipeStart, setLightboxSwipeStart] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
    preferredDate: '',
    preferredTime: '',
  })

  const { style: zoomStyle, handleWheel, handleMouseDown, handleTouchStart, handleTouchEnd, activate: activateZoom, deactivate: deactivateZoom } = useZoom()

  const loadDesign = useCallback(async () => {
    if (!id) return
    try {
      const res = await api.get(`/virtual-design/${id}`)
      setDesign(res.data || null)
    } catch (err) {
      console.warn('[VIRTUAL DESIGN DETAIL] Failed to load:', err?.message)
      setDesign(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  const openBooking = () => {
    setFormData((prev) => ({ ...prev, service: design?.title || '' }))
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('name', formData.name)
      payload.append('email', formData.email)
      payload.append('phone', formData.phone)
      payload.append('message', formData.message)
      payload.append('projectType', formData.service || 'e-design')
      payload.append('type', 'e-design')
      payload.append('packageName', design?.title || '')
      payload.append('packagePrice', design?.price || '0')
      payload.append('paymentStatus', 'pending')
      payload.append('preferredDate', formData.preferredDate || '')
      payload.append('preferredTime', formData.preferredTime || '')

      await api.post('/consultations', payload)
      toast.success('E-design package request submitted successfully!')
      setModalOpen(false)
      setFormData({ name: '', email: '', phone: '', service: '', message: '', preferredDate: '', preferredTime: '' })
      dispatchAdminDataChanged('consultations-changed')
    } catch (err) {
      toast.error(err?.message || 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  useEffect(() => {
    loadDesign()
  }, [loadDesign])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'virtual-changed') loadDesign()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadDesign])

  const images = useMemo(() => {
    if (!design) return []
    const imgArray = []
    if (design.imageUrl || design.mediaUrl) imgArray.push(design.imageUrl || design.mediaUrl)
    const gallery = design.galleryImages || design.galleryMedia || []
    if (Array.isArray(gallery) && gallery.length > 0) {
      gallery.forEach((img) => imgArray.push(typeof img === 'string' ? img : img.url))
    }
    return [...new Set(imgArray.filter(Boolean))]
  }, [design])

  const handleLightboxNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const handleLightboxPrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') { setLightboxOpen(false); deactivateZoom() }
      if (e.key === 'ArrowRight') { setCurrentImageIndex((prev) => (prev + 1) % images.length) }
      if (e.key === 'ArrowLeft') { setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
   }, [lightboxOpen, images.length, deactivateZoom])

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </main>
    )
  }

  if (!design) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-3">Package Not Found</h1>
          <p className="text-[var(--primary)]/60 mb-6">The E-Design package you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link to="/virtual-design" className="btn-luxury-primary inline-flex items-center gap-2">
            Back to E-Design Packages
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main>
      <PageMeta
        title={`${design.title} — HOK Interior Designs`}
        description={design.description || `Explore ${design.title} virtual design project.`}
        image={images[0]}
      />
      <div className="min-h-screen bg-[var(--bg)]">
        {/* Gallery Grid */}
        <section className="px-6 md:px-12 lg:px-20 py-12 md:py-20">
          <div className="container-wide">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((img, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => { setCurrentImageIndex(index); setLightboxOpen(true); activateZoom() }}
                  className="relative aspect-[4/3] group rounded-2xl overflow-hidden bg-[var(--secondary)]/40 border border-[var(--border)]/20 transition-all duration-300 hover:border-[var(--accent)]/30"
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={getOptimizedUrl(img, { width: 600, crop: 'fill' })}
                    srcSet={buildSrcSet(img) || undefined}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    alt={`${design.title} - Image ${index + 1}`}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    fetchPriority={index === 0 ? 'high' : 'low'}
                  />
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* Project Details */}
        <section className="px-6 md:px-12 lg:px-20 py-16 md:py-24">
          <div className="container-wide">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-10">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">{design.category || 'Virtual Design'}</p>
                  <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-[var(--primary)] leading-tight">
                    {design.title}
                  </h1>
                  {design.location && (
                    <p className="mt-3 text-base md:text-lg text-[var(--primary)]/60 flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {design.location}
                    </p>
                  )}
                </div>

                {design.description && (
                  <div className="prose prose-lg max-w-none text-[var(--primary)]/70">
                    <p className="leading-relaxed">{design.description}</p>
                  </div>
                )}

                {design.features && design.features.length > 0 && (
                  <div>
                    <h3 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-6">Key Features</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {design.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-[var(--border)]/40">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <span className="text-[var(--primary)]/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {design.specifications && Object.keys(design.specifications).length > 0 && (
                  <div>
                    <h3 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-6">Specifications</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(design.specifications).map(([key, value]) => (
                        <div key={key} className="p-4 bg-white rounded-2xl border border-[var(--border)]/40">
                          <dt className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-1">{key}</dt>
                          <dd className="text-[var(--primary)]/80">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="sticky top-24 bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
                  <h3 className="font-display text-xl font-medium text-[var(--primary)] mb-6">Book This Package</h3>
                  <p className="text-[var(--primary)]/60 mb-6">Interested in this package? Book a consultation and we will get back to you within 24 hours.</p>
                  <button
                    onClick={openBooking}
                    className="btn-luxury-primary w-full inline-flex items-center justify-center gap-2"
                  >
                    Book This Package
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </button>
                </div>

                {design.relatedProjects && design.relatedProjects.length > 0 && (
                  <div>
                    <h3 className="font-display text-xl font-medium text-[var(--primary)] mb-4">Related Projects</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {design.relatedProjects.slice(0, 2).map((related, index) => (
                        <Link
                          key={related.id || index}
                           to={`/virtual-design/${related.id}`}
                          className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-[var(--secondary)]/30"
                        >
                          {related.imageUrl && (
                            <img
                              src={getOptimizedUrl(related.imageUrl, { width: 400, crop: 'limit' })}
                              alt={related.title}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/70 via-transparent to-transparent flex items-end p-4">
                            <h4 className="font-display text-lg font-medium text-white w-full">
                              {related.title}
                            </h4>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--primary)]/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-[var(--primary)]/40 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/30 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} strokeWidth={1.5} />
              </button>

              <div className="text-center mb-8">
                <h3 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-2">
                  Book a Consultation
                </h3>
                <p className="text-[var(--primary)]/60">
                  {design?.title ? `Interested in ${design.title}? Tell us about your project.` : 'Tell us about your project and we will get back to you within 24 hours.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[var(--primary)] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-luxury"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[var(--primary)] mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="input-luxury"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[var(--primary)] mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="input-luxury"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-[var(--primary)] mb-1">
                    Package of Interest
                  </label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service || design?.title || ''}
                    onChange={handleChange}
                    className="input-luxury"
                  >
                    <option value={design?.title || ''}>{design?.title || 'Select a package'}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-[var(--primary)] mb-1">
                    Project Details
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="input-luxury resize-none min-h-[120px]"
                    placeholder="Tell us about your space, timeline, and budget..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="preferredDate" className="block text-sm font-medium text-[var(--primary)] mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      id="preferredDate"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleChange}
                      className="input-luxury"
                    />
                  </div>
                  <div>
                    <label htmlFor="preferredTime" className="block text-sm font-medium text-[var(--primary)] mb-1">
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      id="preferredTime"
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleChange}
                      className="input-luxury"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-luxury-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Request Consultation
                      <Send size={14} strokeWidth={1.5} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--primary)]/95 backdrop-blur-sm flex items-center justify-center"
             onClick={() => { setLightboxOpen(false); deactivateZoom() }}
             role="dialog"
             aria-modal="true"
             aria-label="Fullscreen gallery"
           >
            <button
              onClick={() => { setLightboxOpen(false); deactivateZoom() }}
              className="absolute top-6 left-6 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Close gallery"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

             <button
              onClick={(e) => { e.stopPropagation(); handleLightboxPrev() }}
              className="absolute left-6 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={28} strokeWidth={1.5} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleLightboxNext() }}
              className="absolute right-6 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={28} strokeWidth={1.5} />
            </button>

            <div
              style={zoomStyle}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onTouchStart={(e) => {
                setLightboxSwipeStart(e.touches[0]?.clientX || 0)
                handleTouchStart(e)
              }}
              onTouchMove={(e) => { try { e.preventDefault() } catch { /* noop */ } }}
              onTouchEnd={(e) => {
                handleTouchEnd(e)
                const delta = (e.changedTouches[0]?.clientX || 0) - lightboxSwipeStart
                if (Math.abs(delta) > 50 && images.length > 1) {
                  if (delta > 0) { handleLightboxPrev() }
                  else { handleLightboxNext() }
                }
              }}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              className="relative max-h-[90vh] max-w-[90vw]"
            >
              <AnimatePresence mode="wait">
                 <motion.img
                   key={currentImageIndex}
                   src={getOptimizedUrl(images[currentImageIndex], { width: 2560, crop: 'limit' })}
                   srcSet={buildSrcSet(images[currentImageIndex]) || undefined}
                   sizes="90vw"
                   alt={`${design.title} - Image ${currentImageIndex + 1}`}
                   className="max-h-[90vh] max-w-[90vw] object-contain"
                   initial={{ opacity: 0, scale: 1.05 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                 />
              </AnimatePresence>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index) }}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default VirtualDesignDetailPage