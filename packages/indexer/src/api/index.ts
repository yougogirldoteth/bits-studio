import { Hono } from 'hono'
import type { Context } from 'hono'
import { client, graphql } from 'ponder'
import { and, asc, count, countDistinct, desc, eq, gt, sql } from 'ponder'
import { db } from 'ponder:api'
import schema, {
  bitsActivity,
  bitsBalance,
  bitsCollection,
  bitsToken,
} from 'ponder:schema'
import { createPublicClient, getAddress, http, type Address } from 'viem'
import { mainnet } from 'viem/chains'
import {
  bitsCollections,
  createCollectionSummary,
  getBitsCollection,
  tokenAvailable,
  type BitsActivityItem,
  type BitsCollectionConfig,
  type BitsHolderSummary,
  type BitsTokenSummary,
} from '@bits-collection/shared'
import { resolveOnchainArtist } from '../artist.ts'

const app = new Hono()
const MAX_LIMIT = 100
const artistRpcUrl = process.env.PONDER_RPC_URLS_1?.split(',').find(Boolean)
const artistClient = createPublicClient({
  chain: mainnet,
  transport: artistRpcUrl ? http(artistRpcUrl) : http(),
})
const artistCache = new Map<string, Promise<string>>()
const ensCache = new Map<string, Promise<string | undefined>>()

type CollectionRow = typeof bitsCollection.$inferSelect
type TokenRow = typeof bitsToken.$inferSelect
type ActivityRow = typeof bitsActivity.$inferSelect

function noStore(c: Context) {
  c.header('Cache-Control', 'no-store')
}

function parsePagination(c: Context) {
  const offset = Math.max(0, Number(c.req.query('offset') ?? 0) || 0)
  const rawLimit = Math.max(1, Number(c.req.query('limit') ?? 50) || 50)
  return { offset, limit: Math.min(rawLimit, MAX_LIMIT) }
}

function rowMinted(row: CollectionRow | null | undefined) {
  return row?.minted ?? 0n
}

async function resolveCollectionArtist(
  config: BitsCollectionConfig,
  row?: CollectionRow | null,
) {
  if (!artistCache.has(config.slug)) {
    artistCache.set(
      config.slug,
      resolveOnchainArtist(artistClient, config, row?.renderer_contract).catch(
        () => row?.artist || config.artist,
      ),
    )
  }

  return artistCache.get(config.slug)!
}

async function resolveEnsName(owner: Address) {
  const key = owner.toLowerCase()

  if (!ensCache.has(key)) {
    ensCache.set(
      key,
      artistClient
        .getEnsName({ address: owner })
        .then((name) => name ?? undefined)
        .catch(() => undefined),
    )
  }

  return ensCache.get(key)!
}

async function collectionSummary(
  config: BitsCollectionConfig,
  row?: CollectionRow | null,
) {
  return createCollectionSummary(config, rowMinted(row), {
    artist: await resolveCollectionArtist(config, row),
    indexed: Boolean(row),
    active: row?.active ?? false,
    locked: row?.locked ?? false,
    rendererContract: row?.renderer_contract,
    tokenCount: row?.token_count,
    totalSupply: row?.total_supply,
    pricePerTokenWei: row?.price_per_token_wei,
  })
}

function tokenSummary(row: TokenRow): BitsTokenSummary {
  const available = tokenAvailable(row.minted, row.edition_size)

  return {
    tokenId: row.token_id,
    collectionSlug: row.collection_slug,
    name: row.name,
    audioFilename: row.audio_filename,
    svgFilename: row.svg_filename,
    source: row.source,
    processed: row.processed,
    svg: row.svg,
    html: row.html,
    rendererUpdatedAt: row.renderer_updated_at
      ? Number(row.renderer_updated_at)
      : undefined,
    minted: row.minted.toString(),
    editionSize: row.edition_size.toString(),
    available: available.toString(),
    soldOut: available === 0n,
  }
}

function activityItem(row: ActivityRow): BitsActivityItem {
  return {
    id: row.id,
    collectionSlug: row.collection_slug,
    type: row.type as BitsActivityItem['type'],
    tokenId: row.token_id ?? undefined,
    operator: row.operator ?? undefined,
    from: row.from_address ?? undefined,
    to: row.to_address ?? undefined,
    value: row.value?.toString(),
    txHash: row.tx_hash,
    blockNumber: row.block_number.toString(),
    logIndex: row.log_index,
    timestamp: Number(row.timestamp),
  }
}

async function holderSummary(
  config: BitsCollectionConfig,
  row: {
    owner: Address
    balance: string | number | bigint | null
    tokenCount: number
  },
): Promise<BitsHolderSummary> {
  const owner = getAddress(row.owner)
  const ensName = await resolveEnsName(owner)

  return {
    owner,
    ensName,
    balance: BigInt(row.balance ?? 0).toString(),
    tokenCount: row.tokenCount,
    explorerUrl: `${config.explorerBaseUrl}/address/${ensName ?? owner}`,
  }
}

async function findCollectionRow(slug: string) {
  return db
    .select()
    .from(bitsCollection)
    .where(eq(bitsCollection.slug, slug))
    .then((rows) => rows[0] ?? null)
}

async function listTokenRows(slug: string) {
  return db
    .select()
    .from(bitsToken)
    .where(eq(bitsToken.collection_slug, slug))
    .orderBy(asc(bitsToken.token_id))
}

app.get('/collections', async (c) => {
  noStore(c)
  const rows = await db.select().from(bitsCollection)
  const rowsBySlug = new Map(rows.map((row) => [row.slug, row]))

  return c.json({
    items: await Promise.all(
      bitsCollections.map((collection) =>
        collectionSummary(collection, rowsBySlug.get(collection.slug)),
      ),
    ),
  })
})

app.get('/collections/:slug', async (c) => {
  noStore(c)
  const config = getBitsCollection(c.req.param('slug'))
  if (!config) return c.json({ error: 'Unknown collection' }, 404)

  const [collectionRow, tokens] = await Promise.all([
    findCollectionRow(config.slug),
    listTokenRows(config.slug),
  ])

  return c.json({
    collection: await collectionSummary(config, collectionRow),
    tokens: tokens.map(tokenSummary),
  })
})

app.get('/collections/:slug/tokens', async (c) => {
  noStore(c)
  const config = getBitsCollection(c.req.param('slug'))
  if (!config) return c.json({ error: 'Unknown collection' }, 404)

  return c.json({ items: (await listTokenRows(config.slug)).map(tokenSummary) })
})

app.get('/collections/:slug/tokens/:tokenId', async (c) => {
  noStore(c)
  const config = getBitsCollection(c.req.param('slug'))
  if (!config) return c.json({ error: 'Unknown collection' }, 404)

  const tokenId = Number(c.req.param('tokenId'))
  const row = await db
    .select()
    .from(bitsToken)
    .where(eq(bitsToken.id, `${config.slug}:${tokenId}`))
    .then((rows) => rows[0] ?? null)

  if (!row) return c.json({ error: 'Unknown token' }, 404)
  return c.json({ token: tokenSummary(row) })
})

app.get('/collections/:slug/activity', async (c) => {
  noStore(c)
  const config = getBitsCollection(c.req.param('slug'))
  if (!config) return c.json({ error: 'Unknown collection' }, 404)

  const { offset, limit } = parsePagination(c)
  const [items, totalRows] = await Promise.all([
    db
      .select()
      .from(bitsActivity)
      .where(eq(bitsActivity.collection_slug, config.slug))
      .orderBy(desc(bitsActivity.timestamp), desc(bitsActivity.block_number))
      .offset(offset)
      .limit(limit),
    db
      .select({ count: count() })
      .from(bitsActivity)
      .where(eq(bitsActivity.collection_slug, config.slug)),
  ])

  return c.json({
    items: items.map(activityItem),
    total: Number(totalRows[0]?.count ?? 0),
  })
})

app.get('/collections/:slug/holders', async (c) => {
  noStore(c)
  const config = getBitsCollection(c.req.param('slug'))
  if (!config) return c.json({ error: 'Unknown collection' }, 404)

  const { offset, limit } = parsePagination(c)
  const totalBalance = sql<string>`sum(${bitsBalance.balance})`
  const positiveBalanceFilter = and(
    eq(bitsBalance.collection_slug, config.slug),
    gt(bitsBalance.balance, 0n),
  )

  const [items, totalRows] = await Promise.all([
    db
      .select({
        owner: bitsBalance.owner,
        balance: totalBalance,
        tokenCount: count(),
      })
      .from(bitsBalance)
      .where(positiveBalanceFilter)
      .groupBy(bitsBalance.owner)
      .orderBy(desc(totalBalance))
      .offset(offset)
      .limit(limit),
    db
      .select({ count: countDistinct(bitsBalance.owner) })
      .from(bitsBalance)
      .where(positiveBalanceFilter),
  ])

  return c.json({
    items: await Promise.all(items.map((row) => holderSummary(config, row))),
    total: Number(totalRows[0]?.count ?? 0),
  })
})

app.use('/sql/*', client({ db, schema }))
app.use('/graphql', graphql({ db, schema }))
app.use('/', graphql({ db, schema }))

export default app
