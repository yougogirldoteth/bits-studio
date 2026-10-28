# Indexer security rollout

These are deployment instructions, not a record of production changes. The
application fixes remain local until reviewed. Coordinate the database restart
and backup with the host operator. The frontend is deployed from another repo.

## Changes and constraints

- DAV-I-01: tested Ponder 0.16.10 patch releases live-query slots on all failure
  and stream completion paths. Keep the SQL AST and read-only defenses.
- DAV-I-02: indexer and Ponder resolve Hono 4.13.14, including the default CORS
  fix. Keep the GraphQL budgets (1000 tokens, depth 100, 30 aliases, 1000 rows).
- DAV-I-03: the dedicated `ponder_indexer` login owns only Ponder schemas and
  their objects. It can connect and create schemas in database `ponder`, but
  cannot administer the cluster or assume other roles. Startup refuses an
  administrator credential, role memberships or database ownership.
- PostgreSQL is pinned to `postgres:17.11-alpine`; review the vendor's
  [17.11 migration notes](https://www.postgresql.org/docs/release/17.11/), including
  extensions and replication if present. Major version and data path stay at 17.
- App: 2 GiB memory, no extra swap, 2 CPUs, 256 PIDs, 1536 MiB Node heap,
  unprivileged `node` user, no capabilities, no-new-privileges, production errors.
  DB: 4 GiB memory, no extra swap, 2 CPUs, 256 PIDs, 256 MiB shared memory,
  100 connections, 512 MB shared buffers, 16 MB work memory, 128 MB maintenance
  memory, 256 MB temp files per process. These are initial containment budgets;
  measure staging backfill and live load before promotion. `work_mem` is per
  operation, not a process memory cap. The app role allows 70 connections for two
  overlapping Ponder processes (30 each) and operational headroom.

## Local checks

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --dir packages/indexer test
pnpm --dir packages/indexer typecheck
bash packages/indexer/test/database-security.sh
docker build -f Dockerfile.indexer -t dav-indexer-security-test .
```

The database test starts and removes a disposable local PostgreSQL 17.11 container.
It never accepts a live database URL. The middleware tests mock only the database
and process lifecycle; no production requests or RPC are needed.

## Existing deployment

1. Pause automatic deployment until the new role is ready: pushing to `main`
   deploys immediately. Record the current app image/version and database image
   digest. Keep the existing ignored production env and secrets in secure storage.
   Confirm `POSTGRES_SERVICE=dav-worldcomputer-art-indexer-db`, database `ponder`
   and data directory `/home/deploy/dav-worldcomputer-art-indexer-db/data` against
   the live configuration. Use `BatchMode=yes` and `StrictHostKeyChecking=yes` for
   any SSH command to `our-server`.
2. Have the host operator take a recoverable backup and demonstrate a restore to
   an isolated database. Use PostgreSQL 17.11 or newer dump/restore tools, or a
   consistent cold volume snapshot with the database stopped. Keep both backup
   and old image until the new deployment is verified. Do not tar a live PGDATA.
3. Rehearse this migration against that restored database, including a Ponder
   start, resume, new version schema, stable-view switch and GraphQL/SQL reads.
   The automated local test covers ownership/DDL and denials, but does not replay
   a production chain history or measure its peak memory usage.
4. Set `POSTGRES_ADMIN_USER=ponder` in the existing deployment environment and
   its GitHub environment variable. This is the legacy administrator identity;
   changing `POSTGRES_USER` does not change roles in an existing data directory.
   Keep `POSTGRES_PASSWORD` as the administrator secret. It is never passed to
   the app. Fresh clusters instead default to `ponder_admin`.
5. Load the deployment environment in a private terminal, then stop the app:

   ```sh
   cd packages/indexer
   set -a
   . ./.env.production
   set +a
   kamal app stop
   ```

   After the verified backup, recreate the DB accessory with the reviewed config:

   ```sh
   kamal accessory reboot db
   ssh -o BatchMode=yes -o StrictHostKeyChecking=yes our-server \
     'docker exec dav-worldcomputer-art-indexer-db postgres --version'
   ```

   Require actual `17.11` (or a newly reviewed later patch), not just a new image
   label. The data directory must stay mounted; never remove it.

6. From the repository root, apply the ownership migration once as the existing
   administrator while the app is stopped:

   ```sh
   ssh -o BatchMode=yes -o StrictHostKeyChecking=yes our-server \
     'docker exec -i dav-worldcomputer-art-indexer-db psql -X -v ON_ERROR_STOP=1 -U ponder -d ponder' \
     < packages/indexer/scripts/prepare-database-role.sql
   ```

   This transaction transfers schemas, tables/partitions/sequences/views,
   routines and enums/domains, and preserves the data. It refuses unexpected
   schema names or privileged existing app roles. If it refuses, inspect the
   schema inventory and adjust the explicit allowlist after review; do not use
   a blanket `REASSIGN OWNED` from the bootstrap administrator.

7. Open an interactive database terminal and set a distinct generated password
   using `\password ponder_indexer` (hidden prompt, not SQL or shell history):

   ```sh
   ssh -t -o BatchMode=yes -o StrictHostKeyChecking=yes our-server \
     'docker exec -it dav-worldcomputer-art-indexer-db psql -X -U ponder -d ponder'
   ```

   Store it in the app's `DATABASE_URL` locally and in the GitHub production
   secret. Percent-encode the password in the URL. Retain the existing DB host,
   port and database. Do not put the administrator URL in the application env.

8. Deploy the reviewed commit using `pnpm --dir packages/indexer kamal:deploy`
   from the repository root, or the reviewed CI deployment. The startup role
   check must pass. Confirm `/ready`, `/collections`, a normal `/sql/db` SELECT,
   a normal `/sql/live` subscribe/disconnect and GraphQL data. Verify indexer
   checkpoints advance, stable views point to the new schema, installed versions
   are Ponder 0.16.10 and Hono 4.13.14, and production error masking is active.
   Run no exhaustion or malformed-request tests against production.
9. Confirm the active DB login flags are all false (`rolsuper`, `rolcreatedb`,
   `rolcreaterole`, `rolreplication`, `rolbypassrls`), it has no memberships, and
   database ownership remains administrative. Inspect Docker's effective memory,
   swap, CPU, PID, user/capability settings. Monitor memory, OOM events, database
   temp-file/connection usage, restart count and indexing lag during backfill and
   live traffic. Restore automatic deployment after these checks.

For a fresh installation, boot the DB accessory first (`kamal accessory boot db`),
run the same migration as `ponder_admin`, set the app password and URL, then run
`kamal setup`. Do not start the app with the bootstrap credential.

## Rollback

If migration fails, its transaction rolls back. Keep the app stopped until the
failure is understood; restart the previous app only with a known working URL.
If the new app fails after migration, roll back to the recorded app version with
`kamal rollback <recorded-version>`, retaining the non-superuser `DATABASE_URL`.
The old Ponder 0.16 app can use the same role and database; the migration is
additive and ownership does not need to revert. That app rollback reintroduces
the old dependency weaknesses and must be temporary.

Keep PostgreSQL on the patched 17.x image during an app rollback. If recovery of
the database itself is required, stop all clients and have the host operator
restore the verified backup into a separate data directory before changing the
mount. Never overwrite the only copy or downgrade a modified data directory
without a tested recovery plan.

## Remaining operational work

Production remains vulnerable until the application deployment and database role
switch are completed. Project network isolation, proxy/per-client rate limits,
host updates and backup scheduling belong to the host task. The combined Ponder
indexer/API still holds schema-write capability; separate read-only serving is
a future architectural step. SQL work/response budgets, ENS cache/concurrency and
the audited metadata-event range allocation remain follow-up work.
