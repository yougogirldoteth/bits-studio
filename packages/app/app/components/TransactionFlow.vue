<template>
  <EvmTransactionFlow
    ref="flow"
    :chain="chain"
    :delay-after="700"
    :request="request"
    :text="text"
    auto-close-success
    skip-confirmation
    @complete="emit('complete')"
  />
</template>

<script setup lang="ts">
type Hash = `0x${string}`

defineProps<{
  chain?: string | number
  request?: () => Promise<Hash>
  text?: {
    title?: Record<string, string>
    lead?: Record<string, string>
    action?: Record<string, string>
  }
}>()

const emit = defineEmits<{
  complete: []
}>()

const flow = ref<{
  initializeRequest: (request?: () => Promise<Hash>) => unknown
} | null>(null)

function start(request?: () => Promise<Hash>) {
  return flow.value?.initializeRequest(request)
}

defineExpose({ start })
</script>
