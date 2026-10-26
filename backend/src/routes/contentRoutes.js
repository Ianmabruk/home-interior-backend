import { Router } from 'express'
import { contentController } from '../controllers/contentController.js'
import { portfolioController } from '../controllers/portfolioController.js'
import { virtualDesignController } from '../controllers/virtualDesignController.js'
import { addOnController } from '../controllers/addOnController.js'
import { uploadFields } from '../middleware/upload.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'
import { validateZod } from '../middleware/validateZod.js'
import { contentSchemas, portfolioSchemas, virtualDesignSchemas } from '../validations/schemas.js'

const router = Router()

// Cache homepage and list endpoints longer to reduce backend load and
// improve repeat visit performance (CDN-friendly). Admin changes still
// invalidate via client-side cache clear and short stale-while-revalidate.
router.get('/homepage', cacheHeaders(300, 60), contentController.homepage)
router.post('/newsletter', validateZod(contentSchemas.newsletter), contentController.newsletter)
router.get('/unsubscribe', validateZod(contentSchemas.unsubscribe, 'query'), contentController.unsubscribe)

export const portfolioRoutes = Router()
portfolioRoutes.get('/', cacheHeaders(300, 60), portfolioController.list)
portfolioRoutes.get('/:id', cacheHeaders(10, 60), portfolioController.get)
portfolioRoutes.post('/', authenticate, authorize('ADMIN'), uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 35 }, { name: 'before', maxCount: 40 }, { name: 'after', maxCount: 40 }, { name: 'homepageCircularImage', maxCount: 1 }]), validateZod(portfolioSchemas.create), portfolioController.create)
portfolioRoutes.patch('/:id', authenticate, authorize('ADMIN'), uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 35 }, { name: 'before', maxCount: 40 }, { name: 'after', maxCount: 40 }, { name: 'homepageCircularImage', maxCount: 1 }]), validateZod(portfolioSchemas.update), portfolioController.update)
portfolioRoutes.delete('/:id', authenticate, authorize('ADMIN'), portfolioController.delete)
portfolioRoutes.put('/:id/images/order', authenticate, authorize('ADMIN'), portfolioController.reorderImages)
portfolioRoutes.put('/reorder', authenticate, authorize('ADMIN'), portfolioController.reorder)

export const virtualDesignRoutes = Router()
virtualDesignRoutes.get('/', cacheHeaders(300, 60), virtualDesignController.list)
virtualDesignRoutes.get('/:id', cacheHeaders(10, 60), virtualDesignController.get)
virtualDesignRoutes.get('/add-ons', cacheHeaders(300, 60), addOnController.listPublic)
virtualDesignRoutes.post('/', authenticate, authorize('ADMIN'), uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }, { name: 'homepageCircularImage', maxCount: 1 }]), validateZod(virtualDesignSchemas.create), virtualDesignController.create)
virtualDesignRoutes.patch('/:id', authenticate, authorize('ADMIN'), uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }, { name: 'homepageCircularImage', maxCount: 1 }]), validateZod(virtualDesignSchemas.update), virtualDesignController.update)
virtualDesignRoutes.delete('/:id', authenticate, authorize('ADMIN'), virtualDesignController.delete)

export default router
