# Deploy

This repo deploys the production indexer. The production frontend at
`dav.worldcomputer.art` is deployed from the private portfolio repository.

## Services

- App: retained for local development. Its Kamal config rejects the reserved
  `dav-worldcomputer-art` service and `dav.worldcomputer.art` host.
- Indexer: `packages/indexer/config/deploy.yml`, `Dockerfile.indexer`, port
  `42069`.
- Postgres: Kamal accessory owned by the indexer service.

## Indexer Environment

Production indexer env is loaded from `packages/indexer/.env.production`.

Required values:

- `DEPLOY_HOST`
- `INDEXER_HOST`
- `DOCKER_REGISTRY_USERNAME`
- `KAMAL_REGISTRY_PASSWORD`
- `PONDER_RPC_URLS_1`
- `DATABASE_URL`
- `DATABASE_SCHEMA`
- `POSTGRES_PASSWORD`

Optional values:

- `INDEXER_ADDITIONAL_HOSTS`
- `DEPLOY_USER`
- `PONDER_RPC_FALLBACK_URLS_1`
- `PONDER_WS_URL_1`
- `PONDER_RPC_REQUESTS_PER_SECOND_1`
- `PONDER_ETH_GET_LOGS_BLOCK_RANGE_1`

## Commands

```bash
pnpm --dir packages/indexer kamal:setup
pnpm --dir packages/indexer kamal:deploy
```

The GitHub Actions workflow deploys only the indexer. Changes confined to the
app package do not trigger a production deployment.
