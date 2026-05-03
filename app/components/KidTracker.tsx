'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { DndContext, DragEndEvent, DragStartEvent, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core'
import { useKidTracker } from '@/hooks/useSupabase'
import type { Activity } from '@/types/database'
import confetti from 'canvas-confetti'

const REACTIONS = ['🎉', '🚀', '⭐', '🔥', '💥', '🌟', '🏆', '👊', '💪', '🎯']
const FUN_MESSAGES = ['AWESOME!!', 'CRUSHING IT!', 'SUPERSTAR!', 'BOOM!', 'LEGENDARY!', 'EPIC WIN!', 'YOU ROCK!', 'NAILED IT!', 'UNSTOPPABLE!', 'CHAMPION!']

function fireConfetti() {
  const count = 200
  const d = { origin: { y: 0.5 } }
  confetti({ ...d, particleCount: count * 0.25, spread: 26, startVelocity: 55, colors: ['#ff0000', '#ffff00', '#00ff00'] })
  confetti({ ...d, particleCount: count * 0.2, spread: 60, colors: ['#0000ff', '#ff00ff', '#00ffff'] })
  confetti({ ...d, particleCount: count * 0.35, spread: 100, decay: 0.91, scalar: 0.8, colors: ['#ffd700', '#ff6b6b', '#4ecdc4'] })
  confetti({ ...d, particleCount: count * 0.1, spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
  confetti({ ...d, particleCount: count * 0.1, spread: 160, startVelocity: 45 })
}

// ── Draggable pending task ────────────────────────────────────────────────────
function PendingCard({ activity, isDraggingThis }: { activity: Activity; isDraggingThis: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `pending-${activity.id}` })
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0) rotate(${transform.x * 0.04}deg) scale(1.05)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl bg-slate-700/70 border-2 border-slate-600
        cursor-grab active:cursor-grabbing touch-none select-none
        hover:border-indigo-400 hover:bg-slate-700 transition-colors
        ${isDraggingThis ? 'opacity-25' : 'opacity-100'}`}
    >
      <span className="text-3xl">{activity.icon}</span>
      <span className="text-xl font-semibold text-white">{activity.name}</span>
      <span className="ml-auto text-slate-500 text-sm">drag →</span>
    </div>
  )
}

// ── Draggable completed task ──────────────────────────────────────────────────
function CompletedCard({ activity, isDraggingThis }: { activity: Activity; isDraggingThis: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `completed-${activity.id}` })
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0) rotate(${transform.x * 0.04}deg) scale(1.05)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-4 px-5 py-3 rounded-2xl bg-green-500/10 border border-green-500/30
        cursor-grab active:cursor-grabbing touch-none select-none
        hover:border-orange-400/50 hover:bg-orange-500/10 transition-colors
        ${isDraggingThis ? 'opacity-25' : 'opacity-70'}`}
    >
      <span className="text-2xl">{activity.icon}</span>
      <span className="text-lg text-green-400 line-through">{activity.name}</span>
      <span className="ml-auto text-slate-500 text-xs">drag back ←</span>
      <span className="text-lg">✅</span>
    </div>
  )
}

// ── Drop zones ────────────────────────────────────────────────────────────────
function CompleteZone({ isOver }: { isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: 'done-zone' })
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-center gap-4 rounded-2xl border-4 border-dashed transition-all duration-300 h-[90px]
        ${isOver ? 'border-green-400 bg-green-400/20 drop-zone-active scale-105' : 'border-slate-600 bg-slate-800/30'}`}
    >
      <span className={`text-4xl transition-transform duration-200 ${isOver ? 'scale-125' : ''}`}>
        {isOver ? '🎯' : '✅'}
      </span>
      <span className={`text-lg font-bold transition-colors ${isOver ? 'text-green-300' : 'text-slate-500'}`}>
        {isOver ? 'DROP IT! 🔥' : 'Drag here to complete'}
      </span>
    </div>
  )
}

function UndoZone({ isOver }: { isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: 'undo-zone' })
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-center gap-4 rounded-2xl border-4 border-dashed transition-all duration-300 h-[90px]
        ${isOver ? 'border-orange-400 bg-orange-400/20 scale-105' : 'border-slate-700 bg-slate-800/20'}`}
      style={isOver ? { boxShadow: '0 0 40px rgba(251,146,60,0.5)' } : {}}
    >
      <span className={`text-4xl transition-transform duration-200 ${isOver ? 'scale-125' : ''}`}>
        {isOver ? '↩️' : '🔄'}
      </span>
      <span className={`text-lg font-bold transition-colors ${isOver ? 'text-orange-300' : 'text-slate-600'}`}>
        {isOver ? 'PUT IT BACK!' : 'Drag here to undo'}
      </span>
    </div>
  )
}

// ── Overlay card while dragging ───────────────────────────────────────────────
function OverlayCard({ activity, isCompleted }: { activity: Activity; isCompleted: boolean }) {
  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 shadow-2xl rotate-3 scale-110
      ${isCompleted
        ? 'bg-orange-500 border-orange-300 shadow-orange-500/50'
        : 'bg-indigo-500 border-indigo-300 shadow-indigo-500/50'}`}
    >
      <span className="text-3xl">{activity.icon}</span>
      <span className="text-xl font-bold text-white">{activity.name}</span>
      <span className="ml-auto text-2xl animate-bounce">{isCompleted ? '↩️' : '🚀'}</span>
    </div>
  )
}

function FloatingReaction({ text, emoji }: { text: string; emoji: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50">
      <div className="bounce-in text-8xl mb-4">{emoji}</div>
      <div className="bounce-in text-5xl font-black text-yellow-300 drop-shadow-lg" style={{ animationDelay: '0.1s' }}>{text}</div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function KidTracker() {
  const { activities, tasks, loading, completedCount, totalCount, percent, completeTask, uncompleteTask } = useKidTracker()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overZone, setOverZone] = useState<string | null>(null)
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

  const handleDragStart = (e: DragStartEvent) => setDraggingId(String(e.active.id))

  const handleDragEnd = async (e: DragEndEvent) => {
    const id = String(e.active.id)
    setDraggingId(null)
    setOverZone(null)
    const activityId = id.replace(/^(pending|completed)-/, '')
    if (e.over?.id === 'done-zone' && id.startsWith('pending-')) {
      await completeTask(activityId)
      showReaction()
    } else if (e.over?.id === 'undo-zone' && id.startsWith('completed-')) {
      await uncompleteTask(activityId)
    }
  }

  const pendingActivities = activities.filter((a) => !tasks.find((t) => t.activity_id === a.id)?.completed)
  const completedActivities = activities.filter((a) => tasks.find((t) => t.activity_id === a.id)?.completed)

  const draggingRaw = draggingId ?? ''
  const draggingActivityId = draggingRaw.replace(/^(pending|completed)-/, '')
  const draggingActivity = activities.find((a) => a.id === draggingActivityId)
  const draggingIsCompleted = draggingRaw.startsWith('completed-')

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-4xl animate-spin">⭐</div></div>
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => setOverZone(e.over ? String(e.over.id) : null)}
    >
      <div className="flex flex-col h-full gap-4 relative">
        {reaction && <FloatingReaction text={reaction.text} emoji={reaction.emoji} />}

        {/* Progress */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white">Today&apos;s Missions</span>
            <span className="text-xl font-black text-yellow-300">{completedCount}/{totalCount} ⭐</span>
          </div>
          <div className="h-5 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
              style={{
                width: `${percent}%`,
                background: percent === 100 ? 'linear-gradient(90deg,#22c55e,#86efac)' : 'linear-gradient(90deg,#6366f1,#a78bfa,#ec4899)',
              }}
            >
              <div className="absolute inset-0 shimmer" />
            </div>
          </div>
        </div>

        {/* Complete drop zone */}
        <div className="flex-shrink-0">
          <CompleteZone isOver={overZone === 'done-zone'} />
        </div>

        {/* Pending tasks */}
        <div className="flex flex-col gap-3 flex-1 panel-scroll overflow-y-auto">
          {pendingActivities.length === 0 && completedActivities.length > 0 && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <div className="text-6xl bounce-in">🏆</div>
              <div className="text-2xl font-bold text-green-400 text-center">ALL DONE! YOU&apos;RE AMAZING!</div>
            </div>
          )}
          {pendingActivities.map((a) => (
            <PendingCard key={a.id} activity={a} isDraggingThis={draggingId === `pending-${a.id}`} />
          ))}

          {/* Completed section */}
          {completedActivities.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              <div className="text-xs text-slate-500 uppercase tracking-wider px-1">Completed — drag back to undo</div>
              {completedActivities.map((a) => (
                <CompletedCard key={a.id} activity={a} isDraggingThis={draggingId === `completed-${a.id}`} />
              ))}
            </div>
          )}
        </div>

        {/* Undo drop zone — only visible when dragging a completed task */}
        {completedActivities.length > 0 && (
          <div className="flex-shrink-0">
            <UndoZone isOver={overZone === 'undo-zone'} />
          </div>
        )}

        <DragOverlay>
          {draggingActivity && <OverlayCard activity={draggingActivity} isCompleted={draggingIsCompleted} />}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
