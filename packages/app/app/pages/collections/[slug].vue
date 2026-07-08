<template>
  <CollectionPage :slug="slug" />
</template>

<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))
</script>
