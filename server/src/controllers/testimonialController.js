import { z } from 'zod'
import { supabase } from '../config/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray } from '../utils/helpers.js'

const sortByOrder = (items) =>
  [...(items || [])].sort((a, b) => {
    const o = (a.display_order || 0) - (b.display_order || 0)
    if (o !== 0) return o
    return new Date(b.created_at || 0) - new Date(a.created_at || 0)
  })

export const listPublic = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw new ApiError(500, error.message)
  res.json(sendSuccess(withIdArray(sortByOrder(data || []))))
})

export const listAdmin = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw new ApiError(500, error.message)
  res.json(sendSuccess(withIdArray(sortByOrder(data || []))))
})

const testimonialSchema = z.object({
  clientName: z.string().min(2, 'Client name is required'),
  position: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  testimonial: z.string().min(4, 'Testimonial text is required'),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  displayOrder: z.coerce.number().int().optional(),
  isActive: z.preprocess(
    (v) => (v === 'true' || v === true ? true : v === 'false' || v === false ? false : v),
    z.boolean().optional(),
  ),
})

export const create = asyncHandler(async (req, res) => {
  const body = testimonialSchema.parse(req.body)
  let photoUrl
  let photoPublicId
  if (req.file) {
    const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/testimonials', type: 'image' })
    photoUrl = upload.secure_url
    photoPublicId = upload.public_id
  }

  const { data: item, error } = await supabase
    .from('testimonials')
    .insert([{
      client_name: body.clientName,
      position: body.position ?? null,
      company: body.company ?? null,
      testimonial: body.testimonial,
      rating: body.rating ?? 5,
      display_order: body.displayOrder ?? 0,
      is_active: body.isActive ?? true,
      photo_url: photoUrl,
      photo_public_id: photoPublicId,
    }])
    .single()

  if (error) throw new ApiError(500, error.message)

  res.status(201).json(sendSuccess(withId(item)))
})

export const update = asyncHandler(async (req, res) => {
  const { data: existing, error: existingError } = await supabase
    .from('testimonials')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (existingError || !existing) throw new ApiError(404, 'Testimonial not found')

  const body = testimonialSchema.partial().parse(req.body)
  const payload = {}
  if (body.clientName !== undefined) payload.client_name = body.clientName
  if (body.position !== undefined) payload.position = body.position
  if (body.company !== undefined) payload.company = body.company
  if (body.testimonial !== undefined) payload.testimonial = body.testimonial
  if (body.rating !== undefined) payload.rating = body.rating
  if (body.displayOrder !== undefined) payload.display_order = body.displayOrder
  if (body.isActive !== undefined) payload.is_active = body.isActive

  if (req.file) {
    const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/testimonials', type: 'image' })
    if (existing.photo_public_id) {
      try { await mediaService.delete(existing.photo_public_id, 'image') } catch { /* ignore */ }
    }
    payload.photo_url = upload.secure_url
    payload.photo_public_id = upload.public_id
  }

  const { data: item, error } = await supabase
    .from('testimonials')
    .update(payload)
    .eq('id', req.params.id)
    .single()

  if (error) throw new ApiError(500, error.message)
  res.json(sendSuccess(withId(item)))
})

export const remove = asyncHandler(async (req, res) => {
  const { data: existing, error: existingError } = await supabase
    .from('testimonials')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (existingError || !existing) throw new ApiError(404, 'Testimonial not found')
  if (existing.photo_public_id) {
    try { await mediaService.delete(existing.photo_public_id, 'image') } catch { /* ignore */ }
  }

  const { error } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', req.params.id)

  if (error) throw new ApiError(500, error.message)
  res.json(sendSuccess({ message: 'Testimonial deleted' }))
})

export const reorder = asyncHandler(async (req, res) => {
  const incoming = Array.isArray(req.body.order) ? req.body.order : []
  if (!incoming.length) throw new ApiError(400, 'order array is required')

  for (const id of incoming) {
    const { error } = await supabase
      .from('testimonials')
      .update({ display_order: incoming.indexOf(id) })
      .eq('id', String(id))

    if (error) throw new ApiError(500, error.message)
  }

  const { data: items, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw new ApiError(500, error.message)
  res.json(sendSuccess(withIdArray(sortByOrder(items || []))))
})

export const testimonialController = {
  listPublic,
  listAdmin,
  create,
  update,
  remove,
  reorder,
}
