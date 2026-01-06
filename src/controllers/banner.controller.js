import { Banner } from '../models/banner.model.js'
import { Product } from '../models/product.model.js'
import { Order } from '../models/order.model.js'
import express from 'express';
const router = express.Router();

// productCategory validation removed: any non-empty string is accepted

export function buildActiveDateFilter(now = new Date()) {
  return {
    isActive: true,
    $and: [
      { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }] }
    ]
  }
}

export function isBannerActive(b, now = new Date()) {
  if (!b?.isActive) return false
  const s = b.startDate ? new Date(b.startDate) : null
  const e = b.endDate ? new Date(b.endDate) : null
  if (s && s > now) return false
  if (e && e < now) return false
  return true
}

export async function createBanner(req, res) {
  const { productCategory, bannerImage } = req.body || {}
  if (!productCategory) return res.status(400).json({ message: 'productCategory is required' })
  if (!bannerImage) return res.status(400).json({ message: 'bannerImage is required' })
  const isUrl = (s) => typeof s === 'string' && /^https?:\/\//.test(String(s).trim())
  let cat = String(productCategory).trim()
  let img = String(bannerImage).replace(/[\`\s]/g, '').trim()
  const catLooksUrl = isUrl(cat) || /\/uploads\//.test(cat)
  const imgLooksUrl = isUrl(img)
  if (catLooksUrl && !imgLooksUrl) {
    const tmp = cat
    cat = img
    img = tmp
  }
  if (!cat || isUrl(cat)) return res.status(400).json({ message: 'Invalid productCategory' })
  if (!imgLooksUrl) return res.status(400).json({ message: 'bannerImage must be a valid URL' })
  const payload = {
    productCategory: cat,
    bannerImage: img,
    title: '',
    isActive: true,
    createdBy: req.user?._id
  }
  const item = await Banner.create(payload)
  return res.status(201).json({ item })
}

export async function createOwnBanner(req, res) {
  try {
    if (!req.user || !req.user._id) return res.status(401).json({ message: 'Unauthorized' })
    const { productCategory, bannerImage } = req.body || {}
    if (!productCategory) return res.status(400).json({ message: 'productCategory is required' })
    if (!bannerImage) return res.status(400).json({ message: 'bannerImage is required' })
    const exists = await Banner.findOne({ createdBy: req.user._id })
    if (exists) return res.status(409).json({ message: 'Banner already exists for this user' })
    const item = await Banner.create({
      productCategory: String(productCategory).trim(),
      bannerImage: String(bannerImage).trim(),
      title: '',
      isActive: true,
      createdBy: req.user._id
    })
    return res.status(201).json({ item })
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Server Error' })
  }
}

export async function updateOwnBannerImage(req, res) {
  try {
    if (!req.user || !req.user._id) return res.status(401).json({ message: 'Unauthorized' })
    const { bannerImage } = req.body || {}
    if (!bannerImage) return res.status(400).json({ message: 'bannerImage is required' })
    const item = await Banner.findOneAndUpdate(
      { createdBy: req.user._id },
      { $set: { bannerImage: String(bannerImage).trim() } },
      { new: true }
    )
    if (!item) return res.status(404).json({ message: 'Banner not found for this user' })
    return res.status(200).json({ item })
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Server Error' })
  }
}

export async function updateBanner(req, res) {
  const { id } = req.params
  const { productCategory, bannerImage } = req.body || {}
  const update = {}
  if (typeof productCategory === 'string' && productCategory.trim()) {
    const cat = productCategory.trim()
    if (/^https?:\/\//.test(cat)) return res.status(400).json({ message: 'Invalid productCategory' })
    update.productCategory = cat
  }
  if (typeof bannerImage === 'string' && bannerImage.trim()) {
    const img = bannerImage.replace(/[\`\s]/g, '').trim()
    if (!/^https?:\/\//.test(img)) return res.status(400).json({ message: 'bannerImage must be a valid URL' })
    update.bannerImage = img
  }
  const item = await Banner.findByIdAndUpdate(id, update, { new: true })
  if (!item) return res.status(404).json({ message: 'Not found' })
  return res.status(200).json({ item })
}

export async function deleteBanner(req, res) {
  const { id } = req.params
  const item = await Banner.findByIdAndDelete(id)
  if (!item) return res.status(404).json({ message: 'Not found' })
  return res.status(200).json({ message: 'Deleted' })
}

export async function getAllBanners(req, res) {
  try {
    const banners = await Banner.find({});
    return res.status(200).json({ success: true, count: banners.length, data: banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return res.status(500).json({ success: false, message: 'Error fetching banners', error: error.message });
  }
}

export async function listUserProductBanners(req, res) {
  try {
    const { category, limit = 20, offset = 0 } = req.query || {};
    const now = new Date();
    const activeFilter = buildActiveDateFilter(now);

    // Base filter for active banners
    let filter = { ...activeFilter };

    // If specific category is requested, use it
    if (category) {
      filter.productCategory = String(category).trim();
    }

    const total = await Banner.countDocuments(filter);
    const items = await Banner.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .lean();

    const enriched = await Promise.all(items.map(async (b) => {
      const count = b.productCategory 
        ? await Product.countDocuments({ category: b.productCategory })
        : 0;
      return {
        ...b,
        categoryInfo: { 
          name: b.productCategory || 'Uncategorized',
          productCount: count 
        }
      };
    }));

    return res.status(200).json({
      items: enriched,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Server Error' });
  }
}

// Exports are already handled by the 'export' keyword in function declarations