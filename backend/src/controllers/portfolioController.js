import { asyncHandler } from '../middleware/asyncHandler.js'
import { portfolioService } from '../services/portfolioService.js'
import { failure } from '../utils/response.js'

export const portfolioController = {
  list: asyncHandler(async (req, res) => {
    const { sort } = req.query
    const items = await portfolioService.listPortfolio({ sort })
    res.json({ success: true, data: items })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await portfolioService.getPortfolio(req.params.id)
    res.json({ success: true, data: item })
  }),

  create: asyncHandler(async (req, res) => {
    const file = req.file
    if (!file && !req.body.imageUrl) {
      return res.status(400).json({ success: false, message: 'Image is required' })
    }
    const data = {
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      category: req.body.category || 'General',
      featured: req.body.featured === 'true' || req.body.featured === true,
      displayOrder: Number(req.body.displayOrder) || 0,
      published: req.body.published !== 'false' && req.body.published !== false,
    }
    if (req.body.mediaUrls && Array.isArray(req.body.mediaUrls)) data.mediaUrls = req.body.mediaUrls
    const item = await portfolioService.createPortfolio(data, file)
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const file = req.file
    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.category !== undefined) data.category = req.body.category
    if (req.body.featured !== undefined) data.featured = req.body.featured === 'true' || req.body.featured === true
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder) || 0
    if (req.body.published !== undefined) data.published = req.body.published === 'false' || req.body.published === false
    if (req.body.mediaUrls && Array.isArray(req.body.mediaUrls)) data.mediaUrls = req.body.mediaUrls
    const item = await portfolioService.updatePortfolio(req.params.id, data, file)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await portfolioService.deletePortfolio(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),
}
