import { ref, computed, nextTick } from 'vue'

export function useChat() {
  const messages = ref([])
  const isLoading = ref(false)

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
   * Clear all messages
   */
  const clearMessages = () => {
    messages.value = []
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
    clearMessages,
    getConversationHistory,
    scrollToBottom
  }
}
