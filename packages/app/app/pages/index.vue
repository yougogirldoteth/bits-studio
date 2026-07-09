<template>
  <CollectionPage :slug="primaryCollection.slug" />
</template>

<script setup lang="ts">
import { getPrimaryBitsCollection } from '@bits-collection/shared'
import CollectionPage from '~/components/Collection/Page.vue'

const primaryCollection = getPrimaryBitsCollection()
</script>
