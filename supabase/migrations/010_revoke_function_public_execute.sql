-- ─── Revoke public RPC access to internal trigger functions ──────────────────
-- Migration 008 revoked EXECUTE from the named roles, but PostgreSQL grants
-- EXECUTE to the PUBLIC pseudo-role by default. Revoking from PUBLIC removes
-- that inherited grant for every role (anon, authenticated, etc.).
-- Trigger invocation is unaffected — triggers fire via the trigger mechanism,
-- not via EXECUTE permission.

revoke execute on function public.handle_new_user()                from public;
revoke execute on function public.sync_conversation_last_message() from public;
