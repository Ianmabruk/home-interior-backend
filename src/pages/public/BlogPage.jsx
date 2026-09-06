import { useState, useEffect, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Tag, Grid3X3 } from 'lucide-react'
import { api, clearApiCache } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { SectionErrorBoundary } from '@components/home/SectionErrorBoundary'
import { getBlogImageUrl } from '@utils/blogHelpers'
import { getOptimizedUrl, buildSrcSet } from '@utils/cloudinaryHelpers'
import BlogCard from '@components/blog/BlogCard'
import { useIsMobile } from '@hooks/useIsMobile'

const SkeletonGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="group flex flex-col">
        <div className="aspect-[4/3] w-full rounded-3xl skeleton mb-4" />
        <div className="skeleton h-5 w-3/4 rounded-lg mb-2" />
        <div className="skeleton h-4 w-full rounded-lg mb-2" />
        <div className="skeleton h-4 w-1/2 rounded-lg" />
      </div>
    ))}
  </div>
)

export const BlogPage = memo(() => {
  const [blogs, setBlogs] = useState([])
  const [featuredBlog, setFeaturedBlog] = useState(null)
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const reduceMotion = useIsMobile()

  const searchTerm = searchParams.get('search') || ''
  const activeCategory = searchParams.get('category') || ''
  const activeTag = searchParams.get('tag') || ''
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  const loadMeta = useCallback(async () => {
    try {
      const res = await api.get('/blog/categories')
      if (res.data) {
        setCategories(res.data.categories || [])
        setTags(res.data.tags || [])
      }
    } catch (err) {
      console.warn('[BlogPage] Failed to load categories/tags:', err?.message)
    } finally {
      setLoadingMeta(false)
    }
  }, [])

  const loadBlogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '12',
      })
      if (searchTerm) params.set('search', searchTerm)
      if (activeCategory) params.set('category', activeCategory)
      if (activeTag) params.set('tag', activeTag)
      params.set('sort', 'createdAt:desc')

      const res = await api.get(`/blog?${params.toString()}`)
      const data = Array.isArray(res.data) ? res.data : res.data?.items || []
      setBlogs(data)

      const featured = data.find((b) => b.featured) || data[0] || null
      setFeaturedBlog(featured)
    } catch (err) {
      console.warn('[BlogPage] Failed to load blogs:', err?.message)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, activeCategory, activeTag])

  useEffect(() => {
    loadBlogs()
  }, [loadBlogs])

  useEffect(() => {
    loadMeta()
  }, [loadMeta])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'blog-changed') {
        clearApiCache('/blog')
        loadBlogs()
        loadMeta()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadBlogs, loadMeta])

  const handleSearch = (e) => {
    const value = e.target.value.trim()
    if (value) {
      setSearchParams({ search: value, page: '1' })
    } else {
      const newParams = { ...searchParams }
      delete newParams.search
      newParams.page = '1'
      setSearchParams(newParams)
    }
  }

  const handleCategory = (cat) => {
    if (cat === activeCategory) {
      const newParams = { ...searchParams }
      delete newParams.category
      setSearchParams(newParams)
    } else {
      setSearchParams({ category: cat, page: '1' })
    }
  }

  const handleTag = (tag) => {
    if (tag === activeTag) {
      const newParams = { ...searchParams }
      delete newParams.tag
      setSearchParams(newParams)
    } else {
      setSearchParams({ tag, page: '1' })
    }
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasActiveFilters = searchTerm || activeCategory || activeTag
  const displayBlogs = featuredBlog ? blogs.filter((b) => (b.id || b._id) !== (featuredBlog.id || featuredBlog._id)) : blogs

  useEffect(() => {
    const blogListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'HOK Interiors Blog',
      description: 'Design insights, trends, and inspiration from HOK Interiors.',
      url: 'https://hokinteriors.com/blog',
      itemListElement: displayBlogs.slice(0, 12).map((blog, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://hokinteriors.com/blog/${blog.slug || blog.id}`,
        name: blog.title,
      })),
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(blogListSchema)
    script.setAttribute('data-structured-data', 'blog-list')
    document.head.appendChild(script)

    const existing = document.querySelector('script[data-structured-data="blog-list"]')
    if (existing && existing !== script) existing.remove()

    return () => {
      const el = document.querySelector('script[data-structured-data="blog-list"]')
      if (el) el.remove()
    }
  }, [displayBlogs])

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <PageMeta
        title="HOK Interiors Blog"
        description="Explore the latest trends in interior design, furniture, and virtual design from HOK Interiors."
      />

      <div className="container-wide mx-auto px-6 md:px-12 lg:px-20 py-12 md:py-20">
        {/* Featured Article */}
        {!loading && featuredBlog && (
          <SectionErrorBoundary sectionName="FeaturedArticle">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mb-16"
            >
              <Link to={`/blog/${featuredBlog.slug || featuredBlog.id}`} className="group block">
                <div className="relative aspect-[2/1] w-full overflow-hidden rounded-3xl">
                  {getBlogImageUrl(featuredBlog) ? (
                    <>
                      <img
                        src={getOptimizedUrl(getBlogImageUrl(featuredBlog), { width: 1200, crop: 'limit' }) || getBlogImageUrl(featuredBlog)}
                        srcSet={buildSrcSet(getBlogImageUrl(featuredBlog)) || undefined}
                        sizes="100vw"
                        alt={featuredBlog.title}
                        className="h-full w-full object-cover transition duration-1000 group-hover:scale-105"
                        loading="eager"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[var(--secondary)]/20 to-[var(--accent)]/10 flex items-center justify-center">
                      <Grid3X3 size={48} className="text-[var(--primary)]/20" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                    <div className="mb-3 flex items-center gap-2">
                      {featuredBlog.featured && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                          Featured
                        </span>
                      )}
                      {featuredBlog.category && (
                        <span className="text-xs font-medium text-white/60">{featuredBlog.category}</span>
                      )}
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold text-white leading-tight mb-3 line-clamp-2 group-hover:text-[var(--accent)]/80 transition-colors">
                      {featuredBlog.title}
                    </h2>
                    {featuredBlog.description && (
                      <p className="text-sm text-white/70 line-clamp-2 max-w-2xl">
                        {featuredBlog.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-xs text-white/50">
                      <span>{featuredBlog.author || 'HOK Interiors'}</span>
                      <time dateTime={featuredBlog.publishDate || featuredBlog.createdAt}>
                        {featuredBlog.published && featuredBlog.publishDate
                          ? new Date(featuredBlog.publishDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Draft'}
                      </time>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.article>
          </SectionErrorBoundary>
        )}

        {/* Search + Categories */}
        <SectionErrorBoundary sectionName="BlogControls">
          <div className="mb-8 space-y-6">
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)]/30" />
              <input
                type="text"
                placeholder="Search articles..."
                defaultValue={searchTerm}
                onChange={handleSearch}
                className="w-full rounded-xl border border-border/50 bg-white pl-12 pr-4 py-3 text-sm text-[var(--primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none"
              />
            </div>

            {!loadingMeta && categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={clearFilters}
                  className={`text-xs font-medium rounded-full px-4 py-2 transition-all ${
                    !hasActiveFilters
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--secondary)]/20 text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategory(cat)}
                    className={`text-xs font-medium rounded-full px-4 py-2 transition-all ${
                      activeCategory === cat
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--secondary)]/20 text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {!loadingMeta && tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 12).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTag(tag)}
                    className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all ${
                      activeTag === tag
                        ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30'
                        : 'bg-[var(--secondary)]/10 text-[var(--primary)]/50 hover:bg-[var(--secondary)]/20 hover:text-[var(--primary)]/70 border border-transparent'
                    }`}
                  >
                    <Tag size={10} />
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </SectionErrorBoundary>

        {/* Blog Grid */}
        <SectionErrorBoundary sectionName="BlogGrid">
          {loading ? (
            <SkeletonGrid />
          ) : displayBlogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-[var(--primary)]/30 mb-3">No blog posts found</p>
              <p className="text-sm text-[var(--primary)]/40">
                {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Check back soon for new content.'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-luxury-primary mt-4 inline-flex items-center gap-2">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
              {displayBlogs.map((item, i) => (
                <motion.div
                  key={item.id || item._id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reduceMotion ? 0 : i * 0.05,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <BlogCard blog={item} priority={i < 6} />
                </motion.div>
              ))}
            </div>
          )}
        </SectionErrorBoundary>
      </div>
    </main>
  )
})

BlogPage.displayName = 'BlogPage'

export default BlogPage
