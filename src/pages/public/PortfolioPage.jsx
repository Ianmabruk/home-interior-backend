import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ArrowRight, Grid3X3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'
import PositionedImage from '../../components/common/PositionedImage'

const PAGE_SIZE = 12

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] } }),
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

export const PortfolioPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [heroImage] = useState('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&q=80')

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

  const filtered = items
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
                      <Link
                        to={`/portfolio/${item._id}`}
                        className="btn-luxury-primary group px-5 py-2.5 text-[10px] rounded-full"
                      >
                        VIEW PROJECT
                        <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
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
    </div>
  )
}