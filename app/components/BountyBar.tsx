'use client'
import { useEffect, useRef, useState } from 'react'
import { useBounties } from '@/hooks/useSupabase'
import type { Bounty } from '@/types/database'

function BountyBadge({ bounty, percent, wasUnlocked }: { bounty: Bounty; percent: number; wasUnlocked: boolean }) {
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

  return (
    <div
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border-2 transition-all duration-500
        ${unlocked
          ? `border-opacity-80 shadow-lg ${animating ? 'bounty-unlock' : ''}`
          : 'border-slate-700 opacity-40 grayscale'
        }
      `}
      style={unlocked ? { borderColor: bounty.color, backgroundColor: `${bounty.color}22`, boxShadow: `0 0 20px ${bounty.color}44` } : {}}
    >
      <span className={`text-3xl ${animating ? 'bounce-in' : ''}`}>{bounty.icon}</span>
      <span className="text-xs font-semibold text-center leading-tight max-w-[80px] text-slate-300">
        {bounty.name}
      </span>
      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${Math.min(100, (percent / bounty.threshold) * 100)}%`,
            backgroundColor: bounty.color,
          }}
        />
      </div>
      <span className="text-[10px] text-slate-500">{bounty.threshold}%</span>
    </div>
  )
}

export default function BountyBar({ percent }: { percent: number }) {
  const { bounties } = useBounties()

  return (
    <div className="flex flex-col gap-3">
      <div className="text-lg font-bold text-yellow-300 flex items-center gap-2">
        <span>🏴‍☠️</span> Bounty Rewards
      </div>
      <div className="flex gap-3 flex-wrap">
        {bounties.map((b) => (
          <BountyBadge key={b.id} bounty={b} percent={percent} wasUnlocked={percent >= b.threshold} />
        ))}
        {bounties.length === 0 && (
          <div className="text-slate-500 text-sm">No bounties set — add some in settings!</div>
        )}
      </div>
    </div>
  )
}
