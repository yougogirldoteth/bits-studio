import { formatEther, getAddress, isAddress } from 'viem'
import type {
  BitsActivityItem,
  BitsCollectionConfig,
  BitsCollectionMintStatus,
  BitsCollectionSummary,
  BitsTokenSummary,
} from './types.ts'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function toChecksumAddress(address: string) {
  if (!isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`)
  }

  return getAddress(address)
}

export function tokenIdsForCollection(collection: BitsCollectionConfig) {
  return Array.from(
    { length: collection.tokenCount },
    (_, index) => collection.startTokenId + index,
  )
}

export function collectionIncludesTokenId(
  collection: BitsCollectionConfig,
  tokenId: number,
) {
  return (
    tokenId >= collection.startTokenId &&
    tokenId < collection.startTokenId + collection.tokenCount
  )
}

export function collectionsForBitsContract(
  collections: readonly BitsCollectionConfig[],
  bitsContract: string,
) {
  const address = bitsContract.toLowerCase()
  return collections.filter(
    (collection) => collection.bitsContract.toLowerCase() === address,
  )
}

export function collectionForToken(
  collections: readonly BitsCollectionConfig[],
  bitsContract: string,
  tokenId: number,
) {
  return (
    collectionsForBitsContract(collections, bitsContract).find((collection) =>
      collectionIncludesTokenId(collection, tokenId),
    ) ?? null
  )
}

export function collectionTotalSupply(collection: BitsCollectionConfig) {
  return BigInt(collection.tokenCount) * collection.editionSize
}

export function tokenAvailable(minted: bigint, editionSize: bigint) {
  return editionSize > minted ? editionSize - minted : 0n
}

export function isTokenSoldOut(minted: bigint, editionSize: bigint) {
  return tokenAvailable(minted, editionSize) === 0n
}

export function collectionMintPrice(collection: BitsCollectionConfig) {
  return collection.pricePerTokenWei * BigInt(collection.tokenCount)
}

export function formatWeiLabel(value: bigint) {
  const eth = formatEther(value)
  return `${trimDecimals(eth)} ETH`
}

export function trimDecimals(value: string) {
  return value.includes('.')
    ? value.replace(/0+$/, '').replace(/\.$/, '')
    : value
}

export function collectionExplorerUrl(collection: BitsCollectionConfig) {
  return `${collection.explorerBaseUrl}/address/${collection.bitsContract}`
}

export function rendererExplorerUrl(collection: BitsCollectionConfig) {
  return `${collection.explorerBaseUrl}/address/${collection.rendererContract}`
}

export function tokenExplorerUrl(collection: BitsCollectionConfig) {
  return `${collection.explorerBaseUrl}/address/${collection.bitsContract}`
}

export function eventId(event: {
  transaction: { hash: `0x${string}` }
  log: { logIndex: number }
}) {
  return `${event.transaction.hash}-${event.log.logIndex}`
}

export function createCollectionSummary(
  collection: BitsCollectionConfig,
  minted: bigint,
  options: {
    artist?: string
    indexed?: boolean
    active?: boolean
    locked?: boolean
    rendererContract?: BitsCollectionConfig['rendererContract']
    tokenCount?: number
    totalSupply?: bigint
    pricePerTokenWei?: bigint
  } = {},
): BitsCollectionSummary {
  const artist = options.artist ?? collection.artist
  const rendererContract =
    options.rendererContract ?? collection.rendererContract
  const tokenCount = options.tokenCount ?? collection.tokenCount
  const totalSupply =
    options.totalSupply ?? BigInt(tokenCount) * collection.editionSize
  const pricePerTokenWei =
    options.pricePerTokenWei ?? collection.pricePerTokenWei

  return {
    slug: collection.slug,
    title: collection.title,
    artist,
    description: collection.description,
    chain: collection.chain,
    chainId: collection.chainId,
    collectionId: collection.collectionId.toString(),
    bitsContract: collection.bitsContract,
    rendererContract,
    tokenCount,
    indexed: options.indexed ?? false,
    active: options.active ?? false,
    locked: options.locked ?? false,
    minted: minted.toString(),
    totalSupply: totalSupply.toString(),
    pricePerTokenWei: pricePerTokenWei.toString(),
    priceLabel: formatWeiLabel(pricePerTokenWei),
    launchLabel: collection.launchLabel,
    explorerUrl: collectionExplorerUrl(collection),
    rendererExplorerUrl: `${collection.explorerBaseUrl}/address/${rendererContract}`,
    artistUrl: artist
      ? `${collection.explorerBaseUrl}/address/${artist}`
      : undefined,
    theme: collection.theme,
  }
}

export function collectionMintStatus(
  collection: BitsCollectionSummary,
): BitsCollectionMintStatus {
  if (!collection.indexed) return 'indexing'
  if (BigInt(collection.minted) >= BigInt(collection.totalSupply)) {
    return 'sold-out'
  }
  if (!collection.active || collection.locked) return 'closed'
  return 'live'
}

export function isCollectionMintable(collection: BitsCollectionSummary) {
  return collectionMintStatus(collection) === 'live'
}

export function createTokenSummary(input: {
  collection: BitsCollectionConfig
  metadata: Omit<
    BitsTokenSummary,
    'collectionSlug' | 'minted' | 'editionSize' | 'available' | 'soldOut'
  >
  minted: bigint
}) {
  const available = tokenAvailable(input.minted, input.collection.editionSize)

  return {
    ...input.metadata,
    collectionSlug: input.collection.slug,
    minted: input.minted.toString(),
    editionSize: input.collection.editionSize.toString(),
    available: available.toString(),
    soldOut: available === 0n,
  } satisfies BitsTokenSummary
}

export function isMintActivity(item: BitsActivityItem) {
  return item.type === 'mint' && item.from?.toLowerCase() === ZERO_ADDRESS
}
