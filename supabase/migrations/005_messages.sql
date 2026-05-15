-- ─── Conversations + Messages ─────────────────────────────────────────────────
-- Drops any stale tables from earlier dev iterations before creating the
-- correct schema.

drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;

-- ─── Conversations ────────────────────────────────────────────────────────────

create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid not null references public.profiles on delete cascade,
  player_name     text not null,
  player_id       uuid references public.players on delete set null,
  last_message    text,
  last_message_at timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "conversations_select"
  on public.conversations for select
  using (auth.uid() = coach_id);

create policy "conversations_insert"
  on public.conversations for insert
  with check (
    auth.uid() = coach_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'coach'
    )
  );

create policy "conversations_update"
  on public.conversations for update
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create policy "conversations_delete"
  on public.conversations for delete
  using (auth.uid() = coach_id);

-- Partial unique index: one conversation per coach-player pair (when player is known)
create unique index conversations_coach_player_unique
  on public.conversations (coach_id, player_id)
  where player_id is not null;

create index conversations_coach
  on public.conversations (coach_id, last_message_at desc);

-- ─── Messages ─────────────────────────────────────────────────────────────────

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  sender_id       uuid not null references public.profiles on delete cascade,
  sender_name     text not null,
  content         text not null
    check (char_length(content) > 0 and char_length(content) <= 2000),
  created_at      timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages_select"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.coach_id = auth.uid()
    )
  );

create policy "messages_insert"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.coach_id = auth.uid()
    )
  );

create policy "messages_delete"
  on public.messages for delete
  using (auth.uid() = sender_id);

create index messages_conversation
  on public.messages (conversation_id, created_at);

-- ─── Trigger: keep last_message / last_message_at in sync ────────────────────

create or replace function public.sync_conversation_last_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
  set last_message    = new.content,
      last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_inserted
  after insert on public.messages
  for each row execute procedure public.sync_conversation_last_message();

-- ─── Realtime ─────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
