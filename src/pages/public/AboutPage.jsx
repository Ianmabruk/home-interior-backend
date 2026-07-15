import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Award, Leaf, Users, Target } from 'lucide-react'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import PositionedImage from '../../components/common/PositionedImage'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] } }),
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
}

export const AboutPage = () => {
  const [about, setAbout] = useState(null)
  const [loading, setLoading] = useState(true)
  const heroRef = useRef(null)
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, 150])
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.3])

  const loadAbout = () => {
    api.get('/content/about')
      .then((res) => setAbout(res.data))
      .catch(() => setAbout(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAbout() }, [])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'about-changed') loadAbout()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg">
        <div className="h-[70vh] w-full bg-linen/50" />
        <div className="section-pad container-wide px-6 md:px-12 lg:px-20">
          <div className="grid gap-16 md:grid-cols-2">
            <div className="space-y-6">
              <div className="skeleton h-8 w-32" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
            </div>
            <div className="space-y-4">
              <div className="skeleton h-32 w-full rounded-2xl" />
              <div className="skeleton h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!about) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-primary-bg">
        <div className="text-center">
          <h1 className="font-display text-6xl font-medium text-ink">About</h1>
          <p className="mt-6 text-sm text-ink/40">About content has not been configured yet.</p>
          <Link to="/" className="btn-primary mt-8">Go Home</Link>
        </div>
      </div>
    )
  }

  const values = [
    { icon: Award, title: 'Excellence', desc: about.mission || 'Crafting spaces that inspire and elevate everyday living.' },
    { icon: Leaf, title: 'Sustainability', desc: 'Committed to eco-friendly materials and responsible design practices.' },
    { icon: Users, title: 'Client Focus', desc: about.companyDescription || 'Every project begins with understanding your unique vision.' },
    { icon: Target, title: 'Precision', desc: about.vision || 'Attention to detail in every texture, shade, and silhouette.' },
  ]

  return (
    <motion.div className="min-h-screen bg-primary-bg" initial="hidden" animate="show" variants={staggerContainer}>
      {/* Hero Header */}
      <motion.section ref={heroRef} className="relative h-[70vh] min-h-[500px] overflow-hidden bg-dark-luxury" variants={fadeUp}>
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
          {about.aboutImageUrl && (
            <PositionedImage
              src={about.aboutImageUrl}
              alt="About HOK Interior Designs"
              settings={about.mediaSettings}
              className="h-full w-full"
              loading="eager"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-luxury/90 via-dark-luxury/50 to-transparent" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-dark-luxury/40 to-transparent" />
        <div className="relative z-10 flex h-full items-end">
          <div className="container-wide px-6 pb-16 md:px-12 lg:px-20 lg:pb-24">
            <motion.div variants={fadeUp} custom={0}>
              <p className="eyebrow mb-4 text-champagne/80">Our Story</p>
              <h1 className="font-display text-5xl font-medium leading-[0.95] text-white md:text-7xl lg:text-8xl">
                About HOK
              </h1>
              <p className="mt-6 max-w-xl text-base text-white/70 leading-relaxed">
                Redefining luxury interiors with timeless elegance and meticulous attention to detail since 2010.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Story + Values */}
      <section className="section-pad bg-primary-bg">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <div className="grid gap-16 lg:grid-cols-2">
            <motion.div variants={fadeUp} custom={0} className="space-y-6">
              {about.story && (
                <div>
                  <p className="eyebrow mb-4 text-warm-gold">Our Story</p>
                  <p className="text-lg leading-[1.8] text-ink/70">{about.story}</p>
                </div>
              )}
              {about.companyDescription && (
                <p className="text-base leading-[1.8] text-ink/55">{about.companyDescription}</p>
              )}
              {about.location && (
                <div className="pt-4">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-ink/40 mb-1">Location</p>
                  <p className="text-sm text-ink/60">{about.location}</p>
                </div>
              )}
            </motion.div>

            <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {values.map((value, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i + 1}
                  className="group relative overflow-hidden rounded-2xl border border-champagne/40 bg-white p-6 transition-all duration-500 hover:border-warm-gold/60 hover:shadow-lift"
                >
                  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-warm-gold to-champagne opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <value.icon size={28} strokeWidth={1.2} className="text-warm-gold mb-4" />
                  <h3 className="font-display text-xl font-medium text-ink">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/55">{value.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Mission + Vision Cards */}
          <motion.div variants={staggerContainer} className="mt-20 grid gap-6 md:grid-cols-2">
            {about.mission && (
              <motion.div variants={fadeUp} custom={0} className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-10 shadow-soft border border-champagne/30">
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-warm-gold via-champagne to-warm-gold" />
                <div className="pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target size={24} strokeWidth={1.5} className="text-warm-gold" />
                    <p className="eyebrow text-warm-gold">Mission</p>
                  </div>
                  <p className="text-base leading-[1.8] text-ink/65">{about.mission}</p>
                </div>
              </motion.div>
            )}
            {about.vision && (
              <motion.div variants={fadeUp} custom={1} className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-10 shadow-soft border border-champagne/30">
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-champagne via-warm-gold to-champagne" />
                <div className="pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award size={24} strokeWidth={1.5} className="text-warm-gold" />
                    <p className="eyebrow text-warm-gold">Vision</p>
                  </div>
                  <p className="text-base leading-[1.8] text-ink/65">{about.vision}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-dark-luxury">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(198,155,109,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(232,211,190,0.08),transparent_60%)]" />
        <div className="relative section-pad">
          <div className="container-narrow px-6 text-center">
            <motion.div variants={staggerContainer}>
              <motion.p variants={fadeUp} custom={0} className="eyebrow mb-4 text-champagne/50">Ready to Begin?</motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="font-display text-5xl font-medium text-white md:text-6xl lg:text-7xl leading-[1.05]">
                Let's Create<br />Something Beautiful
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-6 max-w-md mx-auto text-base text-white/50 leading-relaxed">
                Transform your space with our expert interior design services. Schedule a consultation today.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link to="/portfolio" className="btn-primary group">
                  View Our Work <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/virtual-interior-design" className="btn-outline border-white/25 text-white hover:bg-white hover:text-ink hover:border-white">
                  Virtual Showroom
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>
  )
}
