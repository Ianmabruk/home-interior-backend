import { useState, useEffect, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { api } from '@services/api'
import { getOptimizedUrl, buildSrcSet } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { useIsMobile } from '@hooks/useIsMobile'

export const AboutPage = memo(() => {
  const [aboutData, setAboutData] = useState(null)
  const [aboutImages, setAboutImages] = useState([])
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const reduceMotion = useIsMobile()

  const loadAbout = useCallback(async () => {
    setError(null)
    try {
      const [aboutRes, imagesRes] = await Promise.all([
        api.get('/about'),
        api.get('/about/images'),
      ])
      setAboutData(aboutRes.data || null)
      setAboutImages(Array.isArray(imagesRes.data) ? imagesRes.data : [])
      setTeam([])
    } catch (err) {
      console.warn('[ABOUT] Failed to load:', err?.message)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const retry = useCallback(() => {
    setLoading(true)
    loadAbout()
  }, [loadAbout])

  useEffect(() => {
    loadAbout()
  }, [loadAbout])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'about-changed' || payload?.type === 'team-changed') loadAbout()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadAbout])

  useEffect(() => {
    const handleOnline = () => {
      if (error) loadAbout()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [error, loadAbout])

  const story =
    aboutData?.story ||
    aboutData?.content ||
    aboutData?.description ||
    'We are a team of passionate designers dedicated to creating spaces that inspire and delight. With years of experience and a commitment to excellence, we bring your vision to life through thoughtful design, premium materials, and meticulous attention to detail.'

  const mission =
    aboutData?.mission ||
    'To transform spaces into timeless environments that reflect the unique personality and lifestyle of each client.'

  const vision =
    aboutData?.vision ||
    'To be the leading luxury interior design studio recognized for creating iconic spaces that stand the test of time.'

  const activeImages = aboutImages.filter((img) => img.isActive !== false)

  if (loading) {
    return (
      <main>
        <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide">
            <div className="grid items-center gap-12 lg:gap-24 lg:grid-cols-2">
              <div className="relative animate-fade-up">
                <div className="aspect-[4/5] md:aspect-[3/4] rounded-3xl skeleton" />
              </div>
              <div className="space-y-8 md:space-y-10 max-w-3xl animate-fade-up" style={{ animationDelay: '0.1s' }}>
                <div className="skeleton h-3 w-24 mb-4" />
                <div className="skeleton h-8 w-full mb-4" />
                <div className="skeleton h-8 w-3/4 mb-4" />
                <div className="skeleton h-6 w-full mb-4" />
                <div className="skeleton h-6 w-1/2 mb-4" />
                <div className="skeleton h-10 w-32" />
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (error && !aboutData) {
    return (
      <main>
        <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide text-center">
            <h1 className="font-display text-5xl md:text-7xl font-semibold text-white leading-tight">About Us</h1>
            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto">Unable to load about content. Please check your connection.</p>
            <button onClick={retry} className="mt-6 btn-luxury-primary">Retry</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main>
      <PageMeta
        title="About Us — HOK Interior Designs"
        description="Learn about HOK Interior Designs — our story, philosophy, and design team."
      />
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-[var(--bg)]" />
        <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-tight"
          >
            {aboutData?.title || 'About Us'}
          </motion.h1>
          {aboutData?.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
            >
              {aboutData.subtitle}
            </motion.p>
          )}
        </div>
      </section>

      {activeImages.length > 0 && (
        <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-12 md:py-20">
          <div className="container-wide">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {activeImages.map((img, index) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={getOptimizedUrl(img.imageUrl, { width: 960, crop: 'limit' })}
                      srcSet={buildSrcSet(img.imageUrl) || undefined}
                      sizes={buildSrcSet(img.imageUrl) ? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw' : undefined}
                      alt={`About image ${index + 1}`}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      width={600}
                      height={750}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32"
      >
        <div className="container-wide">
          <div className="grid items-center gap-12 lg:gap-24 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="relative overflow-hidden shadow-[0_32px_100px_rgba(42,36,31,0.12),_0_0_0_1px_rgba(232,154,67,0.15),_0_0_0_4px_rgba(250,248,244,0.8),_inset_0_1px_0_rgba(255,255,255,0.1)] aspect-[4/5] md:aspect-[3/4] rounded-3xl bg-[var(--bg)]">
                <div className="absolute inset-0 border-2 border-[var(--accent)]/20 rounded-3xl pointer-events-none" />
                <div className="absolute inset-[2px] border border-white/30 rounded-[22px] pointer-events-none" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--secondary)] to-[var(--accent)] rounded-t-full" />
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-[var(--accent)]/40 rounded-tl-3xl pointer-events-none" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-[var(--accent)]/40 rounded-tr-3xl pointer-events-none" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-[var(--accent)]/40 rounded-bl-3xl pointer-events-none" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-[var(--accent)]/40 rounded-br-3xl pointer-events-none" />

                {activeImages.length > 0 ? (
                  <img
                    src={getOptimizedUrl(activeImages[0].imageUrl, { width: 960, crop: 'limit' })}
                    srcSet={buildSrcSet(activeImages[0].imageUrl) || undefined}
                    sizes={buildSrcSet(activeImages[0].imageUrl) ? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw' : undefined}
                    alt="Luxury interior design studio"
                    className="relative z-10 h-full w-full object-cover transition duration-[1.2s] hover:scale-105 rounded-3xl"
                    loading="lazy"
                    decoding="async"
                    width={960}
                    height={1200}
                  />
                ) : (
                  <div className="relative z-10 h-full w-full flex items-center justify-center text-[var(--primary)]/20">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} aria-hidden="true">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/10 to-transparent pointer-events-none rounded-3xl" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8 md:space-y-10 max-w-3xl"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Our Story</p>
                <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-[var(--primary)] leading-[1.15]">
                  Designing Spaces,
                  <br />
                  Creating Memories
                </h3>
              </div>
              <p className="text-base md:text-lg leading-[1.8] text-[var(--primary)]/70">{story}</p>

              <div className="py-2 border-t border-b border-[var(--secondary)]/40">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-3">Our Philosophy</p>
                <p className="font-display text-xl md:text-2xl text-[var(--primary)] italic leading-relaxed">{mission}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-3">Our Vision</p>
                  <p className="text-base md:text-lg leading-[1.8] text-[var(--primary)]/70">{vision}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {team.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 px-6 md:px-12 lg:px-20 py-20 md:py-32"
        >
          <div className="container-wide">
            <div className="mb-16 md:mb-24 text-center animate-fade-up">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Our Team</p>
              <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
                Meet Our Designers
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
                A passionate team of designers, architects, and project managers dedicated to bringing your vision to life.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
              {team.map((member, index) => (
                <motion.div
                  key={member.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="group text-center"
                >
                  <div className="relative mb-6">
                    <div className="relative rounded-full overflow-hidden w-48 h-48 mx-auto bg-[var(--secondary)]/30">
                      {member.imageUrl ? (
                        <img
                          src={getOptimizedUrl(member.imageUrl, { width: 300, crop: 'fill' })}
                          srcSet={buildSrcSet(member.imageUrl) || undefined}
                          sizes={buildSrcSet(member.imageUrl) ? '(max-width: 768px) 192px, 192px' : undefined}
                          alt={member.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                          width={300}
                          height={300}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[var(--primary)]/30">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-medium text-[var(--primary)]">{member.name}</h3>
                  <p className="mt-1 text-sm text-[var(--primary)]/60">{member.role}</p>
                  {member.bio && <p className="mt-2 text-sm text-[var(--primary)]/50 line-clamp-2">{member.bio}</p>}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* INTERNAL LINKS */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-16 md:py-24"
      >
        <div className="container-wide text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Explore More</p>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-[var(--primary)] mb-8">Discover Our Work</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/portfolio" className="btn-luxury-primary">View Portfolio</Link>
            <Link to="/services" className="btn-luxury-secondary">Our Services</Link>
            <Link to="/contact" className="btn-luxury-secondary">Get In Touch</Link>
          </div>
        </div>
      </motion.section>
    </main>
  )
})

AboutPage.displayName = 'AboutPage'

export default AboutPage
