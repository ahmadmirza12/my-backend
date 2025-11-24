import { Router } from 'express'
import { createCheckoutSession, createPaymentIntent } from '../controllers/payments.controller.js'
import { requireAuth } from '../middlewares/auth.js'

const router = Router()

router.post('/intent', requireAuth, createPaymentIntent)
router.post('/checkout-session', requireAuth, createCheckoutSession)

export default router