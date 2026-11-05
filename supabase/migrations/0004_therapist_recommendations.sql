-- Psychologist recommendations shared with the community.
-- Unlike saved situations, these are meant to be seen by other members:
-- any signed-in member can read them, only the author can add or delete hers.
-- No free text about the member's own situation is stored, only the themes
-- the professional helped with and a short comment the author chooses to share.

create table if not exists public.therapist_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default '' check (char_length(author_name) <= 60),
  therapist_name text not null check (char_length(therapist_name) between 2 and 120),
  crp text not null default '' check (char_length(crp) <= 40),
  modality text not null check (modality in ('online','inPerson','both')),
  city text not null default '' check (char_length(city) <= 80),
  price text not null check (price in ('free','social','private','insurance')),
  contact text not null default '' check (char_length(contact) <= 200),
  themes text[] not null check (cardinality(themes) between 1 and 11),
  comment text not null default '' check (char_length(comment) <= 600),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists therapist_recommendations_created_idx on public.therapist_recommendations (created_at desc);

alter table public.therapist_recommendations enable row level security;

-- Moderators hide a recommendation by setting hidden = true (service role).
create policy "therapists: members can read visible" on public.therapist_recommendations
  for select to authenticated using (not hidden or auth.uid() = user_id);
create policy "therapists: author can insert" on public.therapist_recommendations
  for insert to authenticated with check (auth.uid() = user_id and hidden = false);
create policy "therapists: author can delete" on public.therapist_recommendations
  for delete to authenticated using (auth.uid() = user_id);
