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

type Tab = 'missions' | 'rewards' | 'schedule' | 'groceries'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'missions',  label: 'Missions',  icon: '⭐' },
  { id: 'rewards',   label: 'Rewards',   icon: '🏴‍☠️' },
  { id: 'schedule',  label: 'Schedule',  icon: '📅' },
  { id: 'groceries', label: 'Groceries', icon: '🛒' },
]

function AppContent() {
  const { percent } = useKidTracker()
  const [tab, setTab] = useState<Tab>('missions')
  const [showAdmin, setShowAdmin] = useState(false)

  return (
    <>
      {/* Fills 100% of whatever screen it's on */}
      <div className="w-screen h-screen flex flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center px-4 py-3 border-b border-slate-800/60 gap-3">
          <div className="text-xl font-black bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent whitespace-nowrap">
            Family HQ
          </div>
          <div className="flex-1 flex justify-center">
            <Clock />
          </div>
          <button
            onClick={() => setShowAdmin(true)}
            className="w-10 h-10 rounded-xl bg-slate-700/60 hover:bg-slate-600 border border-slate-600 flex items-center justify-center text-xl transition-colors flex-shrink-0"
          >
            ⚙️
          </button>
        </div>

        {/* Page content — flex-1 fills all space between header and tab bar */}
        <div className="flex-1 min-h-0 overflow-hidden">

          {tab === 'missions' && (
            <div className="flex flex-col h-full px-4 pt-4 pb-3 gap-3">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl shadow-lg shadow-orange-500/30 flex-shrink-0">
                  ⭐
                </div>
                <div>
                  <div className="text-xl font-black text-white leading-tight">Mission Control</div>
                  <div className="text-slate-400 text-xs">Drag to complete · drag back to undo</div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <KidTracker />
              </div>
            </div>
          )}

          {tab === 'rewards' && (
            <div className="flex flex-col h-full px-4 pt-4 pb-3 gap-3">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-xl shadow-lg flex-shrink-0">
                  🏴‍☠️
                </div>
                <div>
                  <div className="text-xl font-black text-white leading-tight">Bounty Rewards</div>
                  <div className="text-slate-400 text-xs">Complete missions to unlock rewards!</div>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto panel-scroll">
                <BountyBar percent={percent} />
              </div>
            </div>
          )}

          {tab === 'schedule' && (
            <div className="flex flex-col h-full px-4 pt-4 pb-3">
              <FamilySchedule />
            </div>
          )}

          {tab === 'groceries' && (
            <div className="flex flex-col h-full px-4 pt-4 pb-3">
              <GroceryPanel />
            </div>
          )}

        </div>

        {/* Tab bar — pinned to bottom */}
        <div className="flex-shrink-0 flex border-t border-slate-800 bg-slate-900/80 px-2 py-1 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all font-semibold
                ${tab === t.id
                  ? 'bg-indigo-600/80 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            >
              <span className="text-2xl leading-none">{t.icon}</span>
              <span className="text-xs">{t.label}</span>
            </button>
          ))}
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
