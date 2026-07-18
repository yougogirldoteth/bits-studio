import {
  bitsCollections,
  collectionForToken,
  collectionsForBitsContract,
  type BitsRendererBitTuple,
  type BitsCollectionConfig,
} from '@bits-collection/shared'

export const INDEXED_COLLECTIONS = bitsCollections
export const BITS_CONTRACT_NAME = 'Bits'
export const RENDERER_RECONCILE_BLOCK_NAME = 'RendererReconciliation'
export const RENDERER_RECONCILE_INTERVAL = 10
export const INDEXED_BITS_CONTRACTS = Array.from(
  new Map(
    INDEXED_COLLECTIONS.map((collection) => [
      collection.bitsContract.toLowerCase(),
      collection.bitsContract,
    ]),
  ).values(),
)
export const BITS_START_BLOCK = Math.min(
  ...INDEXED_COLLECTIONS.map((collection) => collection.tokenStartBlock),
)

export function bootstrapNameForCollection(collection: BitsCollectionConfig) {
  return `Bootstrap_${collection.slug.replace(/-/g, '_')}`
}

export function indexedCollectionsForContract(bitsContract: string) {
  return collectionsForBitsContract(INDEXED_COLLECTIONS, bitsContract)
}

export function indexedCollectionsForContractAtBlock(
  bitsContract: string,
  blockNumber: bigint,
) {
  return indexedCollectionsForContract(bitsContract).filter(
    (collection) => BigInt(collection.tokenStartBlock) <= blockNumber,
  )
}

export function indexedCollectionForToken(
  bitsContract: string,
  tokenId: number,
) {
  return collectionForToken(INDEXED_COLLECTIONS, bitsContract, tokenId)
}

export function groupTokenItemsByCollection<T extends { tokenId: number }>(
  bitsContract: string,
  items: readonly T[],
) {
  const grouped = new Map<
    string,
    { collection: BitsCollectionConfig; items: T[] }
  >()

  for (const item of items) {
    const collection = indexedCollectionForToken(bitsContract, item.tokenId)
    if (!collection) continue

    const group = grouped.get(collection.slug) ?? { collection, items: [] }
    group.items.push(item)
    grouped.set(collection.slug, group)
  }

  return Array.from(grouped.values())
}

export function rendererBitMatchesToken(
  bit: BitsRendererBitTuple,
  token: {
    name: string
    audio_filename: string
    svg_filename: string
    source: string
    processed: number
  },
) {
  return (
    bit[0] === token.name &&
    bit[1] === token.audio_filename &&
    bit[2] === token.svg_filename &&
    bit[3] === token.source &&
    Number(bit[4]) === token.processed
  )
}

export function assertCollectionStateMatches(
  collection: BitsCollectionConfig,
  state: {
    startTokenId: number
    tokenCount: number
    renderer: string
    pricePerTokenWei: bigint
  },
) {
  const mismatches: string[] = []

  if (state.startTokenId !== collection.startTokenId) {
    mismatches.push(
      `start token ${state.startTokenId} (configured ${collection.startTokenId})`,
    )
  }
  if (state.tokenCount !== collection.tokenCount) {
    mismatches.push(
      `token count ${state.tokenCount} (configured ${collection.tokenCount})`,
    )
  }
  if (
    state.renderer.toLowerCase() !== collection.rendererContract.toLowerCase()
  ) {
    mismatches.push(
      `renderer ${state.renderer} (configured ${collection.rendererContract})`,
    )
  }
  if (state.pricePerTokenWei !== collection.pricePerTokenWei) {
    mismatches.push(
      `price ${state.pricePerTokenWei} (configured ${collection.pricePerTokenWei})`,
    )
  }

  if (mismatches.length) {
    throw new Error(
      `Collection ${collection.slug} does not match onchain state: ${mismatches.join(', ')}`,
    )
  }
}

export function tokenRowId(collection: BitsCollectionConfig, tokenId: number) {
  return `${collection.slug}:${tokenId}`
}

export function balanceRowId(input: {
  collection: BitsCollectionConfig
  tokenId: number
  owner: string
}) {
  return `${input.collection.slug}:${input.tokenId}:${input.owner.toLowerCase()}`
}
