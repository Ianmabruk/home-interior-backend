import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { userService } from '../services/userService.js'

const router = Router()

router.get('/wishlist', authenticate, (req, res) => {
  const items = userService.getWishlist(req.admin.email)
  res.json({ success: true, data: items })
})

router.post('/wishlist/toggle', authenticate, (req, res) => {
  const result = userService.toggleWishlist(req.admin.email, req.body.productId)
  res.json({ success: true, data: result })
})

router.get('/cart', authenticate, (req, res) => {
  const items = userService.getCart(req.admin.email)
  res.json({ success: true, data: items })
})

router.post('/cart', authenticate, (req, res) => {
  const result = userService.addToCart(req.admin.email, req.body.productId, req.body.quantity, req.body.variant)
  res.json({ success: true, data: result })
})

router.delete('/cart/:productId', authenticate, (req, res) => {
  const result = userService.removeFromCart(req.admin.email, req.params.productId, req.body?.colorName || req.body?.variant)
  res.json({ success: true, data: result })
})

router.patch('/cart', authenticate, (req, res) => {
  const result = userService.updateCart(req.admin.email, req.body.productId, req.body.quantity, req.body.variant)
  res.json({ success: true, data: result })
})

export default router
