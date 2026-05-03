'use client'
import { useState, useEffect } from 'react'

export default function Clock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`

  return (
    <div className="text-center">
      <div className="text-5xl font-bold text-white tracking-tight">{timeStr}</div>
      <div className="text-lg text-slate-400 mt-1">{dateStr}</div>
    </div>
  )
}
