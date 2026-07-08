import { isAddress } from 'viem'
import { rendererAdapters } from './renderer.ts'
import type { BitsCollectionConfig } from './types.ts'

export function validateBitsCollections(
  collections: readonly BitsCollectionConfig[],
) {
  const slugs = new Set<string>()

  for (const collection of collections) {
    validateBitsCollection(collection)

    if (slugs.has(collection.slug)) {
      throw new Error(`Duplicate collection slug: ${collection.slug}`)
    }
    slugs.add(collection.slug)
  }

  return collections
}

export function validateBitsCollection(collection: BitsCollectionConfig) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(collection.slug)) {
    throw new Error(`Invalid collection slug: ${collection.slug}`)
  }

  if (!collection.title.trim()) {
    throw new Error(`Collection ${collection.slug} is missing a title`)
  }

  if (collection.chain !== 'mainnet' || collection.chainId !== 1) {
    throw new Error(
      `Collection ${collection.slug} must target Ethereum mainnet`,
    )
  }

  if (!isAddress(collection.bitsContract)) {
    throw new Error(
      `Collection ${collection.slug} has an invalid bits contract`,
    )
  }

  if (!isAddress(collection.rendererContract)) {
    throw new Error(
      `Collection ${collection.slug} has an invalid renderer contract`,
    )
  }

  if (collection.collectionId <= 0n) {
    throw new Error(
      `Collection ${collection.slug} has an invalid collection id`,
    )
  }

  if (collection.startTokenId <= 0 || collection.tokenCount <= 0) {
    throw new Error(`Collection ${collection.slug} has an invalid token range`)
  }

  if (collection.tokenStartBlock <= 0 || collection.rendererStartBlock <= 0) {
    throw new Error(`Collection ${collection.slug} is missing start blocks`)
  }

  if (collection.editionSize <= 0n) {
    throw new Error(`Collection ${collection.slug} has an invalid edition size`)
  }

  if (collection.pricePerTokenWei < 0n) {
    throw new Error(`Collection ${collection.slug} has an invalid price`)
  }

  if (!rendererAdapters[collection.rendererAdapter]) {
    throw new Error(
      `Collection ${collection.slug} has an unsupported renderer adapter`,
    )
  }

  return collection
}
