import { prisma } from '../config/database.js'
import { uploadFile } from '../uploads/uploadService.js'
import { uploadVideo, isVideoCloudinaryConfigured } from '../services/cloudinaryVideoService.js'
import { failure } from '../utils/response.js'

async function deleteFileByPublicId(publicId, resourceType = 'auto') {
  // Existing and replaced media is preserved; never delete provider assets.
  return
}

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
    videoCloudinaryId: item.videoCloudinaryId || null,
    videoAssetId: item.videoAssetId || null,
    videoResourceType: item.videoResourceType || null,
    videoCloudinaryType: item.videoCloudinaryType || null,
    videoCloudinaryVersion: item.videoCloudinaryVersion || null,
    videoFormat: item.videoFormat || null,
    videoMimeType: item.videoMimeType || null,
    videoDuration: item.videoDuration || null,
    videoWidth: item.videoWidth || null,
    videoHeight: item.videoHeight || null,
    videoBytes: item.videoBytes || null,
    videoOriginalBytes: item.videoOriginalBytes || null,
    videoOriginalName: item.videoOriginalName || null,
    videoStorageProvider: item.videoStorageProvider || null,
    videoPlaybackUrl: item.videoPlaybackUrl || null,
    videoThumbnailUrl: item.videoThumbnailUrl || null,
    videoUploadStatus: item.videoUploadStatus || null,
    mediaUrl: imageUrl || videoUrl,
    mediaUrls: allMediaUrls,
    mediaAssets: Array.isArray(item.mediaAssets) ? item.mediaAssets : [],
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
  getPublishedBlogSilent,
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

async function getPublishedBlogSilent(idOrSlug) {
  if (!idOrSlug) return null
  try {
    return await getPublishedBlog(idOrSlug)
  } catch {
    return null
  }
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
  const videoAsset = createData.videoAsset
  const imageAsset = createData.imageAsset
  const contentAssets = Array.isArray(createData.mediaAssets) ? createData.mediaAssets : []
  delete createData.videoAsset
  delete createData.imageAsset
  delete createData.mediaAssets

  if (videoAsset?.secureUrl && videoAsset?.publicId) {
    createData.video = videoAsset.secureUrl
    const storageProvider = videoAsset.storageProvider || (videoAsset.providerAssetId ? 'hyperserve' : 'cloudinary')
    createData.videoStorageProvider = storageProvider
    createData.videoPlaybackUrl = videoAsset.playbackUrl || videoAsset.secureUrl
    createData.videoThumbnailUrl = videoAsset.thumbnailUrl || null
    createData.videoUploadStatus = videoAsset.uploadStatus || 'ready'
    createData.videoCloudinaryId = storageProvider === 'cloudinary' ? videoAsset.publicId : null
    createData.videoAssetId = videoAsset.assetId || null
    createData.videoResourceType = videoAsset.resourceType || 'video'
    createData.videoCloudinaryType = videoAsset.type || 'upload'
    createData.videoCloudinaryVersion = videoAsset.version ?? null
    createData.videoFormat = videoAsset.format || 'mp4'
    createData.videoMimeType = 'video/mp4'
    createData.videoDuration = videoAsset.duration ?? null
    createData.videoWidth = videoAsset.width ?? null
    createData.videoHeight = videoAsset.height ?? null
    createData.videoBytes = videoAsset.bytes ?? null
    createData.videoOriginalBytes = videoAsset.originalBytes ?? null
    createData.videoOriginalName = videoAsset.originalName || null
  }

  if (imageAsset?.secureUrl && imageAsset?.publicId) {
    createData.image = imageAsset.secureUrl
    createData.cloudinaryId = imageAsset.publicId
  }

   if (imageFile) {
     try {
       const uploaded = await uploadFile(imageFile.buffer, imageFile.mimetype, 'blogs', imageFile.originalname)
       createData.image = uploaded.url
       createData.cloudinaryId = uploaded.publicId || uploaded.path
     } catch (err) {
       console.error('[blogService.createBlog] Image upload failed:', err?.message)
       throw failure(500, `Image upload failed: ${err?.message || 'Unknown error'}`)
     }
   }


  if (videoFile) {
    if (!isVideoCloudinaryConfigured()) {
      throw failure(503, 'Video upload service is not configured.')
    }
    try {
      const uploaded = await uploadVideo(videoFile.buffer, videoFile.mimetype, 'blogs', videoFile.originalname)
      createData.video = uploaded.url
      const storageProvider = 'cloudinary'
      createData.videoStorageProvider = storageProvider
      createData.videoPlaybackUrl = uploaded.url
      createData.videoThumbnailUrl = null
      createData.videoUploadStatus = 'ready'
      createData.videoCloudinaryId = uploaded.publicId
      createData.videoAssetId = uploaded.assetId || null
      createData.videoResourceType = uploaded.resourceType || 'video'
      createData.videoCloudinaryType = uploaded.type || 'upload'
      createData.videoCloudinaryVersion = uploaded.version ?? null
      createData.videoFormat = uploaded.format || 'mp4'
      createData.videoMimeType = 'video/mp4'
      createData.videoDuration = uploaded.duration ?? null
      createData.videoWidth = uploaded.width ?? null
      createData.videoHeight = uploaded.height ?? null
      createData.videoBytes = uploaded.bytes ?? null
      createData.videoOriginalBytes = uploaded.bytes ?? null
      createData.videoOriginalName = uploaded.originalName || videoFile.originalname
    } catch (err) {
      console.error('[blogService.createBlog] Video upload failed:', err?.message)
      throw failure(500, `Video upload failed: ${err?.message || 'Unknown error'}`)
    }
  }

  if (homepageCircularImageFile) {
    try {
      const uploaded = await uploadFile(homepageCircularImageFile.buffer, homepageCircularImageFile.mimetype, 'blogs', homepageCircularImageFile.originalname)
      createData.homepageCircularImage = uploaded.url
      createData.homepageCircularImageId = uploaded.publicId || uploaded.path
    } catch (err) {
      console.error('[blogService.createBlog] Homepage circular image upload failed:', err?.message)
      throw failure(500, `Homepage image upload failed: ${err?.message || 'Unknown error'}`)
    }
  }

  const mediaUrls = []
  const mediaAssets = [...contentAssets]
  if (contentFiles.length > 0) {
    const uploads = await Promise.all(contentFiles.map(async (f) => {
      const isVideo = f.mimetype?.startsWith('video/')
      if (isVideo) {
        if (!isVideoCloudinaryConfigured()) {
          throw failure(503, 'Video upload service is not configured.')
        }
        return uploadVideo(f.buffer, f.mimetype, 'blogs', f.originalname)
      }
      return uploadFile(f.buffer, f.mimetype, 'blogs', f.originalname)
    }))
    uploads.forEach((uploaded) => {
      mediaAssets.push({
        secureUrl: uploaded.url,
        publicId: uploaded.publicId || uploaded.path,
        assetId: uploaded.assetId || null,
        resourceType: uploaded.resourceType || (isVideo ? 'video' : 'image'),
        type: uploaded.type || 'upload',
        version: uploaded.version ?? null,
        format: uploaded.format || null,
        mimeType: uploaded.mimeType || null,
        originalName: uploaded.originalName || null,
        duration: uploaded.duration ?? null,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        bytes: uploaded.bytes ?? null,
      })
    })
  }
  mediaAssets.forEach((asset) => mediaUrls.push(asset.secureUrl))
  if (mediaUrls.length > 0) createData.mediaUrls = mediaUrls
  if (mediaAssets.length > 0) createData.mediaAssets = mediaAssets

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

async function updateBlog(id, data, imageFile, videoFile, contentFiles = [], removeMediaUrls = [], homepageCircularImageFile = null, removeHomepageCircularImage = false, removeVideo = false) {
  const existing = await prisma.blog.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Blog not found')

  const updateData = { ...data }
  const videoAsset = updateData.videoAsset
  const imageAsset = updateData.imageAsset
  const contentAssets = Array.isArray(updateData.mediaAssets) ? updateData.mediaAssets : []
  delete updateData.videoAsset
  delete updateData.imageAsset
  delete updateData.mediaAssets
  const pathsToDelete = []

  if (videoAsset?.secureUrl && videoAsset?.publicId) {
    updateData.video = videoAsset.secureUrl
    const storageProvider = videoAsset.storageProvider || (videoAsset.providerAssetId ? 'hyperserve' : 'cloudinary')
    updateData.videoStorageProvider = storageProvider
    updateData.videoPlaybackUrl = videoAsset.playbackUrl || videoAsset.secureUrl
    updateData.videoThumbnailUrl = videoAsset.thumbnailUrl || null
    updateData.videoUploadStatus = videoAsset.uploadStatus || 'ready'
    updateData.videoCloudinaryId = storageProvider === 'cloudinary' ? videoAsset.publicId : null
    updateData.videoAssetId = videoAsset.assetId || null
    updateData.videoResourceType = videoAsset.resourceType || 'video'
    updateData.videoCloudinaryType = videoAsset.type || 'upload'
    updateData.videoCloudinaryVersion = videoAsset.version ?? null
    updateData.videoFormat = videoAsset.format || 'mp4'
    updateData.videoMimeType = 'video/mp4'
    updateData.videoDuration = videoAsset.duration ?? null
    updateData.videoWidth = videoAsset.width ?? null
    updateData.videoHeight = videoAsset.height ?? null
    updateData.videoBytes = videoAsset.bytes ?? null
    updateData.videoOriginalBytes = videoAsset.originalBytes ?? null
    updateData.videoOriginalName = videoAsset.originalName || null
    if (existing.video && existing.videoCloudinaryId !== videoAsset.publicId) {
      pathsToDelete.push({
        publicId: existing.videoCloudinaryId || extractPublicId(existing.video),
        resourceType: existing.videoResourceType || 'video',
      })
    }
  }

  if (imageAsset?.secureUrl && imageAsset?.publicId) {
    if (existing.cloudinaryId && existing.cloudinaryId !== imageAsset.publicId) pathsToDelete.push(existing.cloudinaryId)
    updateData.image = imageAsset.secureUrl
    updateData.cloudinaryId = imageAsset.publicId
  }

  if (imageFile) {
    if (existing.cloudinaryId) pathsToDelete.push(existing.cloudinaryId)
    else if (existing.image) {
      const pid = extractPublicId(existing.image)
      if (pid) pathsToDelete.push(pid)
    }

     try {
       const uploaded = await uploadFile(imageFile.buffer, imageFile.mimetype, 'blogs', imageFile.originalname)
       updateData.image = uploaded.url
       updateData.cloudinaryId = uploaded.publicId || uploaded.path
     } catch (err) {
      console.error('[blogService.updateBlog] Image upload failed:', err?.message)
      throw failure(500, `Image upload failed: ${err?.message || 'Unknown error'}`)
    }
  }

  if (videoFile) {
    // Delete the existing video when a new video is uploaded. Prefer the
    // dedicated video_cloudinary_id so we remove the exact video resource
    // (resource_type: video) rather than treating it as an image.
    if (existing.video) {
      if (existing.videoCloudinaryId) {
        pathsToDelete.push({
          publicId: existing.videoCloudinaryId,
          resourceType: existing.videoResourceType || 'video',
        })
      } else {
        const pid = extractPublicId(existing.video)
        if (pid) pathsToDelete.push({ publicId: pid, resourceType: existing.videoResourceType || 'video' })
      }
    }

    if (!isVideoCloudinaryConfigured()) {
      throw failure(503, 'Video upload service is not configured.')
    }
    try {
      const uploaded = await uploadVideo(videoFile.buffer, videoFile.mimetype, 'blogs', videoFile.originalname)
      updateData.video = uploaded.url
      const storageProvider = 'cloudinary'
      updateData.videoStorageProvider = storageProvider
      updateData.videoPlaybackUrl = uploaded.url
      updateData.videoThumbnailUrl = null
      updateData.videoUploadStatus = 'ready'
      updateData.videoCloudinaryId = uploaded.publicId
      updateData.videoAssetId = uploaded.assetId || null
      updateData.videoResourceType = uploaded.resourceType || 'video'
      updateData.videoCloudinaryType = uploaded.type || 'upload'
      updateData.videoCloudinaryVersion = uploaded.version ?? null
      updateData.videoFormat = uploaded.format || 'mp4'
      updateData.videoMimeType = 'video/mp4'
      updateData.videoDuration = uploaded.duration ?? null
      updateData.videoWidth = uploaded.width ?? null
      updateData.videoHeight = uploaded.height ?? null
      updateData.videoBytes = uploaded.bytes ?? null
      updateData.videoOriginalBytes = uploaded.bytes ?? null
      updateData.videoOriginalName = uploaded.originalName || videoFile.originalname
    } catch (err) {
      console.error('[blogService.updateBlog] Video upload failed:', err?.message)
      throw failure(500, `Video upload failed: ${err?.message || 'Unknown error'}`)
    }
  } else if (removeVideo) {
    // Preserve provider assets even if the current record reference is removed.
    updateData.video = null
    updateData.videoCloudinaryId = null
    updateData.videoAssetId = null
    updateData.videoResourceType = null
    updateData.videoCloudinaryType = null
    updateData.videoCloudinaryVersion = null
    updateData.videoFormat = null
    updateData.videoMimeType = null
    updateData.videoDuration = null
    updateData.videoWidth = null
    updateData.videoHeight = null
    updateData.videoBytes = null
    updateData.videoOriginalBytes = null
    updateData.videoOriginalName = null
    updateData.videoStorageProvider = null
    updateData.videoPlaybackUrl = null
    updateData.videoThumbnailUrl = null
    updateData.videoUploadStatus = null
  }

   if (homepageCircularImageFile) {
     if (existing.homepageCircularImageId) pathsToDelete.push(existing.homepageCircularImageId)

     try {
      const uploaded = await uploadFile(homepageCircularImageFile.buffer, homepageCircularImageFile.mimetype, 'blogs', homepageCircularImageFile.originalname)
        updateData.homepageCircularImage = uploaded.url
        updateData.homepageCircularImageId = uploaded.publicId || uploaded.path
      } catch (err) {
      console.error('[blogService.updateBlog] Homepage circular image upload failed:', err?.message)
      throw failure(500, `Homepage image upload failed: ${err?.message || 'Unknown error'}`)
    }
  } else if (removeHomepageCircularImage) {
    // Preserve the existing homepage circular image reference and provider asset.
  }

  // Start with existing media assets
  let finalMediaAssets = Array.isArray(existing.mediaAssets) ? [...existing.mediaAssets] : []
  let finalMediaUrls = Array.isArray(existing.mediaUrls) ? [...existing.mediaUrls] : []

  // Remove media URLs that are in the removeMediaUrls list
  if (removeMediaUrls && removeMediaUrls.length > 0) {
    finalMediaAssets = finalMediaAssets.filter((asset) => !removeMediaUrls.includes(asset.secureUrl))
    finalMediaUrls = finalMediaUrls.filter((url) => !removeMediaUrls.includes(url))
  }

  // Add new content assets from request body (pre-uploaded references)
  // These are assets that are not already in the existing media
  const newContentAssetsFromBody = contentAssets.filter(
    (asset) => !finalMediaUrls.includes(asset.secureUrl)
  )
  if (newContentAssetsFromBody.length > 0) {
    finalMediaAssets.push(...newContentAssetsFromBody)
    finalMediaUrls.push(...newContentAssetsFromBody.map((asset) => asset.secureUrl))
  }

  // Upload and add new content files
  if (contentFiles && contentFiles.length > 0) {
    const uploads = await Promise.all(contentFiles.map(async (f) => {
      const isVideo = f.mimetype?.startsWith('video/')
      if (isVideo) {
        if (!isVideoCloudinaryConfigured()) {
          throw failure(503, 'Video upload service is not configured.')
        }
        return uploadVideo(f.buffer, f.mimetype, 'blogs', f.originalname)
      }
      return uploadFile(f.buffer, f.mimetype, 'blogs', f.originalname)
    }))
    const uploadedAssets = uploads.map((uploaded) => ({
      secureUrl: uploaded.url,
      publicId: uploaded.publicId || uploaded.path,
      assetId: uploaded.assetId || null,
      resourceType: uploaded.resourceType || (isVideo ? 'video' : 'image'),
      type: uploaded.type || 'upload',
      version: uploaded.version ?? null,
      format: uploaded.format || null,
      mimeType: uploaded.mimeType || null,
      originalName: uploaded.originalName || null,
      duration: uploaded.duration ?? null,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
      bytes: uploaded.bytes ?? null,
    }))
    finalMediaAssets.push(...uploadedAssets)
    finalMediaUrls.push(...uploadedAssets.map((asset) => asset.secureUrl))
  }

  if (finalMediaAssets.length > 0) {
    updateData.mediaAssets = finalMediaAssets
    updateData.mediaUrls = finalMediaUrls
  } else {
    updateData.mediaAssets = []
    updateData.mediaUrls = []
  }

  const item = await prisma.blog.update({ where: { id }, data: updateData })

  if (pathsToDelete.length > 0) {
    const deletePromises = pathsToDelete.map((entry) => {
      if (typeof entry === 'object') return deleteFileByPublicId(entry.publicId, entry.resourceType)
      return deleteFileByPublicId(entry, 'image')
    })
    Promise.allSettled(deletePromises).catch((err) => {
      console.error('[blogService.updateBlog] File deletion failed (non-fatal):', err?.message)
    })
  }

  return mapBlog(item)
}

async function deleteBlog(id) {
  const existing = await prisma.blog.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Blog not found')

  // Delete the DB record first — don't let file deletion block or fail the operation
  await prisma.blog.delete({ where: { id } })

  // Then clean up files asynchronously
  const pathsToDelete = []
  const isSameAsVideo = Boolean(
    existing.cloudinaryId
    && existing.videoCloudinaryId
    && existing.cloudinaryId === existing.videoCloudinaryId
  )
  if (existing.cloudinaryId && !isSameAsVideo) {
    pathsToDelete.push({ publicId: existing.cloudinaryId, resourceType: 'image' })
  } else if (existing.image) {
    const pid = extractPublicId(existing.image)
    if (pid && pid !== existing.videoCloudinaryId) {
      pathsToDelete.push({ publicId: pid, resourceType: 'image' })
    }
  }
  if (existing.video) {
    if (existing.videoCloudinaryId) {
      pathsToDelete.push({ publicId: existing.videoCloudinaryId, resourceType: existing.videoResourceType || 'video' })
    } else {
      const pid = extractPublicId(existing.video)
      if (pid) pathsToDelete.push({ publicId: pid, resourceType: existing.videoResourceType || 'video' })
    }
  }
  if (existing.mediaUrls && existing.mediaUrls.length > 0) {
    for (const url of existing.mediaUrls) {
      const asset = (Array.isArray(existing.mediaAssets) ? existing.mediaAssets : [])
        .find((entry) => entry.secureUrl === url)
      const pid = asset?.publicId || extractPublicId(url)
      if (
        pid
        && !pathsToDelete.some((entry) => (
          typeof entry === 'object' ? entry.publicId === pid : entry === pid
        ))
      ) {
        pathsToDelete.push({
          publicId: pid,
          resourceType: asset?.resourceType || (url.includes('/video/upload/') ? 'video' : 'image'),
        })
      }
    }
  }
  if (existing.homepageCircularImageId) {
    pathsToDelete.push({ publicId: existing.homepageCircularImageId, resourceType: 'image' })
  } else if (existing.homepageCircularImage) {
    const pid = extractPublicId(existing.homepageCircularImage)
    if (pid) pathsToDelete.push({ publicId: pid, resourceType: 'image' })
  }

  if (pathsToDelete.length > 0) {
    const deletePromises = pathsToDelete.map((entry) =>
      deleteFileByPublicId(typeof entry === 'object' ? entry.publicId : entry, typeof entry === 'object' ? entry.resourceType : 'video')
    )
    Promise.allSettled(deletePromises).catch((err) => {
      console.error('[blogService.deleteBlog] File deletion failed (non-fatal):', err?.message)
    })
  }
}
