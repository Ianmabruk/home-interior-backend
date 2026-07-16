import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { X, ArrowRight, Grid3X3, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import PositionedImage from '../../components/common/PositionedImage'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const PAGE_SIZE = 12

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] } }),
}

const getProjectImages = (project) => {
  const images = []
  if (project.imageUrl) images.push(project.imageUrl)
  if (project.images && Array.isArray(project.images)) {
    project.images.forEach(img => {
      const url = typeof img === 'string' ? img : img.url
      if (url && !images.includes(url)) images.push(url)
    })
  }
  return images
}

export const PortfolioPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(1)
  const [galleryIndex, setGalleryIndex] = useState(0)

  const loadPortfolio = () => {
    api.get('/content/portfolio')
      .then((res) => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPortfolio() }, [])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'portfolio-changed') loadPortfolio()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [])

  useEffect(() => {
    if (selected) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  useEffect(() => {
    setGalleryIndex(0)
  }, [selected])

  const filtered = items
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  }

  // Get all images for selected project
  const getProjectImages = (project) => {
    const images = []
    if (project.imageUrl) images.push(project.imageUrl)
    if (project.images && Array.isArray(project.images)) {
      project.images.forEach(img => {
        const url = typeof img === 'string' ? img : img.url
        if (url && !images.includes(url)) images.push(url)
      })
    }
    return images
  }

  const projectImages = selected ? getProjectImages(selected) : []

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Portfolio Hero Banner - Using Portfolio Image as Background */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={getOptimizedUrl(heroImage, { width: 1920, crop: 'limit' })}
            alt="Portfolio showcase"
            className="h-full w-full object-cover"
            loading="eager"
          />
          {/* Dark translucent overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/85 via-[var(--primary)]/50 to-[var(--primary)]/30" />
        </div>
        <div className="relative z-10 flex h-full items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center px-6"
          >
            <h1 className="font-display text-5xl font-normal leading-tight text-white md:text-7xl lg:text-8xl tracking-wide">
              PORTFOLIO
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="section-pad bg-[var(--bg)] pt-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          {loading && (
            <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="group">
                  <div className="skeleton aspect-[3/4] w-full rounded-3xl" />
                  <div className="mt-4 space-y-2">
                    <div className="skeleton h-3 w-20" />
                    <div className="skeleton h-5 w-40" />
                    <div className="skeleton h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && paginated.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-24 text-center"
            >
              <Grid3X3 size={48} strokeWidth={1} className="mx-auto text-[var(--secondary)] mb-4" />
              <p className="font-display text-3xl text-[var(--primary)]/30">No projects found</p>
            </motion.div>
          )}

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {paginated.map((item, index) => (
              <motion.figure
                key={item._id}
                onClick={() => setSelected(item)}
                variants={itemVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: index * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500">
                  {/* Project Image - Clean, no text overlay */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <PositionedImage
                      src={item.imageUrl}
                      alt={item.title}
                      settings={item.mediaSettings}
                      className="w-full h-full transition duration-700 group-hover:scale-105"
                      loading="lazy"
                      sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                    />
                  </div>

                  {/* Luxury Information Card at Bottom */}
                  <div className="p-5 md:p-6 border-t border-[var(--border)]/40 bg-white">
                    {item.category && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2"
                      >
                        {item.category}
                      </motion.p>
                    )}
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="font-display text-xl md:text-2xl font-normal text-[var(--primary)] leading-tight mb-3"
                    >
                      {item.title}
                    </motion.h3>
                    {item.description && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-sm leading-relaxed text-[var(--primary)]/60 mb-4 line-clamp-3"
                      >
                        {item.description}
                      </motion.p>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(item) }}
                        className="btn-luxury-primary group px-5 py-2.5 text-[10px] rounded-full"
                      >
                        VIEW PROJECT
                        <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.figure>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-16 flex items-center justify-center gap-2"
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-full text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) pageNum = i + 1
                else if (page <= 3) pageNum = i + 1
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                else pageNum = page - 2 + i

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-300 ${
                      page === pageNum
                        ? 'bg-[var(--primary)] text-white shadow-md'
                        : 'text-[var(--primary)]/60 hover:bg-[var(--secondary)]/50 hover:text-[var(--accent)]'
                    }`}
                    aria-label={`Page ${pageNum}`}
                    aria-current={page === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-full text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Modal Detail View */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[var(--primary)]/90 backdrop-blur-sm z-50"
              onClick={() => setSelected(null)}
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
              aria-labelledby="project-title"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur text-[var(--primary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-all duration-300"
                aria-label="Close project"
              >
                <X size={20} strokeWidth={2} />
              </button>
              <div className="relative h-full flex">
                <div className="relative w-full md:w-1/2 overflow-hidden">
                  {/* Main Image */}
                  <PositionedImage
                    src={projectImages[galleryIndex]}
                    alt={selected.title}
                    settings={selected.mediaSettings}
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    {selected.category && (
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">{selected.category}</p>
                    )}
                    <h2 id="project-title" className="font-display text-3xl md:text-4xl font-normal leading-tight">{selected.title}</h2>
                    {projectImages.length > 1 && (
                      <p className="mt-2 text-sm text-white/70">
                        Image {galleryIndex + 1} of {projectImages.length}
                      </p>
                    )}
                  </div>

                  {/* Gallery Navigation - Desktop */}
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

                  {/* Thumbnail Navigation - Bottom */}
                  {projectImages.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {projectImages.map((img, idx) => (
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
                </div>
                <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
                  {selected.description && (
                    <p className="text-base leading-relaxed text-[var(--primary)]/70 mb-8">{selected.description}</p>
                  )}
                  {selected.materials && (
                    <div className="mb-6">
                      <h3 className="font-display text-xl font-normal text-[var(--primary)] mb-3">Materials Used</h3>
                      <p className="text-sm leading-relaxed text-[var(--primary)]/60">{selected.materials}</p>
                    </div>
                  )}
                  {selected.inspiration && (
                    <div className="mb-6">
                      <h3 className="font-display text-xl font-normal text-[var(--primary)] mb-3">Design Inspiration</h3>
                      <p className="text-sm leading-relaxed text-[var(--primary)]/60">{selected.inspiration}</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    {selected.location && (
                      <div className="flex items-center gap-3 text-sm text-[var(--primary)]/60">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{selected.location}</span>
                      </div>
                    )}
                    {selected.year && (
                      <div className="flex items-center gap-3 text-sm text-[var(--primary)]/60">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Completed: {selected.year}</span>
                      </div>
                    )}
                    {selected.client && (
                      <div className="flex items-center gap-3 text-sm text-[var(--primary)]/60">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>Client: {selected.client}</span>
                      </div>
                    )}
                    {selected.duration && (
                      <div className="flex items-center gap-3 text-sm text-[var(--primary)]/60">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Duration: {selected.duration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}