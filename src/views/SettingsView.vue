<script setup>
import { ref } from 'vue'
import SettingsForm from '../components/SettingsForm.vue'
import { useStorage } from '../composables/useStorage.js'
import { useApi } from '../composables/useApi.js'
import { useChat } from '../composables/useChat.js'
import { useDarkMode } from '../composables/useDarkMode.js'

const emit = defineEmits(['navigate'])
const { isDark, toggleDarkMode } = useDarkMode()

const { testConnection } = useApi()
const { clearMessages } = useChat()
const testStatus = ref(null) // null, 'success', or 'error'
const testMessage = ref('')

const handleTest = async (testConfig) => {
  testStatus.value = null
  testMessage.value = 'Testing connection...'

  try {
    await testConnection(testConfig)
    testStatus.value = 'success'
    testMessage.value = 'Connection successful!'

    // Clear success message after 3 seconds
    setTimeout(() => {
      testStatus.value = null
      testMessage.value = ''
    }, 3000)
  } catch (err) {
    testStatus.value = 'error'
    testMessage.value = err.message || 'Connection failed'

    // Clear error message after 5 seconds
    setTimeout(() => {
      testStatus.value = null
      testMessage.value = ''
    }, 5000)
  }
}

const handleClearHistory = async () => {
  if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
    await clearMessages()
  }
}

const handleBack = () => {
  emit('navigate', 'chat')
}
</script>

<template>
  <div class="w-full flex flex-col bg-bg-primary" style="height: calc(var(--vh, 1vh) * 100)">
    <!-- Fixed Header -->
    <header role="banner" class="flex-shrink-0 px-6 pt-6 pb-4">
      <div class="flex items-center justify-between w-full">
        <button
          @click="handleBack"
          aria-label="Back to chat"
          class="w-11 h-11 bg-bg-surface rounded-full shadow-elevated flex items-center justify-center hover:bg-bg-elevated transition-colors"
        >
          <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 class="text-2xl font-semibold text-text-primary -tracking-tight">
          Settings
        </h1>
        <div class="w-11 h-11" aria-hidden="true"></div>
      </div>
    </header>

    <!-- Scrollable Content -->
    <main id="main-content" role="main" class="flex-1 overflow-y-auto px-6 min-h-0" aria-label="Settings configuration">
      <div class="flex flex-col gap-6 pb-24 pt-2">
        <!-- Clear Chat History Card -->
        <div class="card">
          <div class="flex items-center justify-between w-full gap-4">
            <div class="flex flex-col gap-1.5">
              <p class="text-base font-semibold text-text-primary">
                Clear Chat History
              </p>
              <p class="text-sm text-text-tertiary leading-relaxed">
                Remove all conversation messages
              </p>
            </div>
            <button
              @click="handleClearHistory"
              class="h-10 px-5 bg-bg-elevated text-text-secondary text-sm font-semibold rounded-lg hover:bg-border-subtle transition-colors border border-border-subtle"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Settings Card -->
        <div class="card">
          <h2 class="text-lg font-semibold text-text-primary -tracking-tight mb-6">
            API Configuration
          </h2>
          <SettingsForm
            @test="handleTest"
          />

          <!-- Test Status Message -->
          <div v-if="testMessage" class="mt-5 p-4 rounded-xl" :class="{
            'bg-light-green/30 text-forest-green': testStatus === 'success',
            'bg-red-50 text-warm-red': testStatus === 'error',
            'bg-bg-elevated text-text-secondary': !testStatus
          }">
            <p class="text-sm font-medium">{{ testMessage }}</p>
          </div>
        </div>

        <!-- Dark Mode Card -->
        <div class="card">
          <div class="flex items-center justify-between w-full gap-4">
            <div class="flex flex-col gap-1.5">
              <p class="text-base font-semibold text-text-primary">
                Dark Mode
              </p>
              <p class="text-sm text-text-tertiary leading-relaxed">
                Switch between light and dark theme
              </p>
            </div>
            <button
              @click="toggleDarkMode"
              :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              class="w-14 h-8 bg-bg-elevated rounded-full relative transition-colors border border-border-subtle"
              :class="{ 'bg-forest-green border-forest-green': isDark }"
            >
              <span
                class="absolute w-6 h-6 bg-white rounded-full top-1 transition-all shadow-sm"
                :class="isDark ? 'left-7' : 'left-1'"
              >
                <!-- Sun icon (light mode) -->
                <svg v-if="!isDark" class="w-4 h-4 text-forest-green absolute top-1 left-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                <!-- Moon icon (dark mode) -->
                <svg v-else class="w-4 h-4 text-forest-green absolute top-1 left-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
