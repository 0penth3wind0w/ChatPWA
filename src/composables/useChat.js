import { shallowRef, computed, nextTick } from 'vue'
import Dexie from 'dexie'
import { logger } from '../utils/logger.js'

// Initialize Dexie database
const db = new Dexie('ChatPWA')
db.version(1).stores({
  messages: 'id, timestamp, role, content, model'
})

// Fallback storage key for localStorage
const FALLBACK_STORAGE_KEY = 'chatpwa_messages_fallback'

// Max messages loaded into memory at startup to avoid loading unbounded history
const MAX_LOADED_MESSAGES = 200

// Track if IndexedDB is available
let useIndexedDB = true

// Shared state (singleton)
// shallowRef: Vue only tracks array reference changes, not deep message property mutations
const messages = shallowRef([])

// Module-level singleton computed — created once, shared across all useChat() calls
const hasMessages = computed(() => messages.value.length > 0)

// Track pending database operations to avoid race conditions
let pendingDbOperations = Promise.resolve()

// Load messages from IndexedDB or localStorage fallback
const initMessages = async () => {
  try {
    const total = await db.messages.count()
    const storedMessages = await db.messages
      .orderBy('timestamp')
      .offset(Math.max(0, total - MAX_LOADED_MESSAGES))
      .toArray()
    messages.value = storedMessages
  } catch (error) {
    logger.error('Failed to load messages from IndexedDB, falling back to localStorage:', error)
    useIndexedDB = false

    // Try loading from localStorage fallback
    try {
      const fallbackData = localStorage.getItem(FALLBACK_STORAGE_KEY)
      if (fallbackData) {
        messages.value = JSON.parse(fallbackData)
      }
    } catch (fallbackError) {
      logger.error('Failed to load from localStorage fallback:', fallbackError)
    }
  }
}

// Initialize messages immediately
initMessages()

// Helper to save a single message to IndexedDB or localStorage
const saveMessageToDb = async (message) => {
  // Queue the operation to prevent race conditions
  pendingDbOperations = pendingDbOperations.then(async () => {
    const plainMessage = {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      model: message.model
    }

    if (useIndexedDB) {
      try {
        await db.messages.put(plainMessage)
      } catch (error) {
        logger.error('Failed to save message to IndexedDB, falling back to localStorage:', error)
        useIndexedDB = false
        // Fall through to localStorage save
      }
    }

    // Use localStorage fallback if IndexedDB failed
    if (!useIndexedDB) {
      try {
        localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(messages.value))
      } catch (fallbackError) {
        logger.error('Failed to save to localStorage fallback:', fallbackError)
      }
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
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11), // More unique ID
      role, // 'user' or 'assistant'
      content,
      timestamp: Date.now(),
      model // Model name for assistant messages
    }
    messages.value = [...messages.value, message]
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
   * Remove the last message (for cancellation scenarios)
   */
  const removeLastMessage = async () => {
    if (messages.value.length === 0) return

    const lastMessage = messages.value[messages.value.length - 1]
    messages.value = messages.value.slice(0, -1)

    // Remove from database
    pendingDbOperations = pendingDbOperations.then(async () => {
      if (useIndexedDB) {
        try {
          await db.messages.delete(lastMessage.id)
        } catch (error) {
          logger.error('Failed to delete message from IndexedDB:', error)
          useIndexedDB = false
        }
      }

      // Update localStorage fallback
      if (!useIndexedDB) {
        try {
          localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(messages.value))
        } catch (fallbackError) {
          logger.error('Failed to update localStorage fallback:', fallbackError)
        }
      }
    })
    return pendingDbOperations
  }

  /**
   * Clear all messages
   */
  const clearMessages = async () => {
    messages.value = []

    // Queue clear after any pending saves/deletes to avoid race conditions
    pendingDbOperations = pendingDbOperations.then(async () => {
      if (useIndexedDB) {
        try {
          await db.messages.clear()
        } catch (error) {
          logger.error('Failed to clear messages from IndexedDB:', error)
          useIndexedDB = false
        }
      }

      // Clear localStorage fallback as well
      try {
        localStorage.removeItem(FALLBACK_STORAGE_KEY)
      } catch (error) {
        logger.error('Failed to clear localStorage fallback:', error)
      }
    })
    return pendingDbOperations
  }

  /**
   * Scroll to bottom of messages
   * Call this after adding messages to ensure they're visible
   */
  const scrollToBottom = async (containerRef) => {
    await nextTick()
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
    hasMessages,
    addUserMessage,
    addAssistantMessage,
    removeLastMessage,
    clearMessages,
    scrollToBottom
  }
}
