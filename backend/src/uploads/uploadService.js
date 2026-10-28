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
const IMAGE_QUALITY = 80
// Timeout for image processing to prevent blocking on large/corrupt images
const IMAGE_PROCESSING_TIMEOUT_MS = 15000

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

async function optimizeImageBuffer(buffer, mimetype) {
  if (!buffer || !mimetype || !mimetype.startsWith('image/')) {
    return buffer
  }

  // Wrap image processing in a timeout to prevent blocking on large images
  return Promise.race([
    processImageBuffer(buffer, mimetype),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Image processing timeout')), IMAGE_PROCESSING_TIMEOUT_MS)
    ),
  ]).catch((err) => {
    // If processing fails or times out, return the original buffer
    // The upload will still succeed, just without optimization
    console.warn(`[uploadService] Image optimization failed, using original: ${err?.message || err}`)
    return buffer
  })
}

async function processImageBuffer(buffer, mimetype) {
  const metadata = await sharp(buffer).metadata()
  const { width, height } = metadata

  if (!width || !height) {
    return buffer
  }

  if (width <= MAX_IMAGE_WIDTH && height <= MAX_IMAGE_HEIGHT) {
    return buffer
  }

  const pipeline = sharp(buffer)
  if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
    pipeline.resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  const optimized = await pipeline
    .jpeg({ quality: IMAGE_QUALITY, progressive: true })
    .png({ quality: IMAGE_QUALITY, progressive: true })
    .webp({ quality: IMAGE_QUALITY })
    .toFormat('webp')
    .toBuffer()

  return optimized
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

  const optimizedBuffer = await optimizeImageBuffer(buffer, mimetype)
  const optimizedMimetype = optimizedBuffer !== buffer ? 'image/webp' : mimetype

  // Pre-upload size check: warn if the optimized buffer is large enough to
  // risk hitting Cloudinary's 120s timeout on slower connections. This is a soft
  // threshold — uploads above it still proceed, but the error message will
  // include guidance to reduce file size.
  const bufferSizeMB = (optimizedBuffer.length / (1024 * 1024)).toFixed(1)
  if (optimizedBuffer.length > LARGE_UPLOAD_WARN_THRESHOLD) {
    console.warn(`[uploadService] Large upload (${bufferSizeMB}MB) — may approach Cloudinary timeout on slow connections`)
  }

  const useCloudinary = isCloudinaryConfigured() && process.env.SKIP_CLOUDINARY !== 'true'
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

      const allowLocalFallback = process.env.NODE_ENV !== 'production' && process.env.ALLOW_LOCAL_UPLOADS === 'true'
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
          console.warn('[uploadService] Local dev fallback enabled; saved upload locally instead:', local.path)
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