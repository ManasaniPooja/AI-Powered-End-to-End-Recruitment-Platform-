import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/resumes'
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `resume-${unique}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Only PDF files allowed'))
  }
})

router.post('/resume', upload.single('resume'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
  const url = `http://localhost:5000/uploads/resumes/${req.file.filename}`
  return res.json({ url })
})

export default router