import {
  bitsCollections,
  collectionForToken,
  collectionsForBitsContract,
  validateBitsCollections,
  type BitsCollectionConfig,
} from '@bits-collection/shared'

export const INDEXED_COLLECTIONS = validateBitsCollections(bitsCollections)
export const BITS_CONTRACT_NAME = 'Bits'
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

export function indexedCollectionsForContract(bitsContract: string) {
  return collectionsForBitsContract(INDEXED_COLLECTIONS, bitsContract)
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
