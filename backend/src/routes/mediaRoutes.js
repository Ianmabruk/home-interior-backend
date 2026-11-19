import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { uploadSingle, uploadArray } from '../middleware/upload.js'
import { validateCsrfToken } from '../middleware/csrf.js'
import { generateCsrfToken } from '../middleware/csrf.js'
import { ApiError } from '../utils/ApiError.js'

const router = Router()

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v', 'video/x-msvideo', 'video/x-matroska']
const MAX_BATCH_FILES = 50

router.post('/upload', authenticate, validateCsrfToken, uploadSingle('media'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded')
  }
  const folder = req.body.folder || 'uploads'
  const type = req.body.resourceType || 'image'
  const allowed = type === 'video' ? [...IMAGE_TYPES, ...VIDEO_TYPES] : IMAGE_TYPES
  if (!allowed.includes(req.file.mimetype)) {
    throw new ApiError(400, 'Invalid file type')
  }
  const uploaded = await uploadFile(req.file.buffer, req.file.mimetype, folder)
  const csrfToken = generateCsrfToken()
  res.status(201).json({ success: true, data: { url: uploaded.url, path: uploaded.path, csrfToken } })
}))

router.post('/upload-batch', authenticate, validateCsrfToken, uploadArray('files', MAX_BATCH_FILES), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No files uploaded')
  }
  const folder = req.body.folder || 'uploads'
  const type = req.body.resourceType || 'image'
  const allowed = type === 'video' ? [...IMAGE_TYPES, ...VIDEO_TYPES] : IMAGE_TYPES
  const invalidFiles = req.files.filter((f) => !allowed.includes(f.mimetype))
  if (invalidFiles.length > 0) {
    throw new ApiError(400, `Invalid file type(s): ${invalidFiles.map((f) => f.mimetype).join(', ')}`)
  }

  const SERVER_ID = process.env.SERVER_ID || 'hok-api-01'
  const total = req.files.length
  console.log(`[${SERVER_ID}] [upload-batch] starting ${total} files to folder=${folder}`)

  const BATCH_CONCURRENCY = 3
  const results = []
  const errors = []

  for (let i = 0; i < total; i += BATCH_CONCURRENCY) {
    const batch = req.files.slice(i, i + BATCH_CONCURRENCY)
    const batchNum = Math.floor(i / BATCH_CONCURRENCY) + 1
    const totalBatches = Math.ceil(total / BATCH_CONCURRENCY)
    console.log(`[${SERVER_ID}] [upload-batch] processing batch ${batchNum}/${totalBatches}`)

    const settled = await Promise.allSettled(
      batch.map((file) => uploadFile(file.buffer, file.mimetype, folder)),
    )

    settled.forEach((r, j) => {
      const file = batch[j]
      const fileNum = i + j + 1
      if (r.status === 'fulfilled') {
        console.log(`[${SERVER_ID}] [upload-batch] file ${fileNum}/${total} succeeded: ${file.originalname}`)
        results.push({
          url: r.value.url,
          path: r.value.path,
          mimeType: r.value.mimeType,
          fileName: file.originalname,
        })
      } else {
        const err = r.reason
        console.error(`[${SERVER_ID}] [upload-batch] file ${fileNum}/${total} failed: ${file.originalname}`, err?.message || err)
        errors.push({
          fileName: file.originalname,
          error: err?.message || 'Upload failed',
          fileNum,
        })
      }
    })
  }

  console.log(`[${SERVER_ID}] [upload-batch] completed ${results.length} success, ${errors.length} errors`)

  const csrfToken = generateCsrfToken()
  if (errors.length > 0 && results.length === 0) {
    throw new ApiError(500, `All uploads failed: ${errors.map((e) => `${e.fileName}: ${e.error}`).join('; ')}`)
  }

  res.status(errors.length > 0 ? 207 : 201).json({
    success: true,
    data: {
      urls: results,
      errors: errors.length > 0 ? errors : undefined,
      total,
      successCount: results.length,
      errorCount: errors.length,
      csrfToken,
    },
  })
}))

router.post('/delete', authenticate, validateCsrfToken, asyncHandler(async (req, res) => {
  const { publicId, resourceType } = req.body
  if (!publicId) {
    throw new ApiError(400, 'publicId is required')
  }
  await deleteFile(publicId)
  res.json({ success: true, data: { message: 'Deleted' } })
}))

export default router
