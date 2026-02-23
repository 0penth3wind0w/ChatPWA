<script setup>
import { onUnmounted } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

let visibilityHandler = null

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(swUrl, r) {
    // Check for updates only on app launch/focus
    if (r) {
      const checkForUpdate = async () => {
        if (!(!r.installing && navigator)) return
        if ('connection' in navigator && !navigator.onLine) return

        const resp = await fetch(swUrl, {
          cache: 'no-store',
          headers: {
            'cache': 'no-store',
            'cache-control': 'no-cache',
          }
        })

        if (resp?.status === 200) {
          await r.update()
        }
      }

      // Check immediately on registration (app launch)
      checkForUpdate()

      // Check when app becomes visible again (user returns to PWA)
      visibilityHandler = () => {
        if (!document.hidden) {
          checkForUpdate()
        }
      }
      document.addEventListener('visibilitychange', visibilityHandler)
    }
  }
})

// Cleanup event listener to prevent memory leak
onUnmounted(() => {
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
  }
})

const close = () => {
  needRefresh.value = false
}

const update = async () => {
  await updateServiceWorker()
}
</script>

<template>
  <!-- Backdrop overlay with blur -->
  <div
    v-if="needRefresh"
    class="fixed inset-0 z-50 flex items-end justify-center pb-6 animate-fade-in"
  >
    <!-- Blur backdrop -->
    <div class="absolute inset-0 bg-text-primary/20 backdrop-blur-sm"></div>

    <!-- Update prompt card -->
    <div class="relative bg-bg-surface rounded-2xl shadow-elevated border border-border-subtle p-4 flex items-center gap-4 max-w-md mx-6">
      <div class="flex-1">
        <p class="text-sm font-semibold text-text-primary mb-1">
          {{ t('pwa.updateAvailable') }}
        </p>
        <p class="text-xs text-text-secondary">
          {{ t('pwa.updateMessage') }}
        </p>
      </div>
      <div class="flex gap-2">
        <button
          @click="close"
          class="px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          {{ t('pwa.later') }}
        </button>
        <button
          @click="update"
          class="px-4 py-2 bg-forest-green text-white text-sm font-semibold rounded-lg hover:bg-dark-green transition-colors"
        >
          {{ t('pwa.reload') }}
        </button>
      </div>
    </div>
  </div>
</template>
