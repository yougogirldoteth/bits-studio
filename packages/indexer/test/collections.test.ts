import assert from 'node:assert/strict'
import test from 'node:test'
import { getPrimaryBitsCollection } from '@bits-collection/shared'
import {
  balanceRowId,
  contractNameForCollection,
  tokenRowId,
} from '../utils/collections.ts'

test('derives stable contract names from collection slugs', () => {
  const collection = getPrimaryBitsCollection()

  assert.equal(contractNameForCollection(collection), 'Bits_drums_collection_1')
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
