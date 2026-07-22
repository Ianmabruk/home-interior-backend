import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads')

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

export async function uploadFile(buffer, mimetype, folder) {
  const ext = mimetype.split('/')[1] || 'bin'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const saveDir = path.join(UPLOAD_DIR, folder)
  const savePath = path.join(saveDir, fileName)

  await ensureDir(saveDir)
  await fs.writeFile(savePath, buffer)

  const relativePath = path.join('/uploads', folder, fileName).replace(/\\/g, '/')
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000'
  const url = `${baseUrl}${relativePath}`

  return { url, path: relativePath, mimeType: mimetype }
}

export async function deleteFile(relativePath) {
  if (!relativePath) return
  const cleanPath = relativePath.replace(/^\/uploads\//, '')
  const filePath = path.join(UPLOAD_DIR, cleanPath)
  try {
    await fs.unlink(filePath)
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Delete file error:', err)
  }
}

export async function deleteFiles(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return
  await Promise.allSettled(paths.map(deleteFile))
}
