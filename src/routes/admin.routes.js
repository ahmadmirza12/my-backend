import { Router } from 'express'
import { requireAdmin, requireAuth } from '../middlewares/auth.js'
import { addProductImages, createProduct, deleteProduct, updateProduct } from '../controllers/product.controller.js'
import { upload } from '../middlewares/upload.js'

const router = Router()

router.post('/products', requireAuth, requireAdmin, createProduct)
router.put('/products/:id', requireAuth, requireAdmin, updateProduct)
router.delete('/products/:id', requireAuth, requireAdmin, deleteProduct)
router.post('/products/images', requireAuth, requireAdmin, upload.array('images', 5), addProductImages)

export default router