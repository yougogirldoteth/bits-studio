import { loadBalance } from '@ponder/utils'
import { createConfig } from 'ponder'
import { fallback, http } from 'viem'
import { bitsAbi } from '@bits-collection/shared'
import {
  INDEXED_COLLECTIONS,
  contractNameForCollection,
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

const contracts = Object.fromEntries(
  INDEXED_COLLECTIONS.map((collection) => [
    contractNameForCollection(collection),
    {
      chain: collection.chain,
      abi: bitsAbi,
      address: collection.bitsContract,
      startBlock: collection.tokenStartBlock,
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
  contracts,
})
