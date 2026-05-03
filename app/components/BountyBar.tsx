'use client'
import { useEffect, useRef, useState } from 'react'
import { useBounties } from '@/hooks/useSupabase'
import type { Bounty } from '@/types/database'

const CARD_GRADIENTS = [
  'from-blue-400 to-indigo-500',
  'from-purple-400 to-pink-500',
  'from-orange-400 to-red-400',
  'from-green-400 to-teal-500',
  'from-yellow-400 to-orange-400',
]

function BountyCard({ bounty, percent, idx }: { bounty: Bounty; percent: number; idx: number }) {
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
  const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length]

  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl shadow-md transition-all duration-500
      ${unlocked ? `bg-gradient-to-r ${gradient} ${animating ? 'bounty-unlock' : ''}` : 'bg-white/60 border-2 border-gray-200'}`}
    >
      <span className={`text-5xl flex-shrink-0 ${animating ? 'bounce-in' : ''}`}>{bounty.icon}</span>
      <div className="flex flex-col flex-1 gap-2">
        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${unlocked ? 'text-white' : 'text-gray-600'}`}>{bounty.name}</span>
          <span className={`text-sm font-black px-3 py-1 rounded-full ${unlocked ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {unlocked ? '🔓 YES!' : `${bounty.threshold}%`}
          </span>
        </div>
        <div className={`h-3 rounded-full overflow-hidden ${unlocked ? 'bg-white/30' : 'bg-gray-200'}`}>
          <div className={`h-full rounded-full transition-all duration-1000 ${unlocked ? 'bg-white' : 'bg-gradient-to-r from-violet-400 to-pink-400'}`}
            style={{ width: `${progress}%` }} />
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
        <div className="text-center text-gray-400 py-8 text-sm bg-white/50 rounded-2xl">
          No bounties yet — tap ⚙️ to add some!
        </div>
      )}
    </div>
  )
}
