import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray } from '../utils/helpers.js'

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

export const virtualDesignController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.virtualDesign.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        mediaUrl: true,
        mediaType: true,
        mediaUrls: true,
        cloudinaryId: true,
        featured: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    res.json(sendSuccess(withIdArray(items)))
  }),

  get: asyncHandler(async (req, res) => {
    const item = await prisma.virtualDesign.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        mediaUrl: true,
        mediaType: true,
        mediaUrls: true,
        cloudinaryId: true,
        featured: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    if (!item) {
      return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
    }
    res.json(sendSuccess(withId(item)))
  }),

  create: asyncHandler(async (req, res) => {
    const data = {
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      category: req.body.category || 'General',
      featured: req.body.featured === 'true' || req.body.featured === true,
    }

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      const isVideo = mediaFile.mimetype.startsWith('video/')
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/virtual-design', type: isVideo ? 'video' : 'image' })
      data.mediaUrl = upload.secure_url
      data.cloudinaryId = upload.public_id
      data.mediaType = isVideo ? 'video' : 'image'
    } else if (req.body.mediaUrl) {
      data.mediaUrl = req.body.mediaUrl
      data.mediaType = req.body.mediaType || 'image'
    }

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    const mediaUrls = []
    for (const file of galleryFiles) {
      const isVideoFile = file.mimetype.startsWith('video/')
      const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/virtual-design', type: isVideoFile ? 'video' : 'image' })
      mediaUrls.push({ url: upload.secure_url, type: isVideoFile ? 'video' : 'image' })
    }
    if (mediaUrls.length > 0) {
      data.mediaUrls = mediaUrls
    }

    const bodyMediaUrls = req.body.mediaUrls
    if (Array.isArray(bodyMediaUrls) && bodyMediaUrls.length > 0) {
      data.mediaUrls = bodyMediaUrls
    }

    if (!data.mediaUrl) {
      data.mediaUrl = 'https://via.placeholder.com/800x600?text=No+Image'
      data.mediaType = 'image'
    }

    const item = await prisma.virtualDesign.create({ data })
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
    }

    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.category !== undefined) data.category = req.body.category
    if (req.body.featured !== undefined) data.featured = req.body.featured === 'true' || req.body.featured === true

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      if (existing.cloudinaryId) {
        try { await mediaService.delete(existing.cloudinaryId, existing.mediaType === 'video' ? 'video' : 'image') } catch {}
      }
      const isVideo = mediaFile.mimetype.startsWith('video/')
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/virtual-design', type: isVideo ? 'video' : 'image' })
      data.mediaUrl = upload.secure_url
      data.cloudinaryId = upload.public_id
      data.mediaType = isVideo ? 'video' : 'image'
    }

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    if (galleryFiles.length > 0) {
      const mediaUrls = []
      for (const file of galleryFiles) {
        const isVideoFile = file.mimetype.startsWith('video/')
        const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/virtual-design', type: isVideoFile ? 'video' : 'image' })
        mediaUrls.push({ url: upload.secure_url, type: isVideoFile ? 'video' : 'image' })
      }
      data.mediaUrls = [...(existing.mediaUrls || []), ...mediaUrls]
    }

    const bodyMediaUrls = req.body.mediaUrls
    if (Array.isArray(bodyMediaUrls)) {
      data.mediaUrls = bodyMediaUrls
    }

    const item = await prisma.virtualDesign.update({ where: { id: req.params.id }, data })
    res.json(sendSuccess(withId(item)))
  }),

  remove: asyncHandler(async (req, res) => {
    const existing = await prisma.virtualDesign.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
    }

    if (existing.cloudinaryId) {
      try { await mediaService.delete(existing.cloudinaryId, existing.mediaType === 'video' ? 'video' : 'image') } catch {}
    }
    if (Array.isArray(existing.mediaUrls)) {
      for (const media of existing.mediaUrls) {
        try {
          const publicId = media.url?.split('/').pop()?.split('.')[0]
          if (publicId) {
            await mediaService.delete(publicId, media.type === 'video' ? 'video' : 'image')
          }
        } catch {}
      }
    }

    await prisma.virtualDesign.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Virtual Design item deleted' }))
  }),
}
