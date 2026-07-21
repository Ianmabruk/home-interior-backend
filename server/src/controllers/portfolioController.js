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

export const portfolioController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.portfolio.findMany({
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
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    res.json(sendSuccess(withIdArray(items)))
  }),

  get: asyncHandler(async (req, res) => {
    const item = await prisma.portfolio.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        imageUrl: true,
        mediaUrls: true,
        cloudinaryId: true,
        featured: true,
        displayOrder: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    if (!item) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' })
    }
    res.json(sendSuccess(withId(item)))
  }),

  create: asyncHandler(async (req, res) => {
    const data = {
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      category: req.body.category || 'General',
      featured: req.body.featured === 'true' || req.body.featured === true,
      displayOrder: Number(req.body.displayOrder) || 0,
      published: req.body.published !== 'false' && req.body.published !== false,
    }

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/portfolio', type: 'image' })
      data.imageUrl = upload.secure_url
      data.cloudinaryId = upload.public_id
    }

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    const mediaUrls = []
    for (const file of galleryFiles) {
      const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/portfolio', type: 'image' })
      mediaUrls.push(upload.secure_url)
    }
    if (mediaUrls.length > 0) {
      data.mediaUrls = mediaUrls
    }

    const bodyMediaUrls = req.body.mediaUrls
    if (Array.isArray(bodyMediaUrls) && bodyMediaUrls.length > 0) {
      data.mediaUrls = bodyMediaUrls
    }

    if (!data.imageUrl && !req.body.imageUrl) {
      return res.status(400).json({ success: false, message: 'Image is required' })
    }

    const item = await prisma.portfolio.create({ data })
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' })
    }

    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.category !== undefined) data.category = req.body.category
    if (req.body.featured !== undefined) data.featured = req.body.featured === 'true' || req.body.featured === true
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder) || 0
    if (req.body.published !== undefined) data.published = req.body.published === 'true' || req.body.published === true

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      if (existing.cloudinaryId) {
        try { await mediaService.delete(existing.cloudinaryId, 'image') } catch {}
      }
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/portfolio', type: 'image' })
      data.imageUrl = upload.secure_url
      data.cloudinaryId = upload.public_id
    }

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    if (galleryFiles.length > 0) {
      const mediaUrls = []
      for (const file of galleryFiles) {
        const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/portfolio', type: 'image' })
        mediaUrls.push(upload.secure_url)
      }
      data.mediaUrls = mediaUrls
    }

    const bodyMediaUrls = req.body.mediaUrls
    if (Array.isArray(bodyMediaUrls)) {
      data.mediaUrls = bodyMediaUrls
    }

    const item = await prisma.portfolio.update({ where: { id: req.params.id }, data })
    res.json(sendSuccess(withId(item)))
  }),

  reorder: asyncHandler(async (req, res) => {
    const { order } = req.body
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Order must be an array of {id, displayOrder}' })
    }
    const updates = order.map((item) =>
      prisma.portfolio.update({ where: { id: item.id }, data: { displayOrder: item.displayOrder ?? 0 } })
    )
    await prisma.$transaction(updates)
    res.json(sendSuccess({ message: 'Portfolio reordered' }))
  }),

  remove: asyncHandler(async (req, res) => {
    const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } })
    if (existing) {
      if (existing.cloudinaryId) {
        try { await mediaService.delete(existing.cloudinaryId, 'image') } catch {}
      }
      if (Array.isArray(existing.mediaUrls)) {
        for (const url of existing.mediaUrls) {
          try {
            const publicId = url.split('/').pop()?.split('.')[0]
            if (publicId) await mediaService.delete(publicId, 'image')
          } catch {}
        }
      }
    }
    await prisma.portfolio.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Portfolio item deleted' }))
  }),
}
