import { useEffect, useState } from 'react'
import { getQuests, createQuest, toggleQuest, getSkills, type Quest, type Skill } from '../api'

function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function Quests({ onLevelUp }: { onLevelUp: (skill: Skill) => void }) {
  const [date, setDate] = useState(() => toISODate(new Date()))
  const [quests, setQuests] = useState<Quest[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [skillId, setSkillId] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([getQuests(date), getSkills()])
      .then(([q, s]) => {
        setQuests(q)
        setSkills(s)
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [date])

  const shiftDate = (deltaDays: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + deltaDays)
    setDate(toISODate(d))
  }

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createQuest({ date, title, skillId: skillId ? Number(skillId) : null })
      .then(() => {
        setTitle('')
        setSkillId('')
        load()
      })
      .catch((e) => setError(e.message))
  }

  const toggle = (q: Quest) => {
    toggleQuest(q.id, q.status === 'open' ? 'done' : 'open')
      .then((result) => {
        if (result.leveledUp && result.skill) onLevelUp(result.skill)
        load()
      })
      .catch((e) => setError(e.message))
  }

  if (loading) return <p>loading...</p>

  return (
    <div className="space-y-4">
      {error && <p className="text-red-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button onClick={() => shiftDate(-1)} className="bg-slate-800 px-3 py-1 rounded">
          Prev
        </button>
        <span className="font-semibold">{date}</span>
        <button onClick={() => setDate(toISODate(new Date()))} className="bg-slate-800 px-3 py-1 rounded">
          Today
        </button>
        <button onClick={() => shiftDate(1)} className="bg-slate-800 px-3 py-1 rounded">
          Next
        </button>
      </div>

      <form onSubmit={submitCreate} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quest title"
          className="bg-slate-800 rounded px-2 py-1 flex-1"
        />
        <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="bg-slate-800 rounded px-2 py-1">
          <option value="">No skill</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-emerald-600 px-3 py-1 rounded">
          Add
        </button>
      </form>

      <div className="space-y-2">
        {quests.length === 0 && <p className="text-slate-400">No quests for this day.</p>}
        {quests.map((q) => (
          <label key={q.id} className="flex items-center gap-2 bg-slate-800 rounded p-3">
            <input type="checkbox" checked={q.status === 'done'} onChange={() => toggle(q)} />
            <span className={q.status === 'done' ? 'line-through text-slate-500' : ''}>{q.title}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
