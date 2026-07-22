import { Router } from 'express'
import { forgotPassword, login, logout, refresh, register, resetPassword, changePassword } from '../controllers/authController.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.post('/change-password', changePassword)

export default router
