import { v2 as cloudinary } from 'cloudinary'
import { failure } from '../utils/response.js'

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

export const isImageCloudinaryConfigured = () =>
  Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)

const isImageConfigured = isImageCloudinaryConfigured()

export function assertImageCloudinaryConfigured() {
  if (!isImageConfigured) {
    throw new Error('Image Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.')
  }
}

const UPLOAD_TIMEOUT_MS = 300000
const MAX_RETRIES = 2
const RETRY_BASE_DELAY_MS = 2000

const imageConfig = isImageConfigured
  ? {
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    }
  : null

let imageConfigLock = Promise.resolve()

async function withImageConfigAsync(fn) {
  if (!isImageConfigured) {
    assertImageCloudinaryConfigured()
  }
  imageConfigLock = imageConfigLock.then(async () => {
    const previousConfig = { ...cloudinary.config() }
    cloudinary.config(imageConfig)
    try {
      return await fn()
    } finally {
      cloudinary.config(previousConfig)
    }
  })
  return imageConfigLock
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableCloudinaryError(err) {
  if (!err) return false
  const httpCode = err?.http_code
  if (httpCode && httpCode >= 500) return true
  if (err?.message?.includes('timed out')) return true
  if (err?.message?.includes('ECONNRESET')) return true
  if (err?.message?.includes('ETIMEDOUT')) return true
  if (err?.name === 'TypeError') return true
  return false
}

export const uploadImage = async (buffer, mimetype, folder, originalName, uploadId = null) => {
  if (!isImageConfigured) {
    assertImageCloudinaryConfigured()
  }

  if (!mimetype?.startsWith('image/')) {
    throw failure(400, 'Image Cloudinary upload only accepts image files.')
  }

  const publicId = uploadId || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  let lastError = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
      console.log(`[Cloudinary Image] Retrying upload (attempt ${attempt + 1}/${MAX_RETRIES + 1}) after ${delay}ms`)
      await sleep(delay)
    }

    try {
      const uploadOptions = {
        resource_type: 'image',
        folder,
        public_id: publicId,
        overwrite: true,
        quality: 'auto:good',
      }

      const result = await withImageConfigAsync(() => new Promise((resolve, reject) => {
        let settled = false
        const timer = setTimeout(() => {
          if (settled) return
          settled = true
          reject(new Error('Cloudinary image upload timed out after 300000ms'))
        }, UPLOAD_TIMEOUT_MS)
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (settled) return
            clearTimeout(timer)
            if (error) {
              console.error('[Cloudinary Image] Upload stream error:', {
                message: error.message,
                http_code: error.http_code,
                name: error.name,
              })
              reject(error)
            } else {
              resolve(result)
            }
          },
        ).end(buffer)
      }))

      if (!result?.secure_url) {
        throw new Error('Cloudinary image upload did not return a secure media URL')
      }

      const duration = Number(result.duration)
      return {
        url: result.secure_url,
        originalUrl: result.secure_url,
        assetId: result.asset_id || null,
        publicId: result.public_id,
        mimeType: mimetype,
        originalName: originalName || null,
        resourceType: result.resource_type || 'image',
        type: result.type || 'upload',
        version: result.version != null && Number.isFinite(Number(result.version))
          ? Number(result.version)
          : null,
        format: result.format || null,
        originalFormat: result.format || null,
        duration: Number.isFinite(duration) ? duration : null,
        width: Number.isFinite(Number(result.width)) ? Number(result.width) : null,
        height: Number.isFinite(Number(result.height)) ? Number(result.height) : null,
        bytes: Number.isFinite(Number(result.bytes)) ? Number(result.bytes) : null,
      }
    } catch (err) {
      lastError = err
      console.error('[Cloudinary Image] Upload failed:', {
        message: err?.message,
        http_code: err?.http_code,
        name: err?.name,
        folder,
        mimetype,
        bufferLength: buffer?.length || buffer?.byteLength || 'unknown',
        attempt,
      })

      if (attempt >= MAX_RETRIES || !isRetryableCloudinaryError(err)) {
        throw err
      }
    }
  }

  throw lastError
}

export const deleteImage = async (publicId) => {
  if (!publicId || !isImageConfigured) return
  return withImageConfigAsync(async () => {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
    } catch (error) {
      console.error('Cloudinary image delete error:', error)
    }
  })
}

export const deleteManyImages = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return
  await Promise.allSettled(publicIds.map(deleteImage))
}

export default cloudinary