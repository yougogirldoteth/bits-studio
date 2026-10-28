#!/bin/sh
set -eu

schema=${DATABASE_SCHEMA:-bits_indexer_$(printf %s "${KAMAL_VERSION:-local}" | sha1sum | cut -c1-16)}
views_schema=${PONDER_VIEWS_SCHEMA:-bits_indexer}

node scripts/check-database-role.mjs
# Run the installed CLI directly: the non-root runtime must not need Corepack's
# root-owned download cache, a registry connection, or a dependency reinstall.
exec node node_modules/ponder/dist/esm/bin/ponder.js start \
  --schema="$schema" --views-schema="$views_schema"
