import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Prisma } from './generated/prisma/client.js'
import { levelFromXp } from './xp.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// shared award path: create the Activity row + atomically increment the skill's xp.
// used by POST /activities and the quest-toggle award/reversal (same code, same guarantees).
async function awardXp(
  tx: Prisma.TransactionClient,
  skillId: number,
  description: string,
  xpAwarded: number,
) {
  const activity = await tx.activity.create({ data: { skillId, description, xpAwarded } })
  const skill = await tx.skill.update({ where: { id: skillId }, data: { xp: { increment: xpAwarded } } })
  const leveledUp = levelFromXp(skill.xp) > levelFromXp(skill.xp - xpAwarded)
  return { activity, skill, leveledUp }
}

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

app.post('/activities', async (req, res) => {
  const { skillId, description, xpAwarded } = req.body
  if (typeof skillId !== 'number' || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'skillId and description are required' })
  }
  if (typeof xpAwarded !== 'number' || xpAwarded <= 0) {
    return res.status(400).json({ error: 'xpAwarded must be a positive number' })
  }
  try {
    const { activity, skill, leveledUp } = await prisma.$transaction((tx) =>
      awardXp(tx, skillId, description, xpAwarded),
    )
    res.status(201).json({ activity, skill: { ...skill, level: levelFromXp(skill.xp) }, leveledUp })
  } catch {
    res.status(404).json({ error: 'skill not found' })
  }
})

app.get('/activities', async (req, res) => {
  const limit = Number(req.query.limit) || 20
  const activities = await prisma.activity.findMany({
    orderBy: { loggedAt: 'desc' },
    take: limit,
  })
  res.json(activities)
})

// hardcoded SGT (Asia/Singapore) day-bucketing — revisit when CEO relocates Aug 13;
// loggedAt is stored as a real UTC instant, so the later fix is display-only (no migration)
function sgtDateStr(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
}

function parseDateStr(dateStr: string): [number, number, number] {
  const parts = dateStr.split('-').map(Number)
  return [parts[0] ?? 0, parts[1] ?? 1, parts[2] ?? 1]
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, day] = parseDateStr(dateStr)
  const dt = new Date(Date.UTC(y, m - 1, day))
  dt.setUTCDate(dt.getUTCDate() + delta)
  return dt.toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = parseDateStr(a)
  const [by, bm, bd] = parseDateStr(b)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}

function computeStreak(activityDays: string[]): { current: number; longest: number } {
  const days = new Set(activityDays)
  if (days.size === 0) return { current: 0, longest: 0 }

  const sorted = [...days].sort()
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    run = daysBetween(sorted[i - 1] as string, sorted[i] as string) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  const today = sgtDateStr(new Date())
  const yesterday = addDays(today, -1)
  let cursor = days.has(today) ? today : days.has(yesterday) ? yesterday : null
  let current = 0
  while (cursor) {
    current += 1
    const prevDay = addDays(cursor, -1)
    cursor = days.has(prevDay) ? prevDay : null
  }
  return { current, longest }
}

app.get('/streak', async (_req, res) => {
  const activities = await prisma.activity.findMany({ select: { loggedAt: true } })
  const activityDays = activities.map((a) => sgtDateStr(a.loggedAt))
  res.json(computeStreak(activityDays))
})

app.get('/bossfight/current', async (_req, res) => {
  const bossfight = await prisma.bossFight.findFirst({ orderBy: { weekStart: 'desc' } })
  res.json(bossfight)
})

app.post('/bossfight', async (req, res) => {
  const { weekStart, title, description } = req.body
  if (typeof weekStart !== 'string' || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'weekStart and title are required' })
  }
  const bossfight = await prisma.bossFight.create({
    data: { weekStart: new Date(weekStart), title, description: typeof description === 'string' ? description : '' },
  })
  res.status(201).json(bossfight)
})

app.patch('/bossfight/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { status } = req.body
  if (!['won', 'lost', 'active'].includes(status)) {
    return res.status(400).json({ error: 'status must be won, lost, or active' })
  }
  try {
    const bossfight = await prisma.bossFight.update({ where: { id }, data: { status } })
    res.json(bossfight)
  } catch {
    res.status(404).json({ error: 'boss fight not found' })
  }
})

const QUEST_XP = 25

app.get('/quests', async (req, res) => {
  const date = req.query.date
  if (typeof date !== 'string') {
    return res.status(400).json({ error: 'date query param is required (YYYY-MM-DD)' })
  }
  const quests = await prisma.quest.findMany({ where: { date: new Date(date) }, orderBy: { id: 'asc' } })
  res.json(quests)
})

app.post('/quests', async (req, res) => {
  const { date, title, skillId } = req.body
  if (typeof date !== 'string' || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'date and title are required' })
  }
  if (skillId !== undefined && skillId !== null && typeof skillId !== 'number') {
    return res.status(400).json({ error: 'skillId must be a number or null' })
  }
  const quest = await prisma.quest.create({
    data: { date: new Date(date), title, skillId: skillId ?? null },
  })
  res.status(201).json(quest)
})

app.patch('/quests/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { status } = req.body
  if (!['open', 'done'].includes(status)) {
    return res.status(400).json({ error: 'status must be open or done' })
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const quest = await tx.quest.findUniqueOrThrow({ where: { id } })
      if (quest.status === status) {
        return { quest, leveledUp: false } // done->done or open->open: no-op, idempotent
      }
      const updatedQuest = await tx.quest.update({ where: { id }, data: { status } })
      if (quest.skillId === null) {
        // skill was never linked, or the skill was cascade-deleted (SetNull) — no XP either direction
        return { quest: updatedQuest, leveledUp: false }
      }
      const xpAwarded = status === 'done' ? QUEST_XP : -QUEST_XP
      const description = status === 'done' ? `Quest: ${quest.title}` : `Reverted quest: ${quest.title}`
      const { leveledUp } = await awardXp(tx, quest.skillId, description, xpAwarded)
      return { quest: updatedQuest, leveledUp }
    })
    res.json(result)
  } catch {
    res.status(404).json({ error: 'quest not found' })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Odyssey backend listening on port ${PORT}`)
})
