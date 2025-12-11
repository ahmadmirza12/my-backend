import { Order } from '../models/order.model.js'
import { Product } from '../models/product.model.js'
import { User } from '../models/user.model.js'

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

export async function listOrders(req, res) {
  const { status, page = 1, limit = 20 } = req.query
  const filter = {}
  if (status) filter.status = status
  const skip = (Number(page) - 1) * Number(limit)
  const [raw, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email role')
      .lean(),
    Order.countDocuments(filter)
  ])
  const ids = Array.from(new Set(raw.flatMap(o => (o.items || []).map(i => String(i.product)))))
  const products = await Product.find({ _id: { $in: ids } }).lean()
  const pmap = new Map(products.map(p => [String(p._id), p]))
  const normalizeOrder = (o) => ({
    id: String(o._id),
    date: o.createdAt,
    status: o.status,
    totalAmount: o.totalAmount,
    user: o.user ? { id: String(o.user._id), name: o.user.name, email: o.user.email, role: o.user.role } : null,
    payment: { method: o.paymentMethod, status: o.paymentStatus },
    shipping: { ...o.shippingAddress, estimatedDeliveryDate: o.estimatedDeliveryDate },
    products: (o.items || []).map(i => {
      const pr = pmap.get(String(i.product))
      return {
        product_id: String(i.product),
        name: pr?.title || i.title,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
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

export async function getOrder(req, res) {
  const { id } = req.params
  const order = await Order.findById(id).populate('user', 'name email role').lean()
  if (!order) return res.status(404).json({ message: 'Order not found' })
  const ids = Array.from(new Set((order.items || []).map(i => String(i.product))))
  const products = await Product.find({ _id: { $in: ids } }).lean()
  const pmap = new Map(products.map(p => [String(p._id), p]))
  const normalized = {
    id: String(order._id),
    date: order.createdAt,
    status: order.status,
    totalAmount: order.totalAmount,
    user: order.user ? { id: String(order.user._id), name: order.user.name, email: order.user.email, role: order.user.role } : null,
    payment: { method: order.paymentMethod, status: order.paymentStatus },
    shipping: { ...order.shippingAddress, estimatedDeliveryDate: order.estimatedDeliveryDate },
    products: (order.items || []).map(i => {
      const pr = pmap.get(String(i.product))
      return {
        product_id: String(i.product),
        
        name: pr?.title || i.title,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        details: pr || null
      }
    }),
    timeline: Array.isArray(order.statusHistory) ? order.statusHistory : [],
    tracking: order.tracking || null,
    notes: order.notes || ''
    
  }
  return res.status(200).json({ item: normalized })
}

export { requireAdmin }

export async function deleteAllOrders(req, res) {
  const result = await Order.deleteMany({})
  return res.status(200).json({ deletedCount: result?.deletedCount || 0 })
}
