import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/db.js'
import { uploadToCloudinary } from '../services/uploadService.js'

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
  const result = await uploadToCloudinary(req.file.buffer, folder, kind)
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

export const projectsController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.project.findMany()
    res.json(withIdArray(sortByOrderThenDate(items)))
  }),

  create: asyncHandler(async (req, res) => {
    const payload = { ...req.body }

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

    const item = await prisma.project.create({ data: payload })
    res.status(201).json(withId(item))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const payload = { ...req.body }

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
    res.json(withId(item))
  }),

  remove: asyncHandler(async (req, res) => {
    await prisma.project.delete({ where: { id: req.params.id } })
    res.json({ message: 'Project deleted' })
  }),
}

export const portfolioController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.portfolio.findMany()
    res.json(withIdArray(sortByOrderThenDate(items)))
  }),

  create: asyncHandler(async (req, res) => {
    const payload = { ...req.body }
    const upload = await handleFileUpload(req, 'hok/portfolio')
    if (upload) {
      payload.imageUrl = upload.url
      payload.imagePublicId = upload.publicId
    }
    const item = await prisma.portfolio.create({ data: payload })
    res.status(201).json(withId(item))
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
    res.json(withId(item))
  }),

  remove: asyncHandler(async (req, res) => {
    await prisma.portfolio.delete({ where: { id: req.params.id } })
    res.json({ message: 'Portfolio deleted' })
  }),
}

export const virtualDesignController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.virtualDesign.findMany()
    res.json(withIdArray(items))
  }),

  create: asyncHandler(async (req, res) => {
    const payload = { ...req.body }

    const parsedServices = parseServices(req.body.services)
    if (parsedServices.length) payload.services = parsedServices

    const parsedBeforeAfter = parseMaybeJson(req.body.beforeAfterImages, null)
    if (parsedBeforeAfter) payload.beforeAfterImages = parsedBeforeAfter

    const parsedTags = parseMaybeJson(req.body.tags, null)
    if (parsedTags) payload.tags = parsedTags

    const upload = await handleFileUpload(req, 'hok/virtual-design')
    if (upload) {
      payload.videoUrl = upload.url
      payload.videoPublicId = upload.publicId
    }

    const item = await prisma.virtualDesign.create({ data: payload })
    res.status(201).json(withId(item))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ message: 'VirtualDesign not found' })
    }

    const payload = { ...req.body }

    const parsedServices = parseServices(req.body.services)
    if (parsedServices.length) payload.services = parsedServices

    const parsedBeforeAfter = parseMaybeJson(req.body.beforeAfterImages, null)
    if (parsedBeforeAfter) payload.beforeAfterImages = parsedBeforeAfter

    const parsedTags = parseMaybeJson(req.body.tags, null)
    if (parsedTags) payload.tags = parsedTags

    const upload = await handleFileUpload(req, 'hok/virtual-design')
    if (upload) {
      payload.videoUrl = upload.url
      payload.videoPublicId = upload.publicId
    }

    const item = await prisma.virtualDesign.update({ where: { id: req.params.id }, data: payload })
    res.json(withId(item))
  }),

  remove: asyncHandler(async (req, res) => {
    await prisma.virtualDesign.delete({ where: { id: req.params.id } })
    res.json({ message: 'VirtualDesign deleted' })
  }),
}

export const getAbout = asyncHandler(async (req, res) => {
  const about = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })
  res.json(withId(about))
})

export const upsertAbout = asyncHandler(async (req, res) => {
  const payload = { ...req.body }
  const parsedSocials = parseMaybeJson(req.body.socials, null)
  if (parsedSocials) payload.socials = parsedSocials

  if (req.file) {
    const upload = await uploadToCloudinary(req.file.buffer, 'hok/about', 'image')
    payload.aboutImageUrl = upload.secure_url
    payload.aboutImagePublicId = upload.public_id
  }

  const existing = await prisma.about.findFirst()
  if (!existing) {
    const created = await prisma.about.create({ data: payload })
    return res.status(201).json(withId(created))
  }

  const updated = await prisma.about.update({ where: { id: existing.id }, data: payload })
  res.json(withId(updated))
})

export const homepageFeed = asyncHandler(async (req, res) => {
  const [projects, portfolio, about] = await Promise.all([
    prisma.project.findMany({ where: { isPublished: true } }),
    prisma.portfolio.findMany({ where: { isPublished: true } }),
    prisma.about.findFirst({ orderBy: { createdAt: 'desc' } }),
  ])

  const sortedProjects = sortByOrderThenDate(projects).slice(0, 6)
  const sortedPortfolio = sortByOrderThenDate(portfolio).slice(0, 12)

  const heroVideo = sortedProjects?.[0]?.videoUrl ? {
    url: sortedProjects[0].videoUrl,
    title: sortedProjects[0].title,
    description: sortedProjects[0].description,
  } : null

  res.json({ heroVideo, portfolio: withIdArray(sortedPortfolio), about: withId(about) })
})

export const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await prisma.analytics.findMany({ orderBy: { date: 'asc' } })
  res.json(withIdArray(analytics))
})
