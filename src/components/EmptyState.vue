<script setup>
// Empty state component for when no messages exist
</script>

<template>
  <div class="flex items-center justify-center w-full py-16">
    <div class="flex flex-col items-center gap-4 text-center px-8 animate-fade-in">
      <!-- Icon -->
      <div class="w-16 h-16 bg-gradient-to-br from-light-green to-forest-green/20 rounded-2xl flex items-center justify-center mb-2 shadow-soft">
        <svg class="w-8 h-8 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
        </svg>
      </div>

      <!-- Title -->
      <h3 class="text-lg font-semibold text-text-primary">
        Start a Conversation
      </h3>

      <!-- Description -->
      <p class="text-sm text-text-secondary leading-relaxed max-w-[300px]">
        Type a message below to begin chatting with your AI assistant
      </p>

      <!-- Tips -->
      <div class="mt-2 p-4 bg-bg-surface border border-border-subtle rounded-2xl max-w-[300px] shadow-soft">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-light-green rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="text-left flex-1">
            <p class="text-xs font-semibold text-text-secondary mb-1">Quick Tip</p>
            <p class="text-xs text-text-tertiary leading-relaxed">
              Use <code class="bg-bg-elevated px-1.5 py-0.5 rounded text-forest-green font-medium">/image</code> to generate images
            </p>
            <p class="text-xs text-text-tertiary mt-1.5 font-mono bg-bg-elevated px-2 py-1 rounded">
              /image a sunset over mountains
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
