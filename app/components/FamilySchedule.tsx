'use client'
import { useState } from 'react'
import { useFamilyEvents } from '@/hooks/useSupabase'
import type { FamilyEvent } from '@/types/database'

const EVENT_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#e63946', '#8b5cf6']

function today() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const todayStr = today()
  if (dateStr === todayStr) return 'Today'
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function EventCard({ event, onDelete }: { event: FamilyEvent; onDelete: () => void }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 bg-slate-800/60 group relative"
      style={{ borderLeftColor: event.color }}
    >
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-base font-semibold text-white truncate">{event.title}</span>
        <span className="text-sm text-slate-400">{event.time}</span>
      </div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xl transition-opacity ml-2"
      >
        ×
      </button>
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
    setTitle('')
    setTime('09:00')
    setDate(today())
    setShowAdd(false)
  }

  // Group events by date
  const grouped: Record<string, FamilyEvent[]> = {}
  events.forEach((e) => {
    if (!grouped[e.date]) grouped[e.date] = []
    grouped[e.date].push(e)
  })

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📅</span> Schedule
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-sm px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
        >
          + Event
        </button>
      </div>

      {/* Add event form */}
      {showAdd && (
        <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-800 border border-slate-700 slide-in-right">
          <input
            className="bg-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none border border-slate-600 focus:border-indigo-500"
            placeholder="Event title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="flex gap-2">
            <input
              type="time"
              className="flex-1 bg-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none border border-slate-600"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <input
              type="date"
              className="flex-1 bg-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none border border-slate-600"
              value={date}
              min={today()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {EVENT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'scale-125 border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-colors">
              Add Event
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="flex flex-col gap-4 flex-1 panel-scroll">
        {Object.keys(grouped).length === 0 && (
          <div className="text-center text-slate-500 py-8 text-sm">
            No upcoming events.<br />Tap + to add one!
          </div>
        )}
        {Object.entries(grouped).map(([date, dayEvents]) => (
          <div key={date} className="flex flex-col gap-2">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">
              {formatDate(date)}
            </div>
            {dayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onDelete={() => deleteEvent(event.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
