import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { supabase, isSupabaseConfigured } from '../config/supabase.js'
import { uploadToCloudinary, deleteFromCloudinary, deleteManyFromCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js'
import { failure } from '../utils/response.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads')

const MAX_IMAGE_WIDTH = 2048
const MAX_IMAGE_HEIGHT = 2048
const IMAGE_QUALITY_LEVELS = [80, 72, 64, 56, 48]
const IMAGE_PROCESSING_TIMEOUT_SECONDS = 60
export const CLOUDINARY_IMAGE_TARGET_BYTES = 9 * 1024 * 1024

// Pre-upload size check: warn if the optimized buffer is large enough to risk
// hitting Cloudinary's 120s timeout on slower connections. This is a soft
// threshold — uploads above it still proceed, but the error message will
// include guidance to reduce file size.
const LARGE_UPLOAD_WARN_THRESHOLD = 15 * 1024 * 1024 // 15MB

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch {
    // Non-fatal — directory may already exist
  }
}

export async function optimizeImageBuffer(buffer, mimetype, maxBytes = null) {
  if (!buffer || !mimetype || !mimetype.startsWith('image/')) {
    return buffer
  }

  const mustFit = Number.isFinite(maxBytes) && buffer.length > maxBytes
  try {
    const metadata = await sharp(buffer).metadata()
    const { width, height } = metadata

    if (!width || !height) {
      if (mustFit) throw new Error('Image dimensions could not be determined')
      return buffer
    }

    const needsResize = width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT
    if (!needsResize && !mustFit) return buffer

    const output = await processImageBuffer(buffer, metadata, maxBytes)
    if (mustFit && output.length > maxBytes) {
      throw new Error('Optimized image is still larger than the upload limit')
    }
    return output
  } catch (err) {
    if (mustFit) {
      console.warn(`[uploadService] Image optimization failed; rejecting oversized image: ${err?.message || err}`)
      throw failure(422, "This image could not be optimized below Cloudinary's 10 MB image limit. Try a smaller or lower-resolution image.")
    }
    console.warn(`[uploadService] Image optimization failed, using original: ${err?.message || err}`)
    return buffer
  }
}

async function processImageBuffer(buffer, metadata, maxBytes) {
  const { width, height } = metadata

  if (!width || !height) {
    return buffer
  }

  let maxDimension = Math.min(Math.max(width, height), MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT)
  let qualityIndex = 0

  for (let attempt = 0; attempt < 18; attempt++) {
    const scale = maxDimension / Math.max(width, height)
    const optimized = await sharp(buffer, { animated: (metadata.pages || 1) > 1 })
      .timeout({ seconds: IMAGE_PROCESSING_TIMEOUT_SECONDS })
      .rotate()
      .resize({
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_QUALITY_LEVELS[qualityIndex], effort: 4 })
      .toBuffer()

    if (!Number.isFinite(maxBytes) || optimized.length <= maxBytes) {
      return optimized
    }

    if (qualityIndex < IMAGE_QUALITY_LEVELS.length - 1) {
      qualityIndex += 1
      continue
    }

    if (maxDimension <= 320) break
    const sizeRatio = Math.sqrt(maxBytes / optimized.length)
    const scaleDown = Math.max(0.5, Math.min(0.9, sizeRatio * 0.9))
    maxDimension = Math.max(320, Math.floor(maxDimension * scaleDown))
    qualityIndex = 1
  }

  return buffer
}

async function uploadToLocal(buffer, mimetype, folder) {
  const ext = mimetype.split('/')[1] || 'bin'
  const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const fileName = `${fileId}.${ext}`
  const dir = path.join(UPLOADS_DIR, folder)
  ensureDir(dir)
  const filePath = path.join(dir, fileName)
  const relativePath = `/uploads/${folder}/${fileName}`

  try {
    fs.writeFileSync(filePath, Buffer.from(buffer))
  } catch (err) {
    throw failure(500, `Local file upload failed: ${err?.message || 'Unknown error'}`)
  }

  return {
    url: relativePath,
    path: relativePath,
    publicId: fileName,
    mimeType: mimetype,
    isLocal: true,
  }
}

function ensureBackupsDir() {
  const backupsDir = path.join(process.cwd(), 'backups')
  try {
    fs.mkdirSync(backupsDir, { recursive: true })
  } catch {
    // ignore
  }
  return backupsDir
}

function recordFailedUpload(entry) {
  try {
    const backupsDir = ensureBackupsDir()
    const logfile = path.join(backupsDir, 'upload-failures.jsonl')
    fs.appendFileSync(logfile, JSON.stringify(entry) + '\n')
  } catch (err) {
    console.error('[uploadService] Failed to record failed upload:', err?.message || err)
  }
}

export async function uploadFile(buffer, mimetype, folder, originalName) {
  if (!buffer) {
    throw failure(400, 'No file buffer provided for upload')
  }

  const shouldUseLocalFallback = process.env.ALLOW_LOCAL_UPLOADS === 'true'
  const useCloudinary = isCloudinaryConfigured() && process.env.SKIP_CLOUDINARY !== 'true' && !shouldUseLocalFallback
  const optimizedBuffer = await optimizeImageBuffer(
    buffer,
    mimetype,
    useCloudinary ? CLOUDINARY_IMAGE_TARGET_BYTES : null,
  )
  const optimizedMimetype = optimizedBuffer !== buffer ? 'image/webp' : mimetype

  // Pre-upload size check: warn if the optimized buffer is large enough to
  // risk hitting Cloudinary's 120s timeout on slower connections. This is a soft
  // threshold — uploads above it still proceed, but the error message will
  // include guidance to reduce file size.
  const bufferSizeMB = (optimizedBuffer.length / (1024 * 1024)).toFixed(1)
  if (optimizedBuffer.length > LARGE_UPLOAD_WARN_THRESHOLD) {
    console.warn(`[uploadService] Large upload (${bufferSizeMB}MB) — may approach Cloudinary timeout on slow connections`)
  }

  if (useCloudinary) {
    try {
      const uploaded = await uploadToCloudinary(optimizedBuffer, optimizedMimetype, folder, originalName)
      return {
        url: uploaded.url,
        originalUrl: uploaded.originalUrl,
        path: uploaded.publicId,
        mimeType: uploaded.mimeType,
        originalName: uploaded.originalName,
        resourceType: uploaded.resourceType,
        format: uploaded.format,
        originalFormat: uploaded.originalFormat,
        duration: uploaded.duration,
        width: uploaded.width,
        height: uploaded.height,
        bytes: uploaded.bytes,
        isLocal: false,
      }
    } catch (cloudErr) {
      console.error('[uploadService] Cloudinary upload failed:', cloudErr?.message || cloudErr)

      const isTimeout = cloudErr?.message?.includes('timed out') || cloudErr?.http_code === 408 || cloudErr?.http_code === 504
      const isTransientServiceError = Number(cloudErr?.http_code) >= 500 || cloudErr?.message?.includes('ECONN') || cloudErr?.message?.includes('fetch failed') || cloudErr?.message?.includes('network')

      if (process.env.NODE_ENV === 'production') {
        const status = isTimeout ? 408 : (isTransientServiceError ? 502 : 500)
        const guidance = isTimeout
          ? ` Upload timed out. The file (${bufferSizeMB}MB) may be too large for the current connection. Try reducing the file size or using a smaller image.`
          : ''
        throw failure(status, `Cloudinary upload failed: ${cloudErr?.message || 'Unknown Cloudinary error'}${guidance}`)
      }

      const allowLocalFallback = process.env.NODE_ENV === 'test' || process.env.ALLOW_LOCAL_UPLOADS === 'true'
      if (allowLocalFallback) {
        try {
          const local = await uploadToLocal(optimizedBuffer, optimizedMimetype, folder)
          recordFailedUpload({
            time: new Date().toISOString(),
            reason: cloudErr?.message || String(cloudErr),
            intended: { provider: 'cloudinary', folder, originalName },
            localPath: local.path,
            mimeType: optimizedMimetype,
          })
          console.warn('[uploadService] Local fallback enabled; saved upload locally instead:', local.path)
          return {
            url: local.url,
            originalUrl: local.url,
            path: local.path,
            mimeType: local.mimeType,
            originalName: originalName || null,
            resourceType: null,
            format: optimizedMimetype.split('/')[1] || null,
            originalFormat: optimizedMimetype,
            duration: null,
            width: null,
            height: null,
            bytes: optimizedBuffer.length,
            isLocal: true,
          }
        } catch (localErr) {
          console.error('[uploadService] Local fallback upload also failed:', localErr?.message || localErr)
        }
      }

      const guidance = isTimeout
        ? ` Upload timed out. The file (${bufferSizeMB}MB) may be too large for the current connection. Try reducing the file size or using a smaller image.`
        : ''
      throw failure(408, `${cloudErr?.message || 'Cloudinary upload failed'}${guidance}`)
    }
  }

  if (isSupabaseConfigured()) {
    try {
      return await uploadToSupabase(optimizedBuffer, optimizedMimetype, folder)
    } catch (supErr) {
      console.error('[uploadService] Supabase upload failed:', supErr?.message || supErr)
      if (process.env.NODE_ENV === 'production') {
        throw failure(500, `Supabase upload failed: ${supErr?.message || 'Unknown Supabase error'}`)
      }
      const allowLocalFallback = process.env.ALLOW_LOCAL_UPLOADS === 'true'
      if (allowLocalFallback) {
        try {
          const local = await uploadToLocal(optimizedBuffer, optimizedMimetype, folder)
          recordFailedUpload({
            time: new Date().toISOString(),
            reason: supErr?.message || String(supErr),
            intended: { provider: 'supabase', folder },
            localPath: local.path,
            mimeType: optimizedMimetype,
          })
          console.warn('[uploadService] Local dev fallback enabled; saved failed Supabase upload locally:', local.path)
          return local
        } catch (localErr) {
          console.error('[uploadService] Saving failed upload locally also failed:', localErr?.message || localErr)
          throw failure(500, 'File upload failed. Please try again later.')
        }
      }
      throw failure(500, `Supabase upload failed: ${supErr?.message || 'Unknown Supabase error'}`)
    }
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('[uploadService] No permanent storage configured in production')
    throw failure(500, 'File upload service is not configured. Contact support.')
  }

  return uploadToLocal(optimizedBuffer, optimizedMimetype, folder)
}

export async function deleteFile(storagePath) {
  if (!storagePath) return

  if (storagePath.startsWith('/uploads/')) {
    try {
      const filePath = path.join(process.cwd(), storagePath)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch (err) {
      console.error('[uploadService] Local file deletion failed:', err?.message)
    }
    return
  }

  if (storagePath.startsWith('http')) {
    const match = storagePath.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    if (match && match[1]) {
      const isVideo = storagePath.includes('/video/upload/') || /.(mp4|webm|mov|m4v|avi|mkv|ogg|ogv)$/i.test(storagePath)
      if (isSupabaseConfigured()) {
        await deleteFromSupabase(match[1])
      } else {
        await deleteFromCloudinary(match[1], isVideo ? 'video' : 'image')
      }
    }
    return
  }

  if (isSupabaseConfigured()) {
    await deleteFromSupabase(storagePath)
  } else {
    await deleteFromCloudinary(storagePath)
  }
}

export async function deleteFiles(storagePaths) {
  if (!Array.isArray(storagePaths) || storagePaths.length === 0) return
  const valid = storagePaths.filter(Boolean)
  if (valid.length === 0) return
  await Promise.allSettled(valid.map(deleteFile))
}

async function uploadToSupabase(buffer, mimetype, folder) {
  const ext = mimetype.split('/')[1] || 'bin'
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, buffer, {
      contentType: mimetype,
      upsert: false,
    })

  if (error) throw failure(500, `Upload failed: ${error.message}`)

  const { data: publicData } = supabase.storage.from('uploads').getPublicUrl(fileName)

  return { url: publicData.publicUrl, path: fileName, mimeType: mimetype, isLocal: false }
}

async function deleteFromSupabase(storagePath) {
  await supabase.storage.from('uploads').remove([storagePath])
}