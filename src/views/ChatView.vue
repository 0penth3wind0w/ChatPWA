<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import ChatMessage from '../components/ChatMessage.vue'
import MessageInput from '../components/MessageInput.vue'
import EmptyState from '../components/EmptyState.vue'
import TypingIndicator from '../components/TypingIndicator.vue'
import { useChat } from '../composables/useChat.js'
import { useStorage } from '../composables/useStorage.js'
import { useApi } from '../composables/useApi.js'
import { useWebTools } from '../composables/useWebTools.js'
import { logger } from '../utils/logger.js'

const emit = defineEmits(['navigate'])

const { messages, hasMessages, addUserMessage, addAssistantMessage, scrollToBottom } = useChat()
const { config } = useStorage()
const { sendChatMessage, generateImage, cancelRequest } = useApi()
const { searchWeb, fetchWebContent } = useWebTools()
const messagesContainer = ref(null)
const isTyping = ref(false)
const fetchingStatus = ref('')
const errorMessage = ref('')

const handleCancelRequest = () => {
  cancelRequest()
  isTyping.value = false
  fetchingStatus.value = ''
}

const showError = (message) => {
  errorMessage.value = message
  // Clear error after 5 seconds
  setTimeout(() => {
    errorMessage.value = ''
  }, 5000)
}

// Handle scroll to bottom on resize/orientation change
const handleResize = () => {
  // Scroll to bottom after resize/rotation to maintain chat context
  setTimeout(() => {
    scrollToBottom(messagesContainer)
  }, 100)
}

onMounted(() => {
  // Listen for resize events (includes orientation change)
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)

  // Initial scroll to bottom on mount
  scrollToBottom(messagesContainer)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleResize)
})


const handleSettings = () => {
  emit('navigate', 'settings')
}

const handleSendMessage = async (content) => {
  // Add user message
  addUserMessage(content)

  // Scroll to bottom after user message
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

        // Add search results as assistant message (watcher handles scroll)
        addAssistantMessage(searchResults, config.value.model)
      } catch (err) {
        isTyping.value = false
        const errorMsg = `Error searching: ${err.message}`
        addAssistantMessage(errorMsg, config.value.model)
        showError(errorMsg)
      }
    } else if (fetchCommandMatch) {
      // Handle web fetch
      const url = fetchCommandMatch[1].trim()
      isTyping.value = true

      try {
        const webContent = await fetchWebContent(url)
        isTyping.value = false

        // Add fetched content as assistant message (watcher handles scroll)
        addAssistantMessage(webContent, config.value.model)
      } catch (err) {
        isTyping.value = false
        const errorMsg = `Error fetching: ${err.message}`
        addAssistantMessage(errorMsg, config.value.model)
        showError(errorMsg)
      }
    } else if (imageCommandMatch) {
      // Handle image generation
      const prompt = imageCommandMatch[1]
      isTyping.value = true

      const images = await generateImage(prompt, config.value)

      isTyping.value = false

      if (images && images.length > 0) {
        // Create markdown with image
        const imageMarkdown = images.map(img =>
          `![${prompt}](${img.url})\n\n*Generated image: ${prompt}*`
        ).join('\n\n')

        addAssistantMessage(imageMarkdown, config.value.imageModel)
      } else {
        addAssistantMessage('Failed to generate image. No images returned.', config.value.imageModel)
      }
    } else {
      // Handle regular chat message
      // Detect URLs in the message and fetch their content
      const urlRegex = /(https?:\/\/[^\s]+)/gi
      const urls = content.match(urlRegex)

      let enhancedContent = content

      // If URLs are detected, fetch their content
      if (urls && urls.length > 0) {
        isTyping.value = true
        fetchingStatus.value = `Fetching content from ${urls.length} URL${urls.length > 1 ? 's' : ''}...`
        scrollToBottom(messagesContainer)

        try {
          // Fetch content from all URLs (use allSettled to handle partial failures)
          const fetchPromises = urls.map(url => fetchWebContent(url.trim()))
          const results = await Promise.allSettled(fetchPromises)

          // Extract successful fetches, log failures
          const fetchedContents = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value)

          const failedCount = results.filter(r => r.status === 'rejected').length
          if (failedCount > 0) {
            logger.warn(`Failed to fetch ${failedCount} of ${urls.length} URLs`)
          }

          // Enhance the user message with successfully fetched content
          if (fetchedContents.length > 0) {
            enhancedContent = content + '\n\n' + fetchedContents.join('\n\n---\n\n')
          }

          fetchingStatus.value = ''
          isTyping.value = false
        } catch (err) {
          logger.error('Error fetching URLs:', err)
          fetchingStatus.value = ''
          // Continue with original message if fetch fails
          isTyping.value = false
        }
      }

      // Prepare messages for API (convert to OpenAI/Anthropic format)
      // Limit history based on config to reduce token usage
      const allMessages = messages.value.slice(0, -1)
      const historyLimit = config.value.maxHistoryMessages || 0
      const recentMessages = historyLimit > 0 ? allMessages.slice(-historyLimit) : allMessages

      const apiMessages = recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Add the current message with enhanced content (if URLs were fetched)
      apiMessages.push({
        role: 'user',
        content: enhancedContent
      })

      // Send message and get response
      isTyping.value = true
      scrollToBottom(messagesContainer)

      const response = await sendChatMessage(apiMessages, config.value)

      isTyping.value = false
      addAssistantMessage(response, config.value.model)
    }
  } catch (err) {
    logger.error('Failed to send message:', err)
    isTyping.value = false
    const errorMsg = `Error: ${err.message || 'Failed to get response from AI'}`
    addAssistantMessage(errorMsg)
    showError(errorMsg)
  }
}

// Watch for new messages and typing indicator changes, auto-scroll
// Consolidate watchers and use flush: 'post' to batch DOM updates
watch([messages, isTyping], () => {
  scrollToBottom(messagesContainer)
}, { deep: true, flush: 'post' })
</script>

<template>
  <div class="w-full flex flex-col bg-bg-primary" style="height: calc(var(--vh, 1vh) * 100)">
    <!-- Fixed Header -->
    <header role="banner" class="flex-shrink-0 px-6 pt-6 pb-4">
      <div class="flex items-center justify-between w-full">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-semibold text-text-primary -tracking-tight">
            AI Chat
          </h1>
        </div>
        <button
          @click="handleSettings"
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

        <!-- Fetching Status -->
        <div v-if="fetchingStatus" class="flex items-center gap-2 px-4 py-3 bg-light-green/30 rounded-2xl w-fit" role="status" aria-live="polite">
          <div class="flex gap-1" aria-hidden="true">
            <div class="w-2 h-2 bg-forest-green rounded-full typing-dot"></div>
            <div class="w-2 h-2 bg-forest-green rounded-full typing-dot"></div>
            <div class="w-2 h-2 bg-forest-green rounded-full typing-dot"></div>
          </div>
          <p class="text-sm text-forest-green">{{ fetchingStatus }}</p>
        </div>

        <!-- Typing Indicator with Cancel Button -->
        <div v-if="isTyping && !fetchingStatus" class="flex items-center gap-3">
          <TypingIndicator />
          <button
            @click="handleCancelRequest"
            class="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary bg-bg-surface rounded-lg border border-border-subtle hover:border-border-strong transition-colors"
            aria-label="Cancel request"
          >
            Cancel
          </button>
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
