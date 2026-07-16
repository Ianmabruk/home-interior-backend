import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Award, Leaf, Users, Target, Building2, Sparkles, Image, PenTool, Layers, Clock } from 'lucide-react'
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

const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  show: (i = 0) => ({ opacity: 1, x: 0, transition: { duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] } }),
}

const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  show: (i = 0) => ({ opacity: 1, x: 0, transition: { duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] } }),
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
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="h-[70vh] w-full bg-[var(--secondary)]/50" />
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
      <div className="flex min-h-[70vh] items-center justify-center bg-[var(--bg)] px-6">
        <div className="text-center max-w-lg">
          <h1 className="font-display text-6xl font-normal text-[var(--primary)]">About</h1>
          <p className="mt-6 text-base text-[var(--primary)]/55 leading-relaxed">
            About content has not been configured yet. The admin can add the company story, mission, vision, values, and gallery images from the <strong className="text-[var(--primary)]">Admin Dashboard → About</strong> section.
          </p>
          <Link to="/" className="btn-luxury-primary mt-8 inline-block">Go Home</Link>
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

  const team = [
    { name: 'Sarah Mitchell', role: 'Founder & Creative Director', bio: '20+ years in luxury interior design', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80' },
    { name: 'James Chen', role: 'Lead Designer', bio: 'Specialist in modern luxury spaces', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
    { name: 'Elena Rodriguez', role: 'Senior Designer', bio: 'Expert in sustainable materials', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80' },
    { name: 'Michael Thompson', role: 'Project Manager', bio: 'Ensuring flawless execution', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80' },
  ]

  return (
    <motion.div className="min-h-screen bg-[var(--bg)]" initial="hidden" animate="show" variants={staggerContainer}>
      {/* Hero Header */}
      <motion.section ref={heroRef} className="relative h-[70vh] min-h-[500px] overflow-hidden bg-[var(--primary)]" variants={fadeUp}>
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
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/90 via-[var(--primary)]/50 to-transparent" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/40 to-transparent" />
        <div className="relative z-10 flex h-full items-end">
          <div className="container-wide px-6 pb-16 md:px-12 lg:px-20 lg:pb-24">
            <motion.div variants={fadeUp} custom={0}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]/80 mb-4">Our Story</p>
              <h1 className="font-display text-5xl font-normal leading-[0.95] text-white md:text-7xl lg:text-8xl">
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
      <section className="section-pad bg-[var(--bg)]">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <div className="grid gap-16 lg:grid-cols-2">
            <motion.div variants={fadeLeft} custom={0} className="space-y-6 max-w-3xl">
              {about.story && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Our Story</p>
                  <p className="text-lg leading-[1.8] text-[var(--primary)]">{about.story}</p>
                </div>
              )}
              {about.companyDescription && (
                <p className="text-base leading-[1.8] text-[var(--primary)]/55">{about.companyDescription}</p>
              )}
              {about.location && (
                <div className="pt-4">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/40 mb-1">Location</p>
                  <p className="text-sm text-[var(--primary)]/60">{about.location}</p>
                </div>
              )}
            </motion.div>

            <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {values.map((value, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i + 1}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-6 transition-all duration-500 hover:border-[var(--accent)]/60 hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)]"
                >
                  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <value.icon size={28} strokeWidth={1.2} className="text-[var(--accent)] mb-4" />
                  <h3 className="font-display text-xl font-normal text-[var(--primary)]">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--primary)]/55">{value.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Mission + Vision Cards */}
          <motion.div variants={staggerContainer} className="mt-20 grid gap-6 md:grid-cols-2">
            {about.mission && (
              <motion.div variants={fadeRight} custom={0} className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-10 shadow-[0_2px_16px_rgba(42,36,31,0.04)] border border-[var(--border)]">
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[var(--accent)] via-[var(--secondary)] to-[var(--accent)]" />
                <div className="pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target size={24} strokeWidth={1.5} className="text-[var(--accent)]" />
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">Mission</p>
                  </div>
                  <p className="text-base leading-[1.8] text-[var(--primary)]/65">{about.mission}</p>
                </div>
              </motion.div>
            )}
            {about.vision && (
              <motion.div variants={fadeLeft} custom={1} className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-10 shadow-[0_2px_16px_rgba(42,36,31,0.04)] border border-[var(--border)]">
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[var(--secondary)] via-[var(--accent)] to-[var(--secondary)]" />
                <div className="pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award size={24} strokeWidth={1.5} className="text-[var(--accent)]" />
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">Vision</p>
                  </div>
                  <p className="text-base leading-[1.8] text-[var(--primary)]/65">{about.vision}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-pad bg-[var(--secondary)]/50">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 md:mb-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Our Team</p>
            <h2 className="font-display text-4xl font-normal leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
               The People Behind HOK
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
              A collective of passionate designers, architects, and project managers dedicated to creating exceptional spaces.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                variants={fadeUp}
                custom={i}
                className="group relative overflow-hidden bg-white rounded-3xl shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500 border border-[var(--border)]"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/80 via-[var(--primary)]/30 to-transparent opacity-70 transition-all duration-700 group-hover:opacity-90" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <h3 className="font-display text-xl font-normal">{member.name}</h3>
                    <p className="text-sm text-white/80 mt-1">{member.role}</p>
                    <p className="text-xs text-white/60 mt-2">{member.bio}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="section-pad bg-[var(--bg)]">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 md:mb-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Our Process</p>
            <h2 className="font-display text-4xl font-normal leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
              From Vision to Reality
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
              A seamless four-step journey that transforms your space with precision and elegance.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { number: '01', title: 'Discovery', description: 'We begin with an in-depth consultation to understand your vision, lifestyle, and design preferences.', icon: Users },
              { number: '02', title: 'Concept Development', description: 'Our designers create mood boards, spatial layouts, and 3D visualizations tailored to your space.', icon: PenTool },
              { number: '03', title: 'Design Refinement', description: 'We collaborate with you to refine every detail — materials, finishes, furniture, and lighting.', icon: Layers },
              { number: '04', title: 'Execution', description: 'From procurement to installation, we manage the entire process ensuring flawless delivery.', icon: Clock },
            ].map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                custom={i}
                className="relative group"
              >
                <div className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-10 shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500 border border-[var(--border)]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5 border border-[var(--accent)]/20 group-hover:border-[var(--accent)] group-hover:bg-gradient-to-br group-hover:from-[var(--accent)]/20 group-hover:to-[var(--accent)]/10 transition-all duration-500">
                      <step.icon size={24} strokeWidth={1.5} className="text-[var(--accent)]" />
                    </div>
                    
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] text-center mb-2">{step.number}</p>
                    <h3 className="font-display text-xl font-normal text-[var(--primary)] text-center mb-3">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-[var(--primary)]/60 text-center">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Brand Stats */}
      <section className="section-pad bg-[var(--primary)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(230,211,203,0.08),transparent_60%)]" />
        <div className="relative section-pad">
          <div className="container-wide px-6 md:px-12 lg:px-20">
            <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '15+', label: 'Years Experience' },
                { value: '500+', label: 'Projects Completed' },
                { value: '50+', label: 'Team Members' },
                { value: '12', label: 'Awards Won' },
              ].map((stat, i) => (
                <motion.div key={stat.value} variants={fadeUp} custom={i} className="text-center">
                  <p className="font-display text-5xl md:text-6xl font-normal text-white">{stat.value}</p>
                  <p className="mt-2 text-sm text-white/60 uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-[var(--primary)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(230,211,203,0.08),transparent_60%)]" />
        <div className="relative section-pad">
          <div className="container-narrow px-6 text-center">
            <motion.div variants={staggerContainer}>
              <motion.p variants={fadeUp} custom={0} className="text-[11px] font-semibold uppercase tracking-widest text-[var(--secondary)]/50 mb-4">Ready to Begin?</motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="font-display text-5xl font-normal text-white md:text-6xl lg:text-7xl leading-[1.05]">
                Let&apos;s Create<br />Something Beautiful
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-6 max-w-md mx-auto text-base text-white/50 leading-relaxed">
                Transform your space with our expert interior design services. Schedule a consultation today.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link to="/contact" className="btn-luxury-primary group">
                  View Our Work <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/virtual-interior-design" className="btn-luxury-secondary group">
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