import assert from 'node:assert/strict'
import test from 'node:test'
import {
  bitsCollections,
  collectionMintStatus,
  collectionForToken,
  collectionIncludesTokenId,
  collectionMintPrice,
  createCollectionSummary,
  collectionTotalSupply,
  collectionsForBitsContract,
  formatWeiLabel,
  getPrimaryBitsCollection,
  isCollectionMintable,
  tokenAvailable,
  tokenIdsForCollection,
  validateBitsCollections,
} from '../src/index.ts'

test('configured collections validate', () => {
  assert.doesNotThrow(() => validateBitsCollections(bitsCollections))
})

test('primary collection exposes the configured token range', () => {
  const collection = getPrimaryBitsCollection()

  assert.equal(collection.slug, 'drums-collection-1')
  assert.deepEqual(
    tokenIdsForCollection(collection),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  )
})

test('supply and price helpers use bigint math', () => {
  const collection = getPrimaryBitsCollection()

  assert.equal(collectionTotalSupply(collection), 672n)
  assert.equal(collectionMintPrice(collection), 16_000_000_000_000_000n)
  assert.equal(formatWeiLabel(collection.pricePerTokenWei), '0.001 ETH')
})

test('collection mint status follows indexed onchain state', () => {
  const collection = getPrimaryBitsCollection()
  const indexing = createCollectionSummary(collection, 0n)
  const live = createCollectionSummary(collection, 0n, {
    indexed: true,
    active: true,
  })
  const closed = createCollectionSummary(collection, 0n, {
    indexed: true,
    active: false,
  })
  const soldOut = createCollectionSummary(
    collection,
    collectionTotalSupply(collection),
    { indexed: true, active: true },
  )

  assert.equal(collectionMintStatus(indexing), 'indexing')
  assert.equal(collectionMintStatus(live), 'live')
  assert.equal(collectionMintStatus(closed), 'closed')
  assert.equal(collectionMintStatus(soldOut), 'sold-out')
  assert.equal(isCollectionMintable(indexing), false)
  assert.equal(isCollectionMintable(live), true)
})

test('token availability never goes negative', () => {
  assert.equal(tokenAvailable(11n, 42n), 31n)
  assert.equal(tokenAvailable(42n, 42n), 0n)
  assert.equal(tokenAvailable(43n, 42n), 0n)
})

test('duplicate collection slugs fail loudly', () => {
  const [collection] = bitsCollections

  assert.throws(
    () => validateBitsCollections([collection, collection]),
    /Duplicate collection slug/,
  )
})

test('same-contract collections resolve by token range', () => {
  const [primary] = bitsCollections
  const second = {
    ...primary,
    slug: 'drums-collection-2',
    rendererContract: '0x1111111111111111111111111111111111111111',
    collectionId: 2n,
    startTokenId: 17,
    primary: false,
  } as const
  const collections = [primary, second]

  assert.doesNotThrow(() => validateBitsCollections(collections))
  assert.equal(collectionIncludesTokenId(primary, 1), true)
  assert.equal(collectionIncludesTokenId(primary, 16), true)
  assert.equal(collectionIncludesTokenId(primary, 17), false)
  assert.deepEqual(
    collectionsForBitsContract(collections, primary.bitsContract),
    collections,
  )
  assert.equal(
    collectionForToken(collections, primary.bitsContract, 16)?.slug,
    primary.slug,
  )
  assert.equal(
    collectionForToken(collections, primary.bitsContract, 17)?.slug,
    second.slug,
  )
  assert.equal(collectionForToken(collections, primary.bitsContract, 33), null)
})

test('duplicate contract collection ids fail loudly', () => {
  const [primary] = bitsCollections

  assert.throws(
    () =>
      validateBitsCollections([
        primary,
        {
          ...primary,
          slug: 'drums-collection-2',
          startTokenId: 17,
          primary: false,
        },
      ]),
    /Duplicate collection id/,
  )
})

test('overlapping same-contract token ranges fail loudly', () => {
  const [primary] = bitsCollections

  assert.throws(
    () =>
      validateBitsCollections([
        primary,
        {
          ...primary,
          slug: 'drums-collection-2',
          collectionId: 2n,
          startTokenId: 16,
          primary: false,
        },
      ]),
    /Overlapping token ranges/,
  )
})

test('collections require exactly one primary', () => {
  const [primary] = bitsCollections

  assert.throws(
    () => validateBitsCollections([{ ...primary, primary: false }]),
    /exactly one primary collection/,
  )
  assert.throws(
    () =>
      validateBitsCollections([
        primary,
        {
          ...primary,
          slug: 'drums-collection-2',
          collectionId: 2n,
          startTokenId: 17,
        },
      ]),
    /exactly one primary collection/,
  )
})

test('missing start blocks fail loudly', () => {
  const [collection] = bitsCollections

  assert.throws(
    () =>
      validateBitsCollections([
        {
          ...collection,
          tokenStartBlock: 0,
        },
      ]),
    /missing start blocks/,
  )
})
