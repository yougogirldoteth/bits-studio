import { ownableAbi, type BitsCollectionConfig } from '@bits-collection/shared'
import { getEnsName } from 'viem/actions'
import type { Address, PublicClient } from 'viem'

export async function resolveOnchainArtist(
  client: PublicClient,
  collection: BitsCollectionConfig,
  rendererAddress: Address = collection.rendererContract,
) {
  const owner =
    (await readOwner(client, rendererAddress)) ??
    (await readOwner(client, collection.bitsContract))

  if (!owner) return collection.artist

  return (await readEnsName(client, owner)) ?? owner
}

async function readOwner(client: PublicClient, address: Address) {
  try {
    return await client.readContract({
      address,
      abi: ownableAbi,
      functionName: 'owner',
    })
  } catch {
    return null
  }
}

async function readEnsName(client: PublicClient, address: Address) {
  try {
    return await getEnsName(client, { address })
  } catch {
    return null
  }
}
