import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray } from '../utils/helpers.js'

export const getAbout = asyncHandler(async (req, res) => {
  const about = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })
  res.json(sendSuccess(about ? withId(about) : null))
})

export const upsertAbout = asyncHandler(async (req, res) => {
  const existing = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })

  const payload = {
    story: req.body.story ?? existing?.story ?? '',
    companyDescription: req.body.companyDescription ?? existing?.companyDescription ?? '',
    mission: req.body.mission ?? existing?.mission ?? '',
    vision: req.body.vision ?? existing?.vision ?? '',
    location: req.body.location ?? existing?.location ?? '',
    contactEmail: req.body.contactEmail ?? existing?.contactEmail ?? '',
    socials: req.body.socials ? (() => { try { return JSON.parse(req.body.socials) } catch { return {} } })() : (existing?.socials ?? {}),
  }

  if (req.file) {
    const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/about', type: 'image' })
    payload.aboutImageUrl = upload.secure_url
    payload.aboutImagePublicId = upload.public_id
    if (existing?.aboutImagePublicId) {
      try { await mediaService.delete(existing.aboutImagePublicId, 'image') } catch {}
    }
  }

  if (!existing) {
    const created = await prisma.about.create({ data: payload })
    return res.status(201).json(sendSuccess(withId(created)))
  }

  const updated = await prisma.about.update({ where: { id: existing.id }, data: payload })
  res.json(sendSuccess(withId(updated)))
})

export const homepageFeed = asyncHandler(async (req, res) => {
  const [portfolio, virtualDesigns, services, about, hero, testimonials] = await Promise.all([
    prisma.portfolio.findMany({ where: { published: true }, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] }),
    prisma.virtualDesign.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.service.findMany({ where: { isActive: true }, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] }),
    prisma.about.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.hero.findMany({ orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] }),
    prisma.testimonial.findMany({ where: { isActive: true }, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }], take: 10 }),
  ])

  const sortByOrderThenDate = (items) => [...items].sort((a, b) => {
    const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0)
    if (orderDiff !== 0) return orderDiff
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  const sortedPortfolio = sortByOrderThenDate(portfolio)
  const sortedVirtualDesigns = [...virtualDesigns].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const sortedServices = sortByOrderThenDate(services)
  const sortedTestimonials = sortByOrderThenDate(testimonials)

  const featuredPortfolio = sortedPortfolio.filter((item) => item.featured).slice(0, 3)
  const featuredVirtualDesigns = sortedVirtualDesigns.filter((item) => item.featured).slice(0, 3)
  const featuredProject = featuredPortfolio.length > 0 ? featuredPortfolio[0] : (sortedPortfolio.length > 0 ? sortedPortfolio[0] : null)

  const heroImages = hero.map((item) => ({ ...withId(item), url: item.imageUrl, imageUrl: item.imageUrl }))

  res.json(sendSuccess({
    portfolio: withIdArray(sortedPortfolio),
    virtualDesigns: withIdArray(sortedVirtualDesigns),
    virtualInteriorDesign: withIdArray(sortedVirtualDesigns),
    services: withIdArray(sortedServices),
    about: withId(about),
    testimonials: withIdArray(sortedTestimonials),
    featuredPortfolio: withIdArray(featuredPortfolio),
    featuredVirtualDesigns: withIdArray(featuredVirtualDesigns),
    heroImages,
    heroMedia: withIdArray(hero),
    featuredProject: featuredProject ? withId(featuredProject) : null,
  }))
})

export const uploadMediaController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' })
  }
  const folder = typeof req.body.folder === 'string' && req.body.folder.trim() ? req.body.folder.trim() : 'hok/uploads'
  const kind = req.body.resourceType === 'video' ? 'video' : 'image'
  const result = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder, type: kind })
  res.status(200).json(sendSuccess({
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: kind,
  }))
})

export const deleteMediaController = asyncHandler(async (req, res) => {
  const { publicId, resourceType } = req.body
  if (!publicId) {
    return res.status(400).json({ message: 'publicId is required' })
  }
  const result = await mediaService.delete(publicId, resourceType === 'video' ? 'video' : 'image')
  res.json(sendSuccess({ result: result?.result || 'ok' }))
})
