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
        // Remove expired/invalid subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        }
      })
    )
  )
}

export async function GET(req: NextRequest) {
  // Protect the cron endpoint
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const hour = now.getUTCHours()
  const dayOfWeek = now.getUTCDay() // 0=Sun, 1=Mon...

  // Morning (8 AM UTC): always send a morning nudge, include events if any
  if (hour === 8) {
    const todayStr = now.toISOString().split('T')[0]
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { data: events } = await supabase
      .from('family_events')
      .select('*')
      .in('date', [todayStr, tomorrowStr])
      .order('date')
      .order('time')

    if (events && events.length > 0) {
      const lines = events.map((e) => {
        const label = e.date === todayStr ? 'Today' : 'Tomorrow'
        return `${label}: ${e.title} at ${e.time}`
      })
      await sendToAll('📅 Family Schedule', lines.join('\n'))
    } else {
      // Always send something in the morning so the notification fires reliably
      await sendToAll('🌅 Good morning, Family HQ!', "Time to check today's missions and plan the day!")
    }
  }

  // Afternoon (5 PM UTC): grocery reminder Mon/Wed/Fri
  if (hour === 17 && (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5)) {
    await sendToAll('🛒 Grocery Reminder', "Don't forget to check and update the family grocery list!")
  }

  return NextResponse.json({ ok: true, hour, dayOfWeek })
}
