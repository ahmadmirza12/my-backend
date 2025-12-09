import { Order } from '../models/order.model.js'
import { Product } from '../models/product.model.js'

function requireAuth(req, res, next) {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Authentication required' })
  }
  next()
}

export async function listMyOrders(req, res) {
  const { page = 1, limit = 20 } = req.query
  const skip = (Number(page) - 1) * Number(limit)
  const [raw, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments({ user: req.user._id })
  ])
  const ids = Array.from(new Set(raw.flatMap(o => (o.items || []).map(i => String(i.product)))))
  const products = await Product.find({ _id: { $in: ids } }).lean()
  const pmap = new Map(products.map(p => [String(p._id), p]))
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
  const placeholder = process.env.PLACEHOLDER_IMAGE_URL || 'https://via.placeholder.com/300?text=No+Image'
  const toAbs = (u) => {
    if (!u || typeof u !== 'string') return placeholder
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    return `${base}${u.startsWith('/') ? u : `/uploads/${u}`}`
  }
  const normalizeOrder = (o) => ({
    id: String(o._id),
    date: o.createdAt,
    status: o.status,
    totalAmount: o.totalAmount,
    payment: { method: o.paymentMethod, status: o.paymentStatus },
    shipping: { ...o.shippingAddress, estimatedDeliveryDate: o.estimatedDeliveryDate },
    products: (o.items || []).map(i => {
      const pid = String(i.product)
      const pr = pmap.get(pid)
      const images = pr?.images || []
      if (!images || images.length === 0) {
        console.warn('user_order_images_missing', { orderId: String(o._id), productId: pid })
      }
      return {
        product_id: pid,
        name: pr?.title || i.title,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        image_url: toAbs(images[0]),
        image_urls: (images && images.length > 0) ? images.map(toAbs) : [placeholder],
        details: pr || null
      }
    }),
    timeline: Array.isArray(o.statusHistory) ? o.statusHistory : [],
    tracking: o.tracking || null,
    notes: o.notes || ''
  })
  const items = raw.map(normalizeOrder)
  return res.status(200).json({ items, total, page: Number(page), limit: Number(limit) })
}

export async function getMyOrder(req, res) {
  const { id } = req.params
  const order = await Order.findById(id).lean()
  if (!order) return res.status(404).json({ message: 'Order not found' })
  if (String(order.user) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' })
  const ids = Array.from(new Set((order.items || []).map(i => String(i.product))))
  const products = await Product.find({ _id: { $in: ids } }).lean()
  const pmap = new Map(products.map(p => [String(p._id), p]))
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
  const placeholder = process.env.PLACEHOLDER_IMAGE_URL || 'https://via.placeholder.com/300?text=No+Image'
  const toAbs = (u) => {
    if (!u || typeof u !== 'string') return placeholder
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    return `${base}${u.startsWith('/') ? u : `/uploads/${u}`}`
  }
  const normalized = {
    id: String(order._id),
    date: order.createdAt,
    status: order.status,
    totalAmount: order.totalAmount,
    payment: { method: order.paymentMethod, status: order.paymentStatus },
    shipping: { ...order.shippingAddress, estimatedDeliveryDate: order.estimatedDeliveryDate },
    products: (order.items || []).map(i => {
      const pid = String(i.product)
      const pr = pmap.get(pid)
      const images = pr?.images || []
      if (!images || images.length === 0) {
        console.warn('user_order_images_missing', { orderId: String(order._id), productId: pid })
      }
      return {
        product_id: pid,
        name: pr?.title || i.title,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        image_url: toAbs(images[0]),
        image_urls: (images && images.length > 0) ? images.map(toAbs) : [placeholder],
        details: pr || null
      }
    }),
    timeline: Array.isArray(order.statusHistory) ? order.statusHistory : [],
    tracking: order.tracking || null,
    notes: order.notes || ''
  }
  return res.status(200).json({ item: normalized })
}

export { requireAuth }
