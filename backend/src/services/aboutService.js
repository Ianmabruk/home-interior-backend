import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapAbout(item) {
  if (!item) return null
  return {
    ...item,
    aboutImageUrl: item.imageUrl,
    companyDescription: item.companyDesc,
    contactEmail: item.contactEmail,
    imageUrl: item.imageUrl,
    cloudinaryId: item.cloudinaryId,
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

async function createOrUpdateAbout(data, file) {
  const existing = await prisma.about.findFirst({ orderBy: { createdAt: 'desc' } })
  const createData = { ...data }

  if (file) {
    if (existing?.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const updated = await uploadFile(file.buffer, file.mimetype, 'about')
    createData.imageUrl = updated.url
    createData.cloudinaryId = updated.path
  } else if (!existing?.imageUrl) {
    createData.imageUrl = ''
  }

  if (existing) {
    const item = await prisma.about.update({ where: { id: existing.id }, data: createData })
    return mapAbout(item)
  }
  const item = await prisma.about.create({ data: createData })
  return mapAbout(item)
}
