import { Request, Response } from 'express'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { v2 as cloudinaryV2, UploadApiResponse } from 'cloudinary'
import { Readable } from 'stream'
import prisma from '../utils/prisma'
import { generateInterviewQuestions, evaluateVideoResponse } from '../utils/ai'
import { AuthRequest } from '../middleware/auth'

cloudinaryV2.config({
  cloud_name: 'dhodhbb5j',
  api_key: '341862291142552',
  api_secret: 'TFcVuSadeI8vVgjfy8L5JV10gKM',
})

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export const createInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.body
    const application = await prisma.application.findUnique({
      where: { id: applicationId as string },
      include: { job: true }
    })
    if (!application) return res.status(404).json({ message: 'Application not found' })
    const questions = await generateInterviewQuestions(application.job.description as object)
    const interview = await prisma.videoInterview.create({
      data: { applicationId: applicationId as string, questions, status: 'PENDING' }
    })
    await prisma.auditLog.create({
      data: {
        entityType: 'VideoInterview',
        entityId: interview.id,
        action: 'INTERVIEW_CREATED',
        inputData: { applicationId },
        outputData: { questions },
        reasoning: 'AI generated interview questions based on JD',
        actorId: req.user!.id
      }
    })
    return res.status(201).json({ message: 'Interview created', interview })
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

export const submitTranscript = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { transcript } = req.body
    const interview = await prisma.videoInterview.update({
      where: { id },
      data: { transcript, status: 'COMPLETED' }
    })
    return res.status(200).json({ message: 'Transcript submitted', interview })
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

export const evaluateInterview = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const interview = await prisma.videoInterview.findUnique({ where: { id } })

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' })
    }

    // â”€â”€ Transcript à°²à±‡à°•à°ªà±‹à°¤à±‡ default text à°µà°¾à°¡à± â”€â”€
    const transcriptText = interview.transcript ||
      `The candidate has submitted a video interview response. 
       Evaluate them on professional communication, confidence, 
       clarity of expression, and overall presentation skills. 
       Assume they answered the questions to the best of their ability.`

    const questions = (interview.questions as string[]) || ['Tell me about yourself']
    const perQuestionScores: object[] = []

    for (const question of questions) {
      const score = await evaluateVideoResponse(transcriptText, question)
      perQuestionScores.push({ question, ...score as object })
    }

    const scores = perQuestionScores as any[]
    const avgRelevance     = Math.round(scores.reduce((a, b) => a + b.relevanceScore,     0) / scores.length)
    const avgCommunication = Math.round(scores.reduce((a, b) => a + b.communicationScore, 0) / scores.length)
    const avgBehavioral    = Math.round(scores.reduce((a, b) => a + b.behavioralScore,    0) / scores.length)

    await prisma.videoScore.deleteMany({ where: { videoInterviewId: id } })

    const videoScore = await prisma.videoScore.create({
      data: {
        videoInterviewId:   id,
        relevanceScore:     avgRelevance,
        communicationScore: avgCommunication,
        behavioralScore:    avgBehavioral,
        perQuestionScores
      }
    })

    await prisma.videoInterview.update({
      where: { id },
      data: { status: 'EVALUATED' }
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'VideoInterview',
        entityId: id,
        action: 'INTERVIEW_EVALUATED',
        inputData: { transcript: transcriptText },
        outputData: videoScore as object,
        reasoning: 'AI evaluated video interview responses',
        actorId: req.user!.id
      }
    })

    return res.status(200).json({ message: 'Interview evaluated', videoScore })
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

export const getInterview = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const interview = await prisma.videoInterview.findUnique({
      where: { id },
      include: { videoScore: true }
    })
    if (!interview) return res.status(404).json({ message: 'Interview not found' })
    return res.status(200).json(interview)
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

export const sendInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId, deadlineDays = 3 } = req.body
    const application = await prisma.application.findUnique({
      where: { id: applicationId as string },
      include: { job: true, interview: true }
    })
    if (!application) return res.status(404).json({ message: 'Application not found' })
    if (application.interview?.inviteToken) {
      return res.status(400).json({
        message: 'Candidate already invited',
        interviewId: application.interview.id,
        inviteToken: application.interview.inviteToken,
      })
    }
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + Number(deadlineDays) * 24 * 60 * 60 * 1000)
    let interview
    if (application.interview) {
      interview = await prisma.videoInterview.update({
        where: { id: application.interview.id },
        data: {
          inviteToken,
          candidateName: application.candidateId,
          candidateEmail: req.body.candidateEmail as string,
          invitedAt: new Date(),
          expiresAt,
          status: 'PENDING',
        }
      })
    } else {
      const questions = await generateInterviewQuestions(application.job.description as object)
      interview = await prisma.videoInterview.create({
        data: {
          applicationId: applicationId as string,
          questions,
          status: 'PENDING',
          inviteToken,
          candidateName: (req.body.candidateName as string) || 'Candidate',
          candidateEmail: (req.body.candidateEmail as string) || '',
          invitedAt: new Date(),
          expiresAt,
        }
      })
    }
    const interviewLink = `${process.env.FRONTEND_URL}/interview/${inviteToken}`
    await transporter.sendMail({
      from: `"BHR1 Recruitment" <${process.env.EMAIL_USER}>`,
      to: req.body.candidateEmail as string,
      subject: `Video Interview Invitation â€“ ${application.job.title}`,
      html: `
        <p>Dear ${(req.body.candidateName as string) || 'Candidate'},</p>
        <p>Congratulations! You have been shortlisted for <strong>${application.job.title}</strong>.</p>
        <p>Please complete your video interview before <strong>${expiresAt.toDateString()}</strong>.</p>
        <br/>
        <a href="${interviewLink}" style="background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
          Start Interview
        </a>
        <br/><br/>
        <p>Best regards,<br/>BHR1 Recruitment Team</p>
      `,
    })
    await prisma.auditLog.create({
      data: {
        entityType: 'VideoInterview',
        entityId: interview.id,
        action: 'INVITE_SENT',
        inputData: { applicationId, candidateEmail: req.body.candidateEmail },
        outputData: { inviteToken, expiresAt },
        reasoning: 'HR sent async video interview invite to candidate',
        actorId: req.user!.id
      }
    })
    return res.status(201).json({
      message: 'Invite sent successfully',
      interviewId: interview.id,
      interviewLink,
      expiresAt,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send invite', error: String(error) })
  }
}

export const loadPortal = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string
    const interview = await prisma.videoInterview.findUnique({
      where: { inviteToken: token },
      include: { application: { include: { job: true } } }
    })
    if (!interview) return res.status(404).json({ message: 'Interview not found' })
    if (interview.expiresAt && interview.expiresAt < new Date()) {
      return res.status(410).json({ message: 'Interview link has expired' })
    }
    if (interview.status === 'EVALUATED') {
      return res.status(400).json({ message: 'Interview already completed and evaluated' })
    }
    if (interview.status === 'PENDING') {
      await prisma.videoInterview.update({
        where: { id: interview.id },
        data: { status: 'IN_PROGRESS' }
      })
    }
    return res.status(200).json({
      interviewId: interview.id,
      candidateName: interview.candidateName,
      jobTitle: interview.application.job.title,
      questions: interview.questions,
      status: interview.status,
      expiresAt: interview.expiresAt,
      recordingUrl: interview.recordingUrl,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load interview', error: String(error) })
  }
}

export const submitVideo = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string
    const interview = await prisma.videoInterview.findUnique({
      where: { inviteToken: token }
    })
    if (!interview) return res.status(404).json({ message: 'Interview not found' })
    if (interview.expiresAt && interview.expiresAt < new Date()) {
      return res.status(410).json({ message: 'Interview link has expired' })
    }
    const file = (req as any).file
    if (!file) return res.status(400).json({ message: 'No video file provided' })

    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinaryV2.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: `bhr1/interviews/${interview.id}`,
          public_id: 'recording',
          overwrite: true,
        },
        (err, result) => {
          if (err || !result) return reject(err)
          resolve(result)
        }
      )
      const readable = Readable.from(file.buffer)
      readable.pipe(stream)
    })

    const updated = await prisma.videoInterview.update({
      where: { id: interview.id },
      data: {
        recordingUrl: uploadResult.secure_url,
        status: 'COMPLETED',
        completedAt: new Date(),
      }
    })

    return res.status(200).json({
      message: 'Video submitted successfully',
      recordingUrl: uploadResult.secure_url,
      status: updated.status,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit video', error: String(error) })
  }
}

export const getResponses = async (req: AuthRequest, res: Response) => {
  try {
    const { status, jobId, page = '1', limit = '20' } = req.query
    const where: any = { inviteToken: { not: null } }
    if (status) where.status = status as string
    if (jobId) where.application = { jobId: jobId as string }
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const [interviews, total] = await Promise.all([
      prisma.videoInterview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          application: { include: { job: true } },
          videoScore: true,
        }
      }),
      prisma.videoInterview.count({ where })
    ])
    return res.status(200).json({
      interviews: interviews.map((iv) => ({
        id: iv.id,
        candidateName: iv.candidateName,
        candidateEmail: iv.candidateEmail,
        jobTitle: iv.application.job.title,
        status: iv.status,
        recordingUrl: iv.recordingUrl,
        transcript: iv.transcript,
        invitedAt: iv.invitedAt,
        completedAt: iv.completedAt,
        expiresAt: iv.expiresAt,
        videoScore: iv.videoScore,
      })),
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch responses', error: String(error) })
  }
}

export const resendInvite = async (req: AuthRequest, res: Response) => {
  try {
    const interviewId = req.params.interviewId as string
    const interview = await prisma.videoInterview.findUnique({
      where: { id: interviewId },
      include: { application: { include: { job: true } } }
    })
    if (!interview) return res.status(404).json({ message: 'Interview not found' })
    if (!interview.inviteToken) return res.status(400).json({ message: 'No invite token found' })
    if (interview.status === 'COMPLETED') return res.status(400).json({ message: 'Interview already completed' })
    const interviewLink = `${process.env.FRONTEND_URL}/interview/${interview.inviteToken}`
    await transporter.sendMail({
      from: `"BHR1 Recruitment" <${process.env.EMAIL_USER}>`,
      to: interview.candidateEmail || '',
      subject: `Reminder: Video Interview â€“ ${interview.application.job.title}`,
      html: `
        <p>Dear ${interview.candidateName || 'Candidate'},</p>
        <p>This is a reminder to complete your video interview for <strong>${interview.application.job.title}</strong>.</p>
        <p>Deadline: <strong>${interview.expiresAt?.toDateString()}</strong></p>
        <br/>
        <a href="${interviewLink}" style="background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
          Continue Interview
        </a>
      `,
    })
    return res.status(200).json({ message: 'Reminder sent successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to resend invite', error: String(error) })
  }
}


