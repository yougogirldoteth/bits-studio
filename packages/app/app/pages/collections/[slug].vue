<template>
  <BitsCollectionView
    v-if="data"
    :address="address"
    :collection="data.collection"
    :collections="collections?.items ?? []"
    :tokens="data.tokens"
    @mint-collection="startCollectionMint"
    @mint-token="startTokenMint"
    @refresh="refresh"
  />
  <main
    v-else-if="error"
    class="bits-page"
  >
    <div class="bits-shell bits-error">
      {{ error.statusMessage || error.message }}
    </div>
  </main>
  <main
    v-else
    class="bits-page"
  >
    <div class="bits-shell bits-empty">Loading collection.</div>
  </main>

  <BitsTransactionFlow
    ref="transactionFlow"
    chain="mainnet"
    :request="pendingRequest"
    :text="transactionText"
    @complete="onTransactionComplete"
  />
</template>

<script setup lang="ts">
import type { BitsTokenSummary } from '@bits-collection/shared'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const indexer = useBitsIndexer()
const contracts = useBitsContracts()
const { address } = contracts
const pendingRequest = shallowRef<(() => Promise<`0x${string}`>) | undefined>()
const transactionFlow = ref<{ start: () => unknown } | null>(null)
const transactionText = {
  title: {
    confirm: 'Mint',
    requesting: 'Mint',
    waiting: 'Mint',
    complete: 'Minted',
  },
  lead: {
    confirm: 'Confirm the transaction in your wallet.',
    requesting: 'Requesting signature.',
    waiting: 'Waiting for Ethereum.',
    complete: 'Mint confirmed.',
  },
  action: {
    confirm: 'Mint',
  },
}

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
  pendingRequest.value = contracts.createMintCollectionRequest(
    data.value.collection,
  )
  transactionFlow.value?.start()
}

function startTokenMint(token: BitsTokenSummary) {
  if (!data.value) return
  pendingRequest.value = contracts.createMintTokenRequest(
    data.value.collection,
    token.tokenId,
  )
  transactionFlow.value?.start()
}

async function onTransactionComplete() {
  await new Promise((resolve) => setTimeout(resolve, 1200))
  await refresh()
}
</script>
