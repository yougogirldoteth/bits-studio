import { loadBalance } from '@ponder/utils'
import { createConfig } from 'ponder'
import { fallback, http } from 'viem'
import { bitsAbi } from '@bits-collection/shared'
import {
  BITS_CONTRACT_NAME,
  BITS_START_BLOCK,
  INDEXED_COLLECTIONS,
  INDEXED_BITS_CONTRACTS,
  RENDERER_RECONCILE_BLOCK_NAME,
  RENDERER_RECONCILE_INTERVAL,
  bootstrapNameForCollection,
} from './utils/collections.ts'

const chainId = 1
const rpcUrls = (process.env.PONDER_RPC_URLS_1 ?? '')
  .split(/[\s,]+/)
  .filter(Boolean)
const fallbackRpcUrls = (process.env.PONDER_RPC_FALLBACK_URLS_1 ?? '')
  .split(/[\s,]+/)
  .filter(Boolean)
const wsUrl = process.env.PONDER_WS_URL_1 || undefined

if (rpcUrls.length === 0) {
  throw new Error('No RPC URLs configured. Set PONDER_RPC_URLS_1.')
}

const primaryTransport = loadBalance(
  rpcUrls.map((url) => http(url, { timeout: 60_000 })),
)
const rpcTransport = fallbackRpcUrls.length
  ? fallback([
      primaryTransport,
      ...fallbackRpcUrls.map((url) => http(url, { timeout: 60_000 })),
    ])
  : primaryTransport

const collectionBootstraps = Object.fromEntries(
  INDEXED_COLLECTIONS.map((collection) => [
    bootstrapNameForCollection(collection),
    {
      chain: collection.chain,
      startBlock: collection.tokenStartBlock,
      endBlock: collection.tokenStartBlock,
      interval: 1,
    },
  ]),
)

export default createConfig({
  chains: {
    mainnet: {
      id: chainId,
      rpc: rpcTransport,
      ws: wsUrl,
    },
  },
  contracts: {
    [BITS_CONTRACT_NAME]: {
      chain: 'mainnet',
      abi: bitsAbi,
      address: INDEXED_BITS_CONTRACTS,
      startBlock: BITS_START_BLOCK,
    },
  },
  blocks: {
    ...collectionBootstraps,
    [RENDERER_RECONCILE_BLOCK_NAME]: {
      chain: 'mainnet',
      startBlock: 'latest',
      interval: RENDERER_RECONCILE_INTERVAL,
    },
  },
})
