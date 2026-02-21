<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()

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
          Update Available
        </p>
        <p class="text-xs text-text-secondary">
          A new version is ready. Reload to update.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          @click="close"
          class="px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Later
        </button>
        <button
          @click="update"
          class="px-4 py-2 bg-forest-green text-white text-sm font-semibold rounded-lg hover:bg-dark-green transition-colors"
        >
          Reload
        </button>
      </div>
    </div>
  </div>
</template>
