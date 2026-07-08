<template>
  <button class="bits-connect" type="button" @click="open">
    <EvmAccount v-if="connectedAddress" :address="connectedAddress" resolve-ens>
      <template #default="{ display }">
        <span>{{ display }}</span>
      </template>
    </EvmAccount>
    <span v-else>Connect</span>
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

const { address } = useAccount()

const isOpen = ref(false)
const connectedAddress = computed(() => address.value)
const connectRef = ref<{ reset: () => void } | null>(null)

function open() {
  if (!connectedAddress.value) {
    isOpen.value = true
  }
}

function onConnected() {
  isOpen.value = false
}

function onClosed() {
  connectRef.value?.reset()
}

defineExpose({ open })
</script>
