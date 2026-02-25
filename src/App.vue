<script setup>
import { ref, onMounted, onUnmounted, nextTick, defineAsyncComponent } from 'vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import UpdatePrompt from './components/UpdatePrompt.vue'
import { useStorage } from './composables/useStorage.js'
import { useDarkMode } from './composables/useDarkMode.js'
import { useColorTheme } from './composables/useColorTheme.js'

// Lazy load views for code splitting
const WelcomeView = defineAsyncComponent(() => import('./views/WelcomeView.vue'))
const ChatView = defineAsyncComponent(() => import('./views/ChatView.vue'))
const SettingsView = defineAsyncComponent(() => import('./views/SettingsView.vue'))

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
  // Commented out to show welcome page
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

  // Set focus to main content after navigation for accessibility
  nextTick(() => {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
    }
  })
}
</script>

<template>
  <ErrorBoundary>
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
  </ErrorBoundary>
</template>
