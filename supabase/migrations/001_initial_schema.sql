-- ─── Profiles ─────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  role        text not null check (role in ('coach', 'player')),
  full_name   text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'coach'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── Players ──────────────────────────────────────────────────────────────────

create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.profiles on delete cascade,
  full_name   text not null,
  is_kid_mode boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.players enable row level security;

drop policy if exists "Coaches can manage their own players" on public.players;
create policy "Coaches can manage their own players"
  on public.players for all
  using (auth.uid() = coach_id);


-- ─── Lessons ──────────────────────────────────────────────────────────────────

create table if not exists public.lessons (
  id           uuid primary key default gen_random_uuid(),
  coach_id     uuid not null references public.profiles on delete cascade,
  player_id    uuid references public.players on delete set null,
  player_name  text not null default '',
  scheduled_at timestamptz not null,
  court        text,
  drills       text,
  mental_cue   text,
  created_at   timestamptz not null default now()
);

alter table public.lessons enable row level security;

drop policy if exists "Coaches can manage their own lessons" on public.lessons;
create policy "Coaches can manage their own lessons"
  on public.lessons for all
  using (auth.uid() = coach_id);

create index if not exists lessons_coach_scheduled on public.lessons (coach_id, scheduled_at);
