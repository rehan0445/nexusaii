-- Create announcement_threads table
create table if not exists announcement_threads (
  id uuid primary key default gen_random_uuid(),
  announcement_id text not null,
  parent_id uuid null,
  content text not null,
  author_id text not null,
  author_name text,
  author_role text,
  likes int not null default 0,
  created_at timestamp with time zone not null default now()
);

-- Create urgent_broadcasts table
create table if not exists urgent_broadcasts (
  id text primary key,
  title text not null,
  content text not null,
  urgency_level text not null,
  broadcast_type text not null,
  is_active boolean not null default true,
  author_id text not null,
  author_name text,
  author_role text,
  created_at timestamp with time zone not null default now()
);

-- Enable RLS and restrict writes to service role only
alter table announcement_threads enable row level security;
alter table urgent_broadcasts enable row level security;

-- Policies: allow all read; service role write only
do $$ begin
  create policy announcement_threads_read on announcement_threads for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy urgent_broadcasts_read on urgent_broadcasts for select using (true);
exception when duplicate_object then null; end $$;

-- Service role write policy placeholder (enforced via Supabase service key at API layer)

