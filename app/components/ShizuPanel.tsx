'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useCoins } from '@/hooks/useSupabase'
import { getDogTier, getNextTier } from '@/lib/dogTiers'

type DogAnim = 'idle' | 'wag' | 'spin' | 'launch'

const DOG_ACTIONS = [
  { id: 'dog_treat'  as const, emoji: '🦴', label: 'Treat',    cost: 5,  speech: 'YUM! 🍖 So tasty!!' },
  { id: 'dog_haircut'as const, emoji: '✂️', label: 'Haircut',  cost: 15, speech: '✨ Looking SO fresh!' },
  { id: 'dog_bath'   as const, emoji: '🚀', label: 'Space Ride',cost: 30, speech: '🚀 BLAST OFF!!' },
]

export default function ShizuPanel() {
  const { totalCoins, dogState, loading, spendCoins } = useCoins()
  const [dogAnim, setDogAnim]     = useState<DogAnim>('idle')
  const [speech, setSpeech]       = useState<string | null>(null)
  const [showCoinPop, setShowCoinPop] = useState(false)
  const prevCoins = useRef(totalCoins)
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tier     = getDogTier(totalCoins)
  const nextTier = getNextTier(totalCoins)
  // Coin pop animation when balance increases
  useEffect(() => {
    if (totalCoins > prevCoins.current) {
      setShowCoinPop(true)
      setTimeout(() => setShowCoinPop(false), 500)
    }
    prevCoins.current = totalCoins
  }, [totalCoins])

  const defaultSpeech = tier.desc

  const say = useCallback((msg: string, durationMs = 2500) => {
    if (speechTimer.current) clearTimeout(speechTimer.current)
    setSpeech(msg)
    speechTimer.current = setTimeout(() => setSpeech(null), durationMs)
  }, [])

  const animate = useCallback((anim: DogAnim, durationMs = 800) => {
    if (animTimer.current) clearTimeout(animTimer.current)
    setDogAnim(anim)
    animTimer.current = setTimeout(() => setDogAnim('idle'), durationMs)
  }, [])

  useEffect(() => () => {
    if (speechTimer.current) clearTimeout(speechTimer.current)
    if (animTimer.current)   clearTimeout(animTimer.current)
  }, [])

  const handleAction = async (action: typeof DOG_ACTIONS[number]) => {
    const ok = await spendCoins(action.cost, action.id)
    if (!ok) { say("Not enough coins! 😅 Keep completing missions!"); return }

    if (action.id === 'dog_treat') {
      animate('wag', 800)
      say(action.speech)
    } else if (action.id === 'dog_haircut') {
      animate('spin', 700)
      say(action.speech)
    } else if (action.id === 'dog_bath') {
      animate('launch', 1600)
      setTimeout(() => say('🚀 To infinity and beyond!!', 2500), 900)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="text-5xl dog-idle">🐕</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">

      {/* ── Coin counter ── */}
      <div className="flex items-center justify-between px-5 py-3 rounded-2xl border-2 border-yellow-400 shadow-md"
        style={{ background: '#FFD60A' }}>
        <div className="flex items-center gap-2">
          <span className={`text-3xl ${showCoinPop ? 'coin-pop' : ''}`}>🪙</span>
          <span className="text-3xl font-black text-black">{totalCoins}</span>
          <span className="text-sm font-black text-black/60 uppercase tracking-wider">coins</span>
        </div>
        {nextTier && (
          <div className="text-right">
            <div className="text-xs font-bold text-black/60">Next rank</div>
            <div className="text-sm font-black text-black">{nextTier.helmet} {nextTier.rank}</div>
            <div className="text-xs font-bold text-black/60">{nextTier.minCoins - totalCoins} coins away</div>
          </div>
        )}
        {!nextTier && (
          <div className="text-sm font-black text-black">🏆 MAX RANK!</div>
        )}
      </div>

      {/* ── Dog display ── */}
      <div className="relative flex flex-col items-center py-6 rounded-3xl border-2 shadow-lg overflow-hidden"
        style={{ background: tier.bg, borderColor: `${tier.textColor}33` }}>

        {/* Rank badge */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-black border-2"
          style={{ background: `${tier.textColor}22`, color: tier.textColor, borderColor: `${tier.textColor}44` }}>
          {tier.rank}
        </div>

        {/* Dog emoji stack */}
        <div className={`text-8xl leading-none mb-1 select-none
          ${dogAnim === 'idle'   ? 'dog-idle'   : ''}
          ${dogAnim === 'wag'    ? 'dog-wag'    : ''}
          ${dogAnim === 'spin'   ? 'dog-spin'   : ''}
          ${dogAnim === 'launch' ? 'dog-launch' : ''}
        `}>
          🐕
        </div>
        <div className="text-4xl -mt-2 select-none">{tier.helmet}</div>

        {/* Speech bubble */}
        <div className="mt-4 mx-4 px-4 py-2 rounded-2xl bg-white/80 border-2 border-white shadow-sm min-h-[48px] flex items-center justify-center">
          <p className="text-sm font-bold text-center" style={{ color: tier.textColor }}>
            {speech ?? defaultSpeech}
          </p>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="grid grid-cols-3 gap-2">
        {DOG_ACTIONS.map(action => {
          const canAfford = totalCoins >= action.cost
          return (
            <button key={action.id} onClick={() => handleAction(action)}
              disabled={!canAfford}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 font-black transition-all
                ${canAfford
                  ? 'bg-white border-gray-200 hover:border-gray-400 active:scale-95 shadow-sm'
                  : 'bg-gray-50 border-gray-100 opacity-50'}`}>
              <span className="text-3xl">{action.emoji}</span>
              <span className="text-xs text-gray-700">{action.label}</span>
              <div className="flex items-center gap-1">
                <span className="text-sm">🪙</span>
                <span className="text-xs font-black" style={{ color: canAfford ? '#b45309' : '#9ca3af' }}>
                  {action.cost}
                </span>
              </div>
            </button>
          )
        })}
      </div>

    </div>
  )
}
