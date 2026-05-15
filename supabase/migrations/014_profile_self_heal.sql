-- ─── Self-healing profiles ───────────────────────────────────────────────────
-- Migration 002 dropped public.profiles and recreated it, which orphaned every
-- auth.users row that already existed. The handle_new_user trigger only fires
-- on INSERT, so those users had no profile until manually backfilled — and
-- because the app gates message send on a non-null profile, those users
-- couldn't send messages at all.
--
-- This migration:
--   1. Makes handle_new_user idempotent (on conflict do nothing) so re-running
--      it is safe.
--   2. Backfills profile rows for any auth.users that don't have one.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'coach'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;

insert into public.profiles (id, role, full_name)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'role', 'coach'),
  coalesce(u.raw_user_meta_data->>'full_name', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
