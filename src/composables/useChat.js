import { shallowRef, computed, nextTick } from 'vue'
import Dexie from 'dexie'
import { logger } from '../utils/logger.js'

const db = new Dexie('ChatPWA')
db.version(1).stores({
  messages: 'id, timestamp, role, content, model'
})
db.version(2).stores({
  messages: 'id, timestamp, role, content, model, conversationId',
  conversations: '++id, title, createdAt, updatedAt'
}).upgrade(async tx => {
  const now = Date.now()
  const defaultConvId = await tx.table('conversations').add({
    title: '', createdAt: now, updatedAt: now
  })
  await tx.table('messages').toCollection().modify({ conversationId: defaultConvId })
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
const currentConversationId = shallowRef(null)
const conversations = shallowRef([])

// Module-level singleton computed — created once, shared across all useChat() calls
const hasMessages = computed(() => messages.value.length > 0)

// Track pending database operations to avoid race conditions
let pendingDbOperations = Promise.resolve()

// Chain a DB operation and reset the chain once it settles to prevent unbounded growth
const queueDb = (fn) => {
  pendingDbOperations = pendingDbOperations.then(fn).catch(err => {
    logger.error('DB operation failed:', err)
  }).finally(() => {
    pendingDbOperations = Promise.resolve()
  })
  return pendingDbOperations
}

// Load messages for a specific conversation — single DB round-trip, slice in JS
const loadMessagesForConversation = async (convId) => {
  try {
    const stored = await db.messages
      .where('conversationId').equals(convId)
      .sortBy('timestamp')
    return stored.slice(-MAX_LOADED_MESSAGES)
  } catch (error) {
    logger.error('Failed to load messages for conversation from IndexedDB:', error)
    return []
  }
}

// Initialize conversations and messages from IndexedDB
const initConversations = async () => {
  try {
    const allConvs = await db.conversations.orderBy('updatedAt').reverse().toArray()

    if (allConvs.length === 0) {
      // Create initial conversation with empty title (caller sets translated title on first send)
      const now = Date.now()
      const newId = await db.conversations.add({ title: '', createdAt: now, updatedAt: now })
      conversations.value = [{ id: newId, title: '', createdAt: now, updatedAt: now }]
      currentConversationId.value = newId
      messages.value = []
    } else {
      conversations.value = allConvs
      currentConversationId.value = allConvs[0].id
      messages.value = await loadMessagesForConversation(allConvs[0].id)
    }
  } catch (error) {
    logger.error('Failed to load conversations from IndexedDB, falling back to localStorage:', error)
    useIndexedDB = false

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

initConversations()

const saveMessageToDb = (message) => {
  const plainMessage = {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
    model: message.model,
    conversationId: message.conversationId
  }

  queueDb(async () => {
    if (useIndexedDB) {
      try {
        await db.messages.put(plainMessage)
        return
      } catch (error) {
        logger.error('Failed to save message to IndexedDB, falling back to localStorage:', error)
        useIndexedDB = false
      }
    }

    try {
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(messages.value))
    } catch (fallbackError) {
      logger.error('Failed to save to localStorage fallback:', fallbackError)
    }
  })
}

// Debounced touch: update conversation's updatedAt at most once per second
const touchTimers = new Map()
const touchConversation = (convId) => {
  if (touchTimers.has(convId)) return
  const timer = setTimeout(async () => {
    touchTimers.delete(convId)
    const now = Date.now()
    if (useIndexedDB) {
      try {
        await db.conversations.update(convId, { updatedAt: now })
      } catch (error) {
        logger.error('Failed to touch conversation:', error)
      }
    }
    // Re-sort in memory (most recent first)
    const updated = conversations.value.map(c =>
      c.id === convId ? { ...c, updatedAt: now } : c
    )
    updated.sort((a, b) => b.updatedAt - a.updatedAt)
    conversations.value = updated
  }, 1000)
  touchTimers.set(convId, timer)
}

/**
 * Scroll a container to its bottom (used by ChatView)
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

export function useChat() {
  /**
   * Create a new conversation and switch to it
   */
  const createNewConversation = async (title = '') => {
    // If the current conversation is already empty, just stay on it
    if (messages.value.length === 0) return

    const now = Date.now()
    let newId = null

    if (useIndexedDB) {
      try {
        newId = await db.conversations.add({ title, createdAt: now, updatedAt: now })
      } catch (error) {
        logger.error('Failed to create conversation in IndexedDB:', error)
      }
    }

    // Fallback: use a random string to avoid colliding with Dexie auto-increment IDs
    if (newId === null) {
      newId = `local-${crypto.randomUUID()}`
    }

    conversations.value = [{ id: newId, title, createdAt: now, updatedAt: now }, ...conversations.value]
    currentConversationId.value = newId
    messages.value = []
  }

  /**
   * Switch to a different conversation — load first, then swap atomically to avoid empty flash
   */
  const switchConversation = async (convId) => {
    if (convId === currentConversationId.value) return

    // Drop the current conversation if it's empty before switching away
    const leavingId = currentConversationId.value
    if (leavingId && messages.value.length === 0) {
      conversations.value = conversations.value.filter(c => c.id !== leavingId)
      queueDb(async () => {
        if (useIndexedDB) {
          try {
            await db.conversations.delete(leavingId)
          } catch (error) {
            logger.error('Failed to delete empty conversation:', error)
          }
        }
      })
    }

    const loaded = await loadMessagesForConversation(convId)
    currentConversationId.value = convId
    messages.value = loaded
  }

  /**
   * Delete a conversation and its messages
   */
  const deleteConversation = async (convId) => {
    await queueDb(async () => {
      if (useIndexedDB) {
        try {
          await db.messages.where('conversationId').equals(convId).delete()
          await db.conversations.delete(convId)
        } catch (error) {
          logger.error('Failed to delete conversation from IndexedDB:', error)
        }
      }
    })

    const remaining = conversations.value.filter(c => c.id !== convId)
    conversations.value = remaining

    // If we deleted the active conversation, switch to another or create new
    if (currentConversationId.value === convId) {
      if (remaining.length > 0) {
        await switchConversation(remaining[0].id)
      } else {
        await createNewConversation('')
      }
    }
  }

  /**
   * Set the title of a conversation
   */
  const setConversationTitle = (convId, title) => {
    conversations.value = conversations.value.map(c =>
      c.id === convId ? { ...c, title } : c
    )
    queueDb(async () => {
      if (useIndexedDB) {
        try {
          await db.conversations.update(convId, { title })
        } catch (error) {
          logger.error('Failed to update conversation title:', error)
        }
      }
    })
  }

  /**
   * Add a message to the chat
   * Guard against null conversationId during slow DB init
   */
  const addMessage = (role, content, model = null) => {
    const convId = currentConversationId.value
    if (!convId) {
      logger.error('addMessage called before conversation was initialized')
      return null
    }

    const message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: Date.now(),
      model,
      conversationId: convId
    }
    messages.value = [...messages.value, message]
    saveMessageToDb(message)
    touchConversation(convId)
    return message
  }

  const addUserMessage = (content) => addMessage('user', content)

  const addAssistantMessage = (content, model = null) => addMessage('assistant', content, model)

  /**
   * Remove the last message (for cancellation scenarios)
   */
  const removeLastMessage = async () => {
    if (messages.value.length === 0) return

    const lastMessage = messages.value[messages.value.length - 1]
    messages.value = messages.value.slice(0, -1)

    queueDb(async () => {
      if (useIndexedDB) {
        try {
          await db.messages.delete(lastMessage.id)
          return
        } catch (error) {
          logger.error('Failed to delete message from IndexedDB:', error)
          useIndexedDB = false
        }
      }

      try {
        localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(messages.value))
      } catch (fallbackError) {
        logger.error('Failed to update localStorage fallback:', fallbackError)
      }
    })

    return pendingDbOperations
  }

  /**
   * Clear all messages in the current conversation
   */
  const clearMessages = async () => {
    const convId = currentConversationId.value
    messages.value = []

    // Reset title and updatedAt in memory so the sidebar reflects the cleared state
    const now = Date.now()
    conversations.value = conversations.value.map(c =>
      c.id === convId ? { ...c, title: '', updatedAt: now } : c
    )

    queueDb(async () => {
      if (useIndexedDB && convId) {
        try {
          await db.messages.where('conversationId').equals(convId).delete()
          await db.conversations.update(convId, { title: '', updatedAt: now })
          return
        } catch (error) {
          logger.error('Failed to clear messages from IndexedDB:', error)
          useIndexedDB = false
        }
      }

      if (!useIndexedDB) {
        try {
          localStorage.removeItem(FALLBACK_STORAGE_KEY)
        } catch (error) {
          logger.error('Failed to clear localStorage fallback:', error)
        }
      }
    })

    return pendingDbOperations
  }

  return {
    messages,
    hasMessages,
    conversations,
    currentConversationId,
    addUserMessage,
    addAssistantMessage,
    removeLastMessage,
    clearMessages,
    scrollToBottom,
    createNewConversation,
    switchConversation,
    deleteConversation,
    setConversationTitle
  }
}
