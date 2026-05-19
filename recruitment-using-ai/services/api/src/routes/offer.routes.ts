import { Router } from 'express'
import { generateOffer } from '../controllers/offer.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.post(
  '/generate',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN'),
  generateOffer
)

export default router