import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDir = 'uploads/resumes'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})

const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export const uploadResume = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, DOC, or DOCX files are allowed'))
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})