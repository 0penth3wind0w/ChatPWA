import { ref, watch } from 'vue'

const STORAGE_KEY = 'chatpwa_theme'

// Shared dark mode state (singleton)
const isDark = ref(false)

// Apply theme class to document
const applyTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Initialize theme from localStorage or system preference
const initTheme = () => {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (stored) {
    // Use stored preference
    isDark.value = stored === 'dark'
  } else {
    // Use system preference
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // Apply theme to document
  applyTheme()
}

// Auto-save theme preference and apply
watch(isDark, (newValue) => {
  localStorage.setItem(STORAGE_KEY, newValue ? 'dark' : 'light')
  applyTheme()
})

// Listen for system theme changes
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', (e) => {
  // Only update if user hasn't set a manual preference
  if (!localStorage.getItem(STORAGE_KEY)) {
    isDark.value = e.matches
  }
})

// Initialize theme immediately when module loads
initTheme()

export function useDarkMode() {
  /**
   * Toggle dark mode
   */
  const toggleDarkMode = () => {
    isDark.value = !isDark.value
  }

  /**
   * Set dark mode explicitly
   */
  const setDarkMode = (value) => {
    isDark.value = value
  }

  return {
    isDark,
    toggleDarkMode,
    setDarkMode
  }
}
