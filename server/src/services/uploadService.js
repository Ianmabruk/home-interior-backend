import streamifier from 'streamifier'
import cloudinary from '../config/cloudinary.js'
import { ApiError } from '../utils/ApiError.js'

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])
const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
])

const MAX_ATTEMPTS = 2
const retryDelay = (attempt) => 500 * attempt

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const classifyCloudinaryError = (error) => {
  const message = String(error?.message || error || '').toLowerCase()

  if (
    message.includes('invalid api key') ||
    message.includes('unknown api key') ||
    message.includes('authentication')
  ) {
    return 'Invalid Cloudinary credentials'
  }

  if (message.includes('timeout') || message.includes('timed out') || message.includes('econnreset')) {
    return 'Upload timed out. Please try again.'
  }

  if (
    message.includes('unsupported') ||
    message.includes('format') ||
    message.includes('type')
  ) {
    return 'Unsupported file format.'
  }

  if (message.includes('quota') || message.includes('limit') || message.includes('bandwidth')) {
    return 'Cloudinary quota exceeded.'
  }

  if (message.includes('file too large') || message.includes('too big')) {
    return 'File too large.'
  }

  return 'Cloudinary upload failed.'
}

const uploadOnce = (fileBuffer, folder, resourceType) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }
        resolve(result)
      },
    )

    streamifier.createReadStream(fileBuffer).pipe(uploadStream)
  })

const uploadWithRetry = async (fileBuffer, folder, resourceType, mimeType = null) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new ApiError(400, 'No file buffer provided')
  }

  const isVideo = resourceType === 'video'
  const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES
  const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES
  const resourceLabel = isVideo ? 'Video' : 'Image'

  console.log('[UPLOAD] Validating payload:', {
    folder,
    resourceType,
    bufferSize: fileBuffer.length,
    mimeType,
    maxSize,
  })

  if (fileBuffer.length > maxSize) {
    console.log('[UPLOAD] File size exceeds limit:', { size: fileBuffer.length, max: maxSize })
    throw new ApiError(
      413,
      `${resourceLabel} exceeds ${Math.floor(maxSize / 1024 / 1024)}MB limit.`,
    )
  }

  if (mimeType && !allowedTypes.has(mimeType)) {
    console.log('[UPLOAD] Unsupported file type:', { mimeType, allowedTypes: Array.from(allowedTypes) })
    throw new ApiError(415, `Unsupported file type: ${mimeType}`)
  }

  let lastError
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log('[UPLOAD] Cloudinary attempt', attempt, 'of', MAX_ATTEMPTS, { folder, resourceType })
      const result = await uploadOnce(fileBuffer, folder, resourceType)
      console.log('[UPLOAD] Cloudinary upload succeeded:', {
        folder,
        resourceType,
        publicId: result.public_id,
      })
      return result
    } catch (error) {
      lastError = error
      console.error(`[UPLOAD] Cloudinary attempt ${attempt} failed:`, error?.message || error)
      if (attempt < MAX_ATTEMPTS) {
        await sleep(retryDelay(attempt))
      }
    }
  }

  const friendlyMessage = classifyCloudinaryError(lastError)
  console.error('[UPLOAD] All Cloudinary attempts failed:', lastError)
  throw new ApiError(502, friendlyMessage)
}

export const uploadImage = async (fileBuffer, folder, mimeType = null) => {
  try {
    return await uploadWithRetry(fileBuffer, folder, 'image', mimeType)
  } catch (error) {
    if (error instanceof ApiError) throw error
    console.error('[UPLOAD] uploadImage unexpected error:', error)
    throw new ApiError(502, 'Image upload failed.')
  }
}

export const uploadVideo = async (fileBuffer, folder, mimeType = null) => {
  try {
    return await uploadWithRetry(fileBuffer, folder, 'video', mimeType)
  } catch (error) {
    if (error instanceof ApiError) throw error
    console.error('[UPLOAD] uploadVideo unexpected error:', error)
    throw new ApiError(502, 'Video upload failed.')
  }
}

export const uploadToCloudinary = (fileBuffer, folder, resourceType = 'image', mimeType = null) =>
  resourceType === 'video'
    ? uploadVideo(fileBuffer, folder, mimeType)
    : uploadImage(fileBuffer, folder, mimeType)
