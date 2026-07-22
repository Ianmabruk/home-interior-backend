import { Router } from 'express'
import authRoutes from './authRoutes.js'
import adminRoutes from './adminRoutes.js'
import productRoutes from './productRoutes.js'
import orderRoutes from './orderRoutes.js'
import messageRoutes from './messageRoutes.js'
import userRoutes from './userRoutes.js'
import mediaRoutes from './mediaRoutes.js'
import serviceRoutes from './serviceRoutes.js'
import testRoutes from './testimonialRoutes.js'
import heroRoutes from './heroMediaRoutes.js'
import aboutRoutes from './aboutRoutes.js'
import consultationRoutes from './consultationRoutes.js'
import adminConsultationRoutes from './adminConsultationRoutes.js'
import { portfolioRoutes as adminPortfolioRoutes, virtualDesignRoutes as adminVDRoutes } from './adminContentRoutes.js'
import { portfolioRoutes as contentPortfolioRoutes, virtualDesignRoutes as contentVDRoutes, default as contentRoutes } from './contentRoutes.js'
import { uploadSingle } from '../middleware/upload.js'
import { uploadFile } from '../uploads/uploadService.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/admin', adminRoutes)

router.use('/content', contentRoutes)
router.use('/content/portfolio', contentPortfolioRoutes)
router.use('/content/virtual-design', contentVDRoutes)
router.use('/content/services', serviceRoutes)
router.use('/content/about', aboutRoutes)
router.use('/content/hero-media', heroRoutes)
router.use('/content/consultations', consultationRoutes)
router.use('/content/media', mediaRoutes)
router.use('/content/testimonials', testRoutes)

router.use('/admin/portfolio', adminPortfolioRoutes)
router.use('/admin/virtual-designs', adminVDRoutes)
router.use('/admin/services', serviceRoutes)
router.use('/admin/testimonials', testRoutes)
router.use('/admin/consultations', adminConsultationRoutes)

router.use('/portfolio', contentPortfolioRoutes)
router.use('/virtual-design', contentVDRoutes)
router.use('/services', serviceRoutes)
router.use('/products', productRoutes)
router.use('/orders', orderRoutes)
router.use('/messages', messageRoutes)
router.use('/users', userRoutes)
router.use('/media', mediaRoutes)
router.use('/testimonials', testRoutes)

router.post('/content/test-upload', uploadSingle('media'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' })
  }
  const uploaded = await uploadFile(req.file.buffer, req.file.mimetype, 'test-uploads')
  res.status(201).json({ success: true, data: { url: uploaded.url, path: uploaded.path } })
})

router.post('/test-upload', uploadSingle('media'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' })
  }
  const uploaded = await uploadFile(req.file.buffer, req.file.mimetype, 'test-uploads')
  res.status(201).json({ success: true, data: { url: uploaded.url, path: uploaded.path } })
})

export default router
