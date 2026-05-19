import { Response } from 'express'
import prisma from '../utils/prisma'
import { AuthRequest } from '../middleware/auth'

export const getBiasReport = async (req: AuthRequest, res: Response) => {
  try {
    const jobId = req.params.jobId as string

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        resumeScore: true,
        interview: { include: { videoScore: true } }
      }
    })

    const total = applications.length
    const screened = applications.filter(a => a.resumeScore !== null).length
    const interviewed = applications.filter(a => a.interview !== null).length
    const evaluated = applications.filter(a => a.interview?.videoScore !== null && a.interview?.videoScore !== undefined).length

    const stageData = [
      { stage: 'Applied', count: total, percentage: 100 },
      { stage: 'Resume Screened', count: screened, percentage: total > 0 ? Math.round((screened / total) * 100) : 0 },
      { stage: 'Interviewed', count: interviewed, percentage: total > 0 ? Math.round((interviewed / total) * 100) : 0 },
      { stage: 'Evaluated', count: evaluated, percentage: total > 0 ? Math.round((evaluated / total) * 100) : 0 },
    ]

    const scores = applications
      .filter(a => a.resumeScore !== null)
      .map(a => a.resumeScore!.overallScore)

    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

    const highScorers = scores.filter(s => s >= 75).length
    const midScorers = scores.filter(s => s >= 50 && s < 75).length
    const lowScorers = scores.filter(s => s < 50).length

    const anomalies: string[] = []
    if (screened < total * 0.3 && total > 0)
      anomalies.push('Low screening rate — less than 30% of applicants were screened. Check if screening criteria are too strict.')
    if (interviewed < screened * 0.4 && screened > 0)
      anomalies.push('Interview conversion is low — less than 40% of screened candidates were interviewed.')
    if (avgScore < 55 && screened > 0)
      anomalies.push('Average resume score is below 55 — job requirements may be misaligned with applicant pool.')
    if (lowScorers > highScorers && screened > 0)
      anomalies.push('More low-scoring candidates than high-scoring ones — consider revising the job description.')

    const report = {
      jobId,
      totalApplications: total,
      averageResumeScore: avgScore,
      pipeline: stageData,
      scoreDistribution: { high: highScorers, medium: midScorers, low: lowScorers },
      anomalies,
      generatedAt: new Date().toISOString()
    }

    await prisma.biasReport.create({
      data: {
        jobId: jobId,
        stage: 'full-pipeline',
        demographicData: { pipeline: stageData, scoreDistribution: report.scoreDistribution },
        anomalyFlags: { anomalies }
      }
    })

    return res.status(200).json(report)
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

export const getAllBiasReports = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await prisma.biasReport.findMany({
      orderBy: { generatedAt: 'desc' },
      take: 10
    })
    return res.status(200).json(reports)
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

export const generateBiasReport = async (req: any, res: Response) => {
  try {
    const { jobId } = req.params
    const applications = await prisma.application.findMany({
      where: { jobId },
      include: { resumeScore: true, interview: { include: { videoScore: true } } }
    })
    const total = applications.length
    const screened = applications.filter((a: any) => a.resumeScore !== null).length
    const interviewed = applications.filter((a: any) => a.interview !== null).length
    const evaluated = applications.filter((a: any) => a.interview?.videoScore != null).length
    const scores = applications.filter((a: any) => a.resumeScore !== null).map((a: any) => a.resumeScore.overallScore)
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0
    const high = scores.filter((s: number) => s >= 75).length
    const mid = scores.filter((s: number) => s >= 50 && s < 75).length
    const low = scores.filter((s: number) => s < 50).length
    const anomalies: string[] = []
    if (total === 0) anomalies.push('No applications found for this job.')
    if (screened < total * 0.3 && total > 0) anomalies.push('Low screening rate - less than 30% screened.')
    if (interviewed < screened * 0.4 && screened > 0) anomalies.push('Low interview conversion - less than 40% interviewed.')
    if (avgScore < 55 && screened > 0) anomalies.push('Average resume score below 55.')
    if (low > high && screened > 0) anomalies.push('More low-scoring candidates than high-scoring ones.')
    const report = await prisma.biasReport.create({
      data: {
        jobId,
        stage: 'manual',
        demographicData: {
          pipeline: [
            { stage: 'Applied', count: total, percentage: 100 },
            { stage: 'Resume Screened', count: screened, percentage: total > 0 ? Math.round((screened / total) * 100) : 0 },
            { stage: 'Interviewed', count: interviewed, percentage: total > 0 ? Math.round((interviewed / total) * 100) : 0 },
            { stage: 'Evaluated', count: evaluated, percentage: total > 0 ? Math.round((evaluated / total) * 100) : 0 },
          ],
          scoreDistribution: { high, medium: mid, low },
          averageScore: avgScore
        },
        anomalyFlags: { anomalies, generatedBy: 'manual' }
      }
    })
    return res.status(200).json(report)
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}