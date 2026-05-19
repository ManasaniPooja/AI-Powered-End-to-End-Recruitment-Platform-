import { startBiasReportScheduler } from './utils/scheduler'
import express from 'express'
import cors from 'cors'
import uploadRoutes from './routes/upload.routes'
import path from 'path'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import jobRoutes from './routes/job.routes'
import applicationRoutes from './routes/application.routes'
import interviewRoutes from './routes/interview.routes'
import offerRoutes from './routes/offer.routes'
import biasRoutes from './routes/bias.routes'
import feedbackRoutes from './routes/feedback.routes'
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: 'http://localhost:3000', credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }))
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
}))
app.use(morgan('dev'))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: 'Recruitment Using AI' })
})

app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api/applications', applicationRoutes)
app.use('/api/interviews', interviewRoutes)
app.use('/api/offers', offerRoutes)
app.use('/api/bias', biasRoutes)
app.use('/api/feedback', feedbackRoutes)
startBiasReportScheduler()
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`API running on http://localhost:${PORT}`)
})

