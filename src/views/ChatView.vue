<script setup>
import { ref, watch } from 'vue'
import ChatMessage from '../components/ChatMessage.vue'
import MessageInput from '../components/MessageInput.vue'
import EmptyState from '../components/EmptyState.vue'
import TypingIndicator from '../components/TypingIndicator.vue'
import { useChat } from '../composables/useChat.js'
import { useStorage } from '../composables/useStorage.js'
import { useApi } from '../composables/useApi.js'
import { useWebTools } from '../composables/useWebTools.js'

const emit = defineEmits(['navigate'])

const { messages, hasMessages, addUserMessage, addAssistantMessage, updateLastAssistantMessage, scrollToBottom } = useChat()
const { config } = useStorage()
const { sendChatMessage, generateImage, isLoading, error } = useApi()
const { searchWeb, fetchWebContent } = useWebTools()
const messagesContainer = ref(null)
const isTyping = ref(false)
const fetchingStatus = ref('')


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
      scrollToBottom(messagesContainer)

      try {
        const searchResults = await searchWeb(query, config.value)
        isTyping.value = false

        // Add search results as assistant message
        addAssistantMessage(searchResults, config.value.model)
        scrollToBottom(messagesContainer)
      } catch (err) {
        isTyping.value = false
        addAssistantMessage(`Error searching: ${err.message}`, config.value.model)
        scrollToBottom(messagesContainer)
      }
    } else if (fetchCommandMatch) {
      // Handle web fetch
      const url = fetchCommandMatch[1].trim()
      isTyping.value = true
      scrollToBottom(messagesContainer)

      try {
        const webContent = await fetchWebContent(url)
        isTyping.value = false

        // Add fetched content as assistant message
        addAssistantMessage(webContent, config.value.model)
        scrollToBottom(messagesContainer)
      } catch (err) {
        isTyping.value = false
        addAssistantMessage(`Error fetching: ${err.message}`, config.value.model)
        scrollToBottom(messagesContainer)
      }
    } else if (imageCommandMatch) {
      // Handle image generation
      const prompt = imageCommandMatch[1]
      isTyping.value = true
      scrollToBottom(messagesContainer)

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
      scrollToBottom(messagesContainer)
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
          // Fetch content from all URLs
          const fetchPromises = urls.map(url => fetchWebContent(url.trim()))
          const fetchedContents = await Promise.all(fetchPromises)

          // Enhance the user message with fetched content
          enhancedContent = content + '\n\n' + fetchedContents.join('\n\n---\n\n')

          fetchingStatus.value = ''
          isTyping.value = false
        } catch (err) {
          console.error('Error fetching URLs:', err)
          fetchingStatus.value = ''
          // Continue with original message if fetch fails
          isTyping.value = false
        }
      }

      // Prepare messages for API (convert to OpenAI/Anthropic format)
      const apiMessages = messages.value.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Add the current message with enhanced content (if URLs were fetched)
      apiMessages.push({
        role: 'user',
        content: enhancedContent
      })

      if (config.value.enableStreaming) {
        // Handle streaming response
        let streamedContent = ''
        isTyping.value = true
        scrollToBottom(messagesContainer)

        await sendChatMessage(apiMessages, config.value, (chunk) => {
          if (isTyping.value) {
            isTyping.value = false
            addAssistantMessage('', config.value.model)
          }
          streamedContent += chunk
          updateLastAssistantMessage(streamedContent)
          scrollToBottom(messagesContainer)
        })

        if (isTyping.value) {
          isTyping.value = false
        }
      } else {
        // Handle standard response
        isTyping.value = true
        scrollToBottom(messagesContainer)

        const response = await sendChatMessage(apiMessages, config.value)

        isTyping.value = false
        addAssistantMessage(response, config.value.model)
        scrollToBottom(messagesContainer)
      }
    }
  } catch (err) {
    console.error('Failed to send message:', err)
    isTyping.value = false
    addAssistantMessage(`Error: ${err.message || 'Failed to get response from AI'}`)
    scrollToBottom(messagesContainer)
  }
}

// Watch for new messages and auto-scroll
watch(messages, () => {
  scrollToBottom(messagesContainer)
}, { deep: true })

// Watch for typing indicator changes and auto-scroll
watch(isTyping, () => {
  scrollToBottom(messagesContainer)
})
</script>

<template>
  <div class="h-screen w-full flex flex-col bg-bg-primary">
    <!-- Fixed Header -->
    <div class="flex-shrink-0 px-6 pt-6 pb-4">
      <div class="flex items-center justify-between w-full">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-semibold text-text-primary -tracking-tight">
            AI Chat
          </h1>
        </div>
        <button
          @click="handleSettings"
          class="w-11 h-11 bg-bg-surface rounded-full shadow-elevated flex items-center justify-center hover:bg-bg-elevated transition-colors"
        >
          <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Scrollable Messages Container -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto px-6 min-h-0"
    >
      <div class="flex flex-col gap-4 pb-4">
        <!-- Empty State -->
        <EmptyState v-if="!hasMessages && !isTyping" />

        <!-- Messages List -->
        <ChatMessage
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />

        <!-- Fetching Status -->
        <div v-if="fetchingStatus" class="flex items-center gap-2 px-4 py-3 bg-light-green/30 rounded-2xl w-fit">
          <div class="flex gap-1">
            <div class="w-2 h-2 bg-forest-green rounded-full typing-dot"></div>
            <div class="w-2 h-2 bg-forest-green rounded-full typing-dot"></div>
            <div class="w-2 h-2 bg-forest-green rounded-full typing-dot"></div>
          </div>
          <p class="text-sm text-forest-green">{{ fetchingStatus }}</p>
        </div>

        <!-- Typing Indicator -->
        <TypingIndicator v-if="isTyping && !fetchingStatus" :model="config.model || 'AI Assistant'" />
      </div>
    </div>

    <!-- Fixed Message Input at Bottom -->
    <div class="flex-shrink-0">
      <MessageInput @send="handleSendMessage" />
    </div>
  </div>
</template>
