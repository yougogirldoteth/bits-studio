# BITS Collection Framework

Reusable open-source frontend and indexer for BITS ERC-1155 collections by
[dav](https://x.com/producedbydav).

This project is intentionally config-driven: add a compatible BITS contract and
renderer, then the Nuxt app and Ponder indexer can render a mint/gallery
experience without one-off frontend code.

## What It Includes

- A Nuxt 4 frontend built on `@1001-digital/layers.evm`.
- A Ponder indexer with REST and GraphQL endpoints.
- A shared package for collection config, ABI fragments, renderer adapters,
  validation, helpers, and API types.
- Docker and Kamal deployment setup for the production indexer and Postgres.
- MIT license and open-source-safe defaults.

## Packages

- `packages/shared`: config, ABIs, renderer adapters, validation, helpers.
- `packages/indexer`: Ponder schema, event handlers, REST API, GraphQL.
- `packages/app`: Nuxt app, wallet/mint UX, collection gallery.

## Quick Start

```bash
pnpm install
cp packages/app/.env.example packages/app/.env
cp packages/indexer/.env.example packages/indexer/.env.local
pnpm codegen:indexer
pnpm dev:indexer
pnpm dev:app
```

The app defaults to `http://localhost:3010`; the indexer defaults to
`http://localhost:42069`.

## Configured Collections

Drums Collection 1 is configured in `packages/shared/src/collections.ts`:

- BITS contract: `0xb49911f9063154318dd98848c65c1cb15e43c917`
- Renderer contract: `0x841eb707c98bf64572c88bc3b8001568e1437e00`
- Ethereum mainnet
- Collection id `1`
- Token ids `1-16`

Drums Collection 2 shares the BITS contract and is configured with:

- Renderer contract: `0xB13DBF35E262E0225a4be90DD318D99864AD0Afa`
- Ethereum mainnet
- Collection id `2`
- Token ids `17-32`
- Empty renderer slots remain visible and cannot be minted until their renderer
  data is created.

## Indexer API

The frontend reads collection data from stable REST routes:

- `/collections`
- `/collections/:slug`
- `/collections/:slug/artwork`
- `/collections/:slug/tokens`
- `/collections/:slug/tokens/:tokenId`
- `/collections/:slug/holders`
- `/collections/:slug/activity`

## Adding Collections

See `docs/add-collection.md`.

## Contract Compatibility

This is reusable across BITS collections using the same broad ERC-1155 +
renderer model. It is not intended to be a generic mint frontend for arbitrary
NFT contracts. See `docs/contracts.md`.

## Deployment

See `docs/deploy.md`. The frontend in this repository is not allowed to claim
the production `dav.worldcomputer.art` service or domain.
