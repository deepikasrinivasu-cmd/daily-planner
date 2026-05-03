'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import dynamic_ from 'next/dynamic'
import Clock from './components/Clock'
import FamilySchedule from './components/FamilySchedule'
import GroceryPanel from './components/GroceryPanel'
import BountyBar from './components/BountyBar'
import AdminModal from './components/AdminModal'
import PinModal from './components/PinModal'
import { useKidTracker } from '@/hooks/useSupabase'

const KidTracker = dynamic_(() => import('./components/KidTracker'), { ssr: false })

type Tab = 'missions' | 'rewards' | 'schedule' | 'groceries'
const TABS: { id: Tab; label: string; icon: string; color: string }[] = [
  { id: 'missions',  label: 'Missions',  icon: '⭐', color: 'from-amber-400 to-orange-400' },
  { id: 'rewards',   label: 'Rewards',   icon: '🏴‍☠️', color: 'from-violet-400 to-purple-500' },
  { id: 'schedule',  label: 'Schedule',  icon: '📅', color: 'from-blue-400 to-cyan-400' },
  { id: 'groceries', label: 'Groceries', icon: '🛒', color: 'from-green-400 to-emerald-400' },
]

type PinIntent = 'settings' | 'reset'

function AppContent() {
  const { percent, resetTasks } = useKidTracker()
  const [tab, setTab] = useState<Tab>('missions')
  const [pinIntent, setPinIntent] = useState<PinIntent | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const handlePinSuccess = async () => {
    setPinIntent(null)
    if (pinIntent === 'settings') setShowAdmin(true)
    else if (pinIntent === 'reset') {
      await resetTasks()
      setResetDone(true)
      setTimeout(() => setResetDone(false), 2000)
    }
  }

  const activeTab = TABS.find(t => t.id === tab)!

  return (
    <>
      {/* Bright gradient background */}
      <div className="w-screen h-screen flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #e0e7ff 0%, #fce7f3 40%, #fef3c7 100%)' }}>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center px-4 py-3 gap-3"
          style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)', }}>
          <div className="text-xl font-black text-white drop-shadow whitespace-nowrap">
            🏠 Family HQ
          </div>
          <div className="flex-1 flex justify-center">
            <Clock />
          </div>
          <button
            onClick={() => setPinIntent('settings')}
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl transition-colors flex-shrink-0 border border-white/30"
          >
            ⚙️
          </button>
        </div>

        {/* Page content */}
        <div className="flex-1 min-h-0 overflow-hidden">

          {tab === 'missions' && (
            <div className="flex flex-col h-full px-4 pt-4 pb-3 gap-3">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-2xl font-black text-violet-800 leading-tight">Mission Control 🚀</div>
                  <div className="text-violet-500 text-sm font-medium">Tap a mission to complete it!</div>
                </div>
                <button
                  onClick={() => setPinIntent('reset')}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all shadow
                    ${resetDone ? 'bg-green-400 text-white' : 'bg-white/70 text-violet-600 border border-violet-200 hover:bg-white'}`}
                >
                  {resetDone ? '✓ Done!' : '🔄 Reset'}
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <KidTracker />
              </div>
            </div>
          )}

          {tab === 'rewards' && (
            <div className="flex flex-col h-full px-4 pt-4 pb-3 gap-3">
              <div className="flex-shrink-0">
                <div className="text-2xl font-black text-violet-800">Bounty Rewards 🏴‍☠️</div>
                <div className="text-violet-500 text-sm font-medium">Complete missions to unlock these!</div>
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

        {/* Tab bar */}
        <div className="flex-shrink-0 flex bg-white/80 backdrop-blur border-t border-white/60 px-2 py-2 gap-2 shadow-lg">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all font-bold
                ${tab === t.id
                  ? `bg-gradient-to-b ${t.color} text-white shadow-lg scale-105`
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              <span className="text-2xl leading-none">{t.icon}</span>
              <span className="text-xs">{t.label}</span>
            </button>
          ))}
        </div>

      </div>

      {pinIntent && <PinModal onSuccess={handlePinSuccess} onClose={() => setPinIntent(null)} />}
      {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} />}
      <canvas id="confetti-canvas" />
    </>
  )
}

export default function Page() {
  return <AppContent />
}
