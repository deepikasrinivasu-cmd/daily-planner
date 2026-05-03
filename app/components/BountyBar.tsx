'use client'
import { useEffect, useRef, useState } from 'react'
import { useBounties } from '@/hooks/useSupabase'
import type { Bounty } from '@/types/database'

const CARD_COLORS = ['#FFD60A','#FF6B6B','#4ECDC4','#FF9F1C','#A8DADC','#FFBF69','#CBF3F0','#FF6392']

function BountyCard({ bounty, percent, idx }: { bounty: Bounty; percent: number; idx: number }) {
  const unlocked = percent >= bounty.threshold
  const [animating, setAnimating] = useState(false)
  const prevUnlocked = useRef(false)

  useEffect(() => {
    if (unlocked && !prevUnlocked.current) { setAnimating(true); setTimeout(() => setAnimating(false), 1500) }
    prevUnlocked.current = unlocked
  }, [unlocked])

  const progress = Math.min(100, (percent / bounty.threshold) * 100)
  const bg = CARD_COLORS[idx % CARD_COLORS.length]

  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 shadow-md transition-all duration-500
      ${animating ? 'bounty-unlock' : ''}`}
      style={{ backgroundColor: unlocked ? bg : '#ffffff', borderColor: unlocked ? bg : '#e5e7eb' }}>
      <span className={`text-5xl flex-shrink-0 ${animating ? 'bounce-in' : ''} ${!unlocked ? 'grayscale opacity-50' : ''}`}>{bounty.icon}</span>
      <div className="flex flex-col flex-1 gap-2">
        <div className="flex items-center justify-between">
          <span className="text-lg font-black text-black">{bounty.name}</span>
          <span className="text-sm font-black px-3 py-1 rounded-full"
            style={{ background: unlocked ? 'rgba(0,0,0,0.15)' : '#f3f4f6', color: unlocked ? '#000' : '#6b7280' }}>
            {unlocked ? '🔓 UNLOCKED!' : `${bounty.threshold}%`}
          </span>
        </div>
        <div className="h-4 rounded-full overflow-hidden" style={{ background: unlocked ? 'rgba(0,0,0,0.15)' : '#e5e7eb' }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${progress}%`, background: unlocked ? 'rgba(0,0,0,0.3)' : '#6366f1' }} />
        </div>
      </div>
    </div>
  )
}

export default function BountyBar({ percent }: { percent: number }) {
  const { bounties } = useBounties()
  return (
    <div className="flex flex-col gap-3">
      {bounties.map((b, i) => <BountyCard key={b.id} bounty={b} percent={percent} idx={i} />)}
      {bounties.length === 0 && (
        <div className="text-center text-gray-400 py-8 bg-white rounded-2xl text-sm border-2 border-dashed border-gray-200">
          No bounties yet — tap ⚙️ to add some!
        </div>
      )}
    </div>
  )
}
