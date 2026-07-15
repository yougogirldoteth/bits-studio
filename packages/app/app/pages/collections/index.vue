<template>
  <main class="bits-page">
    <div class="bits-shell">
      <CollectionHeader title="Collections" />

      <section class="bits-collections-intro">
        <p>Onchain instruments, rendered and minted on Ethereum.</p>
        <span v-if="collections.length" class="bits-meta">
          {{ collectionCountLabel }}
        </span>
      </section>

      <section v-if="collections.length" class="bits-collections-grid">
        <CollectionCard
          v-for="collection in collections"
          :key="collection.slug"
          :collection="collection"
        />
      </section>
      <div v-else-if="error" class="bits-error">
        {{ error.statusMessage || error.message }}
      </div>
      <div v-else class="bits-empty">Loading collections.</div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { getPrimaryBitsCollection } from '@bits-collection/shared'
import CollectionCard from '~/components/Collection/Card.vue'
import CollectionHeader from '~/components/Collection/Header.vue'

const indexer = useBitsIndexer()
const route = useRoute()
const requestUrl = useRequestURL()
const primaryCollection = getPrimaryBitsCollection()
const { data, error } = await useAsyncData('collections-overview', () =>
  indexer.listCollections(),
)

const collections = computed(() => data.value?.items ?? [])
const collectionCountLabel = computed(
  () =>
    `${collections.value.length} ${collections.value.length === 1 ? 'collection' : 'collections'}`,
)
const pageUrl = computed(() => absoluteUrl(route.path, requestUrl.origin))
const imageUrl = computed(() =>
  absoluteUrl(collectionOgImagePath(primaryCollection.slug), requestUrl.origin),
)

useSeoMeta({
  title: 'Collections | bits',
  description: 'Explore BITS onchain instrument collections on Ethereum.',
  ogTitle: 'BITS Collections',
  ogDescription: 'Explore BITS onchain instrument collections on Ethereum.',
  ogType: 'website',
  ogUrl: () => pageUrl.value,
  ogImage: () => imageUrl.value,
  ogImageWidth: '1200',
  ogImageHeight: '630',
  twitterCard: 'summary_large_image',
  twitterTitle: 'BITS Collections',
  twitterDescription:
    'Explore BITS onchain instrument collections on Ethereum.',
  twitterImage: () => imageUrl.value,
})
</script>

<style scoped>
.bits-collections-intro {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--bits-page-gap);
  border-block-end: var(--bits-line);
  padding-block-end: var(--bits-stack-gap);
}

.bits-collections-intro p {
  margin: 0;
  font-size: calc(var(--font-base) * 1.1);
  line-height: 1.36;
}

.bits-collections-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--bits-stack-gap);
}

@media (max-width: 760px) {
  .bits-collections-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .bits-collections-intro {
    display: grid;
  }
}
</style>
