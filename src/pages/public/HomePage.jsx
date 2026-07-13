import { motion } from 'framer-motion'
import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SectionTitle } from '../../components/common/SectionTitle'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import PositionedImage from '../../components/common/PositionedImage'
import ProjectVideoShowcase from '../../components/common/ProjectVideoShowcase'

const sortByOrderThenDate = (items) =>
  [...(items || [])].sort((a, b) => {
    const orderDiff = (a.order || 0) - (b.order || 0)
    if (orderDiff !== 0) return orderDiff
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })

const toShowcaseItem = (project) => {
  if (!project) return null
  const mediaArr = Array.isArray(project.media) ? project.media : []
  const firstMedia = mediaArr.find((m) => m?.type === 'video' && m.url) || mediaArr.find((m) => m?.url)
  if (firstMedia) {
    return { type: firstMedia.type || 'video', url: firstMedia.url, mediaSettings: project.mediaSettings }
  }
  if (project.videoUrl) return { type: 'video', url: project.videoUrl, mediaSettings: project.mediaSettings }
  if (project.coverImageUrl) return { type: 'image', url: project.coverImageUrl, mediaSettings: project.mediaSettings }
  return null
}

export const HomePage = () => {
  const [feed, setFeed] = useState({
    projects: [],
    portfolio: [],
    about: null,
  })
  const [loading, setLoading] = useState(true)

  const loadFeed = useCallback(() => {
    const projectsP = api
      .get('/content/projects')
      .then((res) => res.data || [])
      .catch(() => [])
    const portfolioP = api
      .get('/content/portfolio')
      .then((res) => res.data || [])
      .catch(() => [])
    const aboutP = api
      .get('/content/about')
      .then((res) => res.data || null)
      .catch(() => null)

    return Promise.allSettled([projectsP, portfolioP, aboutP])
      .then(([projR, portR, aboutR]) => {
        const projects = projR.status === 'fulfilled' ? projR.value : []
        const portfolio = portR.status === 'fulfilled' ? portR.value : []
        const about = aboutR.status === 'fulfilled' ? aboutR.value : null

        const sortedProjects = sortByOrderThenDate(projects)

        setFeed({
          projects: sortedProjects,
          portfolio,
          about,
        })
      })
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
      <div className="min-h-screen bg-cream">
        <div className="section-pad container-wide">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-4">
            <div className="skeleton col-span-2 aspect-[4/3]" />
            <div className="skeleton aspect-[4/3]" />
            <div className="skeleton aspect-[4/3]" />
            <div className="skeleton aspect-[4/3]" />
            <div className="skeleton aspect-[4/3]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* ══════════════════════════════════════════
          SECTION 1 — PROJECTS VIDEO SHOWCASE
      ══════════════════════════════════════════ */}
      <section className="relative w-full">
        {feed.projects.length > 0 ? (
          <ProjectVideoShowcase videos={feed.projects.map(toShowcaseItem).filter(Boolean)} className="aspect-[16/9] w-full" />
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center bg-linen">
            <div className="text-center px-4">
              <p className="font-display text-2xl text-ink/30 sm:text-3xl">No projects yet</p>
              <p className="mt-2 text-sm text-ink/50">Upload projects from the Admin Dashboard</p>
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
          SECTION 3 — ABOUT
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
                    <p className="eyebrow mb-4">About HOK</p>
                    <h2 className="font-display text-3xl font-medium leading-tight text-ink sm:text-4xl md:text-4xl lg:text-5xl">
                      Crafting Excellence
                    </h2>
                    {feed.about.story && (
                      <p className="mt-3 text-sm leading-relaxed text-ink/55 sm:text-base sm:mt-4">
                        {feed.about.story}
                      </p>
                    )}
                    {feed.about.companyDescription && (
                      <p className="mt-3 text-sm leading-relaxed text-ink/55 sm:text-base">
                        {feed.about.companyDescription}
                      </p>
                    )}
                    {feed.about.mission && (
                      <div className="mt-5 border-l-4 border-orange pl-5 sm:mt-6">
                        <p className="text-sm leading-relaxed text-ink/70 sm:text-base">{feed.about.mission}</p>
                      </div>
                    )}
                    {feed.about.vision && (
                      <div className="mt-4 border-l-4 border-sand pl-5">
                        <p className="text-sm leading-relaxed text-ink/70 sm:text-base">{feed.about.vision}</p>
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
