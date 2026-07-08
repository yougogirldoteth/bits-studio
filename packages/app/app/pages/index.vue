<template>
  <main class="bits-page">
    <div class="bits-shell bits-empty">Loading collections.</div>
  </main>
</template>

<script setup lang="ts">
import { getPrimaryBitsCollection } from '@bits-collection/shared'

await navigateTo(`/collections/${getPrimaryBitsCollection().slug}`, {
  replace: true,
})
</script>
