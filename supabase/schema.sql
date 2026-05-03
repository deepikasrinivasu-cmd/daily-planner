-- Stores (Costco, Walmart, Indifresh, etc.)
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

-- Grocery items per store
create table if not exists grocery_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  name text not null,
  checked boolean default false,
  created_at timestamptz default now()
);

-- Activity templates (the recurring daily tasks)
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '⭐',
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Daily task instances (one per activity per day)
create table if not exists daily_tasks (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references activities(id) on delete cascade,
  date date not null default current_date,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(activity_id, date)
);

-- Bounty rewards
create table if not exists bounties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '🏆',
  threshold int not null default 100,
  color text not null default '#f59e0b',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Family calendar events
create table if not exists family_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  time text not null,
  date date not null,
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

-- Enable realtime on all tables
alter publication supabase_realtime add table stores;
alter publication supabase_realtime add table grocery_items;
alter publication supabase_realtime add table activities;
alter publication supabase_realtime add table daily_tasks;
alter publication supabase_realtime add table bounties;
alter publication supabase_realtime add table family_events;

-- Seed default stores
insert into stores (name, color) values
  ('Costco', '#e63946'),
  ('Walmart', '#2563eb'),
  ('Indifresh', '#16a34a')
on conflict do nothing;

-- Seed default activities
insert into activities (name, icon, sort_order) values
  ('Wake up & brush teeth', '🪥', 1),
  ('Make bed', '🛏️', 2),
  ('Eat breakfast', '🥞', 3),
  ('Get dressed', '👕', 4),
  ('Do homework', '📚', 5),
  ('Reading time', '📖', 6),
  ('Tidy room', '🧹', 7),
  ('Bath time', '🛁', 8),
  ('Bedtime routine', '😴', 9)
on conflict do nothing;

-- Seed default bounties
insert into bounties (name, icon, threshold, color, sort_order) values
  ('30 min Screen Time', '📱', 30, '#3b82f6', 1),
  ('Protein Bar', '🍫', 50, '#f59e0b', 2),
  ('30 min Playtime', '⚽', 70, '#22c55e', 3),
  ('Choose Dinner', '🍕', 90, '#ec4899', 4),
  ('Movie Night', '🎬', 100, '#8b5cf6', 5)
on conflict do nothing;
