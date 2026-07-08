import { bitsAbi, type BitsCollectionSummary } from '@bits-collection/shared'
import type { Address } from 'viem'

type Hash = `0x${string}`

export function useBitsContracts() {
  const writer = import.meta.client ? useWriteContract() : null
  const { address } = useAccount()

  function requireWriter() {
    if (!writer) {
      throw new Error('Contract writes are only available in the browser.')
    }

    if (!address.value) {
      throw new Error('Connect a wallet first.')
    }

    return { writer, recipient: address.value as Address }
  }

  function createMintCollectionRequest(collection: BitsCollectionSummary) {
    return () => {
      const { writer, recipient } = requireWriter()
      return writer.writeContractAsync({
        address: collection.bitsContract,
        abi: bitsAbi,
        functionName: 'mintCollectionPublic',
        args: [BigInt(collection.collectionId), recipient],
        chainId: collection.chainId,
        value: BigInt(collection.pricePerTokenWei) * BigInt(collection.tokenCount),
      }) as Promise<Hash>
    }
  }

  function createMintTokenRequest(
    collection: BitsCollectionSummary,
    tokenId: number,
  ) {
    return () => {
      const { writer, recipient } = requireWriter()
      return writer.writeContractAsync({
        address: collection.bitsContract,
        abi: bitsAbi,
        functionName: 'mintBitPublic',
        args: [BigInt(tokenId), recipient, 1n],
        chainId: collection.chainId,
        value: BigInt(collection.pricePerTokenWei),
      }) as Promise<Hash>
    }
  }

  return {
    address,
    createMintCollectionRequest,
    createMintTokenRequest,
  }
}
