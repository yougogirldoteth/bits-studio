\set ON_ERROR_STOP on
-- Run as the existing administrator while the indexer is stopped. No passwords
-- belong in this file. Set the new login's password with psql \password afterward.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $$
DECLARE
  obj record;
  app_role constant text := 'ponder_indexer';
BEGIN
  IF current_database() <> 'ponder' THEN
    RAISE EXCEPTION 'This migration is scoped to the ponder database';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = app_role) THEN
    CREATE ROLE ponder_indexer LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
      NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 70;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = app_role AND
    (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls))
    OR EXISTS (SELECT FROM pg_auth_members WHERE member = app_role::regrole) THEN
    RAISE EXCEPTION 'Existing application role has elevated privileges or memberships';
  END IF;
  IF EXISTS (SELECT FROM pg_database WHERE datname = current_database()
    AND datdba = app_role::regrole) THEN
    RAISE EXCEPTION 'Keep database ownership with the administrator';
  END IF;
  -- Fail closed on a deployment with custom names; explicitly review its schema
  -- inventory before adapting this allowlist. Never REASSIGN OWNED from a cluster
  -- bootstrap superuser: that can also transfer shared database objects.
  IF EXISTS (SELECT FROM pg_namespace WHERE nspname !~ '^pg_'
    AND nspname NOT IN ('information_schema', 'public', 'ponder_sync')
    AND nspname !~ '^bits_indexer(_[a-zA-Z0-9_]+)?$') THEN
    RAISE EXCEPTION 'Unexpected schema; review the migration allowlist';
  END IF;
  IF EXISTS (SELECT FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE n.nspname = 'ponder_sync' OR n.nspname ~ '^bits_indexer(_[a-zA-Z0-9_]+)?$') THEN
    RAISE EXCEPTION 'Unexpected extension in an application schema';
  END IF;

  FOR obj IN SELECT nspname FROM pg_namespace WHERE nspname = 'ponder_sync'
    OR nspname ~ '^bits_indexer(_[a-zA-Z0-9_]+)?$'
  LOOP
    EXECUTE format('ALTER SCHEMA %I OWNER TO %I', obj.nspname, app_role);
  END LOOP;
  -- Tables first: owning sequences can follow their table during the transfer.
  FOR obj IN SELECT n.nspname, c.relname, c.relkind FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE (n.nspname = 'ponder_sync' OR n.nspname ~ '^bits_indexer(_[a-zA-Z0-9_]+)?$')
      AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
    ORDER BY c.relkind = 'S'
  LOOP
    EXECUTE format('ALTER %s %I.%I OWNER TO %I',
      CASE obj.relkind WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW'
        WHEN 'S' THEN 'SEQUENCE' WHEN 'f' THEN 'FOREIGN TABLE' ELSE 'TABLE' END,
      obj.nspname, obj.relname, app_role);
  END LOOP;
  FOR obj IN SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'ponder_sync' OR n.nspname ~ '^bits_indexer(_[a-zA-Z0-9_]+)?$'
  LOOP
    EXECUTE format('ALTER ROUTINE %I.%I(%s) OWNER TO %I',
      obj.nspname, obj.proname, obj.args, app_role);
  END LOOP;
  FOR obj IN SELECT n.nspname, t.typname FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    LEFT JOIN pg_class c ON c.oid = t.typrelid
    WHERE (n.nspname = 'ponder_sync' OR n.nspname ~ '^bits_indexer(_[a-zA-Z0-9_]+)?$')
      AND (t.typtype IN ('e', 'd') OR (t.typtype = 'c' AND c.relkind = 'c'))
  LOOP
    EXECUTE format('ALTER TYPE %I.%I OWNER TO %I', obj.nspname, obj.typname, app_role);
  END LOOP;
END $$;

REVOKE ALL ON DATABASE ponder FROM PUBLIC;
GRANT CONNECT, CREATE, TEMPORARY ON DATABASE ponder TO ponder_indexer;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
ALTER ROLE ponder_indexer SET work_mem = '16MB';
ALTER ROLE ponder_indexer SET temp_file_limit = '256MB';
COMMIT;
