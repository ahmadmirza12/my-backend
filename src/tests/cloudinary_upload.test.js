import assert from 'assert'
import { setTimeout as delay } from 'timers/promises'

async function loginAdmin(base) {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  assert(email && password, 'ADMIN_EMAIL and ADMIN_PASSWORD must be set')
  const res = await fetch(`${base}/api/v1/auth/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  assert(res.ok, `admin login failed: ${res.status}`)
  const data = await res.json()
  assert(data.token, 'token missing')
  return data.token
}

async function fetchBuffer(url) {
  const r = await fetch(url)
  assert(r.ok, `fetch failed: ${url} ${r.status}`)
  const ab = await r.arrayBuffer()
  return Buffer.from(ab)
}

async function uploadOne(base, token, buf, filename, type) {
  const fd = new FormData()
  fd.append('images', new Blob([buf], { type }), filename)
  const t0 = Date.now()
  const res = await fetch(`${base}/api/v1/admin/products/images`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
  const dur = Date.now() - t0
  assert(res.ok, `upload failed: ${res.status}`)
  const data = await res.json()
  assert(Array.isArray(data.urls) && data.urls.length > 0, 'urls missing')
  assert(Array.isArray(data.files) && data.files.length > 0, 'files metadata missing')
  const meta = data.files[0]
  assert(typeof meta.public_id === 'string' && meta.public_id.startsWith('products/'), 'public_id missing or folder not set')
  assert(typeof meta.secure_url === 'undefined', 'secure_url field not expected')
  assert(typeof meta.url === 'string' && meta.url.startsWith('https://res.cloudinary.com/'), 'cloudinary url invalid')
  assert(typeof meta.width === 'number' && typeof meta.height === 'number', 'dimensions missing')
  assert(typeof meta.format === 'string', 'format missing')
  assert(dur < 15000, 'upload too slow')
  return { meta, dur }
}

async function run() {
  const base = process.env.PUBLIC_URL || 'http://localhost:8000'
  const hasUrl = Boolean(process.env.CLOUDINARY_URL)
  const hasCreds = Boolean(process.env.CLOUDINARY_CLOUD_NAME) && Boolean(process.env.CLOUDINARY_API_KEY) && Boolean(process.env.CLOUDINARY_API_SECRET)
  assert(hasUrl || hasCreds, 'Cloudinary must be configured with CLOUDINARY_URL or credentials')
  const token = await loginAdmin(base)

  const jpg = await fetchBuffer('https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg')
  const png = await fetchBuffer('https://res.cloudinary.com/demo/image/upload/sample.png')
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==','base64')

  const r1 = await uploadOne(base, token, jpg, 'test.jpg', 'image/jpeg')
  const r2 = await uploadOne(base, token, png, 'test.png', 'image/png')
  const r3 = await uploadOne(base, token, gif, 'test.gif', 'image/gif')

  try {
    const bad = await uploadOne(base, token, Buffer.from('hello'), 'bad.txt', 'text/plain')
    assert(false, 'invalid type should have failed')
  } catch (_) {}

  console.log('OK', { jpg_ms: r1.dur, png_ms: r2.dur, gif_ms: r3.dur })
}

run().catch(e => { console.error(e); process.exit(1) })
