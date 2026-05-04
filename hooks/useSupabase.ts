'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Activity, DailyTask, Bounty, Store, GroceryItem, FamilyEvent, QuickTask } from '@/types/database'

async function calcStreak(): Promise<number> {
  const { data } = await supabase
    .from('daily_completions')
    .select('date')
    .order('date', { ascending: false })
    .limit(400)

  if (!data || data.length === 0) return 0
  const dates = new Set(data.map((r) => r.date as string))
  const t = today()
  const start = new Date(t + 'T00:00:00')
  if (!dates.has(t)) start.setDate(start.getDate() - 1)

  let count = 0
  const d = new Date(start)
  while (true) {
    const ds = d.toISOString().split('T')[0]
    if (!dates.has(ds)) break
    count++
    d.setDate(d.getDate() - 1)
  }
  return count
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// Unique channel name per mount — avoids StrictMode double-subscribe collision
function channelId(name: string) {
  return `${name}-${Math.random().toString(36).slice(2)}`
}

// ── Activities & daily tasks ──────────────────────────────────────────────────
export function useKidTracker() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const dateRef = useRef(today())

  const loadData = useCallback(async () => {
    const date = today()
    const [{ data: acts }, { data: existingTasks }] = await Promise.all([
      supabase.from('activities').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('daily_tasks').select('*').eq('date', date),
    ])

    const activeActs = acts ?? []
    const existing = existingTasks ?? []

    const existingIds = new Set(existing.map((t) => t.activity_id))
    const toCreate = activeActs.filter((a) => !existingIds.has(a.id))
    if (toCreate.length > 0) {
      await supabase.from('daily_tasks').insert(
        toCreate.map((a) => ({ activity_id: a.id, date, completed: false }))
      )
      const { data: refreshed } = await supabase.from('daily_tasks').select('*').eq('date', date)
      setTasks(refreshed ?? [])
    } else {
      setTasks(existing)
    }

    setActivities(activeActs)
    setLoading(false)
    setStreak(await calcStreak())
  }, [])

  // Auto-reset when a new day starts — covers both:
  // 1. Page stays open past midnight (interval check)
  // 2. iPhone wakes from sleep / app foregrounded (visibilitychange)
  useEffect(() => {
    const checkDate = () => {
      const now = today()
      if (now !== dateRef.current) {
        dateRef.current = now
        loadData()
      }
    }
    document.addEventListener('visibilitychange', checkDate)
    const timer = setInterval(checkDate, 30_000)
    return () => {
      document.removeEventListener('visibilitychange', checkDate)
      clearInterval(timer)
    }
  }, [loadData])

  useEffect(() => {
    loadData()
    const id = channelId('kid-tracker')
    const channel = supabase.channel(id)
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_tasks' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  const completeTask = useCallback(async (activityId: string) => {
    const date = today()
    await supabase
      .from('daily_tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('activity_id', activityId)
      .eq('date', date)
    await loadData()
  }, [loadData])

  const uncompleteTask = useCallback(async (activityId: string) => {
    const date = today()
    await supabase
      .from('daily_tasks')
      .update({ completed: false, completed_at: null })
      .eq('activity_id', activityId)
      .eq('date', date)
    await loadData()
  }, [loadData])

  const resetTasks = useCallback(async () => {
    const date = today()
    await supabase
      .from('daily_tasks')
      .update({ completed: false, completed_at: null })
      .eq('date', date)
    // Remove today's completion record when reset
    await supabase.from('daily_completions').delete().eq('date', date)
    await loadData()
  }, [loadData])

  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Auto-mark day complete when all tasks done
  useEffect(() => {
    if (loading || totalCount === 0) return
    if (percent === 100) {
      supabase.from('daily_completions').upsert({ date: today() }, { onConflict: 'date' })
        .then(() => calcStreak().then(setStreak))
    } else {
      supabase.from('daily_completions').delete().eq('date', today())
        .then(() => calcStreak().then(setStreak))
    }
  }, [percent, loading, totalCount])

  return { activities, tasks, loading, completedCount, totalCount, percent, streak, completeTask, uncompleteTask, resetTasks, reload: loadData }
}

// ── Bounties ──────────────────────────────────────────────────────────────────
export function useBounties() {
  const [bounties, setBounties] = useState<Bounty[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('bounties').select('*').order('sort_order')
    setBounties(data ?? [])
  }, [])

  useEffect(() => {
    load()
    const channel = supabase.channel(channelId('bounties'))
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bounties' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const addBounty = async (b: { name: string; icon: string; threshold: number; color: string }) => {
    await supabase.from('bounties').insert({ ...b, sort_order: Date.now() })
  }
  const deleteBounty = async (id: string) => {
    await supabase.from('bounties').delete().eq('id', id)
  }

  return { bounties, addBounty, deleteBounty }
}

// ── Stores & groceries ───────────────────────────────────────────────────────
export function useGroceries() {
  const [stores, setStores] = useState<Store[]>([])
  const [items, setItems] = useState<GroceryItem[]>([])

  const loadAll = useCallback(async () => {
    const [{ data: s }, { data: i }] = await Promise.all([
      supabase.from('stores').select('*').order('created_at'),
      supabase.from('grocery_items').select('*').order('created_at'),
    ])
    setStores(s ?? [])
    setItems(i ?? [])
  }, [])

  useEffect(() => {
    loadAll()
    const channel = supabase.channel(channelId('groceries'))
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_items' }, loadAll)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadAll])

  const addStore = async (name: string, color: string) => {
    await supabase.from('stores').insert({ name, color })
  }
  const deleteStore = async (id: string) => {
    await supabase.from('stores').delete().eq('id', id)
  }
  const addItem = async (storeId: string, name: string) => {
    await supabase.from('grocery_items').insert({ store_id: storeId, name, checked: false })
  }
  const toggleItem = async (id: string, checked: boolean) => {
    await supabase.from('grocery_items').update({ checked: !checked }).eq('id', id)
  }
  const deleteItem = async (id: string) => {
    await supabase.from('grocery_items').delete().eq('id', id)
  }
  const wipeStore = async (storeId: string) => {
    await supabase.from('grocery_items').delete().eq('store_id', storeId)
  }
  const wipeChecked = async (storeId: string) => {
    await supabase.from('grocery_items').delete().eq('store_id', storeId).eq('checked', true)
  }

  return { stores, items, addStore, deleteStore, addItem, toggleItem, deleteItem, wipeStore, wipeChecked }
}

// ── Family events ────────────────────────────────────────────────────────────
export function useFamilyEvents() {
  const [events, setEvents] = useState<FamilyEvent[]>([])

  const loadEvents = useCallback(async () => {
    const { data } = await supabase
      .from('family_events')
      .select('*')
      .gte('date', today())
      .order('date')
      .order('time')
      .limit(20)
    setEvents(data ?? [])
  }, [])

  useEffect(() => {
    loadEvents()
    const channel = supabase.channel(channelId('family-events'))
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_events' }, loadEvents)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadEvents])

  const addEvent = async (e: { title: string; time: string; date: string; color: string }) => {
    await supabase.from('family_events').insert(e)
  }
  const deleteEvent = async (id: string) => {
    await supabase.from('family_events').delete().eq('id', id)
  }

  return { events, addEvent, deleteEvent }
}

// ── Quick tasks ───────────────────────────────────────────────────────────────
export function useQuickTasks() {
  const [tasks, setTasks] = useState<QuickTask[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('quick_tasks').select('*').order('created_at')
    setTasks(data ?? [])
  }, [])

  useEffect(() => {
    load()
    const channel = supabase.channel(channelId('quick-tasks'))
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_tasks' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const addTask = async (name: string) => {
    const tempId = crypto.randomUUID()
    const newTask: QuickTask = { id: tempId, name, completed: false, created_at: new Date().toISOString() }
    setTasks(prev => [...prev, newTask])
    const { data } = await supabase.from('quick_tasks').insert({ name, completed: false }).select().single()
    if (data) setTasks(prev => prev.map(t => t.id === tempId ? data : t))
  }
  const toggleTask = async (id: string, completed: boolean) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t))
    await supabase.from('quick_tasks').update({ completed: !completed }).eq('id', id)
  }
  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('quick_tasks').delete().eq('id', id)
  }
  const clearCompleted = async () => {
    setTasks(prev => prev.filter(t => !t.completed))
    await supabase.from('quick_tasks').delete().eq('completed', true)
  }
  const clearAll = async () => {
    setTasks([])
    await supabase.from('quick_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }

  return { tasks, addTask, toggleTask, deleteTask, clearCompleted, clearAll }
}

// ── Activities admin ──────────────────────────────────────────────────────────
export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('activities').select('*').order('sort_order')
    setActivities(data ?? [])
  }, [])

  useEffect(() => {
    load()
    const channel = supabase.channel(channelId('activities-admin'))
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const addActivity = async (name: string, icon: string) => {
    await supabase.from('activities').insert({ name, icon, sort_order: Date.now(), is_active: true })
  }
  const toggleActivity = async (id: string, is_active: boolean) => {
    await supabase.from('activities').update({ is_active: !is_active }).eq('id', id)
  }
  const deleteActivity = async (id: string) => {
    await supabase.from('activities').delete().eq('id', id)
  }

  return { activities, addActivity, toggleActivity, deleteActivity }
}
