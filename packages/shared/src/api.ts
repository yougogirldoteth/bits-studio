import type {
  BitsActivityItem,
  BitsCollectionSummary,
  BitsHolderSummary,
  BitsTokenArtwork,
  BitsTokenSummary,
} from './types.ts'

export type BitsCollectionsResponse = {
  items: BitsCollectionSummary[]
}

export type BitsCollectionResponse = {
  collection: BitsCollectionSummary
  tokens: BitsTokenSummary[]
}

export type BitsTokensResponse = {
  items: BitsTokenSummary[]
}

export type BitsCollectionArtworkResponse = {
  items: BitsTokenArtwork[]
}

export type BitsTokenResponse = {
  token: BitsTokenSummary
}

export type BitsActivityResponse = {
  items: BitsActivityItem[]
  total: number
}

export type BitsHoldersResponse = {
  items: BitsHolderSummary[]
  total: number
}
