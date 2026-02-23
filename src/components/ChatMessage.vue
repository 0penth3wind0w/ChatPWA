<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import markdown from 'highlight.js/lib/languages/markdown'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import DOMPurify from 'dompurify'
import { logger } from '../utils/logger.js'

const { t, locale } = useI18n()

// Register only commonly used languages
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)

// Configure marked to use highlight.js for code blocks
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        logger.error('Highlight error:', err)
      }
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true
})

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
const isAssistant = computed(() => props.message.role === 'assistant')

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
}

// Render and sanitize markdown for assistant messages
const renderedContent = computed(() => {
  if (isAssistant.value) {
    try {
      const rawHtml = marked.parse(props.message.content)
      // Allow data URLs for images (needed for base64 image display)
      return DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ['img'],
        ADD_ATTR: ['src', 'alt'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
      })
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
      v-if="isAssistant"
      class="max-w-[88%] flex flex-col gap-1.5 animate-fade-in"
      role="article"
      :aria-label="`AI Assistant message${message.timestamp ? ' from ' + formatTime(message.timestamp) : ''}`"
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
        <p v-if="message.timestamp" class="text-xs text-text-tertiary">
          <time :datetime="new Date(message.timestamp).toISOString()">
            {{ formatTime(message.timestamp) }}
          </time>
        </p>
      </div>
      <div class="bg-bg-surface rounded-2xl rounded-tl-sm shadow-soft p-5 border border-border-subtle">
        <div
          class="markdown-content text-base text-text-primary"
          v-html="renderedContent"
        />
        <div v-if="message.model" class="mt-4 pt-3 border-t border-border-subtle">
          <p class="text-xs text-text-tertiary">
            <span class="font-medium text-text-secondary">{{ t('chat.model') }}:</span> {{ message.model }}
          </p>
        </div>
      </div>
    </div>

    <!-- User Message -->
    <div
      v-else-if="isUser"
      class="max-w-[88%] flex flex-col gap-1.5 animate-fade-in"
      role="article"
      :aria-label="`Your message${message.timestamp ? ' from ' + formatTime(message.timestamp) : ''}`"
    >
      <div class="flex items-center gap-2 px-1 justify-end">
        <p v-if="message.timestamp" class="text-xs text-text-tertiary">
          <time :datetime="new Date(message.timestamp).toISOString()">
            {{ formatTime(message.timestamp) }}
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
