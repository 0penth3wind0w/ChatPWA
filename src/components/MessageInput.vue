<script setup>
import { ref } from 'vue'

const emit = defineEmits(['send'])

const message = ref('')
const textarea = ref(null)

const handleSend = () => {
  const trimmed = message.value.trim()
  if (trimmed) {
    emit('send', trimmed)
    message.value = ''
    // Reset textarea height
    if (textarea.value) {
      textarea.value.style.height = 'auto'
    }
  }
}

const handleKeydown = (event) => {
  // Enter without Shift sends the message
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
  // Shift+Enter adds a new line (default behavior)
}

const handleInput = () => {
  // Auto-resize textarea
  if (textarea.value) {
    textarea.value.style.height = 'auto'
    textarea.value.style.height = textarea.value.scrollHeight + 'px'
  }
}
</script>

<template>
  <div class="w-full px-6 pb-5">
    <div class="flex items-end gap-3 w-full bg-bg-surface rounded-md shadow-soft px-4 py-3">
      <textarea
        ref="textarea"
        v-model="message"
        placeholder="Type your message..."
        rows="1"
        class="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary resize-none max-h-32 overflow-y-auto"
        @keydown="handleKeydown"
        @input="handleInput"
      ></textarea>
      <button
        @click="handleSend"
        :disabled="!message.trim()"
        class="w-9 h-9 bg-forest-green rounded-full flex items-center justify-center flex-shrink-0 hover:bg-dark-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg class="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>
      </button>
    </div>
  </div>
</template>
