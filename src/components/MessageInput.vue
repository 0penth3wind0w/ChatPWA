<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['send'])
const { t } = useI18n()

// Constants
const MAX_MESSAGE_LENGTH = 10000

const message = ref('')
const textarea = ref(null)
const showCommandMenu = ref(false)
const selectedCommandIndex = ref(0)
const validationError = ref('')
let resizeFrame = null // Track RAF for resize

// Computed character count and warning state
const characterCount = computed(() => message.value.length)
const showCharacterWarning = computed(() => characterCount.value > MAX_MESSAGE_LENGTH * 0.9)
const isOverLimit = computed(() => characterCount.value > MAX_MESSAGE_LENGTH)

// Available slash commands
const availableCommands = computed(() => [
  {
    command: '/img',
    alias: null,
    description: t('chat.commands.image.description'),
    example: t('chat.commands.image.example'),
    icon: 'image'
  },
  {
    command: '/search',
    alias: null,
    description: t('chat.commands.search.description'),
    example: t('chat.commands.search.example'),
    icon: 'search'
  },
  {
    command: '/fetch',
    alias: null,
    description: t('chat.commands.fetch.description'),
    example: t('chat.commands.fetch.example'),
    icon: 'globe'
  }
])

// Filter commands based on user input
const filteredCommands = computed(() => {
  if (!message.value.startsWith('/')) {
    return []
  }

  const input = message.value.toLowerCase()

  // Early return for exact slash
  if (input === '/') {
    return availableCommands.value
  }

  // Filter commands
  return availableCommands.value.filter(cmd =>
    cmd.command.toLowerCase().startsWith(input) ||
    (cmd.alias && cmd.alias.toLowerCase().startsWith(input))
  )
})

// Watch message for slash command detection
watch(message, (newValue) => {
  const msgVal = newValue || ''
  if (msgVal.startsWith('/') && msgVal.indexOf(' ') === -1) {
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

  // Validation
  if (!trimmed) {
    return
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    validationError.value = `Message is too long (${trimmed.length}/${MAX_MESSAGE_LENGTH} characters)`
    setTimeout(() => {
      validationError.value = ''
    }, 3000)
    return
  }

  // Clear validation error and send
  validationError.value = ''
  emit('send', trimmed)
  message.value = ''
  showCommandMenu.value = false
  // Reset textarea height
  if (textarea.value) {
    textarea.value.style.height = 'auto'
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
  // Auto-resize textarea with requestAnimationFrame for better performance
  if (resizeFrame) {
    cancelAnimationFrame(resizeFrame)
  }

  resizeFrame = requestAnimationFrame(() => {
    if (textarea.value) {
      textarea.value.style.height = 'auto'
      textarea.value.style.height = textarea.value.scrollHeight + 'px'
    }
    resizeFrame = null
  })
}
</script>

<template>
  <div class="w-full px-6 pb-8 relative">
    <!-- Validation Error -->
    <div
      v-if="validationError"
      role="alert"
      aria-live="assertive"
      class="absolute bottom-full left-6 right-6 mb-2 bg-red-100 border border-red-300 rounded-lg px-4 py-2 text-sm text-red-700 animate-fade-in"
    >
      {{ validationError }}
    </div>
    <!-- Command Menu -->
    <div
      v-if="showCommandMenu"
      id="command-menu"
      role="listbox"
      aria-label="Available slash commands"
      class="absolute bottom-full left-6 right-6 mb-3 bg-bg-surface rounded-2xl shadow-elevated border border-border-subtle overflow-hidden animate-fade-in"
    >
      <div class="px-4 py-3 bg-bg-elevated border-b border-border-subtle">
        <p class="text-xs font-semibold text-text-secondary">Slash Commands</p>
      </div>
      <div class="max-h-64 overflow-y-auto">
        <button
          v-for="(cmd, index) in filteredCommands"
          v-memo="[index === selectedCommandIndex]"
          :key="cmd.command"
          :id="`cmd-${index}`"
          @click="selectCommand(cmd)"
          role="option"
          :aria-selected="index === selectedCommandIndex"
          class="w-full px-4 py-3 text-left hover:bg-light-green/30 transition-all"
          :class="{ 'bg-light-green/30': index === selectedCommandIndex }"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-light-green rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <!-- Image icon -->
              <svg v-if="cmd.icon === 'image'" class="w-4 h-4 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <!-- Search icon -->
              <svg v-else-if="cmd.icon === 'search'" class="w-4 h-4 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <!-- Globe/Fetch icon -->
              <svg v-else-if="cmd.icon === 'globe'" class="w-4 h-4 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
              </svg>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <code class="text-sm font-semibold text-forest-green">{{ cmd.command }}</code>
                <span v-if="cmd.alias" class="text-xs text-text-tertiary">or {{ cmd.alias }}</span>
              </div>
              <p class="text-xs text-text-secondary mt-1">{{ cmd.description }}</p>
              <p class="text-xs text-text-tertiary mt-1.5 font-mono bg-bg-elevated px-2 py-1 rounded inline-block">{{ cmd.example }}</p>
            </div>
          </div>
        </button>
      </div>
      <div class="px-4 py-2.5 bg-bg-elevated border-t border-border-subtle">
        <p class="text-xs text-text-tertiary">
          <kbd class="px-1.5 py-0.5 bg-bg-surface rounded text-forest-green font-medium">↑↓</kbd> navigate •
          <kbd class="px-1.5 py-0.5 bg-bg-surface rounded text-forest-green font-medium">Tab</kbd> select •
          <kbd class="px-1.5 py-0.5 bg-bg-surface rounded text-forest-green font-medium">Esc</kbd> close
        </p>
      </div>
    </div>

    <!-- Input Area -->
    <div class="flex items-center gap-3 w-full bg-bg-surface rounded-2xl shadow-elevated border border-border-subtle px-5 py-3.5">
      <label for="message-input" class="sr-only">Message input</label>
      <textarea
        id="message-input"
        ref="textarea"
        v-model="message"
        placeholder="Type your message..."
        rows="1"
        aria-label="Message input"
        :aria-expanded="showCommandMenu"
        :aria-activedescendant="showCommandMenu ? `cmd-${selectedCommandIndex}` : undefined"
        aria-describedby="input-help"
        role="combobox"
        aria-controls="command-menu"
        aria-autocomplete="list"
        class="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary resize-none max-h-32 overflow-y-auto leading-relaxed focus-visible:!outline-none py-1"
        @keydown="handleKeydown"
        @input="handleInput"
      ></textarea>
      <span id="input-help" class="sr-only">
        Press forward slash to open command menu. Press Enter to send message, Shift+Enter for new line.
      </span>

      <!-- Character Counter (shown when approaching limit) -->
      <div
        v-if="showCharacterWarning"
        class="text-xs px-2 py-1 rounded"
        :class="isOverLimit ? 'text-red-600 font-semibold' : 'text-text-tertiary'"
        aria-live="polite"
      >
        {{ characterCount }}/{{ MAX_MESSAGE_LENGTH }}
      </div>

      <button
        @click="handleSend"
        :disabled="!(message || '').trim() || isOverLimit"
        aria-label="Send message"
        class="w-12 h-12 bg-forest-green rounded-full flex items-center justify-center flex-shrink-0 hover:bg-dark-green hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      </button>
    </div>
  </div>
</template>
