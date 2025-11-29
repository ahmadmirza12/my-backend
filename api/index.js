import { app } from '../src/app.js'
import { connectDB } from '../src/db/db.js'
import { ensureDefaultAdmin } from '../src/bootstrap/seed.js'

let initialized = false
async function init() {
  if (initialized) return
  const ok = await connectDB()
  if (ok) {
    try {
      await ensureDefaultAdmin()
    } catch (_) {}
  }
  initialized = true
}

export default async function handler(req, res) {
  await init()
  return app(req, res)
}

