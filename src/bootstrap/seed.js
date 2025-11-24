import { User } from '../models/user.model.js'

export async function ensureDefaultAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Admin'
  if (!email || !password) return
  const existing = await User.findOne({ email, role: 'admin' })
  if (existing) return
  await User.create({ name, email, password, role: 'admin' })
}