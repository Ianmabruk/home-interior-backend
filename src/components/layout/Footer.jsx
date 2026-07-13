import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SHOP_CATEGORIES } from '../../utils/constants'
import { NewsletterForm } from '../common/NewsletterForm'
import { api } from '../../services/api'
import { Instagram, Facebook, Star } from 'lucide-react'
import { SiTiktok } from 'react-icons/si'
import { SiPinterest } from 'react-icons/si'

const SOCIAL_LINKS = [
  {
    key: 'tiktok',
    Icon: SiTiktok,
    label: 'TikTok',
    url: 'https://www.tiktok.com/@esther.k.musa?_r=1&_t=ZS-97myTEWJqDZ',
  },
  {
    key: 'instagram',
    Icon: Instagram,
    label: 'Instagram',
    url: 'https://www.instagram.com/hokinteriors?igsh=OG1tZ2xuOG9mMWRl',
  },
  {
    key: 'facebook',
    Icon: Facebook,
    label: 'Facebook',
    url: 'https://www.facebook.com/share/14i3V8Sw7uo/?mibextid=wwXIfr',
  },
  {
    key: 'pinterest',
    Icon: SiPinterest,
    label: 'Pinterest',
    url: 'https://www.pinterest.com/hokinterior',
  },
]

export const Footer = () => {
  const [about, setAbout] = useState(null)
  const [testimonials, setTestimonials] = useState([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    api.get('/content/about').then((res) => setAbout(res.data)).catch(() => setAbout(null))
  }, [])

  useEffect(() => {
    api.get('/content/testimonials').then((res) => setTestimonials(res.data || [])).catch(() => setTestimonials([]))
  }, [])

  // Auto-advance the carousel with a smooth fade (FIX #3).
  useEffect(() => {
    if (testimonials.length < 2) return undefined
    const id = setInterval(() => setActive((i) => (i + 1) % testimonials.length), 6000)
    return () => clearInterval(id)
  }, [testimonials.length])

  return (
    <footer className="bg-black text-white">
      {/* Newsletter band */}
      <div className="border-b border-white/10 bg-black/90">
        <div className="container-wide flex flex-col items-center gap-6 px-6 py-12 text-center md:flex-row md:justify-between md:text-left md:px-12 lg:px-20">
          <div>
            <p className="text-2xs font-medium uppercase tracking-widest text-orange mb-2">Stay Inspired</p>
            <h3 className="font-display text-3xl font-medium text-white md:text-4xl">
              Design Notes & Curated Drops
            </h3>
          </div>
          <div className="w-full max-w-sm">
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="container-wide grid gap-12 px-6 py-16 md:grid-cols-4 md:px-12 lg:px-20">
        {/* Brand */}
        <div>
          <Link to="/">
            <p className="font-display text-3xl font-semibold text-white">HOK</p>
            <p className="text-2xs font-medium uppercase tracking-widest text-orange">Interior Designs</p>
          </Link>
          <p className="mt-5 text-sm leading-relaxed text-white/60">
            Crafting spaces that inspire — from concept to completion.
          </p>
          {/* Social Icons */}
          <div className="mt-6 flex items-center gap-3">
            {SOCIAL_LINKS.map(({ key, Icon, label, url }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 transition-all duration-200 hover:scale-110 hover:border-orange hover:bg-orange/20 hover:text-orange hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange/30"
              >
                <Icon size={18} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div>
          <p className="text-2xs font-medium uppercase tracking-widest text-white/40 mb-5">Explore</p>
          <ul className="space-y-3 text-sm text-white/70">
             {[
               { to: '/shop', label: 'Shop' },
               { to: '/portfolio', label: 'Portfolio' },
               { to: '/virtual-interior-design', label: 'Virtual Interior Design' },
               { to: '/about', label: 'About Us' },
             ].map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition-colors hover:text-orange">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Shop Categories */}
        <div>
          <p className="text-2xs font-medium uppercase tracking-widest text-white/40 mb-5">Shop Categories</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-white/70">
            {SHOP_CATEGORIES.map((category) => (
              <li key={category}>
                <Link
                  to={`/shop?category=${encodeURIComponent(category)}`}
                  className="transition-colors hover:text-orange"
                >
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-2xs font-medium uppercase tracking-widest text-white/40 mb-5">Contact</p>
          <div className="space-y-3 text-sm">
            {about?.location && (
              <p className="flex items-start gap-2 text-white/70">
                <span className="mt-0.5 text-orange">↟</span>
                {about.location}
              </p>
            )}
            {about?.contactEmail && (
              <p>
                <a href={`mailto:${about.contactEmail}`} className="text-white/70 transition hover:text-orange">
                  {about.contactEmail}
                </a>
              </p>
            )}
            {!about?.location && !about?.contactEmail && (
              <p className="text-white/30">Contact info not configured</p>
            )}
          </div>
          <div className="mt-8">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 border border-white/20 px-5 py-2.5 text-2xs font-medium uppercase tracking-widest text-white/60 transition hover:border-orange hover:text-orange"
            >
              Get In Touch
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials carousel (FIX #3) */}
      {testimonials.length > 0 && (
        <div className="border-t border-white/10 bg-black px-6 py-16 md:px-12 lg:px-20">
          <div className="container-wide">
            <p className="text-2xs font-medium uppercase tracking-[0.3em] text-orange text-center mb-8">
              What Our Clients Say
            </p>
            <div className="relative mx-auto max-w-3xl min-h-[220px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="text-center"
                >
                  {testimonials[active]?.photoUrl && (
                    <img
                      src={testimonials[active].photoUrl}
                      alt={testimonials[active].clientName}
                      className="mx-auto mb-5 h-16 w-16 rounded-full object-cover ring-2 ring-orange/40"
                      loading="lazy"
                    />
                  )}
                  <div className="mb-4 flex items-center justify-center gap-1 text-orange">
                    {Array.from({ length: testimonials[active]?.rating || 5 }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
                    “{testimonials[active]?.testimonial}”
                  </p>
                  <p className="mt-5 text-sm font-medium text-white">{testimonials[active]?.clientName}</p>
                  {testimonials[active]?.position && (
                    <p className="text-2xs uppercase tracking-widest text-white/50">
                      {[testimonials[active].position, testimonials[active].company].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {testimonials.length > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    aria-label={`Show testimonial ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === active ? 'w-8 bg-orange' : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-6 py-5 md:px-12 lg:px-20">
        <div className="container-wide flex flex-col items-center justify-between gap-3 text-2xs text-white/40 md:flex-row">
          <p>© {new Date().getFullYear()} HOK Interior Designs. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/about" className="hover:text-orange transition-colors">Privacy</Link>
            <Link to="/about" className="hover:text-orange transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}