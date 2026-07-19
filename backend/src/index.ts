import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', async (_req, res) => {
  const ping = await prisma.ping.findFirst()
  res.json({ ok: true, message: ping?.message ?? 'db is empty' })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Odyssey backend listening on port ${PORT}`)
})
