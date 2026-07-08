# Deploy

The repo mirrors the app/indexer split used by `hello-world-computer`.

## Services

- App: `packages/app/config/deploy.yml`, `Dockerfile.app`, port `3000`.
- Indexer: `packages/indexer/config/deploy.yml`, `Dockerfile.indexer`, port
  `42069`.
- Postgres: Kamal accessory owned by the indexer service.

## App Environment

Production app env is loaded from `packages/app/.env.production` by the Kamal
scripts.

Required values:

- `DEPLOY_HOST`
- `APP_HOST`
- `DOCKER_REGISTRY_USERNAME`
- `KAMAL_REGISTRY_PASSWORD`
- `NUXT_PUBLIC_BITS_INDEXER_URL`
- `NUXT_PUBLIC_EVM_CHAINS_MAINNET_RPCS`

Optional values:

- `APP_ADDITIONAL_HOSTS`
- `DEPLOY_USER`
- `KAMAL_SERVICE`
- `KAMAL_IMAGE`
- `NUXT_PUBLIC_EVM_WALLET_CONNECT_PROJECT_ID`

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
pnpm --dir packages/app kamal:setup
pnpm --dir packages/app kamal:deploy
```

Deploy the indexer first so the app has a live API URL.
