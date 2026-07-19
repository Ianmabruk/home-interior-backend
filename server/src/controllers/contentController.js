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
  const orderDiff = (a.displayOrder || a.order || 0) - (b.displayOrder || b.order || 0)
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
  let portfolio = []
  let virtualDesigns = []
  let about = null
  let testimonials = []
  let services = []
  let heroImages = []
  let featuredProject = null

  try {
    portfolio = await executeWithRetry(
      () => prisma.portfolio.findMany({
        orderBy: { displayOrder: 'asc' },
        take: 12,
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          cloudinaryId: true,
          featured: true,
          displayOrder: true,
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
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          description: true,
          mediaType: true,
          mediaUrl: true,
          cloudinaryId: true,
          featured: true,
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
    services = await executeWithRetry(
      () => prisma.service.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        take: 8,
        select: {
          id: true,
          title: true,
          description: true,
          icon: true,
          imageUrl: true,
          cloudinaryId: true,
          mediaSettings: true,
          featured: true,
          displayOrder: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      'HOMEPAGE-SERVICES',
      { maxRetries: 2, timeout: 8000 }
    )
  } catch (err) {
    console.error('[HOMEPAGE] services query failed:', err?.message)
    services = []
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
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        take: 10,
        select: {
          id: true,
          clientName: true,
          position: true,
          company: true,
          testimonial: true,
          photoUrl: true,
          rating: true,
          displayOrder: true,
        },
      }),
      'HOMEPAGE-TESTIMONIALS',
      { maxRetries: 2, timeout: 5000 }
    )
  } catch (err) {
    console.error('[HOMEPAGE] testimonials query failed:', err?.message)
    testimonials = []
  }

  try {
    const homepageContent = await executeWithRetry(
      () => prisma.homepageContent.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          heroImages: true,
          title: true,
          subtitle: true,
        },
      }),
      'HOMEPAGE-CONTENT',
      { maxRetries: 2, timeout: 5000 }
    )
    if (homepageContent) {
      heroImages = homepageContent.heroImages || []
    }
  } catch (err) {
    console.error('[HOMEPAGE] heroImages query failed:', err?.message)
    heroImages = []
  }

  // Featured Project Priority:
  // 1. Explicit Featured Project (from portfolio with featured: true)
  // 2. Most Recent Portfolio Project
  // 3. First Available Portfolio Project
  const sortedPortfolio = sortByOrderThenDate(portfolio || []).slice(0, 12)
  const featuredPortfolio = sortedPortfolio.filter(item => item.featured).slice(0, 3)

  if (featuredPortfolio.length > 0) {
    featuredProject = featuredPortfolio[0]
  } else if (sortedPortfolio.length > 0) {
    featuredProject = sortedPortfolio[0]
  }

  const sortedVirtualDesigns = sortByOrderThenDate(virtualDesigns || []).slice(0, 12)
  const sortedServices = sortByOrderThenDate(services || []).slice(0, 8)
  const sortedTestimonials = sortByOrderThenDate(testimonials || []).slice(0, 10)

  const featuredVirtualDesigns = sortedVirtualDesigns.filter(item => item.featured).slice(0, 3)

  console.log('[HOMEPAGE DEBUG]', {
    portfolioCount: sortedPortfolio.length,
    featuredPortfolioCount: featuredPortfolio.length,
    virtualDesignCount: sortedVirtualDesigns.length,
    featuredVirtualDesignCount: featuredVirtualDesigns.length,
    servicesCount: sortedServices.length,
    testimonialCount: sortedTestimonials.length,
    aboutFound: about ? true : false,
    heroImagesCount: heroImages.length,
    featuredProject: featuredProject ? featuredProject.title : 'missing',
  })

  res.json(sendSuccess({
    portfolio: withIdArray(sortedPortfolio),
    virtualInteriorDesign: withIdArray(sortedVirtualDesigns),
    services: withIdArray(sortedServices),
    about: withId(about),
    testimonials: withIdArray(sortedTestimonials),
    featuredPortfolio: withIdArray(featuredPortfolio),
    featuredVirtualDesigns: withIdArray(featuredVirtualDesigns),
    heroImages: heroImages,
    featuredProject: featuredProject ? withId(featuredProject) : null,
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

export const deleteMediaController = asyncHandler(async (req, res) => {
  const { publicId, resourceType } = req.body
  if (!publicId) {
    return res.status(400).json({ message: 'publicId is required' })
  }
  const result = await deleteMedia(publicId, resourceType === 'video' ? 'video' : 'image')
  res.json(sendSuccess({ result: result?.result || 'ok' }))
})

export const upsertHomepageContent = asyncHandler(async (req, res) => {
  try {
    const payload = {}

    if (req.body.title !== undefined) payload.title = req.body.title
    if (req.body.subtitle !== undefined) payload.subtitle = req.body.subtitle

    const uploadedImages = []
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const upload = await uploadImage(file.buffer, 'hok/homepage/hero', file.mimetype)
        uploadedImages.push(upload.secure_url)
      }
    }

    if (uploadedImages.length > 0) {
      payload.heroImages = uploadedImages
    }

    const existing = await executeWithRetry(
      () => prisma.homepageContent.findFirst({ orderBy: { createdAt: 'desc' } }),
      'HOMEPAGE-CONTENT-FIND',
      { maxRetries: 2, timeout: 5000 }
    )

    if (!existing) {
      const created = await prismaSafeWrite(
        (data) => prisma.homepageContent.create({ data }),
        payload,
        'HOMEPAGE-CONTENT-CREATE'
      )
      return res.status(201).json(sendSuccess(withId(created)))
    }

    if (payload.heroImages && existing.heroImages) {
      const toDelete = existing.heroImages.filter(url => !payload.heroImages.includes(url))
      for (const url of toDelete) {
        try {
          const publicId = url.split('/').pop()?.split('.')[0]
          if (publicId) {
            await deleteMedia(publicId, 'image')
          }
        } catch (e) {
          console.error('[HOMEPAGE] delete old hero image failed:', e?.message)
        }
      }
    }

    const updated = await prismaSafeWrite(
      (data) => prisma.homepageContent.update({ where: { id: existing.id }, data }),
      payload,
      'HOMEPAGE-CONTENT-UPDATE'
    )
    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("FILES:", req.files)
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
})

export const deleteHeroImagesController = asyncHandler(async (req, res) => {
  try {
    const { heroImages } = req.body
    if (!Array.isArray(heroImages) || heroImages.length === 0) {
      return res.status(400).json({ success: false, message: 'heroImages array is required' })
    }

    const existing = await executeWithRetry(
      () => prisma.homepageContent.findFirst({ orderBy: { createdAt: 'desc' } }),
      'HOMEPAGE-CONTENT-FIND',
      { maxRetries: 2, timeout: 5000 }
    )

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Homepage content not found' })
    }

    // Delete from Cloudinary
    for (const url of heroImages) {
      try {
        const publicId = url.split('/').pop()?.split('.')[0]
        if (publicId) {
          await deleteMedia(publicId, 'image')
        }
      } catch (e) {
        console.error('[HOMEPAGE] delete hero image failed:', e?.message)
      }
    }

    // Remove from database
    const updatedHeroImages = existing.heroImages.filter(url => !heroImages.includes(url))
    
    const updated = await prismaSafeWrite(
      (data) => prisma.homepageContent.update({ where: { id: existing.id }, data }),
      { heroImages: updatedHeroImages },
      'HOMEPAGE-CONTENT-DELETE-HERO'
    )
    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
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
})