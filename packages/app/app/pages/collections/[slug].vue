<template>
  <CollectionPage :slug="slug" />
</template>

<script setup lang="ts">
import CollectionPage from '~/components/Collection/Page.vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
</script>
