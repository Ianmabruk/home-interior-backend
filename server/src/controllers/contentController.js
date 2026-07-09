import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/db.js'
import { uploadToCloudinary } from '../services/uploadService.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { env } from '../config/env.js'

const withId = (item) => item ? { ...item, _id: item.id } : null
const withIdArray = (items) => items.map((item) => withId(item))

const parseMaybeJson = (value, fallback = null) => {
  if (typeof value !== 'string') return fallback
  try { return JSON.parse(value) } catch { return fallback }
}

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
  const result = await uploadToCloudinary(req.file.buffer, folder, kind, mimeType)
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

const PROJECT_FIELDS = new Set([
  'title', 'description', 'category', 'media', 'beforeAfterImages',
  'videoUrl', 'videoPublicId', 'coverImageUrl', 'order', 'isPublished', 'tags', 'services',
])
const stripUnknown = (obj, allowed) => {
  const out = {}
  for (const key of Object.keys(obj)) {
    if (allowed.has(key)) out[key] = obj[key]
  }
  return out
}

export const projectsController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.project.findMany()
    res.json(sendSuccess(withIdArray(sortByOrderThenDate(items))))
  }),

  create: asyncHandler(async (req, res) => {
    const payload = stripUnknown({ ...req.body }, PROJECT_FIELDS)

    if (payload.order !== undefined) payload.order = orderValue(payload.order)

    const parsedMedia = parseMaybeJson(req.body.media, null)
    if (parsedMedia) payload.media = parsedMedia

    const parsedServices = parseServices(req.body.services)
    if (parsedServices.length) payload.services = parsedServices

    const parsedBeforeAfter = parseMaybeJson(req.body.beforeAfterImages, null)
    if (parsedBeforeAfter) payload.beforeAfterImages = parsedBeforeAfter

    const parsedTags = parseMaybeJson(req.body.tags, null)
    if (parsedTags) payload.tags = parsedTags

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

    const item = await prisma.project.create({ data: payload })
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const payload = stripUnknown({ ...req.body }, PROJECT_FIELDS)

    const parsedServices = parseServices(req.body.services)
    if (parsedServices.length) payload.services = parsedServices

    const parsedBeforeAfter = parseMaybeJson(req.body.beforeAfterImages, null)
    if (parsedBeforeAfter) payload.beforeAfterImages = parsedBeforeAfter

    const parsedTags = parseMaybeJson(req.body.tags, null)
    if (parsedTags) payload.tags = parsedTags

    const parsedMedia = Array.isArray(req.body.media) ? req.body.media : parseMaybeJson(req.body.media, null)
    if (parsedMedia) payload.media = parsedMedia

    const upload = await handleFileUpload(req, 'hok/projects')
    if (upload) {
      const mediaItem = { type: upload.kind, url: upload.url, publicId: upload.publicId }
      const currentMedia = Array.isArray(existing.media) ? existing.media : []
      payload.media = [...currentMedia, mediaItem]
      if (upload.kind === 'video') {
        payload.videoUrl = upload.url
        payload.videoPublicId = upload.publicId
      } else {
        payload.coverImageUrl = upload.url
      }
    }

    const item = await prisma.project.update({ where: { id: req.params.id }, data: payload })
    res.json(sendSuccess(withId(item)))
  }),

  remove: asyncHandler(async (req, res) => {
    await prisma.project.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Project deleted' }))
  }),
}

export const portfolioController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.portfolio.findMany()
    res.json(sendSuccess(withIdArray(sortByOrderThenDate(items))))
  }),

  create: asyncHandler(async (req, res) => {
    const payload = { ...req.body }
    const upload = await handleFileUpload(req, 'hok/portfolio')
    if (upload) {
      payload.imageUrl = upload.url
      payload.imagePublicId = upload.publicId
    }
    payload.isPublished = payload.isPublished ?? true
    const item = await prisma.portfolio.create({ data: payload })
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ message: 'Portfolio not found' })
    }

    const payload = { ...req.body }
    const upload = await handleFileUpload(req, 'hok/portfolio')
    if (upload) {
      payload.imageUrl = upload.url
      payload.imagePublicId = upload.publicId
    }

    const item = await prisma.portfolio.update({ where: { id: req.params.id }, data: payload })
    res.json(sendSuccess(withId(item)))
  }),

  remove: asyncHandler(async (req, res) => {
    await prisma.portfolio.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Portfolio deleted' }))
  }),
}

export const virtualDesignController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.virtualDesign.findMany()
    res.json(sendSuccess(withIdArray(items)))
  }),

  create: asyncHandler(async (req, res) => {
    const payload = { ...req.body }

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

    const item = await prisma.virtualDesign.create({ data: payload })
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ message: 'VirtualDesign not found' })
    }

    const payload = { ...req.body }

    const parsedServices = parseServices(req.body.services)
    payload.services = parsedServices.length ? parsedServices : existing.services || []

    const parsedBeforeAfter = parseMaybeJson(req.body.beforeAfterImages, null)
    if (parsedBeforeAfter !== null) payload.beforeAfterImages = parsedBeforeAfter

    const parsedTags = parseMaybeJson(req.body.tags, null)
    payload.tags = Array.isArray(parsedTags) ? parsedTags : (parsedTags ? [parsedTags] : existing.tags || [])

    const upload = await handleFileUpload(req, 'hok/virtual-design')
    if (upload) {
      payload.videoUrl = upload.url
      payload.videoPublicId = upload.publicId
    }

    const item = await prisma.virtualDesign.update({ where: { id: req.params.id }, data: payload })
    res.json(sendSuccess(withId(item)))
  }),

  remove: asyncHandler(async (req, res) => {
    await prisma.virtualDesign.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'VirtualDesign deleted' }))
  }),
}

export const getAbout = asyncHandler(async (req, res) => {
  const about = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })
  res.json(sendSuccess(withId(about)))
})

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
])

export const upsertAbout = asyncHandler(async (req, res) => {
  // Build payload only from provided fields so an update never wipes data
  // the form doesn't manage (e.g. companyDescription set elsewhere).
  const payload = {}
  for (const key of Object.keys(req.body)) {
    if (ABOUT_FIELDS.has(key)) payload[key] = req.body[key]
  }
  const parsedSocials = parseMaybeJson(req.body.socials, null)
  if (parsedSocials) payload.socials = parsedSocials

  if (req.file) {
    const mimeType = req.file.mimetype
    console.log('[UPLOAD] About image upload:', { mimeType, size: req.file.size })
    const upload = await uploadToCloudinary(req.file.buffer, 'hok/about', 'image', mimeType)
    payload.aboutImageUrl = upload.secure_url
    payload.aboutImagePublicId = upload.public_id
  }

  const existing = await prisma.about.findFirst()
  if (!existing) {
    // First-time create: supply defaults for required (non-nullable) columns
    // the minimal admin form does not send, so Prisma validation never 500s.
    const created = await prisma.about.create({
      data: {
        story: payload.story ?? '',
        companyDescription: payload.companyDescription ?? '',
        mission: payload.mission ?? '',
        vision: payload.vision ?? '',
        location: payload.location ?? '',
        contactEmail: payload.contactEmail ?? env.emailFrom ?? '',
        socials: payload.socials ?? {},
        ...payload,
      },
    })
    return res.status(201).json(sendSuccess(withId(created)))
  }

  const updated = await prisma.about.update({ where: { id: existing.id }, data: payload })
  res.json(sendSuccess(withId(updated)))
})

export const homepageFeed = asyncHandler(async (req, res) => {
  const [projects, portfolio, about] = await Promise.all([
    prisma.project.findMany({ where: { isPublished: true } }),
    prisma.portfolio.findMany({ where: { isPublished: true } }),
    prisma.about.findFirst({ orderBy: { createdAt: 'desc' } }),
  ])

  const sortedProjects = sortByOrderThenDate(projects).slice(0, 6)
  const sortedPortfolio = sortByOrderThenDate(portfolio).slice(0, 12)
  const featuredProjects = sortedProjects.slice(0, 3)

  const heroProject = sortedProjects?.[0]
  const heroVideo = heroProject?.videoUrl ? {
    url: heroProject.videoUrl,
    title: heroProject.title,
    description: heroProject.description,
  } : null

  res.json(sendSuccess({ heroVideo, projects: withIdArray(sortedProjects), featuredProjects: withIdArray(featuredProjects), portfolio: withIdArray(sortedPortfolio), about: withId(about) }))
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
  const result = await uploadToCloudinary(file.buffer, 'hok/test-uploads', 'image', file.mimetype)

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
