<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ChatMessage from '../components/ChatMessage.vue'
import MessageInput from '../components/MessageInput.vue'
import EmptyState from '../components/EmptyState.vue'
import TypingIndicator from '../components/TypingIndicator.vue'
import ConversationSidebar from '../components/ConversationSidebar.vue'
import { useChat } from '../composables/useChat.js'
import { useStorage } from '../composables/useStorage.js'
import { useApi } from '../composables/useApi.js'
import { useWebTools } from '../composables/useWebTools.js'
import { logger, sanitizeConfig } from '../utils/logger.js'

const emit = defineEmits(['navigate'])
const { t } = useI18n()

const { messages, hasMessages, currentConversationId, addUserMessage, addAssistantMessage, removeLastMessage, scrollToBottom, setConversationTitle } = useChat()

const isSidebarOpen = ref(false)
const { config } = useStorage()
const { sendChatMessage, continueWithToolResults, generateImage, cancelRequest } = useApi()
const { searchWeb, fetchWebContent } = useWebTools()
const messagesContainer = ref(null)
const isTyping = ref(false)
const toolStatus = ref('')
const errorMessage = ref('')
let errorTimer = null

const handleCancelRequest = () => {
  cancelRequest()
  isTyping.value = false
  toolStatus.value = ''
}

const showError = (message) => {
  clearTimeout(errorTimer)
  errorMessage.value = message
  errorTimer = setTimeout(() => {
    errorMessage.value = ''
  }, 5000)
}

/**
 * Build image markdown string from a list of generated image objects.
 */
const buildImageMarkdown = (images, prompt) =>
  images.map(img =>
    `![${prompt}](${img.url})\n\n*${t('chat.image.generatedCaption', { prompt })}*`
  ).join('\n\n')

/**
 * Shared error handler for slash-command catch blocks.
 * On AbortError: removes the pending user message.
 * Otherwise: shows error as assistant message + toast.
 */
const handleCommandError = async (err, errorKey, model = config.value.model) => {
  isTyping.value = false
  if (err.name === 'AbortError') {
    await removeLastMessage()
  } else {
    const errorMsg = t(errorKey, { message: err.message })
    addAssistantMessage(errorMsg, model)
    showError(errorMsg)
  }
}

let resizeTimer = null
const handleResize = () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    scrollToBottom(messagesContainer)
  }, 100)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)
  scrollToBottom(messagesContainer)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleResize)
  clearTimeout(resizeTimer)
  clearTimeout(errorTimer)
})


/**
 * Execute the LLM + tool loop.
 * Calls sendChatMessage with tools enabled, then if the LLM requests tool calls,
 * executes them and feeds results back until a plain text response is received.
 */
const runToolLoop = async (apiMessages) => {
  const MAX_TOOL_ROUNDS = 5
  let lastSentMessages = null
  let lastRawData = null
  let lastResults = null

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let result
    if (round === 0) {
      result = await sendChatMessage(apiMessages, config.value)
    } else {
      result = await continueWithToolResults(lastSentMessages, config.value, lastRawData, lastResults)
    }

    if (!result.toolCalls) {
      isTyping.value = false
      toolStatus.value = ''
      addAssistantMessage(result.text, config.value.model)
      return
    }

    // Execute each tool call
    lastSentMessages = result.sentMessages
    lastRawData = result.rawData
    lastResults = []

    for (const call of result.toolCalls) {
      logger.log('[runToolLoop] Executing tool:', call.name, call.args)
      let toolResult = ''

      try {
        if (call.name === 'web_search') {
          toolStatus.value = t('chat.tools.searching', { query: call.args.query })
          toolResult = await searchWeb(call.args.query, config.value)
          toolStatus.value = ''
        } else if (call.name === 'fetch_url') {
          toolStatus.value = t('chat.tools.fetching', { url: call.args.url })
          toolResult = await fetchWebContent(call.args.url)
          toolStatus.value = ''
        } else if (call.name === 'generate_image') {
          toolStatus.value = t('chat.tools.generatingImage')
          const images = await generateImage(call.args.prompt, config.value)
          toolStatus.value = ''
          if (images && images.length > 0) {
            // Show image immediately in chat
            isTyping.value = false
            addAssistantMessage(buildImageMarkdown(images, call.args.prompt), config.value.imageModel)
            isTyping.value = true
            toolResult = 'Image generated and displayed to the user.'
          } else {
            toolResult = t('chat.image.noImagesReturned')
          }
        }
      } catch (err) {
        toolStatus.value = ''
        toolResult = `Tool error: ${err.message}`
      }

      lastResults.push({ id: call.id, name: call.name, result: toolResult })
    }

    // Safety cap — stop after max rounds without a text response
    if (round === MAX_TOOL_ROUNDS - 1) {
      isTyping.value = false
      toolStatus.value = ''
      break
    }
  }
}

const handleSendMessage = async (content) => {
  logger.log('[handleSendMessage] Starting with content:', content)

  // Auto-title the conversation from the first user message (check before adding)
  const isFirstMessage = !messages.value.some(m => m.role === 'user')

  addUserMessage(content)

  if (isFirstMessage) {
    setConversationTitle(currentConversationId.value, content.trim().slice(0, 40))
  }

  scrollToBottom(messagesContainer)

  try {
    // Check for slash commands
    const imageCommandMatch = content.match(/^\/img\s+(.+)/i)
    const searchCommandMatch = content.match(/^\/search\s+(.+)/i)
    const fetchCommandMatch = content.match(/^\/fetch\s+(.+)/i)

    if (searchCommandMatch) {
      // Handle web search
      const query = searchCommandMatch[1]
      isTyping.value = true

      try {
        const searchResults = await searchWeb(query, config.value)
        isTyping.value = false
        addAssistantMessage(searchResults, config.value.model)
      } catch (err) {
        await handleCommandError(err, 'chat.errors.searchFailed')
      }
    } else if (fetchCommandMatch) {
      // Handle web fetch
      const url = fetchCommandMatch[1].trim()
      isTyping.value = true

      try {
        const webContent = await fetchWebContent(url)
        isTyping.value = false
        addAssistantMessage(webContent, config.value.model)
      } catch (err) {
        await handleCommandError(err, 'chat.errors.fetchFailed')
      }
    } else if (imageCommandMatch) {
      // Handle image generation
      const prompt = imageCommandMatch[1]
      isTyping.value = true

      try {
        const images = await generateImage(prompt, config.value)
        isTyping.value = false

        if (images && images.length > 0) {
          addAssistantMessage(buildImageMarkdown(images, prompt), config.value.imageModel)
        } else {
          addAssistantMessage(t('chat.image.noImagesReturned'), config.value.imageModel)
        }
      } catch (err) {
        await handleCommandError(err, 'chat.errors.imageFailed', config.value.imageModel)
      }
    } else {
      // Prepare messages for API
      const allMessages = messages.value.slice(0, -1)
      const historyLimit = config.value.maxHistoryMessages || 0
      const recentMessages = historyLimit > 0 ? allMessages.slice(-historyLimit) : allMessages

      const apiMessages = recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      apiMessages.push({ role: 'user', content })

      logger.log('[handleSendMessage] Prepared API messages:', apiMessages.length, 'messages')
      logger.log('[handleSendMessage] Config:', sanitizeConfig(config.value))

      isTyping.value = true
      scrollToBottom(messagesContainer)

      // Tool-execution loop: available tools are determined inside useApi based on config
      await runToolLoop(apiMessages)
    }
  } catch (err) {
    logger.error('[handleSendMessage] Error occurred:', err)
    logger.error('[handleSendMessage] Error name:', err.name)
    logger.error('[handleSendMessage] Error message:', err.message)
    logger.error('[handleSendMessage] Stack:', err.stack)
    handleCancelRequest()
    // Don't show error if request was cancelled by user
    if (err.name !== 'AbortError') {
      const errorMsg = t('chat.errors.sendFailed', { message: err.message || t('chat.errors.defaultError') })
      addAssistantMessage(errorMsg)
      showError(errorMsg)
    } else {
      logger.log('[handleSendMessage] Request was aborted by user')
      // Remove user message on cancellation
      await removeLastMessage()
    }
  }
}

// Track message count to avoid deep-watching large message objects
const messageCount = computed(() => messages.value.length)

watch([messageCount, isTyping], () => {
  scrollToBottom(messagesContainer)
}, { flush: 'post' })
</script>

<template>
  <div class="w-full flex flex-col bg-bg-primary" style="height: calc(var(--vh, 1vh) * 100)">
    <!-- Conversation Sidebar -->
    <ConversationSidebar :isOpen="isSidebarOpen" @close="isSidebarOpen = false" />

    <!-- Fixed Header -->
    <header role="banner" class="flex-shrink-0 px-6 pt-6 pb-4">
      <div class="flex items-center justify-between w-full">
        <!-- Hamburger button -->
        <button
          @click="isSidebarOpen = true"
          aria-label="Open conversations"
          class="w-11 h-11 bg-bg-surface rounded-full shadow-elevated flex items-center justify-center hover:bg-bg-elevated transition-colors"
        >
          <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <h1 class="text-2xl font-semibold text-text-primary -tracking-tight">
          {{ t('chat.title') }}
        </h1>

        <!-- Settings button -->
        <button
          @click="emit('navigate', 'settings')"
          aria-label="Open settings"
          class="w-11 h-11 bg-bg-surface rounded-full shadow-elevated flex items-center justify-center hover:bg-bg-elevated transition-colors"
        >
          <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Scrollable Messages Container -->
    <main
      id="main-content"
      role="main"
      ref="messagesContainer"
      tabindex="-1"
      class="flex-1 overflow-y-auto px-6 min-h-0 focus:outline-none"
      aria-label="Chat messages"
    >
      <div role="log" aria-live="polite" aria-atomic="false" class="flex flex-col gap-5 pb-6 pt-2">
        <!-- Empty State -->
        <EmptyState v-if="!hasMessages && !isTyping" />

        <!-- Messages List -->
        <ChatMessage
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />

        <!-- Typing Indicator with Cancel Button -->
        <div v-if="isTyping" class="flex flex-col gap-1">
          <TypingIndicator />
          <p v-if="toolStatus" class="text-xs text-text-tertiary px-1">{{ toolStatus }}</p>
          <div class="flex justify-start px-1">
            <button
              @click="handleCancelRequest"
              class="flex items-center gap-1.5 px-2 py-1 text-xs text-text-tertiary hover:text-warm-red transition-colors"
              aria-label="Stop generating"
              style="-webkit-appearance: none; appearance: none;"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
              {{ t('chat.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Fixed Message Input at Bottom -->
    <div class="flex-shrink-0">
      <MessageInput @send="handleSendMessage" />
    </div>

    <!-- ARIA live region for error announcements -->
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      class="sr-only"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>
