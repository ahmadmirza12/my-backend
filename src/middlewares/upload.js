import multer from 'multer'

const storage = multer.memoryStorage()
export const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024, files: 5 } })
