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
    <!-- Status Bar (iOS-style) -->
    <div class="flex items-center justify-between w-full h-[62px] px-6">
      <span class="text-[17px] font-semibold">9:41</span>
      <div class="flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 11h5v2H2zm15 0h5v2h-5zm-6 6h2v5h-2zm0-13h2v5h-2zM4.222 5.636l1.414-1.414 3.536 3.536-1.414 1.414zm15.556 12.728l-1.414 1.414-3.536-3.536 1.414-1.414zm-12.02-1.414l-3.536 3.536-1.414-1.414 3.536-3.536zM19.778 7.05l-1.414-1.414-3.536 3.536 1.414 1.414z"/>
        </svg>
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
        </svg>
        <svg class="w-6 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
        </svg>
      </div>
    </div>

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
