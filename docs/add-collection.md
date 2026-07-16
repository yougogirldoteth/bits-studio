# Add A BITS Collection

Collections live in `packages/shared/src/collections.ts`. The app and indexer
both read from the same config, so adding a compatible collection should not
require route, component, or indexer handler changes.

Multiple collections may share one BITS ERC-1155 contract. Each collection
still needs its own collection id, non-overlapping token range, renderer
address, and creation block. The indexer registers the shared contract once and
routes token events to the matching configured range.

## Example

```ts
{
  slug: 'drums-collection-1',
  title: 'Drums Collection 1',
  artist: 'BITS',
  description: 'Sixteen onchain drum instruments.',
  chain: 'mainnet',
  chainId: 1,
  bitsContract: '0x...',
  rendererContract: '0x...',
  collectionId: 1n,
  startTokenId: 1,
  tokenCount: 16,
  tokenStartBlock: 12345678,
  rendererStartBlock: 12345000,
  rendererAdapter: 'bits-renderer-v1',
  editionSize: 42n,
  pricePerTokenWei: 1_000_000_000_000_000n,
  launchLabel: 'Minting is live on Ethereum mainnet.',
  mintLabel: 'Mint',
  explorerBaseUrl: 'https://evm.now',
  primary: true,
  theme: { accent: '#111111' },
}
```

## Checklist

- The slug is lowercase kebab-case and unique.
- Exactly one configured collection has `primary: true`; `/` renders it.
- The BITS and renderer addresses are valid Ethereum addresses.
- `tokenStartBlock` is the block that created or initialized this collection.
- `rendererStartBlock` is the renderer contract deployment block.
- A shared BITS contract never reuses a `collectionId` or overlaps token ranges.
- `collectionId`, `startTokenId`, and `tokenCount` match the onchain collection.
- `editionSize` and `pricePerTokenWei` match the mint contract.
- The configured renderer address matches the onchain collection and supports
  the selected adapter.
- Do not add a placeholder before the collection exists: the bootstrap check
  intentionally fails when configured values differ from onchain state.
- `pnpm --dir packages/shared test` passes.
- `pnpm --dir packages/indexer test` passes.
- `pnpm --dir packages/indexer codegen` succeeds with an RPC configured.
- `pnpm typecheck` and `pnpm build:app` pass.

After the indexer processes `tokenStartBlock`, verify that `/collections`
includes the new summary, `/collections/:slug/artwork` contains SVG previews,
and `/collections/:slug` contains every configured token before enabling public
mint links. Empty renderer slots are reconciled from onchain state every 10
blocks and fill automatically when their renderer data is created; a
`MetadataUpdate` event only makes that refresh immediate.
