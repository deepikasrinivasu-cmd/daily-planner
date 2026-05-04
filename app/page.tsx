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
import QuickTasksPanel from './components/QuickTasksPanel'
import NotificationSetup from './components/NotificationSetup'
import { useKidTracker } from '@/hooks/useSupabase'

const KidTracker = dynamic_(() => import('./components/KidTracker'), { ssr: false })

type Tab = 'missions' | 'rewards' | 'schedule' | 'groceries' | 'tasks'
const TABS: { id: Tab; label: string; icon: string; bg: string; text: string }[] = [
  { id: 'missions',  label: 'Missions',  icon: '⭐', bg: '#FFD60A', text: '#000000' },
  { id: 'rewards',   label: 'Rewards',   icon: '🏆', bg: '#FF6B6B', text: '#000000' },
  { id: 'tasks',     label: 'Tasks',     icon: '⚡', bg: '#A855F7', text: '#ffffff' },
  { id: 'schedule',  label: 'Schedule',  icon: '📅', bg: '#4ECDC4', text: '#000000' },
  { id: 'groceries', label: 'Groceries', icon: '🛒', bg: '#FF9F1C', text: '#000000' },
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

  return (
    <>
      <div className="w-screen h-screen flex flex-col overflow-hidden" style={{ background: '#F0F4F8' }}>

        {/* ── Top header ── */}
        <div className="flex-shrink-0 flex items-center px-4 py-3 gap-3" style={{ background: '#1E1B4B' }}>
          <div className="text-lg font-black text-white whitespace-nowrap">🏠 Family HQ</div>
          <div className="flex-1 flex justify-center">
            <Clock />
          </div>
          <button onClick={() => setPinIntent('settings')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border-2 border-white/30 hover:border-white/60 transition-colors"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            ⚙️
          </button>
        </div>

        {/* ── Tab bar — directly below header, always visible ── */}
        <div className="flex-shrink-0 flex gap-2 px-3 py-2" style={{ background: '#1E1B4B' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl font-black text-xs transition-all border-2"
              style={tab === t.id
                ? { background: t.bg, color: t.text, borderColor: t.bg, transform: 'scale(1.05)' }
                : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderColor: 'transparent' }
              }>
              <span className="text-2xl leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Page content ── */}
        <div className="flex-1 min-h-0 overflow-hidden">

          {tab === 'missions' && (
            <div className="flex flex-col h-full px-3 pt-3 pb-3 gap-3">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-2xl font-black text-gray-900">Mission Control 🚀</div>
                  <div className="text-gray-500 text-sm font-semibold">Tap the green button to complete!</div>
                </div>
                <button onClick={() => setPinIntent('reset')}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl font-black text-sm border-2 transition-all
                    ${resetDone ? 'bg-green-400 border-green-400 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                  {resetDone ? '✓ Done!' : '🔄 Reset'}
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <KidTracker />
              </div>
            </div>
          )}

          {tab === 'rewards' && (
            <div className="flex flex-col h-full px-3 pt-3 pb-3 gap-3">
              <div className="flex-shrink-0">
                <div className="text-2xl font-black text-gray-900">Bounty Rewards 🏆</div>
                <div className="text-gray-500 text-sm font-semibold">Complete missions to unlock these!</div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto panel-scroll">
                <BountyBar percent={percent} />
              </div>
            </div>
          )}

          {tab === 'tasks' && (
            <div className="flex flex-col h-full px-3 pt-3 pb-3">
              <QuickTasksPanel />
            </div>
          )}

          {tab === 'schedule' && (
            <div className="flex flex-col h-full px-3 pt-3 pb-3">
              <FamilySchedule />
            </div>
          )}

          {tab === 'groceries' && (
            <div className="flex flex-col h-full px-3 pt-3 pb-3">
              <GroceryPanel />
            </div>
          )}

        </div>
      </div>

      {pinIntent && <PinModal onSuccess={handlePinSuccess} onClose={() => setPinIntent(null)} />}
      {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} />}
      <NotificationSetup />
      <canvas id="confetti-canvas" />
    </>
  )
}

export default function Page() {
  return <AppContent />
}
