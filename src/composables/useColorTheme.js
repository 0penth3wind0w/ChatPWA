import { ref, watch } from 'vue'
import { useStorage } from './useStorage.js'

const { config, saveConfig } = useStorage()

// Color themes that maintain the warm, natural design tone
// All colors are carefully selected for eye comfort and calming effect
const COLOR_THEMES = {
  green: {
    primary: '#3D8A5A',      // Forest Green - Natural, calming
    dark: '#4D9B6A',         // Moss Green
    light: '#C8F0D8',        // Soft Mint
    name: 'Forest Green'
  },
  blue: {
    primary: '#5B8AA8',      // Muted Blue - Calm like water
    dark: '#6B9AB8',         // Soft Sky
    light: '#D4E8F3',        // Pale Cloud
    name: 'Calm Blue'
  },
  slate: {
    primary: '#6B7F8C',      // Slate Blue-Gray - Neutral, professional
    dark: '#7B8F9C',         // Soft Slate
    light: '#D8DEE3',        // Pale Slate
    name: 'Slate'
  }
}

// Current theme
const currentTheme = ref(config.value.colorTheme || 'green')

// Apply theme colors to CSS variables
const applyTheme = (theme) => {
  const colors = COLOR_THEMES[theme] || COLOR_THEMES.green

  document.documentElement.style.setProperty('--color-forest-green', colors.primary)
  document.documentElement.style.setProperty('--color-dark-green', colors.dark)
  document.documentElement.style.setProperty('--color-light-green', colors.light)
}

// Watch for theme changes and save to storage
watch(currentTheme, (newTheme) => {
  applyTheme(newTheme)
  saveConfig({
    ...config.value,
    colorTheme: newTheme
  })
})

// Initialize theme on module load
applyTheme(currentTheme.value)

export function useColorTheme() {
  const setTheme = (theme) => {
    if (COLOR_THEMES[theme]) {
      currentTheme.value = theme
    }
  }

  return {
    currentTheme,
    setTheme,
    themes: COLOR_THEMES
  }
}
