import { ref, watch } from 'vue'

const STORAGE_KEY = 'chatpwa_theme'

// Shared dark mode state (singleton)
const isDark = ref(false)

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

  applyTheme()
}

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

initTheme()

export function useDarkMode() {
  const toggleDarkMode = () => {
    isDark.value = !isDark.value
  }

  return {
    isDark,
    toggleDarkMode
  }
}
