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
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white shadow border-l-4 group border-2 border-gray-100" style={{ borderLeftColor: event.color }}>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-base font-black text-gray-900 truncate">{event.title}</span>
        <span className="text-sm font-bold" style={{ color: event.color }}>{event.time}</span>
      </div>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-lg transition-all font-bold">×</button>
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
  events.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e) })

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <div className="text-2xl font-black text-gray-900">Family Schedule 📅</div>
          <div className="text-gray-500 text-sm font-semibold">What&apos;s coming up</div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-2xl font-black text-sm text-black shadow border-2 border-black"
          style={{ backgroundColor: '#4ECDC4' }}>
          + Event
        </button>
      </div>

      {showAdd && (
        <div className="flex-shrink-0 flex flex-col gap-2 p-4 rounded-2xl bg-white shadow-lg border-2 border-gray-200 slide-in-right">
          <input className="bg-gray-50 rounded-xl px-3 py-2 text-sm outline-none border-2 border-gray-200 focus:border-indigo-400 text-gray-900 font-semibold"
            placeholder="Event title..." value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <div className="flex gap-2">
            <input type="time" className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm outline-none border-2 border-gray-200 text-gray-900" value={time} onChange={e => setTime(e.target.value)} />
            <input type="date" className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm outline-none border-2 border-gray-200 text-gray-900" value={date} min={today()} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {EVENT_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full border-4 transition-transform ${color === c ? 'scale-125 border-gray-900' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 py-2 rounded-xl font-black text-sm text-black border-2 border-black" style={{ backgroundColor: '#4ECDC4' }}>Add</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-black text-sm border-2 border-gray-200">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto panel-scroll flex flex-col gap-4">
        {Object.keys(grouped).length === 0 && (
          <div className="text-center text-gray-400 py-10 bg-white rounded-2xl text-sm border-2 border-dashed border-gray-200 font-semibold">No upcoming events.<br />Tap + to add one!</div>
        )}
        {Object.entries(grouped).map(([d, dayEvents]) => (
          <div key={d} className="flex flex-col gap-2">
            <div className="text-xs font-black uppercase tracking-widest text-indigo-500 px-1">{formatDate(d)}</div>
            {dayEvents.map(event => <EventCard key={event.id} event={event} onDelete={() => deleteEvent(event.id)} />)}
          </div>
        ))}
      </div>
    </div>
  )
}
