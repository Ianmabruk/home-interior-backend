import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/prisma.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray } from '../utils/helpers.js'

export const heroMediaController = {
  list: asyncHandler(async (req, res) => {
    const hero = await prisma.hero.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      where: { isActive: true },
    })
    res.json(sendSuccess(withIdArray(hero)))
  }),

  get: asyncHandler(async (req, res) => {
    const hero = await prisma.hero.findUnique({ where: { id: req.params.id } })
    if (!hero) {
      return res.status(404).json({ success: false, message: 'Hero content not found' })
    }
    res.json(sendSuccess(withId(hero)))
  }),

  create: asyncHandler(async (req, res) => {
    const data = {
      title: req.body.title || '',
      subtitle: req.body.subtitle || '',
      isActive: req.body.isActive !== 'false' && req.body.isActive !== false,
    }

    if (req.file) {
      const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/homepage/hero', type: 'image' })
      data.imageUrl = upload.secure_url
      data.cloudinaryId = upload.public_id
    }

    const mediaFiles = req.file ? [req.file] : []
    if (mediaFiles.length > 0) {
      const mediaUrls = []
      for (const file of mediaFiles) {
        const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/homepage/hero', type: 'image' })
        mediaUrls.push(upload.secure_url)
      }
      data.mediaUrls = mediaUrls
    }

    const bodyMediaUrls = req.body.mediaUrls
    if (Array.isArray(bodyMediaUrls) && bodyMediaUrls.length > 0) {
      data.mediaUrls = bodyMediaUrls
    }

    const hero = await prisma.hero.create({ data })
    res.status(201).json(sendSuccess(withId(hero)))
  }),

  update: asyncHandler(async (req, res) => {
    const hero = await prisma.hero.findUnique({ where: { id: req.params.id } })
    if (!hero) {
      return res.status(404).json({ success: false, message: 'Hero content not found' })
    }

    const data = {}
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.subtitle !== undefined) data.subtitle = req.body.subtitle
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true' || req.body.isActive === true

    if (req.file) {
      if (hero.cloudinaryId) {
        try {
          await mediaService.delete(hero.cloudinaryId, 'image')
        } catch {
          // ignore
        }
      }
      const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/homepage/hero', type: 'image' })
      data.imageUrl = upload.secure_url
      data.cloudinaryId = upload.public_id
    }

    const mediaFiles = req.file ? [req.file] : []
    if (mediaFiles.length > 0) {
      const mediaUrls = []
      for (const file of mediaFiles) {
        const upload = await mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/homepage/hero', type: 'image' })
        mediaUrls.push(upload.secure_url)
      }
      data.mediaUrls = mediaUrls
    }

    const bodyMediaUrls = req.body.mediaUrls
    if (Array.isArray(bodyMediaUrls)) {
      data.mediaUrls = bodyMediaUrls
    }

    const updated = await prisma.hero.update({ where: { id: hero.id }, data })
    res.json(sendSuccess(withId(updated)))
  }),

  remove: asyncHandler(async (req, res) => {
    const hero = await prisma.hero.findUnique({ where: { id: req.params.id } })
    if (!hero) {
      return res.status(404).json({ success: false, message: 'Hero content not found' })
    }
    if (hero.cloudinaryId) {
      try {
        await mediaService.delete(hero.cloudinaryId, 'image')
      } catch {
        // ignore
      }
    }
    if (Array.isArray(hero.mediaUrls)) {
      for (const url of hero.mediaUrls) {
        try {
          const publicId = url.split('/').pop()?.split('.')[0]
          if (publicId) {
            await mediaService.delete(publicId, 'image')
          }
        } catch {
          // ignore
        }
      }
    }
    await prisma.hero.delete({ where: { id: hero.id } })
    res.json(sendSuccess({ message: 'Hero content deleted' }))
  }),
}
