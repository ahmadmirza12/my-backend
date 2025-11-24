import multer from 'multer'
import { randomBytes } from 'crypto'

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()
    cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`)
  }
})

export const upload = multer({ storage })