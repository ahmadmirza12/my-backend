import jwt from 'jsonwebtoken'

export function signToken(payload, options = {}) {
  const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET
  const configured = process.env.JWT_EXPIRES || process.env.ACCESS_TOKEN_EXPIRY
  const val = String(configured || '').toLowerCase()
  const disable = val === 'never' || val === 'none' || val === '0' || val === 'false'
  if (disable) {
    return jwt.sign(payload, secret, { ...options })
  }
  const expiresIn = configured || '7d'
  return jwt.sign(payload, secret, { expiresIn, ...options })
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET
  return jwt.verify(token, secret)
}
