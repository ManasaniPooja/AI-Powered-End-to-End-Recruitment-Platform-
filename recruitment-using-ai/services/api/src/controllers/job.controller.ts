import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import { generateJobDescription } from '../utils/ai'
import { AuthRequest } from '../middleware/auth'

// PUBLIC - no auth needed
export const getPublicJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' }
    })
    return res.status(200).json(jobs)
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error })
  }
}

export const getJobByIdPublic = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const job = await prisma.job.findUnique({ where: { id } })
    if (!job) return res.status(404).json({ message: 'Job not found' })
    return res.status(200).json(job)
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error })
  }
}

export const generateJD = async (req: AuthRequest, res: Response) => {
  try {
    const { brief } = req.body
    if (!brief) return res.status(400).json({ message: 'Brief is required' })
    const description = await generateJobDescription(brief)
    return res.status(200).json({ message: 'Job description generated', description })
  } catch (error) {
    return res.status(500).json({ message: 'AI generation failed', error })
  }
}

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body
    const job = await prisma.job.create({
      data: { title, description, createdBy: req.user!.id, status: 'DRAFT' }
    })
    await prisma.auditLog.create({
      data: {
        entityType: 'Job',
        entityId: job.id,
        action: 'CREATE',
        inputData: { title },
        outputData: { jobId: job.id },
        reasoning: 'Job created by hiring manager',
        actorId: req.user!.id
      }
    })
    return res.status(201).json({ message: 'Job created successfully', job })
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error })
  }
}

export const publishJob = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const job = await prisma.job.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    })
    return res.status(200).json({ message: 'Job published successfully', job })
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error })
  }
}

export const getAllJobs = async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } }
    })
    return res.status(200).json(jobs)
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error })
  }
}

export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const job = await prisma.job.findUnique({
      where: { id },
      include: { applications: true, _count: { select: { applications: true } } }
    })
    if (!job) return res.status(404).json({ message: 'Job not found' })
    return res.status(200).json(job)
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error })
  }
}