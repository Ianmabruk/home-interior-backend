import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapSocialItem(item) {
  if (!item) return null
  return {
    id: item.id,
    name: item.name,
    platform: item.platform,
    imageUrl: item.imageUrl,
    cloudinaryId: item.cloudinaryId,
    homepageCircularImage: item.homepageCircularImage,
    homepageCircularImageId: item.homepageCircularImageId,
    link: item.link,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function isValidUrl(value) {
  if (!value || typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const socialService = {
  getSocialItems,
  createSocialItem,
  updateSocialItem,
  deleteSocialItem,
  reorderSocialItems,
}

async function getSocialItems() {
  try {
    const items = await prisma.socialItem.findMany({
      orderBy: { displayOrder: 'asc' },
    })
    return items.map(mapSocialItem)
  } catch {
    return []
  }
}

async function createSocialItem(data, file, circularFile) {
  if (!data.name || !data.platform || !data.link) {
    throw failure(400, 'Name, platform, and link are required')
  }
  if (!isValidUrl(data.link)) {
    throw failure(400, 'Invalid URL format')
  }
  let imageUrl = null
  let cloudinaryId = null
  let homepageCircularImage = null
  let homepageCircularImageId = null
  let uploadedPaths = []

  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'socials')
    imageUrl = uploaded.url
    cloudinaryId = uploaded.path
    uploadedPaths.push(uploaded.path)
  }

  if (circularFile) {
    const uploaded = await uploadFile(circularFile.buffer, circularFile.mimetype, 'socials')
    homepageCircularImage = uploaded.url
    homepageCircularImageId = uploaded.path
    uploadedPaths.push(uploaded.path)
  }

  let item
  try {
    item = await prisma.socialItem.create({
      data: {
        name: data.name,
        platform: data.platform,
        link: data.link,
        imageUrl,
        cloudinaryId,
        homepageCircularImage,
        homepageCircularImageId,
        displayOrder: data.displayOrder || 0,
        isActive: data.isActive !== false,
      },
    })
  } catch (err) {
    if (uploadedPaths.length > 0) {
      deleteFiles(uploadedPaths).catch(() => {})
    }
    throw err
  }
  return mapSocialItem(item)
}

async function updateSocialItem(id, data, file, circularFile, removeHomepageCircularImage = false) {
  const existing = await prisma.socialItem.findUnique({ where: { id } })
  if (!existing) {
    throw failure(404, 'Social item not found')
  }

  const updateData = { ...data }
  let newUploadedPaths = []

  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'socials')
    updateData.imageUrl = uploaded.url
    updateData.cloudinaryId = uploaded.path
    newUploadedPaths.push(uploaded.path)
  }

  if (circularFile) {
    if (existing.homepageCircularImageId) await deleteFile(existing.homepageCircularImageId)
    const uploaded = await uploadFile(circularFile.buffer, circularFile.mimetype, 'socials')
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
    item = await prisma.socialItem.update({
      where: { id },
      data: updateData,
    })
  } catch (err) {
    if (newUploadedPaths.length > 0) {
      deleteFiles(newUploadedPaths).catch(() => {})
    }
    throw err
  }
  return mapSocialItem(item)
}

async function deleteSocialItem(id) {
  const existing = await prisma.socialItem.findUnique({ where: { id } })
  if (!existing) {
    throw failure(404, 'Social item not found')
  }
  if (existing.cloudinaryId) {
    await deleteFile(existing.cloudinaryId)
  }
  if (existing.homepageCircularImageId) {
    await deleteFile(existing.homepageCircularImageId)
  }
  await prisma.socialItem.delete({ where: { id } })
  return { success: true }
}

async function reorderSocialItems(orders) {
  if (!Array.isArray(orders)) {
    throw failure(400, 'Invalid orders array')
  }
  await prisma.$transaction(
    orders.map((order) =>
      prisma.socialItem.update({
        where: { id: order.id },
        data: { displayOrder: order.displayOrder },
      })
    )
  )
  const items = await prisma.socialItem.findMany({
    orderBy: { displayOrder: 'asc' },
  })
  return items.map(mapSocialItem)
}
