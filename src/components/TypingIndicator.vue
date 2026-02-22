<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  model: {
    type: String,
    default: 'AI Assistant'
  }
})
</script>

<template>
  <div class="w-full flex justify-start">
    <div class="max-w-[85%] flex flex-col gap-1 animate-fade-in">
      <div class="flex items-center gap-2 px-1">
        <div class="w-6 h-6 bg-light-green rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-3.5 h-3.5 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        </div>
        <p class="text-xs font-semibold text-forest-green">
          {{ model }}
        </p>
        <p class="text-xs text-text-tertiary">{{ t('chat.typing') }}</p>
      </div>
      <div class="bg-bg-surface rounded-2xl rounded-tl-sm shadow-soft p-4 border border-border-subtle">
        <div class="flex items-center gap-1.5">
          <div class="w-2 h-2 bg-forest-green rounded-full typing-dot"></div>
          <div class="w-2 h-2 bg-forest-green rounded-full typing-dot"></div>
          <div class="w-2 h-2 bg-forest-green rounded-full typing-dot"></div>
        </div>
      </div>
    </div>
  </div>
</template>
