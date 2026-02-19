<script setup>
import { ref, watch } from 'vue'
import ChatMessage from '../components/ChatMessage.vue'
import MessageInput from '../components/MessageInput.vue'
import EmptyState from '../components/EmptyState.vue'
import { useChat } from '../composables/useChat.js'

const emit = defineEmits(['navigate'])

const { messages, hasMessages, addUserMessage, addAssistantMessage, scrollToBottom } = useChat()
const messagesContainer = ref(null)

const handleSettings = () => {
  emit('navigate', 'settings')
}

const handleSendMessage = (content) => {
  // Add user message
  addUserMessage(content)

  // Scroll to bottom after user message
  scrollToBottom(messagesContainer)

  // Simulate AI response (will be replaced with actual API call in Phase 4)
  setTimeout(() => {
    addAssistantMessage('This is a placeholder response. API integration will be implemented in Phase 4.')
    scrollToBottom(messagesContainer)
  }, 500)
}

// Watch for new messages and auto-scroll
watch(messages, () => {
  scrollToBottom(messagesContainer)
}, { deep: true })
</script>

<template>
  <div class="min-h-screen w-full flex flex-col bg-bg-primary">
    <!-- Content Wrapper -->
    <div class="flex-1 flex flex-col px-6 gap-5">
      <!-- Header -->
      <div class="flex items-center justify-between w-full">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-semibold text-text-primary -tracking-tight">
            AI Chat
          </h1>
          <p class="text-sm font-medium text-forest-green">
            Connected
          </p>
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

      <!-- Messages Container -->
      <div
        ref="messagesContainer"
        class="flex-1 flex flex-col gap-4 overflow-y-auto pb-4"
      >
        <!-- Empty State -->
        <EmptyState v-if="!hasMessages" />

        <!-- Messages List -->
        <ChatMessage
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />
      </div>
    </div>

    <!-- Message Input (fixed at bottom) -->
    <MessageInput @send="handleSendMessage" />
  </div>
</template>
