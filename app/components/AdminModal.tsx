'use client'
import { useState } from 'react'
import { useActivities, useBounties } from '@/hooks/useSupabase'

const ICONS = ['⭐', '🪥', '🛏️', '🥞', '👕', '📚', '📖', '🧹', '🛁', '😴', '🏃', '🎨', '🎮', '🐶', '🌳', '💊', '🥗', '🧘', '🎵', '🚿']
const BOUNTY_ICONS = ['📱', '🍫', '⚽', '🎬', '🏆', '🍕', '🎠', '🍦', '🎯', '🛹', '🎸', '🃏']
const BOUNTY_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#ec4899', '#8b5cf6', '#e63946', '#0891b2']

function ActivitiesTab() {
  const { activities, addActivity, toggleActivity, deleteActivity } = useActivities()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('⭐')

  const handleAdd = async () => {
    if (!name.trim()) return
    await addActivity(name.trim(), icon)
    setName('')
    setIcon('⭐')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-800 border border-slate-700">
        <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Add New Activity</div>
        <div className="flex gap-2 flex-wrap">
          {ICONS.map((i) => (
            <button
              key={i}
              onClick={() => setIcon(i)}
              className={`text-2xl w-10 h-10 rounded-xl transition-all ${icon === i ? 'bg-indigo-500 scale-110' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-slate-700 text-white rounded-xl px-4 py-2 outline-none border border-slate-600 focus:border-indigo-500"
            placeholder="Activity name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button onClick={handleAdd} className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-colors">
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {activities.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-2xl">{a.icon}</span>
            <span className={`flex-1 text-base font-medium ${a.is_active ? 'text-white' : 'text-slate-500 line-through'}`}>{a.name}</span>
            <button
              onClick={() => toggleActivity(a.id, a.is_active)}
              className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${a.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-slate-700 text-slate-500 border border-slate-600'}`}
            >
              {a.is_active ? 'Active' : 'Hidden'}
            </button>
            <button onClick={() => deleteActivity(a.id)} className="text-red-400 hover:text-red-300 text-xl px-1 transition-colors">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function BountiesTab() {
  const { bounties, addBounty, deleteBounty } = useBounties()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🏆')
  const [threshold, setThreshold] = useState(50)
  const [color, setColor] = useState(BOUNTY_COLORS[0])

  const handleAdd = async () => {
    if (!name.trim()) return
    await addBounty({ name: name.trim(), icon, threshold, color })
    setName('')
    setIcon('🏆')
    setThreshold(50)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-800 border border-slate-700">
        <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Add New Bounty</div>
        <div className="flex gap-2 flex-wrap">
          {BOUNTY_ICONS.map((i) => (
            <button
              key={i}
              onClick={() => setIcon(i)}
              className={`text-2xl w-10 h-10 rounded-xl transition-all ${icon === i ? 'bg-yellow-500 scale-110' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              {i}
            </button>
          ))}
        </div>
        <input
          className="bg-slate-700 text-white rounded-xl px-4 py-2 outline-none border border-slate-600 focus:border-yellow-500"
          placeholder="Reward name (e.g. 30 min Screen Time)..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 whitespace-nowrap">Unlock at:</span>
          <input
            type="range"
            min={10} max={100} step={5}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-yellow-300 font-bold text-lg w-12 text-right">{threshold}%</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {BOUNTY_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'scale-125 border-white' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button onClick={handleAdd} className="py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-colors">
          Add Bounty
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {bounties.map((b) => (
          <div key={b.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 border-2" style={{ borderColor: `${b.color}55` }}>
            <span className="text-2xl">{b.icon}</span>
            <span className="flex-1 text-base font-medium text-white">{b.name}</span>
            <span className="text-sm px-2 py-1 rounded-lg font-bold" style={{ backgroundColor: `${b.color}33`, color: b.color }}>
              {b.threshold}%
            </span>
            <button onClick={() => deleteBounty(b.id)} className="text-red-400 hover:text-red-300 text-xl px-1 transition-colors">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'activities' | 'bounties'>('activities')

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="w-[700px] max-h-[800px] bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚙️</span> Parent Settings
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xl flex items-center justify-center transition-colors">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 py-3 border-b border-slate-700">
          {(['activities', 'bounties'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              {t === 'activities' ? '📋 Activities' : '🏴‍☠️ Bounties'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto panel-scroll p-6">
          {tab === 'activities' ? <ActivitiesTab /> : <BountiesTab />}
        </div>
      </div>
    </div>
  )
}
