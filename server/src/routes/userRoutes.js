import { Router } from 'express'
import {
	addToCart,
	getCart,
	getWishlist,
	me,
	removeCartItem,
	toggleWishlist,
	updateCartItem,
	updateMe,
} from '../controllers/userController.js'

const router = Router()

router.get('/me', me)
router.patch('/me', updateMe)
router.get('/wishlist', getWishlist)
router.post('/wishlist/toggle', toggleWishlist)
router.get('/cart', getCart)
router.post('/cart', addToCart)
router.patch('/cart', updateCartItem)
router.delete('/cart/:productId', removeCartItem)

export default router
