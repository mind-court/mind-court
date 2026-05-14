-- Enhancement on top of 004_messages.sql
-- Adds: trigger for last_message sync, explicit per-op RLS, unique index, realtime.

-- ─── Conversations: unique index for player_id-based deduplication ────────────
-- Partial because player_id can be null (NULL != NULL in unique constraints).
create unique index if not exists conversations_coach_player_unique
  on public.conversations (coach_id, player_id)
  where player_id is not null;


-- ─── Trigger: keep last_message/last_message_at in sync ──────────────────────

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

drop trigger if exists on_message_inserted on public.messages;
create trigger on_message_inserted
  after insert on public.messages
  for each row execute procedure public.sync_conversation_last_message();


-- ─── RLS: replace broad "for all" with explicit per-op policies ──────────────

-- Conversations
drop policy if exists "Coaches can manage their conversations" on public.conversations;

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


-- Messages: add a delete policy (404_messages.sql only added select + insert)
create policy "messages_delete"
  on public.messages for delete
  using (auth.uid() = sender_id);


-- ─── Realtime ─────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
