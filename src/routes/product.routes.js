import { Router } from 'express'
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from '../controllers/product.controller.js'
import { requireAdmin, requireAuth } from '../middlewares/auth.js'

const router = Router()

router.get('/', listProducts)
router.get('/:id', getProduct)

router.post('/', requireAuth, requireAdmin, createProduct)
router.put('/:id', requireAuth, requireAdmin, updateProduct)
router.delete('/:id', requireAuth, requireAdmin, deleteProduct)

export default router