'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useKidTracker, useCoins, checkMysteryBox, claimMysteryBox } from '@/hooks/useSupabase'
import { getDogTier } from '@/lib/dogTiers'
import type { Activity, DogState } from '@/types/database'
import confetti from 'canvas-confetti'

const REACTIONS = ['🎉','🚀','⭐','🔥','💥','🌟','🏆','👊','💪','🎯']
const FUN_MESSAGES = ['AWESOME!!','CRUSHING IT!','SUPERSTAR!','BOOM!','LEGENDARY!','EPIC WIN!','YOU ROCK!','NAILED IT!','UNSTOPPABLE!','CHAMPION!']
const LUCKY_MESSAGES = ['LUCKY COIN!! 🍀','JACKPOT!! 🍀','BONUS!! 🍀','SHIZU SAYS LUCKY!! 🍀']

const CARD_COLORS = ['#FFD60A','#FF6B6B','#4ECDC4','#FF9F1C','#A8DADC','#FFBF69','#CBF3F0','#FF6392','#B7E4C7','#FFC6FF']

const DOG_TOUCH_SPEECHES = [
  'WOOF!! 🐾',
  'ARF ARF!! 🎉',
  '*lick lick lick* 😛',
  'SQUIRREL!! 🐿️',
  'PLAY TIME! 🎮',
  'PET ME MORE! 🥺',
  'I LOVE YOU! ❤️',
  'BORK BORK BORK! 🔊',
  'TREAT? TREAT? 🦴',
  "YOU'RE THE BEST! ⭐",
  'WANNA GO WALKIES? 🌳',
  'MISSION: BELLY RUBS! 🎯',
]
const DOG_TOUCH_ANIMS = ['wag', 'spin', 'lick', 'bark', 'pant'] as const
type DogAnim = 'idle' | 'wag' | 'spin' | 'lick' | 'bark' | 'pant' | 'launch'

// ── Audio ─────────────────────────────────────────────────────────────────────
function playSound(type: 'coin' | 'lucky' | 'bark' | 'spin' | 'diamond') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const t = ctx.currentTime

    if (type === 'coin') {
      ;[523, 659].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.value = freq; o.type = 'sine'
        g.gain.setValueAtTime(0.12, t + i * 0.1)
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.25)
        o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.25)
      })
    } else if (type === 'lucky') {
      ;[523, 659, 784, 1046].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.value = freq
        g.gain.setValueAtTime(0.1, t + i * 0.09)
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.2)
        o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.2)
      })
    } else if (type === 'bark') {
      ;[0, 0.19].forEach(delay => {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sawtooth'
        o.frequency.setValueAtTime(175, t + delay)
        o.frequency.exponentialRampToValueAtTime(75, t + delay + 0.13)
        g.gain.setValueAtTime(0.18, t + delay)
        g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.13)
        o.start(t + delay); o.stop(t + delay + 0.13)
      })
    } else if (type === 'spin') {
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.setValueAtTime(200, t)
      o.frequency.exponentialRampToValueAtTime(700, t + 0.45)
      g.gain.setValueAtTime(0.08, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
      o.start(); o.stop(t + 0.45)
    } else if (type === 'diamond') {
      ;[784, 988, 1319, 1568].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.value = freq; o.type = 'sine'
        g.gain.setValueAtTime(0.09, t + i * 0.07)
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.3)
        o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.3)
      })
    }
    setTimeout(() => ctx.close().catch(() => {}), 3000)
  } catch { /* silent fail */ }
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function fireConfetti() {
  confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, colors: ['#ff0000','#ffff00','#00ff00','#0000ff','#ff00ff'] })
  setTimeout(() => confetti({ particleCount: 60, spread: 130, origin: { y: 0.5 }, startVelocity: 45 }), 200)
}
function fireMegaConfetti() {
  confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, colors: ['#FFD60A','#FF6B6B','#4ECDC4','#A855F7','#22c55e'] })
  setTimeout(() => confetti({ particleCount: 150, angle: 60,  spread: 80, origin: { x: 0, y: 0.6 } }), 200)
  setTimeout(() => confetti({ particleCount: 150, angle: 120, spread: 80, origin: { x: 1, y: 0.6 } }), 400)
}

// ── Floating reaction overlay ─────────────────────────────────────────────────
function FloatingReaction({ text, emoji, coins }: { text: string; emoji: string; coins: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 rounded-3xl"
      style={{ background: 'rgba(255,255,255,0.88)' }}>
      <div className="bounce-in text-7xl mb-2">{emoji}</div>
      <div className="bounce-in text-3xl font-black text-center px-4 drop-shadow" style={{ color: '#7c3aed', animationDelay: '0.1s' }}>{text}</div>
      <div className="bounce-in flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full bg-amber-50 border-2 border-amber-300 shadow"
        style={{ animationDelay: '0.18s' }}>
        <span className="text-2xl">🪙</span>
        <span className="text-2xl font-black text-amber-700">+{coins}</span>
        <span className="text-sm font-bold text-amber-600">coins!</span>
      </div>
    </div>
  )
}

// ── Mystery box overlay ───────────────────────────────────────────────────────
type BoxPhase = 'ready' | 'opening' | 'revealed'

function MysteryBoxOverlay({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<BoxPhase>('ready')
  const [coins, setCoins] = useState(0)
  const claimed = useRef(false)

  const handleTap = async () => {
    if (phase !== 'ready' || claimed.current) return
    claimed.current = true
    setPhase('opening')
    const amount = await claimMysteryBox()
    setCoins(amount)
    setTimeout(() => {
      setPhase('revealed')
      fireMegaConfetti()
    }, 700)
  }

  const message = coins >= 7 ? 'JACKPOT!! 🎉🎉' : coins >= 4 ? 'Nice find! 🐾' : 'Good boy! 🐶'

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.82)' }}>

      {phase === 'ready' && (
        <>
          <div className="bounce-in text-2xl font-black text-white mb-2 text-center">
            🐕 Shizu dug something up!
          </div>
          <div className="text-base text-white/70 font-semibold mb-8 text-center">
            Weekly mystery box — tap to open!
          </div>
          <button onClick={handleTap}
            className="bounce-in text-[120px] leading-none select-none active:scale-90 transition-transform">
            🎁
          </button>
          <div className="mt-6 text-xl font-black text-yellow-300 wiggle">TAP TO OPEN!</div>
        </>
      )}

      {phase === 'opening' && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-[120px] leading-none dog-spin select-none">📦</div>
          <div className="text-xl font-black text-white">Opening...</div>
        </div>
      )}

      {phase === 'revealed' && (
        <div className="flex flex-col items-center gap-4">
          <div className="bounce-in text-[100px] leading-none select-none">🪙</div>
          <div className="bounce-in text-6xl font-black text-yellow-300 text-center"
            style={{ animationDelay: '0.1s' }}>
            +{coins} COINS!
          </div>
          <div className="bounce-in text-2xl font-black text-white text-center"
            style={{ animationDelay: '0.2s' }}>
            {message}
          </div>
          <button onClick={onClose}
            className="mt-4 px-10 py-4 rounded-2xl font-black text-xl text-black border-2 border-yellow-600 bounce-in"
            style={{ background: '#FFD60A', animationDelay: '0.3s' }}>
            AWESOME! 🚀
          </button>
        </div>
      )}
    </div>
  )
}

// ── Dog strip (compact, lives at top of missions page) ────────────────────────
function DogStrip({
  totalCoins,
  diamonds,
  dogState,
  onGiveDiamond,
}: {
  totalCoins: number
  diamonds: number
  dogState: DogState | null
  onGiveDiamond: () => void
}) {
  const [dogAnim, setDogAnim]   = useState<DogAnim>('idle')
  const [speech, setSpeech]     = useState<string | null>(null)
  const animTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tier = getDogTier(totalCoins)

  useEffect(() => () => {
    if (animTimer.current)  clearTimeout(animTimer.current)
    if (speechTimer.current) clearTimeout(speechTimer.current)
  }, [])

  const handleDogTap = useCallback(() => {
    const anim = DOG_TOUCH_ANIMS[Math.floor(Math.random() * DOG_TOUCH_ANIMS.length)]
    const msg  = DOG_TOUCH_SPEECHES[Math.floor(Math.random() * DOG_TOUCH_SPEECHES.length)]

    // Pick sound
    if (anim === 'bark')       playSound('bark')
    else if (anim === 'spin')  playSound('spin')
    else if (anim === 'lick')  playSound('bark')
    else                       playSound('bark')

    // Animate
    if (animTimer.current) clearTimeout(animTimer.current)
    setDogAnim(anim)
    const dur = anim === 'spin' ? 700 : anim === 'lick' ? 800 : 600
    animTimer.current = setTimeout(() => setDogAnim('idle'), dur)

    // Speech
    if (speechTimer.current) clearTimeout(speechTimer.current)
    setSpeech(msg)
    speechTimer.current = setTimeout(() => setSpeech(null), 2200)
  }, [])

  const dogClass = dogAnim === 'idle'  ? 'dog-idle'
                 : dogAnim === 'wag'   ? 'dog-wag'
                 : dogAnim === 'spin'  ? 'dog-spin'
                 : dogAnim === 'lick'  ? 'dog-lick'
                 : dogAnim === 'bark'  ? 'dog-bark'
                 : dogAnim === 'pant'  ? 'dog-pant'
                 : dogAnim === 'launch'? 'dog-launch'
                 : ''

  const defaultSpeech = tier.desc

  return (
    <div className="flex-shrink-0 flex items-center gap-2 rounded-2xl px-3 py-2 shadow border-2"
      style={{ background: tier.bg, borderColor: `${tier.textColor}33` }}>

      {/* Tappable dog */}
      <button
        onPointerDown={handleDogTap}
        className="flex flex-col items-center justify-center flex-shrink-0 w-16 select-none active:scale-90 transition-transform">
        <span className={`text-5xl leading-none ${dogClass}`}>🐕</span>
        <span className="text-2xl -mt-1">{tier.helmet}</span>
      </button>

      {/* Speech bubble */}
      <div className="flex-1 min-w-0 bg-white/70 rounded-xl px-3 py-1.5 border border-white/80 shadow-sm">
        <p className="text-xs font-bold leading-snug" style={{ color: tier.textColor }}>
          {speech ?? defaultSpeech}
        </p>
        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">tap Shizu!</p>
      </div>

      {/* Coins */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1 px-2">
        <div className="flex items-center gap-1">
          <span className="text-lg">🪙</span>
          <span className="text-base font-black text-amber-800">{totalCoins}</span>
        </div>

        {/* Diamonds */}
        <div className="flex items-center gap-1">
          <span className="text-lg">💎</span>
          <span className="text-base font-black text-cyan-700">{diamonds}</span>
          <button
            onClick={onGiveDiamond}
            className="ml-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-cyan-700 bg-cyan-100 border border-cyan-300 diamond-pulse select-none">
            +
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Task cards ────────────────────────────────────────────────────────────────
function TaskCard({ activity, index, onTap }: { activity: Activity; index: number; onTap: () => void }) {
  const [pressing, setPressing] = useState(false)
  const bg = CARD_COLORS[index % CARD_COLORS.length]

  return (
    <button
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => { setPressing(false); onTap() }}
      onPointerLeave={() => setPressing(false)}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl shadow-md transition-all duration-150 text-left border-2 border-black/10
        ${pressing ? 'scale-95 shadow-sm' : 'scale-100'}`}
      style={{ backgroundColor: bg }}
    >
      <div className="w-14 h-14 rounded-xl bg-black/10 flex items-center justify-center text-3xl flex-shrink-0">
        {activity.icon}
      </div>
      <span className="text-xl font-black text-black flex-1 leading-tight">{activity.name}</span>
      <div className="w-14 h-14 rounded-full bg-white border-4 border-green-500 flex items-center justify-center flex-shrink-0 shadow">
        <span className="text-green-500 text-2xl font-black">○</span>
      </div>
    </button>
  )
}

function CompletedCard({ activity, onTap }: { activity: Activity; onTap: () => void }) {
  const [pressing, setPressing] = useState(false)
  return (
    <button
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => { setPressing(false); onTap() }}
      onPointerLeave={() => setPressing(false)}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl border-2 border-green-300 bg-green-50 shadow-sm transition-all duration-150 text-left
        ${pressing ? 'scale-95' : 'scale-100'}`}
    >
      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">
        {activity.icon}
      </div>
      <span className="text-lg font-bold text-green-700 line-through flex-1">{activity.name}</span>
      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow">
        <span className="text-white text-2xl font-black">✓</span>
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function KidTracker({ onGiveDiamond }: { onGiveDiamond: () => void }) {
  const { activities, tasks, loading, completedCount, totalCount, percent, streak, completeTask, uncompleteTask } = useKidTracker()
  const { totalCoins, diamonds, dogState } = useCoins()

  const [reaction, setReaction]             = useState<{ text: string; emoji: string; coins: number } | null>(null)
  const [showCoin, setShowCoin]             = useState<'normal' | 'lucky' | null>(null)
  const [showDiamond, setShowDiamond]       = useState(false)
  const [showMysteryBox, setShowMysteryBox] = useState(false)

  const reactionTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const coinTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const diamondTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mysteryTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPercent    = useRef(percent)
  const mysteryChecked = useRef(false)
  const prevDiamonds   = useRef(diamonds)

  // Detect diamond given
  useEffect(() => {
    if (diamonds > prevDiamonds.current) {
      setShowDiamond(true)
      playSound('diamond')
      if (diamondTimer.current) clearTimeout(diamondTimer.current)
      diamondTimer.current = setTimeout(() => setShowDiamond(false), 1400)
    }
    prevDiamonds.current = diamonds
  }, [diamonds])

  const showReaction = useCallback((lucky: boolean, coinAmount: number) => {
    if (lucky) {
      const text = LUCKY_MESSAGES[Math.floor(Math.random() * LUCKY_MESSAGES.length)]
      setReaction({ text, emoji: '🍀', coins: coinAmount })
      playSound('lucky')
    } else {
      const emoji = REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
      const text  = FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]
      setReaction({ text, emoji, coins: coinAmount })
      playSound('coin')
    }
    fireConfetti()
    if (reactionTimer.current) clearTimeout(reactionTimer.current)
    reactionTimer.current = setTimeout(() => setReaction(null), 2000)

    setShowCoin(lucky ? 'lucky' : 'normal')
    if (coinTimer.current) clearTimeout(coinTimer.current)
    coinTimer.current = setTimeout(() => setShowCoin(null), 1000)
  }, [])

  // Detect 100% transition → mystery box check
  useEffect(() => {
    if (percent === 100 && prevPercent.current < 100 && !mysteryChecked.current) {
      mysteryChecked.current = true
      if (mysteryTimer.current) clearTimeout(mysteryTimer.current)
      mysteryTimer.current = setTimeout(async () => {
        const available = await checkMysteryBox()
        if (available) setShowMysteryBox(true)
      }, 2200)
    }
    if (percent < 100) mysteryChecked.current = false
    prevPercent.current = percent
  }, [percent])

  useEffect(() => () => {
    if (reactionTimer.current)  clearTimeout(reactionTimer.current)
    if (coinTimer.current)      clearTimeout(coinTimer.current)
    if (diamondTimer.current)   clearTimeout(diamondTimer.current)
    if (mysteryTimer.current)   clearTimeout(mysteryTimer.current)
  }, [])

  const pendingActivities   = activities.filter(a => !tasks.find(t => t.activity_id === a.id)?.completed)
  const completedActivities = activities.filter(a =>  tasks.find(t => t.activity_id === a.id)?.completed)

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-6xl animate-bounce">⭐</div>
    </div>
  )

  return (
    <div className="flex flex-col h-full gap-2 relative">

      {/* Floating reaction */}
      {reaction && <FloatingReaction text={reaction.text} emoji={reaction.emoji} coins={reaction.coins} />}

      {/* Coin float-up */}
      {showCoin && (
        <div className="absolute top-20 right-4 z-20 pointer-events-none float-up font-black select-none"
          style={{
            fontSize: showCoin === 'lucky' ? '1.4rem' : '1.2rem',
            color: showCoin === 'lucky' ? '#15803d' : '#b45309',
            textShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}>
          {showCoin === 'lucky' ? '🍀 +3!' : '+🪙2'}
        </div>
      )}

      {/* Diamond float-up */}
      {showDiamond && (
        <div className="absolute top-20 left-4 z-20 pointer-events-none diamond-given font-black select-none text-2xl"
          style={{ color: '#0891b2', textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
          💎 +1!
        </div>
      )}

      {showMysteryBox && <MysteryBoxOverlay onClose={() => setShowMysteryBox(false)} />}

      {/* Dog strip */}
      <DogStrip
        totalCoins={totalCoins}
        diamonds={diamonds}
        dogState={dogState}
        onGiveDiamond={onGiveDiamond}
      />

      {/* Progress bar + streak */}
      <div className="flex-shrink-0 flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow border-2 border-gray-100">
        <span className="text-xl">🚀</span>
        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <div className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{
              width: `${percent}%`,
              background: percent === 100 ? '#22c55e' : 'linear-gradient(90deg,#f59e0b,#ef4444,#8b5cf6)',
            }}>
            <div className="absolute inset-0 shimmer" />
          </div>
        </div>
        <span className="text-base font-black text-gray-800 whitespace-nowrap">{completedCount}/{totalCount} ⭐</span>
        {streak > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-orange-100 border-2 border-orange-300 flex-shrink-0">
            <span className="text-base">🔥</span>
            <span className="text-sm font-black text-orange-700">{streak}</span>
          </div>
        )}
      </div>

      {/* All done banner */}
      {pendingActivities.length === 0 && completedActivities.length > 0 && (
        <div className="flex-shrink-0 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-lg border-2 border-green-300"
          style={{ backgroundColor: '#D1FAE5' }}>
          <span className="text-4xl bounce-in">🏆</span>
          <div>
            <div className="text-xl font-black text-green-800">ALL DONE!</div>
            <div className="text-green-700 text-sm font-semibold">You&apos;re absolutely amazing today!</div>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 min-h-0 overflow-y-auto panel-scroll flex flex-col gap-2.5 pb-2">
        {pendingActivities.map((a, i) => (
          <TaskCard key={a.id} activity={a} index={i} onTap={async () => {
            const { lucky } = await completeTask(a.id)
            showReaction(lucky, lucky ? 3 : 2)
          }} />
        ))}
        {completedActivities.length > 0 && (
          <>
            <div className="text-xs font-black uppercase tracking-widest text-gray-400 px-1 mt-1">Completed — tap to undo</div>
            {completedActivities.map(a => (
              <CompletedCard key={a.id} activity={a} onTap={() => uncompleteTask(a.id)} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
