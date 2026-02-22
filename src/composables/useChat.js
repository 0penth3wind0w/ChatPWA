import { ref, computed, nextTick } from 'vue'
import Dexie from 'dexie'
import { logger } from '../utils/logger.js'

// Initialize Dexie database
const db = new Dexie('ChatPWA')
db.version(1).stores({
  messages: 'id, timestamp, role, content, model'
})

// Shared state (singleton)
const messages = ref([])
const isLoading = ref(false)

// Track pending database operations to avoid race conditions
let pendingDbOperations = Promise.resolve()

// Load messages from IndexedDB on module initialization
const initMessages = async () => {
  try {
    const storedMessages = await db.messages.orderBy('timestamp').toArray()
    messages.value = storedMessages
  } catch (error) {
    logger.error('Failed to load messages from IndexedDB:', error)
  }
}

// Initialize messages immediately
initMessages()

// Helper to save a single message to IndexedDB
const saveMessageToDb = async (message) => {
  // Queue the operation to prevent race conditions
  pendingDbOperations = pendingDbOperations.then(async () => {
    try {
      const plainMessage = {
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        model: message.model
      }
      await db.messages.put(plainMessage)
    } catch (error) {
      logger.error('Failed to save message to IndexedDB:', error)
    }
  })
  return pendingDbOperations
}

// Helper to update an existing message in IndexedDB
const updateMessageInDb = async (messageId, updates) => {
  // Queue the operation to prevent race conditions
  pendingDbOperations = pendingDbOperations.then(async () => {
    try {
      await db.messages.update(messageId, updates)
    } catch (error) {
      logger.error('Failed to update message in IndexedDB:', error)
    }
  })
  return pendingDbOperations
}

export function useChat() {
  /**
   * Add a message to the chat
   */
  const addMessage = (role, content, model = null) => {
    const message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // More unique ID
      role, // 'user' or 'assistant'
      content,
      timestamp: Date.now(),
      model // Model name for assistant messages
    }
    messages.value.push(message)
    // Save to IndexedDB incrementally
    saveMessageToDb(message)
    return message
  }

  /**
   * Add user message
   */
  const addUserMessage = (content) => {
    return addMessage('user', content, null)
  }

  /**
   * Add assistant message
   */
  const addAssistantMessage = (content, model = null) => {
    return addMessage('assistant', content, model)
  }

  /**
   * Clear all messages
   */
  const clearMessages = async () => {
    messages.value = []
    try {
      await db.messages.clear()
    } catch (error) {
      logger.error('Failed to clear messages from IndexedDB:', error)
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
    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      if (containerRef && containerRef.value) {
        containerRef.value.scrollTo({
          top: containerRef.value.scrollHeight,
          behavior: 'smooth'
        })
      }
    })
  }

  return {
    messages,
    isLoading,
    hasMessages,
    addMessage,
    addUserMessage,
    addAssistantMessage,
    clearMessages,
    getConversationHistory,
    scrollToBottom
  }
}
