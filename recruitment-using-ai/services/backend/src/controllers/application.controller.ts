import { Request, Response } from 'express'
import fs from 'fs'
import nodemailer from 'nodemailer'
import prisma from '../utils/prisma'
import { scoreResume } from '../utils/ai'

// ── Email transporter ──────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"Recruitment Using AI" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })
    console.log(`Email sent to ${to}`)
  } catch (err) {
    console.error('Email error:', err)
  }
}

// ── Parse candidateId into name + email ───────────────────────────────────
const parseCandidateId = (raw: string): { candidateName: string; candidateEmail: string } => {
  if (!raw) return { candidateName: 'Unknown', candidateEmail: '' }

  const separator = raw.includes('|') ? '|' : raw.includes('/') ? '/' : null

  if (separator) {
    const parts = raw.split(separator)
    const name = parts[0].trim()
    const email = parts[1].trim()
    return {
      candidateName: name || email,
      candidateEmail: email,
    }
  }

  const nameFromEmail = raw.includes('@')
    ? raw.split('@')[0]
        .replace(/[._\-0-9]/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .trim() || raw
    : raw

  return {
    candidateName: nameFromEmail,
    candidateEmail: raw,
  }
}

// ── Email Templates ────────────────────────────────────────────────────────
const resumeConfirmationEmail = (jobTitle: string) => `
<div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0c29; color: white; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 32px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">Application Received! ✅</h1>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 16px; color: #ccc;">Your application for <strong style="color: white;">${jobTitle}</strong> has been successfully submitted.</p>
    <p style="color: #aaa;">Our AI system is reviewing your resume. You will hear back from us soon.</p>
    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-top: 24px;">
      <p style="margin: 0; color: #a78bfa; font-weight: 600;">What happens next?</p>
      <ul style="color: #ccc; margin-top: 12px; line-height: 2;">
        <li>AI Resume Screening</li>
        <li>Shortlisting Decision</li>
        <li>Video Interview Invite (if shortlisted)</li>
        <li>Final Decision</li>
      </ul>
    </div>
  </div>
  <div style="padding: 20px; text-align: center; color: #555; font-size: 12px;">Recruitment Using AI • Powered by Claude</div>
</div>`

const resumeScoredEmail = (jobTitle: string, score: number, candidateEmail: string) => `
<div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0c29; color: white; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #10b981, #064e3b); padding: 32px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">New Resume Scored 📋</h1>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 16px; color: #ccc;">A new candidate has applied for <strong style="color: white;">${jobTitle}</strong></p>
    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-top: 16px;">
      <p style="margin: 0 0 8px; color: #aaa; font-size: 13px;">CANDIDATE</p>
      <p style="margin: 0; color: white; font-size: 16px; font-weight: 600;">${candidateEmail}</p>
    </div>
    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-top: 12px; text-align: center;">
      <p style="margin: 0 0 8px; color: #aaa; font-size: 13px;">AI RESUME SCORE</p>
      <p style="margin: 0; font-size: 48px; font-weight: 900; color: ${score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'};">${score}</p>
      <p style="margin: 4px 0 0; color: #aaa; font-size: 13px;">${score >= 70 ? '✅ Recommended' : score >= 50 ? '⚠️ Review Required' : '❌ Below Threshold'}</p>
    </div>
    <a href="${process.env.FRONTEND_URL}/dashboard/candidates" style="display: block; margin-top: 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; padding: 14px; border-radius: 10px; text-align: center; font-weight: 600;">View Candidate →</a>
  </div>
</div>`

const shortlistEmail = (jobTitle: string, candidateEmail: string) => `
<div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0c29; color: white; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #a78bfa, #7c3aed); padding: 32px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">🎉 Congratulations! You've been Shortlisted!</h1>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 16px; color: #ccc;">Dear Candidate,</p>
    <p style="color: #ccc;">We are pleased to inform you that you have been <strong style="color: #a78bfa;">shortlisted</strong> for the position of <strong style="color: white;">${jobTitle}</strong>.</p>
    <div style="background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.3); border-radius: 12px; padding: 20px; margin-top: 20px;">
      <p style="margin: 0; color: #a78bfa; font-weight: 600;">Next Step: Video Interview</p>
      <p style="margin: 8px 0 0; color: #ccc; font-size: 14px;">You will receive a video interview invitation shortly. Please keep an eye on your inbox.</p>
    </div>
  </div>
  <div style="padding: 20px; text-align: center; color: #555; font-size: 12px;">Recruitment Using AI • Powered by Claude</div>
</div>`

const offerLetterEmail = (candidateName: string, jobTitle: string, offerContent: string) => `
<div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0c29; color: white; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #f59e0b, #b45309); padding: 32px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">🎊 Offer Letter - ${jobTitle}</h1>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 16px; color: #ccc;">Dear <strong style="color: white;">${candidateName}</strong>,</p>
    <p style="color: #ccc;">We are delighted to extend an offer of employment for the position of <strong style="color: white;">${jobTitle}</strong>.</p>
    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-top: 20px; white-space: pre-wrap; color: #ccc; font-size: 14px; line-height: 1.8;">
      ${offerContent}
    </div>
    <p style="margin-top: 24px; color: #aaa; font-size: 13px;">Please review the offer and respond within 5 business days.</p>
  </div>
  <div style="padding: 20px; text-align: center; color: #555; font-size: 12px;">Recruitment Using AI • Powered by Claude</div>
</div>`

// ── Interview Invite Email Template ───────────────────────────────────────
const interviewInviteEmail = (candidateName: string, jobTitle: string) => `
<div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0c29; color: white; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 32px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">🎥 Interview Invitation</h1>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 16px; color: #ccc;">Dear <strong style="color: white;">${candidateName}</strong>,</p>
    <p style="color: #ccc;">Congratulations! You have been selected for a video interview for the position of <strong style="color: white;">${jobTitle}</strong>.</p>
    <div style="background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.3); border-radius: 12px; padding: 20px; margin-top: 20px;">
      <p style="margin: 0; color: #a78bfa; font-weight: 600;">Next Steps</p>
      <p style="margin: 8px 0 0; color: #ccc; font-size: 14px;">Please visit the link below to schedule and complete your video interview. Our team will review your submission promptly.</p>
    </div>
    <a href="${process.env.FRONTEND_URL}/interview" style="display: block; margin-top: 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; padding: 14px; border-radius: 10px; text-align: center; font-weight: 600;">Go to Interview →</a>
    <p style="margin-top: 16px; color: rgba(255,255,255,0.3); font-size: 12px; text-align: center;">This invitation was sent by your recruiter. Please complete your interview within 3 days.</p>
  </div>
  <div style="padding: 20px; text-align: center; color: #555; font-size: 12px;">Recruitment Using AI • Powered by Claude</div>
</div>`

// ── PDF Text Extractor ─────────────────────────────────────────────────────
const extractTextFromPDF = async (filePath: string): Promise<string> => {
  const dataBuffer = fs.readFileSync(filePath)
  const raw = dataBuffer.toString('latin1')
  const matches = raw.match(/BT[\s\S]*?ET/g) || []
  let text = matches.join(' ')
  if (text.length < 50) {
    text = raw.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return text || 'Resume uploaded successfully'
}

// ── Submit Application ─────────────────────────────────────────────────────
export const submitApplication = async (req: Request, res: Response) => {
  try {
    const { jobId, candidateName, email, phone, coverLetter } = req.body
    const file = req.file

    if (!file) return res.status(400).json({ message: 'Resume PDF required' })
    if (!jobId) return res.status(400).json({ message: 'Job ID required' })
    if (!email) return res.status(400).json({ message: 'Email required' })

    const job = await prisma.job.findUnique({ where: { id: jobId as string } })
    if (!job) return res.status(404).json({ message: 'Job not found' })

    const candidateIdValue = candidateName ? `${candidateName}|${email}` : email

    const application = await prisma.application.create({
      data: {
        jobId: jobId as string,
        candidateId: candidateIdValue,
        resumeUrl: file.path,
        status: 'APPLIED'
      }
    })

    const resumeText = await extractTextFromPDF(file.path)
    const scores = await scoreResume(resumeText, job.description as object) as any

    const resumeScore = await prisma.resumeScore.create({
      data: {
        applicationId: application.id,
        overallScore: scores.overallScore,
        skillsScore: scores.skillsScore,
        experienceScore: scores.experienceScore,
        educationScore: scores.educationScore,
        explanation: scores.explanation
      }
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'Application',
        entityId: application.id,
        action: 'RESUME_SCORED',
        inputData: { jobId, candidateName, email, phone },
        outputData: scores,
        reasoning: 'AI scored resume against job description',
        actorId: null
      }
    })

    const autoStatus = scores.overallScore >= 60 ? 'SHORTLISTED' : 'REJECTED'

    await prisma.application.update({
      where: { id: application.id },
      data: { status: autoStatus }
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'Application',
        entityId: application.id,
        action: 'AUTO_SCREENED',
        inputData: { score: scores.overallScore, threshold: 60 },
        outputData: { status: autoStatus },
        reasoning: `Auto-screened: score ${scores.overallScore} is ${autoStatus === 'SHORTLISTED' ? 'above' : 'below'} threshold of 60`,
        actorId: null
      }
    })

    const jobDesc = job.description as any
    const jobTitle = jobDesc?.title || job.title || 'the position'

    await sendEmail(email, `Application Received - ${jobTitle}`, resumeConfirmationEmail(jobTitle))

    if (autoStatus === 'SHORTLISTED') {
      await sendEmail(email, `🎉 You've been shortlisted for ${jobTitle}`, shortlistEmail(jobTitle, email))
    }

    if (process.env.EMAIL_USER) {
      await sendEmail(
        process.env.EMAIL_USER,
        `New Application: ${jobTitle} — Score: ${scores.overallScore} — ${autoStatus}`,
        resumeScoredEmail(jobTitle, scores.overallScore, email)
      )
    }

    return res.status(201).json({
      message: 'Application submitted and scored',
      application: { ...application, status: autoStatus },
      scores: resumeScore,
      autoScreened: true,
      result: autoStatus
    })
  } catch (error) {
    console.error('Application error:', error)
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

// ── Get All Applications (dashboard analytics) ─────────────────────────────
export const getAllApplications = async (req: Request, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      orderBy: { appliedAt: 'desc' },
      include: {
        job: { select: { id: true, title: true } },
        resumeScore: { select: { overallScore: true } },
      },
    })

    const result = applications.map(app => {
      const { candidateName, candidateEmail } = parseCandidateId(app.candidateId || '')
      return {
        id: app.id,
        jobId: app.jobId,
        jobTitle: (app as any).job?.title || '',
        candidateId: app.candidateId,
        candidateName,
        candidateEmail,
        status: app.status,
        aiScore: (app as any).resumeScore?.overallScore ?? null,
        createdAt: app.appliedAt,
      }
    })

    return res.status(200).json(result)
  } catch (error) {
    console.error('getAllApplications error:', error)
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

// ── Get Applications By Job ────────────────────────────────────────────────
export const getApplicationsByJob = async (req: Request, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      where: { jobId: req.params.jobId as string },
      include: { resumeScore: true, interview: { include: { videoScore: true } } },
      orderBy: { resumeScore: { overallScore: 'desc' } }
    })

    const enriched = applications.map((app) => {
      const { candidateName, candidateEmail } = parseCandidateId(app.candidateId || '')
      return { ...app, candidateName, candidateEmail }
    })

    return res.status(200).json(enriched)
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error })
  }
}

// ── Update Application Status ──────────────────────────────────────────────
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { status } = req.body

    if (!id) return res.status(400).json({ message: 'Application ID required' })
    if (!status) return res.status(400).json({ message: 'Status required' })

    const application = await prisma.application.update({
      where: { id },
      data: { status },
      include: { resumeScore: true }
    })

    if (status === 'SHORTLISTED') {
      const job = await prisma.job.findUnique({ where: { id: application.jobId } })
      const jobDesc = job?.description as any
      const jobTitle = jobDesc?.title || job?.title || 'the position'
      const { candidateEmail } = parseCandidateId(application.candidateId || '')
      if (candidateEmail && candidateEmail.includes('@')) {
        await sendEmail(candidateEmail, `You've been shortlisted for ${jobTitle}`, shortlistEmail(jobTitle, candidateEmail))
      }
    }

    return res.status(200).json({ message: 'Status updated', application })
  } catch (error) {
    console.error('updateApplicationStatus error:', error)
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

// ── ✅ NEW: Send Interview Invite ──────────────────────────────────────────
export const inviteCandidate = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    })

    if (!application) {
      return res.status(404).json({ message: 'Application not found' })
    }

    const { candidateEmail, candidateName } = parseCandidateId(application.candidateId || '')

    if (!candidateEmail || !candidateEmail.includes('@')) {
      return res.status(400).json({ message: 'No valid email found for this candidate' })
    }

    const jobDesc = (application as any).job?.description as any
    const jobTitle = jobDesc?.title || (application as any).job?.title || 'the position'

    // Send invite email
    await sendEmail(
      candidateEmail,
      `🎥 Interview Invitation - ${jobTitle}`,
      interviewInviteEmail(candidateName, jobTitle)
    )

    // Update status to INTERVIEW_SCHEDULED
    await prisma.application.update({
      where: { id },
      data: { status: 'INTERVIEWED' }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'Application',
        entityId: id,
        action: 'INTERVIEW_INVITED',
        inputData: { candidateEmail, jobTitle },
        outputData: { status: 'invite_sent' },
        reasoning: 'HR manually sent interview invitation to candidate',
        actorId: null
      }
    })

    return res.status(200).json({ message: `Invite sent successfully to ${candidateEmail}` })
  } catch (error) {
    console.error('inviteCandidate error:', error)
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

// ── Delete Candidate Data ──────────────────────────────────────────────────
export const deleteCandidateData = async (req: Request, res: Response) => {
  try {
    const email = req.params.email as string

    const applications = await prisma.application.findMany({
      where: {
        OR: [
          { candidateId: email },
          { candidateId: { contains: `|${email}` } },
          { candidateId: { contains: `/${email}` } }
        ]
      },
      include: { resumeScore: true, interview: { include: { videoScore: true } } }
    })

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No data found for this candidate' })
    }

    for (const app of applications) {
      const interview = (app as any).interview
      const resumeScore = (app as any).resumeScore
      if (interview?.videoScore) {
        await prisma.videoScore.delete({ where: { videoInterviewId: interview.id } })
      }
      if (interview) {
        await prisma.videoInterview.delete({ where: { id: interview.id } })
      }
      if (resumeScore) {
        await prisma.resumeScore.delete({ where: { applicationId: app.id } })
      }
      await prisma.application.delete({ where: { id: app.id } })
    }

    await prisma.auditLog.create({
      data: {
        entityType: 'Candidate',
        entityId: email,
        action: 'RIGHT_TO_ERASURE',
        inputData: { email, applicationsDeleted: applications.length },
        outputData: { status: 'deleted' },
        reasoning: 'Candidate requested data deletion under right to erasure',
        actorId: null
      }
    })

    return res.status(200).json({
      message: 'Candidate data deleted successfully',
      applicationsDeleted: applications.length
    })
  } catch (error) {
    console.error('Delete error:', error)
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

// ── Export email helpers for other controllers ─────────────────────────────
export { sendEmail, shortlistEmail, offerLetterEmail }