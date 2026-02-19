<script setup>
import { ref, computed, watch } from 'vue'

const emit = defineEmits(['send'])

const message = ref('')
const textarea = ref(null)
const showCommandMenu = ref(false)
const selectedCommandIndex = ref(0)

// Available slash commands
const availableCommands = [
  {
    command: '/image',
    alias: '/img',
    description: 'Generate an image from text description',
    example: '/image a sunset over mountains'
  },
  {
    command: '/img',
    alias: null,
    description: 'Short alias for /image',
    example: '/img a cute cat'
  }
]

// Filter commands based on user input
const filteredCommands = computed(() => {
  if (!message.value.startsWith('/')) {
    return []
  }

  const input = message.value.toLowerCase()
  return availableCommands.filter(cmd =>
    cmd.command.toLowerCase().startsWith(input) ||
    (cmd.alias && cmd.alias.toLowerCase().startsWith(input))
  )
})

// Watch message for slash command detection
watch(message, (newValue) => {
  if (newValue.startsWith('/') && newValue.indexOf(' ') === -1) {
    showCommandMenu.value = filteredCommands.value.length > 0
    selectedCommandIndex.value = 0
  } else {
    showCommandMenu.value = false
  }
})

const selectCommand = (command) => {
  message.value = command.command + ' '
  showCommandMenu.value = false
  textarea.value?.focus()
}

const handleSend = () => {
  const trimmed = message.value.trim()
  if (trimmed) {
    emit('send', trimmed)
    message.value = ''
    showCommandMenu.value = false
    // Reset textarea height
    if (textarea.value) {
      textarea.value.style.height = 'auto'
    }
  }
}

const handleKeydown = (event) => {
  // Handle command menu navigation
  if (showCommandMenu.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      selectedCommandIndex.value = Math.min(
        selectedCommandIndex.value + 1,
        filteredCommands.value.length - 1
      )
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      selectedCommandIndex.value = Math.max(selectedCommandIndex.value - 1, 0)
      return
    }
    if (event.key === 'Tab' || (event.key === 'Enter' && filteredCommands.value.length > 0)) {
      event.preventDefault()
      selectCommand(filteredCommands.value[selectedCommandIndex.value])
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      showCommandMenu.value = false
      return
    }
  }

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
  <div class="w-full px-6 pb-5 relative">
    <!-- Command Menu -->
    <div
      v-if="showCommandMenu"
      class="absolute bottom-full left-6 right-6 mb-2 bg-bg-surface rounded-md shadow-elevated border border-border-subtle overflow-hidden"
    >
      <div class="p-2 bg-bg-elevated border-b border-border-subtle">
        <p class="text-xs font-semibold text-text-tertiary">Available Commands</p>
      </div>
      <div class="max-h-64 overflow-y-auto">
        <button
          v-for="(cmd, index) in filteredCommands"
          :key="cmd.command"
          @click="selectCommand(cmd)"
          class="w-full px-4 py-3 text-left hover:bg-bg-elevated transition-colors"
          :class="{ 'bg-bg-elevated': index === selectedCommandIndex }"
        >
          <div class="flex items-start gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <code class="text-sm font-semibold text-forest-green">{{ cmd.command }}</code>
                <span v-if="cmd.alias" class="text-xs text-text-tertiary">or {{ cmd.alias }}</span>
              </div>
              <p class="text-xs text-text-secondary mt-1">{{ cmd.description }}</p>
              <p class="text-xs text-text-tertiary mt-1 font-mono">{{ cmd.example }}</p>
            </div>
          </div>
        </button>
      </div>
      <div class="p-2 bg-bg-elevated border-t border-border-subtle">
        <p class="text-xs text-text-tertiary">
          <kbd class="text-forest-green">↑↓</kbd> navigate •
          <kbd class="text-forest-green">Tab</kbd> or <kbd class="text-forest-green">Enter</kbd> select •
          <kbd class="text-forest-green">Esc</kbd> close
        </p>
      </div>
    </div>

    <!-- Input Area -->
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
