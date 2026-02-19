<script setup>
import { onMounted } from 'vue'
import SettingsForm from '../components/SettingsForm.vue'
import { useStorage } from '../composables/useStorage.js'

const emit = defineEmits(['navigate'])

const { config, loadConfig, saveConfig, clearConfig } = useStorage()

onMounted(() => {
  loadConfig()
})

const handleSave = (newConfig) => {
  const success = saveConfig(newConfig)
  if (success) {
    // Show success feedback (could be a toast notification in the future)
    console.log('Configuration saved successfully')
    // Navigate back to chat or welcome
    emit('navigate', 'chat')
  }
}

const handleTest = async (testConfig) => {
  // This would make a test request to the API
  // For now, just log it
  console.log('Testing connection with:', {
    endpoint: testConfig.endpoint,
    model: testConfig.model,
    token: '***' // Don't log the actual token
  })
  // TODO: Implement actual API test in Phase 4
}

const handleClearHistory = () => {
  if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
    // TODO: Implement clear chat history in Phase 5
    console.log('Clear chat history')
  }
}

const handleBack = () => {
  emit('navigate', 'chat')
}
</script>

<template>
  <div class="min-h-screen w-full flex flex-col bg-bg-primary">
    <!-- Content Wrapper -->
    <div class="flex-1 flex flex-col px-6 gap-6 pb-6">
      <!-- Header -->
      <div class="flex items-center justify-between w-full">
        <button
          @click="handleBack"
          class="w-11 h-11 bg-bg-surface rounded-full shadow-elevated flex items-center justify-center hover:bg-bg-elevated transition-colors"
        >
          <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 class="text-2xl font-semibold text-text-primary -tracking-tight">
          Settings
        </h1>
        <div class="w-11 h-11"></div>
      </div>

      <!-- Settings Card -->
      <div class="card">
        <h2 class="text-lg font-semibold text-text-primary -tracking-tight mb-5">
          API Configuration
        </h2>
        <SettingsForm
          :initial-config="config"
          @save="handleSave"
          @test="handleTest"
        />
      </div>

      <!-- Save Button -->
      <button
        @click="handleSave(config)"
        class="btn-primary w-full h-13 shadow-elevated"
      >
        Save Configuration
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
  </div>
</template>
