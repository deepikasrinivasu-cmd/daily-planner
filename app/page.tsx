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

// KidTracker uses DnD which needs client-only
const KidTracker = dynamic_(() => import('./components/KidTracker'), { ssr: false })

function WeatherWidget() {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-lg">
      <span>☀️</span>
      <span>Have a great day!</span>
    </div>
  )
}

function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 rounded-2xl bg-slate-700/60 hover:bg-slate-600 border border-slate-600 flex items-center justify-center text-2xl transition-colors"
      title="Parent settings"
    >
      ⚙️
    </button>
  )
}

// ── Inner component that reads percent from the tracker hook ─────────────────
function AppContent() {
  const { percent } = useKidTracker()
  const [showAdmin, setShowAdmin] = useState(false)

  return (
    <>
      {/* ── Full-screen 1920×1080 layout ── */}
      <div className="w-[1920px] h-[1080px] flex flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

        {/* Top bar */}
        <div className="flex items-center px-8 py-4 border-b border-slate-800/60 gap-6 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
              Family HQ
            </div>
            <WeatherWidget />
          </div>
          <Clock />
          <div className="flex items-center gap-3 flex-1 justify-end">
            <SettingsButton onClick={() => setShowAdmin(true)} />
          </div>
        </div>

        {/* Main three-panel body */}
        <div className="flex flex-1 overflow-hidden gap-0">

          {/* LEFT — Family schedule */}
          <div className="w-[420px] flex-shrink-0 border-r border-slate-800/60 p-6 flex flex-col">
            <FamilySchedule />
          </div>

          {/* CENTER — Kid tracker (hero) */}
          <div className="flex-1 flex flex-col px-8 py-6 gap-5 overflow-hidden">
            {/* Kid header */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/30">
                ⭐
              </div>
              <div>
                <div className="text-3xl font-black text-white">Mission Control</div>
                <div className="text-slate-400 text-lg">Complete your missions to unlock rewards!</div>
              </div>
            </div>

            {/* Bounty bar */}
            <div className="flex-shrink-0">
              <BountyBar percent={percent} />
            </div>

            {/* Tracker */}
            <div className="flex-1 overflow-hidden">
              <KidTracker />
            </div>
          </div>

          {/* RIGHT — Groceries */}
          <div className="w-[420px] flex-shrink-0 border-l border-slate-800/60 p-6 flex flex-col">
            <GroceryPanel />
          </div>
        </div>
      </div>

      {/* Admin modal */}
      {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} />}

      {/* Confetti canvas */}
      <canvas id="confetti-canvas" />
    </>
  )
}

export default function Page() {
  return <AppContent />
}
