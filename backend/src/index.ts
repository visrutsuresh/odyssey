import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'
import { levelFromXp } from './xp.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', async (_req, res) => {
  const ping = await prisma.ping.findFirst()
  res.json({ ok: true, message: ping?.message ?? 'db is empty' })
})

app.get('/skills', async (_req, res) => {
  const skills = await prisma.skill.findMany({ orderBy: { id: 'asc' } })
  res.json(skills.map((s) => ({ ...s, level: levelFromXp(s.xp) })))
})

app.post('/skills', async (req, res) => {
  const { name, description } = req.body
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required' })
  }
  const skill = await prisma.skill.create({
    data: { name, description: typeof description === 'string' ? description : '' },
  })
  res.status(201).json({ ...skill, level: levelFromXp(skill.xp) })
})

app.patch('/skills/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { name, description, xp } = req.body
  if (xp !== undefined) {
    return res.status(400).json({ error: 'xp cannot be edited directly' })
  }
  const data: { name?: string; description?: string } = {}
  if (name !== undefined) data.name = name
  if (description !== undefined) data.description = description
  try {
    const skill = await prisma.skill.update({ where: { id }, data })
    res.json({ ...skill, level: levelFromXp(skill.xp) })
  } catch {
    res.status(404).json({ error: 'skill not found' })
  }
})

app.delete('/skills/:id', async (req, res) => {
  const id = Number(req.params.id)
  try {
    await prisma.skill.delete({ where: { id } })
    res.status(204).send()
  } catch {
    res.status(404).json({ error: 'skill not found' })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Odyssey backend listening on port ${PORT}`)
})
