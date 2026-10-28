import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { supabase, isSupabaseConfigured } from '../config/supabase.js'
import { uploadToCloudinary, deleteFromCloudinary, deleteManyFromCloudinary } from '../config/cloudinary.js'
import { failure } from '../utils/response.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads')

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch {
    // Non-fatal — directory may already exist
  }
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

export async function uploadFile(buffer, mimetype, folder) {
  if (!buffer) {
    throw failure(400, 'No file buffer provided for upload')
  }

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const uploaded = await uploadToCloudinary(buffer, mimetype, folder)
      return { url: uploaded.url, path: uploaded.publicId, mimeType: mimetype, isLocal: false }
    } catch (cloudErr) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[uploadService] Cloudinary upload failed in production:', cloudErr?.message || cloudErr)
        throw failure(500, `Cloudinary upload failed: ${cloudErr?.message || 'Unknown Cloudinary error'}`)
      }
      const allowLocalFallback = process.env.ALLOW_LOCAL_UPLOADS === 'true'
      if (allowLocalFallback) {
        console.warn(`[uploadService] Local dev fallback enabled; Cloudinary upload failed and saved locally: ${cloudErr?.message || cloudErr}`)
        return uploadToLocal(buffer, mimetype, folder)
      }
      throw failure(500, `Cloudinary upload failed: ${cloudErr?.message || 'Unknown Cloudinary error'}`)
    }
  }

  if (isSupabaseConfigured()) {
    try {
      return await uploadToSupabase(buffer, mimetype, folder)
    } catch (supErr) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[uploadService] Supabase upload failed in production:', supErr?.message || supErr)
        throw failure(500, `Supabase upload failed: ${supErr?.message || 'Unknown Supabase error'}`)
      }
      const allowLocalFallback = process.env.ALLOW_LOCAL_UPLOADS === 'true'
      if (allowLocalFallback) {
        console.warn(`[uploadService] Local dev fallback enabled; Supabase upload failed and saved locally: ${supErr?.message || supErr}`)
        return uploadToLocal(buffer, mimetype, folder)
      }
      throw failure(500, `Supabase upload failed: ${supErr?.message || 'Unknown Supabase error'}`)
    }
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('[uploadService] No permanent storage configured in production')
    throw failure(500, 'File upload service is not configured. Contact support.')
  }

  return uploadToLocal(buffer, mimetype, folder)
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
      if (isSupabaseConfigured()) {
        await deleteFromSupabase(match[1])
      } else {
        await deleteFromCloudinary(match[1])
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