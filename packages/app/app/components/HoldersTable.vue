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
            <td>
              <span class="bits-holder__rank">{{ index + 1 }}</span>
            </td>
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
            <td>
              <span class="bits-holder__balance">
                {{ formatTokenBalance(holder.balance) }}
              </span>
            </td>
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

<style scoped>
.bits-holders {
  border: var(--bits-line);
}

.bits-holders__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--bits-stack-gap);
  border-block-end: var(--bits-line);
  padding: var(--bits-card-padding);
}

.bits-holders__title {
  margin: 0;
  font-size: var(--ui-font-size);
  font-weight: 600;
  line-height: 1.1;
}

.bits-holders__scroller {
  max-block-size: calc((var(--bits-control-height) + var(--spacer-sm)) * 5);
  overflow: auto;
}

.bits-holders__table {
  inline-size: 100%;
  border-collapse: collapse;
  font-size: var(--ui-font-size);
  table-layout: fixed;
}

.bits-holders__table td {
  block-size: calc(var(--bits-control-height) + var(--spacer-sm));
  padding: 0 var(--bits-card-padding);
  border-block-end: var(--bits-line);
  text-align: start;
  vertical-align: middle;
}

.bits-holders__table td:first-child {
  inline-size: calc(var(--font-base) * 2.35);
  color: var(--bits-muted);
}

.bits-holders__table td:last-child {
  inline-size: calc(var(--font-base) * 4.4);
  text-align: end;
}

.bits-holders__table tbody tr:last-child td {
  border-block-end: 0;
}

.bits-holder,
.bits-holder__rank,
.bits-holder__balance {
  block-size: calc(var(--bits-control-height) + var(--spacer-sm));
  display: flex;
  align-items: center;
  line-height: 1;
}

.bits-holder {
  inline-size: 100%;
  max-inline-size: 100%;
  color: var(--bits-ink);
  text-decoration: none;
}

.bits-holder__balance {
  justify-content: flex-end;
}

.bits-holder:hover .bits-holder__name {
  text-decoration: underline;
  text-decoration-thickness: var(--border-width);
  text-underline-offset: var(--bits-underline-offset);
}

.bits-holder__name {
  display: block;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bits-holders__empty {
  border-block-start: var(--bits-line);
  padding: var(--bits-card-padding);
  color: var(--bits-muted);
  font-size: var(--ui-font-size);
}
</style>
