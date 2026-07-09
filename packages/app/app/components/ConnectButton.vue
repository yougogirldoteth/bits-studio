<template>
  <div class="bits-connect-wrap">
    <EvmProfile
      v-if="connectedAddress"
      class-name="bits-button bits-connect"
      @disconnected="emit('disconnected')"
    >
      <template #default="{ display }">
        <span>{{ display }}</span>
      </template>
    </EvmProfile>

    <button v-else class="bits-button bits-connect" type="button" @click="open">
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
  </div>
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

<style>
.bits-connect-wrap {
  display: inline-flex;
  inline-size: fit-content;
  align-items: center;
}

.evm-profile {
  --button-background: var(--bits-bg);
  --button-background-highlight: var(--bits-soft);
  --button-color: var(--bits-ink);
  --button-color-highlight: var(--bits-ink);
  --button-icon-color: var(--bits-muted);
  --button-icon-color-highlight: var(--bits-ink);
}

.evm-profile button.danger:is(:hover, :active, :focus) {
  background: rgba(255, 107, 95, 0.12);
  color: var(--bits-error) !important;
}
</style>
