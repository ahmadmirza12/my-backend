import express from 'express'
import { handleWebhook } from '../controllers/payments.controller.js'

const router = express.Router()

router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook)

export default router