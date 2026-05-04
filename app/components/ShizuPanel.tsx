'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useCoins } from '@/hooks/useSupabase'
import { getDogTier, getNextTier } from '@/lib/dogTiers'
import { SPACE_SECRETS, SECRET_MILESTONES } from '@/lib/spaceSecrets'

type DogAnim = 'idle' | 'wag' | 'spin' | 'launch'

const DOG_ACTIONS = [
  { id: 'dog_treat'  as const, emoji: '🦴', label: 'Treat',    cost: 5,  speech: 'YUM! 🍖 So tasty!!' },
  { id: 'dog_haircut'as const, emoji: '✂️', label: 'Haircut',  cost: 15, speech: '✨ Looking SO fresh!' },
  { id: 'dog_bath'   as const, emoji: '🚀', label: 'Space Ride',cost: 30, speech: '🚀 BLAST OFF!!' },
]

export default function ShizuPanel() {
  const { totalCoins, dogState, loading, spendCoins, markSecretSeen } = useCoins()
  const [dogAnim, setDogAnim]     = useState<DogAnim>('idle')
  const [speech, setSpeech]       = useState<string | null>(null)
  const [showCoinPop, setShowCoinPop] = useState(false)
  const prevCoins = useRef(totalCoins)
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tier     = getDogTier(totalCoins)
  const nextTier = getNextTier(totalCoins)
  const seenSet  = new Set(dogState?.secrets_seen ?? [])

  // Which secrets are unlocked (coins threshold met)
  const unlockedIndexes = SPACE_SECRETS.map((_, i) => i).filter(i => totalCoins >= SECRET_MILESTONES[i])
  const hasNewSecret = unlockedIndexes.some(i => !seenSet.has(i))

  // Coin pop animation when balance increases
  useEffect(() => {
    if (totalCoins > prevCoins.current) {
      setShowCoinPop(true)
      setTimeout(() => setShowCoinPop(false), 500)
    }
    prevCoins.current = totalCoins
  }, [totalCoins])

  // Default speech: new secret hint, or tier description
  const defaultSpeech = hasNewSecret
    ? '🌟 I discovered something! Check below!'
    : tier.desc

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
      // Reveal next unseen unlocked secret
      const nextUnseen = unlockedIndexes.find(i => !seenSet.has(i))
      if (nextUnseen !== undefined) {
        setTimeout(() => {
          markSecretSeen(nextUnseen)
          say(`🔭 WOOF! "${SPACE_SECRETS[nextUnseen].fact}"`, 4000)
        }, 900)
      } else if (unlockedIndexes.length > 0) {
        setTimeout(() => say('🌌 I already know ALL the secrets of the cosmos!'), 900)
      } else {
        setTimeout(() => say('🌍 Earn more coins to unlock space secrets!'), 900)
      }
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

      {/* ── Space secrets ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="text-sm font-black text-gray-700 uppercase tracking-wider">🔭 Space Secrets</div>
          <div className="text-xs font-bold text-gray-400">{unlockedIndexes.length}/{SPACE_SECRETS.length} discovered</div>
        </div>

        {unlockedIndexes.length === 0 && (
          <div className="text-center py-6 rounded-2xl bg-white border-2 border-dashed border-gray-200 text-sm text-gray-400 font-semibold">
            Earn {SECRET_MILESTONES[0]} coins to discover your first space secret! 🌌
          </div>
        )}

        {/* Unlocked secrets (newest first) */}
        {[...unlockedIndexes].reverse().map(i => {
          const secret = SPACE_SECRETS[i]
          const isNew = !seenSet.has(i)
          return (
            <button key={i} onClick={() => markSecretSeen(i)}
              className={`flex items-start gap-3 px-4 py-3 rounded-2xl text-left border-2 shadow-sm transition-all
                ${isNew ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-100'}`}>
              <span className="text-3xl flex-shrink-0">{secret.emoji}</span>
              <div className="flex-1">
                {isNew && (
                  <div className="new-badge inline-block text-xs font-black text-yellow-700 bg-yellow-200 px-2 py-0.5 rounded-full mb-1">
                    NEW! ✨
                  </div>
                )}
                <p className={`text-sm font-bold leading-snug ${isNew ? 'text-gray-900' : 'text-gray-600'}`}>
                  {secret.fact}
                </p>
              </div>
            </button>
          )
        })}

        {/* Next secret teaser */}
        {unlockedIndexes.length < SPACE_SECRETS.length && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
            <span className="text-2xl opacity-30">🔒</span>
            <p className="text-sm font-bold text-gray-400">
              {SECRET_MILESTONES[unlockedIndexes.length] - totalCoins} more coins to next discovery…
            </p>
          </div>
        )}

        {unlockedIndexes.length === SPACE_SECRETS.length && (
          <div className="text-center py-3 rounded-2xl bg-yellow-50 border-2 border-yellow-300">
            <p className="text-sm font-black text-yellow-700">🏆 Shizu knows ALL the secrets of the cosmos!</p>
          </div>
        )}
      </div>
    </div>
  )
}
