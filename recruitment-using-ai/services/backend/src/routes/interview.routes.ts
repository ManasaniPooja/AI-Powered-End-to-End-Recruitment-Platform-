import { Router } from 'express'
import multer from 'multer'
import {
  createInterview,
  submitTranscript,
  evaluateInterview,
  getInterview,
  sendInvite,
  loadPortal,
  submitVideo,
  getResponses,
  resendInvite,
} from '../controllers/interview.controller'
import { authenticate, authorize } from '../middleware/auth'

const router  = Router()
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } })

// ── Specific routes FIRST (before /:id) ──────────────────────────────────────
router.post('/invite',                authenticate, authorize('HIRING_MANAGER', 'HR_ADMIN', 'ADMIN'), sendInvite)
router.get('/responses',              authenticate, getResponses)
router.post('/resend/:interviewId',   authenticate, authorize('HIRING_MANAGER', 'HR_ADMIN', 'ADMIN'), resendInvite)

// Candidate portal routes (no auth – public link)
router.get('/portal/:token',          loadPortal)
router.post('/portal/:token/submit',  upload.single('video'), submitVideo)

// ── Generic /:id routes LAST ──────────────────────────────────────────────────
router.post('/',                      authenticate, authorize('HIRING_MANAGER', 'HR_ADMIN', 'ADMIN'), createInterview)
router.patch('/:id/transcript',       authenticate, submitTranscript)
router.post('/:id/evaluate',          authenticate, authorize('HIRING_MANAGER', 'HR_ADMIN', 'ADMIN'), evaluateInterview)
router.get('/:id',                    authenticate, getInterview)

export default router