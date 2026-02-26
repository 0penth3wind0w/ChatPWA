import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStorage } from './useStorage.js'

const { config, saveConfig } = useStorage()

const currentTheme = ref(config.value.colorTheme || 'green')

// Flag set when currentTheme is updated from external config, so the currentTheme
// watcher knows not to write it back to storage (it just came from there).
let syncingFromConfig = false

// Keep currentTheme in sync if colorTheme changes externally (e.g. storage reload).
// Narrow source to avoid reacting to every unrelated config save.
watch(() => config.value.colorTheme, (theme) => {
  const resolved = theme || 'green'
  if (resolved !== currentTheme.value) {
    syncingFromConfig = true
    currentTheme.value = resolved
    // applyTheme is called by the currentTheme watcher below
  }
})

// Color theme definitions (colors only)
const COLOR_THEME_COLORS = {
  green: {
    primary: '#3D8A5A',      // Forest Green - Natural, calming
    dark: '#4D9B6A',         // Moss Green
    light: '#C8F0D8'         // Soft Mint
  },
  blue: {
    primary: '#5B8AA8',      // Muted Blue - Calm like water
    dark: '#6B9AB8',         // Soft Sky
    light: '#D4E8F3'         // Pale Cloud
  },
  slate: {
    primary: '#6B7F8C',      // Slate Blue-Gray - Neutral, professional
    dark: '#7B8F9C',         // Soft Slate
    light: '#D8DEE3'         // Pale Slate
  }
}

const applyTheme = (theme) => {
  const colors = COLOR_THEME_COLORS[theme] || COLOR_THEME_COLORS.green

  document.documentElement.style.setProperty('--color-forest-green', colors.primary)
  document.documentElement.style.setProperty('--color-dark-green', colors.dark)
  document.documentElement.style.setProperty('--color-light-green', colors.light)
}

// Watch for theme changes, apply CSS vars, and save to storage.
// immediate: true replaces the manual applyTheme() call below, so theme
// is applied once on module init and again on every subsequent change.
watch(currentTheme, (newTheme, oldTheme) => {
  applyTheme(newTheme)
  // Skip persisting on the very first (init) run, or when syncing from external config
  // (the value already came from storage — no need to write it back)
  if (oldTheme !== undefined && !syncingFromConfig) {
    saveConfig({
      ...config.value,
      colorTheme: newTheme
    })
  }
  syncingFromConfig = false
}, { immediate: true })

export function useColorTheme() {
  const { t } = useI18n()

  const setTheme = (theme) => {
    if (COLOR_THEME_COLORS[theme]) {
      currentTheme.value = theme
    }
  }

  // Create themes object with translated names
  const themes = computed(() => ({
    green: {
      ...COLOR_THEME_COLORS.green,
      name: t('settings.colorTheme.options.green')
    },
    blue: {
      ...COLOR_THEME_COLORS.blue,
      name: t('settings.colorTheme.options.blue')
    },
    slate: {
      ...COLOR_THEME_COLORS.slate,
      name: t('settings.colorTheme.options.slate')
    }
  }))

  return {
    currentTheme,
    setTheme,
    themes
  }
}
