-- ─── Drill completions ────────────────────────────────────────────────────────
-- Persists which drills were completed per lesson so state survives navigation.

create table if not exists public.drill_completions (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  coach_id     uuid not null references public.profiles(id) on delete cascade,
  drill_index  integer not null check (drill_index >= 0),
  completed_at timestamptz not null default now(),
  unique (lesson_id, drill_index)
);

alter table public.drill_completions enable row level security;

create policy "drill_completions_coach_select"
  on public.drill_completions for select
  using (auth.uid() = coach_id);

create policy "drill_completions_coach_insert"
  on public.drill_completions for insert
  with check (
    auth.uid() = coach_id
    and exists (
      select 1 from public.lessons
      where id = lesson_id and coach_id = auth.uid()
    )
  );

create policy "drill_completions_coach_delete"
  on public.drill_completions for delete
  using (auth.uid() = coach_id);

create index if not exists drill_completions_lesson
  on public.drill_completions (lesson_id);
