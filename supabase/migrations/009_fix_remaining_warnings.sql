-- ─── 1. Fix function search paths ────────────────────────────────────────────
-- Recreate both trigger functions with an explicit set search_path so the
-- planner cannot be tricked into resolving unqualified names against an
-- attacker-controlled search_path.

create or replace function public.update_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_equipment_usage()
returns trigger language plpgsql set search_path = public as $$
begin
  update equipment
  set sessions_used      = sessions_used + 1,
      total_usage_hours  = total_usage_hours + coalesce(new.duration_minutes, 0) / 60.0
  where player_id = (
    select player_id from relationships where id = new.relationship_id
  )
  and status = 'active';
  return new;
end;
$$;


-- ─── 2. Tighten goal_updates to proper ownership chain ───────────────────────
-- Replace the broad "any authenticated user" placeholder from migration 008
-- now that we know the schema: goal_updates → sessions → relationships.

drop policy if exists "goal_updates_authenticated" on public.goal_updates;

create policy "goal_updates_coach_all"
  on public.goal_updates for all
  using (
    exists (
      select 1
      from public.sessions s
      join public.relationships r on r.id = s.relationship_id
      where s.id = session_id
        and r.coach_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.sessions s
      join public.relationships r on r.id = s.relationship_id
      where s.id = session_id
        and r.coach_id = (select auth.uid())
    )
  );


-- ─── 3. relationships ─────────────────────────────────────────────────────────

drop policy if exists "Users can view own relationships" on public.relationships;
create policy "Users can view own relationships"
  on public.relationships for select
  using (
    (coach_id = (select auth.uid()))
    or (player_id = (select auth.uid()))
  );

drop policy if exists "Coaches can create relationships" on public.relationships;
create policy "Coaches can create relationships"
  on public.relationships for insert
  with check (coach_id = (select auth.uid()));

drop policy if exists "Coaches can update their relationships" on public.relationships;
create policy "Coaches can update their relationships"
  on public.relationships for update
  using  (coach_id = (select auth.uid()))
  with check (coach_id = (select auth.uid()));


-- ─── 4. sessions ─────────────────────────────────────────────────────────────
-- Was: two permissive SELECT policies (ALL + SELECT) → evaluated twice per row.
-- Fix: one merged SELECT for members, separate DML for coaches only.

drop policy if exists "Coaches can manage sessions"          on public.sessions;
drop policy if exists "Relationship members can view sessions" on public.sessions;

create policy "sessions_select"
  on public.sessions for select
  using (
    relationship_id in (
      select id from public.relationships
      where (coach_id = (select auth.uid()))
         or (player_id = (select auth.uid()))
    )
  );

create policy "sessions_coach_insert"
  on public.sessions for insert
  with check (
    relationship_id in (
      select id from public.relationships where coach_id = (select auth.uid())
    )
  );

create policy "sessions_coach_update"
  on public.sessions for update
  using (
    relationship_id in (
      select id from public.relationships where coach_id = (select auth.uid())
    )
  )
  with check (
    relationship_id in (
      select id from public.relationships where coach_id = (select auth.uid())
    )
  );

create policy "sessions_coach_delete"
  on public.sessions for delete
  using (
    relationship_id in (
      select id from public.relationships where coach_id = (select auth.uid())
    )
  );


-- ─── 5. goals ────────────────────────────────────────────────────────────────

drop policy if exists "Coaches can manage goals"          on public.goals;
drop policy if exists "Relationship members can view goals" on public.goals;

create policy "goals_select"
  on public.goals for select
  using (
    relationship_id in (
      select id from public.relationships
      where (coach_id = (select auth.uid()))
         or (player_id = (select auth.uid()))
    )
  );

create policy "goals_coach_insert"
  on public.goals for insert
  with check (
    relationship_id in (
      select id from public.relationships where coach_id = (select auth.uid())
    )
  );

create policy "goals_coach_update"
  on public.goals for update
  using (
    relationship_id in (
      select id from public.relationships where coach_id = (select auth.uid())
    )
  )
  with check (
    relationship_id in (
      select id from public.relationships where coach_id = (select auth.uid())
    )
  );

create policy "goals_coach_delete"
  on public.goals for delete
  using (
    relationship_id in (
      select id from public.relationships where coach_id = (select auth.uid())
    )
  );


-- ─── 6. checkins ─────────────────────────────────────────────────────────────

drop policy if exists "Relationship members can manage checkins" on public.checkins;
create policy "Relationship members can manage checkins"
  on public.checkins for all
  using (
    relationship_id in (
      select id from public.relationships
      where (coach_id = (select auth.uid()))
         or (player_id = (select auth.uid()))
    )
  )
  with check (
    relationship_id in (
      select id from public.relationships
      where (coach_id = (select auth.uid()))
         or (player_id = (select auth.uid()))
    )
  );


-- ─── 7. coach_notes ──────────────────────────────────────────────────────────
-- Was: ALL policy (coach) + SELECT policy (player) = two SELECT evaluations.
-- Fix: one merged SELECT, explicit INSERT/UPDATE/DELETE for coaches.

drop policy if exists "Coaches can manage their notes" on public.coach_notes;
drop policy if exists "Players can view shared notes"  on public.coach_notes;

create policy "coach_notes_select"
  on public.coach_notes for select
  using (
    (relationship_id in (
      select id from public.relationships where coach_id = (select auth.uid())
    ))
    or
    (
      visibility = 'shared'::note_visibility
      and relationship_id in (
        select id from public.relationships where player_id = (select auth.uid())
      )
    )
  );

create policy "coach_notes_insert"
  on public.coach_notes for insert
  with check (
    relationship_id in (
      select id from public.relationships where coach_id = (select auth.uid())
    )
  );

create policy "coach_notes_update"
  on public.coach_notes for update
  using (
    relationship_id in (
      select id from public.relationships where coach_id = (select auth.uid())
    )
  )
  with check (
    relationship_id in (
      select id from public.relationships where coach_id = (select auth.uid())
    )
  );

create policy "coach_notes_delete"
  on public.coach_notes for delete
  using (
    relationship_id in (
      select id from public.relationships where coach_id = (select auth.uid())
    )
  );


-- ─── 8. equipment ────────────────────────────────────────────────────────────
-- Was: SELECT policy (coach) + ALL policy (player) = two SELECT evaluations.

drop policy if exists "Coaches can view player equipment" on public.equipment;
drop policy if exists "Players can manage own equipment"  on public.equipment;

create policy "equipment_select"
  on public.equipment for select
  using (
    (player_id = (select auth.uid()))
    or
    (player_id in (
      select player_id from public.relationships where coach_id = (select auth.uid())
    ))
  );

create policy "equipment_player_insert"
  on public.equipment for insert
  with check (player_id = (select auth.uid()));

create policy "equipment_player_update"
  on public.equipment for update
  using  (player_id = (select auth.uid()))
  with check (player_id = (select auth.uid()));

create policy "equipment_player_delete"
  on public.equipment for delete
  using (player_id = (select auth.uid()));


-- ─── 9. equipment_events ─────────────────────────────────────────────────────

drop policy if exists "Equipment event access follows equipment" on public.equipment_events;
create policy "Equipment event access follows equipment"
  on public.equipment_events for all
  using (
    (equipment_id in (
      select id from public.equipment where player_id = (select auth.uid())
    ))
    or
    (equipment_id in (
      select e.id
      from public.equipment e
      join public.relationships r on r.player_id = e.player_id
      where r.coach_id = (select auth.uid())
    ))
  )
  with check (
    (equipment_id in (
      select id from public.equipment where player_id = (select auth.uid())
    ))
    or
    (equipment_id in (
      select e.id
      from public.equipment e
      join public.relationships r on r.player_id = e.player_id
      where r.coach_id = (select auth.uid())
    ))
  );


-- ─── 10. tag_library ─────────────────────────────────────────────────────────

drop policy if exists "Coaches can manage their tags" on public.tag_library;
create policy "Coaches can manage their tags"
  on public.tag_library for all
  using  (coach_id = (select auth.uid()))
  with check (coach_id = (select auth.uid()));


-- ─── 11. session_templates ───────────────────────────────────────────────────

drop policy if exists "Coaches can manage their templates" on public.session_templates;
create policy "Coaches can manage their templates"
  on public.session_templates for all
  using  (coach_id = (select auth.uid()))
  with check (coach_id = (select auth.uid()));
