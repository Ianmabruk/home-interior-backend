import { asyncHandler } from '../middleware/asyncHandler.js'
import { heroMediaService } from '../services/heroMediaService.js'
import { failure } from '../utils/response.js'

export const heroMediaController = {
  list: asyncHandler(async (req, res) => {
    const items = await heroMediaService.listHeroMedia()
    res.json({ success: true, data: items })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await heroMediaService.getHeroMedia(req.params.id)
    res.json({ success: true, data: item })
  }),

  create: asyncHandler(async (req, res) => {
    const file = req.file
    const data = {
      title: req.body.title || 'Untitled',
      subtitle: req.body.subtitle || '',
      isActive: req.body.isActive !== 'false' && req.body.isActive !== false,
      displayOrder: Number(req.body.displayOrder) || 0,
      mediaUrls: req.body.mediaUrls || [],
    }
    const item = await heroMediaService.createHeroMedia(data, file)
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const file = req.file
    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.subtitle !== undefined) data.subtitle = req.body.subtitle
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true' || req.body.isActive === true
    if (req.body.mediaUrls !== undefined) data.mediaUrls = Array.isArray(req.body.mediaUrls) ? req.body.mediaUrls : []
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder) || 0
    const item = await heroMediaService.updateHeroMedia(req.params.id, data, file)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await heroMediaService.deleteHeroMedia(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),
}
