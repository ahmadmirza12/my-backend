import { Router } from 'express'
import { acceptOrder, createOrder, getOrder, listMyOrders, listOrders, rejectOrder } from '../controllers/order.controller.js'
import { requireAdmin, requireAuth } from '../middlewares/auth.js'

const router = Router()

router.post('/', requireAuth, createOrder)
router.get('/my', requireAuth, listMyOrders)
router.get('/:id', requireAuth, getOrder)

router.get('/', requireAuth, requireAdmin, listOrders)
router.put('/:id/accept', requireAuth, requireAdmin, acceptOrder)
router.put('/:id/reject', requireAuth, requireAdmin, rejectOrder)

export default router