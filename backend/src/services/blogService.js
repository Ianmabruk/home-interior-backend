import { prisma } from '../config/database.js'
import { uploadFile, deleteFile, deleteFiles } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapBlog(item) {
  if (!item) return null
  const videoUrl = item.video || null
  const imageUrl = item.image || null
  const allMediaUrls = item.mediaUrls || []

  return {
    ...item,
    _id: item.id,
    id: item.id,
    imageUrl,
    videoUrl,
    mediaUrl: imageUrl || videoUrl,
    mediaUrls: allMediaUrls,
    mediaType: videoUrl ? 'video' : 'image',
    category: item.category || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    subtitle: item.subtitle || '',
    slug: item.slug || '',
    content: item.content || '',
    author: item.author || '',
    metaDescription: item.metaDescription || '',
    publishDate: item.publishDate || null,
    views: item.views || 0,
    published: item.published || false,
    featured: item.featured || false,
    displayOrder: item.displayOrder || 0,
  }
}

function buildBlogWhere(input) {
  const where = {}
  const { search, category, status, published, featured, author } = input || {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (category) where.category = { contains: category, mode: 'insensitive' }
  if (author) where.author = { contains: author, mode: 'insensitive' }

  if (status === 'published') where.published = true
  else if (status === 'draft') where.published = false
  else if (published !== undefined) where.published = published

  if (featured !== undefined) where.featured = featured

  return where
}

function buildBlogOrderBy(sort) {
  const validFields = ['createdAt', 'updatedAt', 'publishDate', 'displayOrder', 'views', 'title']
  const validDirs = ['asc', 'desc']

  if (!sort) return [{ displayOrder: 'asc' }, { createdAt: 'desc' }]

  const [rawField, rawDir] = sort.split(':')
  const field = validFields.includes(rawField) ? rawField : 'createdAt'
  const dir = validDirs.includes(rawDir) ? rawDir : 'desc'

  return [{ [field]: dir }]
}

// Safely extract a Cloudinary public_id from a URL
function extractPublicId(url) {
  if (!url || typeof url !== 'string') return null
  try {
    // Cloudinary URLs: https://res.cloudinary.com/<cloud>/image/upload/v123/<folder>/<name>.<ext>
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    if (match && match[1]) return match[1]
    // Supabase or local: just use the path segment
    const parts = url.split('/')
    const fileName = parts[parts.length - 1]
    return fileName.replace(/\.[^.]+$/, '') || null
  } catch {
    return null
  }
}

export const blogService = {
  listBlogs,
  listPublishedBlogs,
  getAllBlogs,
  getBlog,
  getBlogBySlug,
  getPublishedBlog,
  getBlogStats,
  getRelatedBlogs,
  getCategoriesAndTags,
  getPreviousAndNext,
  incrementViews,
  createBlog,
  updateBlog,
  deleteBlog,
}

async function listBlogs() {
  const items = await prisma.blog.findMany({
    where: { published: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  })
  return items.map(mapBlog)
}

async function listPublishedBlogs(params = {}) {
  const { search, category, tag, page = 1, limit = 12, sort } = params

  const where = buildBlogWhere({ search, category, status: 'published' })
  if (tag) where.tags = { has: tag }

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit))
  const take = Math.min(100, Math.max(1, Number(limit)))

  const [items, total] = await Promise.all([
    prisma.blog.findMany({ where, orderBy: buildBlogOrderBy(sort), skip, take }),
    prisma.blog.count({ where }),
  ])

  return {
    items: items.map(mapBlog),
    total,
    page: Number(page) || 1,
    limit: take,
    totalPages: Math.ceil(total / take),
  }
}

async function getAllBlogs(params = {}) {
  const { search, category, status, page = 1, limit = 50, sort } = params

  const where = buildBlogWhere({ search, category, status })
  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit))
  const take = Math.min(200, Math.max(1, Number(limit)))

  const [items, total] = await Promise.all([
    prisma.blog.findMany({ where, orderBy: buildBlogOrderBy(sort), skip, take }),
    prisma.blog.count({ where }),
  ])

  return {
    items: items.map(mapBlog),
    total,
    page: Number(page) || 1,
    limit: take,
    totalPages: Math.ceil(total / take),
  }
}

async function getBlog(id) {
  const item = await prisma.blog.findUnique({ where: { id } })
  if (!item) throw failure(404, 'Blog not found')
  return mapBlog(item)
}

async function getBlogBySlug(slug) {
  const item = await prisma.blog.findFirst({ where: { slug, published: true } })
  if (!item) throw failure(404, 'Blog not found')
  return mapBlog(item)
}

async function getPublishedBlog(idOrSlug) {
  if (!idOrSlug) throw failure(404, 'Blog not found')

  // Try by ID first (cuid is alphanumeric, 25 chars)
  let item = null
  if (/^[a-z0-9]{20,}$/i.test(idOrSlug)) {
    item = await prisma.blog.findFirst({ where: { id: idOrSlug, published: true } })
  }
  // Fall back to slug
  if (!item) {
    item = await prisma.blog.findFirst({ where: { slug: idOrSlug, published: true } })
  }
  // Last resort: any id match
  if (!item) {
    item = await prisma.blog.findFirst({ where: { id: idOrSlug, published: true } })
  }

  if (!item) throw failure(404, 'Blog not found')
  return mapBlog(item)
}

async function getBlogStats() {
  try {
    const [totalCount, publishedCount, draftCount, imageCount, videoCount, viewSum] = await Promise.all([
      prisma.blog.count(),
      prisma.blog.count({ where: { published: true } }),
      prisma.blog.count({ where: { published: false } }),
      prisma.blog.count({ where: { image: { not: null } } }),
      prisma.blog.count({ where: { video: { not: null } } }),
      prisma.blog.aggregate({ _sum: { views: true } }),
    ])

    return {
      totalPosts: totalCount,
      publishedPosts: publishedCount,
      draftPosts: draftCount,
      totalImages: imageCount,
      totalVideos: videoCount,
      totalViews: viewSum._sum.views || 0,
    }
  } catch {
    return { totalPosts: 0, publishedPosts: 0, draftPosts: 0, totalImages: 0, totalVideos: 0, totalViews: 0 }
  }
}

async function getRelatedBlogs(blogId, category, limit = 4) {
  try {
    const items = await prisma.blog.findMany({
      where: {
        published: true,
        NOT: { id: blogId },
        ...(category ? { category: { contains: category, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return items.map(mapBlog)
  } catch {
    return []
  }
}

async function getCategoriesAndTags() {
  try {
    const items = await prisma.blog.findMany({
      where: { published: true },
      select: { category: true, tags: true },
    })
    const categories = [...new Set(items.map((i) => i.category).filter(Boolean))]
    const tags = [...new Set(items.flatMap((i) => i.tags || []))]
    return { categories, tags }
  } catch {
    return { categories: [], tags: [] }
  }
}

async function getPreviousAndNext(blogId) {
  try {
    const current = await prisma.blog.findUnique({
      where: { id: blogId },
      select: { createdAt: true },
    })
    if (!current) return { previous: null, next: null }

    const [prev, next] = await Promise.all([
      prisma.blog.findFirst({
        where: {
          published: true,
          createdAt: { lt: current.createdAt },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.blog.findFirst({
        where: {
          published: true,
          createdAt: { gt: current.createdAt },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    return { previous: prev ? mapBlog(prev) : null, next: next ? mapBlog(next) : null }
  } catch {
    return { previous: null, next: null }
  }
}

async function incrementViews(id) {
  try {
    await prisma.blog.update({ where: { id }, data: { views: { increment: 1 } } })
  } catch {
    // Non-critical — silently ignore
  }
}

async function createBlog(data, imageFile, videoFile, contentFiles = [], homepageCircularImageFile = null) {
  const createData = { ...data }

  if (imageFile) {
    try {
      const uploaded = await uploadFile(imageFile.buffer, imageFile.mimetype, 'blogs')
      createData.image = uploaded.url
      createData.cloudinaryId = uploaded.path
    } catch (err) {
      console.error('[blogService.createBlog] Image upload failed:', err?.message)
      throw failure(500, `Image upload failed: ${err?.message || 'Unknown error'}`)
    }
  }

  if (videoFile) {
    try {
      const uploaded = await uploadFile(videoFile.buffer, videoFile.mimetype, 'blogs')
      createData.video = uploaded.url
      if (!createData.cloudinaryId) createData.cloudinaryId = uploaded.path
    } catch (err) {
      console.error('[blogService.createBlog] Video upload failed:', err?.message)
      throw failure(500, `Video upload failed: ${err?.message || 'Unknown error'}`)
    }
  }

  if (homepageCircularImageFile) {
    try {
      const uploaded = await uploadFile(homepageCircularImageFile.buffer, homepageCircularImageFile.mimetype, 'blogs')
      createData.homepageCircularImage = uploaded.url
      createData.homepageCircularImageId = uploaded.path
    } catch (err) {
      console.error('[blogService.createBlog] Homepage circular image upload failed:', err?.message)
      throw failure(500, `Homepage image upload failed: ${err?.message || 'Unknown error'}`)
    }
  }

  const mediaUrls = []
  if (contentFiles.length > 0) {
    const uploadPromises = contentFiles.map((f) => uploadFile(f.buffer, f.mimetype, 'blogs'))
    const results = await Promise.allSettled(uploadPromises)
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        mediaUrls.push(result.value.url)
      }
    })
  }
  if (mediaUrls.length > 0) createData.mediaUrls = mediaUrls

  if (!createData.slug && createData.title) {
    createData.slug = createData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100)
  }

  const item = await prisma.blog.create({ data: createData })
  return mapBlog(item)
}

async function updateBlog(id, data, imageFile, videoFile, contentFiles = [], removeMediaUrls = [], homepageCircularImageFile = null, removeHomepageCircularImage = false) {
  const existing = await prisma.blog.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Blog not found')

  const updateData = { ...data }
  const pathsToDelete = []

  if (imageFile) {
    if (existing.cloudinaryId) pathsToDelete.push(existing.cloudinaryId)
    else if (existing.image) {
      const pid = extractPublicId(existing.image)
      if (pid) pathsToDelete.push(pid)
    }

    try {
      const uploaded = await uploadFile(imageFile.buffer, imageFile.mimetype, 'blogs')
      updateData.image = uploaded.url
      updateData.cloudinaryId = uploaded.path
    } catch (err) {
      console.error('[blogService.updateBlog] Image upload failed:', err?.message)
      throw failure(500, `Image upload failed: ${err?.message || 'Unknown error'}`)
    }
  }

  if (videoFile) {
    // Delete the existing video (not the image) when a new video is uploaded.
    // The video URL is stored in the `video` column, so we extract its public ID.
    if (existing.video) {
      const videoPublicId = extractPublicId(existing.video)
      if (videoPublicId) pathsToDelete.push(videoPublicId)
    }

    try {
      const uploaded = await uploadFile(videoFile.buffer, videoFile.mimetype, 'blogs')
      updateData.video = uploaded.url
      if (!updateData.cloudinaryId) updateData.cloudinaryId = uploaded.path
    } catch (err) {
      console.error('[blogService.updateBlog] Video upload failed:', err?.message)
      throw failure(500, `Video upload failed: ${err?.message || 'Unknown error'}`)
    }
  }

  if (homepageCircularImageFile) {
    if (existing.homepageCircularImageId) pathsToDelete.push(existing.homepageCircularImageId)

    try {
      const uploaded = await uploadFile(homepageCircularImageFile.buffer, homepageCircularImageFile.mimetype, 'blogs')
      updateData.homepageCircularImage = uploaded.url
      updateData.homepageCircularImageId = uploaded.path
    } catch (err) {
      console.error('[blogService.updateBlog] Homepage circular image upload failed:', err?.message)
      throw failure(500, `Homepage image upload failed: ${err?.message || 'Unknown error'}`)
    }
  } else if (removeHomepageCircularImage) {
    if (existing.homepageCircularImageId) pathsToDelete.push(existing.homepageCircularImageId)
    updateData.homepageCircularImage = null
    updateData.homepageCircularImageId = null
  }

  if (contentFiles && contentFiles.length > 0) {
    const uploadPromises = contentFiles.map((f) => uploadFile(f.buffer, f.mimetype, 'blogs'))
    const results = await Promise.allSettled(uploadPromises)
    const newMediaUrls = []
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        newMediaUrls.push(result.value.url)
      }
    })
    if (newMediaUrls.length > 0) {
      updateData.mediaUrls = [...(existing.mediaUrls || []), ...newMediaUrls]
    }
  }

  if (removeMediaUrls && removeMediaUrls.length > 0) {
    const currentUrls = existing.mediaUrls || []
    const toRemove = removeMediaUrls.filter((url) => currentUrls.includes(url))
    if (toRemove.length > 0) {
      updateData.mediaUrls = currentUrls.filter((url) => !removeMediaUrls.includes(url))
      for (const url of toRemove) {
        const pid = extractPublicId(url)
        if (pid) pathsToDelete.push(pid)
      }
    }
  }

  if (pathsToDelete.length > 0) {
    deleteFiles(pathsToDelete).catch((err) => {
      console.error('[blogService.updateBlog] File deletion failed (non-fatal):', err?.message)
    })
  }

  const item = await prisma.blog.update({ where: { id }, data: updateData })
  return mapBlog(item)
}

async function deleteBlog(id) {
  const existing = await prisma.blog.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Blog not found')

  // Delete the DB record first — don't let file deletion block or fail the operation
  await prisma.blog.delete({ where: { id } })

  // Then clean up files asynchronously
  const pathsToDelete = []
  if (existing.cloudinaryId) pathsToDelete.push(existing.cloudinaryId)
  else if (existing.image) {
    const pid = extractPublicId(existing.image)
    if (pid) pathsToDelete.push(pid)
  }
  if (existing.video) {
    const pid = extractPublicId(existing.video)
    if (pid && !pathsToDelete.includes(pid)) pathsToDelete.push(pid)
  }
  if (existing.mediaUrls && existing.mediaUrls.length > 0) {
    for (const url of existing.mediaUrls) {
      const pid = extractPublicId(url)
      if (pid && !pathsToDelete.includes(pid)) pathsToDelete.push(pid)
    }
  }

  if (pathsToDelete.length > 0) {
    deleteFiles(pathsToDelete).catch((err) => {
      console.error('[blogService.deleteBlog] File deletion failed (non-fatal):', err?.message)
    })
  }
}
