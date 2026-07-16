<template>
  <main
    class="bits-page"
    :style="{ '--bits-accent': collection.theme?.accent || '#111111' }"
  >
    <div class="bits-shell">
      <CollectionHeader
        ref="collectionHeader"
        :title="collection.title"
        show-collections
        @closed="clearPendingMintIntent"
        @connected="flushPendingMintIntent"
      />

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

      <section
        v-if="mintCountdownActive"
        class="bits-section bits-mint-countdown"
        aria-live="polite"
      >
        <div>
          <div class="bits-mint-countdown__label">
            Collection 2 mint opens at {{ localMintStartTimeLabel }}
          </div>
          <div class="bits-meta">{{ localMintStartDateLabel }}</div>
        </div>
        <time
          class="bits-mint-countdown__time"
          :datetime="COLLECTION_2_MINT_START_ISO"
        >
          {{ mintCountdownLabel }}
        </time>
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
            :action-label="tokenActionLabel(token)"
            :disabled="!token.created || !collectionMintable || token.soldOut"
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
import {
  collectionMintStatus,
  isCollectionMintable,
} from '@bits-collection/shared'
import CollectionHeader from '~/components/Collection/Header.vue'
import CollectionTokenCard from '~/components/Collection/TokenCard.vue'
import HoldersTable from '~/components/HoldersTable.vue'

const COLLECTION_2_SLUG = 'drums-collection-2'
const COLLECTION_2_MINT_START_ISO = '2026-07-16T21:00:00+02:00'
const COLLECTION_2_MINT_START = Date.parse(COLLECTION_2_MINT_START_ISO)

const props = defineProps<{
  collection: BitsCollectionSummary
  tokens: BitsTokenSummary[]
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
const collectionHeader = ref<{ openConnect: () => void } | null>(null)
const pendingMintIntent = shallowRef<PendingMintIntent | null>(null)
const now = useState('collection-2-mint-countdown-now', () => Date.now())
const browserTimeZone = ref('')
let countdownInterval: ReturnType<typeof setInterval> | undefined

const mintCountdownActive = computed(
  () =>
    props.collection.slug === COLLECTION_2_SLUG &&
    now.value < COLLECTION_2_MINT_START,
)
const mintCountdownLabel = computed(() =>
  formatCountdown(COLLECTION_2_MINT_START - now.value),
)
const localMintStartTimeLabel = computed(() => {
  if (!browserTimeZone.value) return 'your local time'

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: browserTimeZone.value,
  }).format(COLLECTION_2_MINT_START)
})
const localMintStartDateLabel = computed(() => {
  if (!browserTimeZone.value) {
    return 'Shown in your browser’s time zone'
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: browserTimeZone.value,
  }).format(COLLECTION_2_MINT_START)
})
const mintStatus = computed(() => collectionMintStatus(props.collection))
const collectionMintable = computed(
  () => isCollectionMintable(props.collection) && !mintCountdownActive.value,
)
const collectionSoldOut = computed(
  () => BigInt(props.collection.minted) >= BigInt(props.collection.totalSupply),
)
const allTokensCreated = computed(
  () =>
    props.tokens.length === props.collection.tokenCount &&
    props.tokens.every((token) => token.created),
)
const fullSetsRemaining = computed(() => {
  if (!allTokensCreated.value) {
    return null
  }

  if (collectionSoldOut.value) {
    return 0n
  }

  return props.tokens.reduce(
    (lowest, token) => {
      const available = BigInt(token.available)
      return available < lowest ? available : lowest
    },
    BigInt(props.tokens[0]?.available ?? 0),
  )
})
const fullSetUnavailable = computed(
  () =>
    !collectionMintable.value ||
    fullSetsRemaining.value === null ||
    fullSetsRemaining.value === 0n,
)
const fullSetLabel = computed(() => {
  if (mintStatus.value === 'indexing') {
    return 'Indexing collection'
  }

  if (!allTokensCreated.value) {
    return 'Tokens not created yet'
  }

  if (mintCountdownActive.value) {
    return `Mint opens in ${mintCountdownLabel.value}`
  }

  if (mintStatus.value === 'closed') {
    return 'Minting closed'
  }

  if (fullSetsRemaining.value === 0n) {
    return 'Full sets sold out'
  }

  return 'Mint full set'
})

function tokenActionLabel(token: BitsTokenSummary) {
  if (!token.created) return 'Not created yet'
  if (token.soldOut) return 'Sold out'
  if (mintCountdownActive.value) return mintCountdownLabel.value
  if (mintStatus.value === 'indexing') return 'Indexing'
  if (!collectionMintable.value) return 'Unavailable'
  return 'Mint'
}
const fullSetsRemainingLabel = computed(() => {
  if (
    !collectionMintable.value ||
    fullSetsRemaining.value === null ||
    fullSetsRemaining.value === 0n
  ) {
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

onMounted(() => {
  now.value = Date.now()
  browserTimeZone.value =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  if (!mintCountdownActive.value) return

  countdownInterval = globalThis.setInterval(() => {
    now.value = Date.now()

    if (!mintCountdownActive.value && countdownInterval) {
      globalThis.clearInterval(countdownInterval)
      countdownInterval = undefined
    }
  }, 1_000)
})

onBeforeUnmount(() => {
  if (countdownInterval) {
    globalThis.clearInterval(countdownInterval)
  }
})

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
  collectionHeader.value?.openConnect()
}

function mintCollection() {
  if (fullSetUnavailable.value) return
  requestMint({ type: 'collection' })
}

function mintToken(token: BitsTokenSummary) {
  if (!token.created || token.soldOut) return
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

function formatCountdown(remainingMs: number) {
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1_000))
  const hours = Math.floor(remainingSeconds / 3_600)
  const minutes = Math.floor((remainingSeconds % 3_600) / 60)
  const seconds = remainingSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':')
}
</script>

<style scoped>
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

.bits-mint-countdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bits-stack-gap);
  border: var(--bits-line-ink);
  padding: var(--bits-card-padding);
}

.bits-mint-countdown__label {
  font-size: calc(var(--font-base) * 1.1);
  font-weight: 500;
}

.bits-mint-countdown__time {
  flex: none;
  font-family: var(--font-mono);
  font-size: clamp(
    calc(var(--font-base) * 1.5),
    4vw,
    calc(var(--font-base) * 2.5)
  );
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  line-height: 1;
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
  .bits-mint-countdown {
    align-items: start;
    flex-direction: column;
  }

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
