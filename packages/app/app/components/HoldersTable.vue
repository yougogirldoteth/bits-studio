<template>
  <div class="bits-holders">
    <div class="bits-holders__header">
      <div>
        <h2 class="bits-holders__title">Top holders</h2>
      </div>
    </div>

    <div class="bits-holders__scroller">
      <table class="bits-holders__table">
        <tbody v-if="holders.length">
          <tr v-for="(holder, index) in holders" :key="holder.owner">
            <td>{{ index + 1 }}</td>
            <td>
              <a
                class="bits-holder"
                :href="holder.explorerUrl"
                rel="noreferrer"
                target="_blank"
              >
                <span class="bits-holder__name">
                  {{ holder.ensName || shortenAddress(holder.owner) }}
                </span>
              </a>
            </td>
            <td>{{ formatTokenBalance(holder.balance) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!holders.length" class="bits-holders__empty">
      No holders indexed yet.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BitsHolderSummary } from '@bits-collection/shared'

defineProps<{
  holders: BitsHolderSummary[]
  total: number
}>()

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatTokenBalance(value: string) {
  const balance = BigInt(value)

  if (balance <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return new Intl.NumberFormat('en-US').format(Number(balance))
  }

  return balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
</script>
