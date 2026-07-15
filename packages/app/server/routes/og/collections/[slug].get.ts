import type { BitsCollectionArtworkResponse } from '@bits-collection/shared'
import type { H3Event } from 'h3'
import { renderCollectionOgGrid } from '~~/server/utils/collectionOgGrid'

const CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing collection slug',
    })
  }

  const artwork = await fetchCollectionArtworkForOg(event, slug)
  const body = await renderCollectionOgGrid(artwork.items)
  if (!body) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No collection artwork',
    })
  }

  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', CACHE_CONTROL)
  return body
})

async function fetchCollectionArtworkForOg(event: H3Event, slug: string) {
  const config = useRuntimeConfig(event)
  const base = String(config.public.bits.indexerUrl).replace(/\/+$/, '')
  const response = await fetch(
    `${base}/collections/${encodeURIComponent(slug)}/artwork`,
  )

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Indexer artwork ${slug} returned ${response.status}`,
    })
  }

  return (await response.json()) as BitsCollectionArtworkResponse
}
