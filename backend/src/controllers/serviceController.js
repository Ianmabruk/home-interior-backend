import { asyncHandler } from '../middleware/asyncHandler.js'
import { serviceService } from '../services/serviceService.js'
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
    const file = req.file
    const data = {
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      icon: req.body.icon || '',
      featured: req.body.featured === 'true' || req.body.featured === true,
      displayOrder: Number(req.body.displayOrder) || 0,
      isActive: req.body.isActive !== 'false' && req.body.isActive !== false,
    }
    const item = await serviceService.createService(data, file)
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const file = req.file
    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.icon !== undefined) data.icon = req.body.icon
    if (req.body.featured !== undefined) data.featured = req.body.featured === 'true' || req.body.featured === true
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder) || 0
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true' || req.body.isActive === true
    const item = await serviceService.updateService(req.params.id, data, file)
    res.json({ success: true, data: item })
  }),

  reorder: asyncHandler(async (req, res) => {
    const orderArray = req.body.order || []
    await serviceService.updateServiceOrder(orderArray)
    res.json({ success: true, data: { message: 'Reordered' } })
  }),

  delete: asyncHandler(async (req, res) => {
    await serviceService.deleteService(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),
}
