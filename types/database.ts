export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      stores: {
        Row: { id: string; name: string; color: string; created_at: string }
        Insert: { id?: string; name: string; color: string; created_at?: string }
        Update: { id?: string; name?: string; color?: string; created_at?: string }
        Relationships: []
      }
      grocery_items: {
        Row: { id: string; store_id: string; name: string; checked: boolean; created_at: string }
        Insert: { id?: string; store_id: string; name: string; checked?: boolean; created_at?: string }
        Update: { id?: string; store_id?: string; name?: string; checked?: boolean; created_at?: string }
        Relationships: []
      }
      activities: {
        Row: { id: string; name: string; icon: string; sort_order: number; is_active: boolean; created_at: string }
        Insert: { id?: string; name: string; icon: string; sort_order?: number; is_active?: boolean; created_at?: string }
        Update: { id?: string; name?: string; icon?: string; sort_order?: number; is_active?: boolean; created_at?: string }
        Relationships: []
      }
      daily_tasks: {
        Row: { id: string; activity_id: string; date: string; completed: boolean; completed_at: string | null; created_at: string }
        Insert: { id?: string; activity_id: string; date: string; completed?: boolean; completed_at?: string | null; created_at?: string }
        Update: { id?: string; activity_id?: string; date?: string; completed?: boolean; completed_at?: string | null; created_at?: string }
        Relationships: []
      }
      bounties: {
        Row: { id: string; name: string; icon: string; threshold: number; color: string; sort_order: number; created_at: string }
        Insert: { id?: string; name: string; icon: string; threshold: number; color: string; sort_order?: number; created_at?: string }
        Update: { id?: string; name?: string; icon?: string; threshold?: number; color?: string; sort_order?: number; created_at?: string }
        Relationships: []
      }
      family_events: {
        Row: { id: string; title: string; time: string; date: string; color: string; created_at: string }
        Insert: { id?: string; title: string; time: string; date: string; color: string; created_at?: string }
        Update: { id?: string; title?: string; time?: string; date?: string; color?: string; created_at?: string }
        Relationships: []
      }
      quick_tasks: {
        Row: { id: string; name: string; completed: boolean; created_at: string }
        Insert: { id?: string; name: string; completed?: boolean; created_at?: string }
        Update: { id?: string; name?: string; completed?: boolean; created_at?: string }
        Relationships: []
      }
      daily_completions: {
        Row: { date: string }
        Insert: { date: string }
        Update: { date?: string }
        Relationships: []
      }
      push_subscriptions: {
        Row: { id: string; endpoint: string; p256dh: string; auth_key: string; created_at: string }
        Insert: { id?: string; endpoint: string; p256dh: string; auth_key: string; created_at?: string }
        Update: { id?: string; endpoint?: string; p256dh?: string; auth_key?: string; created_at?: string }
        Relationships: []
      }
      coin_ledger: {
        Row: { id: string; amount: number; reason: string; activity_id: string | null; created_at: string }
        Insert: { id?: string; amount: number; reason: string; activity_id?: string | null; created_at?: string }
        Update: { id?: string; amount?: number; reason?: string; activity_id?: string | null; created_at?: string }
        Relationships: []
      }
      dog_state: {
        Row: { id: number; last_action: string | null; last_action_at: string | null; secrets_seen: number[] }
        Insert: { id?: number; last_action?: string | null; last_action_at?: string | null; secrets_seen?: number[] }
        Update: { id?: number; last_action?: string | null; last_action_at?: string | null; secrets_seen?: number[] }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Store = Database['public']['Tables']['stores']['Row']
export type GroceryItem = Database['public']['Tables']['grocery_items']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type DailyTask = Database['public']['Tables']['daily_tasks']['Row']
export type Bounty = Database['public']['Tables']['bounties']['Row']
export type FamilyEvent = Database['public']['Tables']['family_events']['Row']
export type QuickTask = Database['public']['Tables']['quick_tasks']['Row']
export type CoinLedgerRow = Database['public']['Tables']['coin_ledger']['Row']
export type DogState = Database['public']['Tables']['dog_state']['Row']
