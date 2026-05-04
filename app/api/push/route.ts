import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { endpoint, p256dh, auth } = await req.json()
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  await supabase
    .from('push_subscriptions')
    .upsert({ endpoint, p256dh, auth_key: auth }, { onConflict: 'endpoint' })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json()
  if (endpoint) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  }
  return NextResponse.json({ ok: true })
}
