-- ─── Remove role-check subquery from INSERT policies ─────────────────────────
-- The exists(select from profiles where role='coach') guard in players,
-- lessons, and conversations INSERT policies causes RLS violations: the nested
-- SELECT on profiles can return nothing if the profile was created without
-- role metadata, or if RLS evaluation order causes the subquery to see an
-- empty set. The coach_id = auth.uid() check alone is sufficient — it ensures
-- a user can only create rows linked to themselves.

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
