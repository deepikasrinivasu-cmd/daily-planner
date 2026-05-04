'use client'
import { useState } from 'react'
import { useActivities, useBounties, useCoins } from '@/hooks/useSupabase'

const ICONS = ['⭐','🪥','🛏️','🥞','👕','📚','📖','🧹','🛁','😴','🏃','🎨','🎮','🐶','🌳','💊','🥗','🧘','🎵','🚿']
const BOUNTY_ICONS = ['📱','🍫','⚽','🎬','🏆','🍕','🎠','🍦','🎯','🛹','🎸','🃏']
const BOUNTY_COLORS = ['#3b82f6','#f59e0b','#22c55e','#ec4899','#8b5cf6','#e63946','#0891b2']

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
    <div className="flex flex-col gap-4">
      {/* Add form */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
        <div className="text-sm font-black text-gray-500 uppercase tracking-wider">Add New Activity</div>
        <div className="flex gap-2 flex-wrap">
          {ICONS.map((i) => (
            <button key={i} onClick={() => setIcon(i)}
              className={`text-2xl w-11 h-11 rounded-xl transition-all border-2 ${icon === i ? 'border-indigo-500 bg-indigo-100 scale-110' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
              {i}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="flex-1 bg-white text-gray-900 rounded-xl px-4 py-3 outline-none border-2 border-gray-200 focus:border-indigo-400 font-semibold"
            placeholder="Activity name..." value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <button onClick={handleAdd} className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-black transition-colors">
            Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {activities.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm">
            <span className="text-2xl">{a.icon}</span>
            <span className={`flex-1 text-base font-bold ${a.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{a.name}</span>
            <button onClick={() => toggleActivity(a.id, a.is_active)}
              className={`px-3 py-1.5 rounded-lg text-sm font-black transition-colors border-2 ${a.is_active ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
              {a.is_active ? 'Active' : 'Hidden'}
            </button>
            <button onClick={() => deleteActivity(a.id)} className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-lg font-black hover:bg-red-200 transition-colors">×</button>
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
    <div className="flex flex-col gap-4">
      {/* Add form */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
        <div className="text-sm font-black text-gray-500 uppercase tracking-wider">Add New Bounty</div>
        <div className="flex gap-2 flex-wrap">
          {BOUNTY_ICONS.map((i) => (
            <button key={i} onClick={() => setIcon(i)}
              className={`text-2xl w-11 h-11 rounded-xl transition-all border-2 ${icon === i ? 'border-yellow-500 bg-yellow-100 scale-110' : 'border-gray-200 bg-white hover:border-yellow-300'}`}>
              {i}
            </button>
          ))}
        </div>
        <input className="bg-white text-gray-900 rounded-xl px-4 py-3 outline-none border-2 border-gray-200 focus:border-yellow-400 font-semibold"
          placeholder="Reward name (e.g. 30 min Screen Time)..." value={name} onChange={e => setName(e.target.value)} />
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-600 whitespace-nowrap">Unlock at:</span>
          <input type="range" min={10} max={100} step={5} value={threshold}
            onChange={e => setThreshold(Number(e.target.value))} className="flex-1 accent-yellow-500" />
          <span className="font-black text-yellow-600 text-lg w-12 text-right">{threshold}%</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {BOUNTY_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-9 h-9 rounded-full border-4 transition-transform ${color === c ? 'scale-125 border-gray-900' : 'border-transparent'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <button onClick={handleAdd} className="py-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-black transition-colors border-2 border-yellow-500">
          Add Bounty
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {bounties.map((b) => (
          <div key={b.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border-2 shadow-sm" style={{ borderColor: `${b.color}66` }}>
            <span className="text-2xl">{b.icon}</span>
            <span className="flex-1 text-base font-bold text-gray-900">{b.name}</span>
            <span className="text-sm px-3 py-1 rounded-lg font-black border-2" style={{ backgroundColor: `${b.color}22`, color: b.color, borderColor: `${b.color}44` }}>
              {b.threshold}%
            </span>
            <button onClick={() => deleteBounty(b.id)} className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-lg font-black hover:bg-red-200 transition-colors">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResetsTab() {
  const { totalCoins, diamonds, resetCoins, resetDiamonds } = useCoins()
  const [confirmCoins, setConfirmCoins]     = useState(false)
  const [confirmDiamonds, setConfirmDiamonds] = useState(false)
  const [doneCoins, setDoneCoins]           = useState(false)
  const [doneDiamonds, setDoneDiamonds]     = useState(false)

  const handleResetCoins = async () => {
    await resetCoins()
    setConfirmCoins(false)
    setDoneCoins(true)
    setTimeout(() => setDoneCoins(false), 2500)
  }

  const handleResetDiamonds = async () => {
    await resetDiamonds()
    setConfirmDiamonds(false)
    setDoneDiamonds(true)
    setTimeout(() => setDoneDiamonds(false), 2500)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500 font-semibold px-1">
        Use these to reset earned totals — e.g. after testing or a fresh start.
      </p>

      {/* Coins reset */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-black text-gray-900 flex items-center gap-2">🪙 Coins</div>
            <div className="text-sm text-gray-500 font-semibold">Current balance: <span className="font-black text-amber-700">{totalCoins}</span></div>
          </div>
          {doneCoins ? (
            <span className="px-4 py-2 rounded-xl bg-green-100 text-green-700 font-black text-sm border-2 border-green-300">✓ Reset!</span>
          ) : confirmCoins ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmCoins(false)}
                className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 font-black text-sm border-2 border-gray-200">
                Cancel
              </button>
              <button onClick={handleResetCoins}
                className="px-3 py-2 rounded-xl bg-red-500 text-white font-black text-sm border-2 border-red-600">
                Yes, reset
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmCoins(true)}
              className="px-4 py-2 rounded-xl bg-amber-400 text-black font-black text-sm border-2 border-amber-500">
              Reset to 0
            </button>
          )}
        </div>
      </div>

      {/* Diamonds reset */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-cyan-50 border-2 border-cyan-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-black text-gray-900 flex items-center gap-2">💎 Diamonds</div>
            <div className="text-sm text-gray-500 font-semibold">Current count: <span className="font-black text-cyan-700">{diamonds}</span></div>
          </div>
          {doneDiamonds ? (
            <span className="px-4 py-2 rounded-xl bg-green-100 text-green-700 font-black text-sm border-2 border-green-300">✓ Reset!</span>
          ) : confirmDiamonds ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmDiamonds(false)}
                className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 font-black text-sm border-2 border-gray-200">
                Cancel
              </button>
              <button onClick={handleResetDiamonds}
                className="px-3 py-2 rounded-xl bg-red-500 text-white font-black text-sm border-2 border-red-600">
                Yes, reset
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDiamonds(true)}
              className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-black text-sm border-2 border-cyan-500">
              Reset to 0
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'activities' | 'bounties' | 'resets'>('activities')

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col" onClick={onClose}>
      {/* Full screen panel — slides up from bottom */}
      <div className="flex-1" /> {/* push panel down — tap top area to close */}
      <div
        className="w-full bg-white rounded-t-3xl shadow-2xl flex flex-col bounce-in"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-gray-100 flex-shrink-0">
          <div className="text-xl font-black text-gray-900 flex items-center gap-2">⚙️ Parent Settings</div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xl flex items-center justify-center font-black transition-colors">×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 py-3 border-b-2 border-gray-100 flex-shrink-0">
          {(['activities', 'bounties', 'resets'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-colors border-2 ${tab === t ? 'bg-indigo-500 text-white border-indigo-500' : 'text-gray-500 border-gray-200 bg-gray-50 hover:border-indigo-300'}`}>
              {t === 'activities' ? '📋 Activities' : t === 'bounties' ? '🏆 Bounties' : '🔄 Resets'}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto panel-scroll p-5">
          {tab === 'activities' ? <ActivitiesTab /> : tab === 'bounties' ? <BountiesTab /> : <ResetsTab />}
        </div>
      </div>
    </div>
  )
}
