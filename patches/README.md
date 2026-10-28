# Ponder security patch

`ponder@0.16.10.patch` changes both TypeScript source and shipped ESM runtime.
It keeps the 0.16 database format, SQL AST validator, read-only transactions,
30-second read timeout and GraphQL operation/result limits intact.

- Reserve at most 1000 live slots, including requests still setting up.
- Release exactly once on all setup errors/early responses, stream aborts,
  exceptions and callback completion. A request abort also wakes the table
  notification wait, including queries that reference no table.
- Reduce read-only pool `work_mem` from 512 MB to 16 MB per operation.

Ponder 0.16.10 still leaks slots before validation. The upstream main branch
has a setup `try/finally` fix, but its stream callback still needs completion
cleanup and an abortable notification wait. This patch covers both. Remove it
only after a replacement release passes `test/security.test.ts`, which imports
the installed package and uses the real parser and Hono streaming implementation.
`test/database-security.sh` exercises the real PostgreSQL ownership migration.

Hono is pinned to 4.13.14 in the indexer and resolved as Ponder's peer, including
the CORS fix described in [GHSA-8j4g-w8fx-2239](https://github.com/honojs/hono/security/advisories/GHSA-8j4g-w8fx-2239).
The Docker dependency stage copies this directory before frozen installation;
pnpm records the patch hash in the lockfile. CI recognizes patch-only changes.
