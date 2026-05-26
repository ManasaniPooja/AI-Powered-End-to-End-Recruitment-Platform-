const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('pooja123', 10);
  await prisma.user.create({data: {email: 'pooja@gmail.com', passwordHash: hash, role: 'HIRING_MANAGER', name: 'Pooja'}});
  console.log('User created!');
}
main().finally(() => prisma.$disconnect());
