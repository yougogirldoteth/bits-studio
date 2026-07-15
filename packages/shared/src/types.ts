import type { Address } from 'viem'

export type BitsChainKey = 'mainnet'

export type BitsRendererAdapterId = 'bits-renderer-v1'

export type BitsCollectionTheme = {
  accent?: string
}

export type BitsCollectionConfig = {
  slug: string
  title: string
  artist: string
  description: string
  chain: BitsChainKey
  chainId: number
  bitsContract: Address
  rendererContract: Address
  collectionId: bigint
  startTokenId: number
  tokenCount: number
  tokenStartBlock: number
  rendererStartBlock: number
  rendererAdapter: BitsRendererAdapterId
  editionSize: bigint
  pricePerTokenWei: bigint
  launchLabel: string
  mintLabel: string
  explorerBaseUrl: string
  primary?: boolean
  theme?: BitsCollectionTheme
}

export type BitsCollectionSummary = {
  slug: string
  title: string
  artist: string
  description: string
  chain: BitsChainKey
  chainId: number
  collectionId: string
  bitsContract: Address
  rendererContract: Address
  tokenCount: number
  indexed: boolean
  active: boolean
  locked: boolean
  minted: string
  totalSupply: string
  pricePerTokenWei: string
  priceLabel: string
  launchLabel: string
  explorerUrl: string
  rendererExplorerUrl: string
  artistUrl?: string
  theme?: BitsCollectionTheme
}

export type BitsCollectionMintStatus =
  'indexing' | 'sold-out' | 'closed' | 'live'

export type BitsTokenMetadata = {
  tokenId: number
  name: string
  audioFilename: string
  svgFilename: string
  source: string
  processed: number
  svg: string
  html: string
  rendererUpdatedAt?: number
}

export type BitsTokenSummary = BitsTokenMetadata & {
  collectionSlug: string
  minted: string
  editionSize: string
  available: string
  soldOut: boolean
}

export type BitsTokenArtwork = Pick<
  BitsTokenMetadata,
  'tokenId' | 'name' | 'svg'
>

export type BitsHolderSummary = {
  owner: Address
  ensName?: string
  balance: string
  tokenCount: number
  explorerUrl: string
}

export type BitsActivityType = 'mint' | 'transfer' | 'metadata' | 'ownership'

export type BitsActivityItem = {
  id: string
  collectionSlug: string
  type: BitsActivityType
  tokenId?: number
  from?: Address
  to?: Address
  operator?: Address
  value?: string
  txHash: `0x${string}`
  blockNumber: string
  logIndex: number
  timestamp?: number
}
