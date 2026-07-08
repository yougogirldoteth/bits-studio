# Add A BITS Collection

Collections live in `packages/shared/src/collections.ts`. The app and indexer
both read from the same config, so adding a compatible collection should not
require route, component, or indexer handler changes.

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
  theme: { accent: '#111111' },
}
```

## Checklist

- The slug is lowercase kebab-case and unique.
- The BITS and renderer addresses are valid Ethereum addresses.
- `tokenStartBlock` is the BITS contract deployment block.
- `rendererStartBlock` is the renderer contract deployment block.
- `collectionId`, `startTokenId`, and `tokenCount` match the contract.
- `editionSize` and `pricePerTokenWei` match the mint contract.
- The renderer supports the selected adapter.
- `pnpm --dir packages/shared test` passes.
- `pnpm --dir packages/indexer codegen` succeeds with an RPC configured.
