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
    content: item.content,
    project: item.project,
    photoUrl: item.photoUrl,
    publicId: item.publicId,
    initial: item.initial,
    homepageCircularImage: item.homepageCircularImage,
    homepageCircularImageId: item.homepageCircularImageId,
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
  reorderTestimonials,
}

async function listTestimonials() {
  const items = await prisma.testimonial.findMany({
    orderBy: { displayOrder: 'asc' },
  })
  return items.map(mapTestimonial)
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

async function createTestimonial(data, file, circularFile) {
  const createData = { ...data }
  let uploadedPaths = []

  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'testimonials')
    createData.photoUrl = uploaded.url
    createData.publicId = uploaded.path
    uploadedPaths.push(uploaded.path)
  }
  if (circularFile) {
    const uploaded = await uploadFile(circularFile.buffer, circularFile.mimetype, 'testimonials')
    createData.homepageCircularImage = uploaded.url
    createData.homepageCircularImageId = uploaded.path
    uploadedPaths.push(uploaded.path)
  }

  let item
  try {
    item = await prisma.testimonial.create({ data: createData })
  } catch (err) {
    if (uploadedPaths.length > 0) {
      deleteFiles(uploadedPaths).catch(() => {})
    }
    throw err
  }
  return mapTestimonial(item)
}

async function updateTestimonial(id, data, file, circularFile, removeHomepageCircularImage = false, removePhoto = false) {
  const existing = await prisma.testimonial.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Testimonial not found')

  const updateData = { ...data }
  let newUploadedPaths = []

  if (file) {
    if (existing.publicId) await deleteFile(existing.publicId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'testimonials')
    updateData.photoUrl = uploaded.url
    updateData.publicId = uploaded.path
    newUploadedPaths.push(uploaded.path)
  }
  if (circularFile) {
    if (existing.homepageCircularImageId) await deleteFile(existing.homepageCircularImageId)
    const uploaded = await uploadFile(circularFile.buffer, circularFile.mimetype, 'testimonials')
    updateData.homepageCircularImage = uploaded.url
    updateData.homepageCircularImageId = uploaded.path
    newUploadedPaths.push(uploaded.path)
  } else if (removeHomepageCircularImage) {
    if (existing.homepageCircularImageId) await deleteFile(existing.homepageCircularImageId)
    updateData.homepageCircularImage = null
    updateData.homepageCircularImageId = null
  }
  if (removePhoto && !file) {
    if (existing.publicId) await deleteFile(existing.publicId)
    updateData.photoUrl = null
    updateData.publicId = null
  }

  let item
  try {
    item = await prisma.testimonial.update({ where: { id }, data: updateData })
  } catch (err) {
    if (newUploadedPaths.length > 0) {
      deleteFiles(newUploadedPaths).catch(() => {})
    }
    throw err
  }
  return mapTestimonial(item)
}

async function deleteTestimonial(id) {
  const existing = await prisma.testimonial.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Testimonial not found')
  if (existing.publicId) await deleteFile(existing.publicId).catch(() => {})
  if (existing.homepageCircularImageId) await deleteFile(existing.homepageCircularImageId).catch(() => {})
  await prisma.testimonial.delete({ where: { id } })
}

async function reorderTestimonials(orderedIds) {
  if (!Array.isArray(orderedIds)) throw failure(400, 'Invalid reorder payload')
  const updates = orderedIds.map((id, index) =>
    prisma.testimonial.update({
      where: { id },
      data: { displayOrder: index },
    }),
  )
  await prisma.$transaction(updates)
  return listTestimonials()
}
