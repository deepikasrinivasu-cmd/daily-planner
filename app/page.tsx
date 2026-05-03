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

function AppContent() {
  const { percent } = useKidTracker()
  const [showAdmin, setShowAdmin] = useState(false)

  return (
    <>
      {/* ── Portrait 1080×1920 layout ── */}
      <div className="w-[1080px] h-[1920px] flex flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">

        {/* ── Top bar ── */}
        <div className="flex items-center px-6 py-4 border-b border-slate-800/60 flex-shrink-0 gap-4">
          <div className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
            Family HQ
          </div>
          <div className="flex-1 flex justify-center">
            <Clock />
          </div>
          <button
            onClick={() => setShowAdmin(true)}
            className="w-12 h-12 rounded-2xl bg-slate-700/60 hover:bg-slate-600 border border-slate-600 flex items-center justify-center text-2xl transition-colors"
          >
            ⚙️
          </button>
        </div>

        {/* ── Kid tracker hero (top ~55%) ── */}
        <div className="flex flex-col px-6 py-5 gap-4 flex-shrink-0" style={{ height: '1020px' }}>
          {/* Kid header */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/30">
              ⭐
            </div>
            <div>
              <div className="text-3xl font-black text-white">Mission Control</div>
              <div className="text-slate-400 text-base">Complete missions to unlock rewards!</div>
            </div>
          </div>

          {/* Bounty bar */}
          <div className="flex-shrink-0">
            <BountyBar percent={percent} />
          </div>

          {/* Tracker — fills remaining space */}
          <div className="flex-1 overflow-hidden">
            <KidTracker />
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-slate-700/60 flex-shrink-0 mx-6" />

        {/* ── Bottom half: Schedule + Groceries side by side ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Schedule */}
          <div className="flex-1 border-r border-slate-800/60 p-5 flex flex-col overflow-hidden">
            <FamilySchedule />
          </div>

          {/* Groceries */}
          <div className="flex-1 p-5 flex flex-col overflow-hidden">
            <GroceryPanel />
          </div>

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
