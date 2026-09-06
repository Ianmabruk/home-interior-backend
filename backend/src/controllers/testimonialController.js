import { asyncHandler } from '../middleware/asyncHandler.js'
import { testimonialService } from '../services/testimonialService.js'
import { invalidateCachePattern } from '../utils/cache.js'

export const testimonialController = {
  list: asyncHandler(async (req, res) => {
    const items = await testimonialService.listTestimonials()
    res.json({ success: true, data: items })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await testimonialService.getTestimonial(req.params.id)
    res.json({ success: true, data: item })
  }),

  create: asyncHandler(async (req, res) => {
    const photoFile = req.files?.photo?.[0] || null
    const circularFile = req.files?.homepageCircularImage?.[0] || null
    const data = {
      clientName: req.body.clientName || '',
      content: req.body.testimonial || req.body.content || '',
      project: req.body.project || '',
      displayOrder: Number(req.body.displayOrder) || 0,
      isActive: req.body.isActive !== 'false' && req.body.isActive !== false,
      initial: req.body.initial || '',
    }
    const item = await testimonialService.createTestimonial(data, photoFile, circularFile)
    invalidateCachePattern('testimonial')
    invalidateCachePattern('homepage')
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const photoFile = req.files?.photo?.[0] || null
    const circularFile = req.files?.homepageCircularImage?.[0] || null
    const removeHomepageCircularImage = req.body.removeHomepageCircularImage === 'true'
    const data = {}
    if (req.body.clientName !== undefined) data.clientName = req.body.clientName
    if (req.body.testimonial !== undefined) data.content = req.body.testimonial
    if (req.body.content !== undefined) data.content = req.body.content
    if (req.body.project !== undefined) data.project = req.body.project
    if (req.body.displayOrder !== undefined) data.displayOrder = Number(req.body.displayOrder) || 0
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true' || req.body.isActive === true
    if (req.body.initial !== undefined) data.initial = req.body.initial
    const removePhoto = req.body.removePhoto === 'true'
    const item = await testimonialService.updateTestimonial(req.params.id, data, photoFile, circularFile, removeHomepageCircularImage, removePhoto)
    invalidateCachePattern('testimonial')
    invalidateCachePattern('homepage')
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await testimonialService.deleteTestimonial(req.params.id)
    invalidateCachePattern('testimonial')
    invalidateCachePattern('homepage')
    res.json({ success: true, data: { message: 'Deleted' } })
  }),

  reorder: asyncHandler(async (req, res) => {
    const orderedIds = Array.isArray(req.body.orderedIds) ? req.body.orderedIds : []
    const items = await testimonialService.reorderTestimonials(orderedIds)
    invalidateCachePattern('testimonial')
    invalidateCachePattern('homepage')
    res.json({ success: true, data: items })
  }),
}
