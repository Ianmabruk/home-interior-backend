import { asyncHandler } from '../utils/asyncHandler.js'
import { Project } from '../models/Project.js'
import { Portfolio } from '../models/Portfolio.js'
import { About } from '../models/About.js'
import { VirtualDesign } from '../models/VirtualDesign.js'
import { Product } from '../models/Product.js'
import { uploadToCloudinary } from '../services/uploadService.js'

const parseMaybeJson = (value, fallback = null) => {
  if (typeof value !== 'string') return fallback
  try { return JSON.parse(value) } catch { return fallback }
}

// Upload file and return { url, publicId, kind }
const handleFileUpload = async (req, folder, defaultKind = 'image') => {
  if (!req.file) return null
  const kind = req.body.resourceType === 'video' ? 'video' : defaultKind
  const result = await uploadToCloudinary(req.file.buffer, folder, kind)
  return { url: result.secure_url, publicId: result.public_id, kind }
}

const crudFactory = (Model) => ({
  list: asyncHandler(async (req, res) => {
    const items = await Model.find({}).sort({ order: 1, createdAt: -1 })
    res.json(items)
  }),

  create: asyncHandler(async (req, res) => {
    const payload = { ...req.body }

    const parsedMedia = parseMaybeJson(req.body.media, null)
    if (parsedMedia) payload.media = parsedMedia

    const parsedServices = parseMaybeJson(req.body.services, null)
    if (parsedServices) payload.services = parsedServices

    const parsedBeforeAfter = parseMaybeJson(req.body.beforeAfterImages, null)
    if (parsedBeforeAfter) payload.beforeAfterImages = parsedBeforeAfter

    const parsedTags = parseMaybeJson(req.body.tags, null)
    if (parsedTags) payload.tags = parsedTags

    const upload = await handleFileUpload(req, `hok/${Model.modelName.toLowerCase()}`)
    if (upload) {
      if (Model.modelName === 'Project') {
        const mediaItem = { type: upload.kind, url: upload.url, publicId: upload.publicId }
        payload.media = [...(Array.isArray(payload.media) ? payload.media : []), mediaItem]
        if (upload.kind === 'video') {
          payload.videoUrl = upload.url
          payload.videoPublicId = upload.publicId
        } else {
          payload.coverImageUrl = upload.url
        }
      } else if (Model.modelName === 'Portfolio') {
        payload.imageUrl = upload.url
        payload.imagePublicId = upload.publicId
      } else if (Model.modelName === 'VirtualDesign') {
        payload.videoUrl = upload.url
        payload.videoPublicId = upload.publicId
      } else {
        if (upload.kind === 'video') {
          payload.videoUrl = upload.url
          payload.videoPublicId = upload.publicId
        } else {
          payload.imageUrl = upload.url
          payload.imagePublicId = upload.publicId
        }
      }
    }

    const item = await Model.create(payload)
    res.status(201).json(item)
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await Model.findById(req.params.id)
    if (!existing) {
      res.status(404).json({ message: `${Model.modelName} not found` })
      return
    }

    const payload = { ...req.body }

    const parsedServices = parseMaybeJson(req.body.services, null)
    if (parsedServices) payload.services = parsedServices

    const parsedBeforeAfter = parseMaybeJson(req.body.beforeAfterImages, null)
    if (parsedBeforeAfter) payload.beforeAfterImages = parsedBeforeAfter

    const parsedTags = parseMaybeJson(req.body.tags, null)
    if (parsedTags) payload.tags = parsedTags

    // For Project: merge new media into existing array instead of replacing
    const parsedMedia = Array.isArray(req.body.media) ? req.body.media : parseMaybeJson(req.body.media, null)
    if (parsedMedia) payload.media = parsedMedia

    const upload = await handleFileUpload(req, `hok/${Model.modelName.toLowerCase()}`)
    if (upload) {
      if (Model.modelName === 'Project') {
        const mediaItem = { type: upload.kind, url: upload.url, publicId: upload.publicId }
        // Merge: keep existing media, append new item
        const currentMedia = Array.isArray(existing.media) ? existing.media.map((m) => m.toObject ? m.toObject() : m) : []
        payload.media = [...currentMedia, mediaItem]
        if (upload.kind === 'video') {
          payload.videoUrl = upload.url
          payload.videoPublicId = upload.publicId
        } else {
          payload.coverImageUrl = upload.url
        }
      } else if (Model.modelName === 'Portfolio') {
        payload.imageUrl = upload.url
        payload.imagePublicId = upload.publicId
      } else if (Model.modelName === 'VirtualDesign') {
        payload.videoUrl = upload.url
        payload.videoPublicId = upload.publicId
      } else {
        if (upload.kind === 'video') {
          payload.videoUrl = upload.url
          payload.videoPublicId = upload.publicId
        } else {
          payload.imageUrl = upload.url
          payload.imagePublicId = upload.publicId
        }
      }
    }

    const item = await Model.findByIdAndUpdate(req.params.id, payload, { new: true })
    res.json(item)
  }),

  remove: asyncHandler(async (req, res) => {
    await Model.findByIdAndDelete(req.params.id)
    res.json({ message: `${Model.modelName} deleted` })
  }),
})

export const projectsController = crudFactory(Project)
export const portfolioController = crudFactory(Portfolio)
export const virtualDesignController = crudFactory(VirtualDesign)

export const getAbout = asyncHandler(async (req, res) => {
  const about = await About.findOne({}).sort({ createdAt: -1 })
  res.json(about)
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

  const existing = await About.findOne({})
  if (!existing) {
    const created = await About.create(payload)
    res.status(201).json(created)
    return
  }

  Object.assign(existing, payload)
  await existing.save()
  res.json(existing)
})

export const homepageFeed = asyncHandler(async (req, res) => {
  const [projects, portfolio, about] = await Promise.all([
    Project.find({ isPublished: true }).sort({ order: 1, createdAt: -1 }).limit(6),
    Portfolio.find({ isPublished: true }).sort({ order: 1, createdAt: -1 }).limit(12),
    About.findOne({}).sort({ createdAt: -1 }),
  ])

  const heroVideo = projects?.[0]?.videoUrl ? {
    url: projects[0].videoUrl,
    title: projects[0].title,
    description: projects[0].description,
  } : null

  res.json({ heroVideo, portfolio, about })
})

export const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await Analytics.find({}).sort({ date: 1 })
  res.json(analytics)
})
