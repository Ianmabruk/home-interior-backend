import { asyncHandler } from '../middleware/asyncHandler.js'
import { virtualDesignService } from '../services/virtualDesignService.js'
import { failure } from '../utils/response.js'

export const virtualDesignController = {
  list: asyncHandler(async (req, res) => {
    const items = await virtualDesignService.listVirtualDesigns()
    res.json({ success: true, data: items })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await virtualDesignService.getVirtualDesign(req.params.id)
    res.json({ success: true, data: item })
  }),

  create: asyncHandler(async (req, res) => {
    const file = req.file
    const galleryFiles = Array.isArray(req.files?.gallery) ? req.files.gallery : []
    if (!file && galleryFiles.length === 0) {
      return res.status(400).json({ success: false, message: 'Media file is required' })
    }
    const data = {
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      category: req.body.category || 'General',
      mediaType: req.body.mediaType || 'image',
      featured: req.body.featured === 'true' || req.body.featured === true,
      displayOrder: Number(req.body.displayOrder) || 0,
      published: req.body.published !== 'false' && req.body.published !== false,
      mediaUrls: req.body.mediaUrls || [],
    }
    const item = await virtualDesignService.createVirtualDesign(data, file, galleryFiles)
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const file = req.file
    const galleryFiles = Array.isArray(req.files?.gallery) ? req.files.gallery : []
    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.category !== undefined) data.category = req.body.category
    if (req.body.mediaType !== undefined) data.mediaType = req.body.mediaType
    if (req.body.featured !== undefined) data.featured = req.body.featured === 'true' || req.body.featured === true
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder) || 0
    if (req.body.published !== undefined) data.published = req.body.published === 'false' || req.body.published === false
    if (req.body.mediaUrls) data.mediaUrls = Array.isArray(req.body.mediaUrls) ? req.body.mediaUrls : []
    const item = await virtualDesignService.updateVirtualDesign(req.params.id, data, file, galleryFiles)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await virtualDesignService.deleteVirtualDesign(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),
}
