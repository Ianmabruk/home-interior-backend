import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getOptimizedUrl } from '../utils/cloudinaryHelpers'

const FADE_DURATION = 2.5

export const Hero = ({ onBookConsultation, heroImages = [] }) => {
  const [currentIndex] = useState(0)

  const images = useMemo(() => {
    if (!heroImages || heroImages.length === 0) return []
    return heroImages
      .filter(item => item)
      .slice(0, 5)
      .map(item => ({
        url: typeof item === 'string' ? item : item.imageUrl || item.url,
        alt: item.title || item.alt || 'Luxury interior design project'
      }))
  }, [heroImages])

  const currentImage = images[currentIndex]
  const fallbackImage = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&h=1080&fit=crop'
  const activeImage = currentImage?.url || fallbackImage

  return (
    <section
      className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[var(--primary)]"
      role="region"
      aria-label="Hero image"
    >
      {!images.length && (
        <div className="absolute inset-0">
          <img
            src={getOptimizedUrl(fallbackImage, { width: 1920, crop: 'limit' })}
            alt="Luxury interior design"
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            style={{ transform: 'scale(1.15)' }}
          />
        </div>
      )}
      {images.length > 0 && (
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: FADE_DURATION, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img
                src={getOptimizedUrl(activeImage, { width: 1920, crop: 'limit' })}
                alt={currentImage?.alt || 'Luxury interior design'}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/95 to-[var(--primary)]/80" />
      <div className="absolute inset-0 opacity-[0.03] pattern-overlay" />

      <div className="relative z-10 flex h-full items-end justify-center px-6 md:px-12 lg:px-20 pb-20 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl w-full flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/portfolio"
            className="btn-luxury-primary group hidden sm:w-auto"
          >
            View Portfolio
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <button
            onClick={onBookConsultation}
            className="btn-luxury-secondary group w-full sm:w-auto"
          >
            Book Consultation
            <CalendarCheck size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" />
          </button>
        </motion.div>
      </div>
    </section>
  )
}
