<script setup>
import { ref } from 'vue'
import SettingsForm from '../components/SettingsForm.vue'
import { useStorage } from '../composables/useStorage.js'
import { useApi } from '../composables/useApi.js'
import { useChat } from '../composables/useChat.js'

const emit = defineEmits(['navigate'])

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
  <div class="h-screen w-full flex flex-col bg-bg-primary">
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
      <div class="flex flex-col gap-6 pb-6">
        <!-- Settings Card -->
        <div class="card">
          <h2 class="text-lg font-semibold text-text-primary -tracking-tight mb-5">
            API Configuration
          </h2>
          <SettingsForm
            @test="handleTest"
          />

          <!-- Test Status Message -->
          <div v-if="testMessage" class="mt-4 p-3 rounded-md" :class="{
            'bg-sage-green text-forest-green': testStatus === 'success',
            'bg-red-50 text-warm-red': testStatus === 'error',
            'bg-bg-elevated text-text-secondary': !testStatus
          }">
            <p class="text-sm font-medium">{{ testMessage }}</p>
          </div>
        </div>

        <!-- Back to Chat Button -->
        <button
          @click="emit('navigate', 'chat')"
          class="btn-primary w-full h-13 shadow-elevated"
        >
          Back to Chat
        </button>

        <!-- Clear Chat History Card -->
        <div class="card">
          <div class="flex items-center justify-between w-full">
            <div class="flex flex-col gap-1">
              <p class="text-base font-medium text-text-primary">
                Clear Chat History
              </p>
              <p class="text-sm text-text-tertiary">
                Remove all conversation messages
              </p>
            </div>
            <button
              @click="handleClearHistory"
              class="h-9 px-4 bg-bg-muted text-text-secondary text-sm font-semibold rounded-md hover:bg-border-subtle transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
