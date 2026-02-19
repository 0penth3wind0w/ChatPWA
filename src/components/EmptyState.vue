<script setup>
// Empty state component for when no messages exist
</script>

<template>
  <div class="flex items-center justify-center w-full py-16">
    <div class="flex flex-col items-center gap-3 text-center px-8">
      <!-- Icon -->
      <div class="w-14 h-14 bg-bg-elevated rounded-full flex items-center justify-center mb-2">
        <svg class="w-6 h-6 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
        </svg>
      </div>

      <!-- Title -->
      <h3 class="text-base font-semibold text-text-primary">
        Start a Conversation
      </h3>

      <!-- Description -->
      <p class="text-sm text-text-secondary leading-relaxed max-w-[240px]">
        Type a message below to begin chatting with your AI assistant
      </p>
    </div>
  </div>
</template>
