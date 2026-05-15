-- ─── Player intake fields ────────────────────────────────────────────────────
-- These columns were added directly to the live database without a
-- corresponding migration file. This migration backfills the migration
-- history so a fresh deploy ends up with the same schema as production.
-- All ADDs are idempotent (IF NOT EXISTS) so re-running against production
-- is a no-op.

alter table public.players
  add column if not exists skill_level    text,
  add column if not exists contact_phone  text,
  add column if not exists contact_email  text,
  add column if not exists birthdate      date,
  add column if not exists lesson_cadence text,
  add column if not exists primary_focus  text,
  add column if not exists intake_notes   text,
  add column if not exists parent_name    text,
  add column if not exists parent_phone   text;
