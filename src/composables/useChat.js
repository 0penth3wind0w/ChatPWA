import { ref, computed, nextTick, watch } from 'vue'
import Dexie from 'dexie'

// Initialize Dexie database
const db = new Dexie('ChatPWA')
db.version(1).stores({
  messages: '++id, timestamp, role, content'
})

// Shared state (singleton)
const messages = ref([])
const isLoading = ref(false)

// Load messages from IndexedDB on module initialization
const initMessages = async () => {
  try {
    const storedMessages = await db.messages.orderBy('timestamp').toArray()
    messages.value = storedMessages
  } catch (error) {
    console.error('Failed to load messages from IndexedDB:', error)
  }
}

// Initialize messages immediately
initMessages()

// Watch messages and save to IndexedDB
watch(messages, async (newMessages) => {
  try {
    // Clear and re-add all messages (simple approach)
    await db.messages.clear()
    if (newMessages.length > 0) {
      await db.messages.bulkAdd(newMessages)
    }
  } catch (error) {
    console.error('Failed to save messages to IndexedDB:', error)
  }
}, { deep: true })

export function useChat() {
  /**
   * Add a message to the chat
   */
  const addMessage = (role, content) => {
    const message = {
      id: Date.now().toString(),
      role, // 'user' or 'assistant'
      content,
      timestamp: Date.now()
    }
    messages.value.push(message)
    return message
  }

  /**
   * Add user message
   */
  const addUserMessage = (content) => {
    return addMessage('user', content)
  }

  /**
   * Add assistant message
   */
  const addAssistantMessage = (content) => {
    return addMessage('assistant', content)
  }

  /**
   * Update the last assistant message (for streaming)
   */
  const updateLastAssistantMessage = (content) => {
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage && lastMessage.role === 'assistant') {
      lastMessage.content = content
    }
  }

  /**
   * Clear all messages
   */
  const clearMessages = async () => {
    messages.value = []
    try {
      await db.messages.clear()
    } catch (error) {
      console.error('Failed to clear messages from IndexedDB:', error)
    }
  }

  /**
   * Get messages as conversation history for API
   */
  const getConversationHistory = () => {
    return messages.value.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  }

  /**
   * Check if there are any messages
   */
  const hasMessages = computed(() => messages.value.length > 0)

  /**
   * Scroll to bottom of messages
   * Call this after adding messages to ensure they're visible
   */
  const scrollToBottom = async (containerRef) => {
    await nextTick()
    if (containerRef && containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  }

  return {
    messages,
    isLoading,
    hasMessages,
    addMessage,
    addUserMessage,
    addAssistantMessage,
    updateLastAssistantMessage,
    clearMessages,
    getConversationHistory,
    scrollToBottom
  }
}
