import { asyncHandler } from '../utils/asyncHandler.js'
import { supabase } from '../config/supabase.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray } from '../utils/helpers.js'

export const heroMediaController = {
  list: asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('hero')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw new ApiError(500, error.message)
    res.json(sendSuccess(withIdArray(data || [])))
  }),

  get: asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('hero')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Hero content not found' })
    }
    res.json(sendSuccess(withId(data)))
  }),

  create: asyncHandler(async (req, res) => {
    const data = {
      title: req.body.title || '',
      subtitle: req.body.subtitle || '',
      is_active: req.body.isActive !== 'false' && req.body.isActive !== false,
    }

    if (req.file) {
      const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/homepage/hero', type: 'image' })
      data.image_url = upload.secure_url
      data.cloudinary_id = upload.public_id
      data.media_urls = [upload.secure_url]
    }

    const bodyMediaUrls = req.body.mediaUrls
    if (Array.isArray(bodyMediaUrls) && bodyMediaUrls.length > 0) {
      data.media_urls = bodyMediaUrls
    }

    const { data: hero, error } = await supabase
      .from('hero')
      .insert([data])
      .single()

    if (error) throw new ApiError(500, error.message)
    res.status(201).json(sendSuccess(withId(hero)))
  }),

  update: asyncHandler(async (req, res) => {
    const { data: hero, error: heroError } = await supabase
      .from('hero')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (heroError || !hero) {
      return res.status(404).json({ success: false, message: 'Hero content not found' })
    }

    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.subtitle !== undefined) data.subtitle = req.body.subtitle
    if (req.body.isActive !== undefined) data.is_active = req.body.isActive === 'true' || req.body.isActive === true

    if (req.file) {
      if (hero.cloudinary_id) {
        try {
          await mediaService.delete(hero.cloudinary_id, 'image')
        } catch {
          // ignore
        }
      }
      const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/homepage/hero', type: 'image' })
      data.image_url = upload.secure_url
      data.cloudinary_id = upload.public_id
      data.media_urls = [upload.secure_url]
    }

    const bodyMediaUrls = req.body.mediaUrls
    if (Array.isArray(bodyMediaUrls)) {
      data.media_urls = bodyMediaUrls
    }

    const { data: updated, error } = await supabase
      .from('hero')
      .update(data)
      .eq('id', hero.id)
      .single()

    if (error) throw new ApiError(500, error.message)
    res.json(sendSuccess(withId(updated)))
  }),

  remove: asyncHandler(async (req, res) => {
    const { data: hero, error: heroError } = await supabase
      .from('hero')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (heroError || !hero) {
      return res.status(404).json({ success: false, message: 'Hero content not found' })
    }
    if (hero.cloudinary_id) {
      try {
        await mediaService.delete(hero.cloudinary_id, 'image')
      } catch {
        // ignore
      }
    }
    if (Array.isArray(hero.media_urls)) {
      for (const url of hero.media_urls) {
        try {
          const publicId = url.split('/').pop()?.split('.')[0]
          if (publicId) {
            await mediaService.delete(publicId, 'image')
          }
        } catch {
          // ignore
        }
      }
    }

    const { error } = await supabase
      .from('hero')
      .delete()
      .eq('id', hero.id)

    if (error) throw new ApiError(500, error.message)
    res.json(sendSuccess({ message: 'Hero content deleted' }))
  }),
}
