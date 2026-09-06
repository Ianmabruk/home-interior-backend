import { asyncHandler } from '../middleware/asyncHandler.js'
import { portfolioService } from '../services/portfolioService.js'
import { invalidateCachePattern } from '../utils/cache.js'
import { failure } from '../utils/response.js'

function normalizeStringArray(val) {
  if (!val) return undefined
  if (Array.isArray(val)) return val.filter(Boolean)
  if (typeof val === 'string') return val ? [val] : []
  return undefined
}

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
    const t0 = Date.now()
    const file = req.files?.media?.[0] || null
    const beforeFiles = Array.isArray(req.files?.before) ? req.files.before : []
    const afterFiles = Array.isArray(req.files?.after) ? req.files.after : []
    const circularFile = req.files?.homepageCircularImage?.[0] || null
    const data = {
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      category: req.body.category || 'General',
      featured: req.body.featured === 'true' || req.body.featured === true,
      displayOrder: Number(req.body.displayOrder) || 0,
      published: req.body.published !== 'false' && req.body.published !== false,
    }
    if (req.body.imageUrl) data.imageUrl = req.body.imageUrl
    const beforeImages = normalizeStringArray(req.body.beforeImages)
    if (beforeImages) data.beforeImages = beforeImages
    const afterImages = normalizeStringArray(req.body.afterImages)
    if (afterImages) data.afterImages = afterImages
    const item = await portfolioService.createPortfolio(data, file, beforeFiles, afterFiles, circularFile)
    const elapsed = Date.now() - t0
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[portfolio] create completed in ${elapsed}ms (before=${beforeFiles.length}, after=${afterFiles.length}, main=${!!file})`)
    } else if (elapsed > 5000) {
      console.warn(`[portfolio] create took ${elapsed}ms — investigate performance`)
    }
    invalidateCachePattern('portfolio')
    invalidateCachePattern('homepage')
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const t0 = Date.now()
    const file = req.files?.media?.[0] || null
    const beforeFiles = Array.isArray(req.files?.before) ? req.files.before : []
    const afterFiles = Array.isArray(req.files?.after) ? req.files.after : []
    const circularFile = req.files?.homepageCircularImage?.[0] || null
    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.category !== undefined) data.category = req.body.category
    if (req.body.featured !== undefined) data.featured = req.body.featured === 'true' || req.body.featured === true
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder) || 0
    if (req.body.published !== undefined) data.published = req.body.published !== 'false' && req.body.published !== false
    if (req.body.imageUrl) data.imageUrl = req.body.imageUrl
    const beforeImages = normalizeStringArray(req.body.beforeImages)
    if (beforeImages !== undefined) data.beforeImages = beforeImages
    const afterImages = normalizeStringArray(req.body.afterImages)
    if (afterImages !== undefined) data.afterImages = afterImages
    const item = await portfolioService.updatePortfolio(req.params.id, data, file, beforeFiles, afterFiles, circularFile)
    const elapsed = Date.now() - t0
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[portfolio] update completed in ${elapsed}ms (before=${beforeFiles.length}, after=${afterFiles.length}, main=${!!file})`)
    } else if (elapsed > 5000) {
      console.warn(`[portfolio] update took ${elapsed}ms — investigate performance`)
    }
    invalidateCachePattern('portfolio')
    invalidateCachePattern('homepage')
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await portfolioService.deletePortfolio(req.params.id)
    invalidateCachePattern('portfolio')
    invalidateCachePattern('homepage')
    res.json({ success: true, data: { message: 'Deleted' } })
  }),

  reorder: asyncHandler(async (req, res) => {
    // Accept either { projects: [...] } or { order: [...] } for flexibility.
    const projects = req.body?.projects || req.body?.order
    if (!Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({ success: false, message: 'A non-empty projects array is required' })
    }
    const items = projects.map((p) => ({ id: p?.id, displayOrder: Number(p?.displayOrder) }))
    const updated = await portfolioService.reorderPortfolioProjects(items)
    invalidateCachePattern('portfolio')
    invalidateCachePattern('homepage')
    res.json({ success: true, data: updated })
  }),

  reorderImages: asyncHandler(async (req, res) => {
    const { before, after } = req.body
    const orderList = []
    if (Array.isArray(before)) {
      before.forEach((img, idx) => {
        orderList.push({
          id: img?.id,
          imageUrl: img?.imageUrl || img?.url,
          imageType: 'before',
          sortOrder: idx,
        })
      })
    }
    if (Array.isArray(after)) {
      after.forEach((img, idx) => {
        orderList.push({
          id: img?.id,
          imageUrl: img?.imageUrl || img?.url,
          imageType: 'after',
          sortOrder: idx,
        })
      })
    }
    const item = await portfolioService.reorderPortfolioImages(req.params.id, orderList)
    invalidateCachePattern('portfolio')
    invalidateCachePattern('homepage')
    res.json({ success: true, data: item })
  }),
}
