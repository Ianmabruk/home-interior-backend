import { asyncHandler } from '../utils/asyncHandler.js'
import { supabase } from '../config/supabase.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray, sortByOrderThenDate } from '../utils/helpers.js'

const TABLES = {
  portfolio: 'portfolios',
  virtualDesign: 'virtual_designs',
  service: 'services',
  about: 'abouts',
  hero: 'hero',
  testimonial: 'testimonials',
}

const mapAboutItem = (item) => {
  if (!item) return item
  return {
    ...item,
    _id: item.id,
    aboutImageUrl: item.about_image_url,
  }
}

export const getAbout = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('abouts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw new ApiError(500, error.message)
  const mapped = data && data.length > 0 ? mapAboutItem(data[0]) : null
  res.json(sendSuccess(mapped))
})

export const upsertAbout = asyncHandler(async (req, res) => {
  const { data: existing, error: existingError } = await supabase
    .from('abouts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingError) throw new ApiError(500, existingError.message)

  const payload = {
    story: req.body.story ?? existing?.[0]?.story ?? '',
    company_description: req.body.companyDescription ?? existing?.[0]?.company_description ?? '',
    mission: req.body.mission ?? existing?.[0]?.mission ?? '',
    vision: req.body.vision ?? existing?.[0]?.vision ?? '',
    location: req.body.location ?? existing?.[0]?.location ?? '',
    contact_email: req.body.contactEmail ?? existing?.[0]?.contact_email ?? '',
    socials: req.body.socials ? (() => { try { return JSON.parse(req.body.socials) } catch { return {} } })() : (existing?.[0]?.socials ?? {}),
  }

  if (req.file) {
    const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/about', type: 'image' })
    payload.about_image_url = upload.secure_url
    payload.about_image_public_id = upload.public_id
    if (existing?.[0]?.about_image_public_id) {
      try { await mediaService.delete(existing[0].about_image_public_id, 'image') } catch {}
    }
  }

  let result
  if (!existing || existing.length === 0) {
    const { data, error } = await supabase
      .from('abouts')
      .insert([payload])
      .single()
    if (error) throw new ApiError(500, error.message)
    result = data
    res.status(201).json(sendSuccess(mapAboutItem(result)))
  } else {
    const { data, error } = await supabase
      .from('abouts')
      .update(payload)
      .eq('id', existing[0].id)
      .single()
    if (error) throw new ApiError(500, error.message)
    res.json(sendSuccess(mapAboutItem(data)))
  }
})

export const homepageFeed = asyncHandler(async (req, res) => {
  const [
    portfolioRes,
    virtualDesignsRes,
    servicesRes,
    aboutsRes,
    heroRes,
    testimonialsRes,
  ] = await Promise.all([
    supabase.from('portfolios').select('*').eq('published', true).order('display_order', { ascending: true }).order('created_at', { ascending: false }),
    supabase.from('virtual_designs').select('*').order('created_at', { ascending: false }),
    supabase.from('services').select('*').eq('is_active', true).order('display_order', { ascending: true }).order('created_at', { ascending: false }),
    supabase.from('abouts').select('*').order('created_at', { ascending: false }).limit(1),
    supabase.from('hero').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false }),
    supabase.from('testimonials').select('*').eq('is_active', true).order('display_order', { ascending: true }).order('created_at', { ascending: false }).limit(10),
  ])

  for (const r of [portfolioRes, virtualDesignsRes, servicesRes, aboutsRes, heroRes, testimonialsRes]) {
    if (r.error) throw new ApiError(500, r.error.message)
  }

  const portfolio = portfolioRes.data || []
  const virtualDesigns = virtualDesignsRes.data || []
  const services = servicesRes.data || []
  const abouts = aboutsRes.data || []
  const hero = heroRes.data || []
  const testimonials = testimonialsRes.data || []

  const sortByOrderThenDate = (items) => [...items].sort((a, b) => {
    const orderDiff = (a.display_order || 0) - (b.display_order || 0)
    if (orderDiff !== 0) return orderDiff
    return new Date(b.created_at) - new Date(a.created_at)
  })

  const sortedPortfolio = sortByOrderThenDate(portfolio)
  const sortedVirtualDesigns = [...virtualDesigns].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const sortedServices = sortByOrderThenDate(services)
  const sortedTestimonials = sortByOrderThenDate(testimonials)

  const featuredPortfolio = sortedPortfolio.filter((item) => item.featured).slice(0, 3)
  const featuredVirtualDesigns = sortedVirtualDesigns.filter((item) => item.featured).slice(0, 3)
  const featuredProject = featuredPortfolio.length > 0 ? featuredPortfolio[0] : (sortedPortfolio.length > 0 ? sortedPortfolio[0] : null)

  const heroImages = hero.map((item) => ({ ...withId(item), url: item.image_url, imageUrl: item.image_url }))

  res.json(sendSuccess({
    portfolio: withIdArray(sortedPortfolio),
    virtualDesigns: withIdArray(sortedVirtualDesigns),
    virtualInteriorDesign: withIdArray(sortedVirtualDesigns),
    services: withIdArray(sortedServices),
    about: mapAboutItem(abouts[0]),
    testimonials: withIdArray(sortedTestimonials),
    featuredPortfolio: withIdArray(featuredPortfolio),
    featuredVirtualDesigns: withIdArray(featuredVirtualDesigns),
    heroImages,
    heroMedia: withIdArray(hero),
    featuredProject: featuredProject ? withId(featuredProject) : null,
  }))
})

export const uploadMediaController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' })
  }
  const folder = typeof req.body.folder === 'string' && req.body.folder.trim() ? req.body.folder.trim() : 'hok/uploads'
  const kind = req.body.resourceType === 'video' ? 'video' : 'image'
  const result = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder, type: kind })
  res.status(200).json(sendSuccess({
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: kind,
  }))
})

export const deleteMediaController = asyncHandler(async (req, res) => {
  const { publicId, resourceType } = req.body
  if (!publicId) {
    return res.status(400).json({ message: 'publicId is required' })
  }
  const result = await mediaService.delete(publicId, resourceType === 'video' ? 'video' : 'image')
  res.json(sendSuccess({ result: result?.result || 'ok' }))
})
