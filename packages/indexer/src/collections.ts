import { ponder } from 'ponder:registry'
import type { Context } from 'ponder:registry'
import {
  ZERO_ADDRESS,
  bitsAbi,
  bitsRendererV1Abi,
  collectionTotalSupply,
  eventId,
  getRendererAdapter,
  tokenAvailable,
  tokenIdsForCollection,
  type BitsCollectionConfig,
  type BitsRendererBitTuple,
} from '@bits-collection/shared'
import {
  bitsActivity,
  bitsBalance,
  bitsCollection,
  bitsToken,
} from 'ponder:schema'
import { zeroAddress, type Address } from 'viem'
import {
  INDEXED_COLLECTIONS,
  balanceRowId,
  contractNameForCollection,
  tokenRowId,
} from '../utils/collections.ts'

type PonderContext = Context
type PonderEvent = {
  args: Record<string, unknown>
  block: { number: bigint; timestamp: bigint }
  log: { address: Address; logIndex: number }
  transaction: { hash: `0x${string}` }
}

async function readCollectionState(
  context: PonderContext,
  collection: BitsCollectionConfig,
) {
  const state = await context.client.readContract({
    abi: bitsAbi,
    address: collection.bitsContract,
    functionName: 'bitCollections',
    args: [collection.collectionId],
  })

  return {
    name: state[0] || collection.title,
    startTokenId: Number(state[1]),
    tokenCount: Number(state[2]),
    editionSize: state[3],
    minted: state[4],
    renderer: state[5],
    pricePerTokenWei: state[6] * 1_000_000_000_000_000n,
    active: state[7],
    locked: state[8],
  }
}

async function ensureCollection(
  context: PonderContext,
  collection: BitsCollectionConfig,
  timestamp: bigint,
) {
  const state = await readCollectionState(context, collection)

  await context.db
    .insert(bitsCollection)
    .values({
      slug: collection.slug,
      title: collection.title,
      artist: collection.artist,
      chain_id: collection.chainId,
      collection_id: collection.collectionId,
      bits_contract: collection.bitsContract,
      renderer_contract: collection.rendererContract,
      start_token_id: state.startTokenId || collection.startTokenId,
      token_count: state.tokenCount || collection.tokenCount,
      edition_size: state.editionSize || collection.editionSize,
      minted: state.minted,
      total_supply: collectionTotalSupply(collection),
      price_per_token_wei:
        state.pricePerTokenWei || collection.pricePerTokenWei,
      active: state.active,
      locked: state.locked,
      updated_at: timestamp,
    })
    .onConflictDoNothing()

  await context.db.update(bitsCollection, { slug: collection.slug }).set({
    title: collection.title,
    artist: collection.artist,
    chain_id: collection.chainId,
    collection_id: collection.collectionId,
    bits_contract: collection.bitsContract,
    renderer_contract: collection.rendererContract,
    start_token_id: state.startTokenId || collection.startTokenId,
    token_count: state.tokenCount || collection.tokenCount,
    edition_size: state.editionSize || collection.editionSize,
    minted: state.minted,
    total_supply: collectionTotalSupply(collection),
    price_per_token_wei: state.pricePerTokenWei || collection.pricePerTokenWei,
    active: state.active,
    locked: state.locked,
    updated_at: timestamp,
  })
}

async function refreshToken(
  context: PonderContext,
  collection: BitsCollectionConfig,
  tokenId: number,
  timestamp: bigint,
) {
  const adapter = getRendererAdapter(collection.rendererAdapter)
  const [minted, bit, svg, html] = await Promise.all([
    context.client.readContract({
      abi: bitsAbi,
      address: collection.bitsContract,
      functionName: 'tokenMinted',
      args: [BigInt(tokenId)],
    }),
    context.client.readContract({
      abi: bitsRendererV1Abi,
      address: collection.rendererContract,
      functionName: 'bits',
      args: [BigInt(tokenId)],
    }),
    context.client.readContract({
      abi: bitsRendererV1Abi,
      address: collection.rendererContract,
      functionName: 'tokenToSvg',
      args: [BigInt(tokenId)],
    }),
    context.client.readContract({
      abi: bitsRendererV1Abi,
      address: collection.rendererContract,
      functionName: 'tokenToHtml',
      args: [BigInt(tokenId)],
    }),
  ])
  const metadata = adapter.normalize({
    tokenId,
    bit: bit as BitsRendererBitTuple,
    svg,
    html,
    rendererUpdatedAt: Number(timestamp),
  })
  const available = tokenAvailable(minted, collection.editionSize)

  await context.db
    .insert(bitsToken)
    .values({
      id: tokenRowId(collection, tokenId),
      collection_slug: collection.slug,
      token_id: tokenId,
      minted,
      edition_size: collection.editionSize,
      available,
      name: metadata.name,
      audio_filename: metadata.audioFilename,
      svg_filename: metadata.svgFilename,
      source: metadata.source,
      processed: metadata.processed,
      svg: metadata.svg,
      html: metadata.html,
      renderer_updated_at: timestamp,
      updated_at: timestamp,
    })
    .onConflictDoNothing()

  await context.db
    .update(bitsToken, { id: tokenRowId(collection, tokenId) })
    .set({
      minted,
      edition_size: collection.editionSize,
      available,
      name: metadata.name,
      audio_filename: metadata.audioFilename,
      svg_filename: metadata.svgFilename,
      source: metadata.source,
      processed: metadata.processed,
      svg: metadata.svg,
      html: metadata.html,
      renderer_updated_at: timestamp,
      updated_at: timestamp,
    })
}

async function refreshBalance(
  context: PonderContext,
  collection: BitsCollectionConfig,
  tokenId: number,
  owner: Address,
  timestamp: bigint,
) {
  if (owner.toLowerCase() === zeroAddress) return

  const balance = await context.client.readContract({
    abi: bitsAbi,
    address: collection.bitsContract,
    functionName: 'balanceOf',
    args: [owner, BigInt(tokenId)],
  })
  const id = balanceRowId({ collection, tokenId, owner })

  await context.db
    .insert(bitsBalance)
    .values({
      id,
      collection_slug: collection.slug,
      token_id: tokenId,
      owner,
      balance,
      updated_at: timestamp,
    })
    .onConflictDoNothing()

  await context.db.update(bitsBalance, { id }).set({
    balance,
    updated_at: timestamp,
  })
}

async function recordActivity(
  context: PonderContext,
  collection: BitsCollectionConfig,
  event: PonderEvent,
  input: {
    idSuffix?: string
    type: string
    tokenId?: number
    operator?: Address
    from?: Address
    to?: Address
    value?: bigint
  },
) {
  await context.db
    .insert(bitsActivity)
    .values({
      id: `${eventId(event)}${input.idSuffix ?? ''}`,
      collection_slug: collection.slug,
      type: input.type,
      token_id: input.tokenId ?? null,
      operator: input.operator ?? null,
      from_address: input.from ?? null,
      to_address: input.to ?? null,
      value: input.value ?? null,
      block_number: event.block.number,
      tx_hash: event.transaction.hash,
      log_index: event.log.logIndex,
      timestamp: event.block.timestamp,
    })
    .onConflictDoNothing()
}

async function refreshTransferSideEffects(
  context: PonderContext,
  collection: BitsCollectionConfig,
  event: PonderEvent,
  tokenId: number,
  from: Address,
  to: Address,
) {
  await Promise.all([
    ensureCollection(context, collection, event.block.timestamp),
    refreshToken(context, collection, tokenId, event.block.timestamp),
    refreshBalance(context, collection, tokenId, from, event.block.timestamp),
    refreshBalance(context, collection, tokenId, to, event.block.timestamp),
  ])
}

for (const collection of INDEXED_COLLECTIONS) {
  const contractName = contractNameForCollection(collection)

  ponder.on(
    `${contractName}:TransferSingle` as never,
    async ({
      event,
      context,
    }: {
      event: PonderEvent
      context: PonderContext
    }) => {
      const tokenId = Number(event.args.id)
      const from = event.args.from as Address
      const to = event.args.to as Address
      const operator = event.args.operator as Address
      const value = event.args.value as bigint
      const type = from.toLowerCase() === ZERO_ADDRESS ? 'mint' : 'transfer'

      await recordActivity(context, collection, event, {
        type,
        tokenId,
        operator,
        from,
        to,
        value,
      })
      await refreshTransferSideEffects(
        context,
        collection,
        event,
        tokenId,
        from,
        to,
      )
    },
  )

  ponder.on(
    `${contractName}:TransferBatch` as never,
    async ({
      event,
      context,
    }: {
      event: PonderEvent
      context: PonderContext
    }) => {
      const from = event.args.from as Address
      const to = event.args.to as Address
      const operator = event.args.operator as Address
      const ids = event.args.ids as readonly bigint[]
      const values = event.args.values as readonly bigint[]
      const type = from.toLowerCase() === ZERO_ADDRESS ? 'mint' : 'transfer'

      await Promise.all(
        ids.map(async (id, index) => {
          const tokenId = Number(id)
          await recordActivity(context, collection, event, {
            idSuffix: `-${tokenId}-${index}`,
            type,
            tokenId,
            operator,
            from,
            to,
            value: values[index] ?? 0n,
          })
          await refreshTransferSideEffects(
            context,
            collection,
            event,
            tokenId,
            from,
            to,
          )
        }),
      )
    },
  )

  ponder.on(
    `${contractName}:MetadataUpdate` as never,
    async ({
      event,
      context,
    }: {
      event: PonderEvent
      context: PonderContext
    }) => {
      const tokenId = Number(event.args._tokenId)
      await recordActivity(context, collection, event, {
        type: 'metadata',
        tokenId,
      })
      await refreshToken(context, collection, tokenId, event.block.timestamp)
    },
  )

  ponder.on(
    `${contractName}:BatchMetadataUpdate` as never,
    async ({
      event,
      context,
    }: {
      event: PonderEvent
      context: PonderContext
    }) => {
      const fromTokenId = Number(event.args._fromTokenId)
      const toTokenId = Number(event.args._toTokenId)
      const configuredIds = new Set(tokenIdsForCollection(collection))
      const tokenIds = Array.from(
        { length: Math.max(0, toTokenId - fromTokenId + 1) },
        (_, index) => fromTokenId + index,
      ).filter((tokenId) => configuredIds.has(tokenId))

      await recordActivity(context, collection, event, {
        type: 'metadata',
      })
      await Promise.all(
        tokenIds.map((tokenId) =>
          refreshToken(context, collection, tokenId, event.block.timestamp),
        ),
      )
    },
  )

  ponder.on(
    `${contractName}:OwnershipTransferred` as never,
    async ({
      event,
      context,
    }: {
      event: PonderEvent
      context: PonderContext
    }) => {
      await recordActivity(context, collection, event, {
        type: 'ownership',
        from: event.args.previousOwner as Address,
        to: event.args.newOwner as Address,
      })
      await ensureCollection(context, collection, event.block.timestamp)
    },
  )
}
