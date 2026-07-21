import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { getOptimizedUrl } from '../utils/cloudinaryHelpers'
import { Link } from 'react-router-dom'

export const AboutPreview = () => {
  const [aboutData, setAboutData] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/about')
        setAboutData(res.data || null)
      } catch {
        setAboutData(null)
      }
    }
    load()
  }, [])

  const story =
    aboutData?.story ||
    aboutData?.content ||
    aboutData?.description ||
    'We are a team of passionate designers dedicated to creating spaces that inspire and delight. With years of experience and a commitment to excellence, we bring your vision to life through thoughtful design, premium materials, and meticulous attention to detail.'
  const mission =
    aboutData?.mission ||
    'To transform spaces into timeless environments that reflect the unique personality and lifestyle of each client.'
  const imageUrl =
    aboutData?.aboutImageUrl || aboutData?.heroImage || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&h=800&fit=crop'

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="bg-soft-cream px-6 md:px-12 lg:px-20 py-20 md:py-32"
    >
      <div className="container-wide">
        <div className="grid items-center gap-12 lg:gap-24 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden shadow-[0_24px_80px_rgba(42,36,31,0.1)] aspect-[4/5] md:aspect-[3/4] rounded-3xl"
          >
            <img
              src={getOptimizedUrl(imageUrl, { width: 1200, crop: 'limit' })}
              alt="Luxury interior design studio"
              className="h-full w-full object-cover transition duration-[1.2s] hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-luxury-text/10 to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8 md:space-y-10 max-w-3xl"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-accent mb-4">Our Story</p>
              <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-luxury-text leading-[1.15]">
                Designing Spaces,
                <br />
                Creating Memories
              </h3>
            </div>
            <p className="text-base md:text-lg leading-[1.8] text-luxury-text/70">{story}</p>

            <div className="py-2 border-t border-b border-linen/40">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-accent mb-3">Our Philosophy</p>
              <p className="font-display text-xl md:text-2xl text-luxury-text italic leading-relaxed">{mission}</p>
            </div>

            <Link
              to="/about"
              className="group inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-orange-accent transition-colors duration-300 hover:text-warm-bronze"
            >
              Discover Our Story
              <motion.svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-x-1"
                whileHover={{ x: 4 }}
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </motion.svg>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}