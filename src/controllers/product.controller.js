import { Product } from '../models/product.model.js'
import { v2 as cloudinary } from 'cloudinary'

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
  let colors = []
  const incoming = payload.colors
  if (Array.isArray(incoming)) {
    colors = incoming
  } else if (typeof incoming === 'string') {
    colors = incoming.split(',').map(s => s.trim()).filter(Boolean)
  } else if (Array.isArray(payload.variants)) {
    colors = payload.variants.map(v => v?.color).filter(Boolean)
  }
  payload.colors = Array.from(new Set(colors))
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
  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded. Use multipart/form-data with field name "images".' })
  }
  const allowed = ['image/jpeg','image/png','image/gif']
  if (files.some(f => f.mimetype && !allowed.includes(f.mimetype))) {
    return res.status(400).json({ message: 'Invalid file type. Allowed: JPEG, PNG, GIF' })
  }
  const hasUrl = Boolean(process.env.CLOUDINARY_URL)
  const hasCreds = Boolean(process.env.CLOUDINARY_CLOUD_NAME) && Boolean(process.env.CLOUDINARY_API_KEY) && Boolean(process.env.CLOUDINARY_API_SECRET)
  const useUnsigned = Boolean(process.env.CLOUDINARY_UPLOAD_PRESET)
  if (!hasUrl && !hasCreds && !useUnsigned) {
    return res.status(400).json({ message: 'Cloudinary not configured. Provide CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + API KEY/SECRET or CLOUDINARY_UPLOAD_PRESET.' })
  }
  if (hasUrl) {
    cloudinary.config({ secure: true })
  } else if (hasCreds) {
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true })
  } else {
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, secure: true })
  }
  let urls = []
  try {
    const uploaded = await Promise.all(files.map(async (f) => {
      const commonOpts = useUnsigned ? { folder: 'products', upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET } : { folder: 'products' }
      if (f.buffer && f.buffer.length > 0) {
        return await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(commonOpts, (err, result) => {
            if (err) return reject(err)
            const meta = {
              url: result?.secure_url || result?.url,
              public_id: result?.public_id,
              width: result?.width,
              height: result?.height,
              format: result?.format,
              resource_type: result?.resource_type
            }
            resolve(meta)
          })
          stream.end(f.buffer)
        })
      }
      if (f.path) {
        const result = await cloudinary.uploader.upload(f.path, commonOpts)
        return {
          url: result?.secure_url || result?.url,
          public_id: result?.public_id,
          width: result?.width,
          height: result?.height,
          format: result?.format,
          resource_type: result?.resource_type
        }
      }
      throw new Error('No file buffer or path provided')
    }))
    urls = uploaded.map(u => u.url)
    if (!id) {
      return res.status(200).json({ urls, files: uploaded })
    }
    const item = await Product.findByIdAndUpdate(id, { $push: { images: { $each: urls } } }, { new: true })
    if (!item) return res.status(404).json({ message: 'Not found' })
    return res.status(200).json({ item, uploaded: uploaded })
  } catch (e) {
    return res.status(500).json({ message: 'Cloudinary upload failed', error: e?.message || String(e) })
  }
}
