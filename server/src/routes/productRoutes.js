import { Router } from 'express'
import multer from 'multer'
import { listProducts, listAllProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js'
import { auth, authorize } from '../middleware/auth.js'
import { sanitizeInput, validateFileUpload } from '../middleware/validate.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })
const validateImageUpload = validateFileUpload('images', { maxBytes: 10 * 1024 * 1024 })

router.get('/', listProducts)
router.get('/admin/all', auth, authorize('admin'), listAllProducts)
router.get('/:id', getProduct)
router.post('/', auth, authorize('admin'), upload.array('images', 8), validateImageUpload, sanitizeInput, createProduct)
router.patch('/:id', auth, authorize('admin'), upload.array('images', 8), validateImageUpload, sanitizeInput, updateProduct)
router.delete('/:id', auth, authorize('admin'), deleteProduct)

export default router
