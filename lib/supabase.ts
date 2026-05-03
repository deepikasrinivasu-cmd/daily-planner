import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

let _client: SupabaseClient<Database> | null = null

export function getSupabase(): SupabaseClient<Database> {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  _client = createClient<Database>(url, key)
  return _client
}

// Named export for convenience — safe to import everywhere; initialization
// is deferred until first call (client-side only at runtime).
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return (getSupabase() as never)[prop]
  },
})
