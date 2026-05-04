'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useKidTracker } from '@/hooks/useSupabase'
import type { Activity } from '@/types/database'
import confetti from 'canvas-confetti'

const REACTIONS = ['🎉','🚀','⭐','🔥','💥','🌟','🏆','👊','💪','🎯']
const FUN_MESSAGES = ['AWESOME!!','CRUSHING IT!','SUPERSTAR!','BOOM!','LEGENDARY!','EPIC WIN!','YOU ROCK!','NAILED IT!','UNSTOPPABLE!','CHAMPION!']

// Solid bright colours — all with BLACK text for maximum contrast on any screen
const CARD_COLORS = ['#FFD60A','#FF6B6B','#4ECDC4','#FF9F1C','#A8DADC','#FFBF69','#CBF3F0','#FF6392','#B7E4C7','#FFC6FF']

function fireConfetti() {
  confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, colors: ['#ff0000','#ffff00','#00ff00','#0000ff','#ff00ff'] })
  setTimeout(() => confetti({ particleCount: 60, spread: 130, origin: { y: 0.5 }, startVelocity: 45 }), 200)
}

function FloatingReaction({ text, emoji }: { text: string; emoji: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 rounded-3xl"
      style={{ background: 'rgba(255,255,255,0.85)' }}>
      <div className="bounce-in text-8xl mb-3">{emoji}</div>
      <div className="bounce-in text-4xl font-black text-center px-4 drop-shadow" style={{ color: '#7c3aed', animationDelay: '0.1s' }}>{text}</div>
    </div>
  )
}

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
      {/* Big obvious green tap button */}
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

export default function KidTracker() {
  const { activities, tasks, loading, completedCount, totalCount, percent, streak, completeTask, uncompleteTask } = useKidTracker()
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

  const pendingActivities = activities.filter(a => !tasks.find(t => t.activity_id === a.id)?.completed)
  const completedActivities = activities.filter(a => tasks.find(t => t.activity_id === a.id)?.completed)

  if (loading) return <div className="flex items-center justify-center h-full"><div className="text-6xl animate-bounce">⭐</div></div>

  return (
    <div className="flex flex-col h-full gap-3 relative">
      {reaction && <FloatingReaction text={reaction.text} emoji={reaction.emoji} />}

      {/* Progress bar + streak */}
      <div className="flex-shrink-0 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow border-2 border-gray-100">
        <span className="text-2xl">🚀</span>
        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <div className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{
              width: `${percent}%`,
              background: percent === 100 ? '#22c55e' : 'linear-gradient(90deg,#f59e0b,#ef4444,#8b5cf6)',
            }}>
            <div className="absolute inset-0 shimmer" />
          </div>
        </div>
        <span className="text-lg font-black text-gray-800 whitespace-nowrap">{completedCount}/{totalCount} ⭐</span>
        {streak > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-orange-100 border-2 border-orange-300 flex-shrink-0">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-black text-orange-700">{streak}</span>
          </div>
        )}
      </div>

      {/* All done banner */}
      {pendingActivities.length === 0 && completedActivities.length > 0 && (
        <div className="flex-shrink-0 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-lg border-2 border-green-300"
          style={{ backgroundColor: '#D1FAE5' }}>
          <span className="text-4xl bounce-in">🏆</span>
          <div>
            <div className="text-xl font-black text-green-800">ALL DONE!</div>
            <div className="text-green-700 text-sm font-semibold">You&apos;re absolutely amazing today!</div>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 min-h-0 overflow-y-auto panel-scroll flex flex-col gap-3 pb-2">
        {pendingActivities.map((a, i) => (
          <TaskCard key={a.id} activity={a} index={i} onTap={async () => { await completeTask(a.id); showReaction() }} />
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
