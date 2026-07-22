import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { uploadSingle } from '../middleware/upload.js'
import { failure } from '../utils/response.js'

const router = Router()

router.post('/upload', authenticate, uploadSingle('media'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' })
  }
  const folder = req.body.folder || 'uploads'
  const type = req.body.resourceType || 'image'
  const allowedImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const allowedVideo = ['video/mp4', 'video/webm', 'video/ogg']
  const allowed = type === 'video' ? allowedVideo : allowedImage
  if (!allowed.includes(req.file.mimetype)) {
    return res.status(400).json({ success: false, message: 'Invalid file type' })
  }
  const uploaded = await uploadFile(req.file.buffer, req.file.mimetype, folder, type)
  res.status(201).json({ success: true, data: { url: uploaded.url, path: uploaded.path } })
})

router.post('/delete', authenticate, async (req, res) => {
  const { publicId, resourceType } = req.body
  await deleteFile(publicId)
  res.json({ success: true, data: { message: 'Deleted' } })
})

export default router
