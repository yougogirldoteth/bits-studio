import type { BitsCollectionSummary } from '@bits-collection/shared'

const FALLBACK_TITLE = 'BITS Collections'
const FALLBACK_DESCRIPTION =
  'Reusable mint and gallery frontend for BITS collections.'

export function collectionPageTitle(collection?: BitsCollectionSummary) {
  return collection ? `${collection.title} | BITS Collections` : FALLBACK_TITLE
}

export function collectionSeoDescription(collection?: BitsCollectionSummary) {
  if (!collection) return FALLBACK_DESCRIPTION

  const description = collection.description.replace(/[.。]+$/, '')
  const artist = collection.artist ? ` by ${collection.artist}` : ''
  return `${description}. ${collection.tokenCount} tokens on Ethereum mainnet${artist}.`
}

export function collectionOgImagePath(slug: string) {
  return `/og/collections/${encodeURIComponent(slug)}`
}

export function absoluteUrl(path: string, origin: string) {
  return new URL(path, origin).toString()
}
