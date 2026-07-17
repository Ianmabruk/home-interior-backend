import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { X, ArrowLeft, ChevronLeft, ChevronRight, CalendarCheck, ArrowRight } from 'lucide-react'
import { api } from '../../services/api'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const getProjectImages = (project) => {
  const images = []
  if (project.imageUrl) images.push(project.imageUrl)
  if (project.gallery && Array.isArray(project.gallery)) {
    project.gallery.forEach(img => {
      const url = typeof img === 'string' ? img : img.url
      if (url && !images.includes(url)) images.push(url)
    })
  }
  return images
}

export const PortfolioDetailPage = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [imageFullscreen, setImageFullscreen] = useState(null)

  // Zoom state
  const [zoomScale, setZoomScale] = useState(1)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const imageRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/content/portfolio/${id}`)
        setProject(res.data)
      } catch {
        setProject(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (project) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [project])

  useEffect(() => {
    setTimeout(() => {
      setGalleryIndex(0)
    }, 0)
  }, [project])

  const projectImages = project ? getProjectImages(project) : []

  const closeModal = useCallback(() => {
    setImageFullscreen(null)
    setGalleryIndex(0)
    setZoomScale(1)
    setZoomPosition({ x: 0, y: 0 })
  }, [])

  // Reset zoom when image changes
  useEffect(() => {
    setTimeout(() => {
      setZoomScale(1)
      setZoomPosition({ x: 0, y: 0 })
      isDragging.current = false
    }, 0)
  }, [galleryIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!imageFullscreen) return

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          closeModal()
          break
        case 'ArrowLeft':
          e.preventDefault()
          setGalleryIndex((prev) => (prev === 0 ? projectImages.length - 1 : prev - 1))
          break
        case 'ArrowRight':
          e.preventDefault()
          setGalleryIndex((prev) => (prev === projectImages.length - 1 ? 0 : prev + 1))
          break
      }
    }

    if (imageFullscreen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [imageFullscreen, projectImages.length, closeModal])

  // Touch/swipe navigation
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const handleTouchStart = (e) => {
    if (!imageFullscreen) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    if (!imageFullscreen || touchStartX.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const diffX = touchStartX.current - touchEndX
    const diffY = touchStartY.current - touchEndY

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        setGalleryIndex((prev) => (prev === projectImages.length - 1 ? 0 : prev + 1))
      } else {
        setGalleryIndex((prev) => (prev === 0 ? projectImages.length - 1 : prev - 1))
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  // Zoom handlers
  const handleWheel = (e) => {
    if (!imageFullscreen) return
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setZoomScale((prev) => {
        const newScale = Math.min(Math.max(prev - e.deltaY * 0.001, 1), 4)
        return newScale
      })
    }
  }

  const handleMouseDown = (e) => {
    if (zoomScale <= 1) return
    isDragging.current = true
    dragStart.current = { x: e.clientX - zoomPosition.x, y: e.clientY - zoomPosition.y }
    if (imageRef.current) imageRef.current.style.cursor = 'grabbing'
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current || zoomScale <= 1) return
    setZoomPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }

  const handleMouseUp = () => {
    isDragging.current = false
    if (imageRef.current) imageRef.current.style.cursor = 'grab'
  }

  const handleDoubleClick = () => {
    setZoomScale((prev) => (prev > 1 ? 1 : 2))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)]">
        <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/80 to-[var(--primary)]/60" />
          <div className="relative z-10 flex h-full items-center justify-center px-6">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]/80 mb-4">Portfolio</p>
              <h1 className="font-display text-5xl font-normal leading-tight text-white md:text-7xl lg:text-8xl">Loading...</h1>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[var(--bg)]">
        <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/80 to-[var(--primary)]/60" />
          <div className="relative z-10 flex h-full items-center justify-center px-6">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]/80 mb-4">Portfolio</p>
              <h1 className="font-display text-5xl font-normal leading-tight text-white md:text-7xl lg:text-8xl">Project Not Found</h1>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src={getOptimizedUrl(projectImages[galleryIndex] || project.imageUrl, { width: 1920, crop: 'limit' })}
          alt={project.title}
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/85 via-[var(--primary)]/50 to-[var(--primary)]/30" />
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-4xl"
          >
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-widest">Back to Portfolio</span>
            </Link>
            {project.category && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4"
              >
                {project.category}
              </motion.p>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-5xl font-normal leading-tight text-white md:text-7xl lg:text-8xl"
            >
              {project.title}
            </motion.h1>
            {project.description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto"
              >
                {project.description}
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="section-pad bg-[var(--bg)] pt-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          {projectImages.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <p className="text-sm text-[var(--primary)]/50 text-center">
                {projectImages.length} images &mdash; Click any image to view fullscreen
              </p>
            </motion.div>
          )}

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {projectImages.map((img, idx) => (
              <motion.article
                key={idx}
                variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }}
                className="group"
              >
                <div className="relative overflow-hidden rounded-3xl bg-white border border-[var(--border)] shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={getOptimizedUrl(img, { width: 800 })}
                      alt={`${project.title} - Image ${idx + 1}`}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); setImageFullscreen({ imageUrl: img, title: project.title, category: project.category }); setGalleryIndex(idx) }}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      aria-label="View fullscreen"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]">
                          <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>

          {/* Project Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16 md:mt-24 max-w-3xl mx-auto text-center"
          >
            {project.description && (
              <div className="mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-normal text-[var(--primary)] mb-4">Description</h2>
                <p className="text-base leading-relaxed text-[var(--primary)]/70">{project.description}</p>
              </div>
            )}
            
            {/* Project Meta */}
            <div className="grid gap-4 md:grid-cols-3 mb-12">
              {project.location && (
                <div className="flex items-center justify-center gap-3 text-sm text-[var(--primary)]/60">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{project.location}</span>
                </div>
              )}
              {project.completionDate && (
                <div className="flex items-center justify-center gap-3 text-sm text-[var(--primary)]/60">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Completed: {project.completionDate}</span>
                </div>
              )}
              {project.designStyle && (
                <div className="flex items-center justify-center gap-3 text-sm text-[var(--primary)]/60">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>Style: {project.designStyle}</span>
                </div>
              )}
            </div>

            {/* Conversion CTA */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-consultation'))}
                className="group btn-luxury-primary px-8 py-4 text-[11px] rounded-xl"
              >
                Book Consultation
                <CalendarCheck size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" />
              </button>
              <Link
                to="/contact"
                className="group btn-luxury-secondary px-8 py-4 text-[11px] rounded-xl"
              >
                Contact Us
                <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Image Fullscreen Modal */}
      <AnimatePresence>
        {imageFullscreen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-[var(--primary)]/98 backdrop-blur-sm"
              onClick={closeModal}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-4 md:inset-10 lg:inset-20 z-50 bg-white rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="image-fullscreen-title"
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur text-[var(--primary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-all duration-300"
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>

              {projectImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setGalleryIndex(prev => prev === 0 ? projectImages.length - 1 : prev - 1) }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 backdrop-blur text-[var(--primary)] hover:bg-white shadow-lg transition-all duration-300 hover:shadow-xl"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} strokeWidth={2} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setGalleryIndex(prev => prev === projectImages.length - 1 ? 0 : prev + 1) }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 backdrop-blur text-[var(--primary)] hover:bg-white shadow-lg transition-all duration-300 hover:shadow-xl"
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} strokeWidth={2} />
                  </button>
                </>
              )}

              <div className="relative h-full w-full flex items-center justify-center p-4" onWheel={handleWheel}>
                <img
                  ref={imageRef}
                  src={getOptimizedUrl(projectImages[galleryIndex] || imageFullscreen.imageUrl, { width: 1920 })}
                  alt={imageFullscreen.title}
                  className="max-h-[80vh] max-w-full object-contain cursor-grab"
                  style={{
                    transform: `translate(${zoomPosition.x}px, ${zoomPosition.y}px) scale(${zoomScale})`,
                    transformOrigin: 'center center',
                    transition: zoomScale > 1 ? 'none' : 'transform 0.1s ease-out',
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onDoubleClick={handleDoubleClick}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                />
              </div>

              {projectImages.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {projectImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setGalleryIndex(idx) }}
                      className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                        idx === galleryIndex
                          ? 'border-white bg-white'
                          : 'border-white/50 hover:border-white/80'
                      }`}
                      aria-label={`View image ${idx + 1}`}
                      aria-current={idx === galleryIndex ? 'true' : 'false'}
                    />
                  ))}
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-[var(--primary)]/90 to-transparent text-white">
                {imageFullscreen.category && (
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">{imageFullscreen.category}</p>
                )}
                <h2 id="image-fullscreen-title" className="font-display text-3xl md:text-4xl font-normal leading-tight">{imageFullscreen.title}</h2>
                {projectImages.length > 1 && (
                  <p className="mt-2 text-sm text-white/70">
                    Image {galleryIndex + 1} of {projectImages.length}
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}