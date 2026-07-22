import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { virtualDesignController } from '../controllers/virtualDesignController.js'
import { uploadFields } from '../middleware/upload.js'

const router = Router()

router.get('/', virtualDesignController.list)
router.get('/:id', virtualDesignController.get)
router.post('/', uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.create)
router.patch('/:id', uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.update)
router.delete('/:id', virtualDesignController.delete)

export default router
