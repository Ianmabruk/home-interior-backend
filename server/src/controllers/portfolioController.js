import { asyncHandler } from '../utils/asyncHandler.js'
import { supabase } from '../config/supabase.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray } from '../utils/helpers.js'

const findFileByFieldname = (req, fieldname) => {
  if (req.file && req.file.fieldname === fieldname) return req.file
  const files = Array.isArray(req.files) ? req.files : []
  const found = files.find((f) => f.fieldname === fieldname)
  if (found) return found
  if (req.files && typeof req.files === 'object' && req.files[fieldname]) {
    const arr = req.files[fieldname]
    return Array.isArray(arr) ? arr[0] : arr
  }
  return null
}

const findFilesByFieldname = (req, fieldname) => {
  if (Array.isArray(req.files)) {
    return req.files.filter((f) => f.fieldname === fieldname)
  }
  if (req.files && typeof req.files === 'object' && req.files[fieldname]) {
    const arr = req.files[fieldname]
    return Array.isArray(arr) ? arr : [arr]
  }
  return []
}

export const portfolioController = {
  list: asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw new ApiError(500, error.message)
    res.json(sendSuccess(withIdArray(data || [])))
  }),

  get: asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' })
    }
    res.json(sendSuccess(withId(data)))
  }),

  create: asyncHandler(async (req, res) => {
    const data = {
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      category: req.body.category || 'General',
      featured: req.body.featured === 'true' || req.body.featured === true,
      display_order: Number(req.body.displayOrder) || 0,
      published: req.body.published !== 'false' && req.body.published !== false,
    }

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/portfolio', type: 'image' })
      data.image_url = upload.secure_url
      data.cloudinary_id = upload.public_id
    }

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    const mediaUrls = []
    for (const file of galleryFiles) {
      const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/portfolio', type: 'image' })
      mediaUrls.push(upload.secure_url)
    }
    if (mediaUrls.length > 0) {
      data.media_urls = mediaUrls
    }

    const bodyMediaUrls = req.body.mediaUrls
    if (Array.isArray(bodyMediaUrls) && bodyMediaUrls.length > 0) {
      data.media_urls = bodyMediaUrls
    }

    if (!data.image_url && !req.body.imageUrl) {
      return res.status(400).json({ success: false, message: 'Image is required' })
    }

    const { data: item, error } = await supabase
      .from('portfolios')
      .insert([data])
      .single()

    if (error) throw new ApiError(500, error.message)
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const { data: existing, error: existingError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (existingError || !existing) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' })
    }

    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.category !== undefined) data.category = req.body.category
    if (req.body.featured !== undefined) data.featured = req.body.featured === 'true' || req.body.featured === true
    if (req.body.displayOrder !== undefined) data.display_order = Number(req.body.displayOrder) || 0
    if (req.body.published !== undefined) data.published = req.body.published === 'true' || req.body.published === true

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      if (existing.cloudinary_id) {
        try { await mediaService.delete(existing.cloudinary_id, 'image') } catch {}
      }
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/portfolio', type: 'image' })
      data.image_url = upload.secure_url
      data.cloudinary_id = upload.public_id
    }

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    if (galleryFiles.length > 0) {
      const mediaUrls = []
      for (const file of galleryFiles) {
        const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/portfolio', type: 'image' })
        mediaUrls.push(upload.secure_url)
      }
      data.media_urls = mediaUrls
    }

    const bodyMediaUrls = req.body.mediaUrls
    if (Array.isArray(bodyMediaUrls)) {
      data.media_urls = bodyMediaUrls
    }

    const { data: item, error } = await supabase
      .from('portfolios')
      .update(data)
      .eq('id', req.params.id)
      .single()

    if (error) throw new ApiError(500, error.message)
    res.json(sendSuccess(withId(item)))
  }),

  reorder: asyncHandler(async (req, res) => {
    const { order } = req.body
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Order must be an array of {id, displayOrder}' })
    }

    for (const item of order) {
      const { error } = await supabase
        .from('portfolios')
        .update({ display_order: item.displayOrder ?? 0 })
        .eq('id', item.id)

      if (error) throw new ApiError(500, error.message)
    }

    res.json(sendSuccess({ message: 'Portfolio reordered' }))
  }),

  remove: asyncHandler(async (req, res) => {
    const { data: existing, error: existingError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (!existingError && existing) {
      if (existing.cloudinary_id) {
        try { await mediaService.delete(existing.cloudinary_id, 'image') } catch {}
      }
      if (Array.isArray(existing.media_urls)) {
        for (const url of existing.media_urls) {
          try {
            const publicId = url.split('/').pop()?.split('.')[0]
            if (publicId) await mediaService.delete(publicId, 'image')
          } catch {}
        }
      }
    }

    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', req.params.id)

    if (error) throw new ApiError(500, error.message)
    res.json(sendSuccess({ message: 'Portfolio item deleted' }))
  }),
}
