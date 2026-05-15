-- ─── 1. Enable RLS on public tables missing it ───────────────────────────────

-- default_templates / default_tags: read-only reference data seeded by admins.
-- Any signed-in user may read; no client-side writes allowed.
alter table public.default_templates enable row level security;
create policy "default_templates_authenticated_select"
  on public.default_templates for select
  to authenticated
  using (true);

alter table public.default_tags enable row level security;
create policy "default_tags_authenticated_select"
  on public.default_tags for select
  to authenticated
  using (true);

-- goal_updates: enable RLS. Access is restricted to authenticated users for now;
-- tighten to ownership-based policy once sessions schema is confirmed.
alter table public.goal_updates enable row level security;
create policy "goal_updates_authenticated"
  on public.goal_updates for all
  to authenticated
  using (true)
  with check (true);


-- ─── 2. Revoke public RPC access to internal SECURITY DEFINER functions ───────
-- These are trigger functions; no role should call them via the REST API.

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.sync_conversation_last_message() from anon, authenticated;


-- ─── 3. Fix auth_rls_initplan: (select auth.uid()) instead of auth.uid() ─────
-- Bare auth.uid() in a USING clause is re-evaluated for every row. Wrapping it
-- in a sub-select makes the planner treat it as a stable init-plan evaluated
-- once per statement — a meaningful speedup on large tables.

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- players
drop policy if exists "players_select_own" on public.players;
create policy "players_select_own"
  on public.players for select
  using ((select auth.uid()) = coach_id);

drop policy if exists "players_insert_own" on public.players;
create policy "players_insert_own"
  on public.players for insert
  with check (
    (select auth.uid()) = coach_id
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'coach'
    )
  );

drop policy if exists "players_update_own" on public.players;
create policy "players_update_own"
  on public.players for update
  using ((select auth.uid()) = coach_id)
  with check ((select auth.uid()) = coach_id);

drop policy if exists "players_delete_own" on public.players;
create policy "players_delete_own"
  on public.players for delete
  using ((select auth.uid()) = coach_id);

-- lessons
drop policy if exists "lessons_select_own" on public.lessons;
create policy "lessons_select_own"
  on public.lessons for select
  using ((select auth.uid()) = coach_id);

drop policy if exists "lessons_insert_own" on public.lessons;
create policy "lessons_insert_own"
  on public.lessons for insert
  with check (
    (select auth.uid()) = coach_id
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'coach'
    )
  );

drop policy if exists "lessons_update_own" on public.lessons;
create policy "lessons_update_own"
  on public.lessons for update
  using ((select auth.uid()) = coach_id)
  with check ((select auth.uid()) = coach_id);

drop policy if exists "lessons_delete_own" on public.lessons;
create policy "lessons_delete_own"
  on public.lessons for delete
  using ((select auth.uid()) = coach_id);

-- conversations
drop policy if exists "conversations_select" on public.conversations;
create policy "conversations_select"
  on public.conversations for select
  using ((select auth.uid()) = coach_id);

drop policy if exists "conversations_insert" on public.conversations;
create policy "conversations_insert"
  on public.conversations for insert
  with check (
    (select auth.uid()) = coach_id
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'coach'
    )
  );

drop policy if exists "conversations_update" on public.conversations;
create policy "conversations_update"
  on public.conversations for update
  using ((select auth.uid()) = coach_id)
  with check ((select auth.uid()) = coach_id);

drop policy if exists "conversations_delete" on public.conversations;
create policy "conversations_delete"
  on public.conversations for delete
  using ((select auth.uid()) = coach_id);

-- messages
drop policy if exists "messages_select" on public.messages;
create policy "messages_select"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.coach_id = (select auth.uid())
    )
  );

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert"
  on public.messages for insert
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.coach_id = (select auth.uid())
    )
  );

drop policy if exists "messages_delete" on public.messages;
create policy "messages_delete"
  on public.messages for delete
  using ((select auth.uid()) = sender_id);

-- drill_completions
drop policy if exists "drill_completions_coach_select" on public.drill_completions;
create policy "drill_completions_coach_select"
  on public.drill_completions for select
  using ((select auth.uid()) = coach_id);

drop policy if exists "drill_completions_coach_insert" on public.drill_completions;
create policy "drill_completions_coach_insert"
  on public.drill_completions for insert
  with check (
    (select auth.uid()) = coach_id
    and exists (
      select 1 from public.lessons
      where id = lesson_id and coach_id = (select auth.uid())
    )
  );

drop policy if exists "drill_completions_coach_delete" on public.drill_completions;
create policy "drill_completions_coach_delete"
  on public.drill_completions for delete
  using ((select auth.uid()) = coach_id);
