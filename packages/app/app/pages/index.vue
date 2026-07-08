<template>
  <CollectionPage :slug="primaryCollection.slug" />
</template>

<script setup lang="ts">
import { getPrimaryBitsCollection } from '@bits-collection/shared'

const primaryCollection = getPrimaryBitsCollection()
</script>
