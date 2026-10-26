import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { uploadSingle, uploadFields, uploadProductImages, uploadProductImagesStrict } from '../middleware/upload.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { validateCsrfToken } from '../middleware/csrf.js'
import { prisma } from '../config/database.js'
import { portfolioController } from '../controllers/portfolioController.js'
import { virtualDesignController } from '../controllers/virtualDesignController.js'
import { serviceController } from '../controllers/serviceController.js'
import { productController } from '../controllers/productController.js'
import { aboutController } from '../controllers/aboutController.js'
import { aboutImageController } from '../controllers/aboutImageController.js'
import { heroMediaController } from '../controllers/heroMediaController.js'
import { testimonialController } from '../controllers/testimonialController.js'
import { consultationController } from '../controllers/consultationController.js'
import { orderController } from '../controllers/orderController.js'
import { addOnController } from '../controllers/addOnController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { adminOverviewController } from '../controllers/adminOverviewController.js'
import { websiteAnalyticsController } from '../controllers/websiteAnalyticsController.js'
import { workWithUsController } from '../controllers/workWithUsController.js'
import { notificationController } from '../controllers/notificationController.js'
import { circularTabController } from '../controllers/circularTabController.js'
import { getBuildVersion } from '../middleware/buildVersion.js'
import adminSocialRoutes from './adminSocialRoutes.js'

const router = Router()

router.use(authenticate, authorize('ADMIN'))

router.use((req, res, next) => {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    return validateCsrfToken(req, res, next)
  }
  next()
})

router.get('/overview', adminOverviewController.getStats)
router.get('/insights', websiteAnalyticsController.getInsights)
router.get('/settings', adminOverviewController.getSettings)
router.put('/settings', adminOverviewController.updateSettings)
router.post('/settings/shop-banner', uploadSingle('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' })
  }
  const uploaded = await uploadFile(req.file.buffer, req.file.mimetype, 'shop-banner')
  await prisma.siteSetting.upsert({
    where: { key: 'shopBannerImage' },
    update: { value: uploaded.url },
    create: { key: 'shopBannerImage', value: uploaded.url },
  })
  res.status(201).json({ success: true, data: { url: uploaded.url, path: uploaded.path } })
}))

router.post('/settings/shop-with-us-image', uploadSingle('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' })
  }
  const uploaded = await uploadFile(req.file.buffer, req.file.mimetype, 'shop-with-us')
  await prisma.siteSetting.upsert({
    where: { key: 'shopWithUsHomepageImage' },
    update: { value: uploaded.url },
    create: { key: 'shopWithUsHomepageImage', value: uploaded.url },
  })
  res.status(201).json({ success: true, data: { url: uploaded.url, path: uploaded.path } })
}))

router.delete('/settings/shop-with-us-image', asyncHandler(async (req, res) => {
  const existing = await prisma.siteSetting.findUnique({ where: { key: 'shopWithUsHomepageImage' } })
  if (existing?.value) {
    await deleteFile(existing.value)
  }
  await prisma.siteSetting.deleteMany({ where: { key: 'shopWithUsHomepageImage' } })
  res.json({ success: true, data: { message: 'Deleted' } })
}))

// Admin Socials
router.use('/socials', adminSocialRoutes)

// Admin Portfolio
router.get('/portfolio', portfolioController.list)
router.get('/portfolio/:id', portfolioController.get)
router.post('/portfolio', uploadFields([{ name: 'media', maxCount: 1 }, { name: 'before', maxCount: 40 }, { name: 'after', maxCount: 40 }, { name: 'homepageCircularImage', maxCount: 1 }]), portfolioController.create)
router.patch('/portfolio/:id', uploadFields([{ name: 'media', maxCount: 1 }, { name: 'before', maxCount: 40 }, { name: 'after', maxCount: 40 }, { name: 'homepageCircularImage', maxCount: 1 }]), portfolioController.update)
router.delete('/portfolio/:id', portfolioController.delete)
router.put('/portfolio/reorder', portfolioController.reorder)
router.put('/portfolio/:id/images/order', portfolioController.reorderImages)

// Admin Virtual Designs
router.get('/virtual-designs', virtualDesignController.list)
router.get('/virtual-designs/:id', virtualDesignController.get)
router.post('/virtual-designs', uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }, { name: 'homepageCircularImage', maxCount: 1 }]), virtualDesignController.create)
router.patch('/virtual-designs/:id', uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }, { name: 'homepageCircularImage', maxCount: 1 }]), virtualDesignController.update)
router.delete('/virtual-designs/:id', virtualDesignController.delete)

// Admin Virtual Designs Add-On Services
router.get('/virtual-designs/add-ons', addOnController.list)
router.post('/virtual-designs/add-ons', addOnController.create)
router.patch('/virtual-designs/add-ons/:id', addOnController.update)
router.delete('/virtual-designs/add-ons/:id', addOnController.delete)

// Admin Services
router.get('/services', serviceController.list)
router.post('/services', uploadFields([{ name: 'media', maxCount: 1 }, { name: 'homepageCircularImage', maxCount: 1 }]), serviceController.create)
router.patch('/services/reorder', serviceController.reorder)
router.post('/services/reorder', serviceController.reorder)
router.get('/services/:id', serviceController.get)
router.patch('/services/:id', uploadFields([{ name: 'media', maxCount: 1 }, { name: 'homepageCircularImage', maxCount: 1 }]), serviceController.update)
router.delete('/services/:id', serviceController.delete)

// Admin Shop (Products)
router.get('/shop', productController.list)
router.get('/shop/:id', productController.get)
router.post('/shop', uploadProductImagesStrict(60), productController.create)
router.patch('/shop/:id', uploadProductImagesStrict(60), productController.update)
router.delete('/shop/:id', productController.delete)

// Admin About
router.get('/about', aboutController.get)
router.put('/about', uploadFields([{ name: 'media', maxCount: 1 }, { name: 'socialMedia', maxCount: 1 }, { name: 'homepageCircularImage', maxCount: 1 }]), aboutController.update)

// Admin About Images
router.get('/about/images', aboutImageController.list)
router.post('/about/images', uploadSingle('image'), aboutImageController.create)
router.patch('/about/images/:id', uploadSingle('image'), aboutImageController.update)
router.delete('/about/images/:id', aboutImageController.delete)
router.patch('/about/images/reorder', aboutImageController.reorder)

// Admin Socials
router.use('/socials', adminSocialRoutes)

// Admin Hero Images
router.get('/hero-images', heroMediaController.list)
router.get('/hero-images/:id', heroMediaController.get)
router.post('/hero-images', uploadFields([{ name: 'media', maxCount: 10 }]), heroMediaController.create)
router.patch('/hero-images/:id', uploadFields([{ name: 'media', maxCount: 10 }]), heroMediaController.update)
router.delete('/hero-images/:id', heroMediaController.delete)

// Admin Testimonials
router.get('/testimonials', testimonialController.list)
router.get('/testimonials/:id', testimonialController.get)
router.post('/testimonials', uploadFields([{ name: 'photo', maxCount: 1 }, { name: 'homepageCircularImage', maxCount: 1 }]), testimonialController.create)
router.patch('/testimonials/:id', uploadFields([{ name: 'photo', maxCount: 1 }, { name: 'homepageCircularImage', maxCount: 1 }]), testimonialController.update)
router.delete('/testimonials/:id', testimonialController.delete)
router.put('/testimonials/reorder', testimonialController.reorder)

// Admin Consultations
router.get('/consultations', consultationController.list)
router.patch('/consultations/:id/status', consultationController.updateStatus)
router.delete('/consultations/:id', consultationController.delete)
router.get('/consultations/export', consultationController.exportCsv)

// Admin Orders
router.get('/orders', orderController.listAll)
router.patch('/orders/:id/status', orderController.updateStatus)

// Admin Work With Us
router.get('/work-with-us', workWithUsController.list)
router.get('/work-with-us/:id', workWithUsController.get)
router.patch('/work-with-us/:id/status', workWithUsController.updateStatus)
router.delete('/work-with-us/:id', workWithUsController.delete)
router.get('/work-with-us/content', workWithUsController.listContent)
router.post('/work-with-us/content', uploadFields([{ name: 'image', maxCount: 1 }, { name: 'homepageCircularImage', maxCount: 1 }]), workWithUsController.createContent)
router.patch('/work-with-us/content/:id', uploadFields([{ name: 'image', maxCount: 1 }, { name: 'homepageCircularImage', maxCount: 1 }]), workWithUsController.updateContent)
router.delete('/work-with-us/content/:id', workWithUsController.deleteContent)

// Admin Circular Tabs (centralized circular tab management)
router.get('/circular-tabs', circularTabController.list)
router.patch('/circular-tabs/:key', uploadSingle('image'), validateCsrfToken, circularTabController.update)
router.delete('/circular-tabs/:key/image', validateCsrfToken, circularTabController.removeImage)

// Deployment verification + push notification management (admin only)
router.get('/version', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { buildVersion: getBuildVersion(), server: 'HOK API' },
  })
}))
router.get('/push', notificationController.listMine)
router.post('/push/subscribe', notificationController.subscribe)
router.delete('/push/:id', notificationController.revoke)

export default router
