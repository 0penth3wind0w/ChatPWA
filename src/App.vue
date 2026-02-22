<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import WelcomeView from './views/WelcomeView.vue'
import ChatView from './views/ChatView.vue'
import SettingsView from './views/SettingsView.vue'
import UpdatePrompt from './components/UpdatePrompt.vue'
import { useStorage } from './composables/useStorage.js'
import { useDarkMode } from './composables/useDarkMode.js'
import { useColorTheme } from './composables/useColorTheme.js'

const currentView = ref('welcome')
const { isConfigured } = useStorage()

// Initialize dark mode and color theme
useDarkMode()
useColorTheme()

// Handle viewport height for iOS Safari URL bar
const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

onMounted(() => {
  // Config is already loaded on module init
  // If already configured, go directly to chat
  // DEV: Commented out to show welcome page
  if (isConfigured()) {
    currentView.value = 'chat'
  }

  // Set initial viewport height
  setViewportHeight()

  // Update on resize and orientation change
  window.addEventListener('resize', setViewportHeight)
  window.addEventListener('orientationchange', setViewportHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', setViewportHeight)
  window.removeEventListener('orientationchange', setViewportHeight)
})

const handleNavigate = (view) => {
  currentView.value = view
}
</script>

<template>
  <WelcomeView
    v-if="currentView === 'welcome'"
    @navigate="handleNavigate"
  />
  <ChatView
    v-else-if="currentView === 'chat'"
    @navigate="handleNavigate"
  />
  <SettingsView
    v-else-if="currentView === 'settings'"
    @navigate="handleNavigate"
  />

  <!-- PWA Update Prompt -->
  <UpdatePrompt />
</template>
