import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('pooja123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'pooja@gmail.com' },
update: { passwordHash, role: 'ADMIN' },
    create: {
      name: 'Pooja',
      email: 'pooja@gmail.com',
      passwordHash,
      role: 'ADMIN',
    }
  })

  console.log('✅ User upserted:', user.email, '| role:', user.role)
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())