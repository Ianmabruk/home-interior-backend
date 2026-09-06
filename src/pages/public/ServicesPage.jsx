import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { motion } from 'framer-motion'
import { Loader2, X, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@services/api'
import { getOptimizedUrl, buildSrcSet } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload, dispatchAdminDataChanged } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { toast } from 'react-hot-toast'
import { useIsMobile } from '@hooks/useIsMobile'

const SkeletonServices = () => (
  <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Services</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          What We Do
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="group flex flex-col items-center text-center">
            <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--secondary)]/60 text-[var(--primary)] skeleton" />
            <h3 className="font-display text-xl md:text-2xl font-medium text-[var(--primary)] leading-tight skeleton" />
            <p className="mt-2 text-sm text-[var(--primary)]/60 leading-relaxed skeleton" />
          </div>
        ))}
      </div>
    </div>
  </section>
)

export const ServicesPage = memo(() => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [_selectedService, setSelectedService] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    projectDescription: '',
    service: '',
    image1: null,
    image2: null,
  })
  const [image1Preview, setImage1Preview] = useState(null)
  const [image2Preview, setImage2Preview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const reduceMotion = useIsMobile()
  const fileInput1Ref = useRef(null)
  const fileInput2Ref = useRef(null)

  const loadServices = useCallback(async () => {
    setError(null)
    try {
      const res = await api.get('/services')
      setServices(res.data || [])
    } catch (err) {
      console.warn('[SERVICES] Failed to load:', err?.message)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const retry = useCallback(() => {
    setLoading(true)
    loadServices()
  }, [loadServices])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'services-changed') loadServices()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadServices])

  useEffect(() => {
    const handleOnline = () => {
      if (error) loadServices()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [error, loadServices])

  const handleImageChange = (field, e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file)
      setFormData(prev => ({ ...prev, [field]: file }))
      if (field === 'image1') setImage1Preview(preview)
      if (field === 'image2') setImage2Preview(preview)
    }
  }

  const removeImage = (field) => {
    setFormData(prev => ({ ...prev, [field]: null }))
    if (field === 'image1') setImage1Preview(null)
    if (field === 'image2') setImage2Preview(null)
    if (field === 'image1' && fileInput1Ref.current) fileInput1Ref.current.value = ''
    if (field === 'image2' && fileInput2Ref.current) fileInput2Ref.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.projectDescription.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('name', formData.fullName)
      payload.append('phone', formData.phoneNumber)
      payload.append('email', formData.email)
      payload.append('message', formData.projectDescription)
      payload.append('projectType', formData.service || '')
      payload.append('type', 'consultation')

      if (formData.image1) payload.append('images', formData.image1)
      if (formData.image2) payload.append('images', formData.image2)

      await api.post('/consultations', payload)

      toast.success('Consultation request submitted successfully!')
      setFormOpen(false)
      setSelectedService(null)
      setFormData({
        fullName: '',
        phoneNumber: '',
        email: '',
        projectDescription: '',
        service: '',
        image1: null,
        image2: null,
      })
      setImage1Preview(null)
      setImage2Preview(null)
      dispatchAdminDataChanged('consultations-changed')
    } catch (err) {
      toast.error(err?.message || 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return <main><SkeletonServices /></main>
  }

  if (error && services.length === 0) {
    return (
      <main>
        <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide text-center">
            <h2 className="font-display text-4xl font-medium leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">What We Do</h2>
            <p className="mt-4 text-base text-[var(--primary)]/60">Unable to load services. Please check your connection.</p>
            <button onClick={retry} className="mt-6 btn-luxury-primary">Retry</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main>
      <PageMeta
        title="Services — HOK Interior Designs"
        description="Comprehensive interior design services from concept to completion."
      />
      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
        <div className="container-wide">
          <div className="mb-16 md:mb-24 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Services</p>
            <h2 className="font-display text-4xl font-medium leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
              What We Do
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
              Comprehensive interior design services tailored to elevate your space with timeless elegance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            {services.map((service, index) => (
              <motion.article
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col items-center text-center"
              >
                <div className="relative mb-8">
                  <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--secondary)]/60 text-[var(--primary)] group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-500">
                    {service.imageUrl || service.mediaUrl ? (
                      <img
                        src={getOptimizedUrl(service.imageUrl || service.mediaUrl, { width: 120, crop: 'limit' })}
                        srcSet={buildSrcSet(service.imageUrl || service.mediaUrl) || undefined}
                        sizes={buildSrcSet(service.imageUrl || service.mediaUrl) ? '120px' : undefined}
                        alt={service.title}
                        className="h-full w-full object-cover rounded-3xl"
                        loading="lazy"
                        decoding="async"
                        width={120}
                        height={120}
                      />
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a6 6 0 0 0 9 4 9 9 0 1 1-9-9Z" />
                        <line x1="21" y1="9" x2="15.5" y2="14.5" />
                        <line x1="15" y1="15" x2="14" y2="16" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="font-display text-xl md:text-2xl font-medium text-[var(--primary)] leading-tight mb-3">
                  {service.title}
                </h3>
                <p className="text-base text-[var(--primary)]/60 leading-relaxed mb-6 max-w-xs">
                  {service.description || 'Premium interior design service tailored to your unique vision and requirements.'}
                </p>
                <button
                  onClick={() => { setSelectedService(service); setFormOpen(true); setFormData(prev => ({ ...prev, service: service.title })) }}
                  className="btn-luxury-primary group inline-flex items-center gap-2 w-full max-w-xs"
                >
                  {service.buttonText || 'Request This Service'}
                  <Send size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </motion.article>
            ))}
          </div>

          {services.length === 0 && (
            <div className="text-center py-20">
              <p className="font-display text-xl text-[var(--primary)]/60">No services available at the moment.</p>
            </div>
          )}

          {/* INTERNAL LINKS */}
          <div className="mt-16 text-center">
            <p className="text-[var(--primary)]/60 mb-4">Ready to transform your space?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/portfolio" className="btn-luxury-secondary">View Our Work</Link>
              <Link to="/contact" className="btn-luxury-primary">Book a Consultation</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Book Consultation Modal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={formOpen ? { opacity: 1 } : { opacity: 0 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--primary)]/40 backdrop-blur-sm ${formOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onClick={() => setFormOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setFormOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full text-[var(--primary)]/40 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/30 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} strokeWidth={1.5} />
          </button>

          <div className="text-center mb-8">
            <h3 className="font-display text-3xl font-medium text-[var(--primary)]">Book a Consultation</h3>
            <p className="mt-2 text-[var(--primary)]/60">Tell us about your project and we'll get back to you within 24 hours.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[var(--primary)] mb-1">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--primary)] mb-1">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                />
              </div>
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-[var(--primary)] mb-1">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
              />
            </div>
            <div>
              <label htmlFor="projectDescription" className="block text-sm font-medium text-[var(--primary)] mb-1">Describe Your Project *</label>
              <textarea
                id="projectDescription"
                name="projectDescription"
                value={formData.projectDescription}
                onChange={handleChange}
                required
                rows={4}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none min-h-[120px]"
                placeholder="Describe your project requirements, style preferences, timeline, and any specific needs..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--primary)] mb-3">Upload Reference Images (Optional, max 2)</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    ref={fileInput1Ref}
                    type="file"
                    accept="image/*"
                    id="image1"
                    onChange={(e) => handleImageChange('image1', e)}
                    className="hidden"
                  />
                  <label
                    htmlFor="image1"
                    className={`cursor-pointer relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
                      image1Preview
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                        : 'border-[var(--border)] bg-[var(--bg)]/30'
                    }`}
                  >
                    {image1Preview ? (
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[var(--primary)]">Image 1</p>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); removeImage('image1') }}
                            className="text-xs text-[var(--error)] hover:text-[var(--primary)] font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="relative rounded-xl overflow-hidden group">
                          <img src={image1Preview} alt="Preview" className="h-32 w-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); removeImage('image1') }}
                            className="absolute top-2 right-2 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-[var(--primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-6">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-[var(--accent)]">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        <p className="text-sm text-[var(--primary)]/60 text-center">Click to upload</p>
                      </div>
                    )}
                  </label>
                </div>
                <div className="relative">
                  <input
                    ref={fileInput2Ref}
                    type="file"
                    accept="image/*"
                    id="image2"
                    onChange={(e) => handleImageChange('image2', e)}
                    className="hidden"
                  />
                  <label
                    htmlFor="image2"
                    className={`cursor-pointer relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
                      image2Preview
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                        : 'border-[var(--border)] bg-[var(--bg)]/30'
                    }`}
                  >
                    {image2Preview ? (
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[var(--primary)]">Image 2</p>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); removeImage('image2') }}
                            className="text-xs text-[var(--error)] hover:text-[var(--primary)] font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="relative rounded-xl overflow-hidden group">
                          <img src={image2Preview} alt="Preview" className="h-32 w-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); removeImage('image2') }}
                            className="absolute top-2 right-2 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-[var(--primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-6">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-[var(--accent)]">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        <p className="text-sm text-[var(--primary)]/60 text-center">Click to upload</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-luxury-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Request
                  <Send size={14} strokeWidth={1.5} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </main>
  )
})

ServicesPage.displayName = 'ServicesPage'

export default ServicesPage