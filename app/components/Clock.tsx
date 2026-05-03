'use client'
import { useState, useEffect } from 'react'

export default function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const dateStr = `${days[now.getDay()]} ${months[now.getMonth()]} ${now.getDate()}`
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold text-white tracking-tight drop-shadow">{timeStr}</span>
      <span className="text-sm text-white/70">{dateStr}</span>
    </div>
  )
}
