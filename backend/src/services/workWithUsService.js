import { prisma, withRetry } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapWorkWithUs(item) {
  if (!item) return null
  return {
    ...item,
    _id: item.id,
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    mediaUrls: item.mediaUrls,
    cloudinaryId: item.cloudinaryId,
    homepageCircularImage: item.homepageCircularImage,
    homepageCircularImageId: item.homepageCircularImageId,
    fullName: item.fullName,
    phone: item.phone,
    email: item.email,
    budget: item.budget,
    startDate: item.startDate,
    timeline: item.timeline,
    status: item.status,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  }
}

export const workWithUsService = {
  listWorkWithUs,
  getWorkWithUs,
  createWorkWithUs,
  updateWorkWithUsStatus,
  deleteWorkWithUs,
  getWorkWithUsContent,
  createWorkWithUsContent,
  updateWorkWithUsContent,
  deleteWorkWithUsContent,
}

async function listWorkWithUs() {
  try {
    const items = await withRetry(() => prisma.workWithUs.findMany({
      orderBy: { createdAt: 'desc' },
    }))
    return items.map(mapWorkWithUs)
  } catch {
    return []
  }
}

async function getWorkWithUs(id) {
  try {
    const item = await withRetry(() => prisma.workWithUs.findUnique({ where: { id } }))
    if (!item) throw failure(404, 'Submission not found')
    return mapWorkWithUs(item)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch submission')
  }
}

async function createWorkWithUs(data) {
  const item = await withRetry(() => prisma.workWithUs.create({ data }))
  return mapWorkWithUs(item)
}

async function updateWorkWithUsStatus(id, status) {
  const item = await withRetry(() => prisma.workWithUs.update({
    where: { id },
    data: { status },
  }))
  return mapWorkWithUs(item)
}

async function deleteWorkWithUs(id) {
  const existing = await withRetry(() => prisma.workWithUs.findUnique({ where: { id } }))
  if (!existing) throw failure(404, 'Submission not found')
  await withRetry(() => prisma.workWithUs.delete({ where: { id } }))
}

async function getWorkWithUsContent() {
  try {
    const items = await withRetry(() => prisma.workWithUs.findMany({
      where: { type: 'content', isActive: true },
      orderBy: { displayOrder: 'asc' },
    }))
    return items.map(mapWorkWithUs)
  } catch {
    return []
  }
}

async function createWorkWithUsContent(data, file, circularFile) {
  const uploadData = {}
  let uploadedPaths = []

  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'work-with-us')
    uploadData.imageUrl = uploaded.url
    uploadData.cloudinaryId = uploaded.path
    uploadedPaths.push(uploaded.path)
  }
  if (circularFile) {
    const uploaded = await uploadFile(circularFile.buffer, circularFile.mimetype, 'work-with-us')
    uploadData.homepageCircularImage = uploaded.url
    uploadData.homepageCircularImageId = uploaded.path
    uploadedPaths.push(uploaded.path)
  }

  let item
  try {
    item = await withRetry(() => prisma.workWithUs.create({
      data: {
        type: 'content',
        title: data.title || '',
        description: data.description || '',
        displayOrder: data.displayOrder || 0,
        isActive: data.isActive !== false,
        ...uploadData,
      },
    }))
  } catch (err) {
    if (uploadedPaths.length > 0) {
      deleteFiles(uploadedPaths).catch(() => {})
    }
    throw err
  }
  return mapWorkWithUs(item)
}

async function updateWorkWithUsContent(id, data, file, circularFile, removeHomepageCircularImage = false) {
  const existing = await prisma.workWithUs.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Content not found')

  const updateData = { ...data }
  let newUploadedPaths = []

  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'work-with-us')
    updateData.imageUrl = uploaded.url
    updateData.cloudinaryId = uploaded.path
    newUploadedPaths.push(uploaded.path)
  }

  if (circularFile) {
    if (existing.homepageCircularImageId) await deleteFile(existing.homepageCircularImageId)
    const uploaded = await uploadFile(circularFile.buffer, circularFile.mimetype, 'work-with-us')
    updateData.homepageCircularImage = uploaded.url
    updateData.homepageCircularImageId = uploaded.path
    newUploadedPaths.push(uploaded.path)
  } else if (removeHomepageCircularImage) {
    if (existing.homepageCircularImageId) await deleteFile(existing.homepageCircularImageId)
    updateData.homepageCircularImage = null
    updateData.homepageCircularImageId = null
  }

  let item
  try {
    item = await prisma.workWithUs.update({
      where: { id },
      data: updateData,
    })
  } catch (err) {
    if (newUploadedPaths.length > 0) {
      deleteFiles(newUploadedPaths).catch(() => {})
    }
    throw err
  }
  return mapWorkWithUs(item)
}

async function deleteWorkWithUsContent(id) {
  const existing = await withRetry(() => prisma.workWithUs.findUnique({ where: { id } }))
  if (!existing) throw failure(404, 'Content not found')
  if (existing.cloudinaryId) {
    await deleteFile(existing.cloudinaryId)
  }
  await withRetry(() => prisma.workWithUs.delete({ where: { id } }))
  return { success: true }
}
