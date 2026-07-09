<template>
  <button
    class="bits-theme-toggle"
    type="button"
    :aria-label="label"
    :title="label"
    @click="toggleTheme"
  >
    <Icon :name="iconName" />
  </button>
</template>

<script setup lang="ts">
type ThemeMode = 'dark' | 'light'

const themeStorageKey = 'bits-theme'
const theme = ref<ThemeMode>('dark')

const iconName = computed(() =>
  theme.value === 'dark' ? 'lucide:sun' : 'lucide:moon',
)
const label = computed(() =>
  theme.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
)

const applyTheme = (mode: ThemeMode) => {
  document.documentElement.dataset.theme = mode
  document.documentElement.style.colorScheme = mode
}

const toggleTheme = () => {
  const nextTheme = theme.value === 'dark' ? 'light' : 'dark'
  theme.value = nextTheme
  applyTheme(nextTheme)
  localStorage.setItem(themeStorageKey, nextTheme)
}

onMounted(() => {
  const storedTheme = localStorage.getItem(themeStorageKey)
  const nextTheme = storedTheme === 'light' ? 'light' : 'dark'

  theme.value = nextTheme
  applyTheme(nextTheme)
})
</script>

<style scoped>
.bits-theme-toggle {
  position: fixed;
  inset-block-end: var(--bits-gutter);
  inset-inline-end: var(--bits-gutter);
  z-index: 200;
  inline-size: var(--bits-control-height);
  block-size: var(--bits-control-height);
  display: inline-grid;
  place-items: center;
  border: var(--bits-line-strong);
  border-radius: 0;
  box-shadow: none;
  background: var(--bits-bg);
  color: var(--bits-ink);
  cursor: pointer;
  padding: 0;
  transition:
    background-color var(--bits-transition),
    border-color var(--bits-transition),
    color var(--bits-transition);
}

.bits-theme-toggle:hover {
  border-color: var(--bits-ink);
  background: var(--bits-ink);
  color: var(--bits-bg);
}

.bits-theme-toggle :deep(svg) {
  inline-size: var(--font-base);
  block-size: var(--font-base);
}
</style>
