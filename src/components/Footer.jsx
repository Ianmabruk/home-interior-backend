import { Link } from 'react-router-dom'
import { Instagram, Facebook } from 'lucide-react'
import { motion } from 'framer-motion'

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4-4 4-4 1.5-1.5a2.12 2.12 0 0 1 3 0Z" />
    <path d="M16.5 3.5c.205.18.407.367.601.557A10.045 10.045 0 0 1 23.4 12c0 .52-.039 1.04-.11 1.55a13.978 13.978 0 0 1-1.97 5.07 2.127 2.127 0 0 1-2.79 1.04 17.323 17.323 0 0 1-5.37-1.97 2.131 2.131 0 0 1-.64-2.51c.163-.18.33-.356.5-.53" />
    <path d="M12 12c.53-.24 1.04-.5 1.5-.76" />
  </svg>
)

const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M9 19c-5 0-7.5-7-7.5-7a5.5 5.5 0 0 1 11.24-3.1" />
    <circle cx="12" cy="19" r="3" />
  </svg>
)

export const Footer = () => {
  const socialLinks = [
    { icon: TikTokIcon, href: 'https://www.tiktok.com/@hokinteriors', label: 'TikTok', ariaLabel: 'Follow us on TikTok' },
    { icon: Instagram, href: 'https://www.instagram.com/hokinteriors', label: 'Instagram', ariaLabel: 'Follow us on Instagram' },
    { icon: Facebook, href: 'https://www.facebook.com/share/14i3V8Sw7uo', label: 'Facebook', ariaLabel: 'Follow us on Facebook' },
    { icon: PinterestIcon, href: 'https://www.pinterest.com/hokinterior', label: 'Pinterest', ariaLabel: 'Follow us on Pinterest' },
  ]

  const socialVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <footer className="relative bg-footer-bg text-footer-text" role="contentinfo">
      {/* Subtle ambient glow at top */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(214,178,122,0.06),transparent_60%)]" aria-hidden="true" />
      <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 py-16 md:py-24 lg:py-32">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={socialVariants}
          className="max-w-4xl mx-auto"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="mb-12 md:mb-16 text-center">
            <Link to="/" className="inline-block group" aria-label="HOK INTERIORS - Home">
              <p className="font-display text-3xl md:text-4xl font-normal tracking-luxury text-footer-text transition-colors duration-300 group-hover:text-bronze">
                HOK INTERIORS
              </p>
            </Link>
          </motion.div>

          {/* Brand Statement */}
          <motion.div variants={itemVariants} className="mb-16 md:mb-20 text-center max-w-2xl mx-auto">
            <p className="font-display text-lg md:text-xl leading-relaxed text-footer-text/60">
              Designing beautiful spaces that feel like home.
            </p>
          </motion.div>

          {/* Social Icons */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-4 md:gap-6">
            {socialLinks.map((social, index) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.ariaLabel}
                variants={itemVariants}
                transition={{ delay: 0.2 + index * 0.08 }}
                whileHover={{ scale: 1.1, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                className="social-icon group relative flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full border border-footer-text/20 transition-all duration-500 hover:border-bronze hover:bg-bronze/10 hover:text-bronze"
                role="listitem"
              >
                {typeof social.icon === 'function' ? (
                  <social.icon className="w-5 h-5 md:w-6 md:h-6 transition-colors duration-300 group-hover:text-bronze" aria-hidden="true" />
                ) : (
                  <social.icon size={22} md={24} strokeWidth={1.5} className="transition-colors duration-300 group-hover:text-bronze" aria-hidden="true" />
                )}
                {/* Circular outline hover effect */}
                <span className="absolute inset-0 rounded-full border border-transparent transition-all duration-300 group-hover:border-bronze group-hover:scale-110" aria-hidden="true" />
              </motion.a>
            ))}
          </motion.div>

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 md:mt-24 pt-8 md:pt-12 border-t border-white/10 text-center"
          >
            <p className="text-[11px] uppercase tracking-widest text-footer-text/30">
              &copy; {new Date().getFullYear()} HOK INTERIORS. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer