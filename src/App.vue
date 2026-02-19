<script setup>
import { ref, onMounted } from 'vue'
import WelcomeView from './views/WelcomeView.vue'
import ChatView from './views/ChatView.vue'
import SettingsView from './views/SettingsView.vue'
import { useStorage } from './composables/useStorage.js'

const currentView = ref('welcome')
const { isConfigured } = useStorage()

onMounted(() => {
  // Config is already loaded on module init
  // If already configured, go directly to chat
  // DEV: Commented out to show welcome page
  // if (isConfigured()) {
  //   currentView.value = 'chat'
  // }
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
</template>
