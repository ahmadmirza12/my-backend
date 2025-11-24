import mongoose from 'mongoose'

const VariantSchema = new mongoose.Schema(
  {
    size: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 }
  },
  { _id: false }
)

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    stock: { type: Number, required: true, min: 0 },
    variants: [VariantSchema],
    category: { type: String, index: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

export const Product = mongoose.model('Product', ProductSchema)