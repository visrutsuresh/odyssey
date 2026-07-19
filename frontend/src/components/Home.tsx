import { useEffect, useState } from 'react'
import {
  getSkills,
  getStreak,
  getCurrentBossFight,
  updateBossFightStatus,
  type Skill,
  type Streak,
  type BossFight,
} from '../api'

// mirrors backend/src/xp.ts xpForLevel — duplicated on purpose, it's a one-line
// display formula and frontend/backend are separate deployable processes (no shared package)
const xpForLevel = (n: number) => 50 * n * (n - 1)

export default function Home() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [streak, setStreak] = useState<Streak | null>(null)
  const [boss, setBoss] = useState<BossFight | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([getSkills(), getStreak(), getCurrentBossFight()])
      .then(([s, st, b]) => {
        setSkills(s)
        setStreak(st)
        setBoss(b)
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const setBossStatus = (status: BossFight['status']) => {
    if (!boss) return
    updateBossFightStatus(boss.id, status).then(setBoss).catch((e) => setError(e.message))
  }

  if (loading) return <p>loading...</p>
  if (error) return <p className="text-red-400">{error}</p>

  const overallLevel = skills.reduce((sum, s) => sum + s.level, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-400">Overall level: {overallLevel}</h1>
        <p className="text-slate-300 mt-1">
          Streak: {streak?.current ?? 0} days (longest {streak?.longest ?? 0})
        </p>
      </div>

      <div className="bg-slate-800 rounded p-4">
        <h2 className="font-bold mb-2">This week's boss fight</h2>
        {boss ? (
          <div>
            <p className="font-semibold">{boss.title}</p>
            <p className="text-slate-400 text-sm">{boss.description}</p>
            <p className="text-sm mt-1">
              Status: <span className="uppercase">{boss.status}</span>
            </p>
            {boss.status === 'active' && (
              <div className="mt-2 flex gap-2">
                <button onClick={() => setBossStatus('won')} className="bg-emerald-600 px-3 py-1 rounded">
                  Won
                </button>
                <button onClick={() => setBossStatus('lost')} className="bg-red-600 px-3 py-1 rounded">
                  Lost
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-400">No boss fight set for this week yet.</p>
        )}
      </div>

      <div className="space-y-3">
        {skills.map((s) => {
          const floor = xpForLevel(s.level)
          const ceil = xpForLevel(s.level + 1)
          const pct = Math.min(100, Math.round(((s.xp - floor) / (ceil - floor)) * 100)) || 0
          return (
            <div key={s.id} className="bg-slate-800 rounded p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">
                  {s.name} — L{s.level}
                </span>
                <span className="text-slate-400">
                  {s.xp - floor} / {ceil - floor} xp
                </span>
              </div>
              <div className="bg-slate-700 rounded h-2">
                <div className="bg-emerald-500 h-2 rounded" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
