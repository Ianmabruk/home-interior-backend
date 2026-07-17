import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { uploadImage, uploadVideo, deleteMedia } from '../services/uploadService.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { env } from '../config/env.js'
import { withId, withIdArray, parseMaybeJson, parseMediaSettings, DEFAULT_MEDIA_SETTINGS } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'
import { sendEmail, buildConsultationEmailTemplate } from '../config/sendgrid.js'
import { executeWithRetry } from '../config/db.js'

const parseServices = (value) => {
  const parsed = parseMaybeJson(value, null)
  if (Array.isArray(parsed)) return parsed
  if (parsed) return parsed.split(',').map(s => ({ title: s.trim() })).filter(s => s.title)
  if (typeof value === 'string' && value.trim()) return value.split(',').map(s => ({ title: s.trim() })).filter(s => s.title)
  return []
}

const handleFileUpload = async (req, folder, defaultKind = 'image') => {
  if (!req.file) return null
  const kind = req.body.resourceType === 'video' ? 'video' : defaultKind
  const mimeType = req.file.mimetype
  console.log('[UPLOAD] File upload request:', { fieldname: req.file.fieldname, kind, mimeType, size: req.file.size })
  const result = kind === 'video'
    ? await uploadVideo(req.file.buffer, folder, mimeType)
    : await uploadImage(req.file.buffer, folder, mimeType)
  return { url: result.secure_url, publicId: result.public_id, kind }
}

const handleMultipleUploads = async (files, folder, defaultKind = 'image') => {
  if (!Array.isArray(files) || files.length === 0) return []
  const results = await Promise.all(
    files.map((file) => {
      const kind = file.mimetype?.startsWith('video/') ? 'video' : defaultKind
      const uploadFn = kind === 'video' ? uploadVideo : uploadImage
      return uploadFn(file.buffer, folder, file.mimetype)
    }),
  )
  return results.map((result) => ({ url: result.secure_url, publicId: result.public_id, kind: result.resource_type || 'image' }))
}

const findFileByFieldname = (req, fieldname) => {
  const files = Array.isArray(req.files) ? req.files : []
  return files.find((f) => f.fieldname === fieldname) || null
}

const sortByOrderThenDate = (items) => items.sort((a, b) => {
  const orderDiff = (a.order || 0) - (b.order || 0)
  if (orderDiff !== 0) return orderDiff
  return new Date(b.createdAt) - new Date(a.createdAt)
})

const orderValue = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const toNumberIfFinite = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const toBoolean = (value, fallback) => {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === true) return true
  if (value === 'false' || value === false) return false
  return fallback
}

// Map a Prisma client/runtime error to a clean HTTP error so the admin UI
// never receives an opaque 500. Kept as a utility for any future direct
// Prisma calls that need explicit error mapping.
const rethrowAsHttpError = (err, label) => {
  if (err?.name === 'PrismaClientValidationError') {
    console.error(`[${label}] Prisma validation error:`, err.message)
    const friendly = err.message.includes('mediaSettings')
      ? 'Database schema is out of sync. Please contact support or redeploy to apply pending migrations.'
      : `Invalid fields sent to the database: ${err.message}`
    throw new ApiError(400, friendly)
  }
  throw err
}

// Projection returned to the public + admin clients. Deliberately excludes
// tags/services (not part of the Project model) to avoid P2022.
const PORTFOLIO_FIELDS = new Set([
  'title', 'description', 'category', 'imageUrl', 'imagePublicId', 'beforeAfterImages', 'gallery', 'order', 'isPublished', 'mediaSettings',
])
const VIRTUAL_DESIGN_FIELDS = new Set([
  'title', 'description', 'videoUrl', 'videoPublicId', 'videos', 'thumbnailUrl', 'imageUrl', 'imagePublicId', 'images',
  'services', 'beforeAfterImages', 'category', 'tags', 'ctaPrimary', 'ctaSecondary', 'isPublished', 'mediaSettings',
  'coverImageIndex', 'status',
])
const stripUnknown = (obj, allowed) => {
  const out = {}
  for (const key of Object.keys(obj)) {
    if (allowed.has(key)) out[key] = obj[key]
  }
  return out
}

export const portfolioController = {
  // Public list — defensive explicit select. Never crashes the homepage: returns an
  // empty list on any failure.
  list: asyncHandler(async (req, res) => {
    try {
      const items = await executeWithRetry(
        () => prisma.portfolio.findMany({
          where: { isPublished: true },
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            imageUrl: true,
            imagePublicId: true,
            beforeAfterImages: true,
            gallery: true,
            order: true,
            isPublished: true,
            mediaSettings: true,
          },
        }),
        'PORTFOLIO-LIST',
        { maxRetries: 2, timeout: 8000 }
      )
      res.json(sendSuccess(withIdArray(sortByOrderThenDate(items))))
    } catch (error) {
      console.error('[PORTFOLIO][LIST] db query failed:', error?.message)
      res.json(sendSuccess([]))
    }
  }),

get: asyncHandler(async (req, res) => {
    try {
      const item = await executeWithRetry(
        () => prisma.portfolio.findUnique({ where: { id: req.params.id } }),
        'PORTFOLIO-GET',
        { maxRetries: 2, timeout: 5000 }
      )
      if (!item) {
        return res.status(404).json({ success: false, message: 'Portfolio not found' })
      }
      res.json(sendSuccess(withId(item)))
    } catch (error) {
      console.error('[PORTFOLIO][GET] error:', error?.message)
      res.status(500).json({ success: false, message: 'Failed to fetch portfolio item' })
    }
  }),

  create: asyncHandler(async (req, res) => {
    try {
      console.log('[PORTFOLIO][CREATE] request fields:', Object.keys(req.body))
      const payload = stripUnknown({ ...req.body }, PORTFOLIO_FIELDS)

      if (payload.order !== undefined) payload.order = orderValue(payload.order)
      payload.isPublished = toBoolean(req.body.isPublished, true)

      const parsedMediaSettings = parseMediaSettings(req.body.mediaSettings)
      if (parsedMediaSettings) payload.mediaSettings = parsedMediaSettings

      const mediaFile = findFileByFieldname(req, 'media')
      if (mediaFile) {
        const upload = await uploadImage(mediaFile.buffer, 'hok/portfolio', mediaFile.mimetype)
        payload.imageUrl = upload.secure_url
        payload.imagePublicId = upload.public_id
      }

      const beforeFile = findFileByFieldname(req, 'beforeImage')
      if (beforeFile) {
        const beforeUpload = await uploadImage(beforeFile.buffer, 'hok/portfolio', beforeFile.mimetype)
        payload.beforeAfterImages = [{ url: beforeUpload.secure_url, publicId: beforeUpload.public_id, label: 'Before' }]
      }

      const galleryFiles = (Array.isArray(req.files) ? req.files : []).filter((f) => f.fieldname === 'gallery')
      if (galleryFiles.length > 0) {
        const galleryUploads = await handleMultipleUploads(galleryFiles, 'hok/portfolio')
        payload.gallery = galleryUploads.map((u) => ({ url: u.url, publicId: u.publicId }))
      }

      const item = await prismaSafeWrite(
        (data) => prisma.portfolio.create({ data }),
        payload,
        'PORTFOLIO][CREATE',
      )
      console.log('[PORTFOLIO][CREATE] success id=', item.id, 'title=', item.title, 'published=', item.isPublished)
      res.status(201).json(sendSuccess(withId(item)))
    } catch (error) {
      console.error("FULL ERROR:", error)
      console.error("MESSAGE:", error.message)
      console.error("STACK:", error.stack)
      console.error("PRISMA CODE:", error.code)
      console.error("BODY:", req.body)
      console.error("PARAMS:", req.params)
      console.error("QUERY:", req.query)
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
      }
      res.status(500).json({
        success: false,
        route: req.originalUrl || req.path,
        error: error.message,
        rawMessage: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      })
    }
  }),

  update: asyncHandler(async (req, res) => {
    try {
      const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Portfolio not found' })
      }

      const payload = stripUnknown({ ...req.body }, PORTFOLIO_FIELDS)

      if (payload.order !== undefined) payload.order = orderValue(payload.order)
      payload.isPublished = toBoolean(req.body.isPublished, existing.isPublished)

      const parsedMediaSettings = parseMediaSettings(req.body.mediaSettings)
      if (parsedMediaSettings) payload.mediaSettings = parsedMediaSettings

      const mediaFile = findFileByFieldname(req, 'media')
      if (mediaFile) {
        if (existing.imagePublicId) {
          await deleteMedia(existing.imagePublicId, 'image')
        }
        const upload = await uploadImage(mediaFile.buffer, 'hok/portfolio', mediaFile.mimetype)
        payload.imageUrl = upload.secure_url
        payload.imagePublicId = upload.public_id
      }

      const beforeFile = findFileByFieldname(req, 'beforeImage')
      if (beforeFile) {
        if (existing.beforeAfterImages && Array.isArray(existing.beforeAfterImages)) {
          for (const img of existing.beforeAfterImages) {
            if (img.publicId) await deleteMedia(img.publicId, 'image')
          }
        }
        const beforeUpload = await uploadImage(beforeFile.buffer, 'hok/portfolio', beforeFile.mimetype)
        payload.beforeAfterImages = [{ url: beforeUpload.secure_url, publicId: beforeUpload.public_id, label: 'Before' }]
      }

      const galleryFiles = (Array.isArray(req.files) ? req.files : []).filter((f) => f.fieldname === 'gallery')
      if (galleryFiles.length > 0) {
        if (existing.gallery && Array.isArray(existing.gallery)) {
          for (const img of existing.gallery) {
            if (img.publicId) await deleteMedia(img.publicId, 'image')
          }
        }
        const galleryUploads = await handleMultipleUploads(galleryFiles, 'hok/portfolio')
        payload.gallery = galleryUploads.map((u) => ({ url: u.url, publicId: u.publicId }))
      }

      const item = await prismaSafeWrite(
        (data) => prisma.portfolio.update({ where: { id: req.params.id }, data }),
        payload,
        'PORTFOLIO][UPDATE',
      )
      res.json(sendSuccess(withId(item)))
    } catch (error) {
      console.error("FULL ERROR:", error)
      console.error("MESSAGE:", error.message)
      console.error("STACK:", error.stack)
      console.error("PRISMA CODE:", error.code)
      console.error("BODY:", req.body)
      console.error("PARAMS:", req.params)
      console.error("QUERY:", req.query)
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
      }
      res.status(500).json({
        success: false,
        route: req.originalUrl || req.path,
        error: error.message,
        rawMessage: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      })
    }
  }),

  reorder: asyncHandler(async (req, res) => {
    const { order } = req.body
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Order must be an array of {id, order}' })
    }
    const updates = order.map((item, index) =>
      prisma.portfolio.update({ where: { id: item.id }, data: { order: item.order ?? index } })
    )
    await Promise.all(updates)
    res.json(sendSuccess({ message: 'Portfolio reordered' }))
  }),

  remove: asyncHandler(async (req, res) => {
    const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
    if (existing) {
      const mediaDeletes = []
      if (existing.imagePublicId) {
        mediaDeletes.push(deleteMedia(existing.imagePublicId, 'image'))
      }
      if (existing.beforeAfterImages && Array.isArray(existing.beforeAfterImages)) {
        existing.beforeAfterImages.forEach((img) => {
          if (img.publicId) mediaDeletes.push(deleteMedia(img.publicId, 'image'))
        })
      }
      if (existing.gallery && Array.isArray(existing.gallery)) {
        existing.gallery.forEach((img) => {
          if (img.publicId) mediaDeletes.push(deleteMedia(img.publicId, 'image'))
        })
      }
      await Promise.all(mediaDeletes)
    }
    await prisma.portfolio.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Portfolio deleted' }))
  }),
}
export const virtualDesignController = {
  list: asyncHandler(async (req, res) => {
    const items = await executeWithRetry(
      () => prisma.virtualDesign.findMany({ where: { isPublished: true } }),
      'VIRTUAL-LIST',
      { maxRetries: 2, timeout: 8000 }
    )
    res.json(sendSuccess(withIdArray(items)))
  }),

  get: asyncHandler(async (req, res) => {
    const item = await executeWithRetry(
      () => prisma.virtualDesign.findUnique({ where: { id: req.params.id } }),
      'VIRTUAL-GET',
      { maxRetries: 2, timeout: 5000 }
    )
    if (!item) {
      return res.status(404).json({ success: false, message: 'VirtualDesign not found' })
    }
    res.json(sendSuccess(withId(item)))
  }),

  create: asyncHandler(async (req, res) => {
    const payload = stripUnknown({ ...req.body }, VIRTUAL_DESIGN_FIELDS)

    const parsedMediaSettings = parseMediaSettings(req.body.mediaSettings)
    if (parsedMediaSettings) payload.mediaSettings = parsedMediaSettings

    const parsedServices = parseServices(req.body.services)
    payload.services = parsedServices.length ? parsedServices : []

    const parsedBeforeAfter = parseMaybeJson(req.body.beforeAfterImages, null)
    payload.beforeAfterImages = parsedBeforeAfter || null

    const parsedTags = parseMaybeJson(req.body.tags, null)
    payload.tags = Array.isArray(parsedTags) ? parsedTags : (parsedTags ? [parsedTags] : [])

    // Handle cover image index
    if (req.body.coverImageIndex !== undefined) {
      payload.coverImageIndex = Number(req.body.coverImageIndex) || 0
    }

    // Handle status
    if (req.body.status) {
      payload.status = req.body.status
    }

    // Handle multiple image uploads
    const imageFiles = (Array.isArray(req.files) ? req.files : []).filter((f) => f.fieldname === 'images')
    if (imageFiles.length > 0) {
      const uploads = await handleMultipleUploads(imageFiles, 'hok/virtual-design')
      payload.images = uploads.map((u) => ({ url: u.url, publicId: u.publicId, kind: u.kind }))
      if (!payload.imageUrl && uploads[0]) {
        payload.imageUrl = uploads[0].url
        payload.imagePublicId = uploads[0].publicId
      }
    }

    // Handle multiple video uploads
    const videoFiles = (Array.isArray(req.files) ? req.files : []).filter((f) => f.fieldname === 'videos')
    if (videoFiles.length > 0) {
      const uploads = await handleMultipleUploads(videoFiles, 'hok/virtual-design')
      payload.videos = uploads.map((u) => ({ url: u.url, publicId: u.publicId, kind: u.kind }))
      if (!payload.videoUrl && uploads[0]) {
        payload.videoUrl = uploads[0].url
        payload.videoPublicId = uploads[0].publicId
      }
    }

    // Handle single video upload (backwards compat)
    const videoFile = findFileByFieldname(req, 'video')
    if (videoFile) {
      const upload = await uploadVideo(videoFile.buffer, 'hok/virtual-design', videoFile.mimetype)
      payload.videoUrl = upload.secure_url
      payload.videoPublicId = upload.public_id
    }

    // Handle thumbnail upload
    const thumbnailFile = findFileByFieldname(req, 'thumbnail')
    if (thumbnailFile) {
      const upload = await uploadImage(thumbnailFile.buffer, 'hok/virtual-design', thumbnailFile.mimetype)
      payload.thumbnailUrl = upload.secure_url
    }

    // Handle single image upload (for imageUrl)
    const imageFile = findFileByFieldname(req, 'image')
    if (imageFile) {
      const upload = await uploadImage(imageFile.buffer, 'hok/virtual-design', imageFile.mimetype)
      payload.imageUrl = upload.secure_url
      payload.imagePublicId = upload.public_id
    }

    payload.isPublished = payload.isPublished ?? true

    const item = await prismaSafeWrite(
      (data) => prisma.virtualDesign.create({ data }),
      payload,
      'VIRTUAL][CREATE',
    )
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ message: 'VirtualDesign not found' })
    }

    const payload = stripUnknown({ ...req.body }, VIRTUAL_DESIGN_FIELDS)

    const parsedMediaSettings = parseMediaSettings(req.body.mediaSettings)
    if (parsedMediaSettings) payload.mediaSettings = parsedMediaSettings

    const parsedServices = parseServices(req.body.services)
    payload.services = parsedServices.length ? parsedServices : existing.services || []

    const parsedBeforeAfter = parseMaybeJson(req.body.beforeAfterImages, null)
    if (parsedBeforeAfter !== null) payload.beforeAfterImages = parsedBeforeAfter

    const parsedTags = parseMaybeJson(req.body.tags, null)
    payload.tags = Array.isArray(parsedTags) ? parsedTags : (parsedTags ? [parsedTags] : existing.tags || [])

    // Handle cover image index
    if (req.body.coverImageIndex !== undefined) {
      payload.coverImageIndex = Number(req.body.coverImageIndex) || 0
    }

    // Handle status
    if (req.body.status !== undefined) {
      payload.status = req.body.status
    }

    // Handle multiple image uploads
    const imageFiles = (Array.isArray(req.files) ? req.files : []).filter((f) => f.fieldname === 'images')
    if (imageFiles.length > 0) {
      const uploads = await handleMultipleUploads(imageFiles, 'hok/virtual-design')
      const newImages = uploads.map((u) => ({ url: u.url, publicId: u.publicId, kind: u.kind }))
      // Merge with existing images
      const existingImages = Array.isArray(existing.images) ? existing.images : []
      payload.images = [...existingImages, ...newImages]
      if (!payload.imageUrl && uploads[0]) {
        payload.imageUrl = uploads[0].url
        payload.imagePublicId = uploads[0].publicId
      }
    }

    // Handle multiple video uploads
    const videoFiles = (Array.isArray(req.files) ? req.files : []).filter((f) => f.fieldname === 'videos')
    if (videoFiles.length > 0) {
      const uploads = await handleMultipleUploads(videoFiles, 'hok/virtual-design')
      const newVideos = uploads.map((u) => ({ url: u.url, publicId: u.publicId, kind: u.kind }))
      // Merge with existing videos
      const existingVideos = Array.isArray(existing.videos) ? existing.videos : []
      payload.videos = [...existingVideos, ...newVideos]
      if (!payload.videoUrl && uploads[0]) {
        payload.videoUrl = uploads[0].url
        payload.videoPublicId = uploads[0].publicId
      }
    }

    // Handle single video upload
    const videoFile = findFileByFieldname(req, 'video')
    if (videoFile) {
      if (existing.videoPublicId) {
        try {
          await deleteMedia(existing.videoPublicId, 'video')
        } catch (deleteErr) {
          console.error('[VIRTUAL][UPDATE] delete old video failed:', deleteErr?.message)
        }
      }
      const upload = await uploadVideo(videoFile.buffer, 'hok/virtual-design', videoFile.mimetype)
      payload.videoUrl = upload.secure_url
      payload.videoPublicId = upload.public_id
    }

    // Handle thumbnail upload
    const thumbnailFile = findFileByFieldname(req, 'thumbnail')
    if (thumbnailFile) {
      const upload = await uploadImage(thumbnailFile.buffer, 'hok/virtual-design', thumbnailFile.mimetype)
      payload.thumbnailUrl = upload.secure_url
    }

    // Handle single image upload
    const imageFile = findFileByFieldname(req, 'image')
    if (imageFile) {
      if (existing.imagePublicId) {
        try {
          await deleteMedia(existing.imagePublicId, 'image')
        } catch (deleteErr) {
          console.error('[VIRTUAL][UPDATE] delete old image failed:', deleteErr?.message)
        }
      }
      const upload = await uploadImage(imageFile.buffer, 'hok/virtual-design', imageFile.mimetype)
      payload.imageUrl = upload.secure_url
      payload.imagePublicId = upload.public_id
    }

    const item = await prismaSafeWrite(
      (data) => prisma.virtualDesign.update({ where: { id: req.params.id }, data }),
      payload,
      'VIRTUAL][UPDATE',
    )
    res.json(sendSuccess(withId(item)))
  }),

  remove: asyncHandler(async (req, res) => {
    const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
    if (existing) {
      const mediaDeletes = []
      if (existing.videoPublicId) mediaDeletes.push(deleteMedia(existing.videoPublicId, 'video'))
      if (existing.imagePublicId) mediaDeletes.push(deleteMedia(existing.imagePublicId, 'image'))
      if (existing.thumbnailUrl) {
        // thumbnailUrl has no stored publicId, cannot delete programmatically
      }
      if (existing.images && Array.isArray(existing.images)) {
        existing.images.forEach((img) => {
          if (img.publicId) mediaDeletes.push(deleteMedia(img.publicId, img.kind === 'video' ? 'video' : 'image'))
        })
      }
      if (existing.videos && Array.isArray(existing.videos)) {
        existing.videos.forEach((vid) => {
          if (vid.publicId) mediaDeletes.push(deleteMedia(vid.publicId, vid.kind === 'video' ? 'video' : 'image'))
        })
      }
      await Promise.all(mediaDeletes)
    }
    await prisma.virtualDesign.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'VirtualDesign deleted' }))
  }),
}

export const getAbout = async (req, res) => {
  try {
    const about = await executeWithRetry(
      () => prisma.about.findFirst({ orderBy: { createdAt: 'desc' } }),
      'ABOUT-GET',
      { maxRetries: 2, timeout: 5000 }
    )
    res.json(sendSuccess(about ? withId(about) : null))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("PARAMS:", req.params)
    console.error("QUERY:", req.query)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

// Fields the admin About form may provide. Only these are written, so a stale
// or extra form field can never trigger a Prisma validation error.
const ABOUT_FIELDS = new Set([
  'aboutImageUrl',
  'aboutImagePublicId',
  'story',
  'companyDescription',
  'mission',
  'vision',
  'location',
  'contactEmail',
  'socials',
  'mediaSettings',
])

export const upsertAbout = async (req, res) => {
  try {
    const payload = {}
    for (const key of Object.keys(req.body)) {
      if (ABOUT_FIELDS.has(key)) payload[key] = req.body[key]
    }
    const parsedSocials = parseMaybeJson(req.body.socials, null)
    if (parsedSocials) payload.socials = parsedSocials

    const parsedMediaSettings = parseMediaSettings(req.body.mediaSettings)
    if (parsedMediaSettings) payload.mediaSettings = parsedMediaSettings

    if (req.file) {
      try {
        const upload = await handleFileUpload(req, 'hok/about', 'image')
        if (upload) {
          payload.aboutImageUrl = upload.url
          payload.aboutImagePublicId = upload.publicId
        }
      } catch (error) {
        console.error('[UPLOAD] About image upload failed:', error)
        throw error instanceof ApiError
          ? error
          : new ApiError(502, 'Failed to upload About image')
      }
    }

    const existing = await executeWithRetry(
      () => prisma.about.findFirst(),
      'ABOUT-FIND',
      { maxRetries: 2, timeout: 5000 }
    )
    if (!existing) {
      const createPayload = {
        story: payload.story ?? '',
        companyDescription: payload.companyDescription ?? '',
        mission: payload.mission ?? '',
        vision: payload.vision ?? '',
        location: payload.location ?? '',
        contactEmail: payload.contactEmail ?? env.emailFrom ?? '',
        socials: payload.socials ?? {},
        ...payload,
      }
      if (!createPayload.socials || typeof createPayload.socials !== 'object') {
        createPayload.socials = {}
      }
      const created = await prismaSafeWrite(
        (data) => prisma.about.create({ data }),
        createPayload,
        'ABOUT][CREATE',
      )
      return res.status(201).json(sendSuccess(withId(created)))
    }

    if (payload.aboutImagePublicId && existing.aboutImagePublicId && payload.aboutImagePublicId !== existing.aboutImagePublicId) {
      try {
        await deleteMedia(existing.aboutImagePublicId, 'image')
      } catch (deleteErr) {
        console.error('[ABOUT][UPDATE] delete old media failed:', deleteErr?.message)
      }
    }

    const safeUpdatePayload = {
      ...payload,
      socials: payload.socials ?? existing.socials ?? {},
    }
    if (!safeUpdatePayload.socials || typeof safeUpdatePayload.socials !== 'object') {
      safeUpdatePayload.socials = existing.socials ?? {}
    }
    delete safeUpdatePayload.id

    const updated = await prismaSafeWrite(
      (data) => prisma.about.update({ where: { id: existing.id }, data }),
      safeUpdatePayload,
      'ABOUT][UPDATE',
    )
    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("PARAMS:", req.params)
    console.error("QUERY:", req.query)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

export const homepageFeed = asyncHandler(async (req, res) => {
  // Each section is queried independently inside its own try/catch so a
  // missing/empty record (or a single failing query) can NEVER 500 the whole
  // homepage. Every branch falls back to a safe empty value and is logged.
  let portfolio = []
  let virtualDesigns = []
  let about = null
  let testimonials = []

  try {
    portfolio = await executeWithRetry(
      () => prisma.portfolio.findMany({
        where: { isPublished: true },
        orderBy: { order: 'asc' },
        take: 12,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          imageUrl: true,
          order: true,
          mediaSettings: true,
          isPublished: true,
          createdAt: true,
        },
      }),
      'HOMEPAGE-PORTFOLIO',
      { maxRetries: 2, timeout: 8000 }
    )
  } catch (err) {
    console.error('[HOMEPAGE] portfolio query failed:', err?.message)
    portfolio = []
  }

  try {
    virtualDesigns = await executeWithRetry(
      () => prisma.virtualDesign.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          imageUrl: true,
          images: true,
          videoUrl: true,
          videos: true,
          thumbnailUrl: true,
          order: true,
          createdAt: true,
        },
      }),
      'HOMEPAGE-VIRTUAL',
      { maxRetries: 2, timeout: 8000 }
    )
  } catch (err) {
    console.error('[HOMEPAGE] virtualDesigns query failed:', err?.message)
    virtualDesigns = []
  }

  try {
    about = await executeWithRetry(
      () => prisma.about.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          aboutImageUrl: true,
          story: true,
          companyDescription: true,
          mission: true,
          vision: true,
          mediaSettings: true,
        },
      }),
      'HOMEPAGE-ABOUT',
      { maxRetries: 2, timeout: 5000 }
    )
  } catch (err) {
    console.error('[HOMEPAGE] about query failed:', err?.message)
    about = null
  }

  try {
    testimonials = await executeWithRetry(
      () => prisma.testimonial.findMany({
        where: { isPublished: true },
        orderBy: { order: 'asc' },
        take: 10,
        select: {
          id: true,
          name: true,
          role: true,
          content: true,
          avatarUrl: true,
          order: true,
        },
      }),
      'HOMEPAGE-TESTIMONIALS',
      { maxRetries: 2, timeout: 5000 }
    )
  } catch (err) {
    console.error('[HOMEPAGE] testimonials query failed:', err?.message)
    testimonials = []
  }

  const sortedPortfolio = sortByOrderThenDate(portfolio || []).slice(0, 12)
  const sortedVirtualDesigns = sortByOrderThenDate(virtualDesigns || []).slice(0, 12)
  const sortedTestimonials = sortByOrderThenDate(testimonials || []).slice(0, 10)

  // Featured items for hero/featured sections
  const featuredPortfolio = sortedPortfolio.slice(0, 3)
  const featuredVirtualDesigns = sortedVirtualDesigns.slice(0, 3)

  // Structured debug log — exactly which section had data.
  console.log('[HOMEPAGE DEBUG]', {
    portfolioCount: sortedPortfolio.length,
    virtualDesignCount: sortedVirtualDesigns.length,
    testimonialCount: sortedTestimonials.length,
    aboutFound: about ? true : false,
  })

  res.json(sendSuccess({
    portfolio: withIdArray(sortedPortfolio),
    virtualInteriorDesign: withIdArray(sortedVirtualDesigns),
    about: withId(about),
    testimonials: withIdArray(sortedTestimonials),
    featuredPortfolio: withIdArray(featuredPortfolio),
    featuredVirtualDesigns: withIdArray(featuredVirtualDesigns),
  }))
})

export const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await prisma.analytics.findMany({ orderBy: { date: 'asc' } })
  res.json(sendSuccess(withIdArray(analytics)))
})

export const testUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded', received: req.files || req.body })
  }

  const file = req.file
  const result = await uploadImage(file.buffer, 'hok/test-uploads', file.mimetype)

  res.status(200).json(sendSuccess({
    message: 'Upload successful',
    file: {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: result.secure_url,
      publicId: result.public_id,
    },
  }))
})

// Centralized media upload. Every module that needs to push a file to
// Cloudinary can route through this single endpoint instead of bespoke
// per-feature routes, satisfying the "one media service" requirement.
export const uploadMediaController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' })
  }
  const folder = typeof req.body.folder === 'string' && req.body.folder.trim()
    ? req.body.folder.trim()
    : 'hok/uploads'
  const kind = req.body.resourceType === 'video' ? 'video' : 'image'
  const mimeType = req.file.mimetype
  const result = kind === 'video'
    ? await uploadVideo(req.file.buffer, folder, mimeType)
    : await uploadImage(req.file.buffer, folder, mimeType)
  res.status(200).json(sendSuccess({
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: kind,
  }))
})

// Centralized media deletion. Called by the frontend media service so every
// module routes deletes through one backend endpoint.
export const deleteMediaController = asyncHandler(async (req, res) => {
  const { publicId, resourceType } = req.body
  if (!publicId) {
    return res.status(400).json({ message: 'publicId is required' })
  }
  const result = await deleteMedia(publicId, resourceType === 'video' ? 'video' : 'image')
  res.json(sendSuccess({ result: result?.result || 'ok' }))
})
