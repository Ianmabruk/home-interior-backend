import { Router } from 'express'
import multer from 'multer'
import { createProduct, deleteProduct, getProduct, listProducts, listAllProducts, updateProduct, addColorVariant, removeColorVariant, setDefaultVariant, addStyleVariant, removeStyleVariant, setDefaultStyleVariant } from '../controllers/productController.js'
import { auth, authorize } from '../middleware/auth.js'
import { sanitizeInput, validateFileUpload } from '../middleware/validate.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })
const validateImageUpload = validateFileUpload('images', { maxBytes: 10 * 1024 * 1024, allowedMime: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'] })
const validateVariantImage = validateFileUpload('image', { maxBytes: 10 * 1024 * 1024, allowedMime: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'] })

router.get('/', listProducts)
router.get('/admin/all', auth, authorize('admin'), listAllProducts)
router.get('/:id', getProduct)
router.post('/', auth, authorize('admin'), upload.array('images', 8), validateImageUpload, sanitizeInput, createProduct)
router.patch('/:id', auth, authorize('admin'), upload.array('images', 8), validateImageUpload, sanitizeInput, updateProduct)
router.delete('/:id', auth, authorize('admin'), deleteProduct)
router.post('/:id/variants', auth, authorize('admin'), upload.single('image'), validateVariantImage, sanitizeInput, addColorVariant)
router.delete('/:id/variants/:colorName', auth, authorize('admin'), removeColorVariant)
router.patch('/:id/variants/:colorName/default', auth, authorize('admin'), setDefaultVariant)

router.post('/:id/style-variants', auth, authorize('admin'), sanitizeInput, addStyleVariant)
router.delete('/:id/style-variants/:styleName', auth, authorize('admin'), removeStyleVariant)
router.patch('/:id/style-variants/:styleName/default', auth, authorize('admin'), setDefaultStyleVariant)

export default router
