import { Router } from 'express'
import { getBiasReport, getAllBiasReports, generateBiasReport } from '../controllers/bias.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.get(
  '/report/:jobId',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN'),
  getBiasReport
)

router.get(
  '/reports',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN'),
  getAllBiasReports
)

router.post(
  '/generate/:jobId',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN'),
  generateBiasReport
)
export default router