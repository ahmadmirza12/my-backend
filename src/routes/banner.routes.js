import { Router } from 'express'
import { requireAdmin, requireAuth, optionalAuth } from '../middlewares/auth.js'
import { createBanner, listUserProductBanners, updateBanner, deleteBanner } from '../controllers/banner.controller.js'

const router = Router()

// Standard REST endpoints
router.post('/', requireAuth, requireAdmin, createBanner)
router.get('/', optionalAuth, listUserProductBanners) // Optional auth for user-specific filtering
router.put('/:id', requireAuth, requireAdmin, updateBanner)
router.delete('/:id', requireAuth, requireAdmin, deleteBanner)

// Legacy endpoint for backward compatibility (mounted at /api/v1/banners/user/products/banners if app.use is /api/v1/banners)
// To support /api/v1/user/products/banners, we need to handle it in app.js or here carefully.
// Since this router is likely mounted at /api/v1/banners, this path would be weird.
// Let's assume we will fix the mount in app.js or handle the path relative to root there.
// But wait, if I want to support the EXACT path /api/v1/user/products/banners, 
// and the router is at /api/v1/banners, I can't easily do it without changing app.js.

export default router
