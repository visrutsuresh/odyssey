import { useEffect, useState } from 'react'
import { getActivities, createActivity, getSkills, type Activity, type Skill } from '../api'

export default function ActivityLog({ onLevelUp }: { onLevelUp: (skill: Skill) => void }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [skillId, setSkillId] = useState('')
  const [description, setDescription] = useState('')
  const [xp, setXp] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([getActivities(20), getSkills()])
      .then(([a, s]) => {
        setActivities(a)
        setSkills(s)
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const skillName = (id: number) => skills.find((s) => s.id === id)?.name ?? `skill #${id}`

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    createActivity({ skillId: Number(skillId), description, xpAwarded: Number(xp) })
      .then((result) => {
        if (result.leveledUp) onLevelUp(result.skill)
        setDescription('')
        setXp('')
        load()
      })
      .catch((e) => setError(e.message))
  }

  if (loading) return <p>loading...</p>

  return (
    <div className="space-y-4">
      {error && <p className="text-red-400">{error}</p>}

      <form onSubmit={submit} className="flex gap-2 flex-wrap">
        <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="bg-slate-800 rounded px-2 py-1">
          <option value="">Select skill</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you do?"
          className="bg-slate-800 rounded px-2 py-1 flex-1"
        />
        <input
          value={xp}
          onChange={(e) => setXp(e.target.value)}
          type="number"
          placeholder="xp"
          className="bg-slate-800 rounded px-2 py-1 w-20"
        />
        <button type="submit" className="bg-emerald-600 px-3 py-1 rounded">
          Log
        </button>
      </form>

      <div className="space-y-2">
        {activities.map((a) => (
          <div key={a.id} className={`bg-slate-800 rounded p-3 ${a.xpAwarded < 0 ? 'text-red-400' : ''}`}>
            <p>
              {a.xpAwarded < 0 ? '[reverted] ' : ''}
              {a.description} — {skillName(a.skillId)}{' '}
              <span className="font-semibold">
                {a.xpAwarded > 0 ? '+' : ''}
                {a.xpAwarded} xp
              </span>
            </p>
            <p className="text-slate-500 text-xs">{new Date(a.loggedAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
