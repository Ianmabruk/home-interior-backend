import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray } from '../utils/helpers.js'

export const serviceController = {
  list: asyncHandler(async (req, res) => {
    const items = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        imageUrl: true,
        cloudinaryId: true,
        featured: true,
        displayOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    res.json(sendSuccess(withIdArray(items)))
  }),

  get: asyncHandler(async (req, res) => {
    const item = await prisma.service.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        imageUrl: true,
        cloudinaryId: true,
        featured: true,
        displayOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    if (!item) {
      return res.status(404).json({ success: false, message: 'Service not found' })
    }
    res.json(sendSuccess(withId(item)))
  }),

  create: asyncHandler(async (req, res) => {
    const data = {
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      icon: req.body.icon || 'LayoutGrid',
      featured: req.body.featured === 'true' || req.body.featured === true,
      displayOrder: Number(req.body.displayOrder) || 0,
      isActive: req.body.isActive !== 'false' && req.body.isActive !== false,
    }

    if (req.file) {
      const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/services', type: 'image' })
      data.imageUrl = upload.secure_url
      data.cloudinaryId = upload.public_id
    }

    const item = await prisma.service.create({ data })
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found' })
    }

    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.icon !== undefined) data.icon = req.body.icon
    if (req.body.featured !== undefined) data.featured = req.body.featured === 'true' || req.body.featured === true
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder) || 0
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true' || req.body.isActive === true

    if (req.file) {
      if (existing.cloudinaryId) {
        try { await mediaService.delete(existing.cloudinaryId, 'image') } catch {}
      }
      const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/services', type: 'image' })
      data.imageUrl = upload.secure_url
      data.cloudinaryId = upload.public_id
    }

    const item = await prisma.service.update({ where: { id: req.params.id }, data })
    res.json(sendSuccess(withId(item)))
  }),

  reorder: asyncHandler(async (req, res) => {
    const { order } = req.body
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Order must be an array of {id, displayOrder}' })
    }
    const updates = order.map((item) =>
      prisma.service.update({ where: { id: item.id }, data: { displayOrder: item.displayOrder ?? 0 } })
    )
    await prisma.$transaction(updates)
    res.json(sendSuccess({ message: 'Services reordered' }))
  }),

  remove: asyncHandler(async (req, res) => {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } })
    if (existing) {
      if (existing.cloudinaryId) {
        try { await mediaService.delete(existing.cloudinaryId, 'image') } catch {}
      }
    }
    await prisma.service.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Service deleted' }))
  }),
}
