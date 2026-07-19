import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const skills = [
  { name: 'Coding', description: 'the trunk: DSA, full apps, AI integration, agentic systems' },
  { name: 'Pixel Art + Design', description: 'design ability, UI/UX, creating assets' },
  { name: 'Motion + Editing', description: 'Apple-ad-style cinematics and clean editing' },
  { name: 'AI Development', description: 'AI dev work and deeper concepts' },
  { name: 'Quant + Math', description: 'quant concepts and math' },
  { name: 'Typing Speed', description: 'type faster to code faster' },
]

async function main() {
  await prisma.ping.create({ data: { message: 'hello from postgres' } })
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    })
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
