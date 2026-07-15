<template>
  <NuxtLink
    class="bits-collection-card"
    :data-status="status"
    :style="{ '--bits-accent': collection.theme?.accent || '#111111' }"
    :to="`/collections/${collection.slug}`"
  >
    <div class="bits-collection-card__media">
      <img
        v-if="showArtwork"
        :alt="`${collection.title} artwork grid`"
        :src="collectionOgImagePath(collection.slug)"
        @error="artworkAvailable = false"
      />
      <div v-else class="bits-collection-card__fallback">
        {{ collection.indexed ? 'Artwork unavailable' : 'Indexing artwork' }}
      </div>
    </div>

    <div class="bits-collection-card__body">
      <div class="bits-collection-card__heading">
        <h2>{{ collection.title }}</h2>
        <span class="bits-collection-card__status">{{ statusLabel }}</span>
      </div>
      <p>
        {{ collection.description }}
        <span v-if="collection.artist" class="bits-collection-card__artist">
          — by {{ collection.artist }}
        </span>
      </p>
    </div>

    <div class="bits-collection-card__stats">
      <div>
        <span class="bits-meta">Minted</span>
        <strong>{{ collection.minted }} / {{ collection.totalSupply }}</strong>
      </div>
      <div>
        <span class="bits-meta">Tokens</span>
        <strong>{{ collection.tokenCount }}</strong>
      </div>
      <div>
        <span class="bits-meta">Single</span>
        <strong>{{ collection.priceLabel }}</strong>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import {
  collectionMintStatus,
  type BitsCollectionSummary,
} from '@bits-collection/shared'

const props = defineProps<{
  collection: BitsCollectionSummary
}>()

const artworkAvailable = ref(true)
const status = computed(() => collectionMintStatus(props.collection))
const showArtwork = computed(
  () => props.collection.indexed && artworkAvailable.value,
)
const statusLabel = computed(
  () =>
    ({
      indexing: 'Indexing',
      'sold-out': 'Sold out',
      closed: 'Closed',
      live: 'Minting',
    })[status.value],
)

watch(
  () => props.collection.slug,
  () => {
    artworkAvailable.value = true
  },
)
</script>

<style scoped>
.bits-collection-card {
  inline-size: 100%;
  max-inline-size: 32rem;
  min-inline-size: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  border: var(--bits-line);
  background: var(--bits-bg);
  color: var(--bits-ink);
  text-decoration: none;
  transition: border-color var(--bits-transition);
}

.bits-collection-card:hover {
  border-color: var(--bits-ink);
}

.bits-collection-card__media {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  overflow: hidden;
  border-block-end: var(--bits-line);
  background:
    linear-gradient(
      var(--bits-rule) var(--border-width),
      transparent var(--border-width)
    ),
    linear-gradient(
      90deg,
      var(--bits-rule) var(--border-width),
      transparent var(--border-width)
    ),
    var(--bits-soft);
  background-size: calc(var(--font-base) * 2) calc(var(--font-base) * 2);
}

.bits-collection-card__media img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  transition: opacity var(--bits-transition);
}

.bits-collection-card:hover .bits-collection-card__media img {
  opacity: 0.88;
}

.bits-collection-card__fallback {
  padding: var(--bits-card-padding);
  color: var(--bits-muted);
  font-family: var(--font-mono);
  font-size: var(--ui-font-size);
  text-align: center;
}

.bits-collection-card__body {
  display: grid;
  align-content: start;
  gap: var(--bits-stack-gap);
  padding: var(--bits-card-padding);
}

.bits-collection-card__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--bits-stack-gap);
}

.bits-collection-card__heading h2 {
  margin: 0;
  font-size: calc(var(--font-base) * 1.45);
  font-weight: 500;
  line-height: 1.05;
}

.bits-collection-card__status {
  flex: none;
  border: var(--bits-line);
  color: var(--bits-muted);
  font-size: var(--ui-font-size);
  font-weight: 600;
  line-height: 1;
  padding: var(--spacer-sm);
}

.bits-collection-card[data-status='live'] .bits-collection-card__status {
  border-color: var(--bits-success);
  color: var(--bits-success);
}

.bits-collection-card__body p {
  margin: 0;
  line-height: 1.4;
}

.bits-collection-card__artist {
  color: var(--bits-muted);
}

.bits-collection-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-block-start: var(--bits-line);
}

.bits-collection-card__stats > div {
  min-inline-size: 0;
  display: grid;
  gap: var(--spacer-sm);
  border-inline-end: var(--bits-line);
  padding: var(--bits-card-padding);
}

.bits-collection-card__stats > div:last-child {
  border-inline-end: 0;
}

.bits-collection-card__stats strong {
  font-size: var(--ui-font-size);
  font-weight: 600;
  overflow-wrap: anywhere;
}

@media (max-width: 520px) {
  .bits-collection-card__heading {
    display: grid;
  }

  .bits-collection-card__status {
    inline-size: fit-content;
  }
}
</style>
