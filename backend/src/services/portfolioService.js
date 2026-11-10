import { prisma } from '../config/database.js'
import { uploadFile, deleteFile, deleteFiles } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

const MAX_IMAGES_PER_SECTION = 40
const MAX_TOTAL_IMAGES = 80

function uniqueNonEmptyValues(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === 'string' ? value.trim() !== '' : value != null))]
}

function enforceImageLimit(section, total, existingCount, requestedNew) {
  if (total > MAX_IMAGES_PER_SECTION) {
    const remaining = Math.max(0, MAX_IMAGES_PER_SECTION - existingCount)
    const err = new Error(
      `You can upload a maximum of ${MAX_IMAGES_PER_SECTION} ${section.charAt(0).toUpperCase() + section.slice(1)} images. You currently have ${existingCount}, so you can add ${remaining} more.`,
    )
    err.status = 400
    err.code = `${section.toUpperCase()}_IMAGE_LIMIT_EXCEEDED`
    err.details = {
      error: err.code,
      message: `${section.charAt(0).toUpperCase() + section.slice(1)} images cannot exceed ${MAX_IMAGES_PER_SECTION}.`,
      currentCount: existingCount,
      newCount: requestedNew,
      maximum: MAX_IMAGES_PER_SECTION,
      limit: MAX_IMAGES_PER_SECTION,
      remaining,
      limitType: section,
      section,
      total,
      requested: requestedNew,
    }
    throw err
  }
}

function enforceTotalLimit(beforeTotal, afterTotal, beforeExisting, afterExisting, beforeNew, afterNew) {
  const combined = beforeTotal + afterTotal
  if (combined > MAX_TOTAL_IMAGES) {
    const remaining = Math.max(0, MAX_TOTAL_IMAGES - (beforeExisting + afterExisting))
    const err = new Error(
      `You can upload a maximum of ${MAX_TOTAL_IMAGES} total images (Before + After combined). You currently have ${beforeExisting + afterExisting}, so you can add ${remaining} more.`,
    )
    err.status = 400
    err.code = 'TOTAL_IMAGE_LIMIT_EXCEEDED'
    err.details = {
      error: err.code,
      message: `Total images (Before + After) cannot exceed ${MAX_TOTAL_IMAGES}.`,
      currentCount: beforeExisting + afterExisting,
      newCount: beforeNew + afterNew,
      maximum: MAX_TOTAL_IMAGES,
      limit: MAX_TOTAL_IMAGES,
      remaining,
      limitType: 'total',
      section: 'total',
      beforeExisting,
      afterExisting,
      beforeNew,
      afterNew,
      total: combined,
    }
    throw err
  }
}

async function syncPortfolioImages(projectId, beforeImages, afterImages) {
  const before = beforeImages.map((url, idx) => ({
    portfolioProjectId: projectId,
    imageUrl: url,
    imageType: 'before',
    sortOrder: idx,
  }))
  const after = afterImages.map((url, idx) => ({
    portfolioProjectId: projectId,
    imageUrl: url,
    imageType: 'after',
    sortOrder: idx,
  }))
   const all = [...before, ...after]

  // Use a generous timeout and a single bulk insert. Syncing many images with
  // one create() per row previously blew past Prisma's default 5s interactive
  // transaction timeout and returned a 500 on valid requests.
  await prisma.$transaction(async (tx) => {
    const existing = await tx.portfolioImage.findMany({
      where: { portfolioProjectId: projectId },
      select: { id: true, imageUrl: true, imageType: true },
    })
    const existingKeys = new Set(existing.map((img) => `${img.imageType}:${img.imageUrl}`))
    const existingIdsToDelete = existing.filter((img) => {
      return !all.some((newImg) => newImg.imageType === img.imageType && newImg.imageUrl === img.imageUrl)
    }).map((img) => img.id)

    if (existingIdsToDelete.length > 0) {
      await tx.portfolioImage.deleteMany({ where: { id: { in: existingIdsToDelete } } })
    }

    const toCreate = all.filter((newImg) => !existingKeys.has(`${newImg.imageType}:${newImg.imageUrl}`))
    if (toCreate.length > 0) {
      await tx.portfolioImage.createMany({ data: toCreate })
    }
  }, { timeout: 30000 })
}

function mapPortfolio(item, portfolioImages = []) {
  if (!item) return null

  const beforeImages = portfolioImages
    .filter((img) => img.imageType === 'before')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => img.imageUrl)

  const afterImages = portfolioImages
    .filter((img) => img.imageType === 'after')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => img.imageUrl)

  return {
    _id: item.id,
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    featured: item.featured,
    displayOrder: item.displayOrder,
    published: item.published,
    imageUrl: item.imageUrl,
    mediaUrl: item.imageUrl,
    cloudinaryId: item.cloudinaryId,
    homepageCircularImage: item.homepageCircularImage,
    homepageCircularImageId: item.homepageCircularImageId,
    beforeImages: beforeImages.length > 0 ? beforeImages : (item.beforeImages || []),
    afterImages: afterImages.length > 0 ? afterImages : (item.afterImages || []),
    portfolioImages: portfolioImages
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        imageType: img.imageType,
        sortOrder: img.sortOrder,
        cloudinaryId: img.cloudinaryId,
      })),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export const portfolioService = {
  listPortfolio,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  reorderPortfolioProjects,
  reorderPortfolioImages,
}

async function listPortfolio({ sort, limit = 100 } = {}) {
    let orderBy
    if (sort) {
      const field = sort.startsWith('-') ? sort.slice(1) : sort
      const dir = sort.startsWith('-') ? 'desc' : 'asc'
      orderBy = { [field]: dir }
    } else {
      orderBy = [{ displayOrder: 'asc' }, { createdAt: 'desc' }]
    }
    const items = await prisma.portfolioProject.findMany({
      orderBy,
      take: Number(limit) || 100,
      include: {
        portfolioImages: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, imageUrl: true, imageType: true, sortOrder: true, cloudinaryId: true },
        },
      },
    })
    return items.map((item) => mapPortfolio(item, item.portfolioImages))
  }

async function getPortfolio(id) {
  try {
    const item = await prisma.portfolioProject.findUnique({
      where: { id },
      include: {
        portfolioImages: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, imageUrl: true, imageType: true, sortOrder: true, cloudinaryId: true },
        },
      },
    })
    if (!item) throw failure(404, 'Portfolio item not found')
    return mapPortfolio(item, item.portfolioImages)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch portfolio item')
  }
}

async function uploadImageFiles(files, folder) {
  const tStart = Date.now()
  const urls = []
  const errors = []
  const uploadResults = await Promise.allSettled(
    files.map((f) => uploadFile(f.buffer, f.mimetype, folder)),
  )
  uploadResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      urls.push(result.value.url)
    } else {
      const file = files[index]
      const reason = result.reason?.message || 'Unknown upload error'
      errors.push({ file: file?.originalname || `file_${index}`, error: reason })
    }
  })
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[portfolioService] uploadImageFiles: ${files.length} files to ${folder} in ${Date.now() - tStart}ms (urls=${urls.length}, errors=${errors.length})`)
  }
  return { urls, errors }
}

async function createPortfolio(data, file, beforeFiles = [], afterFiles = [], circularFile = null) {
  const tStart = Date.now()
  const createData = { ...data }

  const existingBeforeCount = uniqueNonEmptyValues(data.beforeImages).length
  const existingAfterCount = uniqueNonEmptyValues(data.afterImages).length

  // Check limits BEFORE uploading to prevent orphaned Cloudinary files when
  // the total (existing + new) exceeds the maximum allowed per section, or when
  // the combined Before + After total exceeds the overall limit.
  enforceImageLimit('before', existingBeforeCount + beforeFiles.length, existingBeforeCount, beforeFiles.length)
  enforceImageLimit('after', existingAfterCount + afterFiles.length, existingAfterCount, afterFiles.length)
  enforceTotalLimit(
    existingBeforeCount + beforeFiles.length,
    existingAfterCount + afterFiles.length,
    existingBeforeCount,
    existingAfterCount,
    beforeFiles.length,
    afterFiles.length,
  )

  const beforeImages = [...(data.beforeImages || [])]
  const afterImages = [...(data.afterImages || [])]

  const uploadStart = Date.now()
  const [beforeResult, afterResult, mainResult, circularResult] = await Promise.allSettled([
    beforeFiles.length > 0 ? uploadImageFiles(beforeFiles, 'portfolio/before') : Promise.resolve({ urls: [], errors: [] }),
    afterFiles.length > 0 ? uploadImageFiles(afterFiles, 'portfolio/after') : Promise.resolve({ urls: [], errors: [] }),
    file ? uploadFile(file.buffer, file.mimetype, 'portfolio') : Promise.resolve(null),
    circularFile ? uploadFile(circularFile.buffer, circularFile.mimetype, 'portfolio') : Promise.resolve(null),
  ])
  const uploadElapsed = Date.now() - uploadStart

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${process.env.SERVER_ID || 'backend'}] [portfolioService] createPortfolio uploads completed in ${uploadElapsed}ms (before=${beforeFiles.length}, after=${afterFiles.length}, main=${!!file})`)
  }

  if (beforeResult.status === 'rejected') {
    throw failure(500, `Before upload failed: ${beforeResult.reason?.message || 'Unknown error'}`)
  }
  if (afterResult.status === 'rejected') {
    throw failure(500, `After upload failed: ${afterResult.reason?.message || 'Unknown error'}`)
  }
  if (mainResult.status === 'rejected') {
    throw failure(500, `Main image upload failed: ${mainResult.reason?.message || 'Unknown error'}`)
  }
  if (circularResult.status === 'rejected') {
    throw failure(500, `Circular tab image upload failed: ${circularResult.reason?.message || 'Unknown error'}`)
  }

  const { urls: beforeUrls, errors: beforeErrors } = beforeResult.value
  const { urls: afterUrls, errors: afterErrors } = afterResult.value
  const mainUploaded = mainResult.value
  const circularUploaded = circularResult.value

  if (beforeErrors.length > 0) {
    const errorDetails = beforeErrors.map((e) => `${e.file}: ${e.error}`).join('; ')
    throw failure(400, `Before upload failed: ${errorDetails}`)
  }
  if (afterErrors.length > 0) {
    const errorDetails = afterErrors.map((e) => `${e.file}: ${e.error}`).join('; ')
    throw failure(400, `After upload failed: ${errorDetails}`)
  }

  beforeImages.push(...beforeUrls)
  afterImages.push(...afterUrls)

  if (beforeImages.length > 0) createData.beforeImages = beforeImages
  if (afterImages.length > 0) createData.afterImages = afterImages

  if (mainUploaded) {
    createData.imageUrl = mainUploaded.url
    createData.cloudinaryId = mainUploaded.path
  } else if (!createData.imageUrl && (beforeImages.length > 0 || afterImages.length > 0)) {
    createData.imageUrl = beforeImages[0] || afterImages[0]
  }

  if (circularUploaded) {
    createData.homepageCircularImage = circularUploaded.url
    createData.homepageCircularImageId = circularUploaded.path
  }

  const dbStart = Date.now()
  const item = await prisma.portfolioProject.create({ data: createData })
  const dbElapsed = Date.now() - dbStart

  await syncPortfolioImages(item.id, beforeImages, afterImages)

  const total = Date.now() - tStart
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[portfolioService] createPortfolio: upload=${uploadElapsed}ms db=${dbElapsed}ms total=${total}ms (before=${beforeFiles.length}, after=${afterFiles.length}, main=${!!file})`)
  } else if (total > 5000) {
    console.warn(`[portfolioService] createPortfolio slow: upload=${uploadElapsed}ms db=${dbElapsed}ms total=${total}ms`)
  }

  return mapPortfolio(item)
}

async function updatePortfolio(id, data, file, beforeFiles = [], afterFiles = [], circularFile = null) {
  const existing = await prisma.portfolioProject.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Portfolio item not found')

  const updateData = { ...data }

  // Use the explicitly provided list when present (even if empty, which means
  // the client intentionally cleared this section). Otherwise keep existing.
  const beforeImages =
    updateData.beforeImages !== undefined
      ? [...(updateData.beforeImages || [])]
      : [...(existing.beforeImages || [])]
  const afterImages =
    updateData.afterImages !== undefined
      ? [...(updateData.afterImages || [])]
      : [...(existing.afterImages || [])]

  const uniqueBeforeCount = uniqueNonEmptyValues(beforeImages).length
  const uniqueAfterCount = uniqueNonEmptyValues(afterImages).length

  const uploadPromises = []
  const uploadStart = Date.now()

    // Check limits BEFORE uploading to prevent orphaned Cloudinary files.
    enforceImageLimit('before', uniqueBeforeCount + beforeFiles.length, uniqueBeforeCount, beforeFiles.length)
    enforceImageLimit('after', uniqueAfterCount + afterFiles.length, uniqueAfterCount, afterFiles.length)
    enforceTotalLimit(
      uniqueBeforeCount + beforeFiles.length,
      uniqueAfterCount + afterFiles.length,
      uniqueBeforeCount,
      uniqueAfterCount,
      beforeFiles.length,
      afterFiles.length,
    )

  if (file) {
    if (existing.cloudinaryId) uploadPromises.push(deleteFile(existing.cloudinaryId))
    uploadPromises.push(
      uploadFile(file.buffer, file.mimetype, 'portfolio').then((uploaded) => {
        updateData.imageUrl = uploaded.url
        updateData.cloudinaryId = uploaded.path
      }),
    )
  }

  if (circularFile) {
    if (existing.homepageCircularImageId) uploadPromises.push(deleteFile(existing.homepageCircularImageId))
    uploadPromises.push(
      uploadFile(circularFile.buffer, circularFile.mimetype, 'portfolio').then((uploaded) => {
        updateData.homepageCircularImage = uploaded.url
        updateData.homepageCircularImageId = uploaded.path
      }),
    )
  }

  if (beforeFiles.length > 0) {
    uploadPromises.push(
      uploadImageFiles(beforeFiles, 'portfolio/before').then(({ urls, errors }) => {
        if (errors.length > 0) {
          if (process.env.NODE_ENV !== 'production') {
            console.error(`[${process.env.SERVER_ID || 'backend'}] [portfolioService] updatePortfolio: ${errors.length} before upload errors`)
          }
          const errorDetails = errors.map((e) => `${e.file}: ${e.error}`).join('; ')
          throw failure(400, `Some before uploads failed: ${errorDetails}`)
        }
        beforeImages.push(...urls)
      }),
    )
  }

  if (afterFiles.length > 0) {
    uploadPromises.push(
      uploadImageFiles(afterFiles, 'portfolio/after').then(({ urls, errors }) => {
        if (errors.length > 0) {
          if (process.env.NODE_ENV !== 'production') {
            console.error(`[${process.env.SERVER_ID || 'backend'}] [portfolioService] updatePortfolio: ${errors.length} after upload errors`)
          }
          const errorDetails = errors.map((e) => `${e.file}: ${e.error}`).join('; ')
          throw failure(400, `Some after uploads failed: ${errorDetails}`)
        }
        afterImages.push(...urls)
      }),
    )
  }

  const uploadResults = await Promise.allSettled(uploadPromises)
  const uploadElapsed = Date.now() - uploadStart

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${process.env.SERVER_ID || 'backend'}] [portfolioService] updatePortfolio uploads completed in ${uploadElapsed}ms (beforeFiles=${beforeFiles.length}, afterFiles=${afterFiles.length})`)
  }

  const failedUploads = uploadResults.filter((r) => r.status === 'rejected')
  if (failedUploads.length > 0) {
    const reasons = failedUploads.map((r) => r.reason?.message || 'Unknown error').join('; ')
    throw failure(500, `Upload failed: ${reasons}`)
  }

  updateData.beforeImages = beforeImages
  updateData.afterImages = afterImages

  const item = await prisma.portfolioProject.update({ where: { id }, data: updateData })

  await syncPortfolioImages(id, beforeImages, afterImages)

  const updatedItem = await prisma.portfolioProject.findUnique({
    where: { id },
    include: {
      portfolioImages: {
        orderBy: { sortOrder: 'asc' },
        select: { id: true, imageUrl: true, imageType: true, sortOrder: true, cloudinaryId: true },
      },
    },
  })
  return mapPortfolio(updatedItem, updatedItem.portfolioImages)
}

async function deletePortfolio(id) {
  const existing = await prisma.portfolioProject.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Portfolio item not found')
  if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
  await deleteFiles([...(existing.beforeImages || []), ...(existing.afterImages || [])])
  await prisma.portfolioImage.deleteMany({ where: { portfolioProjectId: id } })
  await prisma.portfolioProject.delete({ where: { id } })
}

async function reorderPortfolioProjects(orderList) {
  if (!Array.isArray(orderList) || orderList.length === 0) {
    throw failure(400, 'Reorder list is required')
  }

  const normalized = orderList.map((item) => {
    const id = typeof item === 'string' ? item : item?.id
    if (!id) throw failure(400, 'Each reorder entry must contain a valid project id')
    return { id: String(id) }
  })

  const ids = normalized.map((x) => x.id)
  if (new Set(ids).size !== ids.length) {
    throw failure(400, 'Duplicate project IDs in reorder request')
  }

  const existing = await prisma.portfolioProject.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  })
  const foundIds = new Set(existing.map((e) => e.id))
  const missing = ids.filter((id) => !foundIds.has(id))
  if (missing.length > 0) {
    throw failure(400, `Unknown project IDs in reorder request: ${missing.join(', ')}`)
  }

  // Assign sequential displayOrder based on the provided sequence. This also
  // normalizes any gaps (e.g. 0,1,7,20 -> 0,1,2,3) and guarantees uniqueness.
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx.portfolioProject.update({
        where: { id: ids[i] },
        data: { displayOrder: i },
      })
    }
  }, { timeout: 30000 })

  return listPortfolio({ limit: 1000 })
}

async function reorderPortfolioImages(projectId, orderList) {
  const project = await prisma.portfolioProject.findUnique({ where: { id: projectId } })
  if (!project) throw failure(404, 'Portfolio item not found')

  // Newly added images are represented by blob: object URLs before they are
  // uploaded, so they have no database row yet and cannot be reordered here
  // (they are ordered during the normal project save). Drop them gracefully
  // instead of rejecting the whole request.
  const validList = Array.isArray(orderList)
    ? orderList.filter(
        (item) => !(item && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('blob:')),
      )
    : []

  const existingImages = await prisma.portfolioImage.findMany({
    where: { portfolioProjectId: projectId },
    select: { id: true, imageUrl: true, imageType: true, sortOrder: true },
  })

  const existingById = new Map(existingImages.map((img) => [img.id, img]))
  const existingByUrl = new Map(existingImages.map((img) => [`${img.imageType}:${img.imageUrl}`, img]))
  const seenIds = new Set()
  const seenUrls = new Set()

  for (const item of validList) {
    if (item.id !== undefined) {
      if (seenIds.has(item.id)) {
        throw failure(400, `Duplicate image ID: ${item.id}`)
      }
      seenIds.add(item.id)
      if (!existingById.has(item.id)) {
        throw failure(400, `Unknown image ID: ${item.id}`)
      }
    } else if (item.imageUrl !== undefined) {
      const key = `${item.imageType || 'before'}:${item.imageUrl}`
      if (seenUrls.has(key)) {
        throw failure(400, `Duplicate image URL: ${item.imageUrl}`)
      }
      seenUrls.add(key)
      if (!existingByUrl.has(key)) {
        throw failure(400, `Unknown image URL for type ${item.imageType}: ${item.imageUrl}`)
      }
    }

    if (item.sortOrder < 0) {
      throw failure(400, `Sort order must be non-negative: ${item.sortOrder}`)
    }
    if (item.imageType !== 'before' && item.imageType !== 'after') {
      throw failure(400, `Invalid image type: ${item.imageType}`)
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const item of validList) {
      let where
      if (item.id !== undefined) {
        where = { id: item.id }
      } else {
        const existing = await tx.portfolioImage.findFirst({
          where: {
            portfolioProjectId: projectId,
            imageType: item.imageType,
            imageUrl: item.imageUrl,
          },
        })
        if (!existing) {
          throw failure(400, `Image not found for type ${item.imageType}: ${item.imageUrl}`)
        }
        where = { id: existing.id }
      }
      await tx.portfolioImage.update({
        where,
        data: { sortOrder: item.sortOrder },
      })
    }
  }, { timeout: 30000 })

  const projectAfter = await prisma.portfolioProject.findUnique({
    where: { id: projectId },
    include: {
      portfolioImages: {
        orderBy: { sortOrder: 'asc' },
        select: { id: true, imageUrl: true, imageType: true, sortOrder: true, cloudinaryId: true },
      },
    },
  })
  return mapPortfolio(projectAfter, projectAfter.portfolioImages)
}
