<template>
  <main
    class="bits-page"
    :style="{ '--bits-accent': collection.theme?.accent || '#111111' }"
  >
    <div class="bits-shell">
      <header class="bits-topbar">
        <div class="bits-brand">
          <p class="bits-brand__meta">{{ collection.artist }}</p>
          <h1 class="bits-brand__name">{{ collection.title }}</h1>
        </div>
        <div class="bits-wallet">
          <NuxtLink
            v-if="collections.length > 1"
            class="bits-button"
            to="/"
          >
            Collections
          </NuxtLink>
          <BitsConnect />
        </div>
      </header>

      <section class="bits-section bits-control-band">
        <div class="bits-copy">
          <p>{{ collection.description }}</p>
          <div class="bits-meta">{{ collection.launchLabel }}</div>
        </div>
        <div class="bits-toolbar">
          <button
            class="bits-button bits-button--primary"
            type="button"
            :disabled="!address || collectionSoldOut"
            @click="emit('mintCollection')"
          >
            <Icon name="lucide:layers" />
            <span>Mint full set</span>
          </button>
          <a
            class="bits-button"
            :href="collection.explorerUrl"
            rel="noreferrer"
            target="_blank"
          >
            <Icon name="lucide:external-link" />
            <span>Contract</span>
          </a>
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

      <section class="bits-section bits-control-band">
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
        <div class="bits-toolbar">
          <button
            class="bits-icon-button"
            type="button"
            title="Refresh"
            @click="emit('refresh')"
          >
            <Icon name="lucide:refresh-cw" />
          </button>
        </div>
      </section>

      <section class="bits-section">
        <div
          v-if="tokens.length"
          class="bits-grid"
        >
          <BitsTokenCard
            v-for="token in tokens"
            :key="token.tokenId"
            :disabled="!address || token.soldOut"
            :mode="mode"
            :price-label="collection.priceLabel"
            :token="token"
            @mint="emit('mintToken', $event)"
          />
        </div>
        <div
          v-else
          class="bits-empty"
        >
          Indexing collection.
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import type {
  BitsCollectionSummary,
  BitsTokenSummary,
} from '@bits-collection/shared'

const props = defineProps<{
  collection: BitsCollectionSummary
  tokens: BitsTokenSummary[]
  collections: BitsCollectionSummary[]
  address?: string
}>()

const emit = defineEmits<{
  refresh: []
  mintCollection: []
  mintToken: [token: BitsTokenSummary]
}>()

const mode = ref<'thumbnail' | 'html'>('thumbnail')
const collectionSoldOut = computed(
  () => BigInt(props.collection.minted) >= BigInt(props.collection.totalSupply),
)
</script>
