<template>
  <EvmProfile
    v-if="connectedAddress"
    class-name="bits-connect"
    @disconnected="emit('disconnected')"
  >
    <template #default="{ display }">
      <span>{{ display }}</span>
    </template>
  </EvmProfile>

  <button v-else class="bits-connect" type="button" @click="open">
    <span>Connect</span>
  </button>

  <Dialog
    v-if="!connectedAddress"
    v-model:open="isOpen"
    title="Connect Wallet"
    @closed="onClosed"
  >
    <EvmConnect ref="connectRef" @connected="onConnected" />
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog } from '@1001-digital/components'

const emit = defineEmits<{
  connected: []
  closed: []
  disconnected: []
}>()

const { address } = useAccount()

const isOpen = ref(false)
const connectedAddress = computed(() => address.value)
const connectRef = ref<{ reset: () => void } | null>(null)
const connectedInDialog = ref(false)

function open() {
  if (!connectedAddress.value) {
    connectedInDialog.value = false
    isOpen.value = true
  }
}

function onConnected() {
  connectedInDialog.value = true
  isOpen.value = false
  emit('connected')
}

function onClosed() {
  connectRef.value?.reset()

  if (!connectedInDialog.value) {
    emit('closed')
  }

  connectedInDialog.value = false
}

defineExpose({ open })
</script>
