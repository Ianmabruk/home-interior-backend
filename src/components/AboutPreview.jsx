import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { getOptimizedUrl } from '../utils/cloudinaryHelpers'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export const AboutPreview = () => {
  const [aboutData, setAboutData] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/content/about')
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
    <section className="bg-white px-6 md:px-12 lg:px-20 py-24 md:py-36">
      <div className="container-wide">
        <div className="grid items-center gap-16 lg:gap-24 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[28px] md:rounded-[36px] shadow-[0_24px_80px_rgba(31,77,58,0.08)] aspect-[4/5] md:aspect-[3/4]"
          >
            <img
              src={getOptimizedUrl(imageUrl, { width: 1200, crop: 'limit' })}
              alt="Luxury interior design studio"
              className="h-full w-full object-cover transition duration-[1.2s] hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/10 to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8 md:space-y-10"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-4">Our Story</p>
              <h3 className="font-['Playfair_Display'] text-3xl md:text-4xl lg:text-5xl font-medium text-charcoal leading-[1.15]">
                Designing Spaces,
                <br />
                Creating Memories
              </h3>
            </div>
            <p className="text-base md:text-lg leading-[1.8] text-textSecondary">{story}</p>

            <div className="py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-3">Our Philosophy</p>
              <p className="font-['Playfair_Display'] text-xl md:text-2xl text-charcoal italic leading-relaxed">{mission}</p>
            </div>

            <Link
              to="/about"
              className="group inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-forest transition-colors duration-300 hover:text-bronze"
            >
              Learn More About Us
              <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
