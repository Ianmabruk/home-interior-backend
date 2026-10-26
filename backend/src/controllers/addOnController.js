import { asyncHandler } from '../middleware/asyncHandler.js'
import { addOnService } from '../services/addOnService.js'

export const addOnController = {
  list: asyncHandler(async (req, res) => {
    const items = await addOnService.listAddOnServices(req.query)
    res.json({ success: true, data: items })
  }),

  listPublic: asyncHandler(async (req, res) => {
    const items = await addOnService.listPublicAddOnServices()
    res.json({ success: true, data: items })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await addOnService.getAddOnService(req.params.id)
    res.json({ success: true, data: item })
  }),

  create: asyncHandler(async (req, res) => {
    const item = await addOnService.createAddOnService(req.body)
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const item = await addOnService.updateAddOnService(req.params.id, req.body)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await addOnService.deleteAddOnService(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),
}
