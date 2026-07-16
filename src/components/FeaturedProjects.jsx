import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { getOptimizedUrl } from '../utils/cloudinaryHelpers'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
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
        setProjects(sorted.slice(0, 8))
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
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-warm-ivory px-6 md:px-12 lg:px-20 py-20 md:py-32"
      >
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 md:mb-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-accent mb-4">Portfolio</p>
            <h2 className="font-display text-4xl font-normal leading-tight text-luxury-text md:text-5xl lg:text-6xl">
              Featured Projects
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="relative aspect-[3/4] rounded-3xl bg-linen/30 overflow-hidden"
              >
                <div className="absolute inset-0 skeleton" />
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    )
  }

  if (projects.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-warm-ivory px-6 md:px-12 lg:px-20 py-20 md:py-32"
      >
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-accent mb-4">Portfolio</p>
            <h2 className="font-display text-4xl font-normal leading-tight text-luxury-text md:text-5xl lg:text-6xl">
              Featured Projects
            </h2>
          </motion.div>
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="font-display text-xl text-luxury-text/30">No projects yet</p>
          </div>
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={containerVariants}
      className="bg-warm-ivory px-6 md:px-12 lg:px-20 py-20 md:py-32"
    >
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16 md:mb-24 text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-accent mb-4">Portfolio</p>
          <h2 className="font-display text-4xl font-normal leading-tight text-luxury-text md:text-5xl lg:text-6xl">
            Featured Projects
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12"
        >
          {projects.map((item, index) => (
            <motion.article
              key={item._id}
              variants={itemVariants}
              className="group relative overflow-hidden bg-white border border-linen shadow-soft transition-all duration-700 hover:-translate-y-2 hover:shadow-lift cursor-pointer"
              style={{ aspectRatio: '3/4' }}
            >
              <Link to={`/portfolio/${item._id}`} className="absolute inset-0" aria-label={`View ${item.title} project`}>
                <img
                  src={getOptimizedUrl(item.imageUrl, { width: 800, crop: 'limit' })}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-[1.2s] ease-out group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-text/80 via-luxury-text/30 to-transparent opacity-70 transition-all duration-700 group-hover:opacity-90" />
              </Link>

              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                {item.category && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-[11px] font-semibold uppercase tracking-widest text-orange-accent mb-2"
                  >
                    {item.category}
                  </motion.p>
                )}
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-display text-2xl md:text-3xl font-normal text-white leading-tight"
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16 md:mb-24 text-center"
        >
                  View Project <ArrowRight size={12} strokeWidth={1.5} />
                </motion.div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-16 text-center"
        >
          <Link
            to="/portfolio"
            className="group inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-luxury-text transition-colors duration-300 hover:text-orange-accent"
          >
            View All Projects
            <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  )
}