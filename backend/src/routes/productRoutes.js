import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { productController } from '../controllers/productController.js'
import { uploadArray } from '../middleware/upload.js'

const router = Router()

router.get('/', productController.list)
router.get('/:id', productController.get)
router.post('/', uploadArray('images', 20), productController.create)
router.patch('/:id', uploadArray('images', 20), productController.update)
router.delete('/:id', productController.delete)
router.get('/admin/all', authenticate, productController.getAll)

export default router
