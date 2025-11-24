import { verifyToken } from '../utils/jwt.js'
import { User } from '../models/user.model.js'

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null
    const cookieToken = req.cookies?.token
    const token = bearer || cookieToken
    if (!token) return res.status(401).json({ message: 'Unauthorized' })
    const decoded = verifyToken(token)
    const user = await User.findById(decoded.id).select('-password')
    if (!user) return res.status(401).json({ message: 'Unauthorized' })
    req.user = user
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
  next()
}