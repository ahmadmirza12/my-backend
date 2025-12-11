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
  if (req.user.role !== 'admin' && String(order.user?._id || order.user) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' })
  
  const getProductId = (prod) => {
    if (typeof prod === 'string') return prod === 'null' ? null : prod
    if (prod && typeof prod === 'object' && prod._id) return String(prod._id)
    return null
  }
  
  const ids = Array.from(new Set((order.items || []).map(i => getProductId(i.product)).filter(Boolean))).filter(id => mongoose.Types.ObjectId.isValid(id))
  const products = await Product.find({ _id: { $in: ids } }).lean()
  const pmap = new Map(products.map(p => [String(p._id), p]))
  
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
  const placeholder = process.env.PLACEHOLDER_IMAGE_URL || 'https://demofree.sirv.com/nope-not-here.jpg'
  const toAbs = (u) => {
    if (!u || typeof u !== 'string') {
      return placeholder.replace(/[`\s]/g, '').trim()
    }
    
    const cleanUrl = u.replace(/[`\s]/g, '').trim()
    
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl
    
    const cleanBase = base.replace(/\/$/, '')
    const cleanPath = cleanUrl.startsWith('/') ? cleanUrl : `/uploads/${cleanUrl}`
    return `${cleanBase}${cleanPath}`
  }
  
  const hist = Array.isArray(order.statusHistory) ? order.statusHistory : []
  const timeline = hist.map(h => ({ status: h.status, at: h.at }))
  if (!timeline.find(e => e.status === 'pending')) timeline.unshift({ status: 'pending', at: order.createdAt })
  
  const normalized = {
    id: String(order._id),
    date: order.createdAt,
    status: order.status,
    totalAmount: order.totalAmount,
    user: order.user ? { id: String(order.user._id), name: order.user?.name, email: order.user?.email } : null,
    payment: { method: order.paymentMethod, status: order.paymentStatus },
    shipping: { ...order.shippingAddress, estimatedDeliveryDate: order.estimatedDeliveryDate },
    products: (order.items || []).map(i => {
      const productId = getProductId(i.product)
      const pr = productId ? pmap.get(productId) : null
      const images = pr?.images || []
      if (!images || images.length === 0) {
        console.warn('order_images_missing', { orderId: String(order._id), productId: productId || 'unknown' })
      }
      
      return {
        product_id: productId || 'unknown',
        product_data: pr ? {
          _id: pr._id,
          title: pr.title,
          description: pr.description || '',
          price: pr.price,
          images: pr.images?.map(toAbs) || [],
          colors: pr.colors || [],
          stock: pr.stock || 0,
          category: pr.category || 'Unknown',
          status: pr.status || 'inactive',
          variants: pr.variants || [],
          createdBy: pr.createdBy,
          createdAt: pr.createdAt,
          updatedAt: pr.updatedAt
        } : null,
        name: pr?.title || i.title,
        description: pr?.description || '',
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        stock: pr?.stock || 0,
        category: pr?.category || 'Unknown',
        status: pr?.status || 'inactive',
        images: images.map(toAbs),
        image_url: images.length > 0 ? toAbs(images[0]) : placeholder.replace(/[`\s]/g, '').trim(),
        image_urls: images.length > 0 ? images.map(toAbs) : [placeholder.replace(/[`\s]/g, '').trim()],
        colors: pr?.colors || [],
        variants: pr?.variants || []
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
  
  const getProductId = (prod) => {
    if (typeof prod === 'string') return prod === 'null' ? null : prod
    if (prod && typeof prod === 'object' && prod._id) return String(prod._id)
    return null
  }
  
  const ids = Array.from(new Set(raw.flatMap(o => (o.items || []).map(i => getProductId(i.product)).filter(Boolean)))).filter(id => mongoose.Types.ObjectId.isValid(id))
  const products = await Product.find({ _id: { $in: ids } }).lean()
  const pmap = new Map(products.map(p => [String(p._id), p]))
  
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
  const placeholder = process.env.PLACEHOLDER_IMAGE_URL || 'https://demofree.sirv.com/nope-not-here.jpg'
  const toAbs = (u) => {
    if (!u || typeof u !== 'string') {
      return placeholder.replace(/[`\s]/g, '').trim()
    }
    
    const cleanUrl = u.replace(/[`\s]/g, '').trim()
    
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl
    
    const cleanBase = base.replace(/\/$/, '')
    const cleanPath = cleanUrl.startsWith('/') ? cleanUrl : `/uploads/${cleanUrl}`
    return `${cleanBase}${cleanPath}`
  }
  
  const getTimeline = (o) => {
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
      const productId = getProductId(i.product)
      const pr = productId ? pmap.get(productId) : null
      const images = pr?.images || []
      if (!images || images.length === 0) {
        console.warn('order_images_missing', { orderId: String(o._id), productId: productId || 'unknown' })
      }
      
      return {
        product_id: productId || 'unknown',
        product_data: pr ? {
          _id: pr._id,
          title: pr.title,
          description: pr.description || '',
          price: pr.price,
          images: pr.images?.map(toAbs) || [],
          colors: pr.colors || [],
          stock: pr.stock || 0,
          category: pr.category || 'Unknown',
          status: pr.status || 'inactive',
          variants: pr.variants || [],
          createdBy: pr.createdBy,
          createdAt: pr.createdAt,
          updatedAt: pr.updatedAt
        } : null,
        name: pr?.title || i.title,
        description: pr?.description || '',
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        stock: pr?.stock || 0,
        category: pr?.category || 'Unknown',
        status: pr?.status || 'inactive',
        images: images.map(toAbs),
        image_url: images.length > 0 ? toAbs(images[0]) : placeholder.replace(/[`\s]/g, '').trim(),
        image_urls: images.length > 0 ? images.map(toAbs) : [placeholder.replace(/[`\s]/g, '').trim()],
        colors: pr?.colors || [],
        variants: pr?.variants || []
      }
    }),
    timeline: getTimeline(o),
    tracking: o.tracking || null
  })
  
  const items = raw.map(normalizeOrder)
  return res.status(200).json({ items, total, page: Number(page), limit: Number(limit), format: 'v2' })
}

export async function listMyOrdersFull(req, res) {
  const raw = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean()
  
  const getProductId = (prod) => {
    if (typeof prod === 'string') return prod === 'null' ? null : prod
    if (prod && typeof prod === 'object' && prod._id) return String(prod._id)
    return null
  }
  
  const ids = Array.from(new Set(raw.flatMap(o => (o.items || []).map(i => getProductId(i.product)).filter(Boolean)))).filter(id => mongoose.Types.ObjectId.isValid(id))
  const products = await Product.find({ _id: { $in: ids } }).lean()
  const pmap = new Map(products.map(p => [String(p._id), p]))
  
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
  const placeholder = process.env.PLACEHOLDER_IMAGE_URL || 'https://demofree.sirv.com/nope-not-here.jpg'
  const toAbs = (u) => {
    if (!u || typeof u !== 'string') {
      return placeholder.replace(/[`\s]/g, '').trim()
    }
    
    const cleanUrl = u.replace(/[`\s]/g, '').trim()
    
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl
    
    const cleanBase = base.replace(/\/$/, '')
    const cleanPath = cleanUrl.startsWith('/') ? cleanUrl : `/uploads/${cleanUrl}`
    return `${cleanBase}${cleanPath}`
  }
  
  const orders = raw.map(o => ({
    ...o,
    items: (o.items || []).map(i => {
      const productId = getProductId(i.product)
      const pr = productId ? pmap.get(productId) : null
      
      return {
        ...i,
        product: pr || i.product,
        product_id: productId || 'unknown',
        product_data: pr ? {
          _id: pr._id,
          title: pr.title,
          description: pr.description || '',
          price: pr.price,
          images: pr.images?.map(toAbs) || [],
          colors: pr.colors || [],
          stock: pr.stock || 0,
          category: pr.category || 'Unknown',
          status: pr.status || 'inactive',
          variants: pr.variants || []
        } : null,
        image_url: toAbs(pr?.images?.[0])
      }
    })
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
      .populate({ path: 'items.product', select: 'title description images colors stock category status variants price createdBy createdAt updatedAt' })
      .lean(),
    Order.countDocuments(filter)
  ])
  
  const getProductId = (prod) => {
    if (typeof prod === 'string') return prod === 'null' ? null : prod
    if (prod && typeof prod === 'object' && prod._id) return String(prod._id)
    return null
  }
  
  const ids = Array.from(new Set(raw.flatMap(o => (o.items || []).map(i => getProductId(i.product)).filter(Boolean)))).filter(id => mongoose.Types.ObjectId.isValid(id))
  const products = await Product.find({ _id: { $in: ids } }).lean()
  const pmap = new Map(products.map(p => [String(p._id), p]))
  
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
  const placeholder = process.env.PLACEHOLDER_IMAGE_URL || 'https://demofree.sirv.com/nope-not-here.jpg'
  const toAbs = (u) => {
    if (!u || typeof u !== 'string') {
      return placeholder.replace(/[`\s]/g, '').trim()
    }
    
    const cleanUrl = u.replace(/[`\s]/g, '').trim()
    
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl
    
    const cleanBase = base.replace(/\/$/, '')
    const cleanPath = cleanUrl.startsWith('/') ? cleanUrl : `/uploads/${cleanUrl}`
    return `${cleanBase}${cleanPath}`
  }
  
  const getTimeline = (o) => {
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
      const productId = getProductId(i.product)
      const pr = productId ? pmap.get(productId) : null
      const images = pr?.images || []
      if (!images || images.length === 0) {
        console.warn('order_images_missing', { orderId: String(o._id), productId: productId || 'unknown' })
      }
      
      return {
        product_id: productId || 'unknown',
        product_data: pr ? {
          _id: pr._id,
          title: pr.title,
          description: pr.description || '',
          price: pr.price,
          images: pr.images?.map(toAbs) || [],
          colors: pr.colors || [],
          stock: pr.stock || 0,
          category: pr.category || 'Unknown',
          status: pr.status || 'inactive',
          variants: pr.variants || [],
          createdBy: pr.createdBy,
          createdAt: pr.createdAt,
          updatedAt: pr.updatedAt
        } : null,
        name: pr?.title || i.title,
        description: pr?.description || '',
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        stock: pr?.stock || 0,
        category: pr?.category || 'Unknown',
        status: pr?.status || 'inactive',
        images: images.map(toAbs),
        image_url: images.length > 0 ? toAbs(images[0]) : placeholder.replace(/[`\s]/g, '').trim(),
        image_urls: images.length > 0 ? images.map(toAbs) : [placeholder.replace(/[`\s]/g, '').trim()],
        colors: pr?.colors || [],
        variants: pr?.variants || []
      }
    }),
    timeline: getTimeline(o),
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
  // Skip stock validation and decrement; accept orders regardless of stock
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