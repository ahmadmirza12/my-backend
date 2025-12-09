import { Order } from '../models/order.model.js'
import { Product } from '../models/product.model.js'
import mongoose from 'mongoose'

export async function deleteAllOrders(req, res) {
  const result = await Order.deleteMany({})
  return res.status(200).json({ deletedCount: result?.deletedCount || 0 })
}

export async function createOrder(req, res) {
  const { items = [], paymentMethod = 'cod', shippingAddress } = req.body
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'No items' })
  const productIds = items.map(i => i.product)
  const products = await Product.find({ _id: { $in: productIds }, status: 'active' })
  const map = new Map(products.map(p => [String(p._id), p]))
  for (const i of items) {
    const p = map.get(String(i.product))
    if (!p) return res.status(400).json({ message: 'Invalid product' })
    const wantsVariant = Boolean(i.size) || Boolean(i.color)
    if (wantsVariant) {
      const v = (p.variants || []).find(v => (!i.size || v.size === i.size) && (!i.color || v.color === i.color))
      if (!v || v.stock < i.quantity) return res.status(400).json({ message: 'Insufficient stock' })
    } else {
      if (p.stock < i.quantity) return res.status(400).json({ message: 'Insufficient stock' })
    }
  }
  const normalizedItems = items.map(i => {
    const p = map.get(String(i.product))
    return { product: p._id, title: p.title, price: p.price, quantity: i.quantity, size: i.size, color: i.color }
  })
  const totalAmount = normalizedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const order = await Order.create({ user: req.user._id, items: normalizedItems, totalAmount, paymentMethod, paymentStatus: 'unpaid', status: 'pending', shippingAddress, statusHistory: [{ status: 'pending', at: new Date() }] })
  return res.status(201).json({ order })
}

export async function getOrder(req, res) {
  const { id } = req.params
  const order = await Order.findById(id).populate('user', 'name email').lean()
  if (!order) return res.status(404).json({ message: 'Not found' })
  if (req.user.role !== 'admin' && String(order.user) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' })
  const ids = Array.from(new Set((order.items || []).map(i => {
    const p = i.product
    const pid = (p && typeof p === 'object') ? p._id : p
    return pid ? String(pid) : null
  }).filter(Boolean))).filter(id => mongoose.Types.ObjectId.isValid(id))
  const products = await Product.find({ _id: { $in: ids } }).lean()
  const pmap = new Map(products.map(p => [String(p._id), p]))
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
  const placeholder = process.env.PLACEHOLDER_IMAGE_URL || 'https://via.placeholder.com/300?text=No+Image'
  const toAbs = (u) => {
    if (!u || typeof u !== 'string') return placeholder
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    return `${base}${u.startsWith('/') ? u : `/uploads/${u}`}`
  }
  const hist = Array.isArray(order.statusHistory) ? order.statusHistory : []
  const timeline = hist.map(h => ({ status: h.status, at: h.at }))
  if (!timeline.find(e => e.status === 'pending')) timeline.unshift({ status: 'pending', at: order.createdAt })
  const normalized = {
    id: String(order._id),
    date: order.createdAt,
    status: order.status,
    totalAmount: order.totalAmount,
    user: order.user ? { id: String(order.user), name: order.user?.name, email: order.user?.email } : null,
    payment: { method: order.paymentMethod, status: order.paymentStatus },
    shipping: { ...order.shippingAddress, estimatedDeliveryDate: order.estimatedDeliveryDate },
    products: (order.items || []).map(i => {
      const pr = (i.product && typeof i.product === 'object') ? i.product : pmap.get(String(i.product))
      const images = pr?.images || []
      if (!images || images.length === 0) {
        console.warn('order_images_missing', { orderId: String(order._id), productId: pr?._id ? String(pr._id) : String(i.product) })
      }
      return {
        product_id: (i.product && typeof i.product === 'object') ? String(i.product._id) : String(i.product),
        name: pr?.title || i.title,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        image_url: toAbs(images[0]),
        image_urls: (images && images.length > 0) ? images.map(toAbs) : [placeholder]
      }
    }),
    timeline,
    tracking: order.tracking || null
  }
  return res.status(200).json({ item: normalized })
}

export async function listMyOrders(req, res) {
  const { page = 1, limit = 20 } = req.query
  const skip = (Number(page) - 1) * Number(limit)
  const [raw, total] = await Promise.all([
    Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Order.countDocuments({ user: req.user._id })
  ])
  const ids = Array.from(new Set(raw.flatMap(o => (o.items || []).map(i => {
    const p = i.product
    const pid = (p && typeof p === 'object') ? p._id : p
    return pid ? String(pid) : null
  })).filter(Boolean))).filter(id => mongoose.Types.ObjectId.isValid(id))
  const products = await Product.find({ _id: { $in: ids } }).lean()
  const pmap = new Map(products.map(p => [String(p._id), p]))
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
  const placeholder = process.env.PLACEHOLDER_IMAGE_URL || 'https://via.placeholder.com/300?text=No+Image'
  const toAbs = (u) => {
    if (!u || typeof u !== 'string') return placeholder
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    return `${base}${u.startsWith('/') ? u : `/uploads/${u}`}`
  }
  const timeline = (o) => {
    const hist = Array.isArray(o.statusHistory) ? o.statusHistory : []
    const entries = hist.map(h => ({ status: h.status, at: h.at }))
    if (!entries.find(e => e.status === 'pending')) entries.unshift({ status: 'pending', at: o.createdAt })
    return entries
  }
  const normalizeOrder = (o) => ({
    id: String(o._id),
    date: o.createdAt,
    status: o.status,
    totalAmount: o.totalAmount,
    payment: { method: o.paymentMethod, status: o.paymentStatus },
    shipping: { ...o.shippingAddress, estimatedDeliveryDate: o.estimatedDeliveryDate },
    products: (o.items || []).map(i => {
      const pid = (i.product && typeof i.product === 'object' && i.product._id) ? String(i.product._id) : String(i.product)
      const pr = pmap.get(pid) || (typeof i.product === 'object' ? i.product : null)
      const images = pr?.images || []
      if (!images || images.length === 0) {
        console.warn('order_images_missing', { orderId: String(o._id), productId: pid })
      }
      return {
        product_id: pid,
        name: pr?.title || i.title,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        image_url: toAbs(images[0]),
        image_urls: (images && images.length > 0) ? images.map(toAbs) : [placeholder]
      }
    }),
    timeline: timeline(o),
    tracking: o.tracking || null
  })
  const items = raw.map(normalizeOrder)
  return res.status(200).json({ items, total, page: Number(page), limit: Number(limit), format: 'v2' })
}

export async function listMyOrdersFull(req, res) {
  const raw = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean()
  const ids = Array.from(new Set(raw.flatMap(o => (o.items || []).map(i => {
    const p = i.product
    const pid = (p && typeof p === 'object') ? p._id : p
    return pid ? String(pid) : null
  })).filter(Boolean))).filter(id => mongoose.Types.ObjectId.isValid(id))
  const products = await Product.find({ _id: { $in: ids } }).lean()
  const pmap = new Map(products.map(p => [String(p._id), p]))
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
  const toAbs = (u) => {
    if (!u) return null
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    return `${base}${u.startsWith('/') ? u : `/uploads/${u}`}`
  }
  const orders = raw.map(o => ({
    ...o,
    items: (o.items || []).map(i => ({
      ...i,
      product: pmap.get(String(i.product)) || i.product,
      product_id: (i.product && typeof i.product === 'object') ? String(i.product._id) : String(i.product),
      image_url: toAbs(pmap.get(String(i.product))?.images?.[0])
    }))
  }))
  return res.status(200).json({ orders })
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
      .populate('user', 'name email')
      .populate({ path: 'items.product', select: 'title images' })
      .lean(),
    Order.countDocuments(filter)
  ])
  const ids = Array.from(new Set(raw.flatMap(o => (o.items || []).map(i => {
    const p = i.product
    const pid = (p && typeof p === 'object') ? p._id : p
    return pid ? String(pid) : null
  })).filter(Boolean))).filter(id => mongoose.Types.ObjectId.isValid(id))
  const products = await Product.find({ _id: { $in: ids } }).lean()
  const pmap = new Map(products.map(p => [String(p._id), p]))
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
  const placeholder = process.env.PLACEHOLDER_IMAGE_URL || 'https://via.placeholder.com/300?text=No+Image'
  const toAbs = (u) => {
    if (!u || typeof u !== 'string') return placeholder
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    return `${base}${u.startsWith('/') ? u : `/uploads/${u}`}`
  }
  const timeline = (o) => {
    const hist = Array.isArray(o.statusHistory) ? o.statusHistory : []
    const entries = hist.map(h => ({ status: h.status, at: h.at }))
    if (!entries.find(e => e.status === 'pending')) entries.unshift({ status: 'pending', at: o.createdAt })
    return entries
  }
  const normalizeOrder = (o) => ({
    id: String(o._id),
    date: o.createdAt,
    status: o.status,
    totalAmount: o.totalAmount,
    user: o.user ? { id: String(o.user._id || o.user.id || o.user), name: o.user.name, email: o.user.email } : null,
    payment: { method: o.paymentMethod, status: o.paymentStatus },
    shipping: { ...o.shippingAddress, estimatedDeliveryDate: o.estimatedDeliveryDate },
    products: (o.items || []).map(i => {
      const pr = (i.product && typeof i.product === 'object') ? i.product : pmap.get(String(i.product))
      const images = pr?.images || []
      if (!images || images.length === 0) {
        console.warn('order_images_missing', { orderId: String(o._id), productId: pr?._id ? String(pr._id) : String(i.product) })
      }
      return {
        product_id: (i.product && typeof i.product === 'object') ? String(i.product._id) : String(i.product),
        name: pr?.title || i.title,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        image_url: toAbs(images[0]),
        image_urls: (images && images.length > 0) ? images.map(toAbs) : [placeholder]
      }
    }),
    timeline: timeline(o),
    tracking: o.tracking || null
  })
  const items = raw.map(normalizeOrder)
  return res.status(200).json({ items, total, page: Number(page), limit: Number(limit) })
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
    const wantsVariant = Boolean(i.size) || Boolean(i.color)
    if (wantsVariant) {
      const idx = (p.variants || []).findIndex(v => (!i.size || v.size === i.size) && (!i.color || v.color === i.color))
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
  order.statusHistory = [...(order.statusHistory || []), { status: 'accepted', at: new Date() }]
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
  order.statusHistory = [...(order.statusHistory || []), { status: 'rejected', at: new Date() }]
  await order.save()
  return res.status(200).json({ order })
}
