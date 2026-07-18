import assert from 'node:assert/strict'
import test from 'node:test'
import { bitsCollections } from '@bits-collection/shared'
import {
  BITS_CONTRACT_NAME,
  INDEXED_BITS_CONTRACTS,
  RENDERER_RECONCILE_BLOCK_NAME,
  RENDERER_RECONCILE_INTERVAL,
  assertCollectionStateMatches,
  balanceRowId,
  bootstrapNameForCollection,
  groupTokenItemsByCollection,
  indexedCollectionForToken,
  indexedCollectionsForContract,
  indexedCollectionsForContractAtBlock,
  rendererBitMatchesToken,
  tokenRowId,
} from '../utils/collections.ts'

test('indexes each bits contract once', () => {
  const [collection, secondCollection] = bitsCollections

  assert.equal(BITS_CONTRACT_NAME, 'Bits')
  assert.equal(RENDERER_RECONCILE_BLOCK_NAME, 'RendererReconciliation')
  assert.equal(RENDERER_RECONCILE_INTERVAL, 10)
  assert.deepEqual(INDEXED_BITS_CONTRACTS, [collection.bitsContract])
  assert.deepEqual(
    indexedCollectionsForContract(collection.bitsContract),
    bitsCollections,
  )
  assert.equal(
    bootstrapNameForCollection(collection),
    'Bootstrap_drums_collection_1',
  )
  assert.equal(
    bootstrapNameForCollection(secondCollection),
    'Bootstrap_drums_collection_2',
  )
  assert.deepEqual(
    indexedCollectionsForContractAtBlock(
      collection.bitsContract,
      BigInt(collection.tokenStartBlock - 1),
    ),
    [],
  )
  assert.deepEqual(
    indexedCollectionsForContractAtBlock(
      collection.bitsContract,
      BigInt(collection.tokenStartBlock),
    ),
    [collection],
  )
  assert.deepEqual(
    indexedCollectionsForContractAtBlock(
      collection.bitsContract,
      BigInt(bitsCollections[1].tokenStartBlock - 1),
    ),
    [collection],
  )
  assert.deepEqual(
    indexedCollectionsForContractAtBlock(
      collection.bitsContract,
      BigInt(bitsCollections[1].tokenStartBlock),
    ),
    bitsCollections,
  )
})

test('detects renderer tuples that need reconciliation', () => {
  const token = {
    name: '',
    audio_filename: '',
    svg_filename: '',
    source: '',
    processed: 0,
  }
  const emptyBit = ['', '', '', '', 0] as const
  const liveBit = [
    'hyperkick',
    'hyperkick.wav',
    'hyperkick.svg',
    'Sub 37',
    1,
  ] as const

  assert.equal(rendererBitMatchesToken(emptyBit, token), true)
  assert.equal(rendererBitMatchesToken(liveBit, token), false)
  assert.equal(
    rendererBitMatchesToken(liveBit, {
      name: 'hyperkick',
      audio_filename: 'hyperkick.wav',
      svg_filename: 'hyperkick.svg',
      source: 'Sub 37',
      processed: 1,
    }),
    true,
  )
})

test('routes configured token ids and ignores unknown ids', () => {
  const [collection, secondCollection] = bitsCollections

  assert.equal(
    indexedCollectionForToken(collection.bitsContract, 1)?.slug,
    collection.slug,
  )
  assert.equal(
    indexedCollectionForToken(collection.bitsContract, 17)?.slug,
    secondCollection.slug,
  )
  assert.equal(indexedCollectionForToken(collection.bitsContract, 33), null)
  assert.deepEqual(
    groupTokenItemsByCollection(collection.bitsContract, [
      { tokenId: 1, value: 2n },
      { tokenId: 17, value: 1n },
      { tokenId: 33, value: 1n },
    ]),
    [
      { collection, items: [{ tokenId: 1, value: 2n }] },
      { collection: secondCollection, items: [{ tokenId: 17, value: 1n }] },
    ],
  )
})

test('derives stable token and balance row ids', () => {
  const [collection] = bitsCollections
  const owner = '0xCB7504C4cb986E80AB4983b44263381F21273482'

  assert.equal(tokenRowId(collection, 7), 'drums-collection-1:7')
  assert.equal(
    balanceRowId({ collection, tokenId: 7, owner }),
    'drums-collection-1:7:0xcb7504c4cb986e80ab4983b44263381f21273482',
  )
})

test('rejects immutable collection state that differs from configuration', () => {
  const [collection] = bitsCollections
  const state = {
    startTokenId: collection.startTokenId,
    tokenCount: collection.tokenCount,
    editionSize: collection.editionSize,
    renderer: collection.rendererContract,
    pricePerTokenWei: collection.pricePerTokenWei,
  }
  const changedSupplyState = {
    ...state,
    editionSize: collection.editionSize - 1n,
  }

  assert.doesNotThrow(() => assertCollectionStateMatches(collection, state))
  assert.doesNotThrow(() =>
    assertCollectionStateMatches(collection, changedSupplyState),
  )
  assert.throws(
    () =>
      assertCollectionStateMatches(collection, {
        ...state,
        startTokenId: 17,
        renderer: '0x1111111111111111111111111111111111111111',
      }),
    /does not match onchain state: start token 17.*renderer/,
  )
})
