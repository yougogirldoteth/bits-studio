import assert from 'node:assert/strict'
import test from 'node:test'
import { getPrimaryBitsCollection } from '@bits-collection/shared'
import {
  BITS_CONTRACT_NAME,
  INDEXED_BITS_CONTRACTS,
  balanceRowId,
  groupTokenItemsByCollection,
  indexedCollectionForToken,
  indexedCollectionsForContract,
  tokenRowId,
} from '../utils/collections.ts'

test('indexes each bits contract once', () => {
  const collection = getPrimaryBitsCollection()

  assert.equal(BITS_CONTRACT_NAME, 'Bits')
  assert.deepEqual(INDEXED_BITS_CONTRACTS, [collection.bitsContract])
  assert.deepEqual(indexedCollectionsForContract(collection.bitsContract), [
    collection,
  ])
})

test('routes configured token ids and ignores unknown ids', () => {
  const collection = getPrimaryBitsCollection()

  assert.equal(
    indexedCollectionForToken(collection.bitsContract, 1)?.slug,
    collection.slug,
  )
  assert.equal(indexedCollectionForToken(collection.bitsContract, 17), null)
  assert.deepEqual(
    groupTokenItemsByCollection(collection.bitsContract, [
      { tokenId: 1, value: 2n },
      { tokenId: 17, value: 1n },
    ]),
    [{ collection, items: [{ tokenId: 1, value: 2n }] }],
  )
})

test('derives stable token and balance row ids', () => {
  const collection = getPrimaryBitsCollection()
  const owner = '0xCB7504C4cb986E80AB4983b44263381F21273482'

  assert.equal(tokenRowId(collection, 7), 'drums-collection-1:7')
  assert.equal(
    balanceRowId({ collection, tokenId: 7, owner }),
    'drums-collection-1:7:0xcb7504c4cb986e80ab4983b44263381f21273482',
  )
})
