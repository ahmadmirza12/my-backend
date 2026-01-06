import { User } from '../models/user.model.js'
import { signToken } from '../utils/jwt.js'
import { Otp } from '../models/otp.model.js'
import { sendOtpMail } from '../services/mailer.js'
import bcrypt from 'bcryptjs'

function setTokenCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'
  const configured = process.env.JWT_EXPIRES || process.env.ACCESS_TOKEN_EXPIRY
  const val = String(configured || '').toLowerCase()
  const disable = val === 'never' || val === 'none' || val === '0' || val === 'false'
  const maxAge = disable ? 10 * 365 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge,
    path: '/'
  })
}

export async function signup(req, res) {
  try {
    const { name, email, password, otpCode } = req.body || {}
    let exists = false
    try {
      const found = await User.findOne({ email })
      exists = !!found
    } catch (_) {}
    if (exists) return res.status(409).json({ message: 'Email already in use' })
    const otp = await Otp.findOne({ email, code: String(otpCode), used: false, expiresAt: { $gt: new Date() } })
    if (!otp) return res.status(400).json({ message: 'Invalid or expired OTP' })
    const user = await User.create({ name, email, password, role: 'user' })
    otp.used = true
    await otp.save()
    const token = signToken({ id: user._id, role: user.role })
    setTokenCookie(res, token)
    const safe = { id: user._id, name: user.name, email: user.email, role: user.role }
    return res.status(201).json({ user: safe, token })
  } catch (e) {
    console.error('SEND_OTP_ERROR', e)
    const fallbackCode = String(Math.floor(100000 + Math.random() * 900000))
    return res.status(200).json({ message: 'OTP sent', code: fallbackCode })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {}
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })
    const ok = await user.comparePassword(password)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
    const token = signToken({ id: user._id, role: user.role })
    setTokenCookie(res, token)
    const safe = { id: user._id, name: user.name, email: user.email, role: user.role }
    return res.status(200).json({ user: safe, token })
  } catch (e) {
    return res.status(400).json({ message: 'Invalid data' })
  }
}

export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body || {}
    const admin = await User.findOne({ email })
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Admin not found' })
    }
    if (admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }
    const token = signToken({ id: admin._id, role: admin.role })
    setTokenCookie(res, token)
    return res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      token,
      admin: { id: admin._id, email: admin.email, role: admin.role }
    })
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

export async function me(req, res) {
  const user = req.user
  return res.status(200).json({ user })
}

export async function logout(req, res) {
  res.clearCookie('token', { path: '/' })
  return res.status(200).json({ message: 'Logged out' })
}
export async function sendOtp(req, res) {
  const { email } = req.body || {}
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ message: 'A valid email is required' })
  }
  
  // Generate OTP code and expiration
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  try {
    await Otp.create({ email, code, expiresAt })
  } catch (_) {}
  let previewUrl
  try {
    const info = await sendOtpMail(email, code)
    if (info && info.previewUrl) previewUrl = info.previewUrl
  } catch (_) {}
  const payload = { message: 'OTP sent', code }
  if (previewUrl) payload.previewUrl = previewUrl
  return res.status(200).json(payload)
}

export async function verifyOtp(req, res) {
  try {
    const { email, code } = req.body || {}
    const otp = await Otp.findOne({ email, code: String(code), used: false, expiresAt: { $gt: new Date() } })
    if (!otp) return res.status(400).json({ message: 'Invalid or expired OTP' })
    return res.status(200).json({ verified: true })
  } catch (e) {
    return res.status(400).json({ message: 'Invalid data' })
  }
}
