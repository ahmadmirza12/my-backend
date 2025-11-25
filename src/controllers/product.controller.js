import { Product } from '../models/product.model.js'

export async function listProducts(req, res) {
  const { page = 1, limit = 20, q, category, minPrice, maxPrice } = req.query
  const filter = {}
  if (q) filter.title = { $regex: q, $options: 'i' }
  if (category) filter.category = category
  if (minPrice || maxPrice) filter.price = { ...(minPrice && { $gte: Number(minPrice) }), ...(maxPrice && { $lte: Number(maxPrice) }) }
  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter)
  ])
  return res.status(200).json({ items, total, page: Number(page), limit: Number(limit) })
}

export async function getProduct(req, res) {
  const { id } = req.params
  const item = await Product.findById(id)
  if (!item) return res.status(404).json({ message: 'Not found' })
  return res.status(200).json({ item })
}

export async function createProduct(req, res) {
  const payload = { ...req.body, createdBy: req.user?._id }
  const item = await Product.create(payload)
  return res.status(201).json({ item })
}

export async function updateProduct(req, res) {
  const { id } = req.params
  const item = await Product.findByIdAndUpdate(id, req.body, { new: true })
  if (!item) return res.status(404).json({ message: 'Not found' })
  return res.status(200).json({ item })
}

export async function deleteProduct(req, res) {
  const { id } = req.params
  const item = await Product.findByIdAndDelete(id)
  if (!item) return res.status(404).json({ message: 'Not found' })
  return res.status(200).json({ message: 'Deleted' })
}

export async function addProductImages(req, res) {
  const { id } = req.params
  const files = req.files || []
  const paths = files.map(f => `/uploads/${f.filename}`)
  const base = `${req.protocol}://${req.get('host')}`
  const urls = paths.map(p => `${base}${p}`)
  if (!id) {
    return res.status(200).json({ urls })
  }
  const item = await Product.findByIdAndUpdate(id, { $push: { images: { $each: urls } } }, { new: true })
  if (!item) return res.status(404).json({ message: 'Not found' })
  return res.status(200).json({ item })
}
