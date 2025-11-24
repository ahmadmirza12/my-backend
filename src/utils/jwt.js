import jwt from 'jsonwebtoken'

export function signToken(payload, options = {}) {
  const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET
  const expiresIn = process.env.JWT_EXPIRES || process.env.ACCESS_TOKEN_EXPIRY || '7d'
  return jwt.sign(payload, secret, { expiresIn, ...options })
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET
  return jwt.verify(token, secret)
}