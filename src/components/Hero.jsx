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

      {/* Luxury Statement Text - Far Left of Fading Overlay (Desktop/Tablet Only) */}
      <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 px-6 md:px-12 lg:px-20 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xs"
        >
          <p className="font-display text-orange-accent text-5xl md:text-6xl lg:text-7xl font-medium leading-none tracking-tight select-none" style={{ textShadow: '0 4px 30px rgba(232,154,67,0.3)' }}>
            D
          </p>
          <p className="font-display text-lg md:text-xl lg:text-2xl font-normal leading-snug text-white/90 tracking-tight -mt-2" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            esigning
          </p>
          <p className="font-display text-lg md:text-xl lg:text-2xl font-normal leading-snug text-white/90 tracking-tight -mt-2" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            Luxurious
          </p>
          <p className="font-display text-lg md:text-xl lg:text-2xl font-normal leading-snug text-white/90 tracking-tight -mt-2" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            Functional
          </p>
          <p className="font-display text-lg md:text-xl lg:text-2xl font-normal leading-snug text-white/90 tracking-tight -mt-2" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            Spaces
          </p>
        </motion.div>
      </div>

      {/* Buttons Only - Lower Position */}
      <div className="relative z-10 flex h-full items-end justify-center px-6 md:px-12 lg:px-20 pb-20 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl w-full flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/portfolio"
            className="btn-luxury-primary group w-full sm:w-auto"
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
    </section>
  )
}