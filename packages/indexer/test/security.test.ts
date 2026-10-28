import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { client, onchainTable } from 'ponder'

const turn = () => new Promise<void>((resolve) => setImmediate(resolve))
const queryUrl = (sql: string, path = 'live') =>
  `/sql/${path}?sql=${encodeURIComponent(JSON.stringify({ json: { sql, params: [] } }))}`

// Exercise the installed, shipped middleware with its real SQL parser and Hono
// streams. Only the database and Ponder process lifecycle are mocked.
async function fixture() {
  let notify: (channel: string, payload: string) => void = () => {}
  let execute = async (_sql: string): Promise<unknown> => ({
    rows: [{ id: 1 }],
  })
  const session = {
    dialect: {},
    prepareQuery: (query: { sql: string }) => ({
      execute: () => execute(query.sql),
    }),
  }
  Object.assign(globalThis, {
    PONDER_COMMON: {
      apiShutdown: { isKilled: false },
      logger: { debug() {} },
    },
    PONDER_NAMESPACE_BUILD: { schema: 'test' },
    PONDER_PRE_BUILD: {},
    PONDER_DATABASE: {
      driver: {
        dialect: 'pglite',
        instance: {
          query: async () => {},
          onNotification: (fn: typeof notify) => {
            notify = fn
          },
        },
      },
      readonlyQB: { wrap: async () => true },
    },
  })
  const schema = {
    items: onchainTable('items', (t) => ({ id: t.integer().primaryKey() })),
  }
  const db = { _: { session } } as unknown as Parameters<typeof client>[0]['db']
  const app = new Hono()
  app.onError(() => new Response('Internal error', { status: 500 }))
  app.use('/sql/*', client({ db, schema }))
  await turn()
  return {
    app,
    setExecute: (fn: typeof execute) => {
      execute = fn
    },
    notify: () => notify('test', '["items"]'),
  }
}

test('failed live requests never consume subscription slots', async () => {
  const { app, setExecute } = await fixture()
  const cases: [string, number][] = [
    ['/sql/live', 400],
    ['/sql/live?sql=not-json', 500],
    [queryUrl('DELETE FROM items'), 500],
    [queryUrl('SELECT * FROM items; SELECT 1'), 500],
    [queryUrl('SELECT * FROM pg_catalog.pg_roles'), 500],
    [queryUrl('SELECT pg_sleep(1)'), 500],
    [queryUrl('SELECT * FROM missing_table'), 500],
    [queryUrl('SELECT 2'), 500],
  ]
  setExecute(async (sql) => {
    if (sql === 'SELECT 2') return { rows: [1n] } // result hashing failure
    throw new Error('initial query failed')
  })
  // Every failure class alone exceeds the production limit. Without the patch,
  // this fails on request 1001, even though no live connection was established.
  for (const [url, status] of cases) {
    for (let i = 0; i < 1001; i++) {
      assert.equal((await app.request(url)).status, status, url)
    }
  }
  setExecute(async () => ({ rows: [{ id: 1 }] }))
  const response = await app.request(queryUrl('SELECT 3'))
  assert.equal(response.status, 200)
  await response.body!.cancel()
})

test('live streams enforce the cap and release exactly once on abort and completion', async () => {
  const { app, setExecute, notify } = await fixture()
  const responses: Response[] = []
  try {
    for (let i = 0; i < 1000; i++) {
      const response = await app.request(queryUrl('SELECT * FROM items'))
      assert.equal(response.status, 200)
      responses.push(response)
    }
    assert.equal((await app.request(queryUrl('SELECT 1'))).status, 503)
    await responses.pop()!.body!.cancel()
    await turn() // abort and callback finally must not decrement twice
    const replacement = await app.request(queryUrl('SELECT 1'))
    assert.equal(replacement.status, 200)
    responses.push(replacement)
    assert.equal((await app.request(queryUrl('SELECT 1'))).status, 503)

    setExecute(async () => {
      throw new Error('stream refresh failed')
    })
    notify()
    await turn()
    await turn()
    setExecute(async () => ({ rows: [] }))
    const next = await app.request(queryUrl('SELECT 4'))
    assert.equal(next.status, 200)
    await next.body!.cancel()
  } finally {
    await Promise.all(responses.map((response) => response.body!.cancel()))
    await turn()
  }
})

test('request aborts before and during SSE release slots without waiting for a block', async () => {
  const { app } = await fixture()
  for (let i = 0; i < 1001; i++) {
    const controller = new AbortController()
    if (i % 2 === 0) controller.abort()
    const response = await app.request(queryUrl('SELECT 1'), {
      signal: controller.signal,
    })
    assert.equal(response.status, 200)
    controller.abort()
    await response.body!.cancel()
  }
  await turn()
  const response = await app.request(queryUrl('SELECT 2'))
  assert.equal(response.status, 200)
  await response.body!.cancel()
})

test('Ponder resolves the patched Hono and default CORS still handles preflight', async () => {
  const require = createRequire(import.meta.resolve('ponder'))
  const manifest = JSON.parse(
    await readFile(
      new URL('../../package.json', pathToFileURL(require.resolve('hono'))),
      'utf8',
    ),
  )
  assert.equal(manifest.version, '4.13.14')
  const app = new Hono().use(cors({ origin: '*', maxAge: 86400 }))
  const response = await app.request('/sql/db', {
    method: 'OPTIONS',
    headers: { 'Access-Control-Request-Headers': 'Content-Type,   X-Client' },
  })
  assert.equal(response.status, 204)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*')
  assert.equal(
    response.headers.get('Access-Control-Allow-Headers'),
    'Content-Type,X-Client',
  )
  const corsSource = await readFile(require.resolve('hono/cors'), 'utf8')
  assert.doesNotMatch(corsSource, /split\(\/\\s\*,\\s\*\//)
})
