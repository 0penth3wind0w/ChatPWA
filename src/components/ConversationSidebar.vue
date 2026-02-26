<script setup>
import { useI18n } from 'vue-i18n'
import { useChat } from '../composables/useChat.js'

const props = defineProps({
  isOpen: Boolean
})
const emit = defineEmits(['close'])

const { t } = useI18n()
const { conversations, currentConversationId, hasMessages, createNewConversation, switchConversation, deleteConversation } = useChat()

const formatTime = (ts) => {
  if (!ts) return ''
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return t('sidebar.timeJustNow')
  if (diffMins < 60) return t('sidebar.timeMinutesAgo', { n: diffMins })
  if (diffHours < 24) return t('sidebar.timeHoursAgo', { n: diffHours })
  if (diffDays < 7) return t('sidebar.timeDaysAgo', { n: diffDays })
  return date.toLocaleDateString()
}

const handleNewChat = async () => {
  await createNewConversation(t('sidebar.newChat'))
  emit('close')
}

const handleSwitch = async (convId) => {
  await switchConversation(convId)
  emit('close')
}

const handleDelete = async (convId) => {
  if (!confirm(t('sidebar.deleteConfirm'))) return
  await deleteConversation(convId)
}

const handleKeydown = (e) => {
  if (e.key === 'Escape') emit('close')
}

const formatTitle = (conv) => {
  const title = conv.title || t('sidebar.untitled')
  return title.length > 32 ? title.slice(0, 32) + '…' : title
}
</script>

<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-text-primary/20 z-30"
      aria-hidden="true"
      @click="$emit('close')"
    />
  </Transition>

  <!-- Sidebar panel -->
  <Transition name="slide-left">
    <aside
      v-if="isOpen"
      class="fixed left-0 top-0 bottom-0 w-72 z-40 flex flex-col bg-bg-primary border-r border-border-subtle shadow-elevated"
      :aria-label="t('sidebar.conversations')"
      role="navigation"
      @keydown="handleKeydown"
    >
      <!-- Header -->
      <div class="flex-shrink-0 px-6 pt-6 pb-4">
        <h2 class="text-2xl font-semibold text-text-primary -tracking-tight">
          {{ t('sidebar.title') }}
        </h2>
      </div>

      <!-- Conversation list -->
      <div class="flex-1 overflow-y-auto px-6 min-h-0 pt-2">
        <ul role="list" class="flex flex-col gap-1">
          <li
            v-for="conv in conversations"
            :key="conv.id"
            class="group relative"
          >
            <!-- Row button -->
            <button
              @click="handleSwitch(conv.id)"
              :aria-current="conv.id === currentConversationId ? 'page' : undefined"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors pr-11"
              :class="conv.id === currentConversationId
                ? 'bg-bg-surface shadow-soft text-text-primary'
                : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'"
            >
              <!-- Chat bubble icon -->
              <div
                class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                :class="conv.id === currentConversationId ? 'bg-light-green' : 'bg-bg-elevated'"
                aria-hidden="true"
              >
                <svg
                  class="w-4 h-4 transition-colors"
                  :class="conv.id === currentConversationId ? 'text-forest-green' : 'text-text-tertiary'"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>

              <!-- Title + timestamp -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">
                  {{ formatTitle(conv) }}
                </p>
                <p class="text-xs text-text-tertiary mt-0.5">{{ formatTime(conv.updatedAt) }}</p>
              </div>
            </button>

            <!-- Delete button — sibling of the row button, overlaid on the right -->
            <button
              @click="handleDelete(conv.id)"
              :aria-label="t('sidebar.deleteConversation', { title: conv.title || t('sidebar.untitled') })"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-warm-red hover:bg-warm-red/10 transition-all"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </li>
        </ul>
      </div>

      <!-- New Chat button -->
      <div class="flex-shrink-0 px-6 pb-8 pt-4">
        <button
          @click="handleNewChat"
          :disabled="!hasMessages"
          class="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          {{ t('sidebar.newChat') }}
        </button>
      </div>
    </aside>
  </Transition>
</template>
