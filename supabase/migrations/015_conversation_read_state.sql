-- ─── Per-conversation read tracking ──────────────────────────────────────────
-- Replaces the 24h "recent" heuristic with a real last_read_at timestamp.
-- A conversation is unread when last_message_at > last_read_at (treating null
-- last_read_at as "never opened").

alter table public.conversations
  add column if not exists last_read_at timestamptz;

-- Backfill: existing conversations are treated as already read so the
-- indicator doesn't light up retroactively.
update public.conversations
set last_read_at = coalesce(last_message_at, created_at)
where last_read_at is null;
