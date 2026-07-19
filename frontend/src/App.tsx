import { useState } from 'react'
import Home from './components/Home'
import Skills from './components/Skills'
import Quests from './components/Quests'
import ActivityLog from './components/ActivityLog'
import type { Skill } from './api'

type Tab = 'Home' | 'Skills' | 'Quests' | 'Activity'

function App() {
  const [tab, setTab] = useState<Tab>('Home')
  const [banner, setBanner] = useState<{ skill: string; level: number } | null>(null)

  const onLevelUp = (skill: Skill) => setBanner({ skill: skill.name, level: skill.level })

  const tabs: Tab[] = ['Home', 'Skills', 'Quests', 'Activity']

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {banner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 text-white px-4 py-3 flex items-center justify-between">
          <span className="font-bold">
            LEVEL UP! {banner.skill} reached L{banner.level}
          </span>
          <button onClick={() => setBanner(null)} className="ml-4 underline">
            dismiss
          </button>
        </div>
      )}

      <nav className="flex gap-2 border-b border-slate-700 px-4 py-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded ${
              tab === t ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="p-6 max-w-2xl mx-auto">
        {tab === 'Home' && <Home />}
        {tab === 'Skills' && <Skills />}
        {tab === 'Quests' && <Quests onLevelUp={onLevelUp} />}
        {tab === 'Activity' && <ActivityLog onLevelUp={onLevelUp} />}
      </main>
    </div>
  )
}

export default App
