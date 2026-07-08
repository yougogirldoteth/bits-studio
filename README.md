# BITS Collection Framework

Reusable open-source frontend and indexer for BITS ERC-1155 collections.

This repository is intentionally config-driven: add a compatible BITS contract
and renderer, then the Nuxt app and Ponder indexer can render a mint/gallery
experience without one-off frontend code.

## Packages

- `packages/shared` contains collection config, ABI fragments, renderer
  adapters, validation, formatting helpers, and shared API types.
- `packages/indexer` indexes configured BITS collections with Ponder and
  exposes REST and GraphQL endpoints.
- `packages/app` is the Nuxt frontend built on `@1001-digital/layers.evm`.

## Status

Drums Collection 1 is the first configured collection. More documentation is
available in `docs/`.
