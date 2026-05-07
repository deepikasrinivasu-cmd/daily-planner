'use client'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Activity, DailyTask, Bounty, Store, GroceryItem, FamilyEvent, QuickTask, DogState } from '@/types/database'

const COINS_PER_TASK      = 2
const COINS_ALL_DONE_BONUS = 5

// ── Date helpers (all EST/EDT-aware) ──────────────────────────────────────────
function today(): string {
  // Returns YYYY-MM-DD in America/New_York — handles EST and EDT automatically
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

function todayStart(): string {
  return `${today()}T00:00:00`
}

function getWeekStart(): string {
  // Monday of the current week, in New York time
  const nyDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day  = nyDate.getDay()
  const diff = nyDate.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(nyDate.getFullYear(), nyDate.getMonth(), diff)
  return monday.toLocaleDateString('en-CA')
}

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

// ── Mystery box (exported standalone) ────────────────────────────────────────
export async function checkMysteryBox(): Promise<boolean> {
  const { data } = await supabase
    .from('coin_ledger').select('id')
    .eq('reason', 'mystery_box')
    .gte('created_at', `${getWeekStart()}T00:00:00`)
    .limit(1)
  return !data || data.length === 0
}

export async function claimMysteryBox(): Promise<number> {
  const roll   = Math.random()
  const amount = roll < 0.50 ? Math.floor(Math.random() * 3) + 1
               : roll < 0.85 ? Math.floor(Math.random() * 3) + 4
               :                Math.floor(Math.random() * 4) + 7
  await supabase.from('coin_ledger').insert({ amount, reason: 'mystery_box' })
  return amount
}

function channelId(name: string) {
  return `${name}-${Math.random().toString(36).slice(2)}`
}

// ── Kid tracker ───────────────────────────────────────────────────────────────
export function useKidTracker() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [tasks,      setTasks]      = useState<DailyTask[]>([])
  const [loading,    setLoading]    = useState(true)
  const [streak,     setStreak]     = useState(0)
  const dateRef = useRef(today())

  const loadData = useCallback(async () => {
    const date = today()
    const [{ data: acts }, { data: existingTasks }] = await Promise.all([
      supabase.from('activities').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('daily_tasks').select('*').eq('date', date),
    ])
    const activeActs = acts ?? []
    const existing   = existingTasks ?? []
    const existingIds = new Set(existing.map((t) => t.activity_id))
    const toCreate    = activeActs.filter((a) => !existingIds.has(a.id))
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
    calcStreak().then(setStreak)
  }, [])

  // Auto-reset on new day (handles midnight + iOS wake)
  useEffect(() => {
    const checkDate = () => {
      const now = today()
      if (now !== dateRef.current) { dateRef.current = now; loadData() }
    }
    document.addEventListener('visibilitychange', checkDate)
    const timer = setInterval(checkDate, 30_000)
    return () => { document.removeEventListener('visibilitychange', checkDate); clearInterval(timer) }
  }, [loadData])

  useEffect(() => {
    loadData()
    const channel = supabase.channel(channelId('kid-tracker'))
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_tasks' },  loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' },   loadData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  const completeTask = useCallback(async (activityId: string): Promise<{ lucky: boolean }> => {
    const date = today()
    await supabase.from('daily_tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('activity_id', activityId).eq('date', date)
    await supabase.from('coin_ledger').insert({ amount: COINS_PER_TASK, reason: 'task_complete', activity_id: activityId })
    const lucky = Math.random() < 0.2
    if (lucky) {
      await supabase.from('coin_ledger').insert({ amount: 1, reason: 'lucky_coin', activity_id: activityId })
    }
    await loadData()
    return { lucky }
  }, [loadData])

  const uncompleteTask = useCallback(async (activityId: string) => {
    const date = today()
    await supabase.from('daily_tasks')
      .update({ completed: false, completed_at: null })
      .eq('activity_id', activityId).eq('date', date)
    // Deduct task coins earned today for this activity
    await supabase.from('coin_ledger')
      .delete()
      .eq('activity_id', activityId)
      .in('reason', ['task_complete', 'lucky_coin'])
      .gte('created_at', todayStart())
    await loadData()
  }, [loadData])

  const addBonusCoins = useCallback(async (amount: number, reason: string) => {
    await supabase.from('coin_ledger').insert({ amount, reason })
  }, [])

  const resetTasks = useCallback(async () => {
    const date = today()
    await supabase.from('daily_tasks').update({ completed: false, completed_at: null }).eq('date', date)
    await supabase.from('daily_completions').delete().eq('date', date)
    await loadData()
  }, [loadData])

  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks])
  const totalCount     = useMemo(() => tasks.length, [tasks])
  const percent        = useMemo(() => totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0, [completedCount, totalCount])

  // Auto-mark/unmark daily completion + all-done bonus
  const prevPercent = useRef(percent)
  useEffect(() => {
    if (loading || totalCount === 0) return
    if (percent === 100 && prevPercent.current < 100) {
      supabase.from('daily_completions').upsert({ date: today() }, { onConflict: 'date' }).then(async () => {
        const { data: existing } = await supabase.from('coin_ledger').select('id')
          .eq('reason', 'all_done_bonus').gte('created_at', todayStart()).limit(1)
        if (!existing || existing.length === 0) {
          await supabase.from('coin_ledger').insert({ amount: COINS_ALL_DONE_BONUS, reason: 'all_done_bonus' })
        }
        calcStreak().then(setStreak)
      })
    } else if (percent < 100 && prevPercent.current === 100) {
      // Revoke daily completion + all-done bonus when a task is un-done
      supabase.from('daily_completions').delete().eq('date', today()).then(async () => {
        await supabase.from('coin_ledger').delete()
          .eq('reason', 'all_done_bonus').gte('created_at', todayStart())
        calcStreak().then(setStreak)
      })
    }
    prevPercent.current = percent
  }, [percent, loading, totalCount])

  return { activities, tasks, loading, completedCount, totalCount, percent, streak, completeTask, uncompleteTask, addBonusCoins, resetTasks }
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
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'bounties' }, load).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const addBounty = async (b: { name: string; icon: string; threshold: number; color: string }) => {
    const { error } = await supabase.from('bounties').insert({ ...b, sort_order: bounties.length })
    if (!error) load()
  }
  const updateBountyThreshold = async (id: string, threshold: number) => {
    await supabase.from('bounties').update({ threshold }).eq('id', id)
  }
  const deleteBounty = async (id: string) => {
    await supabase.from('bounties').delete().eq('id', id)
  }

  return { bounties, addBounty, updateBountyThreshold, deleteBounty }
}

// ── Stores & groceries ────────────────────────────────────────────────────────
export function useGroceries() {
  const [stores, setStores] = useState<Store[]>([])
  const [items,  setItems]  = useState<GroceryItem[]>([])

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' },        loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_items' }, loadAll)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadAll])

  const addStore    = async (name: string, color: string) => { await supabase.from('stores').insert({ name, color }) }
  const deleteStore = async (id: string)                  => { await supabase.from('stores').delete().eq('id', id) }
  const addItem     = async (storeId: string, name: string) => {
    await supabase.from('grocery_items').insert({ store_id: storeId, name, checked: false })
  }
  const toggleItem  = async (id: string, checked: boolean) => {
    await supabase.from('grocery_items').update({ checked: !checked }).eq('id', id)
  }
  const deleteItem  = async (id: string)         => { await supabase.from('grocery_items').delete().eq('id', id) }
  const wipeStore   = async (storeId: string)    => { await supabase.from('grocery_items').delete().eq('store_id', storeId) }
  const wipeChecked = async (storeId: string)    => {
    await supabase.from('grocery_items').delete().eq('store_id', storeId).eq('checked', true)
  }

  return { stores, items, addStore, deleteStore, addItem, toggleItem, deleteItem, wipeStore, wipeChecked }
}

// ── Family events ─────────────────────────────────────────────────────────────
export function useFamilyEvents() {
  const [events, setEvents] = useState<FamilyEvent[]>([])

  const loadEvents = useCallback(async () => {
    const { data } = await supabase.from('family_events').select('*')
      .gte('date', today()).order('date').order('time').limit(20)
    setEvents(data ?? [])
  }, [])

  useEffect(() => {
    loadEvents()
    const channel = supabase.channel(channelId('family-events'))
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'family_events' }, loadEvents).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadEvents])

  const addEvent    = async (e: { title: string; time: string; date: string; color: string }) => {
    await supabase.from('family_events').insert(e)
  }
  const deleteEvent = async (id: string) => { await supabase.from('family_events').delete().eq('id', id) }

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
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'quick_tasks' }, load).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const addTask = async (name: string) => {
    const tempId  = crypto.randomUUID()
    const newTask: QuickTask = { id: tempId, name, completed: false, created_at: new Date().toISOString() }
    setTasks(prev => [...prev, newTask])
    const { data } = await supabase.from('quick_tasks').insert({ name, completed: false }).select().single()
    if (data) setTasks(prev => prev.map(t => t.id === tempId ? data : t))
  }

  const toggleTask = async (id: string, completed: boolean) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t))
    await supabase.from('quick_tasks').update({ completed: !completed }).eq('id', id)
    if (!completed) {
      await supabase.from('coin_ledger').insert({ amount: 1, reason: 'quick_task' })
    }
  }

  const deleteTask      = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('quick_tasks').delete().eq('id', id)
  }
  const clearCompleted  = async () => {
    setTasks(prev => prev.filter(t => !t.completed))
    await supabase.from('quick_tasks').delete().eq('completed', true)
  }
  const clearAll        = async () => {
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
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, load).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const addActivity = async (name: string, icon: string) => {
    // Use activities.length as sort_order — avoids integer overflow from Date.now()
    const { error } = await supabase.from('activities').insert({
      name, icon, sort_order: activities.length, is_active: true,
    })
    if (!error) load()
  }
  const toggleActivity = async (id: string, is_active: boolean) => {
    await supabase.from('activities').update({ is_active: !is_active }).eq('id', id)
  }
  const deleteActivity = async (id: string) => {
    await supabase.from('activities').delete().eq('id', id)
  }

  return { activities, addActivity, toggleActivity, deleteActivity }
}

// ── Coins & dog state ─────────────────────────────────────────────────────────
export function useCoins() {
  const [totalCoins, setTotalCoins] = useState(0)
  const [dogState,   setDogState]   = useState<DogState | null>(null)
  const [loading,    setLoading]    = useState(true)

  const load = useCallback(async () => {
    const [{ data: ledger }, { data: dog }] = await Promise.all([
      supabase.from('coin_ledger').select('amount'),
      supabase.from('dog_state').select('*').eq('id', 1).single(),
    ])
    setTotalCoins(Math.max(0, (ledger ?? []).reduce((s, r) => s + r.amount, 0)))
    setDogState(dog)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase.channel(channelId('coins'))
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'coin_ledger' }, load)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'coin_ledger' }, load)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dog_state'   }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const spendCoins = useCallback(async (
    amount: number,
    reason: 'dog_treat' | 'dog_haircut' | 'dog_bath'
  ): Promise<boolean> => {
    if (totalCoins < amount) return false
    await supabase.from('coin_ledger').insert({ amount: -amount, reason })
    await supabase.from('dog_state').update({ last_action: reason, last_action_at: new Date().toISOString() }).eq('id', 1)
    await load()
    return true
  }, [totalCoins, load])

  const markSecretSeen = useCallback(async (index: number) => {
    if (!dogState) return
    const current = dogState.secrets_seen ?? []
    if (current.includes(index)) return
    await supabase.from('dog_state').update({ secrets_seen: [...current, index] }).eq('id', 1)
    await load()
  }, [dogState, load])

  const giveDiamond = useCallback(async () => {
    await supabase.from('dog_state').update({ diamonds: (dogState?.diamonds ?? 0) + 1 }).eq('id', 1)
    await load()
  }, [dogState, load])

  const changePin = useCallback(async (newPin: string) => {
    await supabase.from('dog_state').update({ pin: newPin }).eq('id', 1)
    await load()
  }, [load])

  const resetCoins = useCallback(async () => {
    await supabase.from('coin_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await load()
  }, [load])

  const resetDiamonds = useCallback(async () => {
    await supabase.from('dog_state').update({ diamonds: 0 }).eq('id', 1)
    await load()
  }, [load])

  const diamonds = dogState?.diamonds ?? 0
  const pin      = dogState?.pin ?? '8689'

  return {
    totalCoins, diamonds, pin, dogState, loading,
    spendCoins, markSecretSeen, giveDiamond, changePin,
    resetCoins, resetDiamonds, reload: load,
  }
}
