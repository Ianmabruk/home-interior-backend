import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SectionTitle } from '../../components/common/SectionTitle'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'

export const HomePage = () => {
  const [feed, setFeed] = useState({
    heroVideo: null,
    portfolio: [],
    about: null,
  })
  const [loading, setLoading] = useState(true)

  const loadFeed = useCallback(() => {
    api
      .get('/content/homepage')
      .then((res) => {
        const heroVideo = res.data.heroVideo || (res.data.projects?.[0]?.videoUrl ? {
          url: res.data.projects[0].videoUrl,
          title: res.data.projects[0].title,
          description: res.data.projects[0].description,
        } : null)
        setFeed({
          heroVideo,
          portfolio: res.data.portfolio || [],
          about: res.data.about,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadFeed() }, [loadFeed])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type) loadFeed().catch(() => {})
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadFeed])

  if (loading) {
    return (
      <div className="-mt-[88px] md:-mt-[108px]">
        <div className="skeleton h-screen w-full" />
        <div className="section-pad container-wide">
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="-mt-[88px] md:-mt-[108px]">
      {/* ══════════════════════════════════════════
          SECTION 1 — HERO SHOWCASE VIDEO
          Cinematic full-width video showcase
      ══════════════════════════════════════════ */}
      <section className="relative h-screen overflow-hidden">
        {feed.heroVideo ? (
          <div className="h-full">
            <video
              src={feed.heroVideo.url}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="container-wide px-6 md:px-12 lg:px-20 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <p className="eyebrow mb-4 text-cream">Premium Interiors</p>
                  <h1 className="font-display text-5xl font-medium text-white md:text-7xl">
                    {feed.heroVideo.title || 'HOK Interior Designs'}
                  </h1>
                  <p className="mt-4 max-w-2xl mx-auto text-lg text-cream/80">
                    {feed.heroVideo.description || 'Crafting spaces that inspire — from concept to completion.'}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-linen">
            <div className="text-center">
              <p className="font-display text-4xl text-ink/30">No showcase video yet</p>
              <p className="mt-2 text-sm text-ink/50">Upload videos from the Admin Dashboard</p>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2 — PORTFOLIO GALLERY
      ══════════════════════════════════════════ */}
      {feed.portfolio.length > 0 && (
        <section className="section-pad bg-cream">
          <div className="container-wide px-6 md:px-12 lg:px-20">
            <div className="mb-12 flex items-end justify-between">
              <SectionTitle eyebrow="Portfolio" title="Curated Interiors" align="left" />
              <Link
                to="/portfolio"
                className="hidden items-center gap-2 text-2xs font-medium uppercase tracking-widest text-ink/45 transition hover:text-orange md:inline-flex"
              >
                View Full Portfolio <ArrowRight size={13} strokeWidth={1.5} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {feed.portfolio.slice(0, 6).map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className={`group relative overflow-hidden rounded-2xl bg-sand ${
                    i === 0 ? 'col-span-2 row-span-2' : ''
                  }`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className={`w-full object-cover transition duration-700 group-hover:scale-105 ${
                      i === 0 ? 'h-[400px] md:h-full md:min-h-[600px]' : 'h-52 md:h-64'
                    }`}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-ink/0 transition-all duration-500 group-hover:bg-ink/20" />
                  <div className="absolute inset-0 flex items-end opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="p-4 w-full bg-gradient-to-t from-black/60 to-transparent">
                      <p className="font-display text-xl font-medium text-white">
                        {item.title}
                      </p>
                      {item.category && (
                        <p className="text-2xs font-medium uppercase tracking-widest text-white/65">
                          {item.category}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 text-center md:hidden">
              <Link to="/portfolio" className="btn-outline">
                View Full Portfolio <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          SECTION 3 — ABOUT PARALLAX
      ══════════════════════════════════════════ */}
      {feed.about && (
        <section className="relative h-[120vh] overflow-hidden bg-linen">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="container-wide px-6 md:px-12 lg:px-20">
              <div className="grid items-center gap-16 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative"
                >
                  {feed.about.aboutImageUrl ? (
                    <img
                      src={feed.about.aboutImageUrl}
                      alt="Workspace"
                      className="aspect-[4/5] w-full rounded-2xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-[4/5] w-full rounded-2xl bg-sand flex items-center justify-center">
                      <p className="text-sm text-ink/30">Premium workspace</p>
                    </div>
                  )}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <p className="eyebrow mb-4">Our Philosophy</p>
                  <h2 className="font-display text-4xl font-medium leading-tight text-ink md:text-5xl">
                    Crafting Excellence
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-ink/55">
                    Every space tells a story. We transform visions into reality with meticulous attention to detail.
                  </p>
                  {feed.about.mission && (
                    <div className="mt-6 border-l-4 border-orange pl-6">
                      <p className="text-sm leading-relaxed text-ink/70">{feed.about.mission}</p>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-20 left-0 right-0">
            <div className="container-wide px-6 md:px-12 lg:px-20 text-center">
              <Link to="/about" className="btn-primary">
                Learn More <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}