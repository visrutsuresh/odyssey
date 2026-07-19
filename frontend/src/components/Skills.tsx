import { useEffect, useState } from 'react'
import { getSkills, createSkill, updateSkill, deleteSkill, type Skill } from '../api'

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const load = () => {
    setLoading(true)
    getSkills()
      .then((s) => {
        setSkills(s)
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createSkill({ name, description })
      .then(() => {
        setName('')
        setDescription('')
        load()
      })
      .catch((e) => setError(e.message))
  }

  const startEdit = (s: Skill) => {
    setEditingId(s.id)
    setEditName(s.name)
    setEditDescription(s.description)
  }

  const submitEdit = (id: number) => {
    updateSkill(id, { name: editName, description: editDescription })
      .then(() => {
        setEditingId(null)
        load()
      })
      .catch((e) => setError(e.message))
  }

  const remove = (id: number) => {
    deleteSkill(id).then(load).catch((e) => setError(e.message))
  }

  if (loading) return <p>loading...</p>

  return (
    <div className="space-y-4">
      {error && <p className="text-red-400">{error}</p>}

      <form onSubmit={submitCreate} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Skill name"
          className="bg-slate-800 rounded px-2 py-1 flex-1"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="bg-slate-800 rounded px-2 py-1 flex-1"
        />
        <button type="submit" className="bg-emerald-600 px-3 py-1 rounded">
          Add
        </button>
      </form>

      <div className="space-y-2">
        {skills.map((s) => (
          <div key={s.id} className="bg-slate-800 rounded p-3">
            {editingId === s.id ? (
              <div className="flex gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-slate-700 rounded px-2 py-1 flex-1"
                />
                <input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="bg-slate-700 rounded px-2 py-1 flex-1"
                />
                <button onClick={() => submitEdit(s.id)} className="bg-emerald-600 px-3 py-1 rounded">
                  Save
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    {s.name} — L{s.level} ({s.xp} xp)
                  </p>
                  <p className="text-slate-400 text-sm">{s.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(s)} className="text-sm underline">
                    edit
                  </button>
                  <button onClick={() => remove(s.id)} className="text-sm text-red-400 underline">
                    delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
