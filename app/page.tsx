'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import dynamic_ from 'next/dynamic'
import Clock from './components/Clock'
import FamilySchedule from './components/FamilySchedule'
import GroceryPanel from './components/GroceryPanel'
import BountyBar from './components/BountyBar'
import AdminModal from './components/AdminModal'
import { useKidTracker } from '@/hooks/useSupabase'

const KidTracker = dynamic_(() => import('./components/KidTracker'), { ssr: false })

type Tab = 'rewards' | 'schedule' | 'groceries'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'rewards',   label: 'Rewards',   icon: '🏴‍☠️' },
  { id: 'schedule',  label: 'Schedule',  icon: '📅' },
  { id: 'groceries', label: 'Groceries', icon: '🛒' },
]

function AppContent() {
  const { percent } = useKidTracker()
  const [tab, setTab] = useState<Tab>('rewards')
  const [showAdmin, setShowAdmin] = useState(false)

  return (
    <>
      <div className="w-[1080px] h-[1920px] flex flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">

        {/* ── Header (compact) ── */}
        <div className="flex items-center px-6 py-3 border-b border-slate-800/60 flex-shrink-0 gap-3">
          <div className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
            Family HQ
          </div>
          <div className="flex-1 flex justify-center">
            <Clock />
          </div>
          <button
            onClick={() => setShowAdmin(true)}
            className="w-10 h-10 rounded-xl bg-slate-700/60 hover:bg-slate-600 border border-slate-600 flex items-center justify-center text-xl transition-colors"
          >
            ⚙️
          </button>
        </div>

        {/* ── Kid tracker hero ── takes up most of the screen ── */}
        <div className="flex flex-col px-6 pt-5 pb-4 gap-4 flex-shrink-0" style={{ height: '1260px' }}>
          {/* Kid header */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/30">
              ⭐
            </div>
            <div>
              <div className="text-2xl font-black text-white">Mission Control</div>
              <div className="text-slate-400 text-sm">Complete missions to unlock rewards!</div>
            </div>
          </div>

          {/* Tracker */}
          <div className="flex-1 overflow-hidden">
            <KidTracker />
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex flex-shrink-0 border-t border-slate-800 px-4 pt-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all text-sm font-semibold
                ${tab === t.id
                  ? 'bg-slate-700/80 text-white'
                  : 'text-slate-500 hover:text-slate-300'}`}
            >
              <span className="text-2xl">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab content ── fills remaining space ── */}
        <div className="flex-1 overflow-hidden px-6 py-4">
          {tab === 'rewards' && <BountyBar percent={percent} />}
          {tab === 'schedule' && <FamilySchedule />}
          {tab === 'groceries' && <GroceryPanel />}
        </div>

      </div>

      {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} />}
      <canvas id="confetti-canvas" />
    </>
  )
}

export default function Page() {
  return <AppContent />
}
