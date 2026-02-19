<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'

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

// Render markdown for assistant messages
const renderedContent = computed(() => {
  if (isAssistant.value) {
    return marked.parse(props.message.content)
  }
  return props.message.content
})
</script>

<template>
  <div class="w-full">
    <!-- AI Assistant Message -->
    <div
      v-if="isAssistant"
      class="w-full p-4 bg-bg-surface rounded-lg shadow-soft"
    >
      <p class="text-xs font-semibold text-forest-green mb-2">
        AI Assistant
      </p>
      <div
        class="markdown-content text-base text-text-primary"
        v-html="renderedContent"
      />
      <p v-if="message.timestamp" class="text-xs text-text-tertiary mt-2">
        {{ formatTime(message.timestamp) }}
      </p>
    </div>

    <!-- User Message -->
    <div
      v-else-if="isUser"
      class="w-full p-4 bg-forest-green rounded-lg shadow-soft"
    >
      <p class="text-xs font-semibold text-white mb-2">
        You
      </p>
      <p class="text-base text-white leading-relaxed whitespace-pre-wrap">
        {{ message.content }}
      </p>
      <p v-if="message.timestamp" class="text-xs text-white/70 mt-2">
        {{ formatTime(message.timestamp) }}
      </p>
    </div>
  </div>
</template>
