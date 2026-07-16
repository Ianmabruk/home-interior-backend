import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Play, Video, Image, Search, Filter, X as XIcon, ArrowUpDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { getOptimizedUrl, getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'
import LazyVideo from '../../components/common/LazyVideo'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

export const VirtualDesignPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [viewMode, setViewMode] = useState('all')
  const [fullscreen, setFullscreen] = useState(null)
  const [imageFullscreen, setImageFullscreen] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/content/virtual-design')
        const data = Array.isArray(res.data) ? res.data : res.data?.items || []
        setItems(data)
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const handler = () => {
      const load = async () => {
        try {
          const res = await api.get('/content/virtual-design')
          const data = Array.isArray(res.data) ? res.data : res.data?.items || []
          setItems(data)
        } catch {
          setItems([])
        }
      }
      load()
    }
    window.addEventListener('virtual-changed', handler)
    return () => window.removeEventListener('virtual-changed', handler)
  }, [])

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)))

  const filtered = items.filter((item) => {
    if (viewMode === 'images' && !item.imageUrl && !item.journey?.before?.images?.length && !item.journey?.after?.images?.length) return false
    if (viewMode === 'videos' && !item.videoUrl && !item.journey?.before?.videos?.length && !item.journey?.after?.videos?.length) return false
    if (viewMode === 'journey' && !item.journey) return false
    if (categoryFilter && item.category !== categoryFilter) return false
    if (query) {
      const q = query.toLowerCase()
      return item.title?.toLowerCase().includes(q) || 
             item.category?.toLowerCase().includes(q) ||
             item.description?.toLowerCase().includes(q)
    }
    return true
  })

  const handleImageFullscreen = (item) => {
    if (item.imageUrl) setImageFullscreen(item)
  }

  const handleVideoFullscreen = (item) => {
    if (item.videoUrl) setFullscreen(item)
  }

  const handleJourneyImageFullscreen = (imageUrl, title, category) => {
    setImageFullscreen({ imageUrl, title, category })
  }

  const handleJourneyVideoFullscreen = (videoUrl, title, category) => {
    setFullscreen({ videoUrl, title, category })
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)]">
        <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/80 to-[var(--primary)]/60" />
          <div className="relative z-10 flex h-full items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]/80 mb-4">Virtual Interior Design</p>
              <h1 className="font-display text-5xl font-normal leading-tight text-white md:text-7xl lg:text-8xl">
                Visual Portfolio
              </h1>
            </motion.div>
          </div>
        </section>

        <section className="section-pad bg-[var(--bg)] pt-12">
          <div className="container-wide px-6 md:px-12 lg:px-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16 md:mb-24 text-center"
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Portfolio</p>
              <h2 className="font-display text-4xl font-normal leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
                Visual Gallery
              </h2>
            </motion.div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/80 to-[var(--primary)]/60" />
        {items.length > 0 && items[0]?.imageUrl && (
          <img
            src={getOptimizedUrl(items[0].imageUrl, { width: 1920, crop: 'limit' })}
            alt="Virtual design showcase"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
            loading="eager"
          />
        )}
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-4xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]/80 mb-4">Virtual Interior Design</p>
            <h1 className="font-display text-5xl font-normal leading-tight text-white md:text-7xl lg:text-8xl">
              Visual Portfolio
            </h1>
            <p className="mt-6 text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
              A curated collection of our virtual design projects — immersive 3D renderings, 
              walkthrough videos, and before/after transformations.
            </p>
          </motion.div>
        </div>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50"
        >
          <span className="text-[10px] uppercase tracking-widest font-medium">Scroll</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </motion.div>
      </section>

      {/* Gallery Section */}
      <section className="section-pad bg-[var(--bg)] pt-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          {/* View Mode Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 flex flex-wrap items-center justify-center gap-3"
          >
            {[
              { value: 'all', label: 'All', icon: Image },
              { value: 'images', label: 'Images', icon: Image },
              { value: 'videos', label: 'Videos', icon: Video },
              { value: 'journey', label: 'Project Journey', icon: ArrowUpDown },
            ].map((tab) => (
              <motion.button
                key={tab.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setViewMode(tab.value); setCategoryFilter('') }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium uppercase tracking-wide transition-all duration-300 ${
                  viewMode === tab.value
                    ? 'bg-[var(--primary)] text-white shadow-lg'
                    : 'bg-white text-[var(--primary)]/70 hover:bg-[var(--secondary)]/50 hover:text-[var(--accent)] border border-[var(--border)]'
                }`}
                aria-pressed={viewMode === tab.value}
              >
                <tab.icon size={16} strokeWidth={1.5} />
                {tab.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="relative w-full sm:max-w-xl">
                <Search size={16} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--primary)]/35" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full rounded-full border border-[var(--border)] bg-[var(--bg)] pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                />
              </div>
              {categories.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCategoryFilter('')}
                    className={`px-4 py-1.5 text-2xs font-semibold uppercase tracking-widest rounded-full transition ${
                      !categoryFilter ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-white text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 border border-[var(--border)]'
                    }`}
                  >
                    All
                  </motion.button>
                  {categories.map((cat) => (
                    <motion.button
                      key={cat}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                      className={`px-4 py-1.5 text-2xs font-semibold uppercase tracking-widest rounded-full transition ${
                        categoryFilter === cat ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-white text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 border border-[var(--border)]'
                      }`}
                    >
                      {cat}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 text-center"
          >
            <p className="text-sm text-[var(--primary)]/50">
              {filtered.length} {filtered.length === 1 ? 'project' : 'projects'} found
              {(query || categoryFilter || viewMode !== 'all') && (
                <button
                  onClick={() => { setQuery(''); setCategoryFilter(''); setViewMode('all') }}
                  className="inline-flex items-center gap-1.5 ml-4 text-2xs font-semibold uppercase tracking-widest text-[var(--accent)] hover:text-[var(--primary)] transition-colors"
                >
                  <XIcon size={10} strokeWidth={2} /> Clear filters
                </button>
              )}
            </p>
          </motion.div>

          {/* Gallery Grid */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filtered.map((item, i) => (
              <motion.article
                key={item._id}
                variants={itemVariants}
                custom={i}
                className="group"
              >
                <div className="relative overflow-hidden rounded-3xl bg-white border border-[var(--border)] shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500">
                  {/* Media */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {/* Regular Project - Image */}
                    {item.imageUrl && !item.videoUrl && !item.journey && (
                      <>
                        <img
                          src={getOptimizedUrl(item.imageUrl, { width: 640 })}
                          alt={item.title}
                          className="h-full w-full object-contain bg-[var(--bg)] transition duration-700 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleImageFullscreen(item) }}
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          aria-label="View fullscreen"
                        >
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                            <Maximize2 size={20} strokeWidth={1.5} className="text-[var(--primary)]" />
                          </div>
                        </button>
                      </>
                    )}
                    
                    {/* Regular Project - Video */}
                    {item.videoUrl && !item.imageUrl && !item.journey && (
                      <>
                        <LazyVideo
                          src={getOptimizedVideoUrl(item.videoUrl, { width: 640 })}
                          poster={getVideoPosterUrl(item.videoUrl, { width: 640 })}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVideoFullscreen(item) }}
                          className="absolute right-3 bottom-3 flex h-11 w-11 items-center justify-center bg-white/90 text-[var(--primary)] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow-lg hover:scale-110"
                          aria-label="Play video"
                        >
                          <Play size={20} strokeWidth={1.5} className="ml-1" />
                        </button>
                      </>
                    )}

                    {/* Project Journey */}
                    {item.journey && (
                      <>
                        {/* Show before images first */}
                        {(item.journey.before?.images?.length || item.journey.before?.videos?.length) && (
                          <>
                            {item.journey.before.images?.map((img, idx) => (
                              <img
                                key={`before-img-${idx}`}
                                src={getOptimizedUrl(img, { width: 640 })}
                                alt={`${item.title} - Before ${idx + 1}`}
                                className="h-full w-full object-contain bg-[var(--bg)] transition duration-700 group-hover:scale-105"
                                loading="lazy"
                                decoding="async"
                              />
                            ))}
                            {item.journey.before.videos?.map((vid, idx) => (
                              <LazyVideo
                                key={`before-vid-${idx}`}
                                src={getOptimizedVideoUrl(vid, { width: 640 })}
                                poster={getVideoPosterUrl(vid, { width: 640 })}
                                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                              />
                            ))}
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <button
                              onClick={(e) => { e.stopPropagation(); handleJourneyVideoFullscreen(item.journey.before.videos[0], `${item.title} - Before`, item.category) }}
                              className="absolute right-3 bottom-3 flex h-11 w-11 items-center justify-center bg-white/90 text-[var(--primary)] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow-lg hover:scale-110"
                              aria-label="Play video"
                            >
                              <Play size={20} strokeWidth={1.5} className="ml-1" />
                            </button>
                          </>
                        )}
                        
                        {/* Show after images */}
                        {(item.journey.after?.images?.length || item.journey.after?.videos?.length) && (
                          <>
                            {item.journey.after.images?.map((img, idx) => (
                              <img
                                key={`after-img-${idx}`}
                                src={getOptimizedUrl(img, { width: 640 })}
                                alt={`${item.title} - After ${idx + 1}`}
                                className="h-full w-full object-contain bg-[var(--bg)] transition duration-700 group-hover:scale-105"
                                loading="lazy"
                                decoding="async"
                              />
                            ))}
                            {item.journey.after.videos?.map((vid, idx) => (
                              <LazyVideo
                                key={`after-vid-${idx}`}
                                src={getOptimizedVideoUrl(vid, { width: 640 })}
                                poster={getVideoPosterUrl(vid, { width: 640 })}
                                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                              />
                            ))}
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <button
                              onClick={(e) => { e.stopPropagation(); handleJourneyVideoFullscreen(item.journey.after.videos[0], `${item.title} - After`, item.category) }}
                              className="absolute right-3 bottom-3 flex h-11 w-11 items-center justify-center bg-white/90 text-[var(--primary)] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow-lg hover:scale-110"
                              aria-label="Play video"
                            >
                              <Play size={20} strokeWidth={1.5} className="ml-1" />
                            </button>
                          </>
                        )}
                        
                        {/* Type badge */}
                        <div className="absolute left-3 top-3 flex gap-2">
                          {(item.journey.before?.images?.length || item.journey.before?.videos?.length) && (
                            <span className="flex h-6 items-center gap-1.5 px-2.5 text-2xs font-semibold uppercase tracking-widest bg-white/90 text-[var(--primary)] rounded-full shadow-md backdrop-blur-sm">
                              <Image size={10} strokeWidth={1.5} /> Before
                            </span>
                          )}
                          {(item.journey.after?.images?.length || item.journey.after?.videos?.length) && (
                            <span className="flex h-6 items-center gap-1.5 px-2.5 text-2xs font-semibold uppercase tracking-widest bg-[var(--accent)] text-white rounded-full shadow-md">
                              <Image size={10} strokeWidth={1.5} /> After
                            </span>
                          )}
                        </div>
                      </>
                    )}

                    {/* Overlay for fullscreen image (regular projects) */}
                    {item.imageUrl && !item.videoUrl && !item.journey && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleImageFullscreen(item) }}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        aria-label="View fullscreen"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                          <Maximize2 size={20} strokeWidth={1.5} className="text-[var(--primary)]" />
                        </div>
                      </button>
                    )}

                    {/* Play button for items with both image and video (regular projects) */}
                    {item.imageUrl && item.videoUrl && !item.journey && (
                      <>
                        <img
                          src={getOptimizedUrl(item.imageUrl, { width: 640 })}
                          alt={item.title}
                          className="h-full w-full object-contain bg-[var(--bg)] transition duration-700 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVideoFullscreen(item) }}
                          className="absolute right-3 bottom-3 flex h-11 w-11 items-center justify-center bg-white/90 text-[var(--primary)] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow-lg hover:scale-110"
                          aria-label="Play video"
                        >
                          <Play size={20} strokeWidth={1.5} className="ml-1" />
                        </button>
                      </>
                    )}

                  </div>

                  {/* Info Card */}
                  <div className="p-5 md:p-6 border-t border-[var(--border)]/40 bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
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
                        onClick={(e) => { e.stopPropagation(); item.videoUrl || item.journey?.before?.videos?.length || item.journey?.after?.videos?.length ? handleVideoFullscreen(item) : handleImageFullscreen(item) }}
                        className="btn-luxury-primary group flex items-center gap-2 text-[10px] px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0"
                      >
                        {item.videoUrl || item.journey?.before?.videos?.length || item.journey?.after?.videos?.length ? (
                          <>
                            <Play size={12} strokeWidth={1.5} />
                            {item.journey ? 'View Journey' : 'Play Video'}
                          </>
                        ) : (
                          <>
                            View Project
                            <Maximize2 size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
            
            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full py-24 text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/30 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/30">
                  {viewMode === 'images' ? <Image size={32} /> : viewMode === 'videos' ? <Video size={32} /> : viewMode === 'journey' ? <ArrowUpDown size={32} /> : <Image size={32} />}
                </div>
                <p className="font-display text-3xl text-[var(--primary)]/30">
                  {items.length === 0 ? 'No projects yet.' : 'No results found.'}
                </p>
                {(query || categoryFilter || viewMode !== 'all') && (
                  <button
                    onClick={() => { setQuery(''); setCategoryFilter(''); setViewMode('all') }}
                    className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 text-2xs font-semibold uppercase tracking-widest border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] rounded-full transition"
                  >
                    <XIcon size={12} strokeWidth={1.5} /> Clear Filters
                  </button>
                )}
              </motion.div>
            )}
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
              onClick={() => setImageFullscreen(null)}
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
                onClick={() => setImageFullscreen(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur text-[var(--primary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-all duration-300"
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
              <div className="relative h-full w-full flex items-center justify-center p-4">
                <img
                  src={getOptimizedUrl(imageFullscreen.imageUrl, { width: 1920 })}
                  alt={imageFullscreen.title}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-[var(--primary)]/90 to-transparent text-white">
                {imageFullscreen.category && (
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">{imageFullscreen.category}</p>
                )}
                <h2 id="image-fullscreen-title" className="font-display text-3xl md:text-4xl font-normal leading-tight">{imageFullscreen.title}</h2>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Video Fullscreen Modal */}
      <AnimatePresence>
        {fullscreen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-[var(--primary)]/98 backdrop-blur-sm"
              onClick={() => setFullscreen(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-4 md:inset-10 lg:inset-20 z-50 bg-white rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)] max-w-6xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="video-fullscreen-title"
            >
              <button
                onClick={() => setFullscreen(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur text-[var(--primary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-all duration-300"
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
              <div className="relative h-[70vh] w-full">
                <video
                  src={getOptimizedVideoUrl(fullscreen.videoUrl, { width: 1280 })}
                  poster={getVideoPosterUrl(fullscreen.videoUrl, { width: 1280 })}
                  controls
                  autoPlay
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain rounded-2xl shadow-2xl"
                />
              </div>
              <div className="p-6 md:p-8 bg-[var(--bg)]/95 backdrop-blur-sm">
                <h2 id="video-fullscreen-title" className="font-display text-3xl font-normal text-[var(--primary)]">{fullscreen.title}</h2>
                {fullscreen.description && (
                  <p className="mt-3 text-sm text-[var(--primary)]/60 leading-relaxed">{fullscreen.description}</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}