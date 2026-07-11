import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import PositionedImage from '../../components/common/PositionedImage'
import LazyVideo from '../../components/common/LazyVideo'
import { getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'

const getFirstMedia = (project) => {
  if (Array.isArray(project.media) && project.media.length) return project.media[0]
  if (project.videoUrl) return { type: 'video', url: project.videoUrl }
  if (project.coverImageUrl) return { type: 'image', url: project.coverImageUrl }
  return null
}

const getCategories = (projects) => {
  const cats = new Set()
  projects.forEach((p) => p.category && cats.add(p.category))
  return Array.from(cats)
}

export const ProjectsPage = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('')

  const loadProjects = () => {
    api.get('/content/projects')
      .then((res) => setProjects(res.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProjects() }, [])

  // Listen for admin changes
  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'projects-changed') loadProjects()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [])

  useEffect(() => {
    if (selected) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  const categories = useMemo(() => getCategories(projects), [projects])

  const filtered = useMemo(() => {
    if (!categoryFilter) return projects
    return projects.filter((p) => p.category === categoryFilter)
  }, [projects, categoryFilter])

  return (
    <div>
      {/* Header */}
      <div className="section-pad bg-cream pb-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="eyebrow mb-4">Design Work</p>
            <h1 className="font-display text-6xl font-medium leading-tight text-ink md:text-7xl">Projects</h1>
            <p className="mt-4 max-w-xl text-base text-ink/50">
              Interior design projects — videos and images from our portfolio.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="border-b border-sand bg-linen">
          <div className="container-wide overflow-x-auto px-6 md:px-12 lg:px-20">
            <div className="flex items-center gap-1 py-4 min-w-max">
              <button
                onClick={() => setCategoryFilter('')}
                className={`px-5 py-2 text-2xs font-medium uppercase tracking-widest transition ${
                  !categoryFilter ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                  className={`px-5 py-2 text-2xs font-medium uppercase tracking-widest transition ${
                    categoryFilter === cat ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="section-pad bg-cream pt-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          {loading && (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="skeleton aspect-[16/10] w-full" />
                  <div className="mt-4 space-y-2">
                    <div className="skeleton h-6 w-48" />
                    <div className="skeleton h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-24 text-center">
              <p className="font-display text-3xl text-ink/30">No projects published yet.</p>
            </div>
          )}

          <div className="grid gap-10 md:grid-cols-2">
            {filtered.map((project, i) => {
              const firstMedia = getFirstMedia(project)
              const allMedia = project.media?.length ? project.media : [firstMedia].filter(Boolean)
              const beforeAfter = project.beforeAfterImages || []
              return (
                <motion.article
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.6 }}
                  className="group cursor-pointer"
                  onClick={() => setSelected(project)}
                >
                  <div className="relative overflow-hidden bg-linen aspect-[16/10]">
                    {firstMedia?.type === 'video' ? (
                      <LazyVideo src={getOptimizedVideoUrl(firstMedia.url, { width: 640 })} poster={getVideoPosterUrl(firstMedia.url, { width: 640 })} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    ) : firstMedia?.type === 'image' ? (
                      <PositionedImage src={firstMedia.url} alt={project.title} settings={project.mediaSettings} className="h-full w-full transition duration-700 group-hover:scale-105" loading="lazy" sizes="(min-width:768px) 50vw, 100vw" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-linen">
                        <p className="text-sm text-ink/30">No media</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-ink/0 transition-all duration-500 group-hover:bg-ink/15" />
                    {allMedia.length > 1 && (
                      <span className="absolute right-4 top-4 bg-white/90 px-3 py-1 text-2xs font-medium uppercase tracking-widest text-ink">
                        {allMedia.length} items
                      </span>
                    )}
                    {beforeAfter.length > 0 && (
                      <span className="absolute right-4 bottom-4 bg-orange/90 px-3 py-1 text-2xs font-medium uppercase tracking-widest text-white">
                        Before/After
                      </span>
                    )}
                  </div>
                  <div className="pt-5">
                    <h2 className="font-display text-3xl font-medium text-ink transition-colors group-hover:text-orange">
                      {project.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink/50 line-clamp-2">{project.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-2xs font-medium uppercase tracking-widest text-ink/40 transition group-hover:text-orange">
                      View Project <ArrowRight size={12} strokeWidth={1.5} />
                    </span>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal - Full Project View */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4 md:p-8"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden bg-white rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center bg-white/90 text-ink transition hover:bg-white rounded-full"
                aria-label="Close"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
              
              <div className="max-h-[70vh] overflow-y-auto p-6">
                <h2 className="font-display text-3xl font-medium mb-4">{selected.title}</h2>
                {selected.description && (
                  <p className="text-sm text-ink/60 mb-6">{selected.description}</p>
                )}
                
                {/* Before/After Section */}
                {selected.beforeAfterImages?.length > 0 && (
                  <div className="mb-8">
                    <p className="text-2xs font-medium uppercase tracking-widest text-orange mb-4">Before & After</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {selected.beforeAfterImages.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img src={img.url} alt={img.label || `View ${idx + 1}`} className="w-full object-cover aspect-[4/3] rounded-lg" />
                          {img.label && (
                            <p className="absolute bottom-2 left-2 bg-ink/70 text-white text-2xs px-2 py-1 rounded">{img.label}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Project Gallery */}
                <div className="grid gap-6">
                  {(selected.media?.length
                    ? selected.media
                    : [getFirstMedia(selected)].filter(Boolean)
                  ).map((m, idx) =>
                    m.type === 'video' ? (
                      <video key={idx} src={m.url} controls autoPlay muted loop playsInline className="w-full rounded-lg" />
                    ) : (
                      <img key={idx} src={m.url} alt={`${selected.title} ${idx + 1}`} className="w-full object-contain rounded-lg" />
                    ),
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}