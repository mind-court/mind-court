-- ─── Idempotent catch-up for migrations that may have failed ──────────────────
-- Migration 009 referenced tables from an older schema (relationships, sessions,
-- etc.) that no longer exist, so it likely failed and took 010-012 with it.
-- This migration re-applies the important parts idempotently.

-- ─── From 010: revoke public execute on trigger functions ─────────────────────
do $$ begin
  revoke execute on function public.handle_new_user() from public;
exception when undefined_function then null;
end $$;

do $$ begin
  revoke execute on function public.sync_conversation_last_message() from public;
exception when undefined_function then null;
end $$;

-- ─── From 011: fix insert policies to drop coach-role subquery ────────────────

-- players
drop policy if exists "players_insert_own" on public.players;
create policy "players_insert_own"
  on public.players for insert
  with check ((select auth.uid()) = coach_id);

-- lessons
drop policy if exists "lessons_insert_own" on public.lessons;
create policy "lessons_insert_own"
  on public.lessons for insert
  with check ((select auth.uid()) = coach_id);

-- conversations
drop policy if exists "conversations_insert" on public.conversations;
create policy "conversations_insert"
  on public.conversations for insert
  with check ((select auth.uid()) = coach_id);

-- ─── From 012: add players to realtime publication ────────────────────────────
do $$ begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'players'
  ) then
    alter publication supabase_realtime add table public.players;
  end if;
end $$;
