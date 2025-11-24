import { Order } from '../models/order.model.js'
import { Product } from '../models/product.model.js'

export async function createOrder(req, res) {
  const { items = [], paymentMethod = 'cod', shippingAddress } = req.body
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'No items' })
  const productIds = items.map(i => i.product)
  const products = await Product.find({ _id: { $in: productIds }, status: 'active' })
  const map = new Map(products.map(p => [String(p._id), p]))
  for (const i of items) {
    const p = map.get(String(i.product))
    if (!p) return res.status(400).json({ message: 'Invalid product' })
    if (i.size) {
      const v = (p.variants || []).find(v => v.size === i.size)
      if (!v || v.stock < i.quantity) return res.status(400).json({ message: 'Insufficient stock' })
    } else {
      if (p.stock < i.quantity) return res.status(400).json({ message: 'Insufficient stock' })
    }
  }
  const normalizedItems = items.map(i => {
    const p = map.get(String(i.product))
    return { product: p._id, title: p.title, price: p.price, quantity: i.quantity, size: i.size }
  })
  const totalAmount = normalizedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const order = await Order.create({ user: req.user._id, items: normalizedItems, totalAmount, paymentMethod, paymentStatus: 'unpaid', status: 'pending', shippingAddress })
  return res.status(201).json({ order })
}

export async function getOrder(req, res) {
  const { id } = req.params
  const order = await Order.findById(id).populate('user', 'name email').populate('items.product', 'title images')
  if (!order) return res.status(404).json({ message: 'Not found' })
  if (req.user.role !== 'admin' && String(order.user) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' })
  return res.status(200).json({ order })
}

export async function listMyOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
  return res.status(200).json({ orders })
}

export async function listOrders(req, res) {
  const { status } = req.query
  const filter = {}
  if (status) filter.status = status
  const orders = await Order.find(filter).sort({ createdAt: -1 }).populate('user', 'name email')
  return res.status(200).json({ orders })
}

export async function acceptOrder(req, res) {
  const { id } = req.params
  const { estimatedDeliveryDays = 3, notes } = req.body || {}
  const order = await Order.findById(id)
  if (!order) return res.status(404).json({ message: 'Not found' })
  if (order.status !== 'pending') return res.status(400).json({ message: 'Invalid status' })
  for (const i of order.items) {
    const p = await Product.findById(i.product)
    if (!p) return res.status(400).json({ message: 'Invalid product' })
    if (i.size) {
      const idx = (p.variants || []).findIndex(v => v.size === i.size)
      if (idx === -1 || p.variants[idx].stock < i.quantity) return res.status(400).json({ message: 'Insufficient stock' })
      p.variants[idx].stock -= i.quantity
    } else {
      if (p.stock < i.quantity) return res.status(400).json({ message: 'Insufficient stock' })
      p.stock -= i.quantity
    }
    await p.save()
  }
  const eta = new Date(Date.now() + Number(estimatedDeliveryDays) * 24 * 60 * 60 * 1000)
  order.status = 'accepted'
  order.estimatedDeliveryDate = eta
  order.notes = notes
  await order.save()
  return res.status(200).json({ order })
}

export async function rejectOrder(req, res) {
  const { id } = req.params
  const { notes } = req.body || {}
  const order = await Order.findById(id)
  if (!order) return res.status(404).json({ message: 'Not found' })
  if (order.status !== 'pending') return res.status(400).json({ message: 'Invalid status' })
  order.status = 'rejected'
  order.notes = notes
  await order.save()
  return res.status(200).json({ order })
}