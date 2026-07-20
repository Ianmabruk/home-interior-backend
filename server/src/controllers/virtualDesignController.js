import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { uploadImage, uploadVideo, deleteMedia } from '../services/uploadService.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { executeWithRetry } from '../config/prisma.js'
import { withId, withIdArray, sortByOrderThenDate, orderValue, toBoolean } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'

const VIRTUAL_DESIGN_FIELDS = new Set([
  'title', 'description', 'mediaType', 'mediaUrl', 'galleryMedia', 'cloudinaryId', 'featured'
])

const stripUnknown = (obj, allowed) => {
  const out = {}
  for (const key of Object.keys(obj)) {
    if (allowed.has(key)) out[key] = obj[key]
  }
  return out
}

const findFileByFieldname = (req, fieldname) => {
  const files = Array.isArray(req.files) ? req.files : []
  return files.find((f) => f.fieldname === fieldname) || null
}

export const virtualDesignController = {
  list: asyncHandler(async (req, res) => {
    try {
      const items = await executeWithRetry(
        () => prisma.virtualDesign.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            mediaType: true,
            mediaUrl: true,
            cloudinaryId: true,
            featured: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        'VIRTUAL-DESIGN-LIST',
        { maxRetries: 2, timeout: 8000 }
      )
      res.json(sendSuccess(withIdArray(items)))
    } catch (error) {
      console.error('[VIRTUAL-DESIGN][LIST] db query failed:', error?.message)
      res.json(sendSuccess([]))
    }
  }),

  get: asyncHandler(async (req, res) => {
    try {
      const item = await executeWithRetry(
        () => prisma.virtualDesign.findUnique({ where: { id: req.params.id } }),
        'VIRTUAL-DESIGN-GET',
        { maxRetries: 2, timeout: 5000 }
      )
      if (!item) {
        return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
      }
      res.json(sendSuccess(withId(item)))
    } catch (error) {
      console.error('[VIRTUAL-DESIGN][GET] error:', error?.message)
      res.status(500).json({ success: false, message: 'Failed to fetch virtual design item' })
    }
  }),

  create: asyncHandler(async (req, res) => {
    try {
      console.log('[VIRTUAL-DESIGN][CREATE] request fields:', Object.keys(req.body))
      const payload = stripUnknown({ ...req.body }, VIRTUAL_DESIGN_FIELDS)

      payload.featured = toBoolean(req.body.featured, false)

      // Determine media type from file or body
      const isVideo = req.body.mediaType === 'video' || req.body.resourceType === 'video'
      
      const mediaFile = findFileByFieldname(req, 'media')
      if (mediaFile) {
        const upload = isVideo
          ? await uploadVideo(mediaFile.buffer, 'hok/virtual-design', mediaFile.mimetype)
          : await uploadImage(mediaFile.buffer, 'hok/virtual-design', mediaFile.mimetype)
        payload.mediaUrl = upload.secure_url
        payload.cloudinaryId = upload.public_id
        payload.mediaType = isVideo ? 'video' : 'image'
      }

      // Handle gallery media
      const galleryFiles = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'gallery') : []
      const galleryUrls = []
      
      for (const file of galleryFiles) {
        const isVideoFile = file.mimetype.startsWith('video/')
        const upload = isVideoFile
          ? await uploadVideo(file.buffer, 'hok/virtual-design/gallery', file.mimetype)
          : await uploadImage(file.buffer, 'hok/virtual-design/gallery', file.mimetype)
        galleryUrls.push({ url: upload.secure_url, type: isVideoFile ? 'video' : 'image' })
      }
      
      if (galleryUrls.length > 0) {
        payload.galleryMedia = galleryUrls
      }

      if (!payload.mediaUrl) {
        return res.status(400).json({ success: false, message: 'Media (image or video) is required' })
      }

      if (!payload.mediaType) {
        payload.mediaType = isVideo ? 'video' : 'image'
      }

      const item = await prismaSafeWrite(
        (data) => prisma.virtualDesign.create({ data }),
        payload,
        'VIRTUAL-DESIGN-CREATE'
      )
      console.log('[VIRTUAL-DESIGN][CREATE] success id=', item.id, 'title=', item.title)
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
      const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
      }

      const payload = stripUnknown({ ...req.body }, VIRTUAL_DESIGN_FIELDS)

      payload.featured = toBoolean(req.body.featured, existing.featured)

      const isVideo = req.body.mediaType === 'video' || req.body.resourceType === 'video'
      
      const mediaFile = findFileByFieldname(req, 'media')
      if (mediaFile) {
        if (existing.cloudinaryId) {
          await deleteMedia(existing.cloudinaryId, existing.mediaType === 'video' ? 'video' : 'image')
        }
        const upload = isVideo
          ? await uploadVideo(mediaFile.buffer, 'hok/virtual-design', mediaFile.mimetype)
          : await uploadImage(mediaFile.buffer, 'hok/virtual-design', mediaFile.mimetype)
        payload.mediaUrl = upload.secure_url
        payload.cloudinaryId = upload.public_id
        payload.mediaType = isVideo ? 'video' : 'image'
      }

      // Handle gallery media
      const galleryFiles = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'gallery') : []
      const galleryUrls = []
      
      for (const file of galleryFiles) {
        const isVideoFile = file.mimetype.startsWith('video/')
        const upload = isVideoFile
          ? await uploadVideo(file.buffer, 'hok/virtual-design/gallery', file.mimetype)
          : await uploadImage(file.buffer, 'hok/virtual-design/gallery', file.mimetype)
        galleryUrls.push({ url: upload.secure_url, type: isVideoFile ? 'video' : 'image' })
      }
      
      if (galleryUrls.length > 0) {
        const existingGallery = existing.galleryMedia || []
        payload.galleryMedia = [...existingGallery, ...galleryUrls]
      }

      const item = await prismaSafeWrite(
        (data) => prisma.virtualDesign.update({ where: { id: req.params.id }, data }),
        payload,
        'VIRTUAL-DESIGN-UPDATE'
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

  remove: asyncHandler(async (req, res) => {
    const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
    }

    if (existing.cloudinaryId) {
      await deleteMedia(existing.cloudinaryId, existing.mediaType === 'video' ? 'video' : 'image')
    }
    // Delete gallery media
    if (existing.galleryMedia && existing.galleryMedia.length > 0) {
      for (const media of existing.galleryMedia) {
        try {
          const publicId = media.url.split('/').pop()?.split('.')[0]
          if (publicId) {
            await deleteMedia(publicId, media.type === 'video' ? 'video' : 'image')
          }
        } catch (e) {
          console.error('[VIRTUAL-DESIGN][DELETE] gallery media delete failed:', e?.message)
        }
      }
    }

    try {
      await prisma.virtualDesign.delete({ where: { id: req.params.id } })
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
      }
      throw error
    }
    res.json(sendSuccess({ message: 'Virtual Design item deleted' }))
  }),

  addGalleryMedia: asyncHandler(async (req, res) => {
    try {
      const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
      }

      const galleryFiles = Array.isArray(req.files) ? req.files : []
      const galleryUrls = []
      
      for (const file of galleryFiles) {
        const isVideoFile = file.mimetype.startsWith('video/')
        const upload = isVideoFile
          ? await uploadVideo(file.buffer, 'hok/virtual-design/gallery', file.mimetype)
          : await uploadImage(file.buffer, 'hok/virtual-design/gallery', file.mimetype)
        galleryUrls.push({ url: upload.secure_url, type: isVideoFile ? 'video' : 'image' })
      }
      
      if (galleryUrls.length === 0) {
        return res.status(400).json({ success: false, message: 'No gallery media provided' })
      }

      const existingGallery = existing.galleryMedia || []
      const updatedGallery = [...existingGallery, ...galleryUrls]

      const item = await prismaSafeWrite(
        (data) => prisma.virtualDesign.update({ where: { id: req.params.id }, data }),
        { galleryMedia: updatedGallery },
        'VIRTUAL-DESIGN-ADD-GALLERY'
      )
      res.json(sendSuccess(withId(item)))
    } catch (error) {
      console.error('[VIRTUAL-DESIGN][ADD-GALLERY] error:', error?.message)
      res.status(500).json({ success: false, message: 'Failed to add gallery media' })
    }
  }),

  removeGalleryMedia: asyncHandler(async (req, res) => {
    try {
      const { mediaUrl } = req.body
      if (!mediaUrl) {
        return res.status(400).json({ success: false, message: 'mediaUrl is required' })
      }

      const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
      }

      const existingGallery = existing.galleryMedia || []
      const updatedGallery = existingGallery.filter(media => media.url !== mediaUrl)

      if (updatedGallery.length === existingGallery.length) {
        return res.status(404).json({ success: false, message: 'Media not found in gallery' })
      }

      // Try to delete from Cloudinary
      try {
        const publicId = mediaUrl.split('/').pop()?.split('.')[0]
        if (publicId) {
          // Find the media type from the gallery
          const media = existingGallery.find(m => m.url === mediaUrl)
          await deleteMedia(publicId, media?.type === 'video' ? 'video' : 'image')
        }
      } catch (e) {
        console.error('[VIRTUAL-DESIGN][REMOVE-GALLERY] Cloudinary delete failed:', e?.message)
      }

      const item = await prismaSafeWrite(
        (data) => prisma.virtualDesign.update({ where: { id: req.params.id }, data }),
        { galleryMedia: updatedGallery },
        'VIRTUAL-DESIGN-REMOVE-GALLERY'
      )
      res.json(sendSuccess(withId(item)))
    } catch (error) {
      console.error('[VIRTUAL-DESIGN][REMOVE-GALLERY] error:', error?.message)
      res.status(500).json({ success: false, message: 'Failed to remove gallery media' })
    }
  }),
}