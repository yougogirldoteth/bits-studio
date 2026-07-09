<template>
  <main
    class="bits-page"
    :style="{ '--bits-accent': collection.theme?.accent || '#111111' }"
  >
    <div class="bits-shell">
      <header class="bits-topbar">
        <div class="bits-brand">
          <p class="bits-brand__meta">BITS</p>
          <h1 class="bits-brand__name">{{ collection.title }}</h1>
        </div>
        <div class="bits-wallet">
          <NuxtLink v-if="collections.length > 1" class="bits-button" to="/">
            Collections
          </NuxtLink>
          <ConnectButton
            ref="connectButton"
            @closed="clearPendingMintIntent"
            @connected="flushPendingMintIntent"
          />
        </div>
      </header>

      <section class="bits-section bits-hero">
        <div class="bits-copy">
          <p>
            {{ collection.description }}
            <template v-if="collection.artist">
              <span class="bits-description-artist-prefix">- by</span>
              <a
                v-if="collection.artistUrl"
                class="bits-description-artist"
                :href="collection.artistUrl"
                rel="noreferrer"
                target="_blank"
              >
                {{ collection.artist }}
              </a>
              <strong v-else class="bits-description-artist">
                {{ collection.artist }}
              </strong>
            </template>
          </p>
          <div class="bits-meta bits-launch-line">
            <a
              class="bits-inline-link"
              :href="collection.explorerUrl"
              rel="noreferrer"
              target="_blank"
            >
              <span>View BITS contract</span>
              <Icon name="lucide:external-link" />
            </a>
            <a
              class="bits-inline-link"
              :href="collection.rendererExplorerUrl"
              rel="noreferrer"
              target="_blank"
            >
              <span>View renderer contract</span>
              <Icon name="lucide:external-link" />
            </a>
          </div>
        </div>
      </section>

      <section class="bits-section">
        <div class="bits-stats">
          <div class="bits-stat">
            <div class="bits-stat__label">Minted</div>
            <div class="bits-stat__value">
              {{ collection.minted }} / {{ collection.totalSupply }}
            </div>
          </div>
          <div class="bits-stat">
            <div class="bits-stat__label">Tokens</div>
            <div class="bits-stat__value">{{ collection.tokenCount }}</div>
          </div>
          <div class="bits-stat">
            <div class="bits-stat__label">Single</div>
            <div class="bits-stat__value">{{ collection.priceLabel }}</div>
          </div>
          <div class="bits-stat">
            <div class="bits-stat__label">Network</div>
            <div class="bits-stat__value">Ethereum</div>
          </div>
        </div>
      </section>

      <section class="bits-section">
        <HoldersTable :holders="holders" :total="holderTotal" />
      </section>

      <section class="bits-section bits-mode-row">
        <button
          class="bits-button bits-button--primary bits-button--mint-set"
          type="button"
          :disabled="fullSetUnavailable"
          @click="mintCollection"
        >
          <Icon name="lucide:layers" />
          <span>Mint full set</span>
        </button>
        <div class="bits-segments">
          <button
            class="bits-segment"
            type="button"
            :aria-pressed="mode === 'thumbnail'"
            @click="mode = 'thumbnail'"
          >
            Thumbnail
          </button>
          <button
            class="bits-segment"
            type="button"
            :aria-pressed="mode === 'html'"
            @click="mode = 'html'"
          >
            Live HTML
          </button>
        </div>
      </section>

      <section class="bits-section">
        <div v-if="tokens.length" class="bits-grid">
          <CollectionTokenCard
            v-for="token in tokens"
            :key="token.tokenId"
            :disabled="token.soldOut"
            :mode="mode"
            :price-label="collection.priceLabel"
            :token="token"
            @mint="mintToken"
          />
        </div>
        <div v-else class="bits-empty">Indexing collection.</div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import type {
  BitsCollectionSummary,
  BitsHolderSummary,
  BitsTokenSummary,
} from '@bits-collection/shared'
import HoldersTable from '~/components/HoldersTable.vue'

const props = defineProps<{
  collection: BitsCollectionSummary
  tokens: BitsTokenSummary[]
  collections: BitsCollectionSummary[]
  holders: BitsHolderSummary[]
  holderTotal: number
  address?: string
}>()

const emit = defineEmits<{
  mintCollection: []
  mintToken: [token: BitsTokenSummary]
}>()

type PendingMintIntent =
  { type: 'collection' } | { type: 'token'; token: BitsTokenSummary }

const mode = ref<'thumbnail' | 'html'>('thumbnail')
const connectButton = ref<{ open: () => void } | null>(null)
const pendingMintIntent = shallowRef<PendingMintIntent | null>(null)
const collectionSoldOut = computed(
  () => BigInt(props.collection.minted) >= BigInt(props.collection.totalSupply),
)
const fullSetUnavailable = computed(
  () =>
    collectionSoldOut.value ||
    props.tokens.length < props.collection.tokenCount ||
    props.tokens.some((token) => token.soldOut),
)

watch(
  () => props.address,
  (address) => {
    if (address) {
      void flushPendingMintIntent()
    }
  },
)

function emitMintIntent(intent: PendingMintIntent) {
  if (intent.type === 'collection') {
    emit('mintCollection')
    return
  }

  emit('mintToken', intent.token)
}

function requestMint(intent: PendingMintIntent) {
  if (props.address) {
    emitMintIntent(intent)
    return
  }

  pendingMintIntent.value = intent
  connectButton.value?.open()
}

function mintCollection() {
  if (fullSetUnavailable.value) return
  requestMint({ type: 'collection' })
}

function mintToken(token: BitsTokenSummary) {
  if (token.soldOut) return
  requestMint({ type: 'token', token })
}

async function flushPendingMintIntent() {
  if (!pendingMintIntent.value) return

  await nextTick()

  if (!pendingMintIntent.value) return

  const intent = pendingMintIntent.value
  pendingMintIntent.value = null
  emitMintIntent(intent)
}

function clearPendingMintIntent() {
  pendingMintIntent.value = null
}
</script>
