import assert from 'node:assert/strict'
import test from 'node:test'
import {
  bitsCollections,
  collectionMintPrice,
  collectionTotalSupply,
  formatWeiLabel,
  getPrimaryBitsCollection,
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
