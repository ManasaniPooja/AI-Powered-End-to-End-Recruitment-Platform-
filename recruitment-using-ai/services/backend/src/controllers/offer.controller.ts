import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import { generateOfferLetter } from '../utils/ai'
import { AuthRequest } from '../middleware/auth'
import { sendEmail, offerLetterEmail } from './application.controller'

const parseCandidateId = (raw: string): { candidateName: string; candidateEmail: string } => {
  if (!raw) return { candidateName: 'Unknown', candidateEmail: '' }
  const sep = raw.includes('|') ? '|' : raw.includes('/') ? '/' : null
  if (sep) {
    const [n, e] = raw.split(sep)
    return { candidateName: n.trim() || e.trim(), candidateEmail: e.trim() }
  }
  const nameFromEmail = raw.includes('@')
    ? raw.split('@')[0].replace(/[._\-0-9]/g, ' ').trim().replace(/\s+/g, ' ')
        .split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim() || raw
    : raw
  return { candidateName: nameFromEmail, candidateEmail: raw }
}

// ── GET /api/offers — list all sent offers ────────────────────────────────
export const getOffers = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: 'OFFER_SENT', entityType: 'OfferLetter' },
      orderBy: { createdAt: 'desc' }
    })

    const offers = logs.map((log: any) => {
      const input = log.inputData as any
      const output = log.outputData as any
      return {
        id: log.id,
        applicationId: log.entityId,
        application: {
          candidateName: input.candidateName || 'Unknown',
          candidateEmail: input.candidateEmail || '',
          job: { title: input.jobTitle || 'Unknown Job' }
        },
        salary: input.salary || 'N/A',
        salaryOffered: input.salary || 'N/A',
        status: output.status || 'SENT',
        expiresAt: input.expiresAt || null,
        createdAt: log.createdAt,
      }
    })

    return res.status(200).json(offers)
  } catch (error) {
    console.error('getOffers error:', error)
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

// ── POST /api/offers — create offer, generate letter, send email ──────────
export const createOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId, salary, expiresAt, notes } = req.body

    if (!applicationId) return res.status(400).json({ message: 'applicationId is required' })
    if (!salary) return res.status(400).json({ message: 'salary is required' })

    // Fetch application + job
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true }
    })
    if (!application) return res.status(404).json({ message: 'Application not found' })

    const { candidateName, candidateEmail } = parseCandidateId(application.candidateId || '')
    const jobDesc = application.job?.description as any
    const jobTitle = jobDesc?.title || application.job?.title || 'the position'
    const companyName = process.env.COMPANY_NAME || 'Our Company'
    const startDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

    // Generate AI offer letter
    let offerLetter = ''
    try {
      offerLetter = await generateOfferLetter({ candidateName, jobTitle, salary, startDate, companyName }) as string
    } catch (e) {
      console.error('AI offer letter error:', e)
      offerLetter = `Dear ${candidateName},\n\nWe are pleased to offer you the position of ${jobTitle} at ${companyName}.\n\nSalary: ${salary}\nStart Date: ${startDate}\n\n${notes || ''}\n\nPlease confirm your acceptance within 5 business days.\n\nBest regards,\nHR Team`
    }

    // Update application status to OFFERED
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'OFFERED' }
    })

    // Store offer in AuditLog
    const log = await prisma.auditLog.create({
      data: {
        entityType: 'OfferLetter',
        entityId: applicationId,
        action: 'OFFER_SENT',
        inputData: { candidateName, candidateEmail, jobTitle, salary, expiresAt, notes, startDate },
        outputData: { offerLetter, status: 'SENT' },
        reasoning: 'Offer letter generated and sent to candidate',
        actorId: req.user?.id || null
      }
    })

    // Send offer email to candidate
    if (candidateEmail && candidateEmail.includes('@')) {
      await sendEmail(
        candidateEmail,
        `🎊 Offer Letter — ${jobTitle}`,
        offerLetterEmail(candidateName, jobTitle, offerLetter)
      )
      console.log(`Offer letter sent to ${candidateEmail}`)
    }

    // HR notification
    if (process.env.EMAIL_USER) {
      await sendEmail(
        process.env.EMAIL_USER,
        `Offer Sent — ${candidateName} for ${jobTitle}`,
        `<div style="font-family: sans-serif; padding: 24px; background: #0f0c29; color: white;">
          <h2>✅ Offer Letter Sent</h2>
          <p><strong>Candidate:</strong> ${candidateName}</p>
          <p><strong>Email:</strong> ${candidateEmail}</p>
          <p><strong>Position:</strong> ${jobTitle}</p>
          <p><strong>Salary:</strong> ${salary}</p>
          <p><strong>Start Date:</strong> ${startDate}</p>
          ${expiresAt ? `<p><strong>Expires:</strong> ${expiresAt}</p>` : ''}
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        </div>`
      )
    }

    return res.status(201).json({
      message: 'Offer sent successfully',
      id: log.id,
      application: {
        candidateName,
        candidateEmail,
        job: { title: jobTitle }
      },
      salary,
      status: 'SENT',
      expiresAt,
      createdAt: log.createdAt,
      offerLetter
    })
  } catch (error) {
    console.error('createOffer error:', error)
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

// ── POST /api/offers/generate — legacy AI-only endpoint ───────────────────
export const generateOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateName, candidateEmail, jobTitle, salary, startDate, companyName, applicationId } = req.body
    if (!candidateName || !jobTitle || !salary || !startDate || !companyName) {
      return res.status(400).json({ message: 'All fields are required' })
    }
    const offerLetter = await generateOfferLetter({ candidateName, jobTitle, salary, startDate, companyName })

    await prisma.auditLog.create({
      data: {
        entityType: 'OfferLetter',
        entityId: applicationId || 'manual',
        action: 'OFFER_GENERATED',
        inputData: { candidateName, jobTitle, salary, startDate },
        outputData: { offerLetter },
        reasoning: 'AI generated offer letter',
        actorId: req.user!.id
      }
    })

    if (candidateEmail) {
      await sendEmail(candidateEmail, `🎊 Offer Letter - ${jobTitle}`, offerLetterEmail(candidateName, jobTitle, offerLetter as string))
    }

    return res.status(200).json({ message: 'Offer letter generated', offerLetter })
  } catch (error) {
    console.error('Offer error:', error)
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}