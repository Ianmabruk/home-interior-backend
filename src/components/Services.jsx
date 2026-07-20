import { Brush, LayoutGrid, MonitorSmartphone, Armchair, Search, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const SERVICES = [
  {
    icon: Brush,
    title: 'Residential Interior Design',
    description: 'Luxury homes tailored to your lifestyle',
  },
  {
    icon: LayoutGrid,
    title: 'Commercial Interior Design',
    description: 'Sophisticated spaces for business',
  },
  {
    icon: MonitorSmartphone,
    title: 'Virtual Designs',
    description: 'Transform your space from anywhere',
  },
  {
    icon: Armchair,
    title: 'Furniture Selection',
    description: 'Curated pieces for every room',
  },
  {
    icon: Search,
    title: 'Space Planning',
    description: 'Optimize flow and functionality',
  },
  {
    icon: Sparkles,
    title: 'Styling Consultation',
    description: 'Expert finishing touches',
  },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

export const Services = () => {
  return (
    <section className="bg-soft-cream px-6 md:px-12 lg:px-20 py-20 md:py-32">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="mb-16 md:mb-24 text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-4">Services</p>
          <h2 className="font-display text-4xl font-medium leading-tight text-espresso md:text-5xl lg:text-6xl">
            What We Do
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base text-espresso/60 leading-relaxed">
            Comprehensive interior design services tailored to elevate your space with timeless elegance.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12"
        >
          {SERVICES.map((item) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
                className="group flex flex-col items-center text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-champagne-beige/60 text-espresso transition-all duration-500 group-hover:bg-espresso group-hover:text-cream group-hover:scale-105"
                >
                  <Icon size={28} strokeWidth={1.5} />
                </motion.div>
                <h3 className="font-display text-xl md:text-2xl font-medium text-espresso leading-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-espresso/60 leading-relaxed">{item.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}