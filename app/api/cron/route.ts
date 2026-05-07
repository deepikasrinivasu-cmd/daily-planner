import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:family@familyhq.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function sendToAll(title: string, body: string) {
  const { data: subs } = await supabase.from('push_subscriptions').select('*')
  if (!subs || subs.length === 0) return
  await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
        JSON.stringify({ title, body, icon: '/icon' })
      ).catch(async (err) => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        }
      })
    )
  )
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // All time logic in America/New_York (EST/EDT auto-handled)
  const nyNow     = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const hour      = nyNow.getHours()
  const dayOfWeek = nyNow.getDay()           // 0=Sun … 6=Sat
  const todayStr  = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const tomorrowStr = (() => {
    const d = new Date(nyNow); d.setDate(d.getDate() + 1)
    return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  })()

  // Cron fires at 13:00 UTC = 8 AM EST / 9 AM EDT
  if (hour === 8 || hour === 9) {
    const { data: events } = await supabase.from('family_events').select('*')
      .in('date', [todayStr, tomorrowStr]).order('date').order('time')

    if (events && events.length > 0) {
      const lines = events.map((e) => {
        const label = e.date === todayStr ? 'Today' : 'Tomorrow'
        return `${label}: ${e.title} at ${e.time}`
      })
      await sendToAll('📅 Family Schedule', lines.join('\n'))
    } else {
      await sendToAll('🌅 Good morning, Family HQ!', "Time to check today's missions and plan the day!")
    }
  }

  // Cron fires at 21:00 UTC = 4 PM EST / 5 PM EDT  Mon/Wed/Fri
  if ((hour === 16 || hour === 17) && (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5)) {
    const groceryQuips = [
      "🛒 The fridge is judging you. It's empty and disappointed.",
      "🥦 Quick! Before someone eats the last of everything again!",
      "🍕 Pizza doesn't buy itself. Update the grocery list!",
      "🛒 Your fridge called. It's lonely and needs restocking.",
      "🥛 Milk check! Is it still there... or gone again?",
      "🍌 The bananas have feelings. Don't forget them this week.",
      "🧀 Cheese emergency possible. Please verify immediately.",
      "🍎 An apple a day — but only if you actually buy them!",
      "🛒 Someone ate the last biscuit. You know who you are.",
      "🥚 Egg situation: critical. Proceed to grocery list ASAP.",
      "🍞 Bread status unknown. Investigation required.",
      "🧃 Juice boxes running low. Kid alert incoming!",
      "🛒 The grocery list is sad and lonely. Give it some love!",
      "🐶 Even Shizu the space dog needs snacks. Stock up!",
    ]
    const idx = nyNow.getDate() % groceryQuips.length
    await sendToAll('🛒 Grocery Time!', groceryQuips[idx])
  }

  return NextResponse.json({ ok: true, hour, dayOfWeek, todayStr })
}
