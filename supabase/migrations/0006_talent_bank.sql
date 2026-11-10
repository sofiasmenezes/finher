-- Talent bank: members choose to show a profile (and, separately, their CV link)
-- to leaders of the financial market who were approved by the FinHer team.
-- Nothing is visible by default. Also lets members recommend authors as materials.

-- Community materials: new type "author".
alter table public.material_recommendations drop constraint if exists material_recommendations_type_check;
alter table public.material_recommendations
  add constraint material_recommendations_type_check
  check (type in ('book','podcast','course','video','author','newsletter','article','other'));

-- Leaders who asked to search the bank. The team approves a request by setting
-- status = 'approved' in the dashboard (service role); members cannot change it.
create table if not exists public.talent_recruiters (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  company text not null check (char_length(company) between 2 and 120),
  role text not null check (char_length(role) between 2 and 120),
  linkedin_url text not null default '' check (char_length(linkedin_url) <= 300),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.talent_recruiters enable row level security;

create policy "recruiters: owner can read" on public.talent_recruiters
  for select to authenticated using (auth.uid() = user_id);
create policy "recruiters: owner can request" on public.talent_recruiters
  for insert to authenticated with check (auth.uid() = user_id and status = 'pending' and reviewed_at is null);
create policy "recruiters: owner can withdraw" on public.talent_recruiters
  for delete to authenticated using (auth.uid() = user_id);

create or replace function public.is_approved_recruiter()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.talent_recruiters where user_id = auth.uid() and status = 'approved');
$$;

-- Her talent-bank profile. Only she can read or change the row directly.
create table if not exists public.talent_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  visible boolean not null default false,
  share_cv boolean not null default false,
  name text not null check (char_length(name) between 2 and 80),
  headline text not null check (char_length(headline) between 2 and 160),
  city text not null default '' check (char_length(city) <= 80),
  career_stage text not null check (career_stage in ('exploring','internship','earlyCareer','transition','newcomer','growing','returning')),
  areas text[] not null check (cardinality(areas) between 1 and 9),
  program text not null default '' check (program in ('','economics','business','accounting','finance','intlTrade','engineering','other')),
  education text not null default '' check (char_length(education) <= 160),
  graduation_year int check (graduation_year between 1960 and 2040),
  languages text[] not null default '{}' check (cardinality(languages) <= 6),
  certifications text[] not null default '{}' check (cardinality(certifications) <= 8),
  availability text[] not null default '{}' check (cardinality(availability) <= 5),
  work_modes text[] not null default '{}' check (cardinality(work_modes) <= 3),
  about text not null default '' check (char_length(about) <= 800),
  linkedin_url text not null default '' check (linkedin_url = '' or linkedin_url ~ '^https://'),
  cv_url text not null default '' check (cv_url = '' or cv_url ~ '^https://'),
  contact_email text not null default '' check (char_length(contact_email) <= 160),
  updated_at timestamptz not null default now()
);

alter table public.talent_profiles enable row level security;

create policy "talent: owner can read" on public.talent_profiles
  for select to authenticated using (auth.uid() = user_id);
create policy "talent: owner can insert" on public.talent_profiles
  for insert to authenticated with check (auth.uid() = user_id);
create policy "talent: owner can update" on public.talent_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "talent: owner can delete" on public.talent_profiles
  for delete to authenticated using (auth.uid() = user_id);

-- What approved leaders see: visible profiles only, CV link blanked unless shared.
-- Anyone else gets no rows.
create or replace function public.search_talents()
returns table (
  user_id uuid,
  visible boolean,
  share_cv boolean,
  name text,
  headline text,
  city text,
  career_stage text,
  areas text[],
  program text,
  education text,
  graduation_year int,
  languages text[],
  certifications text[],
  availability text[],
  work_modes text[],
  about text,
  linkedin_url text,
  cv_url text,
  contact_email text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select t.user_id, t.visible, t.share_cv, t.name, t.headline, t.city, t.career_stage, t.areas, t.program,
         t.education, t.graduation_year, t.languages, t.certifications, t.availability, t.work_modes, t.about,
         t.linkedin_url, case when t.share_cv then t.cv_url else '' end, t.contact_email, t.updated_at
  from public.talent_profiles t
  where t.visible and public.is_approved_recruiter()
  order by t.updated_at desc
  limit 500;
$$;

revoke all on function public.search_talents() from public, anon;
grant execute on function public.search_talents() to authenticated;
revoke all on function public.is_approved_recruiter() from public, anon;
grant execute on function public.is_approved_recruiter() to authenticated;
