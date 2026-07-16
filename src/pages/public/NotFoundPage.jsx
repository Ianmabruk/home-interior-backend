import { Link } from 'react-router-dom'
import { ArrowRight, Home, Compass } from 'lucide-react'
import { motion } from 'framer-motion'

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}

export const NotFoundPage = () => {
  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-[var(--bg)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(230,216,201,0.05),transparent_60%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[40vw] font-display font-medium text-[var(--primary)]/5 leading-none select-none pointer-events-none">
        404
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer}
        className="relative z-10 text-center px-6"
      >
        <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-6">Page Not Found</p>
          <h1 className="font-display text-[8rem] font-medium leading-none text-[var(--primary)]/10 md:text-[12rem] select-none">
            404
          </h1>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] } } }} className="-mt-4 md:-mt-8">
          <h2 className="font-display text-3xl font-medium text-[var(--primary)] md:text-4xl">
            This page has been<br />moved or removed
          </h2>
          <p className="mt-4 text-sm text-[var(--primary)]/50 max-w-md mx-auto leading-relaxed">
            The page you're looking for doesn't exist. It may have been moved, deleted, or you entered the wrong URL. Let's get you back on track.
          </p>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] } } }} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/" className="btn-luxury-primary group inline-flex items-center gap-2">
            <Home size={16} strokeWidth={1.5} />
            Back to Home
            <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/portfolio" className="btn-luxury-secondary border-[var(--border)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] inline-flex items-center gap-2">
            <Compass size={16} strokeWidth={1.5} />
            Explore Portfolio
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}