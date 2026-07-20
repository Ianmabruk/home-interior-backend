import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { uploadImage, deleteMedia } from '../services/uploadService.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { executeWithRetry } from '../config/prisma.js'
import { withId, withIdArray, sortByOrderThenDate, orderValue, toBoolean } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'

const SERVICE_FIELDS = new Set([
  'title', 'description', 'icon', 'imageUrl', 'cloudinaryId', 'mediaSettings',
  'featured', 'displayOrder', 'isActive'
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

export const serviceController = {
  list: asyncHandler(async (req, res) => {
    try {
      const items = await executeWithRetry(
        () => prisma.service.findMany({
          where: { isActive: true },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
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
        'SERVICE-LIST',
        { maxRetries: 2, timeout: 8000 }
      )
      res.json(sendSuccess(withIdArray(sortByOrderThenDate(items))))
    } catch (error) {
      console.error('[SERVICE][LIST] db query failed:', error?.message)
      res.json(sendSuccess([]))
    }
  }),

  listAdmin: asyncHandler(async (req, res) => {
    try {
      const items = await executeWithRetry(
        () => prisma.service.findMany({
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
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
        'SERVICE-LIST-ADMIN',
        { maxRetries: 2, timeout: 8000 }
      )
      res.json(sendSuccess(withIdArray(sortByOrderThenDate(items))))
    } catch (error) {
      console.error('[SERVICE][LIST-ADMIN] db query failed:', error?.message)
      res.json(sendSuccess([]))
    }
  }),

  get: asyncHandler(async (req, res) => {
    try {
      const item = await executeWithRetry(
        () => prisma.service.findUnique({ where: { id: req.params.id } }),
        'SERVICE-GET',
        { maxRetries: 2, timeout: 5000 }
      )
      if (!item) {
        return res.status(404).json({ success: false, message: 'Service not found' })
      }
      res.json(sendSuccess(withId(item)))
    } catch (error) {
      console.error('[SERVICE][GET] error:', error?.message)
      res.status(500).json({ success: false, message: 'Failed to fetch service' })
    }
  }),

  create: asyncHandler(async (req, res) => {
    try {
      console.log('[SERVICE][CREATE] request fields:', Object.keys(req.body))
      const payload = stripUnknown({ ...req.body }, SERVICE_FIELDS)

      if (payload.displayOrder !== undefined) payload.displayOrder = orderValue(payload.displayOrder)
      payload.featured = toBoolean(req.body.featured, false)
      payload.isActive = toBoolean(req.body.isActive, true)

      const mediaFile = findFileByFieldname(req, 'media')
      if (mediaFile) {
        const upload = await uploadImage(mediaFile.buffer, 'hok/services', mediaFile.mimetype)
        payload.imageUrl = upload.secure_url
        payload.cloudinaryId = upload.public_id
      }

      const item = await prismaSafeWrite(
        (data) => prisma.service.create({ data }),
        payload,
        'SERVICE-CREATE'
      )
      console.log('[SERVICE][CREATE] success id=', item.id, 'title=', item.title)
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
      const existing = await prisma.service.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Service not found' })
      }

      const payload = stripUnknown({ ...req.body }, SERVICE_FIELDS)

      if (payload.displayOrder !== undefined) payload.displayOrder = orderValue(payload.displayOrder)
      payload.featured = toBoolean(req.body.featured, existing.featured)
      payload.isActive = toBoolean(req.body.isActive, existing.isActive)

      const mediaFile = findFileByFieldname(req, 'media')
      if (mediaFile) {
        if (existing.cloudinaryId) {
          await deleteMedia(existing.cloudinaryId, 'image')
        }
        const upload = await uploadImage(mediaFile.buffer, 'hok/services', mediaFile.mimetype)
        payload.imageUrl = upload.secure_url
        payload.cloudinaryId = upload.public_id
      }

      const item = await prismaSafeWrite(
        (data) => prisma.service.update({ where: { id: req.params.id }, data }),
        payload,
        'SERVICE-UPDATE'
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
      prisma.service.update({ where: { id: item.id }, data: { displayOrder: item.displayOrder ?? index } })
    )
    await prisma.$transaction(updates)
    res.json(sendSuccess({ message: 'Services reordered' }))
  }),

  remove: asyncHandler(async (req, res) => {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } })
    if (existing) {
      if (existing.cloudinaryId) {
        await deleteMedia(existing.cloudinaryId, 'image')
      }
    }
    await prisma.service.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Service deleted' }))
  }),
}