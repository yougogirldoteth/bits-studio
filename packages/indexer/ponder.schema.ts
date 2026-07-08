import { index, onchainTable } from 'ponder'

export const bitsCollection = onchainTable('bits_collections', (t) => ({
  slug: t.text().primaryKey(),
  title: t.text().notNull(),
  artist: t.text().notNull(),
  chain_id: t.integer().notNull(),
  collection_id: t.bigint().notNull(),
  bits_contract: t.hex().notNull(),
  renderer_contract: t.hex().notNull(),
  start_token_id: t.integer().notNull(),
  token_count: t.integer().notNull(),
  edition_size: t.bigint().notNull(),
  minted: t.bigint().notNull(),
  total_supply: t.bigint().notNull(),
  price_per_token_wei: t.bigint().notNull(),
  active: t.boolean().notNull(),
  locked: t.boolean().notNull(),
  updated_at: t.bigint().notNull(),
}))

export const bitsToken = onchainTable(
  'bits_tokens',
  (t) => ({
    id: t.text().primaryKey(),
    collection_slug: t.text().notNull(),
    token_id: t.integer().notNull(),
    minted: t.bigint().notNull(),
    edition_size: t.bigint().notNull(),
    available: t.bigint().notNull(),
    name: t.text().notNull(),
    audio_filename: t.text().notNull(),
    svg_filename: t.text().notNull(),
    source: t.text().notNull(),
    processed: t.integer().notNull(),
    svg: t.text().notNull(),
    html: t.text().notNull(),
    renderer_updated_at: t.bigint(),
    updated_at: t.bigint().notNull(),
  }),
  (table) => ({
    collectionTokenIdx: index('bits_token_collection_token_idx').on(
      table.collection_slug,
      table.token_id,
    ),
  }),
)

export const bitsBalance = onchainTable(
  'bits_balances',
  (t) => ({
    id: t.text().primaryKey(),
    collection_slug: t.text().notNull(),
    token_id: t.integer().notNull(),
    owner: t.hex().notNull(),
    balance: t.bigint().notNull(),
    updated_at: t.bigint().notNull(),
  }),
  (table) => ({
    ownerIdx: index('bits_balance_owner_idx').on(table.owner),
    tokenIdx: index('bits_balance_token_idx').on(
      table.collection_slug,
      table.token_id,
    ),
  }),
)

export const bitsActivity = onchainTable(
  'bits_activity',
  (t) => ({
    id: t.text().primaryKey(),
    collection_slug: t.text().notNull(),
    type: t.text().notNull(),
    token_id: t.integer(),
    operator: t.hex(),
    from_address: t.hex(),
    to_address: t.hex(),
    value: t.bigint(),
    block_number: t.bigint().notNull(),
    tx_hash: t.hex().notNull(),
    log_index: t.integer().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (table) => ({
    collectionTimestampIdx: index('bits_activity_collection_timestamp_idx').on(
      table.collection_slug,
      table.timestamp,
    ),
    tokenTimestampIdx: index('bits_activity_token_timestamp_idx').on(
      table.collection_slug,
      table.token_id,
      table.timestamp,
    ),
  }),
)
