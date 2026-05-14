-- ─── Messages ─────────────────────────────────────────────────────────────────
-- Coach ↔ player messaging threads. Players don't have auth accounts yet, so
-- only coaches can write for now; the schema is ready for player replies later.

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  player_id   uuid not null references public.players(id) on delete cascade,
  body        text not null
    check (char_length(body) > 0 and char_length(body) <= 2000),
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages_coach_select"
  on public.messages for select
  using (auth.uid() = coach_id);

create policy "messages_coach_insert"
  on public.messages for insert
  with check (
    auth.uid() = coach_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'coach'
    )
  );

create policy "messages_coach_delete"
  on public.messages for delete
  using (auth.uid() = coach_id);

-- Ordered thread queries
create index if not exists messages_thread
  on public.messages (coach_id, player_id, created_at);

-- ─── Realtime ─────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.messages;
