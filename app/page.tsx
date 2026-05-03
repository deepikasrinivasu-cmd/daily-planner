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
      <div className="w-[1080px] h-[1920px] flex flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">

        {/* Header — always visible */}
        <div className="flex-shrink-0 flex items-center px-6 py-4 border-b border-slate-800/60 gap-3">
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

        {/* Page content — flex-1, fills everything between header and tab bar */}
        <div className="flex-1 min-h-0 overflow-hidden">

          {/* MISSIONS page */}
          {tab === 'missions' && (
            <div className="flex flex-col h-full px-6 pt-5 pb-4 gap-4">
              <div className="flex-shrink-0 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/30">
                  ⭐
                </div>
                <div>
                  <div className="text-2xl font-black text-white">Mission Control</div>
                  <div className="text-slate-400 text-sm">Drag to complete · Drag back to undo</div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <KidTracker />
              </div>
            </div>
          )}

          {/* REWARDS page */}
          {tab === 'rewards' && (
            <div className="flex flex-col h-full px-6 pt-5 pb-4 gap-4">
              <div className="flex-shrink-0 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-2xl shadow-lg">
                  🏴‍☠️
                </div>
                <div>
                  <div className="text-2xl font-black text-white">Bounty Rewards</div>
                  <div className="text-slate-400 text-sm">Complete missions to unlock rewards!</div>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto panel-scroll">
                <BountyBar percent={percent} />
              </div>
            </div>
          )}

          {/* SCHEDULE page */}
          {tab === 'schedule' && (
            <div className="flex flex-col h-full px-6 pt-5 pb-4">
              <FamilySchedule />
            </div>
          )}

          {/* GROCERIES page */}
          {tab === 'groceries' && (
            <div className="flex flex-col h-full px-6 pt-5 pb-4">
              <GroceryPanel />
            </div>
          )}

        </div>

        {/* Tab bar — always pinned at bottom */}
        <div className="flex-shrink-0 flex border-t border-slate-800 bg-slate-900/80 px-3 py-2 gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all font-semibold
                ${tab === t.id
                  ? 'bg-indigo-600/80 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            >
              <span className="text-2xl">{t.icon}</span>
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
