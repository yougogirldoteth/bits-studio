<template>
  <Dialog
    v-model:open="isOpen"
    :click-outside="canDismiss"
    :closable="canDismiss"
    :title="dialogTitle"
    class="transaction-flow"
    compat
    @closed="onClosed"
  >
    <EvmTransactionFlow
      ref="flow"
      :auto-close-success="autoCloseSuccess"
      :chain="chain"
      :delay-after="delayAfter"
      :delay-autoclose="delayAutoclose"
      :dismissable="dismissable"
      :request="activeRequest"
      :text="text"
      no-footer
      @cancel="cancel"
      @complete="emit('complete')"
      @update:step="onStepUpdate"
    />

    <template #footer>
      <Button v-if="step === 'chain'" class="secondary" @click="cancel">
        Cancel
      </Button>

      <template v-if="step === 'confirm' || step === 'error'">
        <Button class="secondary" @click="cancel">Cancel</Button>
        <Button class="primary" @click="execute">
          {{ actionLabel }}
        </Button>
      </template>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { Button, Dialog } from '@1001-digital/components'

type Hash = `0x${string}`
type TransactionStep =
  'idle' | 'confirm' | 'chain' | 'requesting' | 'waiting' | 'complete' | 'error'

const props = withDefaults(
  defineProps<{
    chain?: string | number
    request?: () => Promise<Hash>
    text?: {
      title?: Record<string, string>
      lead?: Record<string, string>
      action?: Record<string, string>
    }
    delayAfter?: number
    delayAutoclose?: number
    autoCloseSuccess?: boolean
    dismissable?: boolean
  }>(),
  {
    delayAfter: 700,
    delayAutoclose: 2200,
    autoCloseSuccess: true,
    dismissable: true,
  },
)

const emit = defineEmits<{
  complete: []
  cancel: []
}>()

const defaultTitles: Record<TransactionStep, string> = {
  idle: '',
  confirm: 'Confirm Transaction',
  chain: 'Switch Network',
  requesting: 'Requesting',
  waiting: 'Processing',
  complete: 'Complete',
  error: 'Error',
}
const defaultActions: Partial<Record<TransactionStep, string>> = {
  confirm: 'Execute',
  error: 'Try Again',
}

const flow = ref<{
  start: () => unknown
  initializeRequest: (request?: () => Promise<Hash>) => unknown
  cancel: () => unknown
} | null>(null)
const step = ref<TransactionStep>('idle')
const activeRequest = shallowRef(props.request)
const isOpen = computed({
  get: () => step.value !== 'idle',
  set: (open) => {
    if (!open) cancel()
  },
})
const canDismiss = computed(
  () => props.dismissable && step.value !== 'requesting',
)
const dialogTitle = computed(
  () => props.text?.title?.[step.value] ?? defaultTitles[step.value],
)
const actionLabel = computed(
  () => props.text?.action?.[step.value] ?? defaultActions[step.value],
)

watch(
  () => props.request,
  (request) => {
    activeRequest.value = request
  },
)

async function start(request?: () => Promise<Hash>) {
  if (request) {
    activeRequest.value = request
  }

  step.value = 'confirm'
  await nextTick()
  return flow.value?.start()
}

function execute() {
  return flow.value?.initializeRequest()
}

function cancel() {
  flow.value?.cancel()
  step.value = 'idle'
  emit('cancel')
}

function onClosed() {
  if (step.value !== 'idle') {
    cancel()
  }
}

function onStepUpdate(nextStep: string) {
  step.value = nextStep as TransactionStep
}

defineExpose({ start })
</script>
