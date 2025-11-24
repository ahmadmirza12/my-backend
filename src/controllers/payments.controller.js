import { getStripe } from '../services/stripe.js'
import { Order } from '../models/order.model.js'

function amountToMinorUnits(amount, currency) {
  const zeroDecimal = ['jpy']
  return zeroDecimal.includes(currency.toLowerCase()) ? Math.round(amount) : Math.round(amount * 100)
}

export async function createPaymentIntent(req, res) {
  const { orderId, currency, receiptEmail } = req.body
  const order = await Order.findById(orderId)
  if (!order) return res.status(404).json({ message: 'Order not found' })
  if (req.user.role !== 'admin' && String(order.user) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' })
  if (order.paymentStatus === 'paid') return res.status(400).json({ message: 'Already paid' })
  const cur = (currency || process.env.STRIPE_CURRENCY || 'usd').toLowerCase()
  const amount = amountToMinorUnits(order.totalAmount, cur)
  const stripe = getStripe()
  const intent = await stripe.paymentIntents.create({ amount, currency: cur, metadata: { orderId }, receipt_email: receiptEmail })
  order.paymentMethod = 'card'
  order.stripePaymentIntentId = intent.id
  await order.save()
  return res.status(200).json({ clientSecret: intent.client_secret, paymentIntentId: intent.id })
}

export async function createCheckoutSession(req, res) {
  const { orderId, currency, successUrl, cancelUrl } = req.body
  const order = await Order.findById(orderId)
  if (!order) return res.status(404).json({ message: 'Order not found' })
  if (req.user.role !== 'admin' && String(order.user) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' })
  if (order.paymentStatus === 'paid') return res.status(400).json({ message: 'Already paid' })
  const cur = (currency || process.env.STRIPE_CURRENCY || 'usd').toLowerCase()
  const line_items = order.items.map(i => ({ price_data: { currency: cur, product_data: { name: i.title }, unit_amount: amountToMinorUnits(i.price, cur) }, quantity: i.quantity }))
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({ mode: 'payment', line_items, success_url: successUrl || process.env.STRIPE_SUCCESS_URL, cancel_url: cancelUrl || process.env.STRIPE_CANCEL_URL, metadata: { orderId } })
  order.paymentMethod = 'card'
  order.stripeCheckoutSessionId = session.id
  await order.save()
  return res.status(200).json({ url: session.url, sessionId: session.id })
}

export async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature']
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  let event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(req.body, sig, secret)
  } catch (err) {
    return res.status(400).send(`Webhook Error`)
  }
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object
    const orderId = intent.metadata?.orderId
    if (orderId) {
      const order = await Order.findById(orderId)
      if (order) {
        order.paymentStatus = 'paid'
        await order.save()
      }
    }
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const orderId = session.metadata?.orderId
    if (orderId) {
      const order = await Order.findById(orderId)
      if (order) {
        order.paymentStatus = 'paid'
        await order.save()
      }
    }
  }
  return res.status(200).json({ received: true })
}