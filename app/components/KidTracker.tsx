'use client'
import { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react'
import { useKidTracker, checkMysteryBox, claimMysteryBox } from '@/hooks/useSupabase'
import { getDogTier, getNextTier } from '@/lib/dogTiers'
import { SPACE_SECRETS, SECRET_MILESTONES } from '@/lib/spaceSecrets'
import type { Activity, DogState } from '@/types/database'
import confetti from 'canvas-confetti'

// ── Constants ─────────────────────────────────────────────────────────────────
const REACTIONS     = ['🎉','🚀','⭐','🔥','💥','🌟','🏆','👊','💪','🎯']
const FUN_MESSAGES  = ['AWESOME!!','CRUSHING IT!','SUPERSTAR!','BOOM!','LEGENDARY!','EPIC WIN!','YOU ROCK!','NAILED IT!','UNSTOPPABLE!','CHAMPION!']
const LUCKY_MSGS    = ['LUCKY COIN!! 🍀','JACKPOT!! 🍀','BONUS ROUND!! 🍀','SHIZU SAYS LUCKY!! 🍀']
const CARD_COLORS   = ['#FFD60A','#FF6B6B','#4ECDC4','#FF9F1C','#A8DADC','#FFBF69','#CBF3F0','#FF6392','#B7E4C7','#FFC6FF']

// Shizu reacts to specific task icons
const TASK_REACTIONS: Record<string, { text: string; emoji: string }> = {
  '🪥': { text: "Fresh breath! *sniff sniff* 😤",       emoji: '🦷' },
  '📚': { text: "SMART HUMAN! I love you! 🐶",           emoji: '🧠' },
  '📖': { text: "Story time! Tell me about space! 🚀",   emoji: '📚' },
  '🛏️': { text: "Nice tidy bed! Can I sleep there?! 🥺", emoji: '🛏️' },
  '🥞': { text: "PANCAKES?! Where's MINE?! 🥺",          emoji: '🍽️' },
  '👕': { text: "Looking SO fresh! 💅 *approves*",        emoji: '✨' },
  '🏃': { text: "RUUUN!! Let's go!! WOOF WOOF!! 🐾",     emoji: '🏃' },
  '🎨': { text: "Draw me! DRAW ME! 🎨 Please?!",         emoji: '🖌️' },
  '🧹': { text: "Clean house = happy Shizu!! 🏠✨",       emoji: '✨' },
  '🚿': { text: "Shower time! (I still hate baths) 😅",  emoji: '🚿' },
  '😴': { text: "Sleep tight! I'll guard the house! 🌙",  emoji: '🌙' },
  '🥗': { text: "Eat your greens! Sneak me some! 🥬",    emoji: '🥬' },
  '💊': { text: "Medicine time! You're so brave! 💪",     emoji: '💊' },
  '🎵': { text: "MUSIC!! *howls along* AWOOOO! 🐺",      emoji: '🎵' },
  '🌳': { text: "OUTSIDE?! OUTSIDE OUTSIDE!! 🌳🐾",       emoji: '🌿' },
  '🐶': { text: "You played with ME?! BEST. DAY. EVER!! ❤️", emoji: '❤️' },
  '🧘': { text: "Zen mode… *sits very calmly* 🧘☮️",     emoji: '☮️' },
  '🎮': { text: "Game time! Don't forget my treats! 🦴", emoji: '🕹️' },
  '🛁': { text: "Bath time! (unlike me, you enjoy it!) 🛁", emoji: '🛁' },
}

const DOG_ACTIONS = [
  { anim: 'bark',  speech: 'WOOF WOOF!!',            emoji: '🗣️' },
  { anim: 'bark',  speech: 'ARF ARF!! 🎉',            emoji: '🐾' },
  { anim: 'lick',  speech: '*lick lick lick!*',       emoji: '😛' },
  { anim: 'lick',  speech: 'Mmm you taste great!',    emoji: '😋' },
  { anim: 'wag',   speech: 'SO HAPPY RIGHT NOW!! 🐾', emoji: '🥳' },
  { anim: 'wag',   speech: 'PET ME PET ME! 🥺',       emoji: '❤️' },
  { anim: 'spin',  speech: '*spinning with joy!*',    emoji: '🌀' },
  { anim: 'pant',  speech: 'SQUIRREL!! 🐿️',          emoji: '👀' },
  { anim: 'pant',  speech: 'TREAT? TREAT? 🦴',        emoji: '🍖' },
  { anim: 'bark',  speech: "YOU'RE THE BEST! ⭐",     emoji: '⭐' },
  { anim: 'wag',   speech: 'WANNA GO WALKIES? 🌳',    emoji: '🦮' },
  { anim: 'bark',  speech: 'MISSION: BELLY RUBS! 🎯', emoji: '🎯' },
] as const
type DogAnim = 'idle' | 'wag' | 'spin' | 'lick' | 'bark' | 'pant' | 'launch'

const COMBO_THRESHOLD_1 = 3   // +1 bonus coin
const COMBO_THRESHOLD_2 = 6   // +2 bonus coins
const COMBO_RESET_MS    = 8 * 60 * 1000

// ── Audio ─────────────────────────────────────────────────────────────────────
async function playSound(type: 'coin' | 'lucky' | 'bark' | 'spin' | 'diamond') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx() as AudioContext
    if (ctx.state === 'suspended') await ctx.resume()
    const t = ctx.currentTime
    if (type === 'coin') {
      for (const [i, f] of ([523, 784] as const).entries()) {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination); o.frequency.value = f
        g.gain.setValueAtTime(0.18, t + i * 0.12)
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.3)
        o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.3)
      }
    } else if (type === 'lucky') {
      for (const [i, f] of ([523, 659, 784, 1047] as const).entries()) {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination); o.frequency.value = f
        g.gain.setValueAtTime(0.15, t + i * 0.09)
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.22)
        o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.22)
      }
    } else if (type === 'bark') {
      for (const delay of [0, 0.2]) {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination); o.type = 'sawtooth'
        o.frequency.setValueAtTime(190, t + delay)
        o.frequency.exponentialRampToValueAtTime(80, t + delay + 0.14)
        g.gain.setValueAtTime(0.22, t + delay)
        g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.14)
        o.start(t + delay); o.stop(t + delay + 0.14)
      }
    } else if (type === 'spin') {
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(880, t + 0.5)
      g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
      o.start(); o.stop(t + 0.5)
    } else if (type === 'diamond') {
      for (const [i, f] of ([784, 988, 1319, 1760] as const).entries()) {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination); o.frequency.value = f
        g.gain.setValueAtTime(0.13, t + i * 0.08)
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.3)
        o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.3)
      }
    }
    setTimeout(() => ctx.close().catch(() => {}), 3000)
  } catch { /* silent fail */ }
}

function fireConfetti() {
  confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, colors: ['#ff0000','#ffff00','#00ff00','#0000ff','#ff00ff'] })
  setTimeout(() => confetti({ particleCount: 60, spread: 130, origin: { y: 0.5 }, startVelocity: 45 }), 200)
}
function fireMegaConfetti() {
  confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, colors: ['#FFD60A','#FF6B6B','#4ECDC4','#A855F7','#22c55e'] })
  setTimeout(() => confetti({ particleCount: 150, angle: 60,  spread: 80, origin: { x: 0, y: 0.6 } }), 200)
  setTimeout(() => confetti({ particleCount: 150, angle: 120, spread: 80, origin: { x: 1, y: 0.6 } }), 400)
}

// ── Sub-components ────────────────────────────────────────────────────────────
function FloatingReaction({ text, emoji, coins }: { text: string; emoji: string; coins: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 rounded-3xl"
      style={{ background: 'rgba(255,255,255,0.9)' }}>
      <div className="bounce-in text-7xl mb-2">{emoji}</div>
      <div className="bounce-in text-3xl font-black text-center px-4 drop-shadow"
        style={{ color: '#7c3aed', animationDelay: '0.1s' }}>{text}</div>
      <div className="bounce-in flex items-center gap-2 mt-3 px-5 py-2 rounded-full bg-amber-50 border-2 border-amber-300 shadow"
        style={{ animationDelay: '0.18s' }}>
        <span className="text-2xl">🪙</span>
        <span className="text-2xl font-black text-amber-700">+{coins} coins!</span>
      </div>
    </div>
  )
}

function DogSpeechBubble({ speech, speechEmoji }: { speech: string; speechEmoji: string }) {
  return (
    <div className="absolute inset-x-0 top-[70px] z-40 pointer-events-none flex justify-start px-3">
      <div className="bounce-in bg-white rounded-3xl px-5 py-3 shadow-2xl max-w-[78vw] relative"
        style={{ border: '3px solid #1f2937' }}>
        <div className="flex items-center gap-2">
          <span className="text-3xl">{speechEmoji}</span>
          <p className="text-xl font-black text-gray-900">{speech}</p>
        </div>
        <div className="absolute -bottom-[13px] left-5">
          <div className="w-0 h-0" style={{ borderLeft:'10px solid transparent', borderRight:'10px solid transparent', borderTop:'13px solid #1f2937' }} />
          <div className="absolute w-0 h-0" style={{ top:-14, left:-8, borderLeft:'8px solid transparent', borderRight:'8px solid transparent', borderTop:'12px solid white' }} />
        </div>
      </div>
    </div>
  )
}

function ComboBanner({ combo }: { combo: number }) {
  if (combo < COMBO_THRESHOLD_1) return null
  const super_ = combo >= COMBO_THRESHOLD_2
  return (
    <div className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl border-2 bounce-in
      ${super_ ? 'bg-purple-100 border-purple-300' : 'bg-orange-100 border-orange-300'}`}>
      <span className="text-xl">{super_ ? '⚡' : '🔥'}</span>
      <span className={`font-black text-sm flex-1 ${super_ ? 'text-purple-700' : 'text-orange-700'}`}>
        {super_ ? 'SUPER COMBO!!' : 'COMBO!'} Task #{combo} — +{super_ ? 2 : 1} bonus coin!
      </span>
      <span className="text-xs font-semibold text-gray-400">keep going!</span>
    </div>
  )
}

type BoxPhase = 'ready' | 'opening' | 'revealed'
function MysteryBoxOverlay({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<BoxPhase>('ready')
  const [coins, setCoins] = useState(0)
  const claimed = useRef(false)

  const handleTap = async () => {
    if (phase !== 'ready' || claimed.current) return
    claimed.current = true; setPhase('opening')
    const amount = await claimMysteryBox()
    setCoins(amount)
    setTimeout(() => { setPhase('revealed'); fireMegaConfetti() }, 700)
  }

  const message = coins >= 7 ? 'JACKPOT!! 🎉🎉' : coins >= 4 ? 'Nice find! 🐾' : 'Good boy! 🐶'

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.82)' }}>
      {phase === 'ready' && (<>
        <div className="bounce-in text-2xl font-black text-white mb-2 text-center">🐕 Shizu dug something up!</div>
        <div className="text-base text-white/70 font-semibold mb-8 text-center">Weekly mystery box — tap to open!</div>
        <button onClick={handleTap} className="bounce-in text-[120px] leading-none select-none active:scale-90 transition-transform">🎁</button>
        <div className="mt-6 text-xl font-black text-yellow-300 wiggle">TAP TO OPEN!</div>
      </>)}
      {phase === 'opening' && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-[120px] leading-none dog-spin select-none">📦</div>
          <div className="text-xl font-black text-white">Opening...</div>
        </div>
      )}
      {phase === 'revealed' && (
        <div className="flex flex-col items-center gap-4">
          <div className="bounce-in text-[100px] leading-none select-none">🪙</div>
          <div className="bounce-in text-6xl font-black text-yellow-300 text-center" style={{ animationDelay: '0.1s' }}>+{coins} COINS!</div>
          <div className="bounce-in text-2xl font-black text-white text-center" style={{ animationDelay: '0.2s' }}>{message}</div>
          <button onClick={onClose} className="mt-4 px-10 py-4 rounded-2xl font-black text-xl text-black border-2 border-yellow-600 bounce-in"
            style={{ background: '#FFD60A', animationDelay: '0.3s' }}>AWESOME! 🚀</button>
        </div>
      )}
    </div>
  )
}

// ── Dog strip with rank bar ───────────────────────────────────────────────────
function DogStrip({
  totalCoins, diamonds, onGiveDiamond, onDogAction,
}: {
  totalCoins: number; diamonds: number
  onGiveDiamond: () => void
  onDogAction: (speech: string, emoji: string) => void
}) {
  const [dogAnim, setDogAnim] = useState<DogAnim>('idle')
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (animTimer.current) clearTimeout(animTimer.current) }, [])

  const tier     = getDogTier(totalCoins)
  const nextTier = getNextTier(totalCoins)
  const rankPct  = nextTier
    ? Math.round(((totalCoins - tier.minCoins) / (nextTier.minCoins - tier.minCoins)) * 100)
    : 100

  const handleDogTap = useCallback(() => {
    const pick = DOG_ACTIONS[Math.floor(Math.random() * DOG_ACTIONS.length)]
    playSound(pick.anim === 'spin' ? 'spin' : 'bark')
    if (animTimer.current) clearTimeout(animTimer.current)
    setDogAnim(pick.anim as DogAnim)
    animTimer.current = setTimeout(() => setDogAnim('idle'),
      pick.anim === 'spin' ? 700 : pick.anim === 'lick' ? 800 : 600)
    onDogAction(pick.speech, pick.emoji)
  }, [onDogAction])

  const dogClass = dogAnim === 'idle' ? 'dog-idle' : dogAnim === 'wag' ? 'dog-wag'
    : dogAnim === 'spin' ? 'dog-spin' : dogAnim === 'lick' ? 'dog-lick'
    : dogAnim === 'bark' ? 'dog-bark' : dogAnim === 'pant' ? 'dog-pant' : 'dog-launch'

  return (
    <div className="flex-shrink-0 flex items-center gap-2 rounded-2xl px-3 py-2 shadow border-2"
      style={{ background: tier.bg, borderColor: `${tier.textColor}33` }}>

      {/* Dog tap zone */}
      <button onPointerDown={handleDogTap}
        className="flex flex-col items-center justify-center flex-shrink-0 w-14 select-none active:scale-90 transition-transform">
        <span className={`text-5xl leading-none ${dogClass}`}>🐕</span>
        <span className="text-2xl -mt-1">{tier.helmet}</span>
      </button>

      {/* Rank + progress bar (fills the middle space) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-black truncate" style={{ color: tier.textColor }}>{tier.rank}</p>
          {nextTier
            ? <p className="text-[10px] text-gray-500 flex-shrink-0 ml-1">{nextTier.minCoins - totalCoins}🪙 to next</p>
            : <p className="text-[10px] font-black text-yellow-600">MAX 🏆</p>}
        </div>
        <div className="h-2 rounded-full bg-black/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${rankPct}%`, background: tier.textColor }} />
        </div>
        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">tap Shizu! 🐾</p>
      </div>

      {/* Coin counter */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/60 border border-amber-200 flex-shrink-0">
        <span className="text-base">🪙</span>
        <span className="text-sm font-black text-amber-800">{totalCoins}</span>
      </div>

      {/* Diamond counter + give button */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/60 border border-cyan-200 flex-shrink-0">
        <span className="text-base">💎</span>
        <span className="text-sm font-black text-cyan-700">{diamonds}</span>
        <button onClick={onGiveDiamond}
          className="ml-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-cyan-700 bg-cyan-100 border border-cyan-400 diamond-pulse select-none">
          +
        </button>
      </div>
    </div>
  )
}

// ── Space secrets section ─────────────────────────────────────────────────────
function SecretsSection({
  totalCoins, dogState, markSecretSeen,
}: {
  totalCoins: number; dogState: DogState | null; markSecretSeen: (i: number) => void
}) {
  const seenSet = useMemo(() => new Set(dogState?.secrets_seen ?? []), [dogState])
  const unlocked = useMemo(
    () => SPACE_SECRETS.map((_, i) => i).filter(i => totalCoins >= SECRET_MILESTONES[i]),
    [totalCoins]
  )
  const hasNew = useMemo(() => unlocked.some(i => !seenSet.has(i)), [unlocked, seenSet])
  const [expanded, setExpanded] = useState(false)

  // Auto-expand when a new secret just appeared
  useEffect(() => { if (hasNew) setExpanded(true) }, [hasNew])

  if (unlocked.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <button onClick={() => setExpanded(e => !e)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 transition-all
          ${hasNew ? 'bg-yellow-50 border-yellow-300' : 'bg-indigo-50 border-indigo-200'}`}>
        <span className="text-lg">🔭</span>
        <span className={`flex-1 text-sm font-black text-left ${hasNew ? 'text-yellow-800' : 'text-indigo-800'}`}>
          Space Discoveries
        </span>
        {hasNew && (
          <span className="new-badge text-xs font-black text-yellow-700 bg-yellow-200 px-2 py-0.5 rounded-full">NEW ✨</span>
        )}
        <span className="text-xs font-bold text-gray-400">{unlocked.length}/{SPACE_SECRETS.length}</span>
        <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-2">
          {[...unlocked].reverse().map(i => {
            const secret = SPACE_SECRETS[i]
            const isNew  = !seenSet.has(i)
            return (
              <button key={i} onClick={() => markSecretSeen(i)}
                className={`flex items-start gap-3 px-4 py-3 rounded-2xl text-left border-2 shadow-sm transition-all
                  ${isNew ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-100'}`}>
                <span className="text-3xl flex-shrink-0">{secret.emoji}</span>
                <div className="flex-1">
                  {isNew && (
                    <div className="new-badge inline-block text-xs font-black text-yellow-700 bg-yellow-200 px-2 py-0.5 rounded-full mb-1">NEW! ✨</div>
                  )}
                  <p className={`text-sm font-bold leading-snug ${isNew ? 'text-gray-900' : 'text-gray-600'}`}>{secret.fact}</p>
                </div>
              </button>
            )
          })}

          {unlocked.length < SPACE_SECRETS.length && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
              <span className="text-xl opacity-30">🔒</span>
              <p className="text-sm text-gray-400 font-semibold">
                {SECRET_MILESTONES[unlocked.length] - totalCoins} more coins to next discovery…
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Task cards (memoised) ─────────────────────────────────────────────────────
const TaskCard = memo(function TaskCard({
  activity, index, onTap,
}: { activity: Activity; index: number; onTap: () => void }) {
  const [pressing, setPressing] = useState(false)
  const bg = CARD_COLORS[index % CARD_COLORS.length]
  return (
    <button
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => { setPressing(false); onTap() }}
      onPointerLeave={() => setPressing(false)}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl shadow-md transition-all duration-150 text-left border-2 border-black/10
        ${pressing ? 'scale-95 shadow-sm' : 'scale-100'}`}
      style={{ backgroundColor: bg }}>
      <div className="w-14 h-14 rounded-xl bg-black/10 flex items-center justify-center text-3xl flex-shrink-0">{activity.icon}</div>
      <span className="text-xl font-black text-black flex-1 leading-tight">{activity.name}</span>
      <div className="w-14 h-14 rounded-full bg-white border-4 border-green-500 flex items-center justify-center flex-shrink-0 shadow">
        <span className="text-green-500 text-2xl font-black">○</span>
      </div>
    </button>
  )
})

const CompletedCard = memo(function CompletedCard({
  activity, onTap,
}: { activity: Activity; onTap: () => void }) {
  const [pressing, setPressing] = useState(false)
  return (
    <button
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => { setPressing(false); onTap() }}
      onPointerLeave={() => setPressing(false)}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl border-2 border-green-300 bg-green-50 shadow-sm transition-all duration-150 text-left
        ${pressing ? 'scale-95' : 'scale-100'}`}>
      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">{activity.icon}</div>
      <span className="text-lg font-bold text-green-700 line-through flex-1">{activity.name}</span>
      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow">
        <span className="text-white text-2xl font-black">✓</span>
      </div>
    </button>
  )
})

// ── Main component ────────────────────────────────────────────────────────────
export default function KidTracker({
  totalCoins, diamonds, dogState, isActive,
  onGiveDiamond, onCoinsNeedRefresh, markSecretSeen,
}: {
  totalCoins: number; diamonds: number; dogState: DogState | null; isActive: boolean
  onGiveDiamond: () => void; onCoinsNeedRefresh: () => void
  markSecretSeen: (i: number) => void
}) {
  const { activities, tasks, loading, completedCount, totalCount, percent, streak, completeTask, uncompleteTask, addBonusCoins } = useKidTracker()

  const [reaction,      setReaction]      = useState<{ text: string; emoji: string; coins: number } | null>(null)
  const [dogSpeech,     setDogSpeech]     = useState<{ speech: string; emoji: string } | null>(null)
  const [showCoin,      setShowCoin]      = useState<'normal' | 'lucky' | null>(null)
  const [showDiamond,   setShowDiamond]   = useState(false)
  const [showMysteryBox, setShowMysteryBox] = useState(false)
  const [combo,         setCombo]         = useState(0)

  const reactionTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const coinTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const diamondTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dogSpeechTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mysteryTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const comboTimer     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPercent    = useRef(percent)
  const mysteryChecked = useRef(false)
  const prevDiamonds   = useRef(diamonds)

  // Memoised filtered lists
  const pendingActivities   = useMemo(() => activities.filter(a => !tasks.find(t => t.activity_id === a.id)?.completed), [activities, tasks])
  const completedActivities = useMemo(() => activities.filter(a =>  tasks.find(t => t.activity_id === a.id)?.completed), [activities, tasks])

  // Diamond awarded → float-up + chime
  useEffect(() => {
    if (diamonds > prevDiamonds.current) {
      setShowDiamond(true); playSound('diamond')
      if (diamondTimer.current) clearTimeout(diamondTimer.current)
      diamondTimer.current = setTimeout(() => setShowDiamond(false), 1400)
    }
    prevDiamonds.current = diamonds
  }, [diamonds])

  // Combo: reset when tab loses focus or user switches away
  const resetCombo = useCallback(() => {
    setCombo(0)
    if (comboTimer.current) clearTimeout(comboTimer.current)
  }, [])

  useEffect(() => { if (!isActive) resetCombo() }, [isActive, resetCombo])

  useEffect(() => {
    const h = () => { if (document.hidden) resetCombo() }
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [resetCombo])

  // Cleanup all timers on unmount
  useEffect(() => () => {
    [reactionTimer, coinTimer, diamondTimer, dogSpeechTimer, mysteryTimer, comboTimer]
      .forEach(r => { if (r.current) clearTimeout(r.current) })
  }, [])

  // 100% → mystery box check
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

  const showReaction = useCallback((lucky: boolean, coinAmount: number, activityIcon?: string) => {
    let text: string; let emoji: string
    if (lucky) {
      text  = LUCKY_MSGS[Math.floor(Math.random() * LUCKY_MSGS.length)]
      emoji = '🍀'
      playSound('lucky')
    } else {
      const taskR = activityIcon ? TASK_REACTIONS[activityIcon] : null
      text  = taskR ? taskR.text  : FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]
      emoji = taskR ? taskR.emoji : REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
      playSound('coin')
    }
    setReaction({ text, emoji, coins: coinAmount })
    fireConfetti()
    if (reactionTimer.current) clearTimeout(reactionTimer.current)
    reactionTimer.current = setTimeout(() => setReaction(null), 2100)

    setShowCoin(lucky ? 'lucky' : 'normal')
    if (coinTimer.current) clearTimeout(coinTimer.current)
    coinTimer.current = setTimeout(() => setShowCoin(null), 1000)
  }, [])

  const handleDogAction = useCallback((speech: string, emoji: string) => {
    setDogSpeech({ speech, emoji })
    if (dogSpeechTimer.current) clearTimeout(dogSpeechTimer.current)
    dogSpeechTimer.current = setTimeout(() => setDogSpeech(null), 2300)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-6xl animate-bounce">⭐</div>
    </div>
  )

  return (
    <div className="flex flex-col h-full gap-2 relative">

      {reaction && <FloatingReaction text={reaction.text} emoji={reaction.emoji} coins={reaction.coins} />}
      {dogSpeech && <DogSpeechBubble speech={dogSpeech.speech} speechEmoji={dogSpeech.emoji} />}

      {showCoin && (
        <div className="absolute top-20 right-4 z-20 pointer-events-none float-up font-black select-none"
          style={{ fontSize: showCoin === 'lucky' ? '1.4rem' : '1.2rem', color: showCoin === 'lucky' ? '#15803d' : '#b45309', textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
          {showCoin === 'lucky' ? '🍀 +3!' : '+🪙2'}
        </div>
      )}
      {showDiamond && (
        <div className="absolute top-20 left-4 z-20 pointer-events-none diamond-given font-black select-none text-2xl"
          style={{ color: '#0891b2', textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
          💎 +1!
        </div>
      )}
      {showMysteryBox && <MysteryBoxOverlay onClose={() => setShowMysteryBox(false)} />}

      {/* Dog strip */}
      <DogStrip totalCoins={totalCoins} diamonds={diamonds} onGiveDiamond={onGiveDiamond} onDogAction={handleDogAction} />

      {/* Combo banner */}
      <ComboBanner combo={combo} />

      {/* Progress bar + streak */}
      <div className="flex-shrink-0 flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow border-2 border-gray-100">
        <span className="text-xl">🚀</span>
        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <div className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{ width: `${percent}%`, background: percent === 100 ? '#22c55e' : 'linear-gradient(90deg,#f59e0b,#ef4444,#8b5cf6)' }}>
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

      {/* Task list + space secrets at bottom */}
      <div className="flex-1 min-h-0 overflow-y-auto panel-scroll flex flex-col gap-2.5 pb-2">
        {pendingActivities.map((a, i) => (
          <TaskCard key={a.id} activity={a} index={i} onTap={async () => {
            const { lucky } = await completeTask(a.id)
            const newCombo  = combo + 1
            setCombo(newCombo)
            if (comboTimer.current) clearTimeout(comboTimer.current)
            comboTimer.current = setTimeout(() => setCombo(0), COMBO_RESET_MS)

            const bonus = newCombo >= COMBO_THRESHOLD_2 ? 2 : newCombo >= COMBO_THRESHOLD_1 ? 1 : 0
            if (bonus > 0) await addBonusCoins(bonus, 'combo_bonus')

            const earned = (lucky ? 3 : 2) + bonus
            showReaction(lucky, earned, a.icon)
            onCoinsNeedRefresh()
          }} />
        ))}

        {completedActivities.length > 0 && (
          <>
            <div className="text-xs font-black uppercase tracking-widest text-gray-400 px-1 mt-1">Completed — tap to undo</div>
            {completedActivities.map(a => (
              <CompletedCard key={a.id} activity={a} onTap={async () => {
                await uncompleteTask(a.id)
                onCoinsNeedRefresh()
              }} />
            ))}
          </>
        )}

        {/* Space secrets (scrolls with list) */}
        <div className="mt-2">
          <SecretsSection totalCoins={totalCoins} dogState={dogState} markSecretSeen={markSecretSeen} />
        </div>
      </div>
    </div>
  )
}
