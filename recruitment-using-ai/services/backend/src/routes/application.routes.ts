import { Router } from 'express'
import {
  submitApplication,
  getApplicationsByJob,
  deleteCandidateData,
  getAllApplications,
  updateApplicationStatus,
  inviteCandidate,          // ✅ NEW
} from '../controllers/application.controller'
import { authenticate, authorize } from '../middleware/auth'
import { uploadResume } from '../middleware/upload'

const router = Router()

router.post(
  '/apply',
  uploadResume.single('resume'),
  submitApplication
)

router.get(
  '/all',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN', 'ADMIN'),
  getAllApplications
)

router.get(
  '/job/:jobId',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN', 'ADMIN'),
  getApplicationsByJob
)

router.patch(
  '/:id/status',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN', 'ADMIN'),
  updateApplicationStatus
)

// ✅ NEW: Send interview invite email to candidate
router.post(
  '/:id/invite',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN', 'ADMIN'),
  inviteCandidate
)

router.delete(
  '/candidate/:email',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN', 'ADMIN'),
  deleteCandidateData
)

export default router