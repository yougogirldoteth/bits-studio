<template>
  <article
    class="bits-token"
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
      <div
        v-else
        class="bits-token__fallback"
      >
        Token {{ token.tokenId }}
      </div>
    </div>

    <div class="bits-token__body">
      <h2 class="bits-token__title">
        {{ token.name || `Token ${token.tokenId}` }}
      </h2>
      <div class="bits-meta">
        {{ token.minted }} / {{ token.editionSize }} minted
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
        {{ token.soldOut ? 'Sold out' : 'Mint' }}
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

const props = defineProps<{
  token: BitsTokenSummary
  mode: 'thumbnail' | 'html'
  priceLabel: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  mint: [token: BitsTokenSummary]
}>()

const imageSrc = computed(() => imageSrcFromSvg(props.token.svg))
const htmlSrc = computed(() => htmlSrcdoc(props.token.html))
</script>
