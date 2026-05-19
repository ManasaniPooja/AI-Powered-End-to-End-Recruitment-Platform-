import { Router } from 'express'
import { submitApplication, getApplicationsByJob, deleteCandidateData } from '../controllers/application.controller'
import { authenticate, authorize } from '../middleware/auth'
import { uploadResume } from '../middleware/upload'

const router = Router()

// Public route — candidates login అక్కర్లేదు
router.post(
  '/apply',
  uploadResume.single('resume'),
  submitApplication
)

// Protected route — managers మాత్రమే చూడవచ్చు
router.get(
  '/job/:jobId',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN'),
  getApplicationsByJob
)

router.delete('/candidate/:email', authenticate, authorize('HIRING_MANAGER', 'HR_ADMIN'), deleteCandidateData)
export default router