import { v2 as cloudinary } from 'cloudinary'
import { failure } from '../utils/response.js'

const CLOUDINARY_VIDEO_CLOUD_NAME = process.env.CLOUDINARY_VIDEO_CLOUD_NAME
const CLOUDINARY_VIDEO_API_KEY = process.env.CLOUDINARY_VIDEO_API_KEY
const CLOUDINARY_VIDEO_API_SECRET = process.env.CLOUDINARY_VIDEO_API_SECRET

export const isVideoCloudinaryConfigured = () =>
  Boolean(CLOUDINARY_VIDEO_CLOUD_NAME && CLOUDINARY_VIDEO_API_KEY && CLOUDINARY_VIDEO_API_SECRET)

const isVideoConfigured = isVideoCloudinaryConfigured()

export function assertVideoCloudinaryConfigured() {
  if (!isVideoConfigured) {
    throw new Error('Video Cloudinary is not configured. Set CLOUDINARY_VIDEO_CLOUD_NAME, CLOUDINARY_VIDEO_API_KEY, and CLOUDINARY_VIDEO_API_SECRET.')
  }
}

const STANDARD_UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024
const CHUNK_SIZE_BYTES = 20 * 1024 * 1024
const UPLOAD_TIMEOUT_MS = 600000
const MAX_RETRIES = 2
const RETRY_BASE_DELAY_MS = 3000

const videoConfig = isVideoConfigured
  ? {
      cloud_name: CLOUDINARY_VIDEO_CLOUD_NAME,
      api_key: CLOUDINARY_VIDEO_API_KEY,
      api_secret: CLOUDINARY_VIDEO_API_SECRET,
      secure: true,
    }
  : null

let videoConfigLock = Promise.resolve()

async function withVideoConfigAsync(fn) {
  if (!isVideoConfigured) {
    assertVideoCloudinaryConfigured()
  }
  videoConfigLock = videoConfigLock.then(async () => {
    const previousConfig = { ...cloudinary.config() }
    cloudinary.config(videoConfig)
    try {
      return await fn()
    } finally {
      cloudinary.config(previousConfig)
    }
  })
  return videoConfigLock
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

async function uploadVideoStandard(buffer, mimetype, folder, originalName, uploadId) {
  const publicId = uploadId || `video-${Date.now()}-${Math.random().toString(36).slice(2)}`
  let lastError = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
      console.log(`[Cloudinary Video] Retrying standard upload (attempt ${attempt + 1}/${MAX_RETRIES + 1}) after ${delay}ms`)
      await sleep(delay)
    }

    try {
      const uploadOptions = {
        resource_type: 'video',
        folder,
        public_id: publicId,
        overwrite: true,
        quality: 'auto:good',
      }

      const result = await withVideoConfigAsync(() => new Promise((resolve, reject) => {
        let settled = false
        const timer = setTimeout(() => {
          if (settled) return
          settled = true
          reject(new Error('Cloudinary video upload timed out after 300000ms'))
        }, UPLOAD_TIMEOUT_MS)
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (settled) return
            clearTimeout(timer)
            if (error) {
              console.error('[Cloudinary Video] Standard upload stream error:', {
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
        throw new Error('Cloudinary video upload did not return a secure media URL')
      }

      const duration = Number(result.duration)
      return {
        url: result.secure_url,
        originalUrl: result.secure_url,
        assetId: result.asset_id || null,
        publicId: result.public_id,
        mimeType: mimetype,
        originalName: originalName || null,
        resourceType: result.resource_type || 'video',
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
      console.error('[Cloudinary Video] Standard upload failed:', {
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

async function uploadVideoChunked(buffer, mimetype, folder, originalName, uploadId) {
  const publicId = uploadId || `video-${Date.now()}-${Math.random().toString(36).slice(2)}`
  let lastError = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
      console.log(`[Cloudinary Video] Retrying chunked upload (attempt ${attempt + 1}/${MAX_RETRIES + 1}) after ${delay}ms`)
      await sleep(delay)
    }

    try {
      const uploadOptions = {
        resource_type: 'video',
        folder,
        public_id: publicId,
        overwrite: true,
        quality: 'auto:good',
        chunk_size: CHUNK_SIZE_BYTES,
      }

      const result = await withVideoConfigAsync(() =>
        cloudinary.uploader.upload_large(buffer, uploadOptions)
      )

      if (!result?.secure_url) {
        throw new Error('Cloudinary video chunked upload did not return a secure media URL')
      }

      const duration = Number(result.duration)
      return {
        url: result.secure_url,
        originalUrl: result.secure_url,
        assetId: result.asset_id || null,
        publicId: result.public_id,
        mimeType: mimetype,
        originalName: originalName || null,
        resourceType: result.resource_type || 'video',
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
      console.error('[Cloudinary Video] Chunked upload failed:', {
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

export const uploadVideo = async (buffer, mimetype, folder, originalName, uploadId = null) => {
  if (!isVideoConfigured) {
    assertVideoCloudinaryConfigured()
  }

  if (!mimetype?.startsWith('video/')) {
    throw failure(400, 'Video Cloudinary upload only accepts video files.')
  }

  const fileSize = buffer?.length || buffer?.byteLength || 0
  const useChunkedUpload = fileSize > STANDARD_UPLOAD_LIMIT_BYTES

  if (useChunkedUpload) {
    console.log(`[Cloudinary Video] File size ${Math.round(fileSize / 1024 / 1024)} MB exceeds 100 MB standard limit, using chunked upload`)
    return uploadVideoChunked(buffer, mimetype, folder, originalName, uploadId)
  }

  return uploadVideoStandard(buffer, mimetype, folder, originalName, uploadId)
}

export const deleteVideo = async (publicId) => {
  if (!publicId || !isVideoConfigured) return
  return withVideoConfigAsync(async () => {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' })
    } catch (error) {
      console.error('Cloudinary video delete error:', error)
    }
  })
}

export const deleteManyVideos = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return
  await Promise.allSettled(publicIds.map(deleteVideo))
}

export default cloudinary