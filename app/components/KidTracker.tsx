'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { DndContext, DragEndEvent, DragStartEvent, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core'
import { useKidTracker } from '@/hooks/useSupabase'
import type { Activity, DailyTask } from '@/types/database'
import confetti from 'canvas-confetti'

// ── Fun reactions shown on task complete ─────────────────────────────────────
const REACTIONS = ['🎉', '🚀', '⭐', '🔥', '💥', '🌟', '🏆', '👊', '💪', '🎯']
const FUN_MESSAGES = [
  'AWESOME!!', 'CRUSHING IT!', 'SUPERSTAR!', 'BOOM!', 'LEGENDARY!',
  'EPIC WIN!', 'YOU ROCK!', 'NAILED IT!', 'UNSTOPPABLE!', 'CHAMPION!',
]

function fireConfetti() {
  const count = 200
  const defaults = { origin: { y: 0.5 } }
  confetti({ ...defaults, particleCount: count * 0.25, spread: 26, startVelocity: 55, colors: ['#ff0000', '#ffff00', '#00ff00'] })
  confetti({ ...defaults, particleCount: count * 0.2, spread: 60, colors: ['#0000ff', '#ff00ff', '#00ffff'] })
  confetti({ ...defaults, particleCount: count * 0.35, spread: 100, decay: 0.91, scalar: 0.8, colors: ['#ffd700', '#ff6b6b', '#4ecdc4'] })
  confetti({ ...defaults, particleCount: count * 0.1, spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
  confetti({ ...defaults, particleCount: count * 0.1, spread: 160, startVelocity: 45 })
}

// ── Draggable task card ───────────────────────────────────────────────────────
function TaskCard({ activity, task, isCompleted }: { activity: Activity; task?: DailyTask; isCompleted: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: activity.id,
    disabled: isCompleted,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${transform.x * 0.05}deg) scale(1.05)` }
    : undefined

  if (isCompleted) {
    return (
      <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-green-500/20 border border-green-500/40 opacity-70">
        <span className="text-3xl">{activity.icon}</span>
        <span className="text-xl font-semibold text-green-300 line-through">{activity.name}</span>
        <span className="ml-auto text-2xl">✅</span>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl bg-slate-700/70 border-2 border-slate-600
        cursor-grab active:cursor-grabbing touch-none select-none
        hover:border-indigo-400 hover:bg-slate-700 transition-colors
        ${isDragging ? 'opacity-30' : 'opacity-100'}
      `}
    >
      <span className="text-3xl">{activity.icon}</span>
      <span className="text-xl font-semibold text-white">{activity.name}</span>
      <span className="ml-auto text-slate-500 text-sm">drag →</span>
    </div>
  )
}

// ── Drag overlay (the floating card while dragging) ───────────────────────────
function DragOverlayCard({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-indigo-500 border-2 border-indigo-300 shadow-2xl shadow-indigo-500/50 rotate-3 scale-110">
      <span className="text-3xl">{activity.icon}</span>
      <span className="text-xl font-bold text-white">{activity.name}</span>
      <span className="ml-auto text-2xl animate-bounce">🚀</span>
    </div>
  )
}

// ── Drop zone ─────────────────────────────────────────────────────────────────
function DropZone({ isOver }: { isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: 'done-zone' })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col items-center justify-center rounded-3xl border-4 border-dashed transition-all duration-300 min-h-[140px]
        ${isOver
          ? 'border-green-400 bg-green-400/20 drop-zone-active scale-105'
          : 'border-slate-600 bg-slate-800/30'
        }
      `}
    >
      <div className={`text-5xl mb-2 transition-transform duration-200 ${isOver ? 'scale-125' : ''}`}>
        {isOver ? '🎯' : '✅'}
      </div>
      <div className={`text-xl font-bold transition-colors ${isOver ? 'text-green-300' : 'text-slate-500'}`}>
        {isOver ? 'DROP IT! 🔥' : 'Drag tasks here to complete'}
      </div>
    </div>
  )
}

// ── Floating reaction popup ───────────────────────────────────────────────────
function FloatingReaction({ text, emoji }: { text: string; emoji: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50">
      <div className="bounce-in text-8xl mb-4">{emoji}</div>
      <div className="bounce-in text-5xl font-black text-yellow-300 drop-shadow-lg" style={{ animationDelay: '0.1s' }}>
        {text}
      </div>
    </div>
  )
}

// ── Main KidTracker ───────────────────────────────────────────────────────────
export default function KidTracker() {
  const { activities, tasks, loading, completedCount, totalCount, percent, completeTask, uncompleteTask } = useKidTracker()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [isOver, setIsOver] = useState(false)
  const [reaction, setReaction] = useState<{ text: string; emoji: string } | null>(null)
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showReaction = useCallback(() => {
    const emoji = REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
    const text = FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]
    setReaction({ text, emoji })
    fireConfetti()
    if (reactionTimer.current) clearTimeout(reactionTimer.current)
    reactionTimer.current = setTimeout(() => setReaction(null), 2000)
  }, [])

  useEffect(() => () => { if (reactionTimer.current) clearTimeout(reactionTimer.current) }, [])

  const handleDragStart = (e: DragStartEvent) => {
    setDraggingId(String(e.active.id))
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setDraggingId(null)
    setIsOver(false)
    if (e.over?.id === 'done-zone' && e.active.id) {
      await completeTask(String(e.active.id))
      showReaction()
    }
  }

  const pendingActivities = activities.filter((a) => {
    const task = tasks.find((t) => t.activity_id === a.id)
    return !task?.completed
  })
  const completedActivities = activities.filter((a) => {
    const task = tasks.find((t) => t.activity_id === a.id)
    return task?.completed
  })
  const draggingActivity = activities.find((a) => a.id === draggingId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-4xl animate-spin">⭐</div>
      </div>
    )
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => setIsOver(e.over?.id === 'done-zone')}
    >
      <div className="flex flex-col h-full gap-5 relative">
        {/* Reaction overlay */}
        {reaction && <FloatingReaction text={reaction.text} emoji={reaction.emoji} />}

        {/* Progress bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">Today&apos;s Missions</span>
            <span className="text-2xl font-black text-yellow-300">{completedCount}/{totalCount} ⭐</span>
          </div>
          <div className="h-6 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
              style={{
                width: `${percent}%`,
                background: percent === 100
                  ? 'linear-gradient(90deg, #22c55e, #86efac)'
                  : 'linear-gradient(90deg, #6366f1, #a78bfa, #ec4899)',
              }}
            >
              <div className="absolute inset-0 shimmer" />
            </div>
          </div>
          <div className="text-right text-lg text-slate-400">{percent}% complete</div>
        </div>

        {/* Drop zone */}
        <DropZone isOver={isOver} />

        {/* Pending tasks */}
        <div className="flex flex-col gap-3 panel-scroll flex-1">
          {pendingActivities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="text-6xl bounce-in">🏆</div>
              <div className="text-2xl font-bold text-green-400 text-center">ALL DONE! YOU&apos;RE AMAZING!</div>
            </div>
          )}
          {pendingActivities.map((activity) => (
            <TaskCard
              key={activity.id}
              activity={activity}
              task={tasks.find((t) => t.activity_id === activity.id)}
              isCompleted={false}
            />
          ))}

          {/* Completed tasks (collapsed) */}
          {completedActivities.length > 0 && (
            <div className="mt-2">
              <div className="text-sm text-slate-500 mb-2 uppercase tracking-wider">Completed</div>
              <div className="flex flex-col gap-2">
                {completedActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-green-500/10 border border-green-500/30 opacity-60"
                    onDoubleClick={() => uncompleteTask(activity.id)}
                  >
                    <span className="text-2xl">{activity.icon}</span>
                    <span className="text-lg text-green-400 line-through">{activity.name}</span>
                    <span className="ml-auto text-xl">✅</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DragOverlay>
          {draggingActivity && <DragOverlayCard activity={draggingActivity} />}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
