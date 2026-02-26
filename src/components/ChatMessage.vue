<script setup>
import { computed, ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from '../utils/markdown.js'
import DOMPurify from 'dompurify'
import { logger } from '../utils/logger.js'

const { t, locale } = useI18n()

const props = defineProps({
  message: {
    type: Object,
    required: true,
    validator: (msg) => {
      return msg.role && msg.content && ['user', 'assistant'].includes(msg.role)
    }
  }
})

const isUser = computed(() => props.message.role === 'user')

const copied = ref(false)
const contentEl = ref(null)
let copiedTimer = null

const copyToClipboard = async () => {
  try {
    const html = contentEl.value?.innerHTML ?? ''
    const text = contentEl.value?.innerText ?? props.message.content
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      })
    ])
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    logger.error('Copy failed:', err)
  }
}

onUnmounted(() => { clearTimeout(copiedTimer) })

// Compute the Date object once to avoid constructing it twice
const messageDate = computed(() =>
  props.message.timestamp ? new Date(props.message.timestamp) : null
)

const formattedTime = computed(() => {
  if (!messageDate.value) return ''
  return messageDate.value.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
})

const formattedDatetime = computed(() =>
  messageDate.value ? messageDate.value.toISOString() : ''
)

const renderedContent = computed(() => {
  if (!isUser.value) {
    try {
      // Extract data: image URLs before sanitization (DOMPurify strips them).
      // Replace each with a placeholder, sanitize, then restore.
      const dataUrls = []
      const contentWithPlaceholders = props.message.content.replace(
        /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g,
        (_, alt, src) => {
          const idx = dataUrls.length
          dataUrls.push({ alt, src })
          return `![${alt}](__DATA_IMAGE_${idx}__)`
        }
      )

      const rawHtml = marked.parse(contentWithPlaceholders)
      let sanitized = DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ['img'],
        ADD_ATTR: ['src', 'alt']
      })

      // Restore data: URLs into img src attributes
      if (dataUrls.length > 0) {
        sanitized = sanitized.replace(
          /src="__DATA_IMAGE_(\d+)__"/g,
          (_, idx) => `src="${dataUrls[parseInt(idx)].src}"`
        )
      }

      return sanitized
    } catch (error) {
      logger.error('Error rendering message:', error)
      return props.message.content
    }
  }
  return props.message.content
})
</script>

<template>
  <div class="w-full flex" :class="isUser ? 'justify-end' : 'justify-start'">
    <!-- AI Assistant Message -->
    <div
      v-if="!isUser"
      class="max-w-[88%] flex flex-col gap-1.5 animate-fade-in"
      role="article"
      :aria-label="`AI Assistant message${formattedTime ? ' from ' + formattedTime : ''}`"
    >
      <div class="flex items-center gap-2 px-1">
        <div class="w-7 h-7 bg-light-green rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true" v-once>
          <svg class="w-4 h-4 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        </div>
        <p class="text-xs font-semibold text-forest-green" v-once>
          {{ t('chat.assistant') }}
        </p>
        <p v-if="formattedTime" class="text-xs text-text-tertiary">
          <time :datetime="formattedDatetime">
            {{ formattedTime }}
          </time>
        </p>
      </div>
      <div class="bg-bg-surface rounded-2xl rounded-tl-sm shadow-soft p-5 border border-border-subtle">
        <div
          ref="contentEl"
          class="markdown-content text-base text-text-primary"
          v-html="renderedContent"
        />
        <div class="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
          <p v-if="message.model" class="text-xs text-text-tertiary">
            <span class="font-medium text-text-secondary">{{ t('chat.model') }}:</span> {{ message.model }}
          </p>
          <p v-else class="text-xs text-text-tertiary" />
          <button
            @click="copyToClipboard"
            class="flex items-center gap-1 text-xs text-text-tertiary hover:text-forest-green transition-colors duration-150 ml-auto"
            :aria-label="t('chat.copy')"
          >
            <svg v-if="!copied" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <svg v-else class="w-3.5 h-3.5 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>{{ copied ? t('chat.copied') : t('chat.copy') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- User Message -->
    <div
      v-else
      class="max-w-[88%] flex flex-col gap-1.5 animate-fade-in"
      role="article"
      :aria-label="`Your message${formattedTime ? ' from ' + formattedTime : ''}`"
    >
      <div class="flex items-center gap-2 px-1 justify-end">
        <p v-if="formattedTime" class="text-xs text-text-tertiary">
          <time :datetime="formattedDatetime">
            {{ formattedTime }}
          </time>
        </p>
        <p class="text-xs font-semibold text-forest-green" v-once>
          {{ t('chat.you') }}
        </p>
        <div class="w-7 h-7 bg-forest-green rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true" v-once>
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        </div>
      </div>
      <div class="bg-forest-green rounded-2xl rounded-tr-sm shadow-soft p-5">
        <p class="text-base text-white leading-relaxed whitespace-pre-wrap break-words">
          {{ message.content }}
        </p>
      </div>
    </div>
  </div>
</template>
