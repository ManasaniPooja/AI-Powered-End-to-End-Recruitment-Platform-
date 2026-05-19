import { Response } from 'express'
import prisma from '../utils/prisma'
import { generateOfferLetter } from '../utils/ai'
import { AuthRequest } from '../middleware/auth'
import { sendEmail, offerLetterEmail } from './application.controller'

export const generateOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateName, candidateEmail, jobTitle, salary, startDate, companyName, applicationId } = req.body

    if (!candidateName || !jobTitle || !salary || !startDate || !companyName) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const offerLetter = await generateOfferLetter({
      candidateName,
      jobTitle,
      salary,
      startDate,
      companyName
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'OfferLetter',
        entityId: applicationId || 'manual',
        action: 'OFFER_GENERATED',
        inputData: { candidateName, jobTitle, salary, startDate },
        outputData: { offerLetter },
        reasoning: 'AI generated offer letter for selected candidate',
        actorId: req.user!.id
      }
    })

    // ── Candidate కి offer letter email ──
    if (candidateEmail) {
      await sendEmail(
        candidateEmail,
        `🎊 Offer Letter - ${jobTitle}`,
        offerLetterEmail(candidateName, jobTitle, offerLetter)
      )
      console.log(`Offer letter emailed to ${candidateEmail}`)
    }

    // ── HR కి notification ──
    if (process.env.EMAIL_USER) {
      await sendEmail(
        process.env.EMAIL_USER,
        `Offer Letter Generated - ${candidateName} for ${jobTitle}`,
        `<div style="font-family: sans-serif; padding: 24px;">
          <h2>Offer Letter Generated ✅</h2>
          <p><strong>Candidate:</strong> ${candidateName}</p>
          <p><strong>Email:</strong> ${candidateEmail}</p>
          <p><strong>Position:</strong> ${jobTitle}</p>
          <p><strong>Salary:</strong> ${salary}</p>
          <p><strong>Start Date:</strong> ${startDate}</p>
        </div>`
      )
    }

    return res.status(200).json({
      message: 'Offer letter generated',
      offerLetter
    })
  } catch (error) {
    console.error('Offer error:', error)
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}