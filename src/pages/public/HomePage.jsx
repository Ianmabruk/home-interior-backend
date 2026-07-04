import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SectionTitle } from '../../components/common/SectionTitle'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'

export const HomePage = () => {
  const [feed, setFeed] = useState({
    projects: [],
    portfolio: [],
    about: null,
    virtualDesign: [],
  })
  const [loading, setLoading] = useState(true)

  const loadFeed = useCallback(() => {
    api
      .get('/content/homepage')
      .then((res) => setFeed(res.data))
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

  const projectVideos = useMemo(() => {
    const videos = []
    feed.projects.forEach((project) => {
      const mediaVideos = (project.media || []).filter((m) => m.type === 'video')
      mediaVideos.forEach((m) => {
        videos.push({ ...m, title: project.title, description: project.description })
      })
      if (!mediaVideos.length && project.videoUrl) {
        videos.push({ type: 'video', url: project.videoUrl, title: project.title, description: project.description })
      }
    })
    return videos
  }, [feed.projects])

  const portfolioGrid = feed.portfolio.slice(0, 6)

  if (loading) {
    return (
      <div className="-mt-[88px] md:-mt-[108px]">
        <div className="skeleton h-[60vh] w-full" />
        <div className="section-pad container-wide grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-80" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="-mt-[88px] md:-mt-[108px]">

      {/* ══════════════════════════════════════════
          SECTION 1 — HERO VIDEO GALLERY
          Full-width, cinematic videos with smooth transitions
      ══════════════════════════════════════════ */}
      <section className="bg-linen">
        {projectVideos.length > 0 ? (
          <div className="h-[60vh] md:h-[70vh] overflow-hidden">
            <VideoCarousel videos={projectVideos} />
          </div>
        ) : (
          <div className="flex h-[60vh] md:h-[70vh] items-center justify-center">
            <div className="text-center">
              <p className="font-display text-3xl text-ink/30">No project videos yet</p>
              <p className="mt-2 text-sm text-ink/50">Upload videos from the Admin Dashboard</p>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2 — PORTFOLIO PREVIEW
      ══════════════════════════════════════════ */}
      {portfolioGrid.length > 0 && (
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
              {portfolioGrid.map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.07 }}
                  className={`group relative overflow-hidden bg-sand ${
                    i === 0 ? 'col-span-2 md:col-span-1 md:row-span-2' : ''
                  }`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className={`w-full object-cover transition duration-700 group-hover:scale-105 ${
                      i === 0 ? 'h-[320px] md:h-full md:min-h-[500px]' : 'h-52 md:h-60'
                    }`}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-ink/0 transition-all duration-500 group-hover:bg-ink/20" />
                  <div className="absolute bottom-0 left-0 right-0 translate-y-full p-4 transition-transform duration-400 group-hover:translate-y-0">
                    <p className="font-display text-xl font-medium text-white">
                      {item.title}
                    </p>
                    {item.category && (
                      <p className="text-2xs font-medium uppercase tracking-widest text-white/65">
                        {item.category}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link to="/portfolio" className="btn-outline">
                View Full Portfolio <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          SECTION 3 — ABOUT
      ══════════════════════════════════════════ */}
      {feed.about && (
        <section className="section-pad bg-white">
          <div className="container-wide px-6 md:px-12 lg:px-20">
            <div className="grid items-center gap-16 md:grid-cols-2">
              {/* Image */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                {feed.about.aboutImageUrl ? (
                  <img
                    src={feed.about.aboutImageUrl}
                    alt="About HOK Interior Designs"
                    className="aspect-[4/5] w-full object-cover bg-sand"
                    loading="lazy"
                  />
                ) : (
                  <div className="aspect-[4/5] w-full bg-sand flex items-center justify-center">
                    <p className="text-sm text-ink/30">No image uploaded</p>
                  </div>
                )}
                <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full border border-sand/50" />
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, delay: 0.15 }}
              >
                <p className="eyebrow mb-4">About HOK</p>
                <h2 className="font-display text-5xl font-medium leading-tight text-ink md:text-6xl">
                  {feed.about.vision || 'Crafting Spaces That Inspire'}
                </h2>
                <p className="mt-6 text-base leading-relaxed text-ink/55">
                  {feed.about.story || feed.about.companyDescription}
                </p>
                {feed.about.mission && (
                  <div className="mt-6 border-l-2 border-orange pl-5">
                    <p className="text-sm leading-relaxed text-ink/55">{feed.about.mission}</p>
                  </div>
                )}
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link to="/about" className="btn-primary">
                    Learn More <ArrowRight size={14} strokeWidth={1.5} />
                  </Link>
                  <Link to="/virtual-interior-design" className="btn-outline">
                    Virtual Interior Design
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

const VideoCarousel = ({ videos }) => {
  const [current, setCurrent] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying || videos.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % videos.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isPlaying, videos.length])

  const goToSlide = (index) => setCurrent(index)

  return (
    <div className="relative h-full w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <video
            src={videos[current].url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Thumbnails */}
      {videos.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 px-4">
          {videos.map((video, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`relative h-12 w-16 overflow-hidden rounded-lg transition-all ${
                i === current ? 'ring-2 ring-orange scale-110' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <video
                src={video.url}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}