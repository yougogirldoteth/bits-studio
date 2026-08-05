import type { BitsCollectionConfig } from './types.ts'
import { validateBitsCollections } from './validation.ts'

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
    tokenStartBlock: 25489308,
    rendererStartBlock: 25468403,
    rendererAdapter: 'bits-renderer-v1',
    editionSize: 42n,
    pricePerTokenWei: 1_000_000_000_000_000n,
    launchLabel: 'Minting is live on Ethereum mainnet.',
    mintLabel: 'Mint',
    explorerBaseUrl: 'https://evm.now',
    primary: false,
    theme: {
      accent: '#111111',
    },
  },
  {
    slug: 'drums-collection-2',
    title: 'Drums Collection 2',
    artist: '',
    description:
      'Sixteen onchain drum instruments rendered by the second BITS collection renderer.',
    chain: 'mainnet',
    chainId: 1,
    bitsContract: '0xb49911f9063154318dd98848c65c1cb15e43c917',
    rendererContract: '0xb13dbf35e262e0225a4be90dd318d99864ad0afa',
    collectionId: 2n,
    startTokenId: 17,
    tokenCount: 16,
    tokenStartBlock: 25541411,
    rendererStartBlock: 25541312,
    rendererAdapter: 'bits-renderer-v1',
    editionSize: 42n,
    pricePerTokenWei: 1_000_000_000_000_000n,
    launchLabel: 'Minting opens when every instrument is onchain.',
    mintLabel: 'Mint',
    explorerBaseUrl: 'https://evm.now',
    primary: false,
    theme: {
      accent: '#111111',
    },
  },
  {
    slug: 'one-shots-vol-1',
    title: 'One Shots vol. 1',
    artist: '',
    description: 'Sixteen fully onchain one-shot sounds',
    chain: 'mainnet',
    chainId: 1,
    bitsContract: '0xb49911f9063154318dd98848c65c1cb15e43c917',
    rendererContract: '0x8c7c981cecf6142c1d84d2952641386cb70b6387',
    collectionId: 3n,
    startTokenId: 33,
    tokenCount: 16,
    tokenStartBlock: 25687904,
    rendererStartBlock: 25687649,
    rendererAdapter: 'bits-renderer-v1',
    editionSize: 42n,
    pricePerTokenWei: 1_000_000_000_000_000n,
    launchLabel: 'Minting opens when every instrument is onchain.',
    mintLabel: 'Mint',
    explorerBaseUrl: 'https://evm.now',
    primary: true,
    theme: {
      accent: '#111111',
    },
  },
] as const satisfies readonly BitsCollectionConfig[]

validateBitsCollections(bitsCollections)

export type BitsCollectionSlug = (typeof bitsCollections)[number]['slug']

export function getBitsCollection(slug: string) {
  return bitsCollections.find((collection) => collection.slug === slug) ?? null
}

export function getPrimaryBitsCollection() {
  return bitsCollections.find((collection) => collection.primary)!
}
