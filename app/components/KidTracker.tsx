'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useKidTracker } from '@/hooks/useSupabase'
import type { Activity } from '@/types/database'
import confetti from 'canvas-confetti'

const REACTIONS = ['🎉', '🚀', '⭐', '🔥', '💥', '🌟', '🏆', '👊', '💪', '🎯']
const FUN_MESSAGES = ['AWESOME!!', 'CRUSHING IT!', 'SUPERSTAR!', 'BOOM!', 'LEGENDARY!', 'EPIC WIN!', 'YOU ROCK!', 'NAILED IT!', 'UNSTOPPABLE!', 'CHAMPION!']

// A different bright color per card
const CARD_COLORS = [
  'from-red-400 to-orange-400',
  'from-orange-400 to-yellow-400',
  'from-yellow-400 to-lime-400',
  'from-green-400 to-teal-400',
  'from-teal-400 to-cyan-400',
  'from-blue-400 to-indigo-400',
  'from-indigo-400 to-violet-400',
  'from-violet-400 to-pink-400',
  'from-pink-400 to-rose-400',
]

function fireConfetti() {
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#ff0000','#ffff00','#00ff00','#0000ff','#ff00ff'] })
  setTimeout(() => confetti({ particleCount: 50, spread: 120, origin: { y: 0.5 }, startVelocity: 45 }), 150)
}

function FloatingReaction({ text, emoji }: { text: string; emoji: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 bg-white/20 backdrop-blur-sm rounded-3xl">
      <div className="bounce-in text-8xl mb-3">{emoji}</div>
      <div className="bounce-in text-4xl font-black text-white drop-shadow-lg text-center px-4" style={{ animationDelay: '0.1s' }}>{text}</div>
    </div>
  )
}

function TaskCard({ activity, index, onTap }: { activity: Activity; index: number; onTap: () => void }) {
  const [pressing, setPressing] = useState(false)
  const color = CARD_COLORS[index % CARD_COLORS.length]

  return (
    <button
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => { setPressing(false); onTap() }}
      onPointerLeave={() => setPressing(false)}
      className={`w-full flex items-center gap-4 px-5 py-5 rounded-2xl bg-gradient-to-r ${color}
        shadow-lg active:shadow-sm transition-all duration-150 text-left
        ${pressing ? 'scale-95 brightness-90' : 'scale-100'}`}
    >
      <div className="w-14 h-14 rounded-xl bg-white/30 flex items-center justify-center text-3xl flex-shrink-0 shadow-inner">
        {activity.icon}
      </div>
      <span className="text-xl font-bold text-white drop-shadow flex-1">{activity.name}</span>
      <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center flex-shrink-0">
        <span className="text-white/70 text-lg">○</span>
      </div>
    </button>
  )
}

function CompletedCard({ activity, index, onTap }: { activity: Activity; index: number; onTap: () => void }) {
  const [pressing, setPressing] = useState(false)

  return (
    <button
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => { setPressing(false); onTap() }}
      onPointerLeave={() => setPressing(false)}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/60
        border-2 border-green-300 shadow transition-all duration-150 text-left
        ${pressing ? 'scale-95' : 'scale-100'}`}
    >
      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">
        {activity.icon}
      </div>
      <span className="text-lg font-semibold text-green-700 line-through flex-1">{activity.name}</span>
      <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0 shadow">
        <span className="text-white text-xl">✓</span>
      </div>
    </button>
  )
}

export default function KidTracker() {
  const { activities, tasks, loading, completedCount, totalCount, percent, completeTask, uncompleteTask } = useKidTracker()
  const [reaction, setReaction] = useState<{ text: string; emoji: string } | null>(null)
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showReaction = useCallback(() => {
    const emoji = REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
    const text = FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]
    setReaction({ text, emoji })
    fireConfetti()
    if (reactionTimer.current) clearTimeout(reactionTimer.current)
    reactionTimer.current = setTimeout(() => setReaction(null), 1800)
  }, [])

  useEffect(() => () => { if (reactionTimer.current) clearTimeout(reactionTimer.current) }, [])

  const pendingActivities = activities.filter((a) => !tasks.find((t) => t.activity_id === a.id)?.completed)
  const completedActivities = activities.filter((a) => tasks.find((t) => t.activity_id === a.id)?.completed)

  const handleComplete = async (activityId: string) => {
    await completeTask(activityId)
    showReaction()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-6xl animate-bounce">⭐</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-3 relative">
      {reaction && <FloatingReaction text={reaction.text} emoji={reaction.emoji} />}

      {/* Progress bar */}
      <div className="flex-shrink-0 bg-white/50 rounded-2xl px-4 py-3 flex items-center gap-3 shadow">
        <span className="text-2xl">⭐</span>
        <div className="flex-1">
          <div className="h-5 bg-white/70 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
              style={{
                width: `${percent}%`,
                background: percent === 100
                  ? 'linear-gradient(90deg,#22c55e,#86efac)'
                  : 'linear-gradient(90deg,#f59e0b,#ef4444,#8b5cf6)',
              }}
            >
              <div className="absolute inset-0 shimmer" />
            </div>
          </div>
        </div>
        <span className="text-lg font-black text-violet-700 whitespace-nowrap">{completedCount}/{totalCount}</span>
      </div>

      {/* All done! */}
      {pendingActivities.length === 0 && completedActivities.length > 0 && (
        <div className="flex-shrink-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-lg">
          <span className="text-4xl bounce-in">🏆</span>
          <div>
            <div className="text-xl font-black text-white">ALL DONE!</div>
            <div className="text-green-100 text-sm">You&apos;re absolutely amazing today!</div>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 min-h-0 overflow-y-auto panel-scroll flex flex-col gap-3 pb-2">
        {/* Pending */}
        {pendingActivities.map((a, i) => (
          <TaskCard key={a.id} activity={a} index={i} onTap={() => handleComplete(a.id)} />
        ))}

        {/* Completed */}
        {completedActivities.length > 0 && (
          <>
            <div className="text-xs font-bold uppercase tracking-widest text-violet-500/70 px-1 mt-1">
              Done — tap to undo
            </div>
            {completedActivities.map((a, i) => (
              <CompletedCard key={a.id} activity={a} index={i} onTap={() => uncompleteTask(a.id)} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
