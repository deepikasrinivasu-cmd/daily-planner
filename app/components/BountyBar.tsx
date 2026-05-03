'use client'
import { useEffect, useRef, useState } from 'react'
import { useBounties } from '@/hooks/useSupabase'
import type { Bounty } from '@/types/database'

function BountyCard({ bounty, percent }: { bounty: Bounty; percent: number }) {
  const unlocked = percent >= bounty.threshold
  const [animating, setAnimating] = useState(false)
  const prevUnlocked = useRef(false)

  useEffect(() => {
    if (unlocked && !prevUnlocked.current) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 1500)
    }
    prevUnlocked.current = unlocked
  }, [unlocked])

  const progress = Math.min(100, (percent / bounty.threshold) * 100)

  return (
    <div
      className={`flex items-center gap-5 px-6 py-5 rounded-2xl border-2 transition-all duration-500
        ${unlocked ? `shadow-lg ${animating ? 'bounty-unlock' : ''}` : 'border-slate-700 opacity-50 grayscale'}`}
      style={unlocked ? { borderColor: bounty.color, backgroundColor: `${bounty.color}18`, boxShadow: `0 0 24px ${bounty.color}33` } : {}}
    >
      <span className={`text-5xl flex-shrink-0 ${animating ? 'bounce-in' : ''}`}>{bounty.icon}</span>
      <div className="flex flex-col flex-1 gap-2">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-white">{bounty.name}</span>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${unlocked ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
            {unlocked ? '🔓 UNLOCKED' : `${bounty.threshold}%`}
          </span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${progress}%`, backgroundColor: bounty.color }}
          />
        </div>
      </div>
    </div>
  )
}

export default function BountyBar({ percent }: { percent: number }) {
  const { bounties } = useBounties()

  return (
    <div className="flex flex-col gap-4 h-full panel-scroll">
      <div className="text-xl font-bold text-yellow-300 flex items-center gap-2 flex-shrink-0">
        <span>🏴‍☠️</span> Bounty Rewards
        <span className="ml-auto text-base text-slate-400 font-normal">{percent}% complete today</span>
      </div>
      <div className="flex flex-col gap-3">
        {bounties.map((b) => (
          <BountyCard key={b.id} bounty={b} percent={percent} />
        ))}
        {bounties.length === 0 && (
          <div className="text-slate-500 text-center py-8">No bounties yet — tap ⚙️ to add some!</div>
        )}
      </div>
    </div>
  )
}
