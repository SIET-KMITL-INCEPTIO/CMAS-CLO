-- Hand-written. The app reaches Postgres only through Prisma, as the role that
-- owns the tables. Supabase also exposes the public schema through its Data API
-- (PostgREST, GraphQL) as the `anon` and `authenticated` roles, whose key ships
-- to browsers by design. With RLS off and Supabase's default grants, anyone
-- holding that key could read and write every row, User and RefreshToken
-- included (Supabase lint 0013).
--
-- 1. RLS on, with no policies: the Data API roles see nothing. The owner
--    bypasses RLS (no FORCE), so Prisma is unaffected.
-- 2. Revoke the Data API roles' grants, now and for tables created later.
--    Guarded: plain Postgres (local dev, CI) has no such roles.
-- 3. Pin the trigger functions' search_path (Supabase lint 0011).

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', r);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.trg_score_validate()',
    'public.trg_gradeband_passfail()',
    'public.trg_criteria_same_course()',
    'public.trg_objassess_same_clo()'
  ] LOOP
    IF to_regprocedure(f) IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', f);
    END IF;
  END LOOP;
END $$;
