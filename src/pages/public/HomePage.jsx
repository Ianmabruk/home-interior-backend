import { motion } from 'framer-motion'
import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SectionTitle } from '../../components/common/SectionTitle'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import PositionedImage from '../../components/common/PositionedImage'
import LazyVideo from '../../components/common/LazyVideo'
import { getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'

export const HomePage = () => {
  const [feed, setFeed] = useState({
    heroVideo: null,
    projects: [],
    featuredProjects: [],
    portfolio: [],
    about: null,
  })
  const [loading, setLoading] = useState(true)

  const loadFeed = useCallback(() => {
    api
      .get('/content/homepage')
      .then((res) => {
        const payload = res.data
        setFeed({
          heroVideo: payload.heroVideo,
          projects: payload.projects || [],
          featuredProjects: payload.featuredProjects || [],
          portfolio: payload.portfolio || [],
          about: payload.about,
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
      <div className="min-h-screen bg-linen">
        <div className="skeleton h-[560px] sm:h-[600px] w-full" />
        <div className="section-pad container-wide">
          <div className="skeleton h-64 rounded-2xl sm:h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* ══════════════════════════════════════════
          SECTION 1 — HERO SHOWCASE VIDEO
          Cinematic full-width video showcase
      ══════════════════════════════════════════ */}
      <section className="relative h-screen max-h-[800px] min-h-[560px] overflow-hidden">
        {feed.heroVideo ? (
          <div className="h-full">
            <video
              src={getOptimizedVideoUrl(feed.heroVideo.url, { width: 1280 })}
              poster={getVideoPosterUrl(feed.heroVideo.url, { width: 1280 })}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="container-wide px-6 text-center sm:px-8 md:px-12 lg:px-20">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <p className="eyebrow mb-4 text-cream">Premium Interiors</p>
                  <h1 className="font-display text-4xl font-medium text-white sm:text-5xl md:text-6xl lg:text-7xl">
                    {feed.heroVideo.title || 'HOK Interior Designs'}
                  </h1>
                  <p className="mt-3 max-w-xl text-base text-cream/80 sm:text-lg md:max-w-2xl md:text-lg lg:max-w-3xl lg:text-xl">
                    {feed.heroVideo.description || 'Crafting spaces that inspire — from concept to completion.'}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-linen">
            <div className="text-center px-4">
              <p className="font-display text-3xl text-ink/30 sm:text-4xl">No showcase video yet</p>
              <p className="mt-2 text-sm text-ink/50">Upload videos from the Admin Dashboard</p>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2 — PORTFOLIO GALLERY
      ══════════════════════════════════════════ */}
      <section className="section-pad bg-cream">
          <div className="container-wide px-6 md:px-12 lg:px-20">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:mb-10 md:mb-12 md:flex-row md:items-end">
              <SectionTitle eyebrow="Portfolio" title="Curated Interiors" align="left" />
              <Link
                to="/portfolio"
                className="hidden items-center gap-2 text-2xs font-medium uppercase tracking-widest text-ink/45 transition hover:text-orange md:inline-flex"
              >
                View Full Portfolio <ArrowRight size={13} strokeWidth={1.5} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-4">
              {feed.portfolio.slice(0, 6).map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className={`group relative overflow-hidden rounded-2xl bg-sand ${
                    i === 0 ? 'col-span-2' : ''
                  }`}
                >
                  <PositionedImage
                    src={item.imageUrl}
                    alt={item.title}
                    settings={item.mediaSettings}
                    className={`transition duration-700 group-hover:scale-105 ${
                      i === 0 ? 'aspect-[4/3] sm:aspect-[16/10]' : 'aspect-[4/3]'
                    }`}
                    loading="lazy"
                    sizes={i === 0 ? '(min-width:768px) 66vw, 100vw' : '(min-width:768px) 33vw, 50vw'}
                  />
                  <div className="absolute inset-0 bg-ink/0 transition-all duration-500 group-hover:bg-ink/20" />
                  <div className="absolute inset-0 flex items-end opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="p-3 w-full bg-gradient-to-t from-black/60 to-transparent sm:p-4">
                      <p className="font-display text-lg font-medium text-white sm:text-xl">
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

            <div className="mt-8 text-center md:hidden">
              <Link to="/portfolio" className="btn-outline">
                View Full Portfolio <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </section>

      {/* ══════════════════════════════════════════
          SECTION 3 — FEATURED PROJECTS
      ══════════════════════════════════════════ */}
      <section className="section-pad bg-cream">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <SectionTitle eyebrow="Projects" title="Featured Work" align="left" />
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {feed.featuredProjects.map((project, i) => {
              const firstMedia = project.media?.length ? project.media[0] : (project.videoUrl ? { type: 'video', url: project.videoUrl } : (project.coverImageUrl ? { type: 'image', url: project.coverImageUrl } : null))
              return (
                <motion.article key={project._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: i * 0.1 }} className="group cursor-pointer">
                  <Link to={`/projects`} className="block">
                    <div className="relative overflow-hidden bg-linen aspect-[16/10]">
                      {firstMedia?.type === 'video' ? (
                        <LazyVideo src={getOptimizedVideoUrl(firstMedia.url, { width: 640 })} poster={getVideoPosterUrl(firstMedia.url, { width: 640 })} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                      ) : firstMedia?.type === 'image' ? (
                        <PositionedImage src={firstMedia.url} alt={project.title} settings={project.mediaSettings} className="h-full w-full transition duration-700 group-hover:scale-105" loading="lazy" sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-linen"><p className="text-sm text-ink/30">No media</p></div>
                      )}
                      <div className="absolute inset-0 bg-ink/0 transition-all duration-500 group-hover:bg-ink/15" />
                    </div>
                  </Link>
                  <div className="mt-4">
                    <h3 className="font-display text-2xl font-medium text-ink transition-colors group-hover:text-orange">{project.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/50 line-clamp-2">{project.description}</p>
                    {project.category && <p className="mt-2 text-2xs font-medium uppercase tracking-widest text-orange">{project.category}</p>}
                  </div>
                </motion.article>
              )
            })}
          </div>
          {feed.projects.length > 3 && (
            <div className="mt-10 text-center">
              <Link to="/projects" className="btn-outline">View All Projects <ArrowRight size={14} strokeWidth={1.5} /></Link>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 4 — ABOUT PARALLAX
      ══════════════════════════════════════════ */}
      <section className="relative bg-linen">
        {feed.about ? (
          <React.Fragment>
            <div className="flex items-center justify-center py-16 sm:py-20 md:py-24">
              <div className="container-wide px-6 md:px-12 lg:px-20">
                <div className="grid items-center gap-10 sm:gap-12 md:grid-cols-2 md:gap-16">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative"
                  >
                    {feed.about.aboutImageUrl ? (
                      <div className="w-full overflow-hidden rounded-2xl aspect-[4/3] sm:aspect-[4/5]">
                        <PositionedImage
                          src={feed.about.aboutImageUrl}
                          alt="Workspace"
                          settings={feed.about.mediaSettings}
                          loading="lazy"
                          sizes="(min-width:768px) 50vw, 100vw"
                        />
                      </div>
                    ) : (
                      <div className="w-full rounded-2xl bg-sand flex aspect-[4/3] items-center justify-center sm:aspect-[4/5]">
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
                    <h2 className="font-display text-3xl font-medium leading-tight text-ink sm:text-4xl md:text-4xl lg:text-5xl">
                      Crafting Excellence
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-ink/55 sm:text-base sm:mt-4">
                      Every space tells a story. We transform visions into reality with meticulous attention to detail.
                    </p>
                    {feed.about.mission && (
                      <div className="mt-5 border-l-4 border-orange pl-5 sm:mt-6">
                        <p className="text-sm leading-relaxed text-ink/70 sm:text-base">{feed.about.mission}</p>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="pb-16 sm:pb-20 md:pb-24 md:py-0">
              <div className="container-wide px-6 text-center md:px-12 lg:px-20">
                <Link to="/about" className="btn-primary">
                  Learn More <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </React.Fragment>
        ) : (
          <div className="flex items-center justify-center py-16 sm:py-20 md:py-24">
            <div className="container-wide px-6 text-center md:px-12 lg:px-20">
              <p className="eyebrow mb-4">Our Philosophy</p>
              <h2 className="font-display text-3xl font-medium leading-tight text-ink sm:text-4xl md:text-4xl lg:text-5xl">
                Crafting Excellence
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/55 sm:text-base sm:mt-4">
                Every space tells a story. We transform visions into reality with meticulous attention to detail.
              </p>
              <div className="mt-5 border-l-4 border-orange pl-5 sm:mt-6 inline-block text-left">
                <p className="text-sm leading-relaxed text-ink/70 sm:text-base">About content has not been configured yet.</p>
              </div>
              <div className="mt-8">
                <Link to="/about" className="btn-primary">
                  Learn More <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}