-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- players is always queried by coach_id
create index if not exists players_coach on public.players (coach_id);

-- lessons cross-filtered by player
create index if not exists lessons_coach_player on public.lessons (coach_id, player_id);

-- ─── Lessons: session duration tracking ───────────────────────────────────────

alter table public.lessons
  add column if not exists duration_minutes integer
    check (duration_minutes is null or duration_minutes > 0);

-- ─── RLS: replace broad "for all" with explicit per-operation policies ─────────

-- Profiles
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Players
drop policy if exists "Coaches can manage their own players" on public.players;

create policy "players_select_own"
  on public.players for select
  using (auth.uid() = coach_id);

create policy "players_insert_own"
  on public.players for insert
  with check (
    auth.uid() = coach_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'coach'
    )
  );

create policy "players_update_own"
  on public.players for update
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create policy "players_delete_own"
  on public.players for delete
  using (auth.uid() = coach_id);

-- Lessons
drop policy if exists "Coaches can manage their own lessons" on public.lessons;

create policy "lessons_select_own"
  on public.lessons for select
  using (auth.uid() = coach_id);

create policy "lessons_insert_own"
  on public.lessons for insert
  with check (
    auth.uid() = coach_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'coach'
    )
  );

create policy "lessons_update_own"
  on public.lessons for update
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create policy "lessons_delete_own"
  on public.lessons for delete
  using (auth.uid() = coach_id);

-- ─── Realtime ─────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.lessons;
