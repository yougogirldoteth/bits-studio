# Contract Interfaces

This framework targets BITS-style collections: one ERC-1155 mint contract and
one renderer contract per collection.

## BITS ERC-1155 Contract

Required reads:

- `bitCollections(uint256)`
- `tokenMinted(uint256)`
- `tokenToCollectionId(uint256)`
- `balanceOf(address,uint256)`

Required writes:

- `mintCollectionPublic(uint256,address)` payable
- `mintBitPublic(uint256,address,uint256)` payable

Required events:

- `TransferSingle`
- `TransferBatch`
- `URI`
- `MetadataUpdate`
- `BatchMetadataUpdate`
- `OwnershipTransferred`

The indexer treats mints as ERC-1155 transfers from the zero address.

## Renderer Adapter

The initial adapter is `bits-renderer-v1`.

Required reads:

- `bits(uint256)`
- `tokenToSvg(uint256)`
- `tokenToHtml(uint256)`
- `bitToBase64(uint256)`
- `bitToBytes(uint256)`

The indexer caches the normalized renderer output per token. Future renderer
shapes should add a new adapter in `packages/shared/src/renderer.ts` rather than
forking app or indexer logic.
