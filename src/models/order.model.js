import mongoose from 'mongoose'

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String }
  },
  { _id: false }
)

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['cod', 'card'], default: 'cod' },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    stripePaymentIntentId: { type: String },
    stripeCheckoutSessionId: { type: String },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    estimatedDeliveryDate: { type: Date },
    shippingAddress: {
      name: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    tracking: {
      carrier: String,
      trackingNumber: String,
      url: String,
      shippedAt: Date,
      deliveredAt: Date
    },
    statusHistory: [
      {
        status: { type: String },
        at: { type: Date }
      }
    ],
    notes: String
  },
  { timestamps: true }
)

export const Order = mongoose.model('Order', OrderSchema)