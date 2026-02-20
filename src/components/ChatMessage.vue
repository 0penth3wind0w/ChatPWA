<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

// Configure marked to use highlight.js for code blocks
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        console.error('Highlight error:', err)
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
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// Render and sanitize markdown for assistant messages
const renderedContent = computed(() => {
  if (isAssistant.value) {
    const rawHtml = marked.parse(props.message.content)
    return DOMPurify.sanitize(rawHtml)
  }
  return props.message.content
})
</script>

<template>
  <div class="w-full flex" :class="isUser ? 'justify-end' : 'justify-start'">
    <!-- AI Assistant Message -->
    <div
      v-if="isAssistant"
      class="max-w-[85%] flex flex-col gap-1 animate-fade-in"
    >
      <div class="flex items-center gap-2 px-1">
        <div class="w-6 h-6 bg-light-green rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-3.5 h-3.5 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        </div>
        <p class="text-xs font-semibold text-forest-green">
          AI Assistant
        </p>
        <p v-if="message.timestamp" class="text-xs text-text-tertiary">
          {{ formatTime(message.timestamp) }}
        </p>
      </div>
      <div class="bg-bg-surface rounded-2xl rounded-tl-sm shadow-soft p-4 border border-border-subtle">
        <div
          class="markdown-content text-base text-text-primary"
          v-html="renderedContent"
        />
        <div v-if="message.model" class="mt-3 pt-3 border-t border-border-subtle">
          <p class="text-xs text-text-tertiary">
            <span class="font-medium text-text-secondary">Model:</span> {{ message.model }}
          </p>
        </div>
      </div>
    </div>

    <!-- User Message -->
    <div
      v-else-if="isUser"
      class="max-w-[85%] flex flex-col gap-1 animate-fade-in"
    >
      <div class="flex items-center gap-2 px-1 justify-end">
        <p v-if="message.timestamp" class="text-xs text-text-tertiary">
          {{ formatTime(message.timestamp) }}
        </p>
        <p class="text-xs font-semibold text-forest-green">
          You
        </p>
        <div class="w-6 h-6 bg-forest-green rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        </div>
      </div>
      <div class="bg-forest-green rounded-2xl rounded-tr-sm shadow-soft p-4">
        <p class="text-base text-white leading-relaxed whitespace-pre-wrap">
          {{ message.content }}
        </p>
      </div>
    </div>
  </div>
</template>
