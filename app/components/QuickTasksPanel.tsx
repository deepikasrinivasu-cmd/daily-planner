'use client'
import { useState } from 'react'
import { useQuickTasks } from '@/hooks/useSupabase'
import type { QuickTask } from '@/types/database'

const TASK_COLORS = ['#FFD60A','#FF6B6B','#4ECDC4','#FF9F1C','#A78BFA','#34D399','#F472B6','#60A5FA']

function QuickTaskRow({ task, idx, onToggle, onDelete }: {
  task: QuickTask; idx: number; onToggle: () => void; onDelete: () => void
}) {
  const bg = task.completed ? '#f0fdf4' : TASK_COLORS[idx % TASK_COLORS.length]
  const border = task.completed ? '#bbf7d0' : bg

  return (
    <div className="flex items-center gap-3 px-4 py-4 rounded-2xl border-2 shadow-sm transition-all duration-300"
      style={{ backgroundColor: bg, borderColor: border }}>
      <button onClick={onToggle}
        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all font-black text-lg
          ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white/60 border-black/20 text-transparent hover:bg-white/80'}`}>
        ✓
      </button>
      <span className={`flex-1 text-base font-black ${task.completed ? 'line-through text-gray-400' : 'text-black'}`}>
        {task.name}
      </span>
      <button onClick={onDelete}
        className="w-8 h-8 rounded-full bg-black/10 hover:bg-red-200 text-black/50 hover:text-red-600 flex items-center justify-center text-lg font-black transition-colors">
        ×
      </button>
    </div>
  )
}

export default function QuickTasksPanel() {
  const { tasks, addTask, toggleTask, deleteTask, clearCompleted, clearAll } = useQuickTasks()
  const [input, setInput] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState<'done' | 'all' | null>(null)

  const handleAdd = async () => {
    const trimmed = input.trim()
    if (!trimmed) return
    await addTask(trimmed)
    setInput('')
  }

  const pending = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)

  const handleClear = async () => {
    if (showClearConfirm === 'done') await clearCompleted()
    if (showClearConfirm === 'all') await clearAll()
    setShowClearConfirm(null)
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <div className="text-2xl font-black text-gray-900">Quick Tasks ⚡</div>
          <div className="text-gray-500 text-sm font-semibold">
            {pending.length > 0 ? `${pending.length} to do` : done.length > 0 ? 'All done!' : 'Add tasks below'}
          </div>
        </div>
        <div className="text-3xl font-black" style={{ color: '#A855F7' }}>
          {tasks.length > 0 ? `${done.length}/${tasks.length}` : ''}
        </div>
      </div>

      {/* Add input */}
      <div className="flex-shrink-0 flex gap-2">
        <input
          className="flex-1 bg-white rounded-2xl px-4 py-3 text-base outline-none border-2 border-gray-200 focus:border-purple-400 text-gray-800 font-semibold placeholder-gray-400 shadow-sm"
          placeholder="Add a task... (e.g. Read chapter 3)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd}
          className="w-12 h-12 rounded-2xl font-black text-xl text-white shadow-md border-2 border-purple-600 flex items-center justify-center"
          style={{ backgroundColor: '#A855F7' }}>
          +
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 min-h-0 overflow-y-auto panel-scroll flex flex-col gap-2">
        {tasks.length === 0 && (
          <div className="text-center text-gray-400 py-12 bg-white rounded-2xl text-sm border-2 border-dashed border-gray-200 font-semibold">
            Nothing here yet!<br />Type a task above and hit +
          </div>
        )}

        {/* Pending tasks */}
        {pending.map((task, i) => (
          <QuickTaskRow key={task.id} task={task} idx={i}
            onToggle={() => toggleTask(task.id, task.completed)}
            onDelete={() => deleteTask(task.id)} />
        ))}

        {/* Divider + completed */}
        {done.length > 0 && (
          <>
            {pending.length > 0 && (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Done</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}
            {done.map((task, i) => (
              <QuickTaskRow key={task.id} task={task} idx={i}
                onToggle={() => toggleTask(task.id, task.completed)}
                onDelete={() => deleteTask(task.id)} />
            ))}
          </>
        )}
      </div>

      {/* Bottom actions */}
      {tasks.length > 0 && (
        <div className="flex-shrink-0 flex gap-2 pt-2 border-t-2 border-gray-200">
          {showClearConfirm ? (
            <>
              <span className="text-sm text-gray-700 flex-1 flex items-center font-bold">
                {showClearConfirm === 'done' ? `Remove ${done.length} done?` : 'Remove ALL tasks?'}
              </span>
              <button onClick={handleClear} className="px-4 py-2 rounded-xl bg-red-500 text-white font-black text-sm">Yes</button>
              <button onClick={() => setShowClearConfirm(null)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-black text-sm border-2 border-gray-200">No</button>
            </>
          ) : (
            <>
              {done.length > 0 && (
                <button onClick={() => setShowClearConfirm('done')}
                  className="flex-1 py-2 rounded-xl text-sm font-black text-black border-2 border-black"
                  style={{ backgroundColor: '#FFD60A' }}>
                  Clear {done.length} done ✓
                </button>
              )}
              <button onClick={() => setShowClearConfirm('all')}
                className="flex-1 py-2 rounded-xl text-sm font-black text-white bg-red-500 border-2 border-red-600">
                Clear all
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
