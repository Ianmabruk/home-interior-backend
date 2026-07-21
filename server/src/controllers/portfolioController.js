import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { executeWithRetry } from '../config/prisma.js'
import { withId, withIdArray, sortByOrderThenDate, orderValue, toBoolean } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'

const PORTFOLIO_FIELDS = new Set([
  'title', 'description', 'category', 'imageUrl', 'galleryImages', 'beforeAfterImages', 'gallery', 'cloudinaryId', 'featured', 'displayOrder'
])

const GALLERY_FIELDS = new Set([
  'imageUrl'
])

const stripUnknown = (obj, allowed) => {
  const out = {}
  for (const key of Object.keys(obj)) {
    if (allowed.has(key)) out[key] = obj[key]
  }
  return out
}

const findFileByFieldname = (req, fieldname) => {
  if (req.file && req.file.fieldname === fieldname) return req.file
  const files = Array.isArray(req.files) ? req.files : []
  const found = files.find((f) => f.fieldname === fieldname)
  if (found) return found
  if (req.files && typeof req.files === 'object' && req.files[fieldname]) {
    const arr = req.files[fieldname]
    return Array.isArray(arr) ? arr[0] : arr
  }
  return null
}

const findFilesByFieldname = (req, fieldname) => {
  if (Array.isArray(req.files)) {
    return req.files.filter((f) => f.fieldname === fieldname)
  }
  if (req.files && typeof req.files === 'object' && req.files[fieldname]) {
    const arr = req.files[fieldname]
    return Array.isArray(arr) ? arr : [arr]
  }
  return []
}

export const portfolioController = {
  list: asyncHandler(async (req, res) => {
    try {
      const items = await executeWithRetry(
        () => prisma.portfolio.findMany({
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            imageUrl: true,
            cloudinaryId: true,
            featured: true,
            displayOrder: true,
            createdAt: true,
            updatedAt: true,
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
        return res.status(404).json({ success: false, message: 'Portfolio item not found' })
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

      if (payload.displayOrder !== undefined) payload.displayOrder = orderValue(payload.displayOrder)
      payload.featured = toBoolean(req.body.featured, false)

      // Handle gallery images
      const galleryFiles = findFilesByFieldname(req, 'gallery')
      const galleryUrls = []
      
      for (const file of galleryFiles) {
        const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/portfolio/gallery', type: 'image' })
        galleryUrls.push(upload.secure_url)
      }
      
      if (galleryUrls.length > 0) {
        payload.galleryImages = galleryUrls
      }

      const mediaFile = findFileByFieldname(req, 'media')
      if (mediaFile) {
        const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/portfolio', type: 'image' })
        payload.imageUrl = upload.secure_url
        payload.cloudinaryId = upload.public_id
      }

      if (!payload.imageUrl) {
        return res.status(400).json({ success: false, message: 'Image is required' })
      }

      const item = await prismaSafeWrite(
        (data) => prisma.portfolio.create({ data }),
        payload,
        'PORTFOLIO-CREATE'
      )
      console.log('[PORTFOLIO][CREATE] success id=', item.id, 'title=', item.title)
      res.status(201).json(sendSuccess(withId(item)))
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
  }),

  update: asyncHandler(async (req, res) => {
    try {
      const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Portfolio item not found' })
      }

      const payload = stripUnknown({ ...req.body }, PORTFOLIO_FIELDS)

      if (payload.displayOrder !== undefined) payload.displayOrder = orderValue(payload.displayOrder)
      payload.featured = toBoolean(req.body.featured, existing.featured)

      // Handle gallery images
      const galleryFiles = findFilesByFieldname(req, 'gallery')
      const galleryUrls = []
      
      for (const file of galleryFiles) {
        const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/portfolio/gallery', type: 'image' })
        galleryUrls.push(upload.secure_url)
      }
      
      if (galleryUrls.length > 0) {
        // Append new gallery images to existing ones
        const existingGallery = existing.galleryImages || []
        payload.galleryImages = [...existingGallery, ...galleryUrls]
      }

      const mediaFile = findFileByFieldname(req, 'media')
      if (mediaFile) {
        if (existing.cloudinaryId) {
          await mediaService.delete(existing.cloudinaryId, 'image')
        }
        const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/portfolio', type: 'image' })
        payload.imageUrl = upload.secure_url
        payload.cloudinaryId = upload.public_id
      }

      const item = await prismaSafeWrite(
        (data) => prisma.portfolio.update({ where: { id: req.params.id }, data }),
        payload,
        'PORTFOLIO-UPDATE'
      )
      res.json(sendSuccess(withId(item)))
    } catch (error) {
      console.error("FULL ERROR:", error)
      console.error("MESSAGE:", error.message)
      console.error("STACK:", error.stack)
      console.error("PRISMA CODE:", error.code)
      console.error("BODY:", req.body)
      console.error("PARAMS:", req.params)
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
      return res.status(400).json({ success: false, message: 'Order must be an array of {id, displayOrder}' })
    }
    const updates = order.map((item, index) =>
      prisma.portfolio.update({ where: { id: item.id }, data: { displayOrder: item.displayOrder ?? index } })
    )
    await prisma.$transaction(updates)
    res.json(sendSuccess({ message: 'Portfolio reordered' }))
  }),

  remove: asyncHandler(async (req, res) => {
    const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
    if (existing) {
      if (existing.cloudinaryId) {
        await mediaService.delete(existing.cloudinaryId, 'image')
      }
      // Delete gallery images
      if (existing.galleryImages && existing.galleryImages.length > 0) {
        for (const imageUrl of existing.galleryImages) {
          try {
            // Extract public ID from URL and delete
            const publicId = imageUrl.split('/').pop()?.split('.')[0]
            if (publicId) {
              await mediaService.delete(publicId, 'image')
            }
          } catch (e) {
            console.error('[PORTFOLIO][DELETE] gallery image delete failed:', e?.message)
          }
        }
      }
    }
    await prisma.portfolio.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Portfolio item deleted' }))
  }),

  addGalleryImages: asyncHandler(async (req, res) => {
    try {
      const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Portfolio item not found' })
      }

      const galleryFiles = findFilesByFieldname(req, 'gallery')
      const galleryUrls = []
      
      for (const file of galleryFiles) {
        const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/portfolio/gallery', type: 'image' })
        galleryUrls.push(upload.secure_url)
      }
      
      if (galleryUrls.length === 0) {
        return res.status(400).json({ success: false, message: 'No gallery images provided' })
      }

      const existingGallery = existing.galleryImages || []
      const updatedGallery = [...existingGallery, ...galleryUrls]

      const item = await prismaSafeWrite(
        (data) => prisma.portfolio.update({ where: { id: req.params.id }, data }),
        { galleryImages: updatedGallery },
        'PORTFOLIO-ADD-GALLERY'
      )
      res.json(sendSuccess(withId(item)))
    } catch (error) {
      console.error('[PORTFOLIO][ADD-GALLERY] error:', error?.message)
      res.status(500).json({ success: false, message: 'Failed to add gallery images' })
    }
  }),

  removeGalleryImage: asyncHandler(async (req, res) => {
    try {
      const { imageUrl } = req.body
      if (!imageUrl) {
        return res.status(400).json({ success: false, message: 'imageUrl is required' })
      }

      const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Portfolio item not found' })
      }

      const existingGallery = existing.galleryImages || []
      const updatedGallery = existingGallery.filter(url => url !== imageUrl)

      if (updatedGallery.length === existingGallery.length) {
        return res.status(404).json({ success: false, message: 'Image not found in gallery' })
      }

      // Try to delete from Cloudinary
      try {
        const publicId = imageUrl.split('/').pop()?.split('.')[0]
        if (publicId) {
          await mediaService.delete(publicId, 'image')
        }
      } catch (e) {
        console.error('[PORTFOLIO][REMOVE-GALLERY] Cloudinary delete failed:', e?.message)
      }

      const item = await prismaSafeWrite(
        (data) => prisma.portfolio.update({ where: { id: req.params.id }, data }),
        { galleryImages: updatedGallery },
        'PORTFOLIO-REMOVE-GALLERY'
      )
      res.json(sendSuccess(withId(item)))
    } catch (error) {
      console.error('[PORTFOLIO][REMOVE-GALLERY] error:', error?.message)
      res.status(500).json({ success: false, message: 'Failed to remove gallery image' })
    }
  }),
}