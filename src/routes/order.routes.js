import { Router } from 'express'
import { acceptOrder, createOrder, getOrder, listMyOrders, listMyOrdersFull, listOrders, rejectOrder } from '../controllers/order.controller.js'
import { requireAdmin, requireAuth, requireUser } from '../middlewares/auth.js'

const router = Router()

router.post('/', requireAuth, requireUser, createOrder)
router.get('/my', requireAuth, requireUser, listMyOrders)
router.get('/my/full', requireAuth, requireUser, listMyOrdersFull)
router.get('/:id', requireAuth, getOrder)

router.get('/', requireAuth, requireAdmin, listOrders)
router.put('/:id/accept', requireAuth, requireAdmin, acceptOrder)
router.put('/:id/reject', requireAuth, requireAdmin, rejectOrder)

export default router