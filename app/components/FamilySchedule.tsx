'use client'
import { useState } from 'react'
import { useFamilyEvents } from '@/hooks/useSupabase'
import type { FamilyEvent } from '@/types/database'

const EVENT_COLORS = ['#6366f1','#ec4899','#f59e0b','#22c55e','#3b82f6','#e63946','#8b5cf6']

function today() { return new Date().toISOString().split('T')[0] }

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const t = today()
  if (dateStr === t) return 'Today'
  const tom = new Date(); tom.setDate(tom.getDate() + 1)
  if (dateStr === tom.toISOString().split('T')[0]) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function EventCard({ event, onDelete }: { event: FamilyEvent; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/70 shadow border-l-4 group" style={{ borderLeftColor: event.color }}>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-base font-bold text-gray-800 truncate">{event.title}</span>
        <span className="text-sm font-medium" style={{ color: event.color }}>{event.time}</span>
      </div>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-100 text-red-400 hover:bg-red-200 flex items-center justify-center text-lg transition-all">×</button>
    </div>
  )
}

export default function FamilySchedule() {
  const { events, addEvent, deleteEvent } = useFamilyEvents()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')
  const [date, setDate] = useState(today())
  const [color, setColor] = useState(EVENT_COLORS[0])

  const handleAdd = async () => {
    if (!title.trim()) return
    const timeStr = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    await addEvent({ title: title.trim(), time: timeStr, date, color })
    setTitle(''); setTime('09:00'); setDate(today()); setShowAdd(false)
  }

  const grouped: Record<string, FamilyEvent[]> = {}
  events.forEach((e) => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e) })

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <div className="text-2xl font-black text-violet-800">Family Schedule 📅</div>
          <div className="text-violet-500 text-sm font-medium">What&apos;s coming up</div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold text-sm shadow hover:shadow-lg transition-all">
          + Event
        </button>
      </div>

      {showAdd && (
        <div className="flex-shrink-0 flex flex-col gap-2 p-4 rounded-2xl bg-white/80 shadow-lg slide-in-right border border-violet-100">
          <input className="bg-white rounded-xl px-3 py-2 text-sm outline-none border border-violet-200 focus:border-violet-400 text-gray-800"
            placeholder="Event title..." value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <div className="flex gap-2">
            <input type="time" className="flex-1 bg-white rounded-xl px-3 py-2 text-sm outline-none border border-violet-200 text-gray-800" value={time} onChange={e => setTime(e.target.value)} />
            <input type="date" className="flex-1 bg-white rounded-xl px-3 py-2 text-sm outline-none border border-violet-200 text-gray-800" value={date} min={today()} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {EVENT_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-3 transition-transform ${color === c ? 'scale-125 border-gray-800' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold text-sm">Add</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto panel-scroll flex flex-col gap-4">
        {Object.keys(grouped).length === 0 && (
          <div className="text-center text-gray-400 py-8 bg-white/50 rounded-2xl text-sm">No upcoming events.<br />Tap + to add one!</div>
        )}
        {Object.entries(grouped).map(([d, dayEvents]) => (
          <div key={d} className="flex flex-col gap-2">
            <div className="text-xs font-black uppercase tracking-widest text-violet-400 px-1">{formatDate(d)}</div>
            {dayEvents.map(event => <EventCard key={event.id} event={event} onDelete={() => deleteEvent(event.id)} />)}
          </div>
        ))}
      </div>
    </div>
  )
}
