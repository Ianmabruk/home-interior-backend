import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'
import { getOptimizedUrl } from '../utils/cloudinaryHelpers'

const SLIDE_DURATION = 8000
const FADE_DURATION = 1.8

export const Hero = ({ onBookConsultation }) => {
  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/content/homepage')
        const data = res.data || {}

        // Collect images from multiple sources for the carousel
        const carouselImages = []

        // 1. Hero image from about section (dedicated hero image)
        if (data.about?.aboutImageUrl) {
          carouselImages.push({
            url: data.about.aboutImageUrl,
            alt: 'HOK Interior Design Studio',
            priority: true
          })
        }

        // 2. Portfolio items with images
        if (data.portfolio && Array.isArray(data.portfolio)) {
          data.portfolio
            .filter(item => item.imageUrl)
            .slice(0, 4)
            .forEach(item => {
              carouselImages.push({
                url: item.imageUrl,
                alt: item.title || 'Luxury interior design project'
              })
            })
        }

        // 3. Projects with cover images
        if (data.projects && Array.isArray(data.projects)) {
          data.projects
            .filter(item => item.coverImageUrl || item.media?.[0]?.url)
            .slice(0, 3)
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
        // noop
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    if (images.length <= 1 || isPaused) return
    intervalRef.current = setInterval(next, SLIDE_DURATION)
    return () => clearInterval(intervalRef.current)
  }, [images.length, next, isPaused])

  const currentImage = images[currentIndex]
  const fallbackImage = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&h=900&fit=crop'

  const activeImage = currentImage?.url || fallbackImage

return (
    <section
      className="relative h-screen min-h-[600px] overflow-hidden bg-charcoal mx-4 md:mx-8 lg:mx-12 mt-20 md:mt-24"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides with Parallax */}
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
              <img
                src={getOptimizedUrl(activeImage, { width: 1920, crop: 'limit' })}
                alt={currentImage?.alt || 'Luxury interior design'}
                className="h-full w-full object-cover ken-burns"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/50 to-charcoal/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 to-transparent" />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Fallback static image while loading or no images */}
      {(loading || images.length === 0) && (
        <div className="absolute inset-0">
          <img
            src={getOptimizedUrl(fallbackImage, { width: 1920, crop: 'limit' })}
            alt="Luxury interior design"
            className="h-full w-full object-cover ken-burns"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/50 to-charcoal/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-6 md:mb-8"
            >
              Interior Design Studio
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="font-['Playfair_Display'] text-[2.5rem] md:text-6xl lg:text-[5.5rem] font-medium leading-[1.05] text-white"
            >
              Timeless Design.
              <br />
              <span className="text-bronze">Thoughtful Living.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="mt-6 md:mt-8 text-base md:text-lg leading-relaxed text-white/70 max-w-lg"
            >
              Creating elegant interiors that blend comfort, beauty, and functionality.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.1 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link
                to="/portfolio"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-forest transition-all duration-500 hover:bg-bronze hover:shadow-[0_20px_60px_rgba(184,138,90,0.2)] hover:-translate-y-1"
                style={{ height: '56px' }}
              >
                View Portfolio
                <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <button
                onClick={onBookConsultation}
                className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/30 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-500 hover:bg-white/10 hover:border-bronze hover:shadow-[0_20px_60px_rgba(184,138,90,0.15)] hover:-translate-y-1"
                style={{ height: '56px' }}
              >
                Book Consultation
                <CalendarCheck size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Slider Controls */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="absolute left-6 md:left-12 top-1/2 z-20 -translate-y-1/2 hidden md:flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 transition-all duration-500 hover:bg-white/20 hover:scale-110 hover:border-bronze/50"
            aria-label="Previous slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={next}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="absolute right-6 md:right-12 top-1/2 z-20 -translate-y-1/2 hidden md:flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 transition-all duration-500 hover:bg-white/20 hover:scale-110 hover:border-bronze/50"
            aria-label="Next slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2 flex items-center gap-3">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-1.5 rounded-full transition-all duration-700 ${
                idx === currentIndex ? 'w-10 bg-bronze' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            >
              {idx === currentIndex && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute inset-0 rounded-full bg-bronze"
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
        className="absolute bottom-10 left-1/2 md:left-auto md:right-12 md:translate-x-0 -translate-x-1/2 md:translate-x-0 z-20 flex flex-col items-center gap-3 text-white/60"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] hidden md:block font-medium">Scroll</span>
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