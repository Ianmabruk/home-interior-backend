import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { getOptimizedUrl } from '../utils/cloudinaryHelpers'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
}

export const FeaturedProjects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/content/portfolio')
        const sorted = [...(res.data || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
        setProjects(sorted.slice(0, 3))
      } catch {
        setProjects([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <section className="bg-primary-bg px-6 md:px-12 lg:px-20 py-20 md:py-32">
        <div className="container-wide">
          <div className="mb-16 text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-4"
            >
              Portfolio
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-['Playfair_Display'] text-4xl font-medium text-charcoal md:text-5xl lg:text-6xl"
            >
              Featured Projects
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[28rem] rounded-3xl bg-secondary/30 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (projects.length === 0) {
    return (
      <section className="bg-primary-bg px-6 md:px-12 lg:px-20 py-20 md:py-32">
        <div className="container-wide">
          <div className="mb-16 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-4">Portfolio</p>
            <h2 className="font-['Playfair_Display'] text-4xl font-medium text-charcoal md:text-5xl lg:text-6xl">
              Featured Projects
            </h2>
          </div>
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="font-['Playfair_Display'] text-xl text-charcoal/30">No projects yet</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={containerVariants}
      className="bg-primary-bg px-6 md:px-12 lg:px-20 py-20 md:py-32"
    >
      <div className="container-wide">
        <motion.div variants={itemVariants} className="mb-16 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-4">Portfolio</p>
          <h2 className="font-['Playfair_Display'] text-4xl font-medium text-charcoal md:text-5xl lg:text-6xl">
            Featured Projects
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-4 max-w-2xl mx-auto text-base text-textSecondary leading-relaxed"
          >
            A curated selection of our most inspiring residential and commercial interiors.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {projects.map((item, index) => (
            <motion.div
              key={item._id}
              variants={itemVariants}
              className="group relative overflow-hidden bg-white border border-border shadow-[0_4px_24px_rgba(31,77,58,0.04)] transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_24px_80px_rgba(31,77,58,0.1)] cursor-pointer"
              style={{ aspectRatio: '3/4' }}
            >
              <img
                src={getOptimizedUrl(item.imageUrl, { width: 900, crop: 'limit' })}
                alt={item.title}
                className="h-full w-full object-cover transition duration-[1.2s] ease-out group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent opacity-70 transition-all duration-700 group-hover:opacity-90" />

              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                {item.category && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="text-[11px] font-semibold uppercase tracking-[0.15em] text-bronze mb-2"
                  >
                    {item.category}
                  </motion.p>
                )}
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-['Playfair_Display'] text-2xl md:text-3xl font-medium text-white leading-tight"
                >
                  {item.title}
                </motion.h3>
                {item.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-3 text-sm leading-relaxed text-white/70 line-clamp-2 hidden md:block"
                  >
                    {item.description}
                  </motion.p>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-bronze opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0"
                >
                  View Project <ArrowRight size={12} strokeWidth={1.5} />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {projects.length > 0 && (
          <motion.div variants={itemVariants} className="mt-16 text-center">
            <Link
              to="/portfolio"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-forest px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-500 hover:bg-forestDark hover:shadow-[0_20px_60px_rgba(31,77,58,0.15)] hover:-translate-y-1"
              style={{ height: '56px' }}
            >
              View Full Portfolio
              <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        )}
      </div>
    </motion.section>
  )
}
