import { Router } from 'express'
import {
  generateJD,
  createJob,
  publishJob,
  getAllJobs,
  getJobById,
  getPublicJobs,
  getJobByIdPublic
} from '../controllers/job.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// Public routes (no auth)
router.get('/public', getPublicJobs)
router.get('/public/:id', getJobByIdPublic)

// Protected routes
router.post('/generate-jd', authenticate, generateJD)
router.post('/', authenticate, createJob)
router.get('/', authenticate, getAllJobs)
router.get('/:id', authenticate, getJobById)
router.patch('/:id/publish', authenticate, publishJob)

export default router