<template>
  <CollectionView
    v-if="data"
    :address="address"
    :collection="data.collection"
    :holder-total="holders?.total ?? 0"
    :holders="holders?.items ?? []"
    :tokens="data.tokens"
    @load-html="loadLiveHtml"
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
import CollectionView from '~/components/Collection/View.vue'

const props = defineProps<{
  slug: string
}>()

const route = useRoute()
const requestUrl = useRequestURL()
const slug = computed(() => props.slug)
const indexer = useBitsIndexer()
const contracts = useBitsContracts()
const { address } = contracts
const transactionFlow = ref<{
  start: (request: () => Promise<`0x${string}`>) => unknown
} | null>(null)
const transactionText = ref(createTransactionText())

const { data, error, refresh } = await useAsyncData(
  () => `collection:${slug.value}`,
  () => indexer.getCollection(slug.value, { includeHtml: false }),
  { watch: [slug] },
)

const { data: holders } = await useAsyncData(
  () => `holders:${slug.value}`,
  () =>
    indexer
      .listHolders(slug.value, 0, 100)
      .catch(() => ({ items: [], total: 0 })),
  { watch: [slug] },
)

const collection = computed(() => data.value?.collection)
const pageTitle = computed(() => collectionPageTitle(collection.value))
const pageDescription = computed(() =>
  collectionSeoDescription(collection.value),
)
const pageUrl = computed(() => absoluteUrl(route.path, requestUrl.origin))
const imageUrl = computed(() =>
  absoluteUrl(collectionOgImagePath(slug.value), requestUrl.origin),
)
const imageAlt = computed(() =>
  collection.value
    ? `${collection.value.title} artwork grid`
    : 'BITS collection artwork grid',
)

useSeoMeta({
  title: () => pageTitle.value,
  description: () => pageDescription.value,
  ogTitle: () => pageTitle.value,
  ogDescription: () => pageDescription.value,
  ogType: 'website',
  ogUrl: () => pageUrl.value,
  ogImage: () => imageUrl.value,
  ogImageWidth: '1200',
  ogImageHeight: '630',
  ogImageType: 'image/png',
  ogImageAlt: () => imageAlt.value,
  twitterCard: 'summary_large_image',
  twitterTitle: () => pageTitle.value,
  twitterDescription: () => pageDescription.value,
  twitterImage: () => imageUrl.value,
  twitterImageAlt: () => imageAlt.value,
})

const liveHtmlRequests = new Map<string, Promise<void>>()

function loadLiveHtml() {
  if (
    !data.value ||
    data.value.tokens.every((token) => !token.created || token.html)
  ) {
    return
  }

  const requestedSlug = slug.value
  if (liveHtmlRequests.has(requestedSlug)) return

  const request = indexer
    .listTokens(requestedSlug)
    .then(({ items }) => {
      if (data.value?.collection.slug !== requestedSlug) return
      data.value = { ...data.value, tokens: items }
    })
    .catch((loadError) => {
      console.error('Unable to load live token HTML', loadError)
    })
    .finally(() => {
      liveHtmlRequests.delete(requestedSlug)
    })

  liveHtmlRequests.set(requestedSlug, request)
}

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
  if (!data.value || !token.created) return
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
