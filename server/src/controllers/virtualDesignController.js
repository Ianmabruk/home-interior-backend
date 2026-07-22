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

export const virtualDesignController = {
  list: asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('virtual_designs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new ApiError(500, error.message)
    res.json(sendSuccess(withIdArray(data || [])))
  }),

  get: asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('virtual_designs')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
    }
    res.json(sendSuccess(withId(data)))
  }),

  create: asyncHandler(async (req, res) => {
    const data = {
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      category: req.body.category || 'General',
      featured: req.body.featured === 'true' || req.body.featured === true,
    }

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      const isVideo = mediaFile.mimetype.startsWith('video/')
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/virtual-design', type: isVideo ? 'video' : 'image' })
      data.media_url = upload.secure_url
      data.cloudinary_id = upload.public_id
      data.media_type = isVideo ? 'video' : 'image'
    } else if (req.body.mediaUrl) {
      data.media_url = req.body.mediaUrl
      data.media_type = req.body.mediaType || 'image'
    }

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    const mediaUrls = []
    for (const file of galleryFiles) {
      const isVideoFile = file.mimetype.startsWith('video/')
      const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/virtual-design', type: isVideoFile ? 'video' : 'image' })
      mediaUrls.push({ url: upload.secure_url, type: isVideoFile ? 'video' : 'image' })
    }
    if (mediaUrls.length > 0) {
      data.media_urls = mediaUrls
    }

    const bodyMediaUrls = req.body.mediaUrls
    if (Array.isArray(bodyMediaUrls) && bodyMediaUrls.length > 0) {
      data.media_urls = bodyMediaUrls
    }

    if (!data.media_url) {
      data.media_url = 'https://via.placeholder.com/800x600?text=No+Image'
      data.media_type = 'image'
    }

    const { data: item, error } = await supabase
      .from('virtual_designs')
      .insert([data])
      .single()

    if (error) throw new ApiError(500, error.message)
    res.status(201).json(sendSuccess(withId(item)))
  }),

  update: asyncHandler(async (req, res) => {
    const { data: existing, error: existingError } = await supabase
      .from('virtual_designs')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (existingError || !existing) {
      return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
    }

    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.category !== undefined) data.category = req.body.category
    if (req.body.featured !== undefined) data.featured = req.body.featured === 'true' || req.body.featured === true

    const mediaFile = findFileByFieldname(req, 'media')
    if (mediaFile) {
      if (existing.cloudinary_id) {
        try { await mediaService.delete(existing.cloudinary_id, existing.media_type === 'video' ? 'video' : 'image') } catch {}
      }
      const isVideo = mediaFile.mimetype.startsWith('video/')
      const upload = await mediaService.upload({ buffer: mediaFile.buffer, mimeType: mediaFile.mimetype, folder: 'hok/virtual-design', type: isVideo ? 'video' : 'image' })
      data.media_url = upload.secure_url
      data.cloudinary_id = upload.public_id
      data.media_type = isVideo ? 'video' : 'image'
    }

    const galleryFiles = findFilesByFieldname(req, 'gallery')
    if (galleryFiles.length > 0) {
      const mediaUrls = []
      for (const file of galleryFiles) {
        const isVideoFile = file.mimetype.startsWith('video/')
        const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/virtual-design', type: isVideoFile ? 'video' : 'image' })
        mediaUrls.push({ url: upload.secure_url, type: isVideoFile ? 'video' : 'image' })
      }
      data.media_urls = [...(existing.media_urls || []), ...mediaUrls]
    }

    const bodyMediaUrls = req.body.mediaUrls
    if (Array.isArray(bodyMediaUrls)) {
      data.media_urls = bodyMediaUrls
    }

    const { data: item, error } = await supabase
      .from('virtual_designs')
      .update(data)
      .eq('id', req.params.id)
      .single()

    if (error) throw new ApiError(500, error.message)
    res.json(sendSuccess(withId(item)))
  }),

  remove: asyncHandler(async (req, res) => {
    const { data: existing, error: existingError } = await supabase
      .from('virtual_designs')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (existingError || !existing) {
      return res.status(404).json({ success: false, message: 'Virtual Design item not found' })
    }

    if (existing.cloudinary_id) {
      try { await mediaService.delete(existing.cloudinary_id, existing.media_type === 'video' ? 'video' : 'image') } catch {}
    }
    if (Array.isArray(existing.media_urls)) {
      for (const media of existing.media_urls) {
        try {
          const publicId = media.url?.split('/').pop()?.split('.')[0]
          if (publicId) {
            await mediaService.delete(publicId, media.type === 'video' ? 'video' : 'image')
          }
        } catch {}
      }
    }

    const { error } = await supabase
      .from('virtual_designs')
      .delete()
      .eq('id', req.params.id)

    if (error) throw new ApiError(500, error.message)
    res.json(sendSuccess({ message: 'Virtual Design item deleted' }))
  }),
}
