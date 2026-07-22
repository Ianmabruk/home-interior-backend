import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapTestimonial(item) {
  if (!item) return null
  return {
    ...item,
    _id: item.id,
    id: item.id,
    clientName: item.clientName,
    photoUrl: item.photoUrl,
    publicId: item.publicId,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  }
}

export const testimonialService = {
  listTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
}

async function listTestimonials() {
  try {
    const items = await prisma.testimonial.findMany({
      orderBy: { displayOrder: 'asc' },
    })
    return items.map(mapTestimonial)
  } catch {
    return []
  }
}

async function getTestimonial(id) {
  try {
    const item = await prisma.testimonial.findUnique({ where: { id } })
    if (!item) throw failure(404, 'Testimonial not found')
    return mapTestimonial(item)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch testimonial')
  }
}

async function createTestimonial(data, file) {
  const createData = { ...data }
  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'testimonials')
    createData.photoUrl = uploaded.url
    createData.publicId = uploaded.path
  }
  const item = await prisma.testimonial.create({ data: createData })
  return mapTestimonial(item)
}

async function updateTestimonial(id, data, file) {
  const existing = await prisma.testimonial.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Testimonial not found')

  const updateData = { ...data }
  if (file) {
    if (existing.publicId) await deleteFile(existing.publicId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'testimonials')
    updateData.photoUrl = uploaded.url
    updateData.publicId = uploaded.path
  }
  const item = await prisma.testimonial.update({ where: { id }, data: updateData })
  return mapTestimonial(item)
}

async function deleteTestimonial(id) {
  const existing = await prisma.testimonial.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Testimonial not found')
  if (existing.publicId) await deleteFile(existing.publicId)
  await prisma.testimonial.delete({ where: { id } })
}
