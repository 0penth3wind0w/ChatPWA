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

useDarkMode()
useColorTheme()

const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

onMounted(() => {
  if (isConfigured()) {
    currentView.value = 'chat'
  }

  setViewportHeight()
  window.addEventListener('resize', setViewportHeight)
  window.addEventListener('orientationchange', setViewportHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', setViewportHeight)
  window.removeEventListener('orientationchange', setViewportHeight)
})

const handleNavigate = (view) => {
  currentView.value = view
  // Focus main content after navigation for accessibility
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

    <UpdatePrompt />
  </ErrorBoundary>
</template>
