import {
  bitsCollections,
  collectionTotalSupply,
  validateBitsCollections,
  type BitsCollectionConfig,
} from '@bits-collection/shared'

export const INDEXED_COLLECTIONS = validateBitsCollections(bitsCollections)

export function contractNameForCollection(collection: BitsCollectionConfig) {
  return `Bits_${collection.slug.replace(/-/g, '_')}`
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

export function configuredCollectionTotalSupply(
  collection: BitsCollectionConfig,
) {
  return collectionTotalSupply(collection)
}
