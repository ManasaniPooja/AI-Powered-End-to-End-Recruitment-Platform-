import { Response } from 'express'
import prisma from '../utils/prisma'
import { AuthRequest } from '../middleware/auth'

export const submitFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, entityId, rating, comment, overrideDecision } = req.body
    if (!entityType || !entityId || !rating) {
      return res.status(400).json({ message: 'entityType, entityId, rating are required' })
    }

    const log = await prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        action: 'MANAGER_FEEDBACK',
        inputData: { rating, comment, overrideDecision },
        outputData: { status: 'feedback_recorded' },
        reasoning: `Hiring manager rated ${rating}/5. Override: ${overrideDecision || 'none'}. Comment: ${comment || 'none'}`,
        actorId: req.user!.id
      }
    })

    if (entityType === 'Application' && overrideDecision) {
      await prisma.application.update({
        where: { id: entityId },
        data: { status: overrideDecision as any }
      })
    }

    return res.status(201).json({
      message: 'Feedback submitted successfully',
      auditLogId: log.id
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

export const getFeedbackHistory = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: 'MANAGER_FEEDBACK' },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    return res.status(200).json(logs)
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}