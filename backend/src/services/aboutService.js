import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapAbout(item) {
  if (!item) return null
  return {
    _id: item.id,
    ...item,
    aboutImageUrl: item.imageUrl,
    companyDescription: item.companyDesc,
    contactEmail: item.contactEmail,
    imageUrl: item.imageUrl,
    cloudinaryId: item.cloudinaryId,
    socialImage: item.socialImage,
    socialImageId: item.socialImageId,
    homepageCircularImage: item.homepageCircularImage,
    homepageCircularImageId: item.homepageCircularImageId,
  }
}

export const aboutService = {
  getAbout,
  createOrUpdateAbout,
}

async function getAbout() {
  const item = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })
  return item ? mapAbout(item) : null
}

async function createOrUpdateAbout(data, file, socialFile, homepageCircularImageFile, removeHomepageCircularImage = false) {
  const existing = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })
  const createData = { ...data }
  let uploadedPaths = []

  if (file) {
    if (existing?.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'about')
    createData.imageUrl = uploaded.url
    createData.cloudinaryId = uploaded.path
    uploadedPaths.push(uploaded.path)
  } else if (!existing?.imageUrl && createData.imageUrl === undefined) {
    createData.imageUrl = null
  }

  if (socialFile) {
    if (existing?.socialImageId) await deleteFile(existing.socialImageId)
    const uploaded = await uploadFile(socialFile.buffer, socialFile.mimetype, 'about')
    createData.socialImage = uploaded.url
    createData.socialImageId = uploaded.path
    uploadedPaths.push(uploaded.path)
  }

  if (homepageCircularImageFile) {
    if (existing?.homepageCircularImageId) await deleteFile(existing.homepageCircularImageId)
    const uploaded = await uploadFile(homepageCircularImageFile.buffer, homepageCircularImageFile.mimetype, 'about')
    createData.homepageCircularImage = uploaded.url
    createData.homepageCircularImageId = uploaded.path
    uploadedPaths.push(uploaded.path)
  } else if (removeHomepageCircularImage) {
    if (existing?.homepageCircularImageId) await deleteFile(existing.homepageCircularImageId)
    createData.homepageCircularImage = null
    createData.homepageCircularImageId = null
  }

  let item
  try {
    if (existing) {
      item = await prisma.about.update({ where: { id: existing.id }, data: createData })
    } else {
      item = await prisma.about.create({ data: createData })
    }
  } catch (err) {
    if (uploadedPaths.length > 0) {
      deleteFiles(uploadedPaths).catch(() => {})
    }
    throw err
  }
  return mapAbout(item)
}
