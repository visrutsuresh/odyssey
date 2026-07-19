import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('loading...')

  useEffect(() => {
    fetch('http://localhost:3001/health')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage('backend unreachable'))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-emerald-400">Odyssey begins.</h1>
        <p className="mt-4 text-slate-300">The database says: {message}</p>
      </div>
    </div>
  )
}

export default App
