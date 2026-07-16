import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { ProductCard } from './shop/ProductCard'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export const ShopCollection = () => {
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('featured')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/products', { params: { sort: '-createdAt', limit: 20 } })
        setAllProducts(res.data?.items || [])
      } catch {
        setAllProducts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const displayed = useMemo(() => {
    const items = allProducts
    if (tab === 'featured') return items.filter((p) => p.isFeatured).slice(0, 4)
    return items.slice(0, 4)
  }, [allProducts, tab])

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7 }}
      className="bg-primary-bg px-6 md:px-12 lg:px-20 py-24 md:py-36"
    >
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-16 text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-4">Shop</p>
          <h2 className="font-['Playfair_Display'] text-4xl font-medium leading-tight text-charcoal md:text-5xl lg:text-6xl">
            Shop Collection
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 flex items-center justify-center gap-2"
        >
          {['featured', 'new'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-500 ${
                tab === t
                  ? 'bg-forest text-white shadow-lg shadow-forest/10'
                  : 'bg-white text-charcoal border border-border hover:border-bronze hover:text-bronze'
              }`}
            >
              {t === 'featured' ? 'Featured Products' : 'New Arrivals'}
            </button>
          ))}
        </motion.div>

{loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-h-[30vh] items-center justify-center"
          >
            <p className="font-['Playfair_Display'] text-xl text-charcoal/30">No products found</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-30px' }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {displayed.map((product) => (
              <motion.div key={product._id} variants={itemVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Link
            to="/shop"
            className="group inline-flex items-center justify-center gap-3 rounded-full bg-forest px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-500 hover:bg-forestDark hover:shadow-[0_20px_60px_rgba(31,77,58,0.15)] hover:-translate-y-1"
            style={{ height: '56px' }}
          >
            View Full Collection
            <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  )
}
