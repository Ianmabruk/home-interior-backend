import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Facebook, ArrowRight, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { FaTiktok, FaPinterest } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

export const Footer = () => {
  const { user } = useAuth()
  const [testimonials, setTestimonials] = useState([])
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        const res = await api.get('/content/testimonials')
        const data = res.data || []
        if (data.length > 0) {
          setTestimonials(data.filter(t => t.isActive))
        }
      } catch {
        setTestimonials([])
      }
    }
    loadTestimonials()
  }, [])

  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
      }, 6000)
      return () => clearInterval(interval)
    }
  }, [testimonials.length])

  const socialLinks = [
    { icon: FaTiktok, href: 'https://www.tiktok.com/@hokinteriors', label: 'TikTok', ariaLabel: 'Follow us on TikTok' },
    { icon: Instagram, href: 'https://www.instagram.com/hokinteriors', label: 'Instagram', ariaLabel: 'Follow us on Instagram' },
    { icon: Facebook, href: 'https://www.facebook.com/share/14i3V8Sw7uo', label: 'Facebook', ariaLabel: 'Follow us on Facebook' },
    { icon: FaPinterest, href: 'https://www.pinterest.com/hokinterior', label: 'Pinterest', ariaLabel: 'Follow us on Pinterest' },
  ]

const quickLinks = [
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/services', label: 'Services' },
    { to: '/virtual-design', label: 'Virtual Designs' },
    { to: '/about', label: 'About Us' },
    { to: '/account', label: 'My Account', auth: true },
    { to: '/register', label: 'Register', guest: true },
    { to: '/login', label: 'Login', guest: true },
  ]

  const filteredQuickLinks = quickLinks.filter(link => {
    if (link.auth && !user) return false
    if (link.guest && user) return false
    return true
  })

  return (
    <footer className="relative bg-footer-bg text-footer-text" role="contentinfo">
      {/* Testimonials Carousel Section */}
      {testimonials.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-footer-bg py-16 md:py-24 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(232,154,67,0.08),transparent_60%)]" aria-hidden="true" />
          <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-center mb-12 md:mb-16"
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-accent mb-4">Testimonials</p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal leading-tight text-white">
                What Our Clients Say
              </h2>
            </motion.div>

            <div className="relative max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-1 mb-6">
                    {Array.from({ length: 5 }, (_, i) => (
                      <motion.span
                        key={i}
                        animate={{ scale: i < (testimonials[currentTestimonial]?.rating || 5) ? 1 : 0.8 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Star size={20} fill="currentColor" className="text-orange-accent" />
                      </motion.span>
                    ))}
                  </div>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="font-display text-xl md:text-2xl lg:text-3xl font-normal leading-relaxed text-white/90 max-w-3xl mx-auto mb-8"
                    style={{ fontStyle: 'italic' }}
                  >
                    &ldquo;{testimonials[currentTestimonial]?.testimonial}&rdquo;
                  </motion.p>
                  <div className="flex items-center justify-center gap-4">
                    {testimonials[currentTestimonial]?.photoUrl && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="w-14 h-14 rounded-full overflow-hidden border-2 border-orange-accent/50 flex-shrink-0"
                      >
                        <img
                          src={testimonials[currentTestimonial].photoUrl}
                          alt={testimonials[currentTestimonial].clientName}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    )}
                    <div className="text-left">
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="font-medium text-white"
                      >
                        {testimonials[currentTestimonial]?.clientName}
                      </motion.p>
                      {testimonials[currentTestimonial]?.position && (
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.35 }}
                          className="text-sm text-white/60"
                        >
                          {testimonials[currentTestimonial].position}
                          {testimonials[currentTestimonial]?.company && `, ${testimonials[currentTestimonial].company}`}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {testimonials.length > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                    className="p-2 rounded-full bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-300"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft size={20} strokeWidth={1.5} />
                  </motion.button>
                  <div className="flex gap-2">
                    {testimonials.map((_, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.3 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentTestimonial(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          idx === currentTestimonial ? 'bg-orange-accent w-6' : 'bg-white/30 hover:bg-white/50'
                        }`}
                        aria-label={`Go to testimonial ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                    className="p-2 rounded-full bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-300"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight size={20} strokeWidth={1.5} />
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* Main Footer Content */}
      <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 py-16 md:py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="grid gap-12 md:gap-16 lg:grid-cols-2 xl:grid-cols-4"
        >
          {/* Section 1: Company Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-2 xl:col-span-1 space-y-6"
          >
            <Link to="/" className="inline-block group" aria-label="HOK INTERIOR DESIGNS - Home">
              <div className="flex flex-col items-start">
                <p className="font-display text-3xl md:text-4xl font-medium tracking-[0.25em] leading-tight text-white transition-colors duration-300 group-hover:text-orange-accent">
                  HOK
                </p>
                <p className="font-sans text-[11px] font-medium uppercase tracking-[0.35em] leading-none text-orange-accent -mt-1">
                  INTERIOR DESIGNS
                </p>
              </div>
            </Link>
            <p className="font-display text-lg md:text-xl leading-relaxed text-white/60 max-w-xs">
              Creating timeless interiors that transform spaces into experiences.
            </p>
            <div className="space-y-3 text-sm text-white/50">
              <p>+254 700 000 000</p>
              <p>info@hokinteriors.com</p>
              <p className="hidden md:block">Nairobi, Kenya</p>
            </div>
          </motion.div>

          {/* Section 2: Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="font-display text-xl font-normal text-white">Quick Links</h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-3" role="list">
                {filteredQuickLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/70 hover:text-orange-accent transition-colors duration-300 group inline-flex items-center gap-2"
                    >
                      {link.label}
                      <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1 text-orange-accent opacity-0 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.div>

          {/* Section 3: Social Media */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="font-display text-xl font-normal text-white">Follow Us</h3>
            <p className="text-sm text-white/50">Join our design community</p>
            <div className="flex items-center gap-3 md:gap-4 pt-2">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.ariaLabel}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.08 }}
                  whileHover={{ scale: 1.1, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                  className="social-icon group relative flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full border border-white/20 transition-all duration-500 hover:border-orange-accent hover:bg-orange-accent/10 hover:text-orange-accent"
                  role="listitem"
                >
                  <social.icon size={22} md={24} strokeWidth={1.5} className="transition-colors duration-300 group-hover:text-orange-accent" aria-hidden="true" />
                  <span className="absolute inset-0 rounded-full border border-transparent transition-all duration-300 group-hover:border-orange-accent group-hover:scale-110" aria-hidden="true" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 md:mt-24 pt-8 md:pt-12 border-t border-white/10 text-center"
        >
          <p className="text-[11px] uppercase tracking-widest text-white/30">
            &copy; {new Date().getFullYear()} HOK INTERIOR DESIGNS. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer