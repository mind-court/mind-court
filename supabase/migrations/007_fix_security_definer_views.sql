-- ─── Fix SECURITY DEFINER views ───────────────────────────────────────────────
-- PostgreSQL views default to running with the VIEW OWNER's permissions, not
-- the querying user's. This bypasses RLS on the underlying tables — a security
-- defect Supabase's advisor flags as "SECURITY DEFINER view".
--
-- Fix: set security_invoker = true on every public-schema view so queries run
-- with the calling user's permissions, respecting their RLS policies.
--
-- Requires PostgreSQL 15+ (Supabase uses PG15+).

DO $$
DECLARE
  v record;
BEGIN
  FOR v IN
    SELECT c.relname AS viewname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'v'
      AND NOT (
        -- already has security_invoker = on/true
        EXISTS (
          SELECT 1
          FROM pg_options_to_table(c.reloptions)
          WHERE option_name = 'security_invoker'
            AND option_value IN ('on', 'true')
        )
      )
  LOOP
    EXECUTE format(
      'ALTER VIEW public.%I SET (security_invoker = true)',
      v.viewname
    );
    RAISE NOTICE 'Patched view: public.%', v.viewname;
  END LOOP;
END;
$$;
