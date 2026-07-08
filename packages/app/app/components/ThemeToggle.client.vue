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
