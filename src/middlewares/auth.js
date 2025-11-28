import { verifyToken } from '../utils/jwt.js'
import { User } from '../models/user.model.js'

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null
    const cookieToken = req.cookies?.token
    const token = bearer || cookieToken
    if (!token) {
      console.warn('AUTH_FAIL', { method: req.method, url: req.originalUrl, ip: req.ip, reason: 'missing_token' })
      return res.status(401).json({ message: 'Unauthorized', reason: 'missing_token' })
    }
    const decoded = verifyToken(token)
    const user = await User.findById(decoded.id).select('-password')
    if (!user) {
      console.warn('AUTH_FAIL', { method: req.method, url: req.originalUrl, ip: req.ip, reason: 'user_not_found' })
      return res.status(401).json({ message: 'Unauthorized', reason: 'user_not_found' })
    }
    req.user = user
    next()
  } catch (e) {
    console.warn('AUTH_FAIL', { method: req.method, url: req.originalUrl, ip: req.ip, reason: 'invalid_or_expired_token' })
    return res.status(401).json({ message: 'Unauthorized', reason: 'invalid_or_expired_token' })
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    console.warn('AUTH_FORBID', { method: req.method, url: req.originalUrl, ip: req.ip, reason: 'admin_role_required' })
    return res.status(403).json({ message: 'Forbidden', reason: 'admin_role_required' })
  }
  next()
}

export function requireUser(req, res, next) {
  if (!req.user || req.user.role !== 'user') {
    console.warn('AUTH_FORBID', { method: req.method, url: req.originalUrl, ip: req.ip, reason: 'user_role_required' })
    return res.status(403).json({ message: 'Forbidden', reason: 'user_role_required' })
  }
  next()
}