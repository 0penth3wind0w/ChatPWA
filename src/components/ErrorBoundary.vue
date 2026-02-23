<script setup>
import { ref, onErrorCaptured } from 'vue'
import { logger } from '../utils/logger.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const error = ref(null)
const errorInfo = ref(null)

// Capture errors from child components
onErrorCaptured((err, instance, info) => {
  error.value = err
  errorInfo.value = info

  // Log error in development
  logger.error('Error boundary caught error:', err, info)

  // Prevent error from propagating further
  return false
})

const handleReset = () => {
  error.value = null
  errorInfo.value = null

  // Reload the page to recover from error
  window.location.reload()
}

const handleDismiss = () => {
  error.value = null
  errorInfo.value = null
}
</script>

<template>
  <div v-if="error" class="min-h-screen bg-bg-primary flex items-center justify-center p-6">
    <div class="max-w-md w-full bg-bg-surface rounded-2xl shadow-elevated border border-border-subtle p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-semibold text-text-primary">
            {{ t('errors.somethingWrong') }}
          </h2>
          <p class="text-sm text-text-secondary">
            {{ t('errors.appError') }}
          </p>
        </div>
      </div>

      <div class="bg-bg-elevated rounded-lg p-4 mb-4">
        <p class="text-sm text-text-secondary font-mono break-words">
          {{ error.message || t('errors.unknownError') }}
        </p>
      </div>

      <div class="flex gap-3">
        <button
          @click="handleDismiss"
          class="flex-1 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary bg-bg-elevated rounded-lg border border-border-subtle hover:border-border-strong transition-colors"
        >
          {{ t('errors.dismiss') }}
        </button>
        <button
          @click="handleReset"
          class="flex-1 px-4 py-2.5 bg-forest-green text-white text-sm font-semibold rounded-lg hover:bg-dark-green transition-colors"
        >
          {{ t('errors.reloadApp') }}
        </button>
      </div>
    </div>
  </div>

  <!-- Render children if no error -->
  <slot v-else />
</template>
