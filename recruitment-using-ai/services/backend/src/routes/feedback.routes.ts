import { Router } from 'express'
import { submitFeedback, getFeedbackHistory } from '../controllers/feedback.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.post(
  '/',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN','ADMIN'),
  submitFeedback
)

router.get(
  '/history',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN','ADMIN'),
  getFeedbackHistory
)

export default router