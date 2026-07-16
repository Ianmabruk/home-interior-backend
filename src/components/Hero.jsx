import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'
import { getOptimizedUrl } from '../utils/cloudinaryHelpers'

const SLIDE_DURATION = 8000
const FADE_DURATION = 2.5

// Simple seeded random for consistent particle generation
const seededRandom = (seed) => {
  let x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export const Hero = ({ onBookConsultation }) => {
  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const intervalRef = useRef(null)

  const particles = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: seededRandom(i * 1000) * 100,
    y: seededRandom(i * 2000) * 100,
    size: seededRandom(i * 3000) * 3 + 1,
    delay: seededRandom(i * 4000) * 15,
    duration: 10 + seededRandom(i * 5000) * 20
  })), [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/content/homepage')
        const data = res.data || {}

        const carouselImages = []

        if (data.about?.aboutImageUrl) {
          carouselImages.push({
            url: data.about.aboutImageUrl,
            alt: 'HOK Interior Design Studio',
            priority: true
          })
        }

        if (data.portfolio && Array.isArray(data.portfolio)) {
          data.portfolio
            .filter(item => item.imageUrl)
            .slice(0, 5)
            .forEach(item => {
              carouselImages.push({
                url: item.imageUrl,
                alt: item.title || 'Luxury interior design project'
              })
            })
        }

        if (data.projects && Array.isArray(data.projects)) {
          data.projects
            .filter(item => item.coverImageUrl || item.media?.[0]?.url)
            .slice(0, 4)
            .forEach(item => {
              carouselImages.push({
                url: item.coverImageUrl || item.media?.[0]?.url,
                alt: item.title || 'Luxury interior design project'
              })
            })
        }

        if (carouselImages.length > 0) {
          setImages(carouselImages)
        }
      } catch {
        // Silently fail - fallback image will be used
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
      className="relative w-full h-screen min-h-[700px] overflow-hidden bg-luxury-text"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Hero image carousel"
    >
      {/* Background Slides - Full Width, Edge to Edge */}
      {!loading && images.length > 0 && (
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
                className="h-full w-full object-cover ken-burns"
                loading="eager"
                decoding="async"
                style={{
                  transform: `translate3d(${mousePosition.x * 15}px, ${mousePosition.y * 15}px, 0) scale(1.02)`
                }}
              />
              {/* Luxury Gradient Overlay - Left to Right Fade */}
              <div className="absolute inset-0 hero-overlay-luxury" />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Fallback */}
      {(loading || images.length === 0) && (
        <div className="absolute inset-0">
          <motion.img
            src={getOptimizedUrl(fallbackImage, { width: 1920, crop: 'limit' })}
            alt="Luxury interior design"
            className="h-full w-full object-cover ken-burns"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 hero-overlay-luxury" />
        </div>
      )}

      {/* Floating Particles / Light Reflections */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.5, 1, 0.5] }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Content - Centered */}
      <div className="relative z-10 flex h-full items-center justify-center px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl text-center"
        >
          <motion.p
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-[11px] font-semibold uppercase tracking-widest text-orange-accent mb-6 md:mb-8"
          >
            Interior Design Studio
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="font-display text-hero-desktop md:text-hero-tablet lg:text-hero-desktop font-normal leading-[1.0] text-white"
          >
            Timeless Interiors.
            <br />
            <span className="text-orange-accent">Designed for a Life Well Lived.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="mt-6 md:mt-8 text-base md:text-lg leading-relaxed text-white/70 max-w-2xl mx-auto"
          >
            We design luxurious, functional spaces that reflect your style and elevate everyday living.
          </motion.p>
          {/* Luxury Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            className="luxury-divider mt-10 md:mt-12"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/portfolio"
              className="btn-luxury-primary group"
            >
              View Portfolio
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <button
              onClick={onBookConsultation}
              className="btn-luxury-secondary group"
            >
              Book Consultation
              <CalendarCheck size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" />
            </button>
          </motion.div>
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
              className={`relative h-1.5 rounded-full transition-all duration-700 ${idx === currentIndex ? 'w-10 bg-orange-accent' : 'w-2 bg-white/40 hover:bg-white/60'}`}
              aria-label={`Go to slide ${idx + 1}`}
            >
              {idx === currentIndex && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute inset-0 rounded-full bg-orange-accent"
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="scroll-indicator"
      >
        <span className="text-[10px] uppercase tracking-widest font-medium">Scroll</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2"
        >
          <div className="h-10 w-px bg-white/30" />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  )
}