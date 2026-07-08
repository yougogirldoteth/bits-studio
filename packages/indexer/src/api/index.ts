import { Hono } from 'hono'
import type { Context } from 'hono'
import { client, graphql } from 'ponder'
import { asc, count, desc, eq } from 'ponder'
import { db } from 'ponder:api'
import schema, { bitsActivity, bitsCollection, bitsToken } from 'ponder:schema'
import {
  bitsCollections,
  createCollectionSummary,
  getBitsCollection,
  tokenAvailable,
  type BitsActivityItem,
  type BitsCollectionConfig,
  type BitsTokenSummary,
} from '@bits-collection/shared'

const app = new Hono()
const MAX_LIMIT = 100

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

function collectionSummary(
  config: BitsCollectionConfig,
  row?: CollectionRow | null,
) {
  return createCollectionSummary(config, rowMinted(row))
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
    items: bitsCollections.map((collection) =>
      collectionSummary(collection, rowsBySlug.get(collection.slug)),
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
    collection: collectionSummary(config, collectionRow),
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

app.use('/sql/*', client({ db, schema }))
app.use('/graphql', graphql({ db, schema }))
app.use('/', graphql({ db, schema }))

export default app
