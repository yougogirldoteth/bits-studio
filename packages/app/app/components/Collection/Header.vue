<template>
  <header class="bits-topbar">
    <div class="bits-brand">
      <p class="bits-brand__meta">BITS</p>
      <h1 class="bits-brand__name">{{ title }}</h1>
    </div>
    <div class="bits-wallet">
      <NuxtLink v-if="showCollections" class="bits-button" to="/collections">
        Collections
      </NuxtLink>
      <ConnectButton
        ref="connectButton"
        @closed="emit('closed')"
        @connected="emit('connected')"
        @disconnected="emit('disconnected')"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    showCollections?: boolean
  }>(),
  { showCollections: false },
)

const emit = defineEmits<{
  connected: []
  closed: []
  disconnected: []
}>()

const connectButton = ref<{ open: () => void } | null>(null)

function openConnect() {
  connectButton.value?.open()
}

defineExpose({ openConnect })
</script>

<style scoped>
.bits-topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--bits-page-gap);
  align-items: center;
  border-block-end: var(--bits-line);
  padding-block-end: var(--bits-stack-gap);
}

.bits-brand {
  display: grid;
  gap: var(--spacer-sm);
}

.bits-brand__name {
  margin: 0;
  font-size: calc(var(--font-base) * 2.15);
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.02;
}

.bits-brand__meta {
  color: var(--bits-muted);
  font-size: var(--ui-font-size);
  font-weight: 500;
  line-height: 1.45;
}

.bits-wallet {
  align-self: center;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacer-sm);
}

@media (max-width: 520px) {
  .bits-topbar {
    align-items: start;
    gap: var(--bits-stack-gap);
  }

  .bits-wallet {
    align-self: start;
    display: grid;
    grid-template-columns: 1fr;
  }

  .bits-wallet > .bits-button,
  .bits-wallet :deep(.bits-connect-wrap),
  .bits-wallet :deep(.bits-connect) {
    inline-size: 100%;
  }
}
</style>
