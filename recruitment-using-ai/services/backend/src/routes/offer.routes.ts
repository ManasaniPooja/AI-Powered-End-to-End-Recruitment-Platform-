import { Router } from 'express'
import { getOffers, createOffer, generateOffer } from '../controllers/offer.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// GET /api/offers — list all offers
router.get(
  '/',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN', 'ADMIN'),
  getOffers
)

// POST /api/offers — create offer, generate AI letter, send email
router.post(
  '/',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN', 'ADMIN'),
  createOffer
)

// POST /api/offers/generate — legacy endpoint
router.post(
  '/generate',
  authenticate,
  authorize('HIRING_MANAGER', 'HR_ADMIN'),
  generateOffer
)

export default router