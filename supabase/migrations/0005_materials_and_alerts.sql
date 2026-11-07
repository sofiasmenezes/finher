-- Material recommendations (books, podcasts, courses…) shared with the community,
-- and each member's private alert settings for the opportunity calendar.

create table if not exists public.material_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default '' check (char_length(author_name) <= 60),
  title text not null check (char_length(title) between 2 and 160),
  creator text not null default '' check (char_length(creator) <= 120),
  type text not null check (type in ('book','podcast','course','video','newsletter','article','other')),
  topics text[] not null check (cardinality(topics) between 1 and 8),
  url text not null default '' check (char_length(url) <= 300),
  comment text not null default '' check (char_length(comment) <= 600),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists material_recommendations_created_idx on public.material_recommendations (created_at desc);

alter table public.material_recommendations enable row level security;

create policy "materials: members can read visible" on public.material_recommendations
  for select to authenticated using (not hidden or auth.uid() = user_id);
create policy "materials: author can insert" on public.material_recommendations
  for insert to authenticated with check (auth.uid() = user_id and hidden = false);
create policy "materials: author can delete" on public.material_recommendations
  for delete to authenticated using (auth.uid() = user_id);

-- Alert settings: owner-only, like every other personal table.
create table if not exists public.opportunity_alerts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  seen text[] not null default '{}' check (cardinality(seen) <= 500),
  updated_at timestamptz not null default now()
);

alter table public.opportunity_alerts enable row level security;

create policy "alerts: owner can read" on public.opportunity_alerts
  for select using (auth.uid() = user_id);
create policy "alerts: owner can insert" on public.opportunity_alerts
  for insert with check (auth.uid() = user_id);
create policy "alerts: owner can update" on public.opportunity_alerts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
