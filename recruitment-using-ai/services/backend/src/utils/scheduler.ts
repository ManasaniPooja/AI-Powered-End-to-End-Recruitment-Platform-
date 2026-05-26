import cron from 'node-cron'
import prisma from './prisma'
export const startBiasReportScheduler = () => {
  cron.schedule('0 9 * * 1', async () => {
    console.log('[Scheduler] Generating weekly bias reports...')
    try {
      const jobs = await prisma.job.findMany({ where: { status: 'PUBLISHED' } })
      for (const job of jobs) {
        const applications = await prisma.application.findMany({
          where: { jobId: job.id },
          include: { resumeScore: true, interview: { include: { videoScore: true } } }
        })
        const total = applications.length
        if (total === 0) continue
        const screened    = applications.filter((a: any) => a.resumeScore !== null).length
        const interviewed = applications.filter((a: any) => a.interview !== null).length
        const evaluated   = applications.filter((a: any) => a.interview?.videoScore != null).length
        const scores      = applications.filter((a: any) => a.resumeScore !== null).map((a: any) => a.resumeScore.overallScore)
        const avgScore    = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0
        const high = scores.filter((s: number) => s >= 75).length
        const mid  = scores.filter((s: number) => s >= 50 && s < 75).length
        const low  = scores.filter((s: number) => s < 50).length
        const anomalies: string[] = []
        if (screened < total * 0.3)        anomalies.push('Low screening rate - less than 30% screened.')
        if (interviewed < screened * 0.4)  anomalies.push('Low interview conversion - less than 40% of screened candidates interviewed.')
        if (avgScore < 55 && screened > 0) anomalies.push('Average resume score below 55.')
        if (low > high && screened > 0)    anomalies.push('More low-scoring candidates than high-scoring ones.')
        await prisma.biasReport.create({
          data: {
            jobId: job.id,
            stage: 'weekly-auto',
            demographicData: {
              pipeline: [
                { stage: 'Applied',         count: total,       percentage: 100 },
                { stage: 'Resume Screened', count: screened,    percentage: total > 0 ? Math.round((screened    / total) * 100) : 0 },
                { stage: 'Interviewed',     count: interviewed, percentage: total > 0 ? Math.round((interviewed / total) * 100) : 0 },
                { stage: 'Evaluated',       count: evaluated,   percentage: total > 0 ? Math.round((evaluated   / total) * 100) : 0 },
              ],
              scoreDistribution: { high, medium: mid, low },
              averageScore: avgScore
            },
            anomalyFlags: { anomalies, generatedBy: 'weekly-scheduler' }
          }
        })
        console.log(`[Scheduler] Report created for: ${job.title}`)
      }
      console.log(`[Scheduler] Done - ${jobs.length} jobs processed.`)
    } catch (error) {
      console.error('[Scheduler] Error:', error)
    }
  })
  console.log('[Scheduler] Weekly bias report scheduler started (every Monday 9 AM)')
}
