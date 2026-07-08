<template>
  <CollectionView
    v-if="data"
    :address="address"
    :collection="data.collection"
    :collections="collections?.items ?? []"
    :tokens="data.tokens"
    @mint-collection="startCollectionMint"
    @mint-token="startTokenMint"
  />
  <main v-else-if="error" class="bits-page">
    <div class="bits-shell bits-error">
      {{ error.statusMessage || error.message }}
    </div>
  </main>
  <main v-else class="bits-page">
    <div class="bits-shell bits-empty">Loading collection.</div>
  </main>

  <TransactionFlow
    ref="transactionFlow"
    chain="mainnet"
    :text="transactionText"
    @complete="onTransactionComplete"
  />
</template>

<script setup lang="ts">
import {
  formatWeiLabel,
  type BitsCollectionSummary,
  type BitsTokenSummary,
} from '@bits-collection/shared'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const indexer = useBitsIndexer()
const contracts = useBitsContracts()
const { address } = contracts
const transactionFlow = ref<{
  start: (request: () => Promise<`0x${string}`>) => unknown
} | null>(null)
const transactionText = ref(createTransactionText())

const { data, error, refresh } = await useAsyncData(
  () => `collection:${slug.value}`,
  () => indexer.getCollection(slug.value),
  { watch: [slug] },
)

const { data: collections } = await useAsyncData('collections', () =>
  indexer.listCollections(),
)

useHead(() => ({
  title: data.value
    ? `${data.value.collection.title} | BITS Collections`
    : 'BITS Collections',
  meta: [
    {
      name: 'description',
      content:
        data.value?.collection.description ??
        'Reusable mint and gallery frontend for BITS collections.',
    },
  ],
}))

function startCollectionMint() {
  if (!data.value) return
  const { collection } = data.value

  transactionText.value = createTransactionText({
    title: 'Mint full set',
    confirm: `You are minting the complete ${collection.title} set: ${collection.tokenCount} BITS for ${collectionMintPriceLabel(collection)} total on Ethereum mainnet.`,
    waiting: `Minting the complete ${collection.title} set. Waiting for Ethereum confirmation.`,
    complete: 'Full set mint confirmed.',
    action: 'Mint full set',
  })
  transactionFlow.value?.start(
    contracts.createMintCollectionRequest(collection),
  )
}

function startTokenMint(token: BitsTokenSummary) {
  if (!data.value) return
  const { collection } = data.value
  const tokenLabel = token.name || `Token ${token.tokenId}`

  transactionText.value = createTransactionText({
    title: 'Mint token',
    confirm: `You are minting ${tokenLabel} (#${token.tokenId}) from ${collection.title} for ${tokenMintPriceLabel(collection)} on Ethereum mainnet.`,
    waiting: `Minting ${tokenLabel}. Waiting for Ethereum confirmation.`,
    complete: `${tokenLabel} mint confirmed.`,
    action: 'Mint token',
  })
  transactionFlow.value?.start(
    contracts.createMintTokenRequest(collection, token.tokenId),
  )
}

async function onTransactionComplete() {
  await new Promise((resolve) => setTimeout(resolve, 1200))
  await refresh()
}

function createTransactionText(input?: {
  title?: string
  confirm?: string
  waiting?: string
  complete?: string
  action?: string
}) {
  return {
    title: {
      confirm: input?.title ?? 'Mint',
      requesting: input?.title ?? 'Mint',
      waiting: input?.title ?? 'Mint',
      complete: 'Minted',
    },
    lead: {
      confirm:
        input?.confirm ??
        'Choose what you want to mint before sending the transaction.',
      requesting: 'Requesting signature from your wallet.',
      waiting: input?.waiting ?? 'Waiting for Ethereum confirmation.',
      complete: input?.complete ?? 'Mint confirmed.',
    },
    action: {
      confirm: input?.action ?? 'Mint',
    },
  }
}

function collectionMintPriceLabel(collection: BitsCollectionSummary) {
  return formatWeiLabel(
    BigInt(collection.pricePerTokenWei) * BigInt(collection.tokenCount),
  )
}

function tokenMintPriceLabel(collection: BitsCollectionSummary) {
  return formatWeiLabel(BigInt(collection.pricePerTokenWei))
}
</script>
