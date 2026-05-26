import prisma from '../utils/prisma'

async function fixStatuses() {
  const applications = await prisma.application.findMany({
    where: { status: 'APPLIED' },
    include: { resumeScore: true }
  })

  console.log(`Found ${applications.length} APPLIED applications to fix`)

  for (const app of applications) {
    const score = (app.resumeScore as any)?.overallScore ?? 0
    const newStatus = score >= 60 ? 'SHORTLISTED' : 'REJECTED'
    await prisma.application.update({
      where: { id: app.id },
      data: { status: newStatus }
    })
    console.log(`${app.candidateId} — score: ${score} → ${newStatus}`)
  }

  console.log('Done!')
  await prisma.$disconnect()
}

fixStatuses()