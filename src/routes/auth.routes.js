import { Router } from 'express'
import { adminLogin, login, logout, me, signup, sendOtp, verifyOtp } from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/auth.js'

const router = Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/admin/login', adminLogin)
router.post('/otp/send', sendOtp)
router.post('/otp/verify', verifyOtp)
router.get('/me', requireAuth, me)
router.post('/logout', requireAuth, logout)

export default router