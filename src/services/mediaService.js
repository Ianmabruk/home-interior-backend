import { api, ensureValidToken } from './api'

const MAX_IMAGE_BYTES = 100 * 1024 * 1024
const MAX_VIDEO_BYTES = 5 * 1024 * 1024 * 1024

const UPLOAD_STAGES = {
  FILE_VALIDATION: 'FILE_VALIDATION',
  IMAGE_COMPRESSION: 'IMAGE_COMPRESSION',
  VIDEO_VALIDATION: 'VIDEO_VALIDATION',
  SIGNATURE_GENERATION: 'SIGNATURE_GENERATION',
  AUTHENTICATION: 'AUTHENTICATION',
  CLOUDINARY_UPLOAD: 'CLOUDINARY_UPLOAD',
  CLOUDINARY_PROCESSING: 'CLOUDINARY_PROCESSING',
  DATABASE_SAVE: 'DATABASE_SAVE',
  BLOG_PUBLISHING: 'BLOG_PUBLISHING',
}

function isVideoFile(file) {
  return file?.type?.startsWith('video/')
    || /\.(mp4|mov|m4v|webm|avi|mkv|3gp|ogv|ogg)$/i.test(file?.name || '')
}

function isImageFile(file) {
  return file?.type?.startsWith('image/')
    || /\.(jpe?g|png|webp|gif|avif)$/i.test(file?.name || '')
}

function validateFile(file) {
  if (!file) {
    return { valid: false, stage: UPLOAD_STAGES.FILE_VALIDATION, code: 'NO_FILE', message: 'No file provided' }
  }
  if (file.size === 0) {
    return { valid: false, stage: UPLOAD_STAGES.FILE_VALIDATION, code: 'EMPTY_FILE', message: 'File is empty' }
  }
  if (isVideoFile(file)) {
    if (file.size > MAX_VIDEO_BYTES) {
      return { valid: false, stage: UPLOAD_STAGES.VIDEO_VALIDATION, code: 'VIDEO_TOO_LARGE', message: `Video exceeds maximum size of 5 GB` }
    }
    return { valid: true }
  }
  if (isImageFile(file)) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { valid: false, stage: UPLOAD_STAGES.FILE_VALIDATION, code: 'IMAGE_TOO_LARGE', message: `Image exceeds maximum size of 100 MB` }
    }
    return { valid: true }
  }
  return { valid: false, stage: UPLOAD_STAGES.FILE_VALIDATION, code: 'INVALID_TYPE', message: 'Unsupported file type' }
}

function createUploadError(stage, code, message, details = null, retryable = false) {
  const error = new Error(message)
  error.stage = stage
  error.code = code
  error.details = details
  error.retryable = retryable
  return error
}

async function compressImage(file, options = {}) {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.82, format = 'image/webp' } = options

  if (!file || !file.type.startsWith('image/')) return file
  if (file.type === 'image/avif' || file.type === 'image/webp' || file.type === 'image/gif') {
    if (file.size <= 500 * 1024) return file
  } else if (file.size <= 300 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d', { alpha: false })
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file)
            return
          }
          const optimized = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
            type: format,
            lastModified: file.lastModified,
          })
          resolve(optimized)
        },
        format,
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}

async function uploadWithProgress(url, formData, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve(data)
        } catch {
          resolve({})
        }
      } else {
        let message = `Upload failed with status ${xhr.status}`
        let details
        try {
          const data = JSON.parse(xhr.responseText)
          message = data.message || message
          details = data
        } catch {
          details = xhr.responseText
        }
        const retryable = [408, 429, 500, 502, 503, 504].includes(xhr.status)
        const err = createUploadError(UPLOAD_STAGES.CLOUDINARY_UPLOAD, `HTTP_${xhr.status}`, message, details, retryable)
        // details is stored on err.details for error reporting
        void err.details
        reject(err)
      }
    })

    xhr.addEventListener('error', () => {
      reject(createUploadError(UPLOAD_STAGES.CLOUDINARY_UPLOAD, 'NETWORK_ERROR', 'Network error during upload', null, true))
    })

    xhr.addEventListener('abort', () => {
      const err = new Error('Upload aborted')
      err.name = 'AbortError'
      reject(err)
    })

    xhr.addEventListener('timeout', () => {
      reject(createUploadError(UPLOAD_STAGES.CLOUDINARY_UPLOAD, 'TIMEOUT', 'Upload timed out', null, true))
    })

    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort()
      })
    }

    xhr.open('POST', url)
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('hok_access_token')}`)
    const csrfToken = localStorage.getItem('hok_csrf_token')
    if (csrfToken) {
      xhr.setRequestHeader('x-csrf-token', csrfToken)
    }
    xhr.timeout = 300000
    xhr.send(formData)
  })
}

export const mediaService = {
  UPLOAD_STAGES,

  async upload(file, folder = 'hok-interiors', uploadId = null, handlers = {}) {
    const validation = validateFile(file)
    if (!validation.valid) {
      throw createUploadError(validation.stage, validation.code, validation.message)
    }

    if (isVideoFile(file)) {
      return this.uploadVideo(file, folder, uploadId, handlers)
    }

    return this.uploadImage(file, folder, uploadId, handlers)
  },

  async uploadImage(file, folder = 'hok-interiors', uploadId = null, handlers = {}) {
    const { onPhase, onUploadProgress, signal } = handlers

    onPhase?.(UPLOAD_STAGES.IMAGE_COMPRESSION)

    try {
      const compressedFile = await compressImage(file)
      onPhase?.(UPLOAD_STAGES.AUTHENTICATION)
      await ensureValidToken()

      const formData = new FormData()
      formData.append('media', compressedFile)
      formData.append('folder', folder)
      if (uploadId) formData.append('uploadId', uploadId)

      onPhase?.(UPLOAD_STAGES.CLOUDINARY_UPLOAD)

      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
      const response = await uploadWithProgress(
        `${API_BASE_URL}/media/upload`,
        formData,
        onUploadProgress,
        signal,
      )

      onPhase?.(UPLOAD_STAGES.CLOUDINARY_PROCESSING)

      const upload = response.data
      if (!upload?.url || !upload?.publicId) {
        throw createUploadError(UPLOAD_STAGES.CLOUDINARY_PROCESSING, 'INVALID_RESPONSE', 'Image upload did not return valid upload details')
      }

      onPhase?.(UPLOAD_STAGES.DATABASE_SAVE)

      return {
        secureUrl: upload.secureUrl || upload.url,
        publicId: upload.publicId,
        assetId: upload.assetId || upload.publicId,
        resourceType: 'image',
        type: upload.type || 'upload',
        version: upload.version ?? null,
        format: upload.format || 'webp',
        mimeType: file.type || 'image/webp',
        originalName: file.name,
        duration: upload.duration ?? null,
        width: upload.width ?? null,
        height: upload.height ?? null,
        bytes: upload.bytes || file.size,
        originalBytes: file.size,
        compressedBytes: upload.bytes || file.size,
        // Legacy fields for backward compatibility with backend database columns
        storageProvider: 'cloudinary',
        providerAssetId: upload.publicId,
        mediaType: 'image',
        originalFilename: file.name,
        fileSize: file.size,
        uploadStatus: 'ready',
      }
    } catch (err) {
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') throw err
      if (err?.stage) throw err
      throw createUploadError(UPLOAD_STAGES.CLOUDINARY_UPLOAD, 'UPLOAD_FAILED', err?.message || 'Image upload failed', err, true)
    }
  },

  async uploadVideo(file, folder = 'hok-interiors', uploadId = null, handlers = {}) {
    const { onPhase, onUploadProgress, signal } = handlers

    onPhase?.(UPLOAD_STAGES.VIDEO_VALIDATION)

    const validation = validateFile(file)
    if (!validation.valid) {
      throw createUploadError(validation.stage, validation.code, validation.message)
    }

    onPhase?.(UPLOAD_STAGES.AUTHENTICATION)
    await ensureValidToken()

    const formData = new FormData()
    formData.append('media', file)
    formData.append('folder', folder)
    if (uploadId) formData.append('uploadId', uploadId)

    onPhase?.(UPLOAD_STAGES.CLOUDINARY_UPLOAD)

    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
    const response = await uploadWithProgress(
      `${API_BASE_URL}/media/video/upload`,
      formData,
      onUploadProgress,
      signal,
    )

    onPhase?.(UPLOAD_STAGES.CLOUDINARY_PROCESSING)

    const upload = response.data
    if (!upload?.url || !upload?.publicId) {
      throw createUploadError(UPLOAD_STAGES.CLOUDINARY_PROCESSING, 'INVALID_RESPONSE', 'Video upload did not return valid upload details')
    }

    onPhase?.(UPLOAD_STAGES.DATABASE_SAVE)

    return {
      secureUrl: upload.secureUrl || upload.url,
      publicId: upload.publicId,
      assetId: upload.assetId || upload.publicId,
      resourceType: 'video',
      type: upload.type || 'upload',
      version: upload.version ?? null,
      format: upload.format || 'mp4',
      mimeType: file.type || 'video/mp4',
      originalName: file.name,
      duration: upload.duration ?? null,
      width: upload.width ?? null,
      height: upload.height ?? null,
      bytes: upload.bytes || file.size,
      originalBytes: file.size,
      compressedBytes: upload.bytes || file.size,
      // Legacy fields for backward compatibility with backend database columns
      storageProvider: 'cloudinary',
      providerAssetId: upload.publicId,
      playbackUrl: upload.secureUrl || upload.url,
      thumbnailUrl: upload.thumbnailUrl || null,
      uploadStatus: 'ready',
      originalFilename: file.name,
      fileSize: file.size,
    }
  },

  async uploadMultiple(files, folder = 'hok-interiors') {
    const results = []
    for (const file of files) {
      try {
        const asset = await this.upload(file, folder)
        results.push({ success: true, asset })
      } catch (err) {
        results.push({ success: false, error: err, fileName: file.name })
      }
    }
    return results
  },

  async delete(publicId, resourceType = 'cloudinary') {
    const response = await api.post('/media/delete', { publicId, resourceType })
    return response.data
  },

  getOptimizedUrl(publicId, options = {}) {
    if (!publicId) return null
    const { width, height, crop = 'limit', quality = 'auto', format = 'auto' } = options
    const transformations = []
    if (width) transformations.push(`w_${width}`)
    if (height) transformations.push(`h_${height}`)
    if (crop) transformations.push(`c_${crop}`)
    if (quality) transformations.push(`q_${quality}`)
    if (format) transformations.push(`f_${format}`)
    const transformString = transformations.join(',')
    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}/${publicId}`
  },

  getSrcSet(publicId, widths = [400, 800, 1200, 1600, 1920]) {
    if (!publicId) return ''
    return widths
      .map((w) => `${this.getOptimizedUrl(publicId, { width: w })} ${w}w`)
      .join(', ')
  },
}

export default mediaService
export { UPLOAD_STAGES }