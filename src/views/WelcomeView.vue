<script setup>
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['navigate'])
const { t } = useI18n()

const handleGetStarted = () => {
  emit('navigate', 'settings')
}
</script>

<template>
  <div class="w-full flex flex-col bg-bg-primary overflow-y-auto" style="height: calc(var(--vh, 1vh) * 100)">
    <!-- Content Wrapper -->
    <main id="main-content" role="main" tabindex="-1" class="flex-1 flex flex-col items-center px-6 pt-16 pb-24 gap-10 focus:outline-none" aria-label="Welcome to ChatPWA">
      <!-- Logo -->
      <div class="w-24 h-24 bg-forest-green rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(61,138,90,0.2)]" aria-hidden="true">
        <svg class="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      </div>

      <!-- Welcome Content -->
      <div class="flex flex-col items-center gap-4 w-full">
        <h1 class="text-3xl font-bold text-text-primary -tracking-wide text-center leading-tight">
          {{ t('welcome.title') }}
        </h1>
        <p class="text-base text-text-secondary text-center leading-relaxed max-w-[300px]">
          {{ t('welcome.description') }}
        </p>
      </div>

      <!-- Features Card -->
      <div class="card w-full" role="region" aria-label="Key features">
        <!-- Feature 1 -->
        <div class="flex items-start gap-4 w-full">
          <div class="w-11 h-11 bg-light-green rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <svg class="w-5 h-5 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div class="flex flex-col gap-1.5 flex-1">
            <p class="text-base font-semibold text-text-primary">
              {{ t('welcome.features.custom.title') }}
            </p>
            <p class="text-sm text-text-tertiary leading-relaxed">
              {{ t('welcome.features.custom.description') }}
            </p>
          </div>
        </div>

        <div class="w-full h-px bg-border-subtle my-6"></div>

        <!-- Feature 2 -->
        <div class="flex items-start gap-4 w-full">
          <div class="w-11 h-11 bg-light-green rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <svg class="w-5 h-5 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div class="flex flex-col gap-1.5 flex-1">
            <p class="text-base font-semibold text-text-primary">
              {{ t('welcome.features.private.title') }}
            </p>
            <p class="text-sm text-text-tertiary leading-relaxed">
              {{ t('welcome.features.private.description') }}
            </p>
          </div>
        </div>

        <div class="w-full h-px bg-border-subtle my-6"></div>

        <!-- Feature 3 -->
        <div class="flex items-start gap-4 w-full">
          <div class="w-11 h-11 bg-light-green rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <svg class="w-5 h-5 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
          </div>
          <div class="flex flex-col gap-1.5 flex-1">
            <p class="text-base font-semibold text-text-primary">
              {{ t('welcome.features.offline.title') }}
            </p>
            <p class="text-sm text-text-tertiary leading-relaxed">
              {{ t('welcome.features.offline.description') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Get Started Button -->
      <button
        @click="handleGetStarted"
        class="btn-primary w-full h-14 shadow-elevated text-base"
      >
        {{ t('welcome.getStarted') }}
      </button>
    </main>
  </div>
</template>
