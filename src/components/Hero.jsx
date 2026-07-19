import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getOptimizedUrl } from '../utils/cloudinaryHelpers'

const SLIDE_DURATION = 8000
const FADE_DURATION = 2.5

export const Hero = ({ onBookConsultation, heroImages = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const intervalRef = useRef(null)

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

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    if (images.length <= 1 || isPaused) return
    intervalRef.current = setInterval(next, SLIDE_DURATION)
    return () => clearInterval(intervalRef.current)
  }, [images.length, next, isPaused])

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const currentImage = images[currentIndex]
  const fallbackImage = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&h=1080&fit=crop'
  const activeImage = currentImage?.url || fallbackImage

  return (
    <section
      className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[var(--primary)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Hero image carousel"
    >
      {/* Background Slides - Full Width, Edge to Edge */}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FADE_DURATION, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <motion.img
                src={getOptimizedUrl(activeImage, { width: 1920, crop: 'limit' })}
                alt={currentImage?.alt || 'Luxury interior design'}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
                style={{
                  transform: `translate3d(${mousePosition.x * 30}px, ${mousePosition.y * 30}px, 0) scale(1.15)`,
                  transition: 'transform 0.3s ease-out'
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Cinematic Overlay Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/95 to-[var(--primary)]/80" />
      <div className="absolute inset-0 opacity-[0.03] pattern-overlay" />

      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
              width: `${20 + i * 10}px`,
              height: `${20 + i * 10}px`,
              background: `radial-gradient(circle, rgba(232,154,67,0.15) 0%, rgba(232,154,67,0) 70%)`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 1.5,
            }}
          />
        ))}
      </div>

      {/* Content - Buttons Only, Lower Position */}
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
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

      {/* Dots Indicator - Subtle */}
      {images.length > 1 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className={`relative h-1.5 rounded-full transition-all duration-700 ${idx === currentIndex ? 'w-10 bg-[var(--accent)]' : 'w-2 bg-white/40 hover:bg-white/60'}`}
              aria-label={`Go to slide ${idx + 1}`}
            >
              {idx === currentIndex && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute inset-0 rounded-full bg-[var(--accent)]"
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/50"
      >
        <span className="text-[10px] uppercase tracking-widest font-medium">Discover</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </motion.div>
    </section>
  )
}