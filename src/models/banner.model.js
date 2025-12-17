import mongoose from 'mongoose'

const BannerSchema = new mongoose.Schema(
  {
    productCategory: { type: String, required: true, index: true },
    bannerImage: { type: String, required: true },
    title: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

export const Banner = mongoose.model('Banner', BannerSchema)
