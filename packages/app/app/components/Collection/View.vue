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
          <span>{{ fullSetLabel }}</span>
          <span v-if="fullSetsRemainingLabel" class="bits-button__meta">
            ({{ fullSetsRemainingLabel }})
          </span>
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
import CollectionTokenCard from '~/components/Collection/TokenCard.vue'
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
const fullSetsRemaining = computed(() => {
  if (props.tokens.length < props.collection.tokenCount) {
    return null
  }

  if (collectionSoldOut.value) {
    return 0n
  }

  return props.tokens.reduce((lowest, token) => {
    const available = BigInt(token.available)
    return available < lowest ? available : lowest
  }, BigInt(props.tokens[0]?.available ?? 0))
})
const fullSetUnavailable = computed(
  () => fullSetsRemaining.value === null || fullSetsRemaining.value === 0n,
)
const fullSetLabel = computed(() => {
  if (props.tokens.length < props.collection.tokenCount) {
    return 'Indexing full set'
  }

  if (fullSetsRemaining.value === 0n) {
    return 'Full set sold out'
  }

  return 'Mint full set'
})
const fullSetsRemainingLabel = computed(() => {
  if (fullSetsRemaining.value === null || fullSetsRemaining.value === 0n) {
    return ''
  }

  return `${formatWholeNumber(fullSetsRemaining.value)} ${
    fullSetsRemaining.value === 1n ? 'set' : 'sets'
  } left`
})

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

function formatWholeNumber(value: bigint) {
  if (value <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return new Intl.NumberFormat('en-US').format(Number(value))
  }

  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
</script>

<style scoped>
.bits-topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--bits-page-gap);
  align-items: center;
  border-block-end: var(--bits-line);
  padding-block-end: var(--bits-stack-gap);
}

.bits-brand {
  display: grid;
  gap: var(--spacer-sm);
}

.bits-brand__name {
  margin: 0;
  font-size: calc(var(--font-base) * 2.15);
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.02;
}

.bits-brand__meta {
  color: var(--bits-muted);
  font-size: var(--ui-font-size);
  font-weight: 500;
  line-height: 1.45;
}

.bits-wallet {
  align-self: center;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacer-sm);
}

.bits-section {
  min-inline-size: 0;
}

.bits-hero {
  border-block-end: var(--bits-line);
  padding-block-end: var(--bits-stack-gap);
}

.bits-copy {
  max-inline-size: calc(var(--font-base) * 48);
  display: grid;
  gap: var(--bits-stack-gap);
}

.bits-copy p {
  margin: 0;
  font-size: calc(var(--font-base) * 1.1);
  line-height: 1.36;
}

.bits-description-artist {
  color: var(--bits-muted);
  font: inherit;
  margin-inline-start: var(--bits-inline-text-gap);
}

a.bits-description-artist:hover {
  color: var(--bits-ink);
}

.bits-description-artist-prefix {
  color: var(--bits-muted);
  margin-inline-start: var(--bits-inline-text-gap);
}

.bits-launch-line {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer-sm) var(--bits-stack-gap);
  align-items: center;
}

.bits-inline-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacer-xs);
  color: var(--bits-ink);
  font: inherit;
  text-decoration: underline;
  text-decoration-thickness: var(--border-width);
  text-underline-offset: var(--bits-underline-offset);
}

.bits-inline-link :deep(svg) {
  inline-size: var(--ui-font-size);
  block-size: var(--ui-font-size);
}

.bits-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(calc(var(--font-base) * 8), 1fr));
  border: var(--bits-line);
}

.bits-stat {
  min-block-size: calc(var(--bits-control-height) + var(--spacer-md));
  padding: var(--bits-card-padding);
  border-inline-end: var(--bits-line);
}

.bits-stat:last-child {
  border-inline-end: 0;
}

.bits-stat__label {
  color: var(--bits-muted);
  font-size: var(--ui-font-size);
  font-weight: 500;
}

.bits-stat__value {
  margin-block-start: var(--spacer-sm);
  font-size: calc(var(--font-base) * 1.25);
  font-weight: 500;
  line-height: 1.1;
}

.bits-mode-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--bits-stack-gap);
  align-items: center;
  justify-content: space-between;
  border-block-end: var(--bits-line);
  padding-block-end: var(--bits-stack-gap);
}

.bits-button--mint-set {
  min-inline-size: calc(var(--font-base) * 8.85);
  white-space: nowrap;
}

.bits-button__meta {
  opacity: 0.68;
}

.bits-button--mint-set:disabled {
  background: var(--bits-ink);
  color: var(--bits-bg);
  opacity: 0.62;
}

.bits-segments {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(calc(var(--font-base) * 5.85), 1fr));
  margin-inline-start: auto;
}

.bits-segment {
  display: inline-flex;
  block-size: var(--bits-control-height);
  min-inline-size: auto;
  align-items: center;
  justify-content: center;
  gap: var(--spacer-sm);
  border: var(--bits-line-ink);
  border-radius: 0;
  box-shadow: none;
  background: var(--bits-bg);
  color: var(--bits-ink);
  cursor: pointer;
  font-size: var(--ui-font-size);
  font-weight: 600;
  line-height: 1;
  padding: 0 var(--ui-padding-inline);
  text-decoration: none;
  transition:
    background-color var(--bits-transition),
    color var(--bits-transition),
    opacity var(--bits-transition);
}

.bits-segment:hover:not(:disabled),
.bits-segment[aria-pressed='true'] {
  background: var(--bits-ink);
  color: var(--bits-bg);
}

.bits-segment:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.bits-segment + .bits-segment {
  border-inline-start: 0;
}

.bits-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--bits-stack-gap);
}

@media (max-width: 1100px) {
  .bits-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .bits-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .bits-stat:nth-child(2n) {
    border-inline-end: 0;
  }

  .bits-stat:nth-child(n + 3) {
    border-block-start: var(--bits-line);
  }

  .bits-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .bits-mode-row {
    display: grid;
    grid-template-columns: 1fr;
  }

  .bits-button--mint-set,
  .bits-segments {
    inline-size: 100%;
  }

  .bits-segments {
    margin-inline-start: 0;
  }

  .bits-grid,
  .bits-stats {
    grid-template-columns: 1fr;
  }

  .bits-stat {
    border-inline-end: 0;
    border-block-start: var(--bits-line);
  }

  .bits-stat:first-child {
    border-block-start: 0;
  }
}
</style>
