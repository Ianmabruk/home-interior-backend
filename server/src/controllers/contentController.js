import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { uploadImage, uploadVideo, deleteMedia } from '../services/uploadService.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { env } from '../config/env.js'
import { withId, withIdArray, parseMaybeJson, parseMediaSettings, DEFAULT_MEDIA_SETTINGS } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'

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

// Allowed Project fields for the admin write path. `tags` and `services` are
// intentionally NOT included — they are not part of the Project model/schema,
// so referencing them would cause a PrismaClientValidationError (and historically
// a P2022 on production where the columns never existed). Project records rely on
// title/description/category/media/videoUrl/coverImageUrl/order/mediaSettings.
const PROJECT_FIELDS = new Set([
  'title', 'description', 'category', 'media', 'beforeAfterImages',
  'videoUrl', 'videoPublicId', 'coverImageUrl', 'order', 'isPublished',
  'mediaSettings',
])

// Projection returned to the public + admin clients. Deliberately excludes
// tags/services (not part of the Project model) to avoid P2022.
const PROJECT_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  media: true,
  mediaSettings: true,
  coverImageUrl: true,
  videoUrl: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
}
const PORTFOLIO_FIELDS = new Set([
  'title', 'description', 'category', 'imageUrl', 'imagePublicId', 'order', 'isPublished', 'mediaSettings',
])
const VIRTUAL_DESIGN_FIELDS = new Set([
  'title', 'description', 'videoUrl', 'videoPublicId', 'thumbnailUrl', 'services',
  'beforeAfterImages', 'category', 'tags', 'ctaPrimary', 'ctaSecondary', 'isPublished', 'mediaSettings',
])
const stripUnknown = (obj, allowed) => {
  const out = {}
  for (const key of Object.keys(obj)) {
    if (allowed.has(key)) out[key] = obj[key]
  }
  return out
}

export const projectsController = {
  // Public list — defensive explicit select (never queries tags/services, which
  // are not part of the Project model). Never crashes the homepage: returns an
  // empty list on any failure.
  list: asyncHandler(async (req, res) => {
    try {
      const items = await prisma.project.findMany({
        where: { isPublished: true },
        select: PROJECT_SELECT,
      })
      res.json(sendSuccess(withIdArray(sortByOrderThenDate(items))))
    } catch (error) {
      console.error('[PROJECTS][LIST] failed:', error?.message)
      res.json(sendSuccess([]))
    }
  }),

  create: asyncHandler(async (req, res) => {
    const payload = stripUnknown({ ...req.body }, PROJECT_FIELDS)

    if (payload.order !== undefined) payload.order = orderValue(payload.order)

    const parsedMedia = parseMaybeJson(req.body.media, null)
    if (parsedMedia) payload.media = parsedMedia

    const parsedBeforeAfter = parseMaybeJson(req.body.beforeAfterImages, null)
    if (parsedBeforeAfter) payload.beforeAfterImages = parsedBeforeAfter

    const parsedMediaSettings = parseMediaSettings(req.body.mediaSettings)
    if (parsedMediaSettings) payload.mediaSettings = parsedMediaSettings

    const upload = await handleFileUpload(req, 'hok/projects')
    if (upload) {
      const mediaItem = { type: upload.kind, url: upload.url, publicId: upload.publicId }
      payload.media = [...(Array.isArray(payload.media) ? payload.media : []), mediaItem]
      if (upload.kind === 'video') {
        payload.videoUrl = upload.url
        payload.videoPublicId = upload.publicId
      } else {
        payload.coverImageUrl = upload.url
      }
    }

    payload.isPublished = payload.isPublished ?? true

    const item = await prismaSafeWrite(
      (data) => prisma.project.create({ data }),
      payload,
      'PROJECT][CREATE',
    )
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id }, select: PROJECT_SELECT })
    if (!existing) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const payload = stripUnknown({ ...req.body }, PROJECT_FIELDS)

    if (payload.order !== undefined) payload.order = orderValue(payload.order)

    const parsedBeforeAfter = parseMaybeJson(req.body.beforeAfterImages, null)
    if (parsedBeforeAfter) payload.beforeAfterImages = parsedBeforeAfter

    const parsedMedia = Array.isArray(req.body.media) ? req.body.media : parseMaybeJson(req.body.media, null)
    if (parsedMedia) payload.media = parsedMedia

    const parsedMediaSettings = parseMediaSettings(req.body.mediaSettings)
    if (parsedMediaSettings) payload.mediaSettings = parsedMediaSettings

    const upload = await handleFileUpload(req, 'hok/projects')
    if (upload) {
      const mediaList = Array.isArray(existing.media) ? existing.media : []
      const mediaDeletes = mediaList.map((m) => m.publicId ? deleteMedia(m.publicId, m.type === 'video' ? 'video' : 'image') : Promise.resolve())
      if (existing.videoPublicId && existing.videoPublicId !== upload.publicId) {
        mediaDeletes.push(deleteMedia(existing.videoPublicId, 'video'))
      }
      await Promise.all(mediaDeletes)
      const mediaItem = { type: upload.kind, url: upload.url, publicId: upload.publicId }
      payload.media = [mediaItem]
      if (upload.kind === 'video') {
        payload.videoUrl = upload.url
        payload.videoPublicId = upload.publicId
      } else {
        payload.coverImageUrl = upload.url
      }
    }

    const item = await prismaSafeWrite(
      (data) => prisma.project.update({ where: { id: req.params.id }, data }),
      payload,
      'PROJECT][UPDATE',
    )
    res.json(sendSuccess(withId(item)))
  }),

  remove: asyncHandler(async (req, res) => {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id }, select: PROJECT_SELECT })
    if (existing) {
      const mediaList = Array.isArray(existing.media) ? existing.media : []
      const mediaDeletes = mediaList.map((m) => m.publicId ? deleteMedia(m.publicId, m.type === 'video' ? 'video' : 'image') : Promise.resolve())
      if (existing.videoPublicId) {
        mediaDeletes.push(deleteMedia(existing.videoPublicId, 'video'))
      }
      await Promise.all(mediaDeletes)
    }
    await prisma.project.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Project deleted' }))
  }),
}

export const portfolioController = {
  list: async (req, res) => {
    try {
    const items = await prisma.portfolio.findMany({ where: { isPublished: true } })
    res.json(sendSuccess(withIdArray(sortByOrderThenDate(items))))
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
  },

  create: async (req, res) => {
    try {
      console.log('[PORTFOLIO][CREATE] request fields:', Object.keys(req.body))
      const payload = stripUnknown({ ...req.body }, PORTFOLIO_FIELDS)

      if (payload.order !== undefined) payload.order = orderValue(payload.order)
      payload.isPublished = toBoolean(req.body.isPublished, true)

      const parsedMediaSettings = parseMediaSettings(req.body.mediaSettings)
      if (parsedMediaSettings) payload.mediaSettings = parsedMediaSettings

      const upload = await handleFileUpload(req, 'hok/portfolio')
      if (upload) {
        payload.imageUrl = upload.url
        payload.imagePublicId = upload.publicId
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
  },

  update: async (req, res) => {
    try {
      const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ message: 'Portfolio not found' })
      }
      console.log('[PORTFOLIO][UPDATE] id=', req.params.id, 'fields:', Object.keys(req.body))

      const payload = stripUnknown({ ...req.body }, PORTFOLIO_FIELDS)

      if (payload.order !== undefined) payload.order = orderValue(payload.order)
      if (req.body.isPublished !== undefined) {
        payload.isPublished = toBoolean(req.body.isPublished, existing.isPublished)
      }

      const parsedMediaSettings = parseMediaSettings(req.body.mediaSettings)
      if (parsedMediaSettings) payload.mediaSettings = parsedMediaSettings

      const upload = await handleFileUpload(req, 'hok/portfolio')
      if (upload) {
        if (existing.imagePublicId) {
          try {
            await deleteMedia(existing.imagePublicId, 'image')
          } catch (deleteErr) {
            console.error('[PORTFOLIO][UPDATE] delete old media failed:', deleteErr?.message)
          }
        }
        payload.imageUrl = upload.url
        payload.imagePublicId = upload.publicId
      }

      const item = await prismaSafeWrite(
        (data) => prisma.portfolio.update({ where: { id: req.params.id }, data }),
        payload,
        'PORTFOLIO][UPDATE',
      )
      console.log('[PORTFOLIO][UPDATE] success id=', item.id, 'title=', item.title, 'published=', item.isPublished)
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
  },

  remove: async (req, res) => {
    try {
      const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ message: 'Portfolio not found' })
      }
      if (existing.imagePublicId) {
        try {
          await deleteMedia(existing.imagePublicId, 'image')
        } catch (deleteErr) {
          console.error('[PORTFOLIO][DELETE] delete old media failed:', deleteErr?.message)
        }
      }
      await prisma.portfolio.delete({ where: { id: req.params.id } })
      res.json(sendSuccess({ message: 'Portfolio deleted' }))
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
  },

  reorder: async (req, res) => {
    try {
      const incoming = Array.isArray(req.body.order)
        ? req.body.order
        : (typeof req.body.order === 'string' ? parseMaybeJson(req.body.order, []) : [])
      if (!Array.isArray(incoming) || incoming.length === 0) {
        throw new ApiError(400, 'order must be a non-empty array of portfolio ids')
      }

      const ids = incoming.map((id) => String(id))
      console.log('[PORTFOLIO][REORDER] count=', ids.length)

      const found = await prisma.portfolio.findMany({ where: { id: { in: ids } }, select: { id: true } })
      const foundSet = new Set(found.map((r) => r.id))
      const missing = ids.filter((id) => !foundSet.has(id))
      if (missing.length) {
        throw new ApiError(400, `Unknown portfolio id(s): ${missing.join(', ')}`)
      }

      await prisma.$transaction(
        ids.map((id, index) => prisma.portfolio.update({ where: { id }, data: { order: index } })),
      )
      console.log('[PORTFOLIO][REORDER] success')

      const items = await prisma.portfolio.findMany({ orderBy: { order: 'asc' } })
      res.json(sendSuccess(withIdArray(items)))
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
  },
}

export const virtualDesignController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.virtualDesign.findMany({ where: { isPublished: true } })
    res.json(sendSuccess(withIdArray(items)))
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

    const upload = await handleFileUpload(req, 'hok/virtual-design')
    if (upload) {
      payload.videoUrl = upload.url
      payload.videoPublicId = upload.publicId
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

    const upload = await handleFileUpload(req, 'hok/virtual-design')
    if (upload) {
      if (existing.videoPublicId && existing.videoPublicId !== upload.publicId) {
        try {
          await deleteMedia(existing.videoPublicId, 'video')
        } catch (deleteErr) {
          console.error('[VIRTUAL][UPDATE] delete old media failed:', deleteErr?.message)
        }
      }
      payload.videoUrl = upload.url
      payload.videoPublicId = upload.publicId
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
      if (existing.thumbnailUrl) {
        // thumbnailUrl has no stored publicId, cannot delete programmatically
      }
      await Promise.all(mediaDeletes)
    }
    await prisma.virtualDesign.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'VirtualDesign deleted' }))
  }),
}

export const getAbout = async (req, res) => {
  try {
    const about = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })
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

    const existing = await prisma.about.findFirst()
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
  let projects = []
  let portfolio = []
  let about = null

  try {
    projects = await prisma.project.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
      take: 8,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        media: true,
        coverImageUrl: true,
        videoUrl: true,
        order: true,
        mediaSettings: true,
      },
    })
  } catch (err) {
    console.error('[HOMEPAGE DEBUG] projects query failed:', err?.message)
    projects = []
  }

  try {
    portfolio = await prisma.portfolio.findMany({
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
    })
  } catch (err) {
    console.error('[HOMEPAGE DEBUG] portfolio query failed:', err?.message)
    portfolio = []
  }

  try {
    about = await prisma.about.findFirst({
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
    })
  } catch (err) {
    console.error('[HOMEPAGE DEBUG] about query failed:', err?.message)
    about = null
  }

  const sortedProjects = sortByOrderThenDate(projects || []).slice(0, 6)
  const sortedPortfolio = sortByOrderThenDate(portfolio || []).slice(0, 12)
  const featuredProjects = sortedProjects.slice(0, 3)

  // Pick the newest published project that actually has a video URL, so the
  // hero never renders empty when the first-ordered project is an image-only
  // entry. Falls back to the first project, then to null if none exist.
  const heroProject =
    sortedProjects.find((p) => p?.videoUrl) || sortedProjects[0] || null
  const heroVideo = heroProject?.videoUrl ? { url: heroProject.videoUrl } : null

  // Structured debug log — exactly which section had data.
  console.log('[HOMEPAGE DEBUG]', {
    heroVideo: heroVideo ? 'found' : 'null',
    featuredProject: heroProject ? 'found' : 'missing',
    projectCount: sortedProjects.length,
    portfolioCount: sortedPortfolio.length,
    about: about ? 'found' : 'null',
  })

  res.json(sendSuccess({
    heroVideo,
    projects: withIdArray(sortedProjects),
    featuredProjects: withIdArray(featuredProjects),
    portfolio: withIdArray(sortedPortfolio),
    about: withId(about),
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
