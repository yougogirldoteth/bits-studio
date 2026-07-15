<template>
  <article
    class="bits-token"
    :data-created="token.created"
    :data-sold-out="token.soldOut"
  >
    <div class="bits-token__media">
      <iframe
        v-if="mode === 'html' && token.html"
        :srcdoc="htmlSrc"
        :title="`${token.name || `Token ${token.tokenId}`} live HTML`"
        sandbox="allow-scripts"
      />
      <img
        v-else-if="imageSrc"
        :alt="`${token.name || `Token ${token.tokenId}`} thumbnail`"
        :src="imageSrc"
      />
      <div v-else class="bits-token__fallback">
        <span
          v-if="!token.created"
          aria-hidden="true"
          class="bits-token__empty-mark"
        />
        <span>Token {{ token.tokenId }}</span>
        <span v-if="!token.created">Not created yet</span>
      </div>
    </div>

    <div class="bits-token__body">
      <h2 class="bits-token__title">
        {{ token.name || `Token ${token.tokenId}` }}
      </h2>
      <div class="bits-meta">
        <template v-if="token.created">
          {{ token.minted }} / {{ token.editionSize }} minted
        </template>
        <template v-else>Awaiting renderer data</template>
      </div>
    </div>

    <div class="bits-token__footer">
      <div class="bits-meta">{{ priceLabel }}</div>
      <button
        class="bits-button"
        type="button"
        :disabled="disabled"
        @click="emit('mint', token)"
      >
        {{ actionLabel }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import {
  htmlSrcdoc,
  imageSrcFromSvg,
  type BitsTokenSummary,
} from '@bits-collection/shared'

const props = withDefaults(
  defineProps<{
    token: BitsTokenSummary
    mode: 'thumbnail' | 'html'
    priceLabel: string
    actionLabel?: string
    disabled?: boolean
  }>(),
  { actionLabel: 'Mint' },
)

const emit = defineEmits<{
  mint: [token: BitsTokenSummary]
}>()

const imageSrc = computed(() => imageSrcFromSvg(props.token.svg))
const htmlSrc = computed(() => htmlSrcdoc(props.token.html))
</script>

<style scoped>
.bits-token {
  min-inline-size: 0;
  display: grid;
  grid-template-rows:
    auto minmax(calc(var(--bits-control-height) * 2.3), auto)
    auto;
  gap: 0;
  border: var(--bits-line);
  background: var(--bits-bg);
}

.bits-token[data-sold-out='true'] {
  color: var(--bits-muted);
}

.bits-token[data-created='false'] {
  color: var(--bits-muted);
}

.bits-token__media {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  overflow: hidden;
  border-block-end: var(--bits-line);
  background:
    linear-gradient(
      var(--bits-rule) var(--border-width),
      transparent var(--border-width)
    ),
    linear-gradient(
      90deg,
      var(--bits-rule) var(--border-width),
      transparent var(--border-width)
    ),
    var(--bits-soft);
  background-size: calc(var(--font-base) * 2) calc(var(--font-base) * 2);
}

.bits-token__media img,
.bits-token__media iframe {
  inline-size: 100%;
  block-size: 100%;
  border: 0;
  background: var(--bits-bg);
}

.bits-token__media img {
  object-fit: contain;
}

.bits-token__fallback {
  max-inline-size: calc(var(--font-base) * 14);
  display: grid;
  justify-items: center;
  gap: var(--spacer-sm);
  padding: var(--spacer);
  color: var(--bits-muted);
  font-family: var(--font-mono);
  font-size: var(--ui-font-size);
  line-height: 1.35;
  text-align: center;
}

.bits-token__empty-mark {
  inline-size: calc(var(--font-base) * 2.5);
  aspect-ratio: 1;
  border: var(--bits-line-strong);
  background:
    linear-gradient(
      45deg,
      transparent calc(50% - var(--border-width)),
      var(--bits-rule-strong) 50%,
      transparent calc(50% + var(--border-width))
    ),
    linear-gradient(
      -45deg,
      transparent calc(50% - var(--border-width)),
      var(--bits-rule-strong) 50%,
      transparent calc(50% + var(--border-width))
    );
}

.bits-token__body {
  min-block-size: calc(var(--bits-control-height) * 2.3);
  display: grid;
  gap: var(--bits-stack-gap);
  padding: var(--bits-card-padding);
}

.bits-token__title {
  margin: 0;
  font-size: calc(var(--font-base) * 1.1);
  font-weight: 500;
  line-height: 1.05;
  overflow-wrap: anywhere;
}

.bits-token__footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--bits-stack-gap);
  align-items: center;
  border-block-start: var(--bits-line);
  padding: var(--bits-card-padding);
}
</style>
