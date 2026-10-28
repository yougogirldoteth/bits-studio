#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Disposable local database only. Never point this harness at a production host.
case "${DOCKER_HOST:-unix://}" in
  unix://*) ;;
  *) echo 'DOCKER_HOST must not point at a remote daemon' >&2; exit 1 ;;
esac
case "$(docker context inspect --format '{{.Endpoints.docker.Host}}')" in
  unix://*) ;;
  *) echo 'This test requires a local Docker socket' >&2; exit 1 ;;
esac
container="dav-db-security-test-$$"
trap 'docker rm -f "$container" >/dev/null 2>&1 || true' EXIT
docker run --detach --name "$container" --memory 1g --cpus 1 --pids-limit 128 \
  --publish 127.0.0.1::5432 --env POSTGRES_USER=ponder --env POSTGRES_DB=ponder \
  --env POSTGRES_PASSWORD=local-test-only postgres:17.11-alpine >/dev/null
for attempt in {1..60}; do
  if docker exec "$container" pg_isready -U ponder -d ponder >/dev/null; then break; fi
  sleep 1
done
admin() { docker exec -i "$container" psql -X -v ON_ERROR_STOP=1 -U ponder -d ponder "$@"; }
app() { docker exec -i "$container" psql -X -v ON_ERROR_STOP=1 -U ponder_indexer -d ponder "$@"; }
admin <<'SQL'
CREATE SCHEMA ponder_sync;
CREATE TABLE ponder_sync.blocks (id integer PRIMARY KEY);
CREATE SCHEMA bits_indexer_old;
CREATE TYPE bits_indexer_old.state AS ENUM ('ready');
CREATE TABLE bits_indexer_old.items (id serial PRIMARY KEY, state bits_indexer_old.state);
INSERT INTO bits_indexer_old.items (state) VALUES ('ready');
CREATE FUNCTION bits_indexer_old.touch() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE TRIGGER touch BEFORE UPDATE ON bits_indexer_old.items FOR EACH ROW EXECUTE FUNCTION bits_indexer_old.touch();
CREATE SCHEMA bits_indexer;
CREATE VIEW bits_indexer.items AS SELECT * FROM bits_indexer_old.items;
SQL
admin < scripts/prepare-database-role.sql
admin < scripts/prepare-database-role.sql # safe rerun
app <<'SQL'
DO $$ BEGIN
  IF (SELECT rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls
      FROM pg_roles WHERE rolname = current_user) THEN RAISE EXCEPTION 'privileged'; END IF;
  IF (SELECT count(*) FROM bits_indexer.items) <> 1 THEN RAISE EXCEPTION 'data lost'; END IF;
END $$;
INSERT INTO bits_indexer_old.items (state) VALUES ('ready');
UPDATE bits_indexer_old.items SET state = 'ready';
ALTER TABLE bits_indexer_old.items ADD COLUMN extra text;
ALTER TYPE bits_indexer_old.state ADD VALUE 'updated';
CREATE INDEX ON bits_indexer_old.items (state);
CREATE SCHEMA bits_indexer_next;
CREATE TYPE bits_indexer_next.state AS ENUM ('ready', 'updated');
CREATE TABLE bits_indexer_next.items (id serial PRIMARY KEY, state bits_indexer_next.state, extra text);
INSERT INTO bits_indexer_next.items SELECT id, state::text::bits_indexer_next.state, extra FROM bits_indexer_old.items;
DROP VIEW bits_indexer.items;
CREATE VIEW bits_indexer.items AS SELECT * FROM bits_indexer_next.items;
LISTEN ponder_test;
NOTIFY ponder_test, 'updated';
CREATE TABLE ponder_sync.migration (id bigint);
DROP TABLE ponder_sync.migration;
DROP SCHEMA bits_indexer_old CASCADE;
DO $$ BEGIN
  IF (SELECT count(*) FROM bits_indexer.items) <> 2 THEN RAISE EXCEPTION 'view switch failed'; END IF;
END $$;
SQL
for denied in 'CREATE ROLE forbidden' 'CREATE DATABASE forbidden' 'SET ROLE ponder' \
  "COPY (SELECT 1) TO PROGRAM 'true'" \
  'BEGIN READ ONLY; INSERT INTO bits_indexer_next.items (id) VALUES (99); COMMIT'; do
  if app -c "$denied" >/dev/null 2>&1; then
    echo "Expected permission denial: $denied" >&2; exit 1
  fi
done
port="$(docker port "$container" 5432/tcp)"
export DATABASE_URL="postgres://ponder:local-test-only@${port}/ponder"
if node scripts/check-database-role.mjs >/dev/null 2>&1; then
  echo 'Startup accepted the administrator' >&2; exit 1
fi
admin -c "ALTER ROLE ponder_indexer PASSWORD 'local-test-only'" >/dev/null
export DATABASE_URL="postgres://ponder_indexer:local-test-only@${port}/ponder"
node scripts/check-database-role.mjs
node --input-type=module <<'JS'
import assert from 'node:assert/strict'
const { createReadonlyPool } = await import(new URL('./utils/pg.js', import.meta.resolve('ponder')))
const pool = createReadonlyPool({ connectionString: process.env.DATABASE_URL, max: 1 }, { warn() {}, debug() {}, trace() {} }, 'bits_indexer_next')
try {
  assert.equal((await pool.query('SHOW transaction_read_only')).rows[0].transaction_read_only, 'on')
  assert.equal((await pool.query('SHOW work_mem')).rows[0].work_mem, '16MB')
  assert.equal((await pool.query('SHOW statement_timeout')).rows[0].statement_timeout, '30s')
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM items')).rows[0].count, 2)
  await assert.rejects(pool.query('INSERT INTO items (id) VALUES (99)'), { code: '25006' })
} finally { await pool.end() }
console.log('Installed Ponder pool preserves read-only and timeout protections with 16 MB work memory')
JS
admin -c 'GRANT pg_read_all_data TO ponder_indexer' >/dev/null
if node scripts/check-database-role.mjs >/dev/null 2>&1; then
  echo 'Startup accepted role membership' >&2; exit 1
fi
admin -c 'REVOKE pg_read_all_data FROM ponder_indexer' >/dev/null
admin -c 'CREATE SCHEMA unrelated' >/dev/null
if admin < scripts/prepare-database-role.sql >/dev/null 2>&1; then
  echo 'Migration accepted an unexpected schema' >&2; exit 1
fi
docker exec "$container" postgres --version
echo 'Database role migration, schema lifecycle, denials and startup checks passed'
