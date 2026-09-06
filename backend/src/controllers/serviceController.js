import { asyncHandler } from '../middleware/asyncHandler.js'
import { serviceService } from '../services/serviceService.js'
import { invalidateCachePattern } from '../utils/cache.js'
import { failure } from '../utils/response.js'

export const serviceController = {
  list: asyncHandler(async (req, res) => {
    const items = await serviceService.listServices()
    res.json({ success: true, data: items })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await serviceService.getService(req.params.id)
    res.json({ success: true, data: item })
  }),

  create: asyncHandler(async (req, res) => {
    const files = req.files || []
    const file = files.find((f) => f.fieldname === 'media')
    const circularFile = files.find((f) => f.fieldname === 'homepageCircularImage')
    const data = {
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      icon: req.body.icon || '',
      featured: req.body.featured === 'true' || req.body.featured === true,
      displayOrder: Number(req.body.displayOrder) || 0,
      isActive: req.body.isActive !== 'false' && req.body.isActive !== false,
      buttonText: req.body.buttonText || 'Request This Service',
      buttonUrl: req.body.buttonUrl || '',
    }
    const item = await serviceService.createService(data, file, circularFile)
    invalidateCachePattern('service')
    invalidateCachePattern('homepage')
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const files = req.files || []
    const file = files.find((f) => f.fieldname === 'media')
    const circularFile = files.find((f) => f.fieldname === 'homepageCircularImage')
    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.icon !== undefined) data.icon = req.body.icon
    if (req.body.featured !== undefined) data.featured = req.body.featured === 'true' || req.body.featured === true
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder) || 0
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true' || req.body.isActive === true
    if (req.body.buttonText !== undefined) data.buttonText = req.body.buttonText
    if (req.body.buttonUrl !== undefined) data.buttonUrl = req.body.buttonUrl
    const item = await serviceService.updateService(req.params.id, data, file, circularFile)
    invalidateCachePattern('service')
    invalidateCachePattern('homepage')
    res.json({ success: true, data: item })
  }),

  reorder: asyncHandler(async (req, res) => {
    const orderArray = req.body.order || []
    await serviceService.updateServiceOrder(orderArray)
    invalidateCachePattern('service')
    invalidateCachePattern('homepage')
    res.json({ success: true, data: { message: 'Reordered' } })
  }),

  delete: asyncHandler(async (req, res) => {
    await serviceService.deleteService(req.params.id)
    invalidateCachePattern('service')
    invalidateCachePattern('homepage')
    res.json({ success: true, data: { message: 'Deleted' } })
  }),
}
