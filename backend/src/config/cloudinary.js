import { v2 as cloudinary } from 'cloudinary'

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

export const isCloudinaryConfigured = () => Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
const isConfigured = isCloudinaryConfigured()

export function assertCloudinaryConfigured() {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.')
  }
}

// Cloudinary upload timeout. Large portfolio images (>10MB after compression)
// can take 60-90 seconds to upload on slower connections. 120s provides a
// comfortable margin while still failing fast enough to surface errors.
const CLOUDINARY_UPLOAD_TIMEOUT_MS = 120000
// Number of retry attempts for transient Cloudinary failures (network errors,
// timeouts, 5xx responses). Retries use a new public_id each time to avoid
// duplicate uploads.
const CLOUDINARY_MAX_RETRIES = 2
const CLOUDINARY_RETRY_BASE_DELAY_MS = 2000

// Video containers browsers can be handed directly. Anything else (.mov, .avi,
// .mkv, .webm, .ogv …) is stored as-is but only ever delivered through the
// eager MP4 derivative below.
const VIDEO_EXTENSIONS = new Set([
  'mp4', 'm4v', 'mov', 'webm', 'ogv', 'ogg', 'avi', 'mkv', 'mpeg', 'mpg', '3gp', '3g2', 'm2ts', 'mts',
])

// The single delivery format for every uploaded video: MP4 / H.264 / AAC /
// yuv420p. This is the combination iOS Safari, Chrome and Firefox all decode
// without a fallback source. `eager` makes Cloudinary build it during the
// upload call, so playback never waits on a first-request transcode.
const WEB_VIDEO_EAGER = {
  format: 'mp4',
  video_codec: 'h264',
  audio_codec: 'aac',
  pixel_format: 'yuv420p',
  bit_rate: '4m',
}

const getFileExtension = (name) => {
  if (typeof name !== 'string') return ''
  const clean = name.split('?')[0].split('#')[0]
  const idx = clean.lastIndexOf('.')
  return idx === -1 ? '' : clean.slice(idx + 1).toLowerCase()
}

// A file is a video if the browser said so, or if the name says so. The
// multipart MIME is client-supplied and browsers frequently report
// `application/octet-stream` for .mov/.mkv, which previously made these
// uploads fall through to resource_type "auto" and land in the wrong bucket.
export const isVideoFile = (mimetype, originalName) => {
  if (typeof mimetype === 'string' && mimetype.toLowerCase().startsWith('video/')) return true
  return VIDEO_EXTENSIONS.has(getFileExtension(originalName))
}

// Rebuild the eager web-playback URL from a stored public id. Used at delivery
// time so existing rows keep working without a migration or re-upload.
export const getWebPlayableVideoUrl = (publicId, { cloudName = CLOUDINARY_CLOUD_NAME, width } = {}) => {
  if (!publicId || !cloudName) return null
  const parts = []
  if (width) parts.push(`w_${width}`, 'c_limit')
  parts.push('f_mp4', 'vc_h264', 'ac_aac')
  return `https://res.cloudinary.com/${cloudName}/video/upload/${parts.join(',')}/${publicId}.mp4`
}

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableCloudinaryError(err) {
  if (!err) return false
  // Cloudinary SDK errors have http_code property
  const httpCode = err?.http_code
  if (httpCode && httpCode >= 500) return true
  // Network/timeout errors
  if (err?.message?.includes('timed out')) return true
  if (err?.message?.includes('ECONNRESET')) return true
  if (err?.message?.includes('ETIMEDOUT')) return true
  if (err?.name === 'TypeError') return true
  return false
}

export const uploadToCloudinary = async (buffer, mimetype, folder, originalName) => {
  if (!isConfigured) {
    assertCloudinaryConfigured()
  }

  const isVideoUpload = isVideoFile(mimetype, originalName)
  let lastError = null
  for (let attempt = 0; attempt <= CLOUDINARY_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = CLOUDINARY_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
      console.log(`[Cloudinary] Retrying upload (attempt ${attempt + 1}/${CLOUDINARY_MAX_RETRIES + 1}) after ${delay}ms`)
      await sleep(delay)
    }

    try {
      const publicId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

      const uploadOptions = {
        resource_type: 'auto',
        folder,
        public_id: publicId,
        overwrite: false,
        quality: 'auto:good',
      }

      if (isVideoUpload) {
        // Always bucket videos explicitly. Relying on "auto" mis-filed
        // client-reported octet-streams as images, producing a permanently
        // unplayable record.
        uploadOptions.resource_type = 'video'
        // Build the browser-compatible MP4 now, while we still hold the
        // upload request open. Delivering an un-transformed URL instead would
        // push a transcode onto the first viewer, and mobile Safari abandons
        // that slow first request — the cause of the phone-only failures.
        // The original asset is left untouched next to this derivative.
        uploadOptions.eager = [WEB_VIDEO_EAGER]
        uploadOptions.eager_async = false
      }

      const result = await new Promise((resolve, reject) => {
        let settled = false
        const timer = setTimeout(() => {
          if (settled) return
          settled = true
          reject(new Error('Cloudinary upload timed out after 120000ms'))
        }, CLOUDINARY_UPLOAD_TIMEOUT_MS)
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (settled) return
            clearTimeout(timer)
            if (error) {
              console.error('[Cloudinary] Upload stream error:', {
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
      })

      if (!result?.secure_url) {
        throw new Error('Cloudinary upload did not return a secure media URL')
      }

      let playableUrl = result.secure_url
      let playableFormat = result.format || null

      if (isVideoUpload) {
        if (result.resource_type !== 'video') {
          throw new Error(`Cloudinary stored the video as ${result.resource_type || 'an unknown resource type'}`)
        }
        // Prefer the eager H.264/AAC/MP4 derivative. It is already generated,
        // so playback is an immediate CDN hit instead of an on-demand transcode.
        const eagerEntry = Array.isArray(result.eager) ? result.eager[0] : null
        if (eagerEntry?.secure_url) {
          playableUrl = eagerEntry.secure_url
          playableFormat = eagerEntry.format || 'mp4'
        } else if (getFileExtension(result.format) !== 'mp4') {
          // No derivative and the original is not an MP4 — fail loudly rather
          // than persisting a record that can never play in a browser.
          throw new Error(
            `Cloudinary produced no web-compatible MP4 for "${result.format || 'unknown'}" and the original is not an MP4`
          )
        }
      }

      const duration = Number(result.duration)
      return {
        // `url` is what the public site plays. `originalUrl` keeps the untouched
        // source asset addressable for re-processing later.
        url: playableUrl,
        originalUrl: result.secure_url,
        publicId: result.public_id,
        mimeType: mimetype,
        originalName: originalName || null,
        resourceType: result.resource_type || null,
        format: playableFormat,
        originalFormat: result.format || null,
        duration: Number.isFinite(duration) ? duration : null,
        width: Number.isFinite(Number(result.width)) ? Number(result.width) : null,
        height: Number.isFinite(Number(result.height)) ? Number(result.height) : null,
        bytes: Number.isFinite(Number(result.bytes)) ? Number(result.bytes) : null,
      }
    } catch (err) {
      lastError = err
      console.error('[Cloudinary] Upload failed:', {
        message: err?.message,
        http_code: err?.http_code,
        name: err?.name,
        folder,
        mimetype,
        bufferLength: buffer?.length || buffer?.byteLength || 'unknown',
        attempt,
      })

      if (attempt >= CLOUDINARY_MAX_RETRIES || !isRetryableCloudinaryError(err)) {
        throw err
      }
    }
  }

  throw lastError
}

export const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
  if (!publicId || !isConfigured) return
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (error) {
    console.error('Cloudinary delete error:', error)
  }
}

export const deleteManyFromCloudinary = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return
  await Promise.allSettled(publicIds.map(deleteFromCloudinary))
}

export default cloudinary
