import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Share2, Facebook, Twitter, Linkedin, Copy, Calendar, User, Clock, Eye, Tag } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@services/api'
import { getOptimizedUrl, buildSrcSet, getOptimizedVideoUrl, getVideoPosterUrl } from '@utils/cloudinaryHelpers'
import { getReadingTime, formatDate, extractTags } from '@utils/blogHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { SectionErrorBoundary } from '@components/home/SectionErrorBoundary'
import BlogCard from '@components/blog/BlogCard'
import { useIsMobile } from '@hooks/useIsMobile'

const SITE_URL = 'https://hokinteriors.com'
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-default.jpg`

const SkeletonDetail = () => (
  <main className="min-h-screen bg-[var(--bg)]">
    <div className="aspect-[2/1] w-full skeleton" />
    <div className="container-wide mx-auto px-6 md:px-12 lg:px-20 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="skeleton h-5 w-20 mb-4" />
        <div className="skeleton h-10 w-full mb-4" />
        <div className="skeleton h-4 w-3/4 mb-8" />
        <div className="skeleton h-4 w-full mb-3" />
        <div className="skeleton h-4 w-full mb-3" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  </main>
)

function sanitizeHtml(html) {
  if (!html) return html
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT)
  let node
  while ((node = walker.nextNode())) {
    const attrs = Array.from(node.attributes || [])
    for (const attr of attrs) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on')) {
        node.removeAttribute(name)
      }
      if (name === 'href' || name === 'src' || name === 'action' || name === 'data') {
        const val = attr.value.trim().toLowerCase()
        if (val.startsWith('javascript:') || val.startsWith('data:text/html')) {
          node.removeAttribute(name)
        }
      }
    }
  }
  return doc.body.innerHTML
}

function renderContent(content) {
  if (!content) return null

  const hasTags = /<[a-z][\s\S]*?>/i.test(content)

  if (!hasTags) {
    return content.split('\n\n').map((paragraph, i) => (
      <p key={i} className="mb-4 leading-relaxed text-[var(--primary)]/80">
        {paragraph.split('\n').map((line, j) => (
          <span key={j} className="block">
            {line}
          </span>
        ))}
      </p>
    ))
  }

  return (
    <div
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  )
}

function ContentRenderer({ content }) {
  return renderContent(content)
}

export const BlogDetailPage = () => {
  const { id } = useParams()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [related, setRelated] = useState([])
  const [navigation, setNavigation] = useState({ previous: null, next: null })
  const [copied, setCopied] = useState(false)
  const reduceMotion = useIsMobile()

  const loadBlog = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/blog/${id}`)
      setBlog(res.data || null)
    } catch (err) {
      const msg = err?.response?.status === 404 ? 'Blog not found' : (err?.message || 'Failed to load blog')
      setError(msg)
      setBlog(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadRelated = async () => {
    if (!blog?.id) return
    try {
      const res = await api.get(`/blog/${blog.id}/related`)
      setRelated(Array.isArray(res.data) ? res.data : [])
    } catch {
      // keep existing related posts visible on failure
    }
  }

  const loadNavigation = async () => {
    if (!blog?.id) return
    try {
      const res = await api.get(`/blog/${blog.id}/prev-next`)
      setNavigation(res.data || { previous: null, next: null })
    } catch {
      setNavigation({ previous: null, next: null })
    }
  }

  useEffect(() => {
    loadBlog()
  }, [loadBlog])

  useEffect(() => {
    if (blog) {
      loadRelated()
      loadNavigation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blog])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'blog-changed') {
        loadBlog()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadBlog])

  const handleShare = async () => {
    const url = window.location.href
    const title = blog?.metaDescription || blog?.title || 'HOK Interiors Blog'

    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url })
      } catch {
        copyToClipboard(url)
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const shareUrls = blog ? {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(blog.title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&description=${encodeURIComponent(blog.title)}`,
  } : null

  const tags = extractTags(blog?.tags)
  const readingTime = blog?.content ? getReadingTime(blog.content) : 1
  const imageUrl = blog?.imageUrl || blog?.image || null
  const videoUrl = blog?.videoUrl || blog?.video || null
  const mediaUrls = blog?.mediaUrls || []

  useEffect(() => {
    if (!blog) return
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: blog.title,
      description: blog.metaDescription || blog.description || '',
      image: blog.imageUrl || blog.image || DEFAULT_OG_IMAGE,
      author: {
        '@type': 'Person',
        name: blog.author || 'HOK Interiors',
      },
      publisher: {
        '@type': 'Organization',
        name: 'HOK Interiors',
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/images/logo.png`,
        },
      },
      datePublished: blog.publishDate || blog.createdAt,
      dateModified: blog.updatedAt || blog.publishDate || blog.createdAt,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/blog/${blog.slug || blog.id}`,
      },
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(articleSchema)
    script.setAttribute('data-structured-data', 'blog-article')
    document.head.appendChild(script)

    const existing = document.querySelector('script[data-structured-data="blog-article"]')
    if (existing && existing !== script) existing.remove()

    return () => {
      const el = document.querySelector('script[data-structured-data="blog-article"]')
      if (el) el.remove()
    }
  }, [blog])

  if (loading) {
    return (
      <main>
        <SectionErrorBoundary sectionName="BlogDetail" fallback={<SkeletonDetail />}>
          <SkeletonDetail />
        </SectionErrorBoundary>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-display text-xl text-[var(--primary)]/60 mb-4">
            {error === 'Blog not found' ? 'Blog post not found' : 'Unable to load blog'}
          </p>
          <Link to="/blog" className="btn-luxury-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Blog
          </Link>
        </div>
      </main>
    )
  }

  if (!blog) return null

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <PageMeta
        title={`${blog.title} — HOK Interiors Blog`}
        description={blog.metaDescription || blog.description || `Read ${blog.title} by ${blog.author || 'HOK Interiors'}.`}
      />

      {/* Hero */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative w-full overflow-hidden"
      >
        {imageUrl ? (
          <div className="relative aspect-[2/1] w-full overflow-hidden bg-[var(--secondary)]/10">
            <img
              src={getOptimizedUrl(imageUrl, { width: 1600, crop: 'limit' }) || imageUrl}
              srcSet={buildSrcSet(imageUrl) || undefined}
              sizes="100vw"
              alt={blog.title}
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="aspect-[2/1] w-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="font-display text-5xl md:text-6xl font-semibold mb-4">{blog.title}</h1>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 container-wide mx-auto px-6 md:px-12 lg:px-20 pb-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to Blog
          </Link>
        </div>
      </motion.section>

      <article className="container-wide mx-auto px-6 md:px-12 lg:px-20 py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          {/* Meta */}
          <motion.header
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10"
          >
            {blog.category && (
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3">
                {blog.category}
              </span>
            )}
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-[var(--primary)] leading-tight mb-6">
              {blog.title}
            </h1>

            {blog.subtitle && (
              <p className="text-lg text-[var(--primary)]/60 leading-relaxed mb-6">{blog.subtitle}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--primary)]/50">
              {blog.author && (
                <span className="flex items-center gap-1.5">
                  <User size={14} />
                  {blog.author}
                </span>
              )}
              <time dateTime={blog.publishDate || blog.createdAt} className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formatDate(blog.publishDate || blog.createdAt, { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {readingTime} min read
              </span>
              {blog.views > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye size={14} />
                  {blog.views} views
                </span>
              )}
            </div>

            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-[var(--secondary)]/20 text-[var(--primary)]/60"
                  >
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.header>

          {/* Rich Text Content */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="prose-wrapper"
          >
            <ContentRenderer content={blog.content || blog.description || ''} />
          </motion.div>

          {/* Content Images Gallery */}
          {mediaUrls.length > 0 && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="my-12 grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {mediaUrls.map((url, i) => (
                <div key={i} className="overflow-hidden rounded-2xl bg-[var(--secondary)]/10">
                  <img
                    src={getOptimizedUrl(url, { width: 800, crop: 'limit' }) || url}
                    alt={`${blog.title} — gallery ${i + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              ))}
            </motion.div>
          )}

          {/* Video */}
          {videoUrl && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="my-12 rounded-2xl overflow-hidden bg-[var(--secondary)]/30"
            >
              <video
                src={getOptimizedVideoUrl(videoUrl) || videoUrl}
                poster={getVideoPosterUrl(videoUrl)}
                controls
                playsInline
                preload="metadata"
                className="w-full h-auto"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </motion.div>
          )}

          {/* Social Sharing */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="my-12 border-t border-border/50 pt-8"
          >
            <p className="text-sm font-semibold text-[var(--primary)]/60 mb-4">Share this article</p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--secondary)]/20 text-[var(--primary)]/60 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                title="Share"
              >
                <Share2 size={18} />
              </button>
              {shareUrls && (
                <>
                  <a
                    href={shareUrls.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--secondary)]/20 text-[var(--primary)]/60 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                    title="Share on Facebook"
                  >
                    <Facebook size={18} />
                  </a>
                  <a
                    href={shareUrls.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--secondary)]/20 text-[var(--primary)]/60 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                    title="Share on Twitter"
                  >
                    <Twitter size={18} />
                  </a>
                  <a
                    href={shareUrls.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--secondary)]/20 text-[var(--primary)]/60 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                    title="Share on LinkedIn"
                  >
                    <Linkedin size={18} />
                  </a>
                  <a
                    href={shareUrls.pinterest}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--secondary)]/20 text-[var(--primary)]/60 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                    title="Share on Pinterest"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 21.6c-5.3 0-9.6-4.3-9.6-9.6S6.7 2.4 12 2.4s9.6 4.3 9.6 9.6-4.3 9.6-9.6 9.6z" />
                      <path d="M14.8 10.4c-.4-.2-1.3-.6-2.6 0-.3.2-.5.4-.8.4-.2 0-.4-.1-.6-.1-.5 0-1.3.1-2.2.6 0 .2 0 .3.1.5 0 .2.2.4.4.5.1 0 .2.1.3.1.1 0 .2-.1.3-.1h.2c-.1.4-.2 1-.1 1.5 0 .1 0 .1.1.2 0 .1 0 .2.1.2.1 0 .2-.1.2-.1h.2c-.1 0-.1 0-.1.1.1.5.5 1 1.1 1.2 0 .1 0 .2.1.2 0 .1 0 .1 0 .1-.1 0 0-.1 0-.1.1.1.4.3.7.5.9.3.6.5 1 1 .9 0 .1 0 .2 0 .3.1.5.1.6 0 .7-.1.3-.2.4-.4.5zm-3.3.2c-.1 0-.1 0-.1-.1 0 .2 0 .3.1.5 0 .2.1.3.2.4.1.1.2.1.3.1.2-.1 0-.2 0-.3s0-.2-.1-.3c-.1-.2-.3-.3-.4-.4z" />
                    </svg>
                  </a>
                  <button
                    onClick={() => copyToClipboard(window.location.href)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--secondary)]/20 text-[var(--primary)]/60 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                    title="Copy link"
                  >
                    {copied ? <span className="text-xs">✓</span> : <Copy size={18} />}
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Prev/Next Navigation */}
          {navigation.previous || navigation.next ? (
            <motion.nav
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="border-t border-border/50 pt-8 mb-12"
          >
              <div className="flex items-center justify-between gap-4">
                {navigation.previous && (
                  <Link
                    to={`/blog/${navigation.previous.slug || navigation.previous.id}`}
                    className="group flex items-center gap-3 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)]/20 text-[var(--accent)]">
                      <ArrowLeft size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/40">
                        Previous
                      </span>
                      <p className="font-display text-lg font-medium text-[var(--primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                        {navigation.previous.title}
                      </p>
                    </div>
                  </Link>
                )}
                {navigation.next && (
                  <Link
                    to={`/blog/${navigation.next.slug || navigation.next.id}`}
                    className="group flex items-center gap-3 text-right"
                  >
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/40">
                        Next
                      </span>
                      <p className="font-display text-lg font-medium text-[var(--primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                        {navigation.next.title}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)]/20 text-[var(--accent)]">
                      <ArrowLeft size={16} className="rotate-180" />
                    </div>
                  </Link>
                )}
              </div>
            </motion.nav>
          ) : null}

          {/* Related Posts */}
          {related.length > 0 && (
            <motion.section
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="font-display text-2xl font-semibold text-[var(--primary)] mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {related.slice(0, 3).map((item) => (
                  <BlogCard key={item.id || item._id} blog={item} priority={false} />
                ))}
              </div>
            </motion.section>
          )}

          {/* INTERNAL LINKS */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-16 text-center"
          >
            <p className="text-[var(--primary)]/60 mb-4">Explore more from HOK Interiors</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/portfolio" className="btn-luxury-secondary">View Portfolio</Link>
              <Link to="/services" className="btn-luxury-secondary">Our Services</Link>
              <Link to="/contact" className="btn-luxury-primary">Start a Project</Link>
            </div>
          </motion.section>
        </div>
      </article>
    </main>
  )
}

BlogDetailPage.displayName = 'BlogDetailPage'

export default BlogDetailPage
