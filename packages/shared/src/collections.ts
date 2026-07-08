import type { BitsCollectionConfig } from './types.ts'

export const bitsCollections = [
  {
    slug: 'drums-collection-1',
    title: 'Drums Collection 1',
    artist: '',
    description:
      'Sixteen onchain drum instruments rendered by the BITS collection renderer.',
    chain: 'mainnet',
    chainId: 1,
    bitsContract: '0xb49911f9063154318dd98848c65c1cb15e43c917',
    rendererContract: '0x841eb707c98bf64572c88bc3b8001568e1437e00',
    collectionId: 1n,
    startTokenId: 1,
    tokenCount: 16,
    tokenStartBlock: 25488778,
    rendererStartBlock: 25468403,
    rendererAdapter: 'bits-renderer-v1',
    editionSize: 42n,
    pricePerTokenWei: 1_000_000_000_000_000n,
    launchLabel: 'Minting is live on Ethereum mainnet.',
    mintLabel: 'Mint',
    explorerBaseUrl: 'https://evm.now',
    primary: true,
    theme: {
      accent: '#111111',
    },
  },
] as const satisfies readonly BitsCollectionConfig[]

export type BitsCollectionSlug = (typeof bitsCollections)[number]['slug']

export function getBitsCollection(slug: string) {
  return bitsCollections.find((collection) => collection.slug === slug) ?? null
}

export function getPrimaryBitsCollection() {
  return (
    bitsCollections.find((collection) => collection.primary) ??
    bitsCollections[0]
  )
}
