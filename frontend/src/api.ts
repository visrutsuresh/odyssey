const BASE = 'http://localhost:3001'

export type Skill = {
  id: number
  name: string
  description: string
  xp: number
  createdAt: string
  level: number
}

export type Activity = {
  id: number
  skillId: number
  description: string
  xpAwarded: number
  loggedAt: string
}

export type Quest = {
  id: number
  date: string
  title: string
  status: 'open' | 'done'
  skillId: number | null
}

export type BossFight = {
  id: number
  weekStart: string
  title: string
  description: string
  status: 'active' | 'won' | 'lost'
}

export type Streak = { current: number; longest: number }

export type AwardResult = { activity: Activity; skill: Skill; leveledUp: boolean }
export type ToggleResult = { quest: Quest; skill: Skill | null; leveledUp: boolean }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const getSkills = () => request<Skill[]>('/skills')
export const createSkill = (data: { name: string; description?: string }) =>
  request<Skill>('/skills', { method: 'POST', body: JSON.stringify(data) })
export const updateSkill = (id: number, data: { name?: string; description?: string }) =>
  request<Skill>(`/skills/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteSkill = (id: number) => request<void>(`/skills/${id}`, { method: 'DELETE' })

export const getActivities = (limit = 20) => request<Activity[]>(`/activities?limit=${limit}`)
export const createActivity = (data: { skillId: number; description: string; xpAwarded: number }) =>
  request<AwardResult>('/activities', { method: 'POST', body: JSON.stringify(data) })

export const getStreak = () => request<Streak>('/streak')

export const getCurrentBossFight = () => request<BossFight | null>('/bossfight/current')
export const createBossFight = (data: { weekStart: string; title: string; description?: string }) =>
  request<BossFight>('/bossfight', { method: 'POST', body: JSON.stringify(data) })
export const updateBossFightStatus = (id: number, status: BossFight['status']) =>
  request<BossFight>(`/bossfight/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })

export const getQuests = (date: string) => request<Quest[]>(`/quests?date=${date}`)
export const createQuest = (data: { date: string; title: string; skillId?: number | null }) =>
  request<Quest>('/quests', { method: 'POST', body: JSON.stringify(data) })
export const toggleQuest = (id: number, status: Quest['status']) =>
  request<ToggleResult>(`/quests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
