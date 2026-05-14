-- ─── Conversations ────────────────────────────────────────────────────────────

create table public.conversations (
  id                 uuid primary key default gen_random_uuid(),
  coach_id           uuid not null references public.profiles on delete cascade,
  player_name        text not null,
  player_id          uuid references public.players on delete set null,
  last_message       text,
  last_message_at    timestamptz,
  created_at         timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "Coaches can manage their conversations"
  on public.conversations for all
  using (auth.uid() = coach_id);

create index conversations_coach on public.conversations (coach_id, last_message_at desc);

-- ─── Messages ─────────────────────────────────────────────────────────────────

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations on delete cascade,
  sender_id        uuid not null references public.profiles on delete cascade,
  sender_name      text not null,
  content          text not null,
  created_at       timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Conversation members can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and c.coach_id = auth.uid()
    )
  );

create policy "Conversation members can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and c.coach_id = auth.uid()
    )
  );

create index messages_conversation on public.messages (conversation_id, created_at asc);
